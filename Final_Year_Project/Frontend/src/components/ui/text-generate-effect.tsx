"use client";
import { useEffect, useRef } from "react";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  loop = true,
  loopPauseMs = 1500,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  /** If true, the animation loops continuously while in view. Defaults to true. */
  loop?: boolean;
  /** Pause in ms after fully revealed before restarting. Defaults to 1500ms. */
  loopPauseMs?: number;
}) => {
  const [scope, animate] = useAnimate();
  const ref = useRef<HTMLDivElement>(null);
  // once: false so it re-triggers every time the section enters the viewport
  const isInView = useInView(ref, { once: false });
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancelledRef = useRef(false);

  const wordsArray = words.split(" ");

  useEffect(() => {
    isCancelledRef.current = false;

    if (!isInView || !scope.current) return;

    const runAnimation = async () => {
      if (isCancelledRef.current) return;

      // Fade in word by word with optional blur
      await animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration ?? 0.5,
          delay: stagger(0.2),
        }
      );

      if (isCancelledRef.current || !loop) return;

      // Pause at fully revealed state
      loopTimerRef.current = setTimeout(async () => {
        if (isCancelledRef.current) return;

        // Fade out all words simultaneously back to hidden
        await animate(
          "span",
          {
            opacity: 0,
            filter: filter ? "blur(10px)" : "none",
          },
          {
            duration: duration ?? 0.5,
            delay: stagger(0.05, { from: "last" }),
          }
        );

        if (!isCancelledRef.current) runAnimation();
      }, loopPauseMs);
    };

    runAnimation();

    return () => {
      isCancelledRef.current = true;
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, [isInView, words, filter, duration, loop, loopPauseMs]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="dark:text-white text-black opacity-0"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return (
    <div ref={ref} className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-black text-2xl leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
