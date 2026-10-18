"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { PropertyImage } from "@/types/property";
import { cn } from "@/lib/utils";

interface PropertyImageSwiperProps {
  images: PropertyImage[];
  title?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
}

export function PropertyImageSwiper({
  images,
  title = "صور العقار",
  className,
  aspectRatio = "video",
}: PropertyImageSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const total = images.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    // In Arabic RTL: Next image logically goes forward
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    // In Arabic RTL: Prev image goes backwards
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (total <= 1) return;
      if (e.key === "ArrowLeft") {
        // In RTL, left arrow moves to next
        handleNext();
      } else if (e.key === "ArrowRight") {
        // In RTL, right arrow moves to previous
        handlePrev();
      } else if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, isLightboxOpen, total]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // In RTL: swiping left goes to next, swiping right goes to previous
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-zinc-900 border border-neutral-border flex flex-col items-center justify-center text-zinc-500 text-xs">
        <Layers className="w-8 h-8 mb-2 opacity-50" />
        <span>لا توجد صور مرفوعة لهذا العقار حالياً</span>
      </div>
    );
  }

  const currentImage = images[currentIndex] || images[0];

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : "aspect-square";

  return (
    <div className={cn("space-y-3 select-none", className)}>
      {/* Main Swiper Container */}
      <div
        className={cn(
          "relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-neutral-border shadow-md group cursor-grab active:cursor-grabbing",
          aspectClass
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div className="relative w-full h-full overflow-hidden">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={cn(
                "absolute inset-0 w-full h-full transition-all duration-300 ease-out",
                idx === currentIndex
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-98 pointer-events-none z-0"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || title}
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}

          {/* Vignette Gradients for Text Readability */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-20" />
        </div>

        {/* Top Header Overlay: Counter & Lightbox */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
          {/* Image Counter Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold font-tabular">
            <span>{currentIndex + 1}</span>
            <span className="text-white/60">/</span>
            <span>{total}</span>
          </div>

          {/* Lightbox Fullscreen Trigger */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 hover:text-white hover:bg-black/80 transition-all pointer-events-auto cursor-pointer"
            title="عرض بالحجم الكامل"
            aria-label="عرض الصورة بالحجم الكامل"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Overlay: Caption */}
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-white text-xs font-medium max-w-[70%] truncate">
            {currentImage.caption || "صورة من تفاصيل العقار"}
          </div>

          {currentImage.isPrimary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-gold/90 text-brand-charcoal font-bold text-[11px] shadow-sm">
              <Sparkles className="w-3 h-3" />
              الرئيسية
            </span>
          )}
        </div>

        {/* Navigation Arrows (RTL: ChevronRight on right = Previous, ChevronLeft on left = Next) */}
        {total > 1 && (
          <>
            {/* Right Arrow (Previous in RTL) */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all hover:bg-black/85 hover:scale-105 active:scale-95 z-30 cursor-pointer shadow-lg"
              title="الصورة السابقة"
              aria-label="الصورة السابقة"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Left Arrow (Next in RTL) */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all hover:bg-black/85 hover:scale-105 active:scale-95 z-30 cursor-pointer shadow-lg"
              title="الصورة التالية"
              aria-label="الصورة التالية"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom Pagination Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "transition-all duration-300 rounded-full cursor-pointer",
                  idx === currentIndex
                    ? "w-6 h-2 bg-brand-gold shadow-xs"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`الانتقال للصورة ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Navigation Bar */}
      {total > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 px-0.5 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 cursor-pointer group",
                idx === currentIndex
                  ? "border-brand-gold scale-[1.02] shadow-sm ring-2 ring-brand-gold/30"
                  : "border-neutral-border opacity-65 hover:opacity-100 hover:border-zinc-400"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || `معاينة ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {idx === currentIndex && (
                <div className="absolute inset-0 bg-brand-gold/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-right text-white">
              <p className="font-bold text-sm sm:text-base">{title}</p>
              <p className="text-xs text-zinc-400">
                {currentImage.caption || `صورة ${currentIndex + 1} من ${total}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image & Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.url}
              alt={currentImage.caption || title}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  title="الصورة السابقة"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  title="الصورة التالية"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Strip */}
          <div
            className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer",
                  idx === currentIndex
                    ? "border-brand-gold scale-105"
                    : "border-white/20 opacity-50 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
