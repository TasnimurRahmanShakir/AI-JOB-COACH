from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import whisper
import cv2
import numpy as np
import mediapipe as mp
from tempfile import NamedTemporaryFile
import os
import librosa
import subprocess
import httpx


app = FastAPI(title="Interview Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# --- Initialize models ---
audio_model = whisper.load_model("base")
mp_pose = mp.solutions.pose # type: ignore
mp_hands = mp.solutions.hands # type: ignore
TIMEOUT = httpx.Timeout(300.0, connect=60.0)  

# -------------------------------
# AUDIO TRANSCRIPTION ENDPOINT
# -------------------------------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), question: str = Form(...)) -> Dict:
    """
    Transcribe uploaded audio and return the original question.
    """
    print("file: ", file)
    content = await file.read()
    with NamedTemporaryFile(suffix=".mpga", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = audio_model.transcribe(tmp_path)
    finally:
        os.remove(tmp_path)

    print(result)
    payload =  {
        "question": question,
        "text": result["text"],
        "segments": result.get("segments", [])
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        external_resp = await client.post(
            "https://cmfqrpu3qmrwso3wt27f6tb0g.agent.a.smyth.ai/api/analyze_interview",
            json=payload
        )
    print(external_resp.json())
    return external_resp.json()


# -------------------------------
# VIDEO ANALYSIS ENDPOINT
# -------------------------------
@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...), question: str = Form(...)) -> Dict:
    """
    Analyze uploaded video: return question, transcription, audio & video metrics per segment.
    """
    if not file.content_type.startswith("video/"):  # type: ignore
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

    with NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await file.read())
        video_path = tmp.name

    audio_path = video_path.replace(".webm", ".wav")

    try:
        # Extract audio
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Transcribe audio
        result = audio_model.transcribe(audio_path)
        transcript = result["text"]
        segments = result.get("segments", [])

        # Load audio for metrics
        audio_data, sr = librosa.load(audio_path, sr=None)

        updated_segments: List[Dict] = []

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose_model, \
             mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.5) as hands_model:

            for seg in segments:
                start, end = seg["start"], seg["end"]  # type: ignore
                seg_text = seg["text"]  # type: ignore

                # Audio metrics
                start_sample = int(start * sr)
                end_sample = int(end * sr)
                seg_audio = audio_data[start_sample:end_sample]

                if len(seg_audio) > 0:
                    try:
                        pitch = librosa.yin(seg_audio, fmin=50, fmax=300)
                        avg_pitch = float(np.nanmean(pitch))
                    except:
                        avg_pitch = 0.0
                    energy = float(np.mean(librosa.feature.rms(y=seg_audio)))
                    speaking_rate = len(seg_text.split()) / (end - start) if (end - start) > 0 else 0
                else:
                    avg_pitch = 0.0
                    energy = 0.0
                    speaking_rate = 0.0

                # Video metrics
                mid_frame_idx = min(int(((start + end) / 2) * fps), total_frames - 1)
                cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame_idx)
                ret, frame = cap.read()

                if ret:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
                    frame_resized = cv2.resize(frame_rgb, (640, 360))

                    pose_results = pose_model.process(frame_resized)
                    hand_results = hands_model.process(frame_resized)

                    # Clarity score
                    if pose_results.pose_landmarks:
                        lm = pose_results.pose_landmarks.landmark
                        try:
                            left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
                            right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                            nose = lm[mp_pose.PoseLandmark.NOSE]
                            shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
                            head_y = nose.y
                            clarity_score = float(np.clip(1.0 - abs(head_y - shoulder_mid_y), 0, 1))
                        except:
                            clarity_score = 0.0
                    else:
                        clarity_score = 0.0

                    nervousness_score = len(hand_results.multi_hand_landmarks) if hand_results.multi_hand_landmarks else 0
                else:
                    clarity_score = 0.0
                    nervousness_score = 0

                updated_segments.append({
                    "start": start,
                    "end": end,
                    "text": seg_text,
                    "audio_metrics": {
                        "avg_pitch": avg_pitch,
                        "avg_energy": energy,
                        "speaking_rate": speaking_rate
                    },
                    "video_metrics": {
                        "clarity_score": clarity_score,
                        "nervousness_score": nervousness_score
                    }
                })

        cap.release()

        payload = {
            "question": question,
            "text": transcript,
            "segments": updated_segments
        }

        # Async external API call
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            external_resp = await client.post(
                "https://cmfqoqllcmkz5jxgtiyzucz7t.agent.a.smyth.ai/api/video-analyze",
                json=payload
            )

        return external_resp.json()  # Wrap in dict for FastAPI

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg error: {e.stderr.decode()}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)

# -------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
