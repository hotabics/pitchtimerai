import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { History, Save, Trash2, GitCompare, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface ScriptVersion {
  id: string;
  timestamp: Date;
  name: string;
  blocks: Array<{
    title: string;
    content: string;
    timeStart: string;
    timeEnd: string;
  }>;
  fullScript?: string;
  bulletPoints?: string[];
  wordCount: number;
}

interface ScriptVersionHistoryProps {
  currentBlocks: Array<{
    title: string;
    content: string;
    timeStart: string;
    timeEnd: string;
  }>;
  currentMeta?: {
    fullScript?: string;
    bulletPoints?: string[];
    actualWordCount: number;
  };
  versions: ScriptVersion[];
  onSaveVersion: (version: ScriptVersion) => void;
  onDeleteVersion: (id: string) => void;
  onRestoreVersion: (version: ScriptVersion) => void;
}

export const ScriptVersionHistory = ({
  currentBlocks,
  currentMeta,
  versions,
  onSaveVersion,
  onDeleteVersion,
  onRestoreVersion,
}: ScriptVersionHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleSaveVersion = () => {
    const newVersion: ScriptVersion = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      name: `Version ${versions.length + 1}`,
      blocks: currentBlocks.map(b => ({
        title: b.title,
        content: b.content,
        timeStart: b.timeStart,
        timeEnd: b.timeEnd,
      })),
      fullScript: currentMeta?.fullScript,
      bulletPoints: currentMeta?.bulletPoints,
      wordCount: currentMeta?.actualWordCount || 0,
    };
    onSaveVersion(newVersion);
    toast({ title: "Version Saved!", description: `Saved as "${newVersion.name}"` });
  };

  const toggleVersionSelection = (id: string) => {
    if (selectedVersions.includes(id)) {
      setSelectedVersions(prev => prev.filter(v => v !== id));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, id]);
    }
  };

  const getSelectedVersions = () => {
    return versions.filter(v => selectedVersions.includes(v.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Versions ({versions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Script Version History
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedVersions([]);
                }}
                className="gap-2"
              >
                <GitCompare className="w-4 h-4" />
                {compareMode ? "Exit Compare" : "Compare"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveVersion}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Current
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {compareMode && selectedVersions.length === 2 ? (
          <ComparisonView
            versions={getSelectedVersions()}
            onClose={() => setSelectedVersions([])}
          />
        ) : (
          <ScrollArea className="flex-1 pr-4">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No saved versions yet</p>
                <p className="text-sm mt-1">
                  Save the current script to create a version you can restore later
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {compareMode && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Select 2 versions to compare side-by-side ({selectedVersions.length}/2 selected)
                  </p>
                )}
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      compareMode && selectedVersions.includes(version.id)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:bg-muted/50",
                      compareMode && "cursor-pointer"
                    )}
                    onClick={() => compareMode && toggleVersionSelection(version.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{version.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(version.timestamp, "MMM d, h:mm a")}
                          </span>
                          <span>{version.wordCount} words</span>
                          <span>{version.blocks.length} sections</span>
                        </div>
                      </div>
                      {!compareMode && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onRestoreVersion(version);
                              setIsOpen(false);
                              toast({ title: "Version Restored!", description: `Restored "${version.name}"` });
                            }}
                          >
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteVersion(version.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Preview */}
                    <div className="mt-3 p-3 rounded-lg bg-background/50 text-sm text-muted-foreground line-clamp-2">
                      {version.blocks[0]?.content.slice(0, 150)}...
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Side-by-side comparison view
const ComparisonView = ({
  versions,
  onClose,
}: {
  versions: ScriptVersion[];
  onClose: () => void;
}) => {
  const [v1, v2] = versions;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Comparing {v1.name} vs {v2.name}
        </p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Version 1 */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border">
          <div className="p-3 bg-muted/50 border-b">
            <h4 className="font-medium text-sm">{v1.name}</h4>
            <p className="text-xs text-muted-foreground">
              {format(v1.timestamp, "MMM d, h:mm a")} • {v1.wordCount} words
            </p>
          </div>
          <ScrollArea className="flex-1 p-4">
            {v1.blocks.map((block, i) => (
              <div key={i} className="mb-4">
                <h5 className="text-xs font-semibold text-primary mb-1">{block.title}</h5>
                <p className="text-sm text-foreground leading-relaxed">{block.content}</p>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Version 2 */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border">
          <div className="p-3 bg-muted/50 border-b">
            <h4 className="font-medium text-sm">{v2.name}</h4>
            <p className="text-xs text-muted-foreground">
              {format(v2.timestamp, "MMM d, h:mm a")} • {v2.wordCount} words
            </p>
          </div>
          <ScrollArea className="flex-1 p-4">
            {v2.blocks.map((block, i) => (
              <div key={i} className="mb-4">
                <h5 className="text-xs font-semibold text-primary mb-1">{block.title}</h5>
                <p className="text-sm text-foreground leading-relaxed">{block.content}</p>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
