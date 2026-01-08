import { useState, useRef } from 'react';
import { Upload, FileJson, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { importSlidesFromFile } from '@/services/slideImport';
import { Slide, SlideTheme, useSlidesStore } from '@/stores/slidesStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SlideImportDialogProps {
  onImport: (slides: Slide[], theme?: SlideTheme) => void;
}

export const SlideImportDialog = ({ onImport }: SlideImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    
    try {
      const { slides, theme } = await importSlidesFromFile(file);
      
      onImport(slides, theme);
      
      toast({
        title: 'Slides imported!',
        description: `Successfully imported ${slides.length} slides from ${file.name}`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import slides',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Slides</DialogTitle>
          <DialogDescription>
            Import slides from a JSON or PowerPoint file.
          </DialogDescription>
        </DialogHeader>
        
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border',
            isLoading && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Importing slides...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a file here, or click to browse
              </p>
              <div className="flex justify-center gap-2 mb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <FileJson className="w-3 h-3" />
                  .json
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <FileSpreadsheet className="w-3 h-3" />
                  .pptx
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          For best results, use JSON files exported from this app.
        </p>
      </DialogContent>
    </Dialog>
  );
};
