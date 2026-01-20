// Interview History Section - Past interview simulations for Profile page
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Trash2, ChevronRight, Download, Clock,
  Target, TrendingUp, Search, LayoutGrid, List,
  Plus, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { generateInterviewPDF } from '@/services/interviewPdfExport';

interface InterviewSimulation {
  id: string;
  job_title: string;
  company_name: string | null;
  status: string;
  hireability_score: number | null;
  conversion_likelihood: string | null;
  duration_seconds: number | null;
  created_at: string;
  category_scores: any;
  strategic_reframes: any[];
  verdict_summary: string | null;
}

interface InterviewTurn {
  id: string;
  role: string;
  content: string;
  turn_number: number;
}

export const InterviewHistory = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<InterviewSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setSimulations((data || []).map(sim => ({
        ...sim,
        category_scores: sim.category_scores || null,
        strategic_reframes: (sim.strategic_reframes as any[]) || [],
        verdict_summary: sim.verdict_summary || null,
      })));
    } catch (err) {
      console.error('Failed to fetch simulations:', err);
      toast.error('Failed to load interview history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      // First delete turns
      await supabase
        .from('interview_simulation_turns')
        .delete()
        .eq('simulation_id', deleteTarget);
      
      // Then delete simulation
      const { error } = await supabase
        .from('interview_simulations')
        .delete()
        .eq('id', deleteTarget);
      
      if (error) throw error;
      
      setSimulations(prev => prev.filter(s => s.id !== deleteTarget));
      toast.success('Interview deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete interview');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDownloadPDF = async (simulation: InterviewSimulation) => {
    setDownloadingId(simulation.id);
    
    try {
      // Fetch turns for the simulation
      const { data: turnsData, error } = await supabase
        .from('interview_simulation_turns')
        .select('*')
        .eq('simulation_id', simulation.id)
        .order('turn_number', { ascending: true });

      if (error) throw error;

      const turns: InterviewTurn[] = (turnsData || []).map(t => ({
        id: t.id,
        role: t.role,
        content: t.content,
        turn_number: t.turn_number,
      }));

      generateInterviewPDF({
        job_title: simulation.job_title,
        company_name: simulation.company_name || undefined,
        duration_seconds: simulation.duration_seconds || 0,
        hireability_score: simulation.hireability_score,
        category_scores: simulation.category_scores,
        strategic_reframes: simulation.strategic_reframes,
        verdict_summary: simulation.verdict_summary,
        conversion_likelihood: simulation.conversion_likelihood as any,
        turns,
      });

      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredSimulations = simulations.filter(s => 
    s.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-interview-mustard';
    return 'text-interview-blood';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 80) return 'bg-green-500/20 text-green-500';
    if (score >= 60) return 'bg-interview-mustard/20 text-interview-mustard';
    return 'bg-interview-blood/20 text-interview-blood';
  };

  const getLikelihoodBadge = (likelihood: string | null) => {
    if (!likelihood) return null;
    const config: Record<string, { className: string; label: string }> = {
      high: { className: 'bg-green-500/20 text-green-500', label: 'Strong' },
      medium: { className: 'bg-interview-mustard/20 text-interview-mustard', label: 'Moderate' },
      low: { className: 'bg-interview-blood/20 text-interview-blood', label: 'Low' },
    };
    const c = config[likelihood] || config.medium;
    return <Badge className={`${c.className} border-0`}>{c.label}</Badge>;
  };

  const SimulationCard = ({ simulation }: { simulation: InterviewSimulation }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="h-full hover:border-interview-mustard/50 transition-colors bg-interview-card border-interview-border">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2 text-interview-text">
                {simulation.job_title}
              </CardTitle>
              {simulation.company_name && (
                <p className="text-xs text-interview-muted mt-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {simulation.company_name}
                </p>
              )}
              <p className="text-xs text-interview-muted mt-1">
                {formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
              </p>
            </div>
            {simulation.hireability_score !== null && (
              <Badge className={`shrink-0 ${getScoreBg(simulation.hireability_score)}`}>
                {simulation.hireability_score}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {getLikelihoodBadge(simulation.conversion_likelihood)}
            <Badge variant="outline" className="text-xs border-interview-border text-interview-muted">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(simulation.duration_seconds)}
            </Badge>
            {simulation.status === 'completed' ? (
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : simulation.status === 'in_progress' ? (
              <Badge variant="outline" className="text-xs border-interview-mustard/30 text-interview-mustard">
                <Target className="w-3 h-3 mr-1" />
                In Progress
              </Badge>
            ) : null}
          </div>
          
          <div className="flex items-center gap-1 pt-2 border-t border-interview-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-interview-muted hover:text-interview-text"
              onClick={() => navigate(`/interview-simulator/summary/${simulation.id}`)}
            >
              <ChevronRight className="w-4 h-4 mr-1.5" />
              View Results
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadPDF(simulation)}
              disabled={downloadingId === simulation.id}
              className="text-interview-muted hover:text-interview-mustard"
              title="Download PDF"
            >
              {downloadingId === simulation.id ? (
                <div className="w-4 h-4 border-2 border-interview-mustard/30 border-t-interview-mustard rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(simulation.id)}
              className="text-interview-blood hover:text-interview-blood hover:bg-interview-blood/10"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <Briefcase className="w-12 h-12 text-interview-muted/50 mb-4" />
      <h3 className="text-lg font-medium mb-2 text-interview-text">No interview simulations yet</h3>
      <p className="text-sm text-interview-muted mb-4 max-w-sm">
        Practice your job interviews with AI and your results will appear here.
      </p>
      <Button 
        onClick={() => navigate('/interview-simulator')}
        className="bg-interview-mustard hover:bg-interview-mustard/90 text-interview-bg"
      >
        <Plus className="w-4 h-4 mr-2" />
        Start Interview Simulation
      </Button>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="bg-interview-card border-interview-border">
          <CardHeader>
            <Skeleton className="h-5 w-3/4 bg-interview-border" />
            <Skeleton className="h-3 w-1/4 mt-2 bg-interview-border" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16 bg-interview-border" />
              <Skeleton className="h-5 w-20 bg-interview-border" />
            </div>
            <Skeleton className="h-8 w-full bg-interview-border" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card className="bg-interview-card border-interview-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-interview-text">
          <Briefcase className="h-5 w-5 text-interview-mustard" />
          Interview History
        </CardTitle>
        <CardDescription className="text-interview-muted">
          Your past interview simulations and performance scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-interview-muted" />
            <Input
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-interview-bg border-interview-border text-interview-text"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="text-interview-muted"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="text-interview-muted"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/interview-simulator')}
              className="ml-2 border-interview-mustard text-interview-mustard hover:bg-interview-mustard/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredSimulations.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-8 text-interview-muted">
              No interviews match your search
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }>
            <AnimatePresence>
              {filteredSimulations.map((simulation) => (
                <SimulationCard key={simulation.id} simulation={simulation} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-interview-card border-interview-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-interview-text">Delete Interview?</AlertDialogTitle>
              <AlertDialogDescription className="text-interview-muted">
                This action cannot be undone. This will permanently delete your 
                interview simulation and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={isDeleting}
                className="border-interview-border text-interview-muted"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-interview-blood hover:bg-interview-blood/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
