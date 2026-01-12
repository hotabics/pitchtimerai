import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, Loader2, ArrowLeft, CheckCircle, Volume2, VolumeX, RotateCcw, ClipboardList, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSoundEnabled, setSoundEnabled } from "@/utils/soundSettings";

// Survey history reset helper
const resetSurveyHistory = () => {
  const keysToRemove = [
    'pitchperfect_survey_history',
    'pitchperfect_session_stats',
    'posthog_survey_events',
  ];
  
  // Remove survey state keys
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('pitchperfect_survey_')) {
      localStorage.removeItem(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, setUser } = useUserStore();
  
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [soundEnabled, setLocalSoundEnabled] = useState(getSoundEnabled());
  
  // Email digest subscription state
  const [digestEmail, setDigestEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Check if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.email) {
        setDigestEmail(user.email);
        const { data } = await supabase
          .from('analytics_subscribers')
          .select('is_active')
          .eq('email', user.email)
          .single();
        
        if (data?.is_active) {
          setIsSubscribed(true);
        }
      }
    };
    checkSubscription();
  }, [user?.email]);

  const handleDigestSubscribe = async () => {
    if (!digestEmail.trim() || !digestEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('analytics_subscribers')
        .upsert({
          email: digestEmail.trim(),
          report_type: 'survey_digest',
          frequency: 'weekly',
          is_active: !isSubscribed,
        }, { onConflict: 'email' });
      
      if (error) throw error;
      
      setIsSubscribed(!isSubscribed);
      toast.success(isSubscribed 
        ? "Unsubscribed from weekly survey digest" 
        : "Subscribed to weekly survey digest!"
      );
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to update subscription");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestDigest = async () => {
    if (!digestEmail.trim()) {
      toast.error("Please enter an email address first");
      return;
    }
    
    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-survey-digest', {
        body: { recipients: [digestEmail.trim()], testMode: true },
      });
      
      if (error) throw error;
      
      toast.success("Test digest sent! Check your inbox.");
    } catch (error) {
      console.error('Test digest error:', error);
      toast.error("Failed to send test digest");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setLocalSoundEnabled(enabled);
    setSoundEnabled(enabled);
    toast.success(enabled ? "Sound effects enabled" : "Sound effects muted");
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth?returnTo=/settings");
    }
  }, [isLoggedIn, navigate]);

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatar || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaved(false);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
        });

      if (profileError) throw profileError;

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name.trim(), avatar_url: avatarUrl.trim() || null },
      });

      if (authError) throw authError;

      // Update local store
      setUser({
        ...user,
        name: name.trim(),
        avatar: avatarUrl.trim() || undefined,
      });

      setSaved(true);
      toast.success("Profile updated successfully!");
      
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-1">
              Update your profile information
            </p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                This information will be displayed on your profile and in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {name ? getInitials(name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAvatarUrl("")}
                      title="Clear avatar"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a URL to an image, or leave blank for initials
                  </p>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  This is how your name will appear in the app
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects" className="text-base">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for success chimes and notifications
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Developer/Testing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Survey & Testing
              </CardTitle>
              <CardDescription>
                Tools for testing survey functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reset Survey History */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reset Survey History</Label>
                  <p className="text-sm text-muted-foreground">
                    Clear all survey responses to retake surveys for testing
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetSurveyHistory();
                    toast.success("Survey history cleared! You can now retake surveys.");
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Digest Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Weekly Survey Digest
              </CardTitle>
              <CardDescription>
                Get NPS trends and friction points delivered to your inbox every Monday
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={digestEmail}
                  onChange={(e) => setDigestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant={isSubscribed ? "outline" : "default"}
                  onClick={handleDigestSubscribe}
                  disabled={isSubscribing}
                  className="min-w-[100px]"
                >
                  {isSubscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    "Unsubscribe"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
              {isSubscribed && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  You're subscribed! Next digest: Monday 9 AM UTC
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendTestDigest}
                disabled={isSendingTest || !digestEmail.trim()}
                className="gap-2"
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Test Digest
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
