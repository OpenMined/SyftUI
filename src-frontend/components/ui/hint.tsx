"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

interface HintProps {
  message: string;
  icon?: string;
  onClose?: () => void;
  position?: "bottom" | "top" | "center";
  className?: string;
  showCloseButton?: boolean;
  floating?: boolean;
}

export const Hint = React.memo(
  ({
    message,
    icon = "💡",
    onClose,
    position = "bottom",
    className,
    showCloseButton = true,
    floating = true,
  }: HintProps) => {
    const positionClasses = {
      bottom: "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50",
      top: "fixed top-12 left-1/2 transform -translate-x-1/2 z-50",
      center:
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
    };

    const floatingAnimation = floating
      ? {
          y: [0, -8, 0],
        }
      : { y: 0 };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          ...floatingAnimation,
        }}
        exit={{ opacity: 0, y: 50 }}
        transition={{
          opacity: { duration: 0.3 },
          y: floating
            ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.3 },
        }}
        className={cn(positionClasses[position], className)}
      >
        <div className="group bg-background/95 relative flex items-center justify-center rounded-full border px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] backdrop-blur-sm transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
          <span
            className={cn(
              "animate-gradient pointer-events-none absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]",
            )}
            style={{
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "subtract",
              WebkitClipPath: "padding-box",
            }}
          />
          {icon} <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
          <AnimatedGradientText className="text-sm font-medium">
            {message}
          </AnimatedGradientText>
          {showCloseButton && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="hover:bg-muted relative z-10 ml-2 rounded-full p-1 transition-colors"
              aria-label="Close hint"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    );
  },
);

Hint.displayName = "Hint";
