import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, Clock, Zap, Info, ArrowRight, Link2, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { isUrl, scrapeUrl, ScrapedProjectData } from "@/lib/api/firecrawl";
import { toast } from "@/hooks/use-toast";
// Custom hook for counting animation
const useCountUp = (end: number, duration: number = 1500, start: boolean = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);
  return count;
};
interface TimeEaterProps {
  onSubmit: (idea: string, scrapedData?: ScrapedProjectData) => void;
  onAutoGenerate: (idea: string, scrapedData?: ScrapedProjectData) => void;
}
interface TaskBreakdown {
  id: string;
  label: string;
  sublabel: string;
  manualMinutes: number;
  aiMinutes: number;
  manualColor: string;
  aiColor: string;
  isFixed?: boolean;
}

// Formula: Total = (Pitch_Min * 50m) + 90m (Tech/Demo) + 45m (Practice)
const getTasksForDuration = (pitchMinutes: number): TaskBreakdown[] => {
  const storyMinutes = 45; // ~45min solving the "Why"
  const slideMinutes = pitchMinutes * 30; // 5 slides x 30min for 3 min pitch = 150min
  const demoMinutes = 90; // Tech & Fallbacks
  const rehearsalMinutes = 45; // Stress Run

  return [{
    id: "story",
    label: "Story Structure",
    sublabel: "Solving the 'Why'",
    manualMinutes: storyMinutes,
    aiMinutes: 5,
    manualColor: "bg-slate-400",
    aiColor: "bg-emerald-500"
  }, {
    id: "slides",
    label: "Slides",
    sublabel: `${Math.ceil(pitchMinutes * 1.5)} slides × 30min`,
    manualMinutes: slideMinutes,
    aiMinutes: 5,
    manualColor: "bg-red-400",
    aiColor: "bg-emerald-500"
  }, {
    id: "demo",
    label: "Demo Prep",
    sublabel: "Tech & Fallbacks",
    manualMinutes: demoMinutes,
    aiMinutes: 30,
    manualColor: "bg-orange-400",
    aiColor: "bg-emerald-500"
  }, {
    id: "rehearsal",
    label: "Rehearsal",
    sublabel: "Stress Run",
    manualMinutes: rehearsalMinutes,
    aiMinutes: 45,
    manualColor: "bg-blue-400",
    aiColor: "bg-blue-400",
    isFixed: true
  }];
};
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
export const TimeEater = ({
  onSubmit,
  onAutoGenerate
}: TimeEaterProps) => {
  const [projectName, setProjectName] = useState("");
  const [pitchDuration, setPitchDuration] = useState("3");
  const [isFocused, setIsFocused] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProjectData | null>(null);
  
  const tasks = getTasksForDuration(parseInt(pitchDuration));
  const totalManual = tasks.reduce((sum, t) => sum + t.manualMinutes, 0);
  const totalAI = tasks.reduce((sum, t) => sum + t.aiMinutes, 0);
  const timeSaved = totalManual - totalAI;
  const percentageSaved = Math.round(timeSaved / totalManual * 100);
  const maxManualMinutes = Math.max(...tasks.map(t => t.manualMinutes));

  // Counting animations
  const animatedTimeSaved = useCountUp(timeSaved, 1500, animateBars);
  const animatedPercentage = useCountUp(percentageSaved, 1500, animateBars);
  const animatedTotalAI = useCountUp(totalAI, 1500, animateBars);
  
  // Check if input is a URL
  const inputIsUrl = isUrl(projectName);
  
  // Handle URL scraping with real Firecrawl
  const handleUrlScrape = async (url: string) => {
    setIsScrapingUrl(true);
    try {
      const response = await scrapeUrl(url);
      if (response.success && response.data) {
        setScrapedData(response.data);
        toast({
          title: "Website Scanned!",
          description: `Extracted data from ${url.slice(0, 30)}...`,
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
  
  // Trigger URL scraping when URL is detected
  useEffect(() => {
    if (inputIsUrl && projectName.length > 10 && !isScrapingUrl && !scrapedData) {
      const debounce = setTimeout(() => {
        handleUrlScrape(projectName);
      }, 500);
      return () => clearTimeout(debounce);
    }
    // Reset scraped data when input changes to non-URL
    if (!inputIsUrl && scrapedData) {
      setScrapedData(null);
    }
  }, [projectName, inputIsUrl, isScrapingUrl, scrapedData]);
  
  useEffect(() => {
    const shouldShow = projectName.length > 3 || scrapedData;
    if (shouldShow && !showVisualization) {
      setShowVisualization(true);
      setTimeout(() => setAnimateBars(true), 300);
    } else if (!shouldShow) {
      setShowVisualization(false);
      setAnimateBars(false);
    }
  }, [projectName, scrapedData, showVisualization]);
  
  const handleCustomize = () => {
    const idea = scrapedData?.name || projectName.trim();
    if (idea) {
      onSubmit(idea, scrapedData || undefined);
    }
  };
  
  const handleAutoGenerate = () => {
    const idea = scrapedData?.name || projectName.trim();
    if (idea) {
      onAutoGenerate(idea, scrapedData || undefined);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && projectName.trim()) {
      handleCustomize();
    }
  };
  return <div className="w-full max-w-5xl mx-auto px-4">
      {/* Hero Input Section */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="mb-12">
        <div className="max-w-2xl mx-auto">
          {/* Input with floating label effect */}
          <div className="relative mb-4">
            <motion.div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" animate={{
            opacity: isFocused ? 0.5 : 0.2,
            scale: isFocused ? 1.02 : 1
          }} transition={{
            duration: 0.3
          }} />

            <div className={`
                glass-premium rounded-2xl p-1.5 border transition-all duration-300
                ${isFocused ? "border-primary/50 shadow-lg shadow-primary/10" : "border-white/10"}
              `}>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  {inputIsUrl ? (
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                  ) : (
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                  )}
                  {isScrapingUrl && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  <input 
                    type="text" 
                    value={projectName} 
                    onChange={e => setProjectName(e.target.value)} 
                    onFocus={() => setIsFocused(true)} 
                    onBlur={() => setIsFocused(false)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Enter project name, description, or paste a URL..." 
                    className="
                      w-full h-14 pl-12 pr-12 
                      bg-background text-foreground text-base
                      placeholder:text-muted-foreground/60
                      focus:outline-none
                      rounded-xl
                      border-2 border-foreground/30 focus:border-primary
                      transition-colors duration-200
                    " 
                  />
                </div>

                {/* Pitch Duration Selector */}
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                    Pitch:
                  </span>
                  <Select value={pitchDuration} onValueChange={setPitchDuration}>
                    <SelectTrigger className="w-24 h-10 bg-white/5 border-white/10 text-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 min</SelectItem>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="7">7 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Type your project name or paste a URL to see how much time you'll save
          </p>
        </div>
      </motion.div>

      {/* Time Breakdown Visualization */}
      <AnimatePresence>
        {showVisualization && <motion.div initial={{
        opacity: 0,
        y: 40,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} transition={{
        duration: 0.5,
        ease: "easeOut"
      }}>
            {/* Comparison Columns */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Manual Column */}
              <motion.div initial={{
            opacity: 0,
            x: -30
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.2
          }} className="glass-premium rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-muted-foreground">
                        The Manual Grind
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-mono font-bold text-red-400">
                        ~{formatTime(totalManual)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tasks.map((task, index) => {
                  const widthPercent = task.manualMinutes / maxManualMinutes * 100;
                  return <motion.div key={task.id} initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.3 + index * 0.1
                  }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground font-medium">
                              {task.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {task.sublabel}
                            </span>
                          </div>
                          <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                            <motion.div className={`h-full ${task.manualColor} rounded-lg flex items-center justify-end pr-3`} initial={{
                        width: 0
                      }} animate={{
                        width: animateBars ? `${widthPercent}%` : 0
                      }} transition={{
                        duration: 0.6,
                        delay: 0.4 + index * 0.1,
                        ease: "easeOut"
                      }} style={{
                        animation: animateBars ? `pulse 3s ease-in-out infinite ${index * 0.3}s` : "none"
                      }}>
                              <span className="text-xs font-mono font-semibold text-white/90">
                                {formatTime(task.manualMinutes)}
                              </span>
                            </motion.div>
                          </div>
                        </motion.div>;
                })}
                  </div>
                </div>
              </motion.div>

              {/* AI Column */}
              <motion.div initial={{
            opacity: 0,
            x: 30
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.3
          }} className="glass-premium rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-muted-foreground">
                        With PitchDeck AI
                      </span>
                    </div>
                    <motion.div className="text-right" animate={{
                  scale: [1, 1.05, 1]
                }} transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}>
                      <span className="text-3xl font-mono font-bold text-emerald-400">
                        ~{formatTime(animatedTotalAI)}
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          {animatedPercentage}% faster
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    {tasks.map((task, index) => {
                  const widthPercent = task.aiMinutes / maxManualMinutes * 100;
                  return <motion.div key={task.id} initial={{
                    opacity: 0,
                    x: 20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.4 + index * 0.1
                  }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground font-medium">
                                {task.label}
                              </span>
                              {!task.isFixed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                                  {task.id === "story" ? "AI Generated" : task.id === "slides" ? "Auto-Layout" : "AI Scripted"}
                                </span>}
                              {task.isFixed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                                  Unchanged
                                </span>}
                            </div>
                          </div>
                          <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                            <motion.div className={`h-full ${task.aiColor} rounded-lg flex items-center justify-end pr-3`} initial={{
                        width: 0
                      }} animate={{
                        width: animateBars ? `${Math.max(widthPercent, 8)}%` : 0
                      }} transition={{
                        duration: 0.6,
                        delay: 0.5 + index * 0.1,
                        ease: "easeOut"
                      }}>
                              <span className="text-xs font-mono font-semibold text-white/90">
                                {formatTime(task.aiMinutes)}
                              </span>
                            </motion.div>
                          </div>
                        </motion.div>;
                })}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Time Saved Badge */}
            <motion.div initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.8,
          type: "spring",
          damping: 15
        }} className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-premium border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Time Saved:</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    ~{formatTime(animatedTimeSaved)}
                  </span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-300">
                    {animatedPercentage}% faster
                  </span>
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Pro Tip Accordion */}
            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 1
        }} className="max-w-2xl mx-auto mb-10">
              <Accordion type="single" collapsible className="glass-premium rounded-xl border border-white/10">
                <AccordionItem value="formula" className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        How we calculate this?
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p className="text-foreground font-medium">
                        The Hackathon Rule-of-Thumb:
                      </p>
                      <p className="font-mono text-xs bg-white/5 rounded-lg px-3 py-2 text-primary">
                        1 minute of pitch = 50 minutes of prep + Tech Setup + Rehearsal
                      </p>
                      <p className="text-yellow-400/80 text-xs italic">
                        💡 Pro tip: Don't make the mistake of starting with slides. Start
                        with the Story.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>

            {/* CTA Buttons - Two Options */}
            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 1.1
        }} className="flex flex-col items-center gap-4">
              {/* Scraped data preview */}
              {scrapedData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <p className="text-xs text-muted-foreground mb-1">Extracted from URL:</p>
                  <p className="font-medium text-foreground">{scrapedData.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{scrapedData.problem}</p>
                </motion.div>
              )}
              
              {/* Two CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Customize Pitch - Primary */}
                <Button 
                  onClick={handleCustomize} 
                  disabled={!projectName.trim() && !scrapedData} 
                  size="lg" 
                  className="h-14 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed group text-base transition-all duration-300"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Customize Pitch</span>
                </Button>
                
                {/* Auto-Generate - Gold/Gradient */}
                <Button 
                  onClick={handleAutoGenerate} 
                  disabled={!projectName.trim() && !scrapedData} 
                  size="lg" 
                  className="h-14 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed group text-base transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Auto-Generate ⚡</span>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  No signup required • Customize = step-by-step wizard • Auto = instant pitch
                </span>
              </p>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};