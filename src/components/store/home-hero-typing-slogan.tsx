"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_SLOGANS = [
  "tu filtro de tendencias.",
  "tu radar de novedades.",
  "tu guía para elegir mejor.",
  "tu selección de temporada.",
];

type HomeHeroTypingSloganProps = {
  slogans?: string[];
};

export function HomeHeroTypingSlogan({ slogans }: HomeHeroTypingSloganProps) {
  const activeSlogans = useMemo(() => {
    if (!Array.isArray(slogans) || slogans.length === 0) {
      return DEFAULT_SLOGANS;
    }

    const sanitized = slogans
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .map((s) => s.replace(/^./, (c) => c.toUpperCase()));

    return sanitized.length > 0 ? sanitized : DEFAULT_SLOGANS;
  }, [slogans]);

  const [sloganIndex, setSloganIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentSlogan = activeSlogans[sloganIndex] || "";

    if (!currentSlogan) return;

    let timeoutId = 0;

    if (!isDeleting && visibleText.length < currentSlogan.length) {
      timeoutId = window.setTimeout(() => {
        setVisibleText(currentSlogan.slice(0, visibleText.length + 1));
      }, 65);
    } else if (!isDeleting && visibleText.length === currentSlogan.length) {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(true);
      }, 1600);
    } else if (isDeleting && visibleText.length > 0) {
      timeoutId = window.setTimeout(() => {
        setVisibleText(currentSlogan.slice(0, visibleText.length - 1));
      }, 35);
    } else {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(false);
        setSloganIndex((prev) => (prev + 1) % activeSlogans.length);
      }, 250);
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeSlogans, sloganIndex, visibleText, isDeleting]);

  return (
    <span className="block text-primary uppercase font-normal" aria-live="polite">
      {visibleText.toUpperCase()}
      <span className="ml-1 inline-block h-[1.05em] w-[2px] animate-pulse bg-primary align-[-0.18em]" aria-hidden="true" />
    </span>
  );
}
