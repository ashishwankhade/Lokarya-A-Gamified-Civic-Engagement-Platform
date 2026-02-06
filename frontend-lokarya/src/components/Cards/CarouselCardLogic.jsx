import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * CarouselItem
 * -------------
 * A single slide wrapper.
 */
export const CarouselItem = ({ children }) => {
  return (
    <div className="inline-flex w-full shrink-0">
      {children}
    </div>
  );
};

/**
 * Carousel Logic
 * --------
 */
const CarouselCardLogic = ({
  children,
  autoSlide = true,
  autoSlideInterval = 3000,
  className = "",
}) => {
  const slides = React.Children.toArray(children);
  const count = slides.length;

  if (count === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);

  // --- TOUCH STATE ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum distance (in px) to be considered a swipe
  const minSwipeDistance = 50;

  const next = () => {
    setActiveIndex((i) => (i === count - 1 ? 0 : i + 1));
  };

  const prev = () => {
    setActiveIndex((i) => (i === 0 ? count - 1 : i - 1));
  };

  // --- TOUCH HANDLERS ---
  const onTouchStart = (e) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next(); // Swipe Left -> Next Slide
    }
    if (isRightSwipe) {
      prev(); // Swipe Right -> Prev Slide
    }
  };

  useEffect(() => {
    if (!autoSlide || count <= 1) return;
    const interval = setInterval(next, autoSlideInterval);
    return () => clearInterval(interval);
  }, [autoSlide, autoSlideInterval, count]);

  return (
    <div 
      className={`relative overflow-hidden w-full group ${className}`}
      // Attach Touch Handlers to the container
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides}
      </div>

      {/* Controls (Arrows) - Hidden on Mobile default via opacity logic, visible on hover */}
      {count > 1 && (
        <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
          <button
            onClick={prev}
            className="pointer-events-auto cursor-pointer p-2 rounded-full shadow bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition hidden sm:block"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={next}
            className="pointer-events-auto cursor-pointer p-2 rounded-full shadow bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition hidden sm:block"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Indicators (Dots) */}
      {count > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`
                rounded-full transition-all cursor-pointer shadow-sm
                ${activeIndex === i
                  ? "w-4 h-4 bg-white"
                  : "w-3 h-3 bg-white/50"}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselCardLogic;