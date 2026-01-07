// Metric Flag Button - Report inaccuracy for specific metrics

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { logFeedback } from '@/services/feedbackService';
import { cn } from '@/lib/utils';

interface MetricFlagButtonProps {
  metricName: string;
  className?: string;
}

export const MetricFlagButton = ({ metricName, className }: MetricFlagButtonProps) => {
  const [flagged, setFlagged] = useState(false);

  const handleFlag = () => {
    if (flagged) return;
    setFlagged(true);
    logFeedback('metric_inaccuracy', { metricName });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleFlag}
            disabled={flagged}
            className={cn(
              "p-1 rounded transition-all",
              flagged 
                ? "text-warning cursor-default" 
                : "text-muted-foreground/40 hover:text-warning/70 hover:bg-warning/10",
              className
            )}
          >
            <Flag className={cn("w-3 h-3", flagged && "fill-warning")} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {flagged ? "Inaccuracy reported" : "Report Inaccuracy"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
