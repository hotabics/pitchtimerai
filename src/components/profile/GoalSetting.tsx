import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Target, Zap, MessageSquare, Edit2, Check, TrendingUp } from "lucide-react";
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

interface GoalSettingProps {
  currentScore: number;
  currentWpm: number;
  totalPitches: number;
}

const STORAGE_KEY = "pitchperfect_goals";

const defaultGoals: Omit<Goal, "current">[] = [
  { id: "score", label: "Target Score", target: 85, unit: "/100", icon: Target, color: "text-primary" },
  { id: "wpm", label: "WPM Goal", target: 140, unit: " WPM", icon: Zap, color: "text-amber-500" },
  { id: "pitches", label: "Weekly Pitches", target: 5, unit: " pitches", icon: MessageSquare, color: "text-green-500" },
];

export const GoalSetting = ({ currentScore, currentWpm, totalPitches }: GoalSettingProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editValue, setEditValue] = useState("");

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
  }, [currentScore, currentWpm, totalPitches]);

  const initializeGoals = () => {
    setGoals(defaultGoals.map((g) => ({
      ...g,
      current: getCurrentValue(g.id),
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

  const handleSaveGoal = () => {
    if (!editGoal) return;
    
    const newTarget = parseInt(editValue);
    if (isNaN(newTarget) || newTarget <= 0) {
      toast.error("Please enter a valid number");
      return;
    }

    const updatedGoals = goals.map((g) =>
      g.id === editGoal.id ? { ...g, target: newTarget } : g
    );
    setGoals(updatedGoals);

    // Save to localStorage
    const toSave = updatedGoals.reduce((acc, g) => ({ ...acc, [g.id]: g.target }), {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    toast.success(`${editGoal.label} updated to ${newTarget}`);
    setEditGoal(null);
  };

  const getProgress = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getProgressColor = (goal: Goal) => {
    const progress = getProgress(goal);
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-primary";
    if (progress >= 50) return "bg-amber-500";
    return "bg-muted-foreground";
  };

  return (
    <Card className="bg-card shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Personal Goals
        </CardTitle>
        <CardDescription>Set targets and track your progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, index) => (
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
                        <Button onClick={handleSaveGoal}>
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
        ))}

        {goals.every((g) => getProgress(g) >= 100) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
          >
            <p className="text-green-500 font-medium">🏆 All goals achieved! Set new challenges!</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
