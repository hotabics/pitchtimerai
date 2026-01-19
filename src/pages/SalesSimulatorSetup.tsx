import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Building2, User, Target, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";

const industries = [
  { value: "saas", label: "SaaS" },
  { value: "real_estate", label: "Real Estate" },
  { value: "insurance", label: "Insurance" },
  { value: "b2b_services", label: "B2B Services" },
  { value: "custom", label: "Custom" },
];

const clientRoles = [
  { value: "ceo", label: "CEO" },
  { value: "founder", label: "Founder" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "procurement", label: "Procurement" },
  { value: "custom", label: "Custom" },
];

const personalities = [
  { value: "skeptical", label: "Skeptical", description: "Doubts claims, needs proof" },
  { value: "neutral", label: "Neutral", description: "Open but not committed" },
  { value: "busy", label: "Busy", description: "Limited time, get to the point" },
  { value: "friendly", label: "Friendly", description: "Engaged and personable" },
];

const objectionLevels = [
  { value: "low", label: "Low", description: "Few objections, easier call" },
  { value: "medium", label: "Medium", description: "Balanced challenge" },
  { value: "high", label: "High", description: "Many objections, tough call" },
];

const callGoals = [
  { value: "book_demo", label: "Book a meeting / demo" },
  { value: "sell_directly", label: "Sell directly" },
  { value: "qualify_lead", label: "Qualify lead" },
  { value: "custom", label: "Custom goal" },
];

const SalesSimulatorSetup = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [industry, setIndustry] = useState("saas");
  const [productDescription, setProductDescription] = useState("");
  const [clientRole, setClientRole] = useState("ceo");
  const [personality, setPersonality] = useState("neutral");
  const [objectionLevel, setObjectionLevel] = useState("medium");
  const [callGoal, setCallGoal] = useState("book_demo");
  const [customGoal, setCustomGoal] = useState("");

  const handleStartSimulation = async () => {
    if (!productDescription.trim()) {
      toast.error("Please describe what you're selling");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("sales_simulations")
        .insert({
          user_id: user?.id || null,
          industry,
          product_description: productDescription,
          client_role: clientRole,
          client_personality: personality,
          objection_level: objectionLevel,
          call_goal: callGoal,
          custom_goal: callGoal === "custom" ? customGoal : null,
          status: "ready",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/sales-simulator/live/${data.id}`);
    } catch (error) {
      console.error("Failed to create simulation:", error);
      toast.error("Failed to start simulation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/sales-simulator")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Setup Your Call</h1>
          <p className="text-muted-foreground">Configure the scenario in under 60 seconds</p>
        </motion.div>

        <div className="space-y-6">
          {/* Section A: Sales Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Sales Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">What are you selling?</Label>
                  <Textarea
                    id="product"
                    placeholder="Describe your product or service..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section B: AI Client Persona */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  AI Client Persona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Client Role</Label>
                  <Select value={clientRole} onValueChange={setClientRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Client Personality</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {personalities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPersonality(p.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          personality === p.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Objection Level</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {objectionLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setObjectionLevel(level.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          objectionLevel === level.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{level.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{level.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section C: Call Goal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Call Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={callGoal} onValueChange={setCallGoal}>
                  {callGoals.map((goal) => (
                    <div key={goal.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={goal.value} id={goal.value} />
                      <Label htmlFor={goal.value} className="cursor-pointer">
                        {goal.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {callGoal === "custom" && (
                  <Input
                    placeholder="Describe your custom goal..."
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-between pt-4"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/sales-simulator")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button
              onClick={handleStartSimulation}
              disabled={isLoading || !productDescription.trim()}
              className="gap-2"
            >
              {isLoading ? (
                "Starting..."
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Start Call Simulation
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SalesSimulatorSetup;
