"use client";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const LandingPage: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeFeature, setActiveFeature] = useState("extract");
    const [codeIndex, setCodeIndex] = useState(0);
    const [showCursor, setShowCursor] = useState(true);
    const [isTyping, setIsTyping] = useState(true);
    const codeRef = useRef<HTMLDivElement>(null);

    const features = {
        extract: {
            title: "Extract",
            description: "Pull your LeetCode submissions automatically with our seamless integration",
            icon: "📥"
        },
        analyze: {
            title: "Analyze",
            description: "Get AI-powered insights that break down your solution approach and complexity",
            icon: "🔍"
        },
        organize: {
            title: "Organize",
            description: "Keep structured notes for every problem including intuition and algorithm steps",
            icon: "📋"
        },
        improve: {
            title: "Improve",
            description: "Learn from your mistakes and track progress with personalized recommendations",
            icon: "📈"
        },
    };

    // Animated code snippets
    const codeSnippets = [
        {
            title: "Generate Notes",
            code: `// LeetNotes automatically generates structured notes
function generateNotes(submission) {
  return {
    question: extractQuestion(submission),
    intuition: analyzeIntuition(submission),
    algorithm: describeAlgorithm(submission),
    mistakes: identifyMistakes(submission),
    solution: formatSolution(submission.code)
  };
}`
        },
        {
            title: "Analyze Mistakes",
            code: `// Identify and learn from your mistakes
function identifyMistakes(submissions) {
  const mistakes = [];
  const wrongSubmissions = submissions.filter(s => !s.accepted);
  
  for (const submission of wrongSubmissions) {
    mistakes.push({
      timestamp: submission.timestamp,
      code: submission.code,
      errorType: classifyError(submission.error),
      recommendation: suggestImprovement(submission)
    });
  }
  
  return mistakes;
}`
        },
        {
            title: "Track Progress",
            code: `// Visualize your improvement over time
function trackProgress(userData) {
  const progressData = {
    problems: analyzeProblemsCompleted(userData),
    skills: identifyStrongestSkills(userData),
    weaknesses: findAreasForImprovement(userData),
    streak: calculateCurrentStreak(userData),
    recommendation: suggestNextProblems(userData)
  };
  
  return generateProgressReport(progressData);
}`
        }
    ];

    useEffect(() => {
        setIsLoaded(true);
        const featureKeys = Object.keys(features);
        const featureInterval = setInterval(() => {
            const currentIndex = featureKeys.indexOf(activeFeature);
            const nextIndex = (currentIndex + 1) % featureKeys.length;
            setActiveFeature(featureKeys[nextIndex]);
        }, 5000);

        // Cursor blinking effect
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);

        // Code snippet rotation
        const codeInterval = setInterval(() => {
            setIsTyping(true);
            setCodeIndex((prev) => (prev + 1) % codeSnippets.length);
        }, 12000);

        return () => {
            clearInterval(featureInterval);
            clearInterval(cursorInterval);
            clearInterval(codeInterval);
        };
    }, [activeFeature]);

    useEffect(() => {
        if (isTyping) {
            const timer = setTimeout(() => {
                setIsTyping(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isTyping, codeIndex]);

    const handleCodeSectionHover = () => {
        if (codeRef.current) {
            codeRef.current.style.animation = "none";
        }
    };

    const handleCodeSectionLeave = () => {
        if (codeRef.current) {
            codeRef.current.style.animation = "pulse 6s infinite alternate";
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#27374D] to-[#526D82] p-4 sm:p-6 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-4xl"
            >
                <Card className="bg-[#DDE6ED] shadow-xl overflow-hidden border-0">
                    <CardHeader className="text-center pb-2 pt-8">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Badge className="mb-2 bg-[#27374D] hover:bg-[#27374D] px-3 py-1">
                                <span className="text-xs">AI-Powered</span>
                            </Badge>
                            <CardTitle className="text-6xl font-bold text-[#27374D] mb-3">
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    Leet
                                </motion.span>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    className="text-[#526D82]"
                                >
                                    Notes
                                </motion.span>
                            </CardTitle>
                        </motion.div>
                        <CardDescription className="text-xl text-[#526D82]">
                            Turn your LeetCode journey into structured learning
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center space-y-8 pt-4">
                        <div className="w-full">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                                className="relative w-full overflow-hidden bg-[#1E2A3B] rounded-lg shadow-xl"
                                style={{ height: "280px" }}
                                onMouseEnter={handleCodeSectionHover}
                                onMouseLeave={handleCodeSectionLeave}
                                ref={codeRef}
                            >
                                <div className="absolute top-0 left-0 right-0 bg-[#121920] p-2 px-4 flex justify-between items-center">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="text-sm text-gray-400 font-mono">
                                        {codeSnippets[codeIndex].title}.js
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        LeetNotes IDE
                                    </div>
                                </div>

                                <div className="absolute left-0 right-0 bottom-0 top-10 p-6 font-mono text-sm md:text-base overflow-x-auto">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={codeIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {isTyping ? (
                                                <TypewriterEffect
                                                    text={codeSnippets[codeIndex].code}
                                                    showCursor={showCursor}
                                                />
                                            ) : (
                                                <SyntaxHighlightedCode
                                                    code={codeSnippets[codeIndex].code}
                                                    showCursor={showCursor}
                                                />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="absolute bottom-4 right-4 flex space-x-2">
                                    {codeSnippets.map((_, idx) => (
                                        <motion.div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full ${idx === codeIndex ? "bg-blue-400" : "bg-gray-600"}`}
                                            whileHover={{ scale: 1.5 }}
                                            onClick={() => {
                                                setCodeIndex(idx);
                                                setIsTyping(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <Tabs
                            defaultValue="extract"
                            value={activeFeature}
                            onValueChange={setActiveFeature}
                            className="w-full"
                        >
                            <TabsList className="grid grid-cols-4 bg-[#9DB2BF]/20 p-1">
                                {Object.entries(features).map(([key, feature]) => (
                                    <TabsTrigger
                                        key={key}
                                        value={key}
                                        className="data-[state=active]:bg-[#526D82] data-[state=active]:text-white"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {feature.icon}
                                        </motion.div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {Object.entries(features).map(([key, feature]) => (
                                <TabsContent
                                    key={key}
                                    value={key}
                                    className="mt-2"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-[#27374D] p-5 rounded-lg text-[#DDE6ED] min-h-[120px]"
                                    >
                                        <h3 className="text-2xl font-bold mb-3 flex items-center">
                                            <motion.span
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                                                className="mr-2"
                                            >
                                                {feature.icon}
                                            </motion.span>
                                            {feature.title}
                                        </h3>
                                        <p className="text-[#9DB2BF]">{feature.description}</p>
                                    </motion.div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-6 pb-8 pt-4">
                        <p className="text-sm text-center text-[#27374D] max-w-lg mx-auto">
                            Powered by <span className="font-semibold">Gemini AI</span> to generate structured notes including intuition, algorithm explanations, and mistake analysis from your LeetCode solutions.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] text-lg px-8 py-6 h-auto relative overflow-hidden group"
                                >
                                    <Link to="/login?signup=true">
                                        Get Started
                                        <span className="absolute w-full h-full bg-white top-0 left-0 opacity-0 group-hover:opacity-20 transition-opacity" />
                                    </Link>
                                </Button>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="w-full border-[#526D82] text-[#526D82] hover:bg-[#526D82]/10 text-lg px-8 py-6 h-auto relative overflow-hidden group"
                                >
                                    <Link to="/login">
                                        Login
                                        <span className="absolute w-full h-full bg-[#526D82] top-0 left-0 opacity-0 group-hover:opacity-5 transition-opacity" />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

// Typewriter effect component
const TypewriterEffect = ({ text, showCursor }) => {
    const [displayText, setDisplayText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setDisplayText("");
        setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, Math.random() * 30 + 10);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, text]);

    return (
        <div className="text-[#9DB2BF] whitespace-pre-wrap">
            {displayText}
            {showCursor && <span className="text-blue-400">|</span>}
        </div>
    );
};

// Syntax highlighting component
const SyntaxHighlightedCode = ({ code, showCursor }) => {
    // Very basic syntax highlighting
    const keywords = ["function", "return", "const", "let", "var", "for", "of", "if", "else", "true", "false"];
    const functions = ["extractQuestion", "analyzeIntuition", "describeAlgorithm", "identifyMistakes", "formatSolution",
        "classifyError", "suggestImprovement", "analyzeProblemsCompleted", "identifyStrongestSkills",
        "findAreasForImprovement", "calculateCurrentStreak", "suggestNextProblems", "generateProgressReport"];

    const highlightedCode = code.split("\n").map((line, lineIndex) => {
        let highlightedLine = line;

        // Add syntax highlighting classes
        // Comments
        if (line.includes("//")) {
            const parts = line.split("//");
            highlightedLine = (
                <React.Fragment key={lineIndex}>
                    {parts[0]}
                    <span className="text-gray-500">//{parts[1]}</span>
                </React.Fragment>
            );
        } else {
            // Split by spaces and punctuation
            const tokens = line.split(/([{}(),;=.]|\s+)/g).filter(Boolean);

            highlightedLine = (
                <React.Fragment key={lineIndex}>
                    {tokens.map((token, tokenIndex) => {
                        if (keywords.includes(token)) {
                            return <span key={tokenIndex} className="text-purple-400">{token}</span>;
                        } else if (functions.includes(token)) {
                            return <span key={tokenIndex} className="text-blue-400">{token}</span>;
                        } else if (token.startsWith('"') || token.startsWith("'")) {
                            return <span key={tokenIndex} className="text-green-400">{token}</span>;
                        } else if (!isNaN(token) && token.trim() !== '') {
                            return <span key={tokenIndex} className="text-yellow-400">{token}</span>;
                        } else if (token === '{' || token === '}' || token === '(' || token === ')' || token === ':' || token === ',' || token === ';') {
                            return <span key={tokenIndex} className="text-gray-400">{token}</span>;
                        }
                        return <span key={tokenIndex}>{token}</span>;
                    })}
                </React.Fragment>
            );
        }

        return (
            <div key={lineIndex} className="line">
                {highlightedLine}
            </div>
        );
    });

    return (
        <div className="text-[#9DB2BF] whitespace-pre-wrap">
            {highlightedCode}
            {showCursor && <span className="text-blue-400">|</span>}
        </div>
    );
};

export default LandingPage;