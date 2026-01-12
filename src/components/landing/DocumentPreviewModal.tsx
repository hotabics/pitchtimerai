import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Sparkles,
  Target,
  Lightbulb,
  Users,
  Tag,
  Cpu,
  Image as ImageIcon,
  X,
  Check,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrapedProjectData } from "@/lib/api/firecrawl";
import { cn } from "@/lib/utils";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ScrapedProjectData;
  filename: string;
  extractedImages?: string[];
  onConfirm: (data: ScrapedProjectData) => void;
}

export const DocumentPreviewModal = ({
  open,
  onOpenChange,
  data,
  filename,
  extractedImages = [],
  onConfirm,
}: DocumentPreviewModalProps) => {
  const [editedData, setEditedData] = useState<ScrapedProjectData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFieldChange = (field: keyof ScrapedProjectData, value: string | string[]) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onConfirm(editedData);
    onOpenChange(false);
  };

  const handleFeatureRemove = (index: number) => {
    const newFeatures = [...(editedData.keyFeatures || [])];
    newFeatures.splice(index, 1);
    handleFieldChange("keyFeatures", newFeatures);
  };

  const handleTechRemove = (index: number) => {
    const newTech = [...(editedData.techStack || [])];
    newTech.splice(index, 1);
    handleFieldChange("techStack", newTech);
  };

  const audienceLabels: Record<string, { label: string; color: string }> = {
    judges: { label: "Hackathon Judges", color: "bg-amber-500/20 text-amber-500" },
    investors: { label: "Investors", color: "bg-emerald-500/20 text-emerald-500" },
    academic: { label: "Academic", color: "bg-blue-500/20 text-blue-500" },
    grandma: { label: "Non-Technical", color: "bg-pink-500/20 text-pink-500" },
    peers: { label: "Developers", color: "bg-purple-500/20 text-purple-500" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">
                Document Analysis Complete
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground truncate">
                Extracted from: {filename}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "gap-2 transition-colors",
                isEditing && "bg-primary/10 text-primary"
              )}
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? "Done" : "Edit"}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-5">
            {/* Project Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                Project Name
              </Label>
              {isEditing ? (
                <Input
                  value={editedData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="bg-muted/50"
                />
              ) : (
                <p className="text-lg font-semibold text-foreground">{editedData.name}</p>
              )}
            </div>

            {/* Tagline */}
            {(editedData.tagline || isEditing) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="w-4 h-4 text-amber-500" />
                  Tagline
                </Label>
                {isEditing ? (
                  <Input
                    value={editedData.tagline || ""}
                    onChange={(e) => handleFieldChange("tagline", e.target.value)}
                    placeholder="A catchy one-liner..."
                    className="bg-muted/50"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">"{editedData.tagline}"</p>
                )}
              </div>
            )}

            {/* Problem */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-red-500" />
                Problem
              </Label>
              {isEditing ? (
                <Textarea
                  value={editedData.problem}
                  onChange={(e) => handleFieldChange("problem", e.target.value)}
                  className="bg-muted/50 min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{editedData.problem}</p>
              )}
            </div>

            {/* Solution */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="w-4 h-4 text-emerald-500" />
                Solution
              </Label>
              {isEditing ? (
                <Textarea
                  value={editedData.solution}
                  onChange={(e) => handleFieldChange("solution", e.target.value)}
                  className="bg-muted/50 min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{editedData.solution}</p>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-blue-500" />
                Target Audience
              </Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(audienceLabels).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => handleFieldChange("audience", key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        editedData.audience === key
                          ? color + " ring-2 ring-offset-2 ring-offset-background ring-primary/50"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <Badge
                  className={cn(
                    "font-medium",
                    audienceLabels[editedData.audience]?.color || "bg-muted text-muted-foreground"
                  )}
                >
                  {audienceLabels[editedData.audience]?.label || editedData.audience}
                </Badge>
              )}
            </div>

            {/* Extracted Images */}
            {extractedImages.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4 text-purple-500" />
                  Extracted Images ({extractedImages.length})
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {extractedImages.map((img, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedImage(img)}
                      className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted hover:border-primary/50 transition-colors group"
                    >
                      <img
                        src={img}
                        alt={`Extracted image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium">View</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Fields Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showAdvanced ? "Hide" : "Show"} advanced details
            </button>

            {/* Advanced Fields */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Key Features */}
                  {(editedData.keyFeatures?.length || isEditing) && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        Key Features
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {editedData.keyFeatures?.map((feature, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {feature}
                            {isEditing && (
                              <button
                                onClick={() => handleFeatureRemove(idx)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {(editedData.techStack?.length || isEditing) && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Cpu className="w-4 h-4 text-cyan-500" />
                        Tech Stack
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {editedData.techStack?.map((tech, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="gap-1 pr-1 bg-cyan-500/10 border-cyan-500/30 text-cyan-600"
                          >
                            {tech}
                            {isEditing && (
                              <button
                                onClick={() => handleTechRemove(idx)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border/50 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            Use This Data
          </Button>
        </DialogFooter>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
