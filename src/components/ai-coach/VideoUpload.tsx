// AI Coach Video Upload - Drag & Drop upload flow with URL support

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Check, Loader2, ArrowLeft, AlertCircle, X, Link2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface VideoUploadProps {
  onVideoReady: (videoBlob: Blob, videoUrl: string) => void;
  onBack: () => void;
}

type ProcessingStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete";
type InputMode = "file" | "url";

export const VideoUpload = ({ onVideoReady, onBack }: VideoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [videoUrl, setVideoUrl] = useState("");
  const [urlSource, setUrlSource] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
  const MAX_SIZE_GB = 2;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload an MP4, MOV, or WebM video file.";
    }
    if (file.size > MAX_SIZE_GB * 1024 * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_SIZE_GB}GB.`;
    }
    return null;
  };

  // Detect video platform from URL
  const detectPlatform = (url: string): { platform: string; isValid: boolean } => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
      return { platform: "YouTube", isValid: true };
    }
    if (urlLower.includes("vimeo.com")) {
      return { platform: "Vimeo", isValid: true };
    }
    if (urlLower.includes("loom.com")) {
      return { platform: "Loom", isValid: true };
    }
    if (urlLower.includes("zoom.us") || urlLower.includes("zoom.com")) {
      return { platform: "Zoom", isValid: true };
    }
    if (urlLower.includes("drive.google.com")) {
      return { platform: "Google Drive", isValid: true };
    }
    if (urlLower.includes("dropbox.com")) {
      return { platform: "Dropbox", isValid: true };
    }
    if (urlLower.match(/\.(mp4|mov|webm|m4v)(\?|$)/i)) {
      return { platform: "Direct Video", isValid: true };
    }
    return { platform: "Unknown", isValid: false };
  };

  // Process URL-based video
  const processVideoUrl = async (url: string) => {
    setError(null);
    const { platform, isValid } = detectPlatform(url);
    
    if (!isValid) {
      setError("Please enter a valid video URL from YouTube, Vimeo, Loom, Zoom, Google Drive, Dropbox, or a direct video link.");
      return;
    }

    setUrlSource(platform);
    setProcessingStep("uploading");
    setProgress(0);

    // Simulate fetching video from URL
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 30) {
          clearInterval(uploadInterval);
          return 30;
        }
        return prev + 3;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 1200));
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

    // For demo: create a mock blob (in production, this would be fetched from the URL)
    // Note: Due to CORS, we can't directly fetch most video URLs from the browser
    const mockBlob = new Blob([], { type: "video/mp4" });
    
    toast.success(`${platform} video loaded successfully!`);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Pass the URL directly for platforms that support embedding
    onVideoReady(mockBlob, url);
  };

  const handleUrlSubmit = () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }
    processVideoUrl(videoUrl.trim());
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
    setVideoUrl("");
    setUrlSource(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getStepLabel = (step: ProcessingStep) => {
    switch (step) {
      case "uploading": return urlSource ? `Fetching from ${urlSource}...` : "Uploading video...";
      case "extracting": return "Extracting audio...";
      case "analyzing": return "Analyzing body language...";
      case "complete": return "Analysis complete!";
      default: return "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

      {/* Input Mode Tabs */}
      {processingStep === "idle" && (
        <Tabs value={inputMode} onValueChange={(v) => { setInputMode(v as InputMode); setError(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="file" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link2 className="w-4 h-4" />
              Paste URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-6">
            {/* File Upload Zone */}
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : error
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
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
              />

              <div className="p-12 flex flex-col items-center justify-center min-h-[350px]">
                {!error ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                        MP4, MOV, WebM up to {MAX_SIZE_GB}GB
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <FileVideo className="w-4 h-4" />
                      Browse Files
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-6">
            {/* URL Input Zone */}
            <div className={`rounded-xl border-2 transition-all duration-300 p-8 ${
              error ? "border-destructive/50 bg-destructive/5" : "border-muted-foreground/25"
            }`}>
              <div className="flex flex-col items-center justify-center min-h-[350px] space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Youtube className="w-10 h-10 text-white" />
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-medium">Paste a video URL</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    YouTube, Vimeo, Loom, Zoom, Google Drive, or direct video links
                  </p>
                </div>

                <div className="w-full max-w-lg space-y-4">
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or video URL"
                    value={videoUrl}
                    onChange={(e) => { setVideoUrl(e.target.value); setError(null); }}
                    className="text-center h-12"
                  />
                  
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button 
                    onClick={handleUrlSubmit} 
                    className="w-full gap-2"
                    disabled={!videoUrl.trim()}
                  >
                    <Link2 className="w-4 h-4" />
                    Analyze Video
                  </Button>
                </div>

                {/* Supported platforms */}
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-full bg-muted">YouTube</span>
                  <span className="px-2 py-1 rounded-full bg-muted">Vimeo</span>
                  <span className="px-2 py-1 rounded-full bg-muted">Loom</span>
                  <span className="px-2 py-1 rounded-full bg-muted">Zoom</span>
                  <span className="px-2 py-1 rounded-full bg-muted">Google Drive</span>
                  <span className="px-2 py-1 rounded-full bg-muted">Dropbox</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Processing State */}
      {processingStep !== "idle" && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-12">
          <div className="flex flex-col items-center justify-center min-h-[350px]">
            <AnimatePresence mode="wait">
              {processingStep !== "complete" && (
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                    {urlSource && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Source: {urlSource}
                      </p>
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
                      {urlSource ? "Fetch" : "Upload"}
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
      )}


      {/* Tips */}
      {processingStep === "idle" && (
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
            {inputMode === "url" && (
              <li>• Make sure the video is publicly accessible or shared with a link</li>
            )}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};
