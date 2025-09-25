import { useState, useEffect } from 'react';
import { Users, Lightbulb, MessageSquare, ArrowRight, RefreshCw, BookOpen } from 'lucide-react';

const Mentor = () => {
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get questions from localStorage when component mounts
    useEffect(() => {
        const storedQuestions = localStorage.getItem('interviewQuestions');
        if (storedQuestions) {
            try {
                const parsedQuestions = JSON.parse(storedQuestions);
                console.log('Loaded questions for mentor:', parsedQuestions);
                setQuestions(parsedQuestions);
            } catch (error) {
                console.error('Error parsing stored questions:', error);
            }
        }
    }, []);

    const refreshQuestions = () => {
        setIsLoading(true);
        setTimeout(() => {
            const storedQuestions = localStorage.getItem('interviewQuestions');
            if (storedQuestions) {
                try {
                    const parsedQuestions = JSON.parse(storedQuestions);
                    setQuestions(parsedQuestions);
                } catch (error) {
                    console.error('Error parsing stored questions:', error);
                }
            }
            setIsLoading(false);
        }, 500);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'bg-green-900 text-green-300 border-green-700';
            case 'medium':
                return 'bg-yellow-900 text-yellow-300 border-yellow-700';
            case 'hard':
                return 'bg-red-900 text-red-300 border-red-700';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'technical':
                return 'bg-blue-900 text-blue-300 border-blue-700';
            case 'behavioral':
                return 'bg-purple-900 text-purple-300 border-purple-700';
            case 'situational':
                return 'bg-indigo-900 text-indigo-300 border-indigo-700';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                    <h1 className="text-3xl font-bold text-white">Mentor Mode</h1>
                </div>
                <p className="text-slate-400 text-lg">
                    Get expert insights and follow-up guidance based on your interview preparation
                </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium">
                        {questions.length} Questions with Follow-up Ideas
                    </span>
                </div>
                <button
                    onClick={refreshQuestions}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading mentor insights...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && questions.length === 0 && (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Mentor Guidance Available</h3>
                    <p className="text-slate-400 mb-6">
                        Complete an interview practice session to get personalized follow-up insights
                    </p>
                    <button
                        onClick={() => window.location.href = '/interview-prep'}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Start Interview Practice
                    </button>
                </div>
            )}

            {/* Questions with Follow-up Ideas */}
            {!isLoading && questions.length > 0 && (
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={index} className="bg-[#101622] rounded-xl p-6 border border-slate-700">
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">{index + 1}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Question {index + 1}</h3>
                                        <div className="flex gap-2 mt-1">
                                            {question.difficulty && (
                                                <span className={`px-2 py-1 text-xs font-medium rounded border ${getDifficultyColor(question.difficulty)}`}>
                                                    {question.difficulty}
                                                </span>
                                            )}
                                            {question.type && (
                                                <span className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(question.type)}`}>
                                                    {question.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Question */}
                            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
                                <h4 className="text-slate-300 font-medium mb-2">Interview Question:</h4>
                                <p className="text-white">{question.question}</p>
                            </div>

                            {/* Follow-up Ideas */}
                            {question.follow_up_ideas && question.follow_up_ideas.length > 0 && (
                                <div>
                                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-yellow-400" />
                                        Mentor Follow-up Ideas ({question.follow_up_ideas.length})
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {question.follow_up_ideas.map((idea, ideaIndex) => (
                                            <div key={ideaIndex} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Lightbulb className="w-3 h-3 text-white" />
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">{idea}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No follow-up ideas */}
                            {(!question.follow_up_ideas || question.follow_up_ideas.length === 0) && (
                                <div className="text-center py-4 text-slate-500">
                                    <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No follow-up ideas available for this question</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Usage Tips */}
            {questions.length > 0 && (
                <div className="mt-12 bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        How to Use These Follow-up Ideas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-2">
                            <div className="font-medium text-blue-300">Deep Practice</div>
                            <p className="text-slate-400">Use these follow-up questions to practice more comprehensive responses</p>
                        </div>
                        <div className="space-y-2">
                            <div className="font-medium text-green-300">Preparation Strategy</div>
                            <p className="text-slate-400">Research and prepare examples that address these follow-up scenarios</p>
                        </div>
                        <div className="space-y-2">
                            <div className="font-medium text-purple-300">Interview Confidence</div>
                            <p className="text-slate-400">Anticipate these follow-ups during real interviews to show depth of knowledge</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mentor;