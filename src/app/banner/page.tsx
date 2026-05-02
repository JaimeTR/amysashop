import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { DEFAULT_WHATSAPP_DISPLAY_PHONE, DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

export default function BannerPage() {
  return (
    <div className="relative w-full h-screen bg-[#4f3526] overflow-hidden flex flex-col items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 px-4">
        {/* Logo section - TOP: containered logo moved here */}
        <div className="mt-8 flex justify-center">
          <div className="relative w-36 h-12 bg-white/10 rounded-2xl p-2 shadow-lg flex items-center justify-center border border-white/20">
            <Image
              src="/logos/LOGO%20CLARO%20AMYSA%20SHOP.png"
              alt="AMYSA SHOP blanco"
              width={220}
              height={60}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Brown section - MIDDLE */}
        <div className="flex flex-col items-center gap-6 flex-1 justify-center">
          {/* Large centered logo (blanco) */}
          <div className="flex items-center justify-center">
            <Image
              src="/logos/LOGO%20CLARO%20AMYSA%20SHOP.png"
              alt="AMYSA Logo grande blanco"
              width={620}
              height={320}
              priority
              className="object-contain drop-shadow-2xl"
            />
          </div>

          {/* Animated text */}
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-none tracking-tight mb-0">
              TU FILTRO DE TENDENCIAS
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-white to-white/60 mx-auto rounded-full animate-pulse"></div>

            {/* Social icons shown under title on mobile */}
            <div className="flex items-center justify-center gap-6 mt-4 md:hidden">
              <a
                href="https://www.instagram.com/amysa.shop/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-white hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true" width="28" height="28">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"></rect>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"></circle>
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"></circle>
                </svg>
              </a>

              <a
                href="https://www.tiktok.com/@amysa.shop"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="text-white hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true" width="28" height="28">
                  <path d="M14 3v9.2a4.8 4.8 0 1 1-4.2-4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M14 3c.7 2.5 2.4 4 5 4v3.3c-2.1 0-3.9-.7-5-1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Animated typing text */}
          <div className="text-center">
            <p className="text-lg md:text-2xl text-white font-semibold">
              
    {/* Cuidado */}
    <span className="inline-block animate-bounce" style={{ animationDelay: "0s" }}>C</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.1s" }}>u</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.2s" }}>i</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.3s" }}>d</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.4s" }}>a</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.5s" }}>d</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.6s" }}>o</span>

    <span className="inline-block animate-bounce" style={{ animationDelay: "0.7s" }}>&nbsp;</span>

    {/* Personal */}
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.8s" }}>P</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "0.9s" }}>e</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1s" }}>r</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.1s" }}>s</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.2s" }}>o</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.3s" }}>n</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.4s" }}>a</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.5s" }}>l</span>

    <span className="inline-block animate-bounce" style={{ animationDelay: "1.6s" }}>,</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.7s" }}>&nbsp;</span>

    {/* Maquillajes */}
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.8s" }}>M</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "1.9s" }}>a</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2s" }}>q</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.1s" }}>u</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.2s" }}>i</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.3s" }}>l</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.4s" }}>l</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.5s" }}>a</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.6s" }}>j</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.7s" }}>e</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "2.8s" }}>s</span>

    <span className="inline-block animate-bounce" style={{ animationDelay: "2.9s" }}>,</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3s" }}>&nbsp;</span>

    {/* Perfumes */}
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.1s" }}>P</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.2s" }}>e</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.3s" }}>r</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.4s" }}>f</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.5s" }}>u</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.6s" }}>m</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.7s" }}>e</span>
    <span className="inline-block animate-bounce" style={{ animationDelay: "3.8s" }}>s</span>

            </p>
          </div>
        </div>

        {/* Contact and Social - BOTTOM */}
        <div className="flex flex-col items-center gap-8 pb-12 w-full max-w-2xl">
          {/* Contact Title */}
          <div className="text-center">
            <h2 className="flex items-center justify-center gap-3 text-3xl md:text-4xl font-bold text-white mb-6">
              <Phone size={36} />
              Contáctanos
            </h2>

            {/* Contact Number - Simple */}
            <Link
              href={`https://wa.me/${DEFAULT_WHATSAPP_PHONE}`}
              className="inline-block text-4xl md:text-5xl font-bold text-white hover:text-white/80 transition-colors"
            >
              {DEFAULT_WHATSAPP_DISPLAY_PHONE}
            </Link>
          </div>

          {/* Social Media Buttons - Glasmorphism */}
          <div className="flex gap-8 md:gap-12 items-center justify-center w-full flex-wrap">
            {/* Instagram Button - inline SVG as provided */}
            <a
              href="https://www.instagram.com/amysa.shop/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true" width="40" height="40">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"></rect>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"></circle>
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"></circle>
              </svg>
              <span className="text-xl md:text-2xl font-semibold text-white">@amysa.shop</span>
            </a>

            {/* TikTok Button - inline SVG as provided */}
            <a
              href="http://tiktok.com/@amysa.shop"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="inline-flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true" width="40" height="40">
                <path d="M14 3v9.2a4.8 4.8 0 1 1-4.2-4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M14 3c.7 2.5 2.4 4 5 4v3.3c-2.1 0-3.9-.7-5-1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-xl md:text-2xl font-semibold text-white">@amysa.shop</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
