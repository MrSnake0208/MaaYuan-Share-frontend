import clsx from "clsx";
import { FC, useEffect, useMemo, useState } from "react";

export interface AdBannerItem {
  image: string;
  link: string;
  alt?: string;
}

interface AdBannerCarouselProps {
  items?: AdBannerItem[];
  width?: number;
  height?: number;
  autoplay?: boolean;
  interval?: number;
  className?: string;
  showIndicators?: boolean;
  showArrows?: boolean;
}

export const AdBannerCarousel: FC<AdBannerCarouselProps> = ({
  items = [],
  width = 560,
  height = 320,
  autoplay = true,
  interval = 3000,
  className,
  showIndicators = true,
  showArrows = true,
}) => {
  const validItems = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadedIndexes, setLoadedIndexes] = useState(() => new Set([0, 1]));

  useEffect(() => {
    if (!autoplay || paused || validItems.length <= 1) return;
    const id = setInterval(() => {
      setIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % validItems.length;
        setLoadedIndexes((current) => {
          const next = new Set(current);
          next.add(nextIndex);
          next.add((nextIndex + 1) % validItems.length);
          return next;
        });
        return nextIndex;
      });
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, paused, interval, validItems.length]);

  const goTo = (i: number) => {
    if (!validItems.length) return;
    const n = ((i % validItems.length) + validItems.length) % validItems.length;
    setLoadedIndexes((current) => {
      const next = new Set(current);
      next.add(n);
      next.add((n + 1) % validItems.length);
      return next;
    });
    setIndex(n);
  };

  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  if (!validItems.length) {
    return null;
  }

  return (
    <div
      className={clsx("relative overflow-hidden select-none", className)}
      style={{ width: "100%", maxWidth: width, height }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="h-full w-full whitespace-nowrap transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {validItems.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block align-top w-full h-full"
            aria-label={item.alt || "ad-banner"}
          >
            <img
              src={loadedIndexes.has(idx) ? item.image : undefined}
              data-src={loadedIndexes.has(idx) ? undefined : item.image}
              alt={item.alt || "ad"}
              className="w-full h-full object-contain"
              draggable={false}
              width={width}
              height={height}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === 0 ? "high" : "low"}
            />
          </a>
        ))}
      </div>

      {showArrows && validItems.length > 1 && (
        <>
          <button
            type="button"
            aria-label="previous"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ›
          </button>
        </>
      )}

      {showIndicators && validItems.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {validItems.map((_, i) => (
            <button
              key={i}
              aria-label={`go-to-${i}`}
              onClick={() => goTo(i)}
              className={clsx(
                "w-2.5 h-2.5 rounded-full",
                i === index ? "bg-white" : "bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdBannerCarousel;
