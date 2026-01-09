// AI Coach Studio Hub - Selection Screen for Live vs Upload vs Phone workflow

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Video, Upload, Camera, FileVideo, Sparkles, ArrowRight, Smartphone, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MobileCompanionModal } from "./MobileCompanionModal";

interface StudioHubProps {
  onSelectLive: () => void;
  onSelectUpload: () => void;
  onMobileVideoReceived?: (videoUrl: string) => void;
}

export const StudioHub = ({ onSelectLive, onSelectUpload, onMobileVideoReceived }: StudioHubProps) => {
  const [hoveredCard, setHoveredCard] = useState<"live" | "upload" | "phone" | null>(null);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileSessionId, setMobileSessionId] = useState<string>("");

  const handlePhoneClick = () => {
    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    setMobileSessionId(sessionId);
    setShowMobileModal(true);
  };

  const handleMobileVideoReceived = (videoUrl: string) => {
    setShowMobileModal(false);
    onMobileVideoReceived?.(videoUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">AI Coach Studio</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose how you want to practice and get AI-powered feedback on your pitch
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Live Studio Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onHoverStart={() => setHoveredCard("live")}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <Card
            className={`relative cursor-pointer overflow-hidden transition-all duration-300 h-full ${
              hoveredCard === "live"
                ? "ring-2 ring-primary shadow-xl shadow-primary/20 scale-[1.02]"
                : "hover:shadow-lg"
            }`}
            onClick={onSelectLive}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6 relative">
              {/* Icon */}
              <motion.div
                animate={{
                  scale: hoveredCard === "live" ? 1.1 : 1,
                  rotate: hoveredCard === "live" ? 5 : 0,
                }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <Video className="w-10 h-10 text-white" />
                </div>
                {/* Live indicator */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Live Studio</h3>
                <p className="text-muted-foreground text-sm">
                  Practice with Teleprompter & Real-time Feedback
                </p>
              </div>

              {/* Features */}
              <ul className="text-sm text-left space-y-2 w-full">
                <li className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Live camera recording</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Real-time eye contact tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-primary" />
                  <span>Teleprompter mode available</span>
                </li>
              </ul>

              {/* CTA */}
              <Button className="w-full gap-2 mt-4">
                <Video className="w-4 h-4" />
                Start Recording
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload & Audit Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onHoverStart={() => setHoveredCard("upload")}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <Card
            className={`relative cursor-pointer overflow-hidden transition-all duration-300 h-full ${
              hoveredCard === "upload"
                ? "ring-2 ring-primary shadow-xl shadow-primary/20 scale-[1.02]"
                : "hover:shadow-lg"
            }`}
            onClick={onSelectUpload}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6 relative">
              {/* Icon */}
              <motion.div
                animate={{
                  scale: hoveredCard === "upload" ? 1.1 : 1,
                  rotate: hoveredCard === "upload" ? -5 : 0,
                }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Upload className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Upload & Audit</h3>
                <p className="text-muted-foreground text-sm">
                  Analyze an existing video (Zoom, MP4, MOV)
                </p>
              </div>

              {/* Features */}
              <ul className="text-sm text-left space-y-2 w-full">
                <li className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-primary" />
                  <span>Upload MP4, MOV, WebM files</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>AI-powered analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Practice offline, analyze later</span>
                </li>
              </ul>

              {/* CTA */}
              <Button variant="outline" className="w-full gap-2 mt-4">
                <Upload className="w-4 h-4" />
                Upload Video
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        {/* Use Phone Camera Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onHoverStart={() => setHoveredCard("phone")}
          onHoverEnd={() => setHoveredCard(null)}
          className="md:col-span-2"
        >
          <Card
            className={`relative cursor-pointer overflow-hidden transition-all duration-300 ${
              hoveredCard === "phone"
                ? "ring-2 ring-primary shadow-xl shadow-primary/20 scale-[1.01]"
                : "hover:shadow-lg"
            }`}
            onClick={handlePhoneClick}
          >
            <CardContent className="p-6 flex items-center gap-6">
              {/* Icon */}
              <motion.div
                animate={{
                  scale: hoveredCard === "phone" ? 1.1 : 1,
                }}
                className="relative shrink-0"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center shadow">
                  <QrCode className="w-4 h-4 text-primary" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-bold">Use Phone Camera 📱</h3>
                <p className="text-muted-foreground text-sm">
                  Scan QR code to record on your phone, see results on your desktop
                </p>
              </div>

              {/* CTA */}
              <Button variant="secondary" className="shrink-0 gap-2">
                <QrCode className="w-4 h-4" />
                Show QR Code
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-muted-foreground"
      >
        💡 Tip: Use your phone for mobility, or upload a pre-recorded video for detailed AI analysis
      </motion.p>

      {/* Mobile Companion Modal */}
      <MobileCompanionModal
        open={showMobileModal}
        onOpenChange={setShowMobileModal}
        sessionId={mobileSessionId}
        onVideoReceived={handleMobileVideoReceived}
      />
    </motion.div>
  );
};
