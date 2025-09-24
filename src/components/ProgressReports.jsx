import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ProgressReports() {
  const interviewQuestions = [
    {
      question: "Tell me about yourself.",
      correctness: "8/10",
      confidence: "9/10",
      clarity: "7/10",
      pace: "6/10",
      nervousness: "3/10",
    },
    {
      question: "Describe a challenging project and how you handled it.",
      correctness: "7/10",
      confidence: "8/10",
      clarity: "8/10",
      pace: "7/10",
      nervousness: "4/10",
    },
    {
      question: "What are your strengths and weaknesses?",
      correctness: "9/10",
      confidence: "7/10",
      clarity: "9/10",
      pace: "8/10",
      nervousness: "2/10",
    },
    {
      question: "Where do you see yourself in 5 years?",
      correctness: "6/10",
      confidence: "6/10",
      clarity: "6/10",
      pace: "5/10",
      nervousness: "5/10",
    },
    {
      question: "Do you have any questions for us?",
      correctness: "10/10",
      confidence: "10/10",
      clarity: "10/10",
      pace: "9/10",
      nervousness: "1/10",
    },
  ];

  // ✅ Demo data: only scores
  const demoScores = [70, 75, 80, 78, 85, 82, 90];

  // Transform into chart-friendly format
  const last7Scores = demoScores.map((score, i) => ({
    label: `${i + 1}`, // Attempt number
    score,
  }));

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Interview Feedback
        </h1>
        <p className="text-slate-400">
          Review your performance from the mock interview on May 23, 2024.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Question Breakdown Table */}
        <div className="xl:col-span-2">
          <div className="bg-[#101622] rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                Question Breakdown
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Question
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Correctness
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Clarity
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Pace
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Nervousness
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interviewQuestions.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 text-white text-sm max-w-xs">
                        {item.question}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.correctness}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.confidence}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.clarity}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.pace}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.nervousness}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="space-y-6">
          <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6">
              Overall Performance
            </h2>

            {/* Last 7 Interview Scores Bar Chart */}
            <div className="mb-6">
              <h3 className="text-slate-300 text-sm font-medium mb-3">
                Your Last 7 Interview Scores
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Scores}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            

            {/* Call to Action */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-blue-400 font-medium mb-2">
                Need more practice?
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Start another mock interview to hone your skills.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Start New Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="mt-8">
        <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Report Summary
          </h2>
          <div className="text-slate-300 text-sm leading-relaxed space-y-4">
            <p>
              Your interview showcased a strong understanding of your background
              and experiences, particularly in areas of correctness and clarity.
              However, there's room to enhance your confidence and pace,
              especially in questions about your future goals. Managing
              nervousness is key to improving overall performance.
            </p>
            <p>
              Focus on practicing responses to common interview questions to
              build assurance and refine your delivery. Consider recording
              yourself to analyze your pace and body language. Great work on
              asking thoughtful questions at the end!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressReports;
