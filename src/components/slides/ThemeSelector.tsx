import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SlideTheme, slideThemes, useSlidesStore } from '@/stores/slidesStore';
import { cn } from '@/lib/utils';

export const ThemeSelector = () => {
  const { currentTheme, setCurrentTheme } = useSlidesStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">{currentTheme.name}</span>
          <div 
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: currentTheme.primaryColor }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground mb-3">Slide Theme</p>
          <div className="grid gap-2">
            {slideThemes.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                isSelected={currentTheme.id === theme.id}
                onSelect={() => setCurrentTheme(theme)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ThemeOptionProps {
  theme: SlideTheme;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeOption = ({ theme, isSelected, onSelect }: ThemeOptionProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 w-full p-2 rounded-lg border transition-all text-left',
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {/* Color preview */}
      <div className="flex gap-1">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.secondaryColor }}
        />
        <div 
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: theme.backgroundColor }}
        />
      </div>
      
      {/* Theme name */}
      <span className="text-sm flex-1">{theme.name}</span>
      
      {/* Check mark */}
      {isSelected && (
        <Check className="w-4 h-4 text-primary" />
      )}
    </button>
  );
};
