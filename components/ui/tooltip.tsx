"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function Tooltip({ content, children, side = "top", align = "center" }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    let x = rect.left;
    let y = rect.top;

    switch (side) {
      case "top":
        y -= 8;
        break;
      case "bottom":
        y += rect.height + 8;
        break;
      case "left":
        x -= 8;
        break;
      case "right":
        x += rect.width + 8;
        break;
    }

    switch (align) {
      case "start":
        if (side === "top" || side === "bottom") x = rect.left;
        else y = rect.top;
        break;
      case "end":
        if (side === "top" || side === "bottom") x = rect.right;
        else y = rect.bottom;
        break;
      case "center":
        if (side === "top" || side === "bottom") x = rect.left + rect.width / 2;
        else y = rect.top + rect.height / 2;
        break;
    }

    setPosition({ x, y });
    setShow(true);
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
            side === "top" && "bottom-full mb-2",
            side === "bottom" && "top-full mt-2",
            side === "left" && "right-full mr-2",
            side === "right" && "left-full ml-2"
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
