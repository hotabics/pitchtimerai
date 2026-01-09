import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Twitter, Linkedin, Link2, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ShareableAchievement {
  name: string;
  icon: string;
  description: string;
}

interface SocialShareProps {
  achievement: ShareableAchievement;
  score?: number;
  totalPitches?: number;
  streak?: number;
}

export const SocialShare = ({ achievement, score, totalPitches, streak }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getShareText = () => {
    let text = `🎉 I just earned the "${achievement.name}" badge on PitchDeck AI! ${achievement.icon}`;
    if (score) text += `\n\n📊 Best Score: ${(score / 10).toFixed(1)}/10`;
    if (totalPitches) text += `\n🎤 Total Pitches: ${totalPitches}`;
    if (streak && streak > 0) text += `\n🔥 Current Streak: ${streak} days`;
    text += `\n\n#PitchDeckAI #PublicSpeaking #PitchPractice`;
    return text;
  };

  const getShareUrl = () => {
    return window.location.origin;
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToLinkedIn = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${getShareUrl()}\n\n${getShareText()}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCard = async () => {
    // Create a shareable card as canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Achievement icon
    ctx.font = "120px serif";
    ctx.textAlign = "center";
    ctx.fillText(achievement.icon, 600, 200);

    // Achievement name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Inter, sans-serif";
    ctx.fillText(achievement.name, 600, 300);

    // Description
    ctx.fillStyle = "#a0a0a0";
    ctx.font = "24px Inter, sans-serif";
    ctx.fillText(achievement.description, 600, 360);

    // Stats
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Inter, sans-serif";
    let statsY = 440;
    if (score) {
      ctx.fillText(`Best Score: ${(score / 10).toFixed(1)}/10`, 600, statsY);
      statsY += 50;
    }
    if (totalPitches) {
      ctx.fillText(`Total Pitches: ${totalPitches}`, 600, statsY);
      statsY += 50;
    }

    // Branding
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText("PitchDeck AI", 600, 580);

    // Download
    const link = document.createElement("a");
    link.download = `pitchdeck-${achievement.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    
    toast.success("Achievement card downloaded!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Share achievement">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{achievement.icon}</span>
            Share: {achievement.name}
          </DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center border">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <span className="text-5xl">{achievement.icon}</span>
            <h3 className="font-bold text-lg">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            
            <div className="flex justify-center gap-6 pt-2 text-sm">
              {score !== undefined && score > 0 && (
                <div>
                  <p className="font-semibold">{(score / 10).toFixed(1)}/10</p>
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
              )}
              {totalPitches !== undefined && totalPitches > 0 && (
                <div>
                  <p className="font-semibold">{totalPitches}</p>
                  <p className="text-xs text-muted-foreground">Pitches</p>
                </div>
              )}
              {streak !== undefined && streak > 0 && (
                <div>
                  <p className="font-semibold">{streak} 🔥</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={shareToTwitter} variant="outline" className="gap-2">
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button onClick={shareToLinkedIn} variant="outline" className="gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button onClick={copyLink} variant="outline" className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button onClick={downloadCard} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
