// Detailed Video Review - Smart Timeline with synchronized transcript

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  TrendingUp,
  AlertTriangle,
  Check,
  ChevronRight,
  Volume2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAICoachStore } from '@/stores/aiCoachStore';

interface TimelineEvent {
  time: number; // seconds
  type: 'filler' | 'posture' | 'sway' | 'eyeContact' | 'good';
  msg: string;
}

interface GlowGrow {
  type: 'glow' | 'grow';
  text: string;
  timestamp?: number; // optional linked timestamp
}

interface VideoReviewProps {
  videoUrl?: string;
  onClose: () => void;
}

export const VideoReview = ({ videoUrl, onClose }: VideoReviewProps) => {
  const { results, recordingData } = useAICoachStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);

  // Generate mock timeline events from frame data
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!recordingData?.frameData) return [];
    
    const events: TimelineEvent[] = [];
    const frameData = recordingData.frameData;
    
    // Sample every 5 seconds for demo
    for (let i = 0; i < frameData.length; i += 100) {
      const frame = frameData[i];
      const timeSec = Math.floor(frame.timestamp / 1000);
      
      if (!frame.eyeContact && Math.random() > 0.7) {
        events.push({ time: timeSec, type: 'eyeContact', msg: 'Looking away' });
      }
      if (frame.postureScore !== undefined && frame.postureScore < 70) {
        events.push({ time: timeSec, type: 'posture', msg: 'Poor posture detected' });
      }
      if (frame.bodyStability !== undefined && frame.bodyStability < 60) {
        events.push({ time: timeSec, type: 'sway', msg: 'Swaying detected' });
      }
    }
    
    // Add some filler word events (mock)
    const fillerBreakdown = results?.deliveryMetrics.fillerBreakdown || {};
    Object.entries(fillerBreakdown).forEach(([word, count], idx) => {
      for (let i = 0; i < Math.min(count, 3); i++) {
        events.push({
          time: 10 + idx * 15 + i * 30,
          type: 'filler',
          msg: `Filler: "${word}"`,
        });
      }
    });
    
    return events.sort((a, b) => a.time - b.time);
  }, [recordingData, results]);

  // Generate Glows and Grows from content analysis
  const glowsGrows: GlowGrow[] = useMemo(() => {
    const items: GlowGrow[] = [];
    
    // Glows (positives)
    if (results?.deliveryMetrics.eyeContactPercent && results.deliveryMetrics.eyeContactPercent >= 70) {
      items.push({ type: 'glow', text: `Excellent eye contact at ${results.deliveryMetrics.eyeContactPercent}%` });
    }
    if (results?.deliveryMetrics.postureScore && results.deliveryMetrics.postureScore >= 80) {
      items.push({ type: 'glow', text: 'Strong posture maintained throughout the pitch' });
    }
    if (results?.deliveryMetrics.handsVisiblePercent && results.deliveryMetrics.handsVisiblePercent >= 70) {
      items.push({ type: 'glow', text: `Hands visible ${results.deliveryMetrics.handsVisiblePercent}% of the time - open body language` });
    }
    if (results?.contentAnalysis?.strengths) {
      results.contentAnalysis.strengths.forEach(s => {
        items.push({ type: 'glow', text: s });
      });
    }
    
    // Grows (improvements)
    if (results?.deliveryMetrics.eyeContactPercent && results.deliveryMetrics.eyeContactPercent < 70) {
      items.push({ type: 'grow', text: 'Look at the camera more often', timestamp: 15 });
    }
    if (results?.deliveryMetrics.wpm && results.deliveryMetrics.wpm > 160) {
      items.push({ type: 'grow', text: 'Slow down during key points - let numbers sink in', timestamp: 45 });
    }
    if (results?.deliveryMetrics.fillerCount && results.deliveryMetrics.fillerCount > 5) {
      items.push({ type: 'grow', text: `Reduce filler words (${results.deliveryMetrics.fillerCount} detected)`, timestamp: 30 });
    }
    if (results?.contentAnalysis?.recommendations) {
      results.contentAnalysis.recommendations.slice(0, 3).forEach((r, i) => {
        items.push({ type: 'grow', text: r, timestamp: 60 + i * 30 });
      });
    }
    
    return items;
  }, [results]);

  // Performance heatmap data (for timeline background)
  const getPerformanceAtTime = (timeSec: number): 'good' | 'warning' | 'bad' => {
    const eventsAtTime = timelineEvents.filter(e => Math.abs(e.time - timeSec) < 3);
    if (eventsAtTime.length === 0) return 'good';
    if (eventsAtTime.length === 1) return 'warning';
    return 'bad';
  };

  // Video controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get event icon
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'filler': return '🟡';
      case 'posture': return '🔴';
      case 'sway': return '🔴';
      case 'eyeContact': return '👁️';
      case 'good': return '✅';
      default: return '⚪';
    }
  };

  // Create blob URL for video
  const videoBlobUrl = useMemo(() => {
    if (videoUrl) return videoUrl;
    if (recordingData?.videoBlob) {
      return URL.createObjectURL(recordingData.videoBlob);
    }
    return null;
  }, [videoUrl, recordingData?.videoBlob]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (videoBlobUrl && !videoUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl, videoUrl]);

  const actualDuration = duration || recordingData?.durationSeconds || 120;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Detailed Video Review</h2>
          <p className="text-muted-foreground">
            Click timeline events to jump to specific moments
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to Results
        </Button>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Video + Timeline (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            {videoBlobUrl ? (
              <video
                ref={videoRef}
                src={videoBlobUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p>Video preview not available</p>
              </div>
            )}

            {/* Video controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(actualDuration)}
                </span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Volume2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Smart Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Smart Timeline
                <Badge variant="outline" className="text-xs">
                  {timelineEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timeline visualization */}
              <div 
                ref={timelineRef}
                className="relative h-16 bg-muted rounded-lg overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  seekTo(percent * actualDuration);
                }}
              >
                {/* Heatmap background */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: Math.ceil(actualDuration / 5) }).map((_, i) => {
                    const perf = getPerformanceAtTime(i * 5);
                    return (
                      <div
                        key={i}
                        className={`flex-1 ${
                          perf === 'good' ? 'bg-green-500/20' :
                          perf === 'warning' ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Event markers */}
                {timelineEvents.map((event, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <button
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center text-sm hover:scale-125 transition-transform z-10"
                        style={{ left: `${(event.time / actualDuration) * 100}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(event.time);
                        }}
                        onMouseEnter={() => setHoveredEvent(event)}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        {getEventIcon(event.type)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{formatTime(event.time)}</p>
                      <p className="text-xs text-muted-foreground">{event.msg}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                  style={{ left: `${(currentTime / actualDuration) * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">🟡 Filler Word</span>
                <span className="flex items-center gap-1">🔴 Body Language Issue</span>
                <span className="flex items-center gap-1">👁️ Eye Contact</span>
                <span className="flex items-center gap-1 ml-auto">
                  <div className="w-3 h-3 rounded bg-green-500/40" /> Good
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500/40" /> Needs Work
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Transcript + Glows/Grows */}
        <div className="space-y-4">
          {/* Transcript */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] overflow-y-auto p-3 rounded-lg bg-muted/50 text-sm leading-relaxed">
                {results?.transcript ? (
                  <p className="whitespace-pre-wrap">
                    {results.transcript.split(' ').map((word, idx) => {
                      const isFillerWord = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'literally'].some(
                        f => word.toLowerCase().replace(/[.,!?]/g, '') === f
                      );
                      return (
                        <span
                          key={idx}
                          className={isFillerWord ? 'text-red-500 font-medium' : ''}
                        >
                          {word}{' '}
                        </span>
                      );
                    })}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Transcript not available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Glows & Grows */}
          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="glows">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="glows" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Glows
                  </TabsTrigger>
                  <TabsTrigger value="grows" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Grows
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="glows" className="mt-4 space-y-2">
                  {glowsGrows.filter(g => g.type === 'glow').length > 0 ? (
                    glowsGrows.filter(g => g.type === 'glow').map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{item.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keep practicing to unlock achievements!
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="grows" className="mt-4 space-y-2">
                  {glowsGrows.filter(g => g.type === 'grow').map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/15 transition-colors"
                      onClick={() => item.timestamp && seekTo(item.timestamp)}
                    >
                      <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{item.text}</p>
                        {item.timestamp && (
                          <button 
                            className="text-xs text-orange-500 hover:underline flex items-center gap-1 mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              seekTo(item.timestamp!);
                            }}
                          >
                            <ChevronRight className="w-3 h-3" />
                            Jump to {formatTime(item.timestamp)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
