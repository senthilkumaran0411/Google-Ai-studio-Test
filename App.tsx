
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateContentFromUrl, analyzeCodeFromImage, clarifyConcept, extractTextFromImage, analyzeCodeFromText } from './services/geminiService';
import type { QuizQuestion, GeneratedContent, UserAnswer, QuizResult, CodeAnalysisResult, ClarifiedConcept } from './types';
import { QuestionType } from './types';

// --- Icon Components ---

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0-4.17 19.82" /><path d="M12 2a10 10 0 0 1 7.17 3.82" /><path d="M12 2a10 10 0 0 0-7.17 3.82" /><path d="M12 22a10 10 0 0 1-4.17-19.82" /><path d="M12 22a10 10 0 0 0 7.17-16.18" /><path d="M12 22a10 10 0 0 1-7.17-16.18" /><path d="M12 4a8 8 0 0 0-3.2 15.3" /><path d="M12 4a8 8 0 0 1 5.2 13.3" /><path d="M12 4a8 8 0 0 0-5.2 13.3" /><path d="M12 20a8 8 0 0 1-3.2-15.3" /><path d="M12 20a8 8 0 0 0 5.2-13.3" /><path d="M12 20a8 8 0 0 1-5.2-13.3" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
    </svg>
);

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9.2 18 8A6 6 0 0 0 6 8c0 1.2.3 2.2 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const FeatherIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
);


const Spinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <svg className="animate-spin h-12 w-12 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-300">{message}</p>
        <p className="text-sm text-gray-400 mt-1">AI is working its magic...</p>
    </div>
);

const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const CustomizationOption: React.FC<{
    label: string;
    options: (string | number)[];
    selectedValue: string | number;
    onSelect: (value: any) => void;
    'aria-label': string;
}> = ({ label, options, selectedValue, onSelect, 'aria-label': ariaLabel }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg" role="group" aria-label={ariaLabel}>
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className={`flex-1 text-sm font-semibold py-2 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
                        selectedValue === option
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-pressed={selectedValue === option}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);


// --- Main App Component ---
const App: React.FC = () => {
    type VideoAppState = 'IDLE' | 'LOADING' | 'SHOWING_RESULTS' | 'ERROR';
    type CodeAppState = 'IDLE' | 'CAMERA_OPEN' | 'CAPTURED' | 'ANALYZING' | 'SHOWING_RESULT' | 'ERROR';
    type ConceptAppState = 'IDLE' | 'CAMERA_OPEN' | 'EXTRACTING_TEXT' | 'LOADING' | 'SHOWING_RESULT' | 'ERROR';
    type ActiveTab = 'video' | 'code' | 'concept';
    
    // --- Global State ---
    const [activeTab, setActiveTab] = useState<ActiveTab>('video');

    // --- Video Analyzer State ---
    const [videoAppState, setVideoAppState] = useState<VideoAppState>('IDLE');
    const [youtubeUrl, setYoutubeUrl] = useState<string>('');
    const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>("Initializing...");
    const [quizNumQuestions, setQuizNumQuestions] = useState<number>(5);
    const [quizDifficulty, setQuizDifficulty] = useState<string>('Medium');
    const [quizTypes, setQuizTypes] = useState<string>('Mix');

    // --- Code Analyzer State ---
    const [codeAppState, setCodeAppState] = useState<CodeAppState>('IDLE');
    const [codeAnalysisResult, setCodeAnalysisResult] = useState<CodeAnalysisResult | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [pastedCode, setPastedCode] = useState<string>('');
    const [codeError, setCodeError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // --- Concept Clarifier State ---
    const [conceptAppState, setConceptAppState] = useState<ConceptAppState>('IDLE');
    const [conceptInput, setConceptInput] = useState<string>('');
    const [clarifiedConcept, setClarifiedConcept] = useState<ClarifiedConcept | null>(null);
    const [conceptError, setConceptError] = useState<string | null>(null);
    const [explanationStyle, setExplanationStyle] = useState<string>('Simple');


    // --- Video Analyzer Logic ---
    const handleGenerateClick = useCallback(async () => {
        const videoId = getYoutubeVideoId(youtubeUrl);
        if (!videoId) {
            setVideoError("Please enter a valid YouTube video URL.");
            setVideoAppState('ERROR');
            return;
        }

        setVideoAppState('LOADING');
        setVideoError(null);
        setQuizResult(null);
        setUserAnswers({});
        setYoutubeVideoId(videoId);
        
        const messages = ["Accessing video information...", "Analyzing content with Gemini...", "Building your summary & quiz..."];
        let messageIndex = 0;
        const intervalId = setInterval(() => {
            setLoadingMessage(messages[messageIndex]);
            messageIndex = (messageIndex + 1) % messages.length;
        }, 3000);

        try {
            const quizOptions = {
                numQuestions: quizNumQuestions,
                difficulty: quizDifficulty,
                questionTypes: quizTypes,
            };
            const result = await generateContentFromUrl(youtubeUrl, quizOptions);
            setGeneratedContent(result);
            setVideoAppState('SHOWING_RESULTS');
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : "An unknown error occurred.");
            setVideoAppState('ERROR');
        } finally {
            clearInterval(intervalId);
        }
    }, [youtubeUrl, quizNumQuestions, quizDifficulty, quizTypes]);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleSubmitQuiz = () => {
        if (!generatedContent) return;

        let score = 0;
        const results = generatedContent.quiz.map((q, index) => {
            const userAnswer = userAnswers[index]?.trim() || "";
            const correctAnswer = q.answer;
            const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
            if (isCorrect) score++;
            return {
                question: q.question,
                userAnswer: userAnswer || "Not Answered",
                correctAnswer,
                isCorrect,
            };
        });

        setQuizResult({ score, total: generatedContent.quiz.length, results });
    };

    const handleResetVideo = () => {
        setVideoAppState('IDLE');
        setYoutubeUrl('');
        setYoutubeVideoId(null);
        setGeneratedContent(null);
        setUserAnswers({});
        setQuizResult(null);
        setVideoError(null);
    };

    // --- Code Analyzer Logic ---

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCodeAppState('CAMERA_OPEN');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCodeError("Could not access the camera. Please ensure permissions are granted.");
            setCodeAppState('ERROR');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const handleCaptureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                setCodeAppState('CAPTURED');
                stopCamera();
            }
        }
    }, [stopCamera]);

    const handleAnalyzeCodeImage = useCallback(async () => {
        if (!capturedImage) return;
        setCodeAppState('ANALYZING');
        setCodeError(null);
        try {
            // The result will be a base64 string, we need to remove the prefix
            const base64Data = capturedImage.split(',')[1];
            const result = await analyzeCodeFromImage(base64Data);
            setCodeAnalysisResult(result);
            setCodeAppState('SHOWING_RESULT');
        } catch (err) {
            setCodeError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
            setCodeAppState('ERROR');
        }
    }, [capturedImage]);

    const handleAnalyzePastedCode = useCallback(async () => {
        if (!pastedCode.trim()) return;
        setCodeAppState('ANALYZING');
        setCodeError(null);
        try {
            const result = await analyzeCodeFromText(pastedCode);
            setCodeAnalysisResult(result);
            setCodeAppState('SHOWING_RESULT');
        } catch (err) {
            setCodeError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
            setCodeAppState('ERROR');
        }
    }, [pastedCode]);

    const handleResetCode = () => {
        stopCamera();
        setCodeAppState('IDLE');
        setCapturedImage(null);
        setCodeAnalysisResult(null);
        setCodeError(null);
        setPastedCode('');
    };

    // --- Concept Clarifier Logic ---
    const startClarifierCamera = useCallback(async () => {
        setConceptError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setConceptAppState('CAMERA_OPEN');
        } catch (err) {
            console.error("Error accessing camera for clarifier:", err);
            setConceptError("Could not access the camera. Please ensure permissions are granted.");
            setConceptAppState('ERROR');
        }
    }, []);

    const handleCaptureAndExtractText = useCallback(async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                stopCamera();
                
                setConceptAppState('EXTRACTING_TEXT');
                setConceptError(null);

                try {
                    const base64Data = dataUrl.split(',')[1];
                    const extractedText = await extractTextFromImage(base64Data);
                    setConceptInput(extractedText);
                    setConceptAppState('IDLE');
                } catch (err) {
                    setConceptError(err instanceof Error ? err.message : "Failed to extract text from image.");
                    setConceptAppState('ERROR');
                }
            }
        }
    }, [stopCamera]);


    const handleClarifyConcept = useCallback(async () => {
        if (!conceptInput.trim()) {
            setConceptError("Please enter a concept or text to clarify.");
            setConceptAppState('ERROR');
            return;
        }
        setConceptAppState('LOADING');
        setConceptError(null);
        try {
            const result = await clarifyConcept(conceptInput, explanationStyle);
            setClarifiedConcept(result);
            setConceptAppState('SHOWING_RESULT');
        } catch (err) {
            setConceptError(err instanceof Error ? err.message : "An unknown error occurred.");
            setConceptAppState('ERROR');
        }
    }, [conceptInput, explanationStyle]);

    const handleResetConcept = () => {
        stopCamera();
        setConceptAppState('IDLE');
        setConceptInput('');
        setClarifiedConcept(null);
        setConceptError(null);
    };

    useEffect(() => {
        // Cleanup camera on component unmount
        return () => stopCamera();
    }, [stopCamera]);

    // --- RENDER FUNCTIONS ---
    
    const renderVideoAnalyzer = () => {
        switch (videoAppState) {
            case 'IDLE': return renderVideoIdleState();
            case 'LOADING': return <Spinner message={loadingMessage} />;
            case 'SHOWING_RESULTS': return renderVideoResultsState();
            case 'ERROR': return renderErrorState(videoError, handleResetVideo);
            default: return null;
        }
    };
    
    const renderVideoIdleState = () => (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
                <div className="text-center">
                    <LinkIcon className="w-16 h-16 mx-auto text-indigo-400" />
                    <h2 className="mt-4 text-2xl font-bold text-white">Analyze from YouTube</h2>
                    <p className="mt-2 text-gray-400">Paste a video link to get a summary and quiz.</p>
                </div>
                
                <div>
                    <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300 mb-2">YouTube Video URL</label>
                    <div className="relative">
                        <LinkIcon className="pointer-events-none absolute top-1/2 transform -translate-y-1/2 left-3 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            id="youtube-url"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 pl-10 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="e.g., https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-4">
                     <h3 className="text-lg font-semibold text-white -mb-2 text-center">Quiz Options</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CustomizationOption label="Questions" options={[5, 10]} selectedValue={quizNumQuestions} onSelect={setQuizNumQuestions} aria-label="Number of questions" />
                        <CustomizationOption label="Difficulty" options={['Easy', 'Medium', 'Hard']} selectedValue={quizDifficulty} onSelect={setQuizDifficulty} aria-label="Quiz difficulty" />
                        <CustomizationOption label="Type" options={['Mix', 'Multiple Choice', 'Short Answer']} selectedValue={quizTypes} onSelect={setQuizTypes} aria-label="Question types"/>
                     </div>
                </div>

                <button
                    onClick={handleGenerateClick}
                    disabled={!youtubeUrl.trim()}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <BrainCircuitIcon className="w-6 h-6 mr-3" />
                    Generate Summary & Quiz
                </button>
            </div>
        </div>
    );

    const renderVideoResultsState = () => (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
            <button onClick={handleResetVideo} className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Start Over
            </button>
            
            {youtubeVideoId && (
                <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                     <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen>
                    </iframe>
                </div>
            )}
            
            {generatedContent && (
                <>
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-4">AI Summary</h2>
                        <div className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed whitespace-pre-wrap">
                           {generatedContent.summary}
                        </div>
                    </div>

                    {generatedContent.keyTakeaways?.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <LightbulbIcon className="w-6 h-6 mr-3 text-yellow-400" />
                                Key Takeaways
                            </h2>
                            <ul className="space-y-3">
                                {generatedContent.keyTakeaways.map((takeaway, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-gray-300">{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {generatedContent.vocabulary?.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <BookOpenIcon className="w-6 h-6 mr-3 text-cyan-400" />
                                Key Vocabulary
                            </h2>
                            <dl className="space-y-4">
                                {generatedContent.vocabulary.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4">
                                        <dt className="font-semibold text-gray-200 md:col-span-1">{item.term}</dt>
                                        <dd className="text-gray-400 md:col-span-3">{item.definition}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                    
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Quiz</h2>
                            {quizResult && (
                                <div className="text-right">
                                    <p className="font-bold text-xl text-indigo-400">Score: {quizResult.score} / {quizResult.total}</p>
                                    <p className="text-sm text-gray-400">{((quizResult.score / quizResult.total) * 100).toFixed(0)}%</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {generatedContent.quiz.map((q, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${
                                    quizResult ? (quizResult.results[index].isCorrect ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20') : 'border-gray-700'
                                }`}>
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-200 mb-3">{index + 1}. {q.question}</p>
                                        {quizResult && (
                                            quizResult.results[index].isCorrect ? 
                                            <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-4" /> : 
                                            <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 ml-4" />
                                        )}
                                    </div>
                                    
                                    {q.type === QuestionType.MultipleChoice && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((option, optIndex) => (
                                                <label key={optIndex} className={`block p-3 rounded-md cursor-pointer transition-colors ${
                                                    quizResult ? 
                                                        (option === q.answer ? 'bg-green-800/30' : (userAnswers[index] === option ? 'bg-red-800/30' : 'bg-gray-700/50'))
                                                        : 'bg-gray-700/50 hover:bg-gray-600/50'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${index}`}
                                                        value={option}
                                                        checked={userAnswers[index] === option}
                                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                        disabled={!!quizResult}
                                                        className="mr-3 accent-indigo-500 disabled:accent-gray-500"
                                                    />
                                                    <span className={`${
                                                        quizResult && option === q.answer ? 'text-green-300' : 
                                                        (quizResult && userAnswers[index] === option ? 'text-red-300' : 'text-gray-300')
                                                    }`}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === QuestionType.ShortAnswer && (
                                        <input
                                            type="text"
                                            value={userAnswers[index] || ''}
                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            disabled={!!quizResult}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-800/50"
                                        />
                                    )}

                                    {quizResult && !quizResult.results[index].isCorrect && (
                                        <div className="mt-3 p-2 bg-gray-900/50 rounded-md text-sm">
                                            <span className="font-semibold text-green-400">Correct Answer: </span>
                                            <span className="text-green-300">{q.answer}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            {quizResult ? (
                                <button
                                    onClick={() => { setQuizResult(null); setUserAnswers({}); }}
                                    className="bg-gray-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                    Try Again
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitQuiz}
                                    className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
    
    const renderCodeAnalyzer = () => {
        switch (codeAppState) {
            case 'IDLE':
                return (
                     <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-6">
                            <div className="text-center">
                                <CodeIcon className="w-16 h-16 mx-auto text-indigo-400" />
                                <h2 className="mt-4 text-2xl font-bold text-white">Code Complexity Analyzer</h2>
                                <p className="mt-2 text-gray-400">Paste your code or scan it with your camera.</p>
                            </div>
                            
                            <div>
                                <label htmlFor="code-input" className="block text-sm font-medium text-gray-300 mb-2">Paste Code Here</label>
                                <textarea
                                    id="code-input"
                                    rows={8}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 font-mono text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    placeholder="function example(arr) { ... }"
                                    value={pastedCode}
                                    onChange={(e) => setPastedCode(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAnalyzePastedCode}
                                disabled={!pastedCode.trim()}
                                className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <BrainCircuitIcon className="w-6 h-6 mr-3" />
                                Analyze Pasted Code
                            </button>

                            <div className="flex items-center">
                                <div className="flex-grow border-t border-gray-600"></div>
                                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                                <div className="flex-grow border-t border-gray-600"></div>
                            </div>
                            
                            <button
                                onClick={startCamera}
                                className="w-full flex items-center justify-center bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all"
                            >
                                <CameraIcon className="w-6 h-6 mr-3" />
                                Scan with Camera
                            </button>
                        </div>
                    </div>
                );
            case 'CAMERA_OPEN':
                return (
                    <div className="w-full max-w-3xl mx-auto p-4 flex flex-col items-center space-y-4">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-gray-700 shadow-lg" />
                        <div className="flex space-x-4">
                            <button onClick={handleCaptureImage} className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">Capture</button>
                            <button onClick={handleResetCode} className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                );
            case 'CAPTURED':
                return (
                    <div className="w-full max-w-3xl mx-auto p-4 flex flex-col items-center space-y-4">
                        <h2 className="text-xl font-bold text-white">Preview</h2>
                        <img src={capturedImage} alt="Captured code" className="rounded-xl border-2 border-indigo-500 shadow-lg max-w-full" />
                         <div className="flex space-x-4">
                            <button onClick={handleAnalyzeCodeImage} className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">Analyze Code</button>
                            <button onClick={startCamera} className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-colors">Retake</button>
                        </div>
                    </div>
                );
            case 'ANALYZING':
                return <Spinner message="Analyzing code..." />;
            case 'SHOWING_RESULT':
                return codeAnalysisResult && (
                    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
                        <button onClick={handleResetCode} className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                            <ArrowLeftIcon className="w-5 h-5 mr-2" />
                            Analyze Another
                        </button>
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center"><CodeIcon className="w-6 h-6 mr-3 text-cyan-400"/> Recognized Code</h3>
                                <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 overflow-x-auto text-sm"><code>{codeAnalysisResult.recognizedCode}</code></pre>
                            </div>
                             <div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center"><ClockIcon className="w-6 h-6 mr-3 text-red-400"/> Time Complexity</h3>
                                <p className="text-2xl font-mono bg-gray-900 inline-block px-3 py-1 rounded-md text-red-300">{codeAnalysisResult.timeComplexity}</p>
                                <p className="text-gray-400 mt-2">{codeAnalysisResult.explanation}</p>
                            </div>
                             <div>
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center"><SparklesIcon className="w-6 h-6 mr-3 text-yellow-400"/> Recommendations</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{codeAnalysisResult.recommendations}</p>
                            </div>
                             {codeAnalysisResult.optimizedCode && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center"><ZapIcon className="w-6 h-6 mr-3 text-green-400"/> Optimized Code</h3>
                                    <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 overflow-x-auto text-sm"><code>{codeAnalysisResult.optimizedCode}</code></pre>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'ERROR':
                return renderErrorState(codeError, handleResetCode);
        }
    }

    const renderConceptClarifier = () => {
        switch (conceptAppState) {
            case 'IDLE': return renderConceptIdleState();
            case 'CAMERA_OPEN': 
                return (
                    <div className="w-full max-w-3xl mx-auto p-4 flex flex-col items-center space-y-4">
                        <p className="text-gray-300 mb-2">Position the text within the frame and capture.</p>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-gray-700 shadow-lg" />
                        <div className="flex space-x-4">
                            <button onClick={handleCaptureAndExtractText} className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">Capture & Extract</button>
                            <button onClick={handleResetConcept} className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                );
            case 'EXTRACTING_TEXT': return <Spinner message="Extracting text from image..." />;
            case 'LOADING': return <Spinner message="Clarifying concept..." />;
            case 'SHOWING_RESULT': return renderConceptResultsState();
            case 'ERROR': return renderErrorState(conceptError, handleResetConcept);
            default: return null;
        }
    };

    const renderConceptIdleState = () => (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
                <div className="text-center">
                    <FeatherIcon className="w-16 h-16 mx-auto text-indigo-400" />
                    <h2 className="mt-4 text-2xl font-bold text-white">Concept Clarifier</h2>
                    <p className="mt-2 text-gray-400">Break down complex topics into simple explanations.</p>
                </div>
                
                <div>
                    <label htmlFor="concept-input" className="block text-sm font-medium text-gray-300 mb-2">Concept or Text</label>
                    <div className="relative">
                        <textarea
                            id="concept-input"
                            rows={6}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 pr-14 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="Paste text or scan it with the camera..."
                            value={conceptInput}
                            onChange={(e) => setConceptInput(e.target.value)}
                        />
                        <button
                            onClick={startClarifierCamera}
                            className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                            aria-label="Scan text with camera"
                            title="Scan text with camera"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-4">
                    <CustomizationOption 
                        label="Explanation Style" 
                        options={['Simple', 'Detailed', 'With an Analogy']} 
                        selectedValue={explanationStyle} 
                        onSelect={setExplanationStyle} 
                        aria-label="Explanation style"
                    />
                </div>

                <button
                    onClick={handleClarifyConcept}
                    disabled={!conceptInput.trim()}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <SparklesIcon className="w-6 h-6 mr-3" />
                    Clarify
                </button>
            </div>
        </div>
    );
    
    const renderConceptResultsState = () => (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
            <button onClick={handleResetConcept} className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Start Over
            </button>
            
            {clarifiedConcept && (
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 space-y-6">
                    <h2 className="text-3xl font-bold text-white text-center">{clarifiedConcept.title}</h2>
                    
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center"><FeatherIcon className="w-6 h-6 mr-3 text-cyan-400"/> Simplified Explanation</h3>
                        <div className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed whitespace-pre-wrap">
                            {clarifiedConcept.simplifiedExplanation}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center"><LightbulbIcon className="w-6 h-6 mr-3 text-yellow-400"/> Analogy</h3>
                        <p className="text-gray-300 italic border-l-4 border-yellow-400 pl-4 py-2">
                           {clarifiedConcept.analogy}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderErrorState = (error: string | null, onReset: () => void) => (
        <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-lg max-w-md mx-auto">
            <XCircleIcon className="w-12 h-12 mx-auto text-red-400" />
            <h2 className="mt-4 text-xl font-bold text-white">An Error Occurred</h2>
            <p className="mt-2 text-red-300">{error}</p>
            <button onClick={onReset} className="mt-6 bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700">
                Try Again
            </button>
        </div>
    );

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'video': return renderVideoAnalyzer();
            case 'code': return renderCodeAnalyzer();
            case 'concept': return renderConceptClarifier();
            default: return null;
        }
    }

    return (
        <div className="min-h-screen font-sans flex flex-col items-center py-6 text-gray-100">
            <header className="w-full max-w-4xl mx-auto px-4 mb-6 text-center">
                <div className="flex items-center justify-center">
                    <BrainCircuitIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 mr-3" />
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                        EduVid <span className="text-indigo-400">AI</span>
                    </h1>
                </div>
                <p className="text-gray-400 mt-1">Your AI-Powered Learning Assistant</p>
            </header>
            
            <nav className="w-full max-w-xl mx-auto p-1 bg-gray-800 rounded-xl flex space-x-1 mb-6 border border-gray-700">
                <button 
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === 'video' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-pressed={activeTab === 'video'}
                >
                    Video Analyzer
                </button>
                 <button 
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-pressed={activeTab === 'code'}
                >
                    Code Analyzer
                </button>
                 <button 
                    onClick={() => setActiveTab('concept')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === 'concept' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-pressed={activeTab === 'concept'}
                >
                    Clarifier
                </button>
            </nav>

            <main className="w-full flex-grow flex items-center justify-center">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default App;
