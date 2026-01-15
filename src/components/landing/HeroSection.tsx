import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Link2, Loader2, Zap, Video, Check, ArrowRight, Settings, Clock, FileUp, ChevronDown, Eye, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isUrl, scrapeUrl, ScrapedProjectData } from "@/lib/api/firecrawl";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import { FileUploadZone } from "./FileUploadZone";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { RotatingSlogan } from "./RotatingSlogan";
import { getStoredDuration, saveDuration, DURATION_PRESETS } from "@/hooks/usePitchDuration";

const RECENT_IDEAS_KEY = "pitchperfect_recent_ideas";
const MAX_RECENT_IDEAS = 3;

const getRecentIdeas = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_IDEAS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentIdea = (idea: string) => {
  if (!idea.trim() || isUrl(idea)) return;
  try {
    const existing = getRecentIdeas().filter(i => i.toLowerCase() !== idea.toLowerCase());
    const updated = [idea, ...existing].slice(0, MAX_RECENT_IDEAS);
    localStorage.setItem(RECENT_IDEAS_KEY, JSON.stringify(updated));
  } catch {}
};

interface HeroSectionProps {
  onSubmit: (idea: string, scrapedData?: ScrapedProjectData, durationMinutes?: number) => void;
  onAutoGenerate: (idea: string, scrapedData?: ScrapedProjectData, durationMinutes?: number) => void;
  onOpenAICoach?: () => void;
}

const WORDS_PER_MINUTE = 150; // Average speaking pace

// Use the shared presets but map to the expected format
const DURATION_OPTIONS = DURATION_PRESETS.map(p => ({
  value: p.value,
  label: p.label,
  description: p.description,
}));

const getEstimatedWords = (durationMinutes: number) => Math.round(durationMinutes * WORDS_PER_MINUTE);

export const HeroSection = ({ onSubmit, onAutoGenerate, onOpenAICoach }: HeroSectionProps) => {
  const [projectInput, setProjectInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProjectData | null>(null);
  const [recentIdeas, setRecentIdeas] = useState<string[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pendingFileData, setPendingFileData] = useState<ScrapedProjectData | null>(null);
  // Initialize from localStorage for persistence between sessions
  const [selectedDuration, setSelectedDuration] = useState(() => getStoredDuration());

  // Save duration to localStorage when it changes
  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    saveDuration(duration);
  };

  const inputIsUrl = isUrl(projectInput);
  
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
  
  // Load recent ideas on mount
  useEffect(() => {
    setRecentIdeas(getRecentIdeas());
  }, []);

  // Keyboard shortcuts for duration selection (1-6 keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Check for number keys 1-6
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 6) {
        const preset = DURATION_OPTIONS[keyNum - 1];
        if (preset) {
          handleDurationChange(preset.value);
          toast({
            title: `Duration: ${preset.label}`,
            description: `${preset.description} selected`,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDurationChange]);
  
  // Auto-scrape when URL is detected
  useEffect(() => {
    if (inputIsUrl && projectInput.length > 10 && !isScrapingUrl && !scrapedData) {
      const debounce = setTimeout(() => {
        handleUrlScrape(projectInput);
      }, 800);
      return () => clearTimeout(debounce);
    }
    if (!inputIsUrl && scrapedData && !uploadedFileName) {
      setScrapedData(null);
    }
  }, [projectInput, inputIsUrl, isScrapingUrl, scrapedData, uploadedFileName]);

  // Handle file processed - show preview modal first
  const handleFileProcessed = (data: ScrapedProjectData, filename: string, images?: string[]) => {
    setPendingFileData(data);
    setUploadedFileName(filename);
    setExtractedImages(images || []);
    setShowFileUpload(false);
    setShowPreviewModal(true);
    trackEvent('Onboarding: File Uploaded', { filename, hasData: !!data, imageCount: images?.length || 0 });
  };

  // Confirm data from preview modal
  const handleConfirmFileData = (confirmedData: ScrapedProjectData) => {
    setScrapedData(confirmedData);
    setProjectInput(confirmedData.name);
    setPendingFileData(null);
    setShowPreviewModal(false);
    toast({
      title: "📄 Document Ready!",
      description: `Using data from ${uploadedFileName}`,
    });
  };

  const handleFileError = (error: string) => {
    toast({
      title: "Analysis Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleClearFileData = () => {
    setScrapedData(null);
    setUploadedFileName(null);
    setExtractedImages([]);
    setPendingFileData(null);
    setProjectInput("");
  };
  
  const handleGenerateScript = () => {
    const idea = scrapedData?.name || projectInput.trim();
    if (idea) {
      trackEvent('Onboarding: Magic URL Used', { 
        url: inputIsUrl ? projectInput : undefined,
        hasScrapedData: !!scrapedData,
        durationMinutes: selectedDuration
      });
      saveRecentIdea(idea);
      setRecentIdeas(getRecentIdeas());
      onAutoGenerate(idea, scrapedData || undefined, selectedDuration);
    }
  };
  
  const handleCustomizePitch = () => {
    const idea = scrapedData?.name || projectInput.trim();
    if (idea) {
      trackEvent('Onboarding: Customize Pitch Clicked', { 
        url: inputIsUrl ? projectInput : undefined,
        hasScrapedData: !!scrapedData,
        durationMinutes: selectedDuration
      });
      saveRecentIdea(idea);
      setRecentIdeas(getRecentIdeas());
      onSubmit(idea, scrapedData || undefined, selectedDuration);
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

      {/* Dynamic Rotating Slogan */}
      <RotatingSlogan />

      {/* Magic Input */}
      <motion.div
        id="hero-input"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl mx-auto mb-6 scroll-mt-24"
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
                {uploadedFileName ? (
                  <FileUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                ) : inputIsUrl ? (
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
                  {inputIsUrl && !isScrapingUrl && !uploadedFileName && (
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
                  {uploadedFileName && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <button 
                        onClick={handleClearFileData}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        From File
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input 
                  type="text" 
                  value={projectInput} 
                  onChange={e => {
                    setProjectInput(e.target.value);
                    // Clear file data if user starts typing something else
                    if (uploadedFileName && e.target.value !== scrapedData?.name) {
                      setUploadedFileName(null);
                    }
                  }} 
                  onFocus={() => setIsFocused(true)} 
                  onBlur={() => setIsFocused(false)} 
                  onKeyDown={handleKeyDown} 
                  placeholder="Paste URL, describe your idea, or upload a file..."
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

        {/* File Upload Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 flex justify-center"
        >
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <FileUp className="w-4 h-4" />
            <span>Have a README or pitch deck?</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFileUpload ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>

        {/* File Upload Zone */}
        <AnimatePresence>
          {showFileUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <FileUploadZone
                onFileProcessed={handleFileProcessed}
                onError={handleFileError}
                className="mt-3"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-3"
        >
          {recentIdeas.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent:
              </span>
              {recentIdeas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setProjectInput(idea)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  {idea}
                </button>
              ))}
              <div className="w-px h-4 bg-border/50 mx-1" />
            </>
          )}
          <span className="text-xs text-muted-foreground">Try:</span>
          {[
            "AI Study Buddy",
            "Carbon Footprint Tracker", 
            "Smart Medication Reminder",
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
        
        {/* Scraped/Parsed data preview */}
        <AnimatePresence>
          {scrapedData && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`mt-3 p-4 rounded-xl border ${uploadedFileName ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${uploadedFileName ? 'bg-emerald-500/20' : 'bg-primary/20'}`}>
                  {uploadedFileName ? (
                    <FileUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{scrapedData.name}</p>
                    {uploadedFileName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-medium">
                        from {uploadedFileName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{scrapedData.problem}</p>
                  {scrapedData.solution && (
                    <p className="text-xs text-primary/80 mt-1 line-clamp-1">
                      💡 {scrapedData.solution}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duration Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-5"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Pitch Duration</span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">(Press 1-6)</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {DURATION_OPTIONS.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleDurationChange(option.value)}
                className={`
                  relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${selectedDuration === option.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                  }
                `}
              >
                {/* Keyboard shortcut indicator */}
                <span className={`
                  absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center
                  transition-opacity duration-200 hidden sm:flex
                  ${selectedDuration === option.value 
                    ? "bg-primary-foreground/20 text-primary-foreground opacity-100" 
                    : "bg-muted-foreground/10 text-muted-foreground opacity-0 group-hover:opacity-100"
                  }
                `}>
                  {index + 1}
                </span>
                <span className="block">{option.label}</span>
                <span className={`text-[10px] ${selectedDuration === option.value ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          
          {/* Word count indicator */}
          <motion.div 
            key={selectedDuration}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-2"
          >
            <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">
                ~{getEstimatedWords(selectedDuration).toLocaleString()} words
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                @ {WORDS_PER_MINUTE} WPM
              </span>
            </div>
          </motion.div>
        </motion.div>

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
            className="flex-1 min-w-fit h-14 sm:h-14 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-primary via-amber-500 to-primary text-white hover:opacity-90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg transition-all duration-300 border-2 border-amber-400/30 whitespace-nowrap"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
            Auto-Generate
          </Button>

          {/* Customize Pitch Button (Secondary) */}
          <Button
            onClick={handleCustomizePitch}
            disabled={(!projectInput.trim() && !scrapedData) || isScrapingUrl}
            variant="outline"
            size="lg"
            className="flex-1 min-w-fit h-14 sm:h-14 px-5 sm:px-6 rounded-xl border-2 border-primary/40 hover:border-primary/60 hover:bg-primary/10 font-bold text-base sm:text-lg text-foreground transition-all duration-300 whitespace-nowrap"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
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

      {/* Document Preview Modal */}
      {pendingFileData && uploadedFileName && (
        <DocumentPreviewModal
          open={showPreviewModal}
          onOpenChange={(open) => {
            setShowPreviewModal(open);
            if (!open) {
              setPendingFileData(null);
            }
          }}
          data={pendingFileData}
          filename={uploadedFileName}
          extractedImages={extractedImages}
          onConfirm={handleConfirmFileData}
        />
      )}
    </section>
  );
};