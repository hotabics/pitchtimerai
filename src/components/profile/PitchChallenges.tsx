import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, Plus, Copy, Users, Trophy, Calendar, Target, ExternalLink, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  invite_code: string;
  track: string;
  target_score: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Participant {
  id: string;
  challenge_id: string;
  participant_name: string;
  best_score: number;
  total_pitches: number;
  joined_at: string;
}

export const PitchChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Create challenge form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrack, setNewTrack] = useState("hackathon-jury");
  const [newTargetScore, setNewTargetScore] = useState("70");
  const [newDuration, setNewDuration] = useState("7");
  const [creatorName, setCreatorName] = useState("");
  
  // Join challenge form
  const [participantName, setParticipantName] = useState("");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pitch_challenges")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChallenges(data || []);

      // Fetch participants for each challenge
      if (data && data.length > 0) {
        const { data: parts } = await supabase
          .from("challenge_participants")
          .select("*")
          .in("challenge_id", data.map(c => c.id));
        
        const grouped: Record<string, Participant[]> = {};
        parts?.forEach(p => {
          if (!grouped[p.challenge_id]) grouped[p.challenge_id] = [];
          grouped[p.challenge_id].push(p);
        });
        setParticipants(grouped);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
      toast.error("Failed to load challenges");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!newTitle.trim() || !creatorName.trim()) {
      toast.error("Please fill in title and your name");
      return;
    }

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(newDuration));

      const { data, error } = await supabase
        .from("pitch_challenges")
        .insert({
          title: newTitle,
          description: newDescription || null,
          created_by: creatorName,
          track: newTrack,
          target_score: parseInt(newTargetScore),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as creator
      await supabase.from("challenge_participants").insert({
        challenge_id: data.id,
        participant_name: creatorName,
      });

      toast.success("Challenge created! Share the invite code with friends.");
      setChallenges([data, ...challenges]);
      setNewTitle("");
      setNewDescription("");
      setCreatorName("");
    } catch (err) {
      console.error("Failed to create challenge:", err);
      toast.error("Failed to create challenge");
    }
  };

  const handleJoinChallenge = async () => {
    if (!joinCode.trim() || !participantName.trim()) {
      toast.error("Please enter the invite code and your name");
      return;
    }

    try {
      // Find challenge by invite code
      const { data: challenge, error: findError } = await supabase
        .from("pitch_challenges")
        .select("*")
        .eq("invite_code", joinCode.toUpperCase())
        .eq("status", "active")
        .maybeSingle();

      if (findError) throw findError;
      if (!challenge) {
        toast.error("Challenge not found or has ended");
        return;
      }

      // Join the challenge
      const { error: joinError } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challenge.id,
          participant_name: participantName,
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.error("You've already joined this challenge!");
        } else {
          throw joinError;
        }
        return;
      }

      toast.success(`Joined "${challenge.title}"! Start practicing to climb the leaderboard.`);
      setJoinCode("");
      setParticipantName("");
      fetchChallenges();
    } catch (err) {
      console.error("Failed to join challenge:", err);
      toast.error("Failed to join challenge");
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end <= now) return "Ended";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const parts = participants[challenge.id] || [];
    const sortedParts = [...parts].sort((a, b) => b.best_score - a.best_score);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-lg p-4 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{challenge.title}</h4>
            {challenge.description && (
              <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">
            {challenge.track.replace(/-/g, " ")}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            Target: {challenge.target_score}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Ends {getTimeRemaining(challenge.end_date)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {parts.length} participants
          </span>
        </div>

        {/* Mini Leaderboard */}
        {sortedParts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Top Performers</p>
            <div className="space-y-1">
              {sortedParts.slice(0, 3).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10">
                      {p.participant_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{p.participant_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(p.best_score / 10).toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Invite code:</span>
            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
              {challenge.invite_code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyInviteCode(challenge.invite_code)}
            >
              {copiedCode === challenge.invite_code ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Pitch Challenges
        </CardTitle>
        <CardDescription>Compete with friends and colleagues</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Active Challenges</TabsTrigger>
            <TabsTrigger value="join">Join / Create</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              Array(2).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))
            ) : challenges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Swords className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active challenges</p>
                <p className="text-sm">Create one or join with an invite code!</p>
              </div>
            ) : (
              challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))
            )}
          </TabsContent>

          <TabsContent value="join" className="space-y-6">
            {/* Join Challenge */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Join a Challenge
              </h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Invite Code</Label>
                  <Input
                    id="join-code"
                    placeholder="Enter 8-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participant-name">Your Name</Label>
                  <Input
                    id="participant-name"
                    placeholder="How you'll appear on the leaderboard"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                  />
                </div>
                <Button onClick={handleJoinChallenge}>
                  <Users className="h-4 w-4 mr-2" />
                  Join Challenge
                </Button>
              </div>
            </div>

            {/* Create Challenge */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create a Challenge
              </h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Team Pitch-Off 2024"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="What's this challenge about?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creator-name">Your Name</Label>
                  <Input
                    id="creator-name"
                    placeholder="Your display name"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Target Score</Label>
                    <Select value={newTargetScore} onValueChange={setNewTargetScore}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 (Easy)</SelectItem>
                        <SelectItem value="70">70 (Medium)</SelectItem>
                        <SelectItem value="80">80 (Hard)</SelectItem>
                        <SelectItem value="90">90 (Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={newDuration} onValueChange={setNewDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">1 week</SelectItem>
                        <SelectItem value="14">2 weeks</SelectItem>
                        <SelectItem value="30">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateChallenge}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
