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

export const RotatingSlogan = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLOGANS.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const currentSlogan = SLOGANS[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-center max-w-4xl mx-auto mb-8"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mb-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            {currentSlogan.context}
          </motion.span>
        </AnimatePresence>
        {" "}are won with{" "}
        <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          stories
        </span>
        , not just{" "}
        <AnimatePresence mode="wait">
          <motion.span
            key={`suffix-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            {currentSlogan.suffix}
          </motion.span>
        </AnimatePresence>
        .
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Don't let a bad pitch kill a great product.{" "}
        <span className="text-foreground font-medium">Turn your URL, document, or idea</span> into a winning script in seconds.
      </p>
    </motion.div>
  );
};
