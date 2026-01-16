import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Zap, MessageSquare, Edit2, Check, TrendingUp, Clock, CalendarDays, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Goal {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

interface WeeklyGoal {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  resetDay: number; // 0 = Sunday
}

interface GoalSettingProps {
  currentScore: number;
  currentWpm: number;
  totalPitches: number;
  weeklyPitches?: number;
  weeklyMinutes?: number;
}

const STORAGE_KEY = "pitchperfect_goals";
const WEEKLY_STORAGE_KEY = "pitchperfect_weekly_goals";
const WEEKLY_RESET_KEY = "pitchperfect_weekly_reset";

const defaultGoals: Omit<Goal, "current">[] = [
  { id: "score", label: "Target Score", target: 85, unit: "/100", icon: Target, color: "text-primary" },
  { id: "wpm", label: "WPM Goal", target: 140, unit: " WPM", icon: Zap, color: "text-amber-500" },
];

const defaultWeeklyGoals: Omit<WeeklyGoal, "current">[] = [
  { id: "weekly_pitches", label: "Pitches This Week", target: 5, unit: " pitches", icon: MessageSquare, color: "text-green-500", resetDay: 0 },
  { id: "weekly_minutes", label: "Practice Minutes", target: 30, unit: " min", icon: Clock, color: "text-blue-500", resetDay: 0 },
];

export const GoalSetting = ({ 
  currentScore, 
  currentWpm, 
  totalPitches,
  weeklyPitches = 0,
  weeklyMinutes = 0 
}: GoalSettingProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [editGoal, setEditGoal] = useState<Goal | WeeklyGoal | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState("weekly");

  // Check for weekly reset
  useEffect(() => {
    const checkWeeklyReset = () => {
      const lastReset = localStorage.getItem(WEEKLY_RESET_KEY);
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      
      if (!lastReset || lastReset !== currentWeek.toString()) {
        localStorage.setItem(WEEKLY_RESET_KEY, currentWeek.toString());
      }
    };
    
    checkWeeklyReset();
  }, []);

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  };

  useEffect(() => {
    // Load saved goals from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(defaultGoals.map((g) => ({
          ...g,
          target: parsed[g.id] || g.target,
          current: getCurrentValue(g.id),
        })));
      } catch {
        initializeGoals();
      }
    } else {
      initializeGoals();
    }

    // Load weekly goals
    const savedWeekly = localStorage.getItem(WEEKLY_STORAGE_KEY);
    if (savedWeekly) {
      try {
        const parsed = JSON.parse(savedWeekly);
        setWeeklyGoals(defaultWeeklyGoals.map((g) => ({
          ...g,
          target: parsed[g.id] || g.target,
          current: getWeeklyCurrentValue(g.id),
        })));
      } catch {
        initializeWeeklyGoals();
      }
    } else {
      initializeWeeklyGoals();
    }
  }, [currentScore, currentWpm, totalPitches, weeklyPitches, weeklyMinutes]);

  const initializeGoals = () => {
    setGoals(defaultGoals.map((g) => ({
      ...g,
      current: getCurrentValue(g.id),
    })));
  };

  const initializeWeeklyGoals = () => {
    setWeeklyGoals(defaultWeeklyGoals.map((g) => ({
      ...g,
      current: getWeeklyCurrentValue(g.id),
    })));
  };

  const getCurrentValue = (id: string) => {
    switch (id) {
      case "score": return currentScore;
      case "wpm": return currentWpm;
      case "pitches": return totalPitches;
      default: return 0;
    }
  };

  const getWeeklyCurrentValue = (id: string) => {
    switch (id) {
      case "weekly_pitches": return weeklyPitches;
      case "weekly_minutes": return weeklyMinutes;
      default: return 0;
    }
  };

  const handleSaveGoal = (isWeekly: boolean = false) => {
    if (!editGoal) return;
    
    const newTarget = parseInt(editValue);
    if (isNaN(newTarget) || newTarget <= 0) {
      toast.error("Please enter a valid number");
      return;
    }

    if (isWeekly) {
      const updatedGoals = weeklyGoals.map((g) =>
        g.id === editGoal.id ? { ...g, target: newTarget } : g
      );
      setWeeklyGoals(updatedGoals);
      const toSave = updatedGoals.reduce((acc, g) => ({ ...acc, [g.id]: g.target }), {});
      localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(toSave));
    } else {
      const updatedGoals = goals.map((g) =>
        g.id === editGoal.id ? { ...g, target: newTarget } : g
      );
      setGoals(updatedGoals);
      const toSave = updatedGoals.reduce((acc, g) => ({ ...acc, [g.id]: g.target }), {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }

    toast.success(`${editGoal.label} updated to ${newTarget}`);
    setEditGoal(null);
  };

  const getProgress = (goal: Goal | WeeklyGoal) => {
    const progress = (goal.current / goal.target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    return daysUntilSunday === 0 ? 7 : daysUntilSunday;
  };

  const renderGoalItem = (goal: Goal | WeeklyGoal, index: number, isWeekly: boolean = false) => (
    <motion.div
      key={goal.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <goal.icon className={`h-4 w-4 ${goal.color}`} />
          <span className="text-sm font-medium">{goal.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {goal.current}{goal.unit} / {goal.target}{goal.unit}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditGoal(goal);
                  setEditValue(goal.target.toString());
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Edit {goal.label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-value">Target Value</Label>
                  <Input
                    id="goal-value"
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={`Enter target ${goal.label.toLowerCase()}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Current: {goal.current}{goal.unit}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => handleSaveGoal(isWeekly)}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Goal
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="relative">
        <Progress 
          value={getProgress(goal)} 
          className="h-2"
        />
        {getProgress(goal) >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1"
          >
            <span className="text-lg">🎉</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const weeklyComplete = weeklyGoals.every((g) => getProgress(g) >= 100);
  const allComplete = goals.every((g) => getProgress(g) >= 100);

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Goals & Targets
        </CardTitle>
        <CardDescription>Set weekly and skill targets to track your progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Weekly Goals
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Target className="h-4 w-4" />
              Skill Targets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            {/* Reset countdown */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                <span>Resets in {getDaysUntilReset()} days</span>
              </div>
              <span className="text-xs text-muted-foreground">Every Sunday</span>
            </div>

            {weeklyGoals.map((goal, index) => renderGoalItem(goal, index, true))}

            {weeklyComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
              >
                <p className="text-green-500 font-medium">🏆 Weekly goals complete! Keep the momentum!</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            {goals.map((goal, index) => renderGoalItem(goal, index, false))}

            {allComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
              >
                <p className="text-green-500 font-medium">🏆 All goals achieved! Set new challenges!</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
