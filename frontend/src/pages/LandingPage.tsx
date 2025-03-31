"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button"; // Assuming Shadcn UI path
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#27374D] to-[#526D82] p-4">
            <Card className="w-full max-w-lg bg-[#DDE6ED] text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="text-5xl font-bold text-[#27374D] mb-2">
                        LeetNotes
                    </CardTitle>
                    <CardDescription className="text-lg text-[#526D82]">
                        Generate insightful notes from your LeetCode submissions automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6 pt-6">
                    <p className="text-base text-[#27374D]">
                        Stop manually documenting your LeetCode journey. Let AI help you understand your solutions, identify mistakes, and track your progress.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                        <Button
                            asChild
                            size="lg"
                            className="w-full sm:w-auto bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D]"
                        >
                            {/* Link to login, but could potentially pass state to default to signup */}
                            <Link to="/login">Get Started</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto border-[#526D82] text-[#526D82] hover:bg-[#526D82]/10"
                        >
                            <Link to="/login">Login</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LandingPage;