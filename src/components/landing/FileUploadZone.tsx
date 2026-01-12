import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, File, X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDocument, isFileSupported, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "@/lib/api/documentParser";
import { ScrapedProjectData } from "@/lib/api/firecrawl";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileProcessed: (data: ScrapedProjectData, filename: string) => void;
  onError: (error: string) => void;
  className?: string;
}

export const FileUploadZone = ({ onFileProcessed, onError, className }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "uploading" | "analyzing" | "complete" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      onError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    if (!isFileSupported(file)) {
      onError('Unsupported file type. Try .txt, .md, .pdf, .docx, or .pptx');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setProcessingStatus("uploading");

    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStatus("analyzing");

      const result = await parseDocument(file);

      if (result.success && result.data) {
        setProcessingStatus("complete");
        await new Promise(resolve => setTimeout(resolve, 300));
        onFileProcessed(result.data, file.name);
      } else {
        setProcessingStatus("error");
        onError(result.error || 'Failed to analyze document');
      }
    } catch (err) {
      setProcessingStatus("error");
      onError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FILE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {processingStatus === "idle" ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ 
                  y: isDragging ? -4 : 0,
                  scale: isDragging ? 1.1 : 1
                }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <FileUp className="w-6 h-6" />
              </motion.div>
              
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop file here" : "Upload a document"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  README, pitch deck, business plan, or any project docs
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center">
                {['.pdf', '.docx', '.txt', '.md', '.pptx'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border border-border bg-muted/50 p-4"
          >
            <div className="flex items-center gap-3">
              {/* File icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                processingStatus === "complete" ? "bg-emerald-500/20 text-emerald-500" :
                processingStatus === "error" ? "bg-destructive/20 text-destructive" :
                "bg-primary/20 text-primary"
              )}>
                {processingStatus === "complete" ? (
                  <Check className="w-5 h-5" />
                ) : processingStatus === "error" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <File className="w-5 h-5" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile && formatFileSize(selectedFile.size)}
                  {processingStatus === "uploading" && " • Uploading..."}
                  {processingStatus === "analyzing" && " • Analyzing with AI..."}
                  {processingStatus === "complete" && " • Ready!"}
                  {processingStatus === "error" && " • Failed"}
                </p>
              </div>

              {/* Status indicator */}
              {isProcessing && (
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              )}

              {/* Reset button */}
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="flex-shrink-0 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress bar */}
            {isProcessing && (
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: processingStatus === "uploading" ? "30%" : "90%"
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
