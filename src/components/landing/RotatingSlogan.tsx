import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLOGANS = [
  { context: "Hackathons", suffix: "code" },
  { context: "Defenses", suffix: "theory" },
  { context: "Deals", suffix: "data" },
  { context: "Pitches", suffix: "prototypes" },
  { context: "Grades", suffix: "facts" },
  { context: "Hearts", suffix: "gifts" },
];

const ROTATION_INTERVAL = 15000; // 15 seconds
const TYPEWRITER_SPEED = 50; // ms per character

export const RotatingSlogan = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isGlitching, setIsGlitching] = useState(false);

  const currentSlogan = SLOGANS[currentIndex];
  const fullText = `${currentSlogan.context} are won with stories, not just ${currentSlogan.suffix}.`;

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, TYPEWRITER_SPEED);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [displayedText, fullText, isTyping]);

  // Rotation with glitch transition
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      // Start glitch effect
      setIsGlitching(true);
      
      // After glitch, change slogan and reset typewriter
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SLOGANS.length);
        setDisplayedText("");
        setIsTyping(true);
        setIsGlitching(false);
      }, 500);
    }, ROTATION_INTERVAL);

    return () => clearInterval(rotationTimer);
  }, []);

  // Parse displayed text to highlight keywords
  const renderText = () => {
    const contextWord = currentSlogan.context;
    const storiesIndex = displayedText.indexOf("stories");
    
    return (
      <span className="inline">
        {displayedText.split("").map((char, i) => {
          const isContextWord = i < contextWord.length;
          const isStoriesWord = storiesIndex !== -1 && i >= storiesIndex && i < storiesIndex + 7;
          
          return (
            <span
              key={i}
              className={`
                ${isContextWord || isStoriesWord ? "text-slogan-emphasis font-black" : "text-slogan-primary"}
                ${isGlitching ? "animate-glitch" : ""}
              `}
            >
              {char}
            </span>
          );
        })}
        {/* Typing cursor */}
        {isTyping && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-slogan-primary ml-0.5"
          >
            |
          </motion.span>
        )}
      </span>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-30" />
      
      {/* Main slogan container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <h2 
            className={`
              text-center font-bold uppercase tracking-tight
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
              leading-tight
              ${isGlitching ? "animate-glitch-text" : ""}
            `}
            style={{ fontFamily: "'Inter', 'Montserrat', sans-serif" }}
          >
            {renderText()}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {SLOGANS.map((_, index) => (
          <motion.div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "w-8 bg-slogan-emphasis" 
                : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
