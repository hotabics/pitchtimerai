import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Sparkles, ArrowRight, AlertTriangle,
  CheckCircle2, Lightbulb, Copy, ArrowLeft, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackItem {
  type: "weakness" | "suggestion" | "strength";
  section: string;
  original?: string;
  improved?: string;
  explanation: string;
}

const ScriptCoach = () => {
  const navigate = useNavigate();
  
  const [originalScript, setOriginalScript] = useState("");
  const [improvedScript, setImprovedScript] = useState("");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallAssessment, setOverallAssessment] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeScript = async () => {
    if (!originalScript.trim()) {
      toast.error("Please enter your cold call script");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-sales-script", {
        body: { script: originalScript }
      });

      if (error) throw error;

      setImprovedScript(data.improved_script || "");
      setFeedbackItems(data.feedback_items || []);
      setOverallAssessment(data.overall_assessment || "");
      
      toast.success("Script analysis complete!");
    } catch (error) {
      console.error("Script analysis failed:", error);
      toast.error("Failed to analyze script. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const useInSimulator = () => {
    // Store improved script in session storage for use in simulator
    sessionStorage.setItem("sales_script", improvedScript || originalScript);
    navigate("/sales-simulator/setup");
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "weakness": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "strength": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getFeedbackBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      weakness: "destructive",
      strength: "default",
      suggestion: "secondary",
    };
    return variants[type] || "outline";
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
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
          
          <h1 className="text-3xl font-bold mb-2">Script Coach</h1>
          <p className="text-muted-foreground">
            Paste your cold call script and get AI-powered improvements
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Original Script */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Your Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your cold call script here...

Example:
Hi [Name], this is [Your Name] from [Company]. 

I'm calling because we help companies like yours increase their sales by 30% through our AI-powered platform.

Do you have a few minutes to chat about how we could help you?

..."
                  value={originalScript}
                  onChange={(e) => setOriginalScript(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                
                <Button 
                  onClick={analyzeScript} 
                  disabled={isAnalyzing || !originalScript.trim()}
                  className="w-full gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Script
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Improved Script + Feedback */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Improved Script */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Improved Script
                  </CardTitle>
                  {improvedScript && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(improvedScript)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {improvedScript ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                      {improvedScript}
                    </div>
                    <Button onClick={useInSimulator} className="w-full gap-2">
                      Use in Simulator
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Improved script will appear here after analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Items */}
            {feedbackItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Detailed Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {feedbackItems.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFeedbackIcon(item.type)}
                        <Badge variant={getFeedbackBadge(item.type)} className="capitalize">
                          {item.type}
                        </Badge>
                        <span className="text-sm font-medium">{item.section}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{item.explanation}</p>
                      
                      {item.original && item.improved && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-red-500/10 rounded p-2">
                            <p className="text-xs text-red-600 font-medium mb-1">Original</p>
                            <p className="text-sm">{item.original}</p>
                          </div>
                          <div className="bg-green-500/10 rounded p-2">
                            <p className="text-xs text-green-600 font-medium mb-1">Improved</p>
                            <p className="text-sm">{item.improved}</p>
                          </div>
                        </div>
                      )}
                      
                      {index < feedbackItems.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Overall Assessment */}
            {overallAssessment && (
              <Card>
                <CardHeader>
                  <CardTitle>Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{overallAssessment}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ScriptCoach;
