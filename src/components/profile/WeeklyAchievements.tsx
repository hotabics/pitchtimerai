// Weekly Achievements - Badges for consistent weekly goal completion
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Flame, Zap, Target, Crown, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeeklyAchievementsProps {
  consecutiveWeeks: number; // How many weeks in a row goals were met
  totalWeeksCompleted: number; // Total weeks with all goals met
  currentStreak: number; // Current day streak
  longestStreak: number; // Longest ever day streak
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  unlockCondition: (props: WeeklyAchievementsProps) => boolean;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const achievements: Achievement[] = [
  // Weekly streak achievements
  {
    id: 'week_warrior_1',
    name: 'Week Warrior',
    description: 'Complete weekly goals for 1 week',
    icon: Target,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    tier: 'bronze',
    unlockCondition: (p) => p.consecutiveWeeks >= 1,
  },
  {
    id: 'week_warrior_2',
    name: 'Dedicated Pitcher',
    description: 'Complete weekly goals for 2 weeks in a row',
    icon: Star,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    tier: 'silver',
    unlockCondition: (p) => p.consecutiveWeeks >= 2,
  },
  {
    id: 'week_warrior_4',
    name: 'Monthly Master',
    description: 'Complete weekly goals for 4 weeks in a row',
    icon: Medal,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    tier: 'gold',
    unlockCondition: (p) => p.consecutiveWeeks >= 4,
  },
  {
    id: 'week_warrior_8',
    name: 'Elite Performer',
    description: 'Complete weekly goals for 8 weeks in a row',
    icon: Crown,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    tier: 'platinum',
    unlockCondition: (p) => p.consecutiveWeeks >= 8,
  },
  // Day streak achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: '3-day practice streak',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    unlockCondition: (p) => p.currentStreak >= 3 || p.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Streak',
    description: '7-day practice streak',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    unlockCondition: (p) => p.currentStreak >= 7 || p.longestStreak >= 7,
  },
  {
    id: 'streak_14',
    name: 'Two Week Titan',
    description: '14-day practice streak',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    unlockCondition: (p) => p.currentStreak >= 14 || p.longestStreak >= 14,
  },
  {
    id: 'streak_30',
    name: 'Month Champion',
    description: '30-day practice streak',
    icon: Award,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    unlockCondition: (p) => p.currentStreak >= 30 || p.longestStreak >= 30,
  },
  // Total weeks achievements
  {
    id: 'total_5',
    name: 'Consistent',
    description: 'Complete 5 weeks of goals total',
    icon: Trophy,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    unlockCondition: (p) => p.totalWeeksCompleted >= 5,
  },
  {
    id: 'total_10',
    name: 'Committed',
    description: 'Complete 10 weeks of goals total',
    icon: Trophy,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    unlockCondition: (p) => p.totalWeeksCompleted >= 10,
  },
];

const getTierBorder = (tier?: string) => {
  switch (tier) {
    case 'bronze': return 'border-amber-600/30';
    case 'silver': return 'border-slate-400/30';
    case 'gold': return 'border-yellow-500/30';
    case 'platinum': return 'border-cyan-400/30';
    default: return 'border-border';
  }
};

export const WeeklyAchievements = ({ 
  consecutiveWeeks, 
  totalWeeksCompleted,
  currentStreak,
  longestStreak 
}: WeeklyAchievementsProps) => {
  const unlockedCount = useMemo(() => {
    return achievements.filter(a => 
      a.unlockCondition({ consecutiveWeeks, totalWeeksCompleted, currentStreak, longestStreak })
    ).length;
  }, [consecutiveWeeks, totalWeeksCompleted, currentStreak, longestStreak]);

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Achievements
          </span>
          <Badge variant="secondary">
            {unlockedCount}/{achievements.length}
          </Badge>
        </CardTitle>
        <CardDescription>Unlock badges by staying consistent with your practice</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {achievements.map((achievement, index) => {
              const isUnlocked = achievement.unlockCondition({ 
                consecutiveWeeks, 
                totalWeeksCompleted, 
                currentStreak, 
                longestStreak 
              });
              const Icon = achievement.icon;

              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                      className={`
                        relative aspect-square rounded-xl border-2 flex items-center justify-center
                        transition-all cursor-pointer
                        ${isUnlocked 
                          ? `${achievement.bgColor} ${getTierBorder(achievement.tier)} shadow-sm` 
                          : 'bg-muted/30 border-muted opacity-40 grayscale'
                        }
                        ${isUnlocked ? 'hover:scale-110' : ''}
                      `}
                    >
                      <Icon className={`w-6 h-6 ${isUnlocked ? achievement.color : 'text-muted-foreground'}`} />
                      {isUnlocked && achievement.tier && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                          achievement.tier === 'bronze' ? 'bg-amber-600' :
                          achievement.tier === 'silver' ? 'bg-slate-400' :
                          achievement.tier === 'gold' ? 'bg-yellow-500' :
                          'bg-cyan-400'
                        }`} />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && (
                      <p className="text-xs text-amber-500 mt-1">🔒 Locked</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Progress hint */}
        {consecutiveWeeks > 0 && consecutiveWeeks < 8 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-center">
            <span className="text-muted-foreground">
              {consecutiveWeeks === 1 && '🎯 1 week down! Keep going for Dedicated Pitcher!'}
              {consecutiveWeeks === 2 && '⭐ Great progress! 2 more weeks for Monthly Master!'}
              {consecutiveWeeks === 3 && '🔥 Almost there! 1 more week for Monthly Master!'}
              {consecutiveWeeks >= 4 && consecutiveWeeks < 8 && `🏆 ${8 - consecutiveWeeks} more weeks for Elite Performer!`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};