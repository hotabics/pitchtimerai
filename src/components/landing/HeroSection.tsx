import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Link2, Loader2, Zap, Video, Check, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isUrl, scrapeUrl, ScrapedProjectData } from "@/lib/api/firecrawl";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";

interface HeroSectionProps {
  onSubmit: (idea: string, scrapedData?: ScrapedProjectData) => void;
  onAutoGenerate: (idea: string, scrapedData?: ScrapedProjectData) => void;
  onOpenAICoach?: () => void;
}

export const HeroSection = ({ onSubmit, onAutoGenerate, onOpenAICoach }: HeroSectionProps) => {
  const [projectInput, setProjectInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProjectData | null>(null);
  
  const inputIsUrl = isUrl(projectInput);
  
  // Handle URL scraping
  const handleUrlScrape = async (url: string) => {
    setIsScrapingUrl(true);
    try {
      const response = await scrapeUrl(url);
      if (response.success && response.data) {
        setScrapedData(response.data);
        toast({
          title: "🔍 Website Scanned!",
          description: `Extracted project data from your link`,
        });
      } else {
        toast({
          title: "Scan Failed",
          description: response.error || "Could not extract data from this URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not extract data from this URL",
        variant: "destructive",
      });
    } finally {
      setIsScrapingUrl(false);
    }
  };
  
  // Auto-scrape when URL is detected
  useEffect(() => {
    if (inputIsUrl && projectInput.length > 10 && !isScrapingUrl && !scrapedData) {
      const debounce = setTimeout(() => {
        handleUrlScrape(projectInput);
      }, 800);
      return () => clearTimeout(debounce);
    }
    if (!inputIsUrl && scrapedData) {
      setScrapedData(null);
    }
  }, [projectInput, inputIsUrl, isScrapingUrl, scrapedData]);
  
  const handleGenerateScript = () => {
    const idea = scrapedData?.name || projectInput.trim();
    if (idea) {
      trackEvent('Onboarding: Magic URL Used', { 
        url: inputIsUrl ? projectInput : undefined,
        hasScrapedData: !!scrapedData 
      });
      onAutoGenerate(idea, scrapedData || undefined);
    }
  };
  
  const handleCustomizePitch = () => {
    const idea = scrapedData?.name || projectInput.trim();
    if (idea) {
      trackEvent('Onboarding: Customize Pitch Clicked', { 
        url: inputIsUrl ? projectInput : undefined,
        hasScrapedData: !!scrapedData 
      });
      onSubmit(idea, scrapedData || undefined);
    }
  };

  const handleOpenCoach = () => {
    trackEvent('AI Coach: Opened from Hero');
    // Request camera permission early
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(() => {
        if (onOpenAICoach) onOpenAICoach();
      })
      .catch(() => {
        // Still open coach even if permission denied - it will handle it
        if (onOpenAICoach) onOpenAICoach();
      });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (projectInput.trim() || scrapedData)) {
      handleGenerateScript();
    }
  };

  return (
    <section id="hero" className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 relative scroll-mt-16">
      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-xs font-medium text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>All-in-One Pitch Platform</span>
        </div>
      </motion.div>

      {/* Main headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-4xl mx-auto mb-8"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mb-4">
          Hackathons are won with{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            stories
          </span>
          , not just code.
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Don't let a bad pitch kill a great product.{" "}
          <span className="text-foreground font-medium">Turn your URL or idea</span> into a winning script in seconds.
        </p>
      </motion.div>

      {/* Magic Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl mx-auto mb-6"
      >
        <div className="relative">
          {/* Glow effect */}
          <motion.div 
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/30 via-emerald-500/20 to-cyan-500/30 blur-xl -z-10" 
            animate={{
              opacity: isFocused ? 0.6 : 0.3,
              scale: isFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
          />
          
          <div className={`
            glass-premium rounded-2xl p-1.5 border-2 transition-all duration-300
            ${isFocused ? "border-primary/50 shadow-xl shadow-primary/10" : "border-white/10"}
          `}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                {/* Icon based on input type */}
                {inputIsUrl ? (
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                ) : (
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                )}
                
                {/* Loading spinner */}
                {isScrapingUrl && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
                
                {/* URL detected badge */}
                <AnimatePresence>
                  {inputIsUrl && !isScrapingUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        <Check className="w-3 h-3" />
                        Link Detected
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input 
                  type="text" 
                  value={projectInput} 
                  onChange={e => setProjectInput(e.target.value)} 
                  onFocus={() => setIsFocused(true)} 
                  onBlur={() => setIsFocused(false)} 
                  onKeyDown={handleKeyDown} 
                  placeholder="Paste your Devpost URL or describe your idea..."
                  className="
                    w-full h-16 pl-12 pr-32
                    bg-muted/80 text-foreground text-base md:text-lg font-medium
                    placeholder:text-muted-foreground
                    focus:outline-none focus:bg-muted
                    rounded-xl
                    border-2 border-primary/30 ring-2 ring-primary/20
                    transition-all duration-200
                    shadow-inner
                  " 
                />
              </div>

          </div>
        </div>

        {/* Example chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-3"
        >
          <span className="text-xs text-muted-foreground">Try:</span>
          {[
            "AI Study Buddy",
            "Carbon Footprint Tracker", 
            "Smart Medication Reminder",
            "Local Event Finder"
          ].map((example) => (
            <button
              key={example}
              onClick={() => setProjectInput(example)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted/60 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/30 transition-all duration-200"
            >
              {example}
            </button>
          ))}
        </motion.div>
        </div>
        
        {/* Scraped data preview */}
        <AnimatePresence>
          {scrapedData && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{scrapedData.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{scrapedData.problem}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dual Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex flex-col sm:flex-row gap-3 w-full"
        >
          {/* Auto-Generate Button (Primary) */}
          <Button
            onClick={handleGenerateScript}
            disabled={(!projectInput.trim() && !scrapedData) || isScrapingUrl}
            size="lg"
            className="flex-1 min-w-fit h-14 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-primary via-amber-500 to-primary text-white hover:opacity-90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base transition-all duration-300 border-2 border-amber-400/30 whitespace-nowrap"
          >
            <Zap className="w-5 h-5 mr-2 flex-shrink-0" />
            Auto-Generate
          </Button>

          {/* Customize Pitch Button (Secondary) */}
          <Button
            onClick={handleCustomizePitch}
            disabled={(!projectInput.trim() && !scrapedData) || isScrapingUrl}
            variant="outline"
            size="lg"
            className="flex-1 min-w-fit h-14 px-4 sm:px-6 rounded-xl border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 font-semibold text-sm sm:text-base transition-all duration-300 whitespace-nowrap"
          >
            <Settings className="w-5 h-5 mr-2 flex-shrink-0" />
            Customize Pitch
          </Button>
        </motion.div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Choose 'Customize' to select specific audiences (Investors, Non-Tech, etc.)
        </p>
      </motion.div>

      {/* Secondary Action - AI Coach */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-4 mt-8"
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-12 h-px bg-border" />
          <span>or</span>
          <div className="w-12 h-px bg-border" />
        </div>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleOpenCoach}
          className="h-12 px-6 rounded-xl border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 group"
        >
          <Video className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Already have a script? Open AI Coach
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            No signup required • Works in your browser
          </span>
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs">See why we're different</span>
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};