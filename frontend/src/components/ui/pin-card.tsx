// src/components/ui/pin-card.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./card";

interface PinCardProps {
    title: string;
    href?: string;
    headerContent: React.ReactNode;
    mainContent: React.ReactNode;
    footerContent?: React.ReactNode;
}

export function PinCard({ title, href, headerContent, mainContent, footerContent }: PinCardProps) {
    const Component = href ? "a" : "div";

    return (
        <Component
            href={href}
            className="block h-full w-full overflow-hidden rounded-lg bg-[#DDE6ED] shadow-lg transition-transform hover:scale-105"
        >
            <Card className="h-full w-full border-none bg-[#DDE6ED]">
                <CardHeader className="pb-2">{headerContent}</CardHeader>
                <CardContent className="pb-2">{mainContent}</CardContent>
                {footerContent && <CardFooter>{footerContent}</CardFooter>}
            </Card>
        </Component>
    );
}