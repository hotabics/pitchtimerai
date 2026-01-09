// AI Coach Video Upload - Drag & Drop upload flow

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Check, Loader2, ArrowLeft, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface VideoUploadProps {
  onVideoReady: (videoBlob: Blob, videoUrl: string) => void;
  onBack: () => void;
}

type ProcessingStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete";

export const VideoUpload = ({ onVideoReady, onBack }: VideoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
  const MAX_SIZE_MB = 500;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload an MP4, MOV, or WebM video file.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const processVideo = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setProcessingStep("uploading");
    setProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 30) {
          clearInterval(uploadInterval);
          return 30;
        }
        return prev + 5;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 800));
    clearInterval(uploadInterval);

    // Extracting audio step
    setProcessingStep("extracting");
    setProgress(30);

    const extractInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 60) {
          clearInterval(extractInterval);
          return 60;
        }
        return prev + 3;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearInterval(extractInterval);

    // Analyzing step
    setProcessingStep("analyzing");
    setProgress(60);

    const analyzeInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(analyzeInterval);
          return 95;
        }
        return prev + 2;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    clearInterval(analyzeInterval);

    // Complete
    setProcessingStep("complete");
    setProgress(100);

    // Create object URL and convert to blob for unified processing
    const videoUrl = URL.createObjectURL(file);
    
    // Small delay for completion animation
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onVideoReady(file, videoUrl);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await processVideo(file);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await processVideo(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStep("idle");
    setProgress(0);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getStepLabel = (step: ProcessingStep) => {
    switch (step) {
      case "uploading": return "Uploading video...";
      case "extracting": return "Extracting audio...";
      case "analyzing": return "Analyzing body language...";
      case "complete": return "Analysis complete!";
      default: return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Upload & Analyze</h2>
          <p className="text-muted-foreground">
            Upload a video recording to get AI-powered feedback
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
          processingStep !== "idle"
            ? "border-primary/30 bg-primary/5"
            : isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : error
            ? "border-destructive/50 bg-destructive/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (processingStep === "idle") setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={processingStep !== "idle"}
        />

        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {processingStep === "idle" && !error && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ y: isDragging ? -10 : 0 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg"
                >
                  <Upload className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragging ? "Drop your video here!" : "Drop your video to analyze"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • MP4, MOV, WebM up to {MAX_SIZE_MB}MB
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <FileVideo className="w-4 h-4" />
                  Browse Files
                </Button>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <p className="text-lg font-medium text-destructive">{error}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please try again with a supported format
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
              </motion.div>
            )}

            {processingStep !== "idle" && processingStep !== "complete" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6 w-full max-w-md"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </motion.div>

                <div>
                  <p className="text-lg font-medium">{getStepLabel(processingStep)}</p>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedFile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                </div>

                {/* Processing steps indicator */}
                <div className="flex items-center justify-center gap-8 text-sm">
                  <div className={`flex items-center gap-2 ${processingStep === "uploading" ? "text-primary" : "text-muted-foreground"}`}>
                    {progress >= 30 ? <Check className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    Upload
                  </div>
                  <div className={`flex items-center gap-2 ${processingStep === "extracting" ? "text-primary" : "text-muted-foreground"}`}>
                    {progress >= 60 ? <Check className="w-4 h-4 text-green-500" /> : progress >= 30 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                    Extract
                  </div>
                  <div className={`flex items-center gap-2 ${processingStep === "analyzing" ? "text-primary" : "text-muted-foreground"}`}>
                    {progress >= 95 ? <Check className="w-4 h-4 text-green-500" /> : progress >= 60 ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                    Analyze
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </motion.div>
            )}

            {processingStep === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="text-lg font-medium text-green-600">Analysis Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">Preparing your results...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips */}
      {processingStep === "idle" && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-muted/50 p-4"
        >
          <p className="text-sm font-medium mb-2">📹 Tips for best results:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Record in good lighting with your face clearly visible</li>
            <li>• Keep the camera at eye level for accurate eye contact analysis</li>
            <li>• Aim for videos between 1-10 minutes for detailed feedback</li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};
