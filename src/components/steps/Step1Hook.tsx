import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { ScrapedData } from "@/services/mockScraper";
import { ScrapedProjectData } from "@/lib/api/firecrawl";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { AICoachSpotlight } from "@/components/landing/AICoachSpotlight";
import { TechStackBanner } from "@/components/landing/TechStackBanner";
import { BentoGrid } from "@/components/landing/BentoGrid";

export type EntryMode = "generate" | "custom_script";

interface Step1HookProps {
  onNext: (idea: string, scrapedData?: ScrapedData) => void;
  onAutoGenerate: (idea: string, scrapedData?: ScrapedData) => void;
  onPracticeOwn: () => void;
  onOpenAICoach?: () => void;
}

export const Step1Hook = ({ onNext, onAutoGenerate, onPracticeOwn, onOpenAICoach }: Step1HookProps) => {
  // ScrapedData is an alias for ScrapedProjectData, so we can pass directly
  const handleSubmit = (idea: string, scrapedData?: ScrapedProjectData) => {
    onNext(idea, scrapedData);
  };

  const handleAutoGenerate = (idea: string, scrapedData?: ScrapedProjectData) => {
    onAutoGenerate(idea, scrapedData);
  };

  return (
    <div className="min-h-screen hero-gradient overflow-x-hidden">
      {/* Hero Section - New transformed design */}
      <HeroSection 
        onSubmit={handleSubmit}
        onAutoGenerate={handleAutoGenerate}
        onOpenAICoach={onOpenAICoach}
      />

      {/* Comparison Section - "Why not just ChatGPT?" */}
      <ComparisonSection />

      {/* AI Coach Spotlight - The "Iron Man" HUD */}
      <AICoachSpotlight />

      {/* Tech Stack Banner - Social Proof */}
      <TechStackBanner />

      {/* Bento Grid - Original features (refined) */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 bg-gradient-to-b from-transparent to-muted/30 scroll-mt-16">
        <BentoGrid />
      </section>

      {/* Public Demo Disclaimer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 shadow-lg"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>
            Hackathon Demo • Data is temporary
          </span>
        </motion.div>
      </div>
    </div>
  );
};