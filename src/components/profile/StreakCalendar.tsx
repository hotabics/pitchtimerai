// Streak Calendar - Visual heatmap showing practice activity
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakCalendarProps {
  sessions: Array<{
    created_at: string;
    score?: number;
  }>;
  currentStreak: number;
  longestStreak: number;
}

export const StreakCalendar = ({ sessions, currentStreak, longestStreak }: StreakCalendarProps) => {
  // Generate last 12 weeks of data
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks: Array<Array<{ date: Date; count: number; intensity: number }>> = [];
    
    // Create a map of dates to session counts
    const sessionMap = new Map<string, number>();
    sessions.forEach(session => {
      const dateKey = new Date(session.created_at).toISOString().split('T')[0];
      sessionMap.set(dateKey, (sessionMap.get(dateKey) || 0) + 1);
    });

    // Generate 12 weeks (84 days) of calendar data
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83); // Go back 83 days
    
    // Adjust to start of week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let week = 0; week < 12; week++) {
      const weekData: Array<{ date: Date; count: number; intensity: number }> = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const dateKey = currentDate.toISOString().split('T')[0];
        const count = sessionMap.get(dateKey) || 0;
        
        // Calculate intensity (0-4) based on activity
        let intensity = 0;
        if (count === 1) intensity = 1;
        else if (count === 2) intensity = 2;
        else if (count === 3) intensity = 3;
        else if (count >= 4) intensity = 4;

        weekData.push({ date: currentDate, count, intensity });
      }
      weeks.push(weekData);
    }

    return weeks;
  }, [sessions]);

  const getIntensityClass = (intensity: number, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30';
    switch (intensity) {
      case 0: return 'bg-muted/50';
      case 1: return 'bg-primary/30';
      case 2: return 'bg-primary/50';
      case 3: return 'bg-primary/70';
      case 4: return 'bg-primary';
      default: return 'bg-muted/50';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Practice Activity
            </CardTitle>
            <CardDescription>Your pitch practice over the last 12 weeks</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold text-orange-500">
                {currentStreak}
                <Flame className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{longestStreak}</div>
              <p className="text-xs text-muted-foreground">Longest streak</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((label, i) => (
              <div 
                key={i} 
                className="h-3 w-3 text-[10px] text-muted-foreground flex items-center justify-center"
              >
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-1 overflow-x-auto">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const isFuture = day.date > today;
                    const isToday = day.date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                            className={`
                              h-3 w-3 rounded-sm cursor-pointer transition-all
                              ${getIntensityClass(day.intensity, isFuture)}
                              ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''}
                              hover:ring-1 hover:ring-foreground/30
                            `}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p className="text-muted-foreground">
                            {isFuture ? 'Future' : day.count === 0 ? 'No practice' : `${day.count} session${day.count > 1 ? 's' : ''}`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(intensity => (
              <div 
                key={intensity}
                className={`h-3 w-3 rounded-sm ${getIntensityClass(intensity, false)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};