import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, ArrowRight, FileText, Link, Upload, 
  Loader2, CheckCircle2, AlertTriangle, Briefcase,
  Target, Shield, Lightbulb
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";

const InterviewSimulatorSetup = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  // Form state
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  
  // Processing state
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Handle job URL scraping
  const handleScrapeUrl = async () => {
    if (!jobUrl.trim()) {
      toast.error("Please enter a job URL");
      return;
    }

    setIsScrapingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: jobUrl }
      });

      if (error) throw error;

      if (data.success && data.data) {
        setJobTitle(data.data.name || "");
        setCompanyName(data.data.tagline?.split(" ")[0] || "");
        setJobDescription(data.raw?.markdown || data.data.problem + "\n\n" + data.data.solution);
        toast.success("Job posting extracted!");
      } else {
        throw new Error(data.error || "Failed to scrape");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("Couldn't extract job posting. Please paste manually.");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  // Handle CV file upload
  const handleCvUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }

    setCvFileName(file.name);
    setIsParsingCv(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke("parse-document", {
          body: { 
            file: base64, 
            filename: file.name,
            mimeType: file.type 
          }
        });

        if (error) throw error;

        if (data.text) {
          setCvContent(data.text);
          toast.success("CV parsed successfully!");
        } else {
          throw new Error("No text extracted");
        }
        setIsParsingCv(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("CV parse error:", error);
      toast.error("Couldn't parse CV. Please paste the text manually.");
      setIsParsingCv(false);
    }
  }, []);

  // Analyze match
  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !cvContent.trim()) {
      toast.error("Please provide both job description and CV");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-interview-match", {
        body: {
          job_description: jobDescription,
          cv_content: cvContent,
          job_title: jobTitle,
          company_name: companyName
        }
      });

      if (error) throw error;
      
      setAnalysisResult(data);
      setAnalysisComplete(true);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start simulation
  const handleStartSimulation = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_simulations")
        .insert({
          user_id: user?.id || null,
          job_title: jobTitle || "Position",
          company_name: companyName,
          job_description: jobDescription,
          job_url: jobUrl || null,
          cv_content: cvContent,
          job_requirements: analysisResult?.job_requirements || [],
          match_strengths: analysisResult?.match_strengths || [],
          match_gaps: analysisResult?.match_gaps || [],
          key_evidence: analysisResult?.key_evidence || [],
          status: "ready"
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/interview-simulator/live/${data.id}`);
    } catch (error) {
      console.error("Failed to create simulation:", error);
      toast.error("Failed to start simulation");
    }
  };

  const canAnalyze = jobDescription.trim().length > 50 && cvContent.trim().length > 50;
  const canStart = analysisComplete && analysisResult;

  return (
    <div className="min-h-screen bg-interview-bg pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/interview-simulator")}
            className="mb-4 gap-2 text-interview-muted hover:text-interview-text"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Badge className="bg-interview-mustard/20 text-interview-mustard border-0 mb-3">
            Phase 1: Intel Briefing
          </Badge>
          <h1 className="text-3xl font-bold text-interview-text mb-2">
            Prepare Your Dossier
          </h1>
          <p className="text-interview-muted">
            We'll analyze the synergy between your experience and the job requirements
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Job Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-interview-card border-interview-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-interview-text">
                  <Briefcase className="w-5 h-5 text-interview-mustard" />
                  Target Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label className="text-interview-muted">Job Posting URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-interview-muted" />
                      <Input
                        placeholder="https://cv.lv/job/..."
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="pl-9 bg-interview-bg border-interview-border text-interview-text"
                      />
                    </div>
                    <Button
                      onClick={handleScrapeUrl}
                      disabled={isScrapingUrl || !jobUrl.trim()}
                      variant="outline"
                      className="border-interview-mustard text-interview-mustard hover:bg-interview-mustard/10"
                    >
                      {isScrapingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Extract"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-center text-interview-muted text-sm">— or paste manually —</div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-interview-muted">Job Title</Label>
                    <Input
                      placeholder="Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="bg-interview-bg border-interview-border text-interview-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-interview-muted">Company</Label>
                    <Input
                      placeholder="Acme Inc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-interview-bg border-interview-border text-interview-text"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-interview-muted">Job Description</Label>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px] bg-interview-bg border-interview-border text-interview-text"
                  />
                  <div className="text-xs text-interview-muted text-right">
                    {jobDescription.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - CV */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-interview-card border-interview-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-interview-text">
                  <FileText className="w-5 h-5 text-interview-mustard" />
                  Your CV / Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Zone */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleCvUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isParsingCv}
                  />
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    cvFileName 
                      ? "border-green-500/50 bg-green-500/5" 
                      : "border-interview-border hover:border-interview-mustard/50"
                  }`}>
                    {isParsingCv ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-interview-mustard" />
                        <span className="text-interview-muted">Parsing CV...</span>
                      </div>
                    ) : cvFileName ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <span className="text-interview-text font-medium">{cvFileName}</span>
                        <span className="text-xs text-interview-muted">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-interview-muted" />
                        <span className="text-interview-text">Drop your CV here</span>
                        <span className="text-xs text-interview-muted">PDF, DOCX, or TXT (max 10MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center text-interview-muted text-sm">— or paste text —</div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your CV text here..."
                    value={cvContent}
                    onChange={(e) => setCvContent(e.target.value)}
                    className="min-h-[200px] bg-interview-bg border-interview-border text-interview-text"
                  />
                  <div className="text-xs text-interview-muted text-right">
                    {cvContent.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-interview-card border-interview-border">
            <CardContent className="pt-6">
              {!analysisComplete ? (
                <div className="text-center py-8">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-interview-mustard/30 border-t-interview-mustard rounded-full animate-spin" />
                        <Target className="absolute inset-0 m-auto w-6 h-6 text-interview-mustard" />
                      </div>
                      <div>
                        <p className="text-interview-text font-medium">Scanning for Synergies...</p>
                        <p className="text-sm text-interview-muted">Analyzing match between your CV and job requirements</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Target className="w-12 h-12 text-interview-mustard mx-auto mb-4 opacity-50" />
                      <p className="text-interview-muted mb-4">
                        Provide both job description and CV to analyze the match
                      </p>
                      <Button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="gap-2 bg-interview-mustard hover:bg-interview-mustard/90 text-interview-bg"
                      >
                        <Target className="w-4 h-4" />
                        Analyze Match
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Match Score */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-interview-bg">
                    <div>
                      <p className="text-sm text-interview-muted">Match Score</p>
                      <p className="text-3xl font-bold text-interview-mustard">
                        {analysisResult?.overall_match_score || 0}%
                      </p>
                    </div>
                    <Progress 
                      value={analysisResult?.overall_match_score || 0} 
                      className="w-32 h-2 bg-interview-border"
                    />
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-500">The Match</span>
                        <Badge variant="outline" className="text-green-500 border-green-500/30 ml-auto">
                          {analysisResult?.match_strengths?.length || 0}
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {analysisResult?.match_strengths?.slice(0, 3).map((s: any, i: number) => (
                          <li key={i} className="text-sm text-interview-text flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{s.requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps */}
                    <div className="p-4 rounded-lg bg-interview-blood/10 border border-interview-blood/20">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-interview-blood" />
                        <span className="font-medium text-interview-blood">The Gap</span>
                        <Badge variant="outline" className="text-interview-blood border-interview-blood/30 ml-auto">
                          {analysisResult?.match_gaps?.length || 0}
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {analysisResult?.match_gaps?.slice(0, 3).map((g: any, i: number) => (
                          <li key={i} className="text-sm text-interview-text flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-interview-mustard shrink-0 mt-0.5" />
                            <span>{g.requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between mt-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/interview-simulator")}
            className="gap-2 border-interview-border text-interview-muted hover:text-interview-text"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleStartSimulation}
            disabled={!canStart}
            className="gap-2 bg-interview-blood hover:bg-interview-blood/90 text-white font-semibold"
          >
            Enter The Hot Seat
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewSimulatorSetup;
