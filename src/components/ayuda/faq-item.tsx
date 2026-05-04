"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  question: string;
  answer: React.ReactNode;
};

export default function FaqItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    if (ref.current) setHeight(`${ref.current.scrollHeight}px`);
  }, [ref, answer]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-white/50">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
          </span>
          <span className="font-medium">{question}</span>
        </span>

        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180 text-primary" : "text-muted-foreground"}`}
        />
      </button>

      <div
        ref={ref}
        style={{ maxHeight: open ? height : "0px" }}
        className="mt-3 overflow-hidden transition-[max-height] duration-300"
      >
        <div className="prose-sm text-sm text-muted-foreground">{answer}</div>
      </div>
    </div>
  );
}
