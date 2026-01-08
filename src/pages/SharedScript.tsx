import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, ArrowLeft, Copy, CheckCheck, Twitter, Linkedin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trackConfigs, TrackType } from "@/lib/tracks";

interface SpeechBlock {
  timeStart: string;
  timeEnd: string;
  title: string;
  content: string;
  isDemo?: boolean;
}

interface SharedScript {
  id: string;
  idea: string;
  track: string;
  audience_label: string | null;
  speech_blocks: SpeechBlock[];
  total_words: number | null;
  created_at: string;
}

const SPEAKING_RATE = 130;

const SharedScript = () => {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<SharedScript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const fetchScript = async () => {
      if (!id) {
        setError("Invalid script ID");
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("shared_scripts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        console.error("Failed to fetch script:", fetchError);
        setError("Failed to load script");
      } else if (!data) {
        setError("Script not found or has expired");
      } else {
        setScript({
          ...data,
          speech_blocks: data.speech_blocks as unknown as SpeechBlock[],
        });
      }
      setIsLoading(false);
    };

    fetchScript();
  }, [id]);

  const handleCopy = async () => {
    if (!script) return;
    const fullScript = script.speech_blocks
      .map((block) => `[${block.title}]\n${block.content}`)
      .join("\n\n");
    await navigator.clipboard.writeText(fullScript);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {error || "Script not found"}
          </h1>
          <p className="text-muted-foreground">
            This script may have expired or been removed.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Create Your Own Pitch
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const trackConfig = trackConfigs[script.track as TrackType];
  const totalWords = script.total_words || 
    script.speech_blocks.reduce((acc, block) => 
      acc + block.content.split(/\s+/).filter(w => w.length > 0).length, 0
    );
  const estimatedMinutes = Math.ceil(totalWords / SPEAKING_RATE);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Create your own pitch
          </Link>

          <div className="flex items-center gap-2 mb-3">
            {trackConfig && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white",
                trackConfig.color
              )}>
                {trackConfig.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{estimatedMinutes} min
            </span>
            <span className="text-xs text-muted-foreground">
              • {totalWords} words
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{script.idea}</h1>
          {script.audience_label && (
            <p className="text-sm text-muted-foreground mt-1">
              For: {script.audience_label}
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            onClick={handleCopy}
            className="gap-2"
          >
            {hasCopied ? (
              <CheckCheck className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {hasCopied ? "Copied!" : "Copy Script"}
          </Button>
          
          {/* Twitter Share */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const text = `Check out this pitch script: "${script.idea}"`;
              const url = window.location.href;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                "_blank",
                "width=550,height=420"
              );
            }}
          >
            <Twitter className="w-4 h-4" />
            Tweet
          </Button>
          
          {/* LinkedIn Share */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const url = window.location.href;
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                "_blank",
                "width=550,height=420"
              );
            }}
          >
            <Linkedin className="w-4 h-4" />
            Share
          </Button>
          
          {/* Native Share (if available) */}
          {navigator.share && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  await navigator.share({
                    title: script.idea,
                    text: `Check out this pitch script: "${script.idea}"`,
                    url: window.location.href,
                  });
                } catch (err) {
                  // User cancelled or error
                  console.log("Share cancelled");
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              More
            </Button>
          )}
        </motion.div>

        {/* Script Blocks */}
        <div className="space-y-4">
          {script.speech_blocks.map((block, index) => {
            const wordCount = block.content.split(/\s+/).filter(w => w.length > 0).length;
            const speakingSeconds = Math.round((wordCount / SPEAKING_RATE) * 60);
            const speakingTime = speakingSeconds >= 60 
              ? `${Math.floor(speakingSeconds / 60)}m ${speakingSeconds % 60}s`
              : `${speakingSeconds}s`;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-card border border-border rounded-xl p-5",
                  block.isDemo && "border-2 border-amber-500/50 bg-amber-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {block.title}
                    {block.isDemo && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded">
                        DEMO
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{block.timeStart} - {block.timeEnd}</span>
                    <span className="px-2 py-0.5 bg-muted rounded">~{speakingTime}</span>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {block.content}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Like this format?
          </h2>
          <p className="text-muted-foreground mb-4">
            Create your own pitch script in minutes with AI.
          </p>
          <Button asChild>
            <Link to="/">
              Create Your Pitch
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedScript;
