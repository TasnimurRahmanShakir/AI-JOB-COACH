
import { useState, useEffect, useContext } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import AuthContext from "../context/authContext";

// Demo data outside the component
let demoScores = [70, 75, 80, 78, 85, 82, 90];

export default function Overview() {
    const [scores, setScores] = useState(demoScores);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useContext(AuthContext);

    console.log("User in Overview:", user);    // Fetch latest scores on component mount and when user changes
    useEffect(() => {
        if (user && user.uid) {
            fetchLatestScores();
        }
    }, [user]);

    const fetchLatestScores = async () => {
        if (!user || !user.uid) return;

        setIsLoading(true);
        try {
            console.log("🔍 Fetching latest scores for user:", user.uid);
            const fetchResponse = await fetch(`http://localhost:5000/api/get-last-scores/${user.uid}`);

            if (fetchResponse.ok) {
                const data = await fetchResponse.json();
                console.log('✅ Fetched last 7 scores:', data.scores);

                if (data.scores && data.scores.length > 0) {
                    const realScores = data.scores.map(item => Math.round(item.overallScore));
                    // Fill with demo data if we have less than 7 scores
                    while (realScores.length < 7) {
                        realScores.unshift(demoScores[realScores.length]);
                    }
                    const updatedScores = realScores.slice(-7); // Keep only last 7
                    setScores(updatedScores);
                    console.log('📊 Updated scores:', updatedScores);
                } else {
                    console.log('📭 No scores found, using demo data');
                    setScores(demoScores);
                }
            } else {
                console.log('❌ Failed to fetch scores, using demo data');
                setScores(demoScores);
            }
        } catch (error) {
            console.error('❌ Error fetching scores:', error);
            setScores(demoScores);
        } finally {
            setIsLoading(false);
        }
    };



    const last7Scores = scores.map((score, i) => ({
        label: `${i + 1}`,
        score: Math.round(Math.min(score, 100)),
    }));



    return (
        <div className="mb-6">
            <h3 className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-2">
                Performance Metrics
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <button
                    onClick={fetchLatestScores}
                    disabled={isLoading}
                    className="ml-auto px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-xs rounded transition-colors"
                    title="Refresh scores"
                >
                    🔄
                </button>
            </h3>
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7Scores}>
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" domain={[0, 100]} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                        <Bar
                            dataKey="score"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}