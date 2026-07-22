import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { storiesData } from '../../data/storiesData'; // Import the separated data

// ---------- Story Circle ----------
function StoryCircle({ story, onClick }) {
  const ringBackground = story.seen
    ? 'bg-gray-200'
    : 'bg-[linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)]';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer min-w-[72px] flex-shrink-0 group"
      aria-label={`View ${story.username}'s story`}
    >
      <div className={`p-[3px] rounded-full ${ringBackground} group-hover:opacity-90 transition-opacity`}>
        <div className="p-[2px] rounded-full bg-white">
          <img
            src={story.avatar}
            alt={story.username}
            className="w-[60px] h-[60px] rounded-full object-cover block"
          />
        </div>
      </div>
      <span className="mt-1.5 text-xs text-gray-900 max-w-[72px] overflow-hidden text-ellipsis whitespace-nowrap text-center">
        {story.username}
      </span>
    </button>
  );
}

// ---------- Story Viewer (Modal) ----------
function StoryViewer({ story, onClose, onNextStory, onPrevStory }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const item = story.items[currentIndex];

  // Auto-advance timer
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const duration = item.duration;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        if (currentIndex < story.items.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          onNextStory?.();
        }
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, item.duration, story.items.length, onNextStory]);

  const handleTap = (e) => {
    const x = e.clientX;
    const width = window.innerWidth;

    if (x < width / 3) {
      if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      else onPrevStory?.();
    } else {
      if (currentIndex < story.items.length - 1) setCurrentIndex((i) => i + 1);
      else onNextStory?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center w-full">
      <img src={item.image} alt="story" className="absolute w-full h-full object-cover" />

      {/* Progress Bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {story.items.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/35 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-[50ms] linear"
              style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-4 right-4 flex items-center z-10">
        <img src={story.avatar} alt={story.username} className="w-9 h-9 rounded-full object-cover border border-white/20" />
        <span className="text-white ml-2.5 text-sm font-semibold drop-shadow-md">
          {story.username}
        </span>
        <button
          onClick={onClose}
          className="ml-auto bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
          aria-label="Close story"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tap Zones */}
      <div className="absolute top-0 left-0 w-1/3 h-full z-10 cursor-w-resize" onClick={handleTap} />
      <div className="absolute top-0 right-0 w-2/3 h-full z-10 cursor-e-resize" onClick={handleTap} />
    </div>
  );
}

// ---------- Main Stories Component ----------
export default function Stories({ stories = storiesData }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const scrollRef = useRef(null);

  const openStory = (i) => setActiveIndex(i);
  const closeStory = () => setActiveIndex(null);

  const nextStory = () => {
    if (activeIndex !== null && activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (activeIndex !== null && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else {
      closeStory();
    }
  };

  // Enable vertical mouse wheel to scroll horizontally smoothly
  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollBy({
        left: e.deltaY * 2,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex gap-4 p-4 rounded-xl overflow-x-auto bg-white border border-gray-200 scrollbar-hide w-full cursor-grab active:cursor-grabbing select-none scroll-smooth"
      >
        {stories.map((story, i) => (
          <StoryCircle key={story.id} story={story} onClick={() => openStory(i)} />
        ))}
      </div>

      {activeIndex !== null && (
        <StoryViewer
          story={stories[activeIndex]}
          onClose={closeStory}
          onNextStory={nextStory}
          onPrevStory={prevStory}
        />
      )}
    </>
  );
}