// My Pitches page - View and manage saved pitch scripts and AI Coach analyses
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Video, Trash2, Play, Edit, Clock, Calendar,
  Users, ChevronRight, Search, Filter, LayoutGrid, List,
  Plus, TrendingUp, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useSavedPitches, type SavedPitch } from '@/hooks/useSavedPitch';
import { useCoachAnalyses, type CoachAnalysisData } from '@/hooks/useCoachAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/utils/analytics';
import { formatDistanceToNow } from 'date-fns';

const MyPitches = () => {
  const navigate = useNavigate();
  const { pitches, isLoading: pitchesLoading, refetch: refetchPitches } = useSavedPitches();
  const { analyses, isLoading: analysesLoading, refetch: refetchAnalyses } = useCoachAnalyses();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pitch' | 'analysis'; id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPitches = pitches.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.idea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAnalyses = analyses.filter(a => 
    a.transcript?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.prompt_mode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePitch = async () => {
    if (!deleteTarget || deleteTarget.type !== 'pitch') return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_pitches')
        .delete()
        .eq('id', deleteTarget.id);
      
      if (error) throw error;
      
      toast({ title: "Pitch deleted", description: "Your pitch has been removed." });
      trackEvent('Pitch: Deleted', { pitch_id: deleteTarget.id });
      refetchPitches();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Error", description: "Failed to delete pitch.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAnalysis = async () => {
    if (!deleteTarget || deleteTarget.type !== 'analysis') return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('coach_analysis')
        .delete()
        .eq('id', deleteTarget.id);
      
      if (error) throw error;
      
      toast({ title: "Analysis deleted", description: "Your analysis has been removed." });
      trackEvent('Coach Analysis: Deleted', { analysis_id: deleteTarget.id });
      refetchAnalyses();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Error", description: "Failed to delete analysis.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${minutes} min`;
  };

  const PitchCard = ({ pitch }: { pitch: SavedPitch }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{pitch.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(pitch.updated_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {formatDuration(pitch.duration_minutes)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pitch.audience_label && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {pitch.audience_label}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {pitch.track.replace('-', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                // Navigate to continue editing this pitch
                trackEvent('Pitch: Opened', { pitch_id: pitch.id });
                navigate('/', { state: { loadPitchId: pitch.id } });
              }}
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget({ type: 'pitch', id: pitch.id })}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const AnalysisCard = ({ analysis }: { analysis: CoachAnalysisData }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                AI Coach Session
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
              </p>
            </div>
            {analysis.overall_score && (
              <Badge 
                variant={analysis.overall_score >= 70 ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {analysis.overall_score}/100
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {analysis.delivery_metrics && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              {analysis.delivery_metrics.wpm && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{analysis.delivery_metrics.wpm} WPM</span>
                </div>
              )}
              {analysis.duration_seconds && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{Math.round(analysis.duration_seconds / 60)} min</span>
                </div>
              )}
            </div>
          )}
          
          {analysis.thumbnail_url && (
            <div className="relative aspect-video rounded-md overflow-hidden mb-3 bg-muted">
              <img 
                src={analysis.thumbnail_url} 
                alt="Recording thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                trackEvent('Coach Analysis: Viewed', { analysis_id: analysis.id });
                // Navigate to view this analysis
                navigate('/ai-coach', { state: { viewAnalysisId: analysis.id } });
              }}
            >
              <ChevronRight className="w-4 h-4 mr-1.5" />
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget({ type: 'analysis', id: analysis.id })}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const EmptyState = ({ type }: { type: 'pitches' | 'analyses' }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {type === 'pitches' ? (
        <>
          <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved pitches yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Generate a pitch and it will be automatically saved here for you to access anytime.
          </p>
          <Button onClick={() => navigate('/')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Pitch
          </Button>
        </>
      ) : (
        <>
          <Video className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No AI Coach sessions yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Practice your pitch with AI Coach and your session results will appear here.
          </p>
          <Button onClick={() => navigate('/ai-coach')}>
            <Mic className="w-4 h-4 mr-2" />
            Start Practice Session
          </Button>
        </>
      )}
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">My Pitches</h1>
        <p className="text-muted-foreground">
          View and manage your saved pitch scripts and AI Coach sessions
        </p>
      </motion.div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pitches and sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pitches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pitches" className="gap-2">
            <FileText className="w-4 h-4" />
            Pitches
            {pitches.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pitches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Video className="w-4 h-4" />
            AI Coach Sessions
            {analyses.length > 0 && (
              <Badge variant="secondary" className="ml-1">{analyses.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pitches">
          {pitchesLoading ? (
            <LoadingSkeleton />
          ) : filteredPitches.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                No pitches match your search
              </div>
            ) : (
              <EmptyState type="pitches" />
            )
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
            }>
              <AnimatePresence>
                {filteredPitches.map((pitch, i) => (
                  <PitchCard key={pitch.id} pitch={pitch} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {analysesLoading ? (
            <LoadingSkeleton />
          ) : filteredAnalyses.length === 0 ? (
            searchQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                No sessions match your search
              </div>
            ) : (
              <EmptyState type="analyses" />
            )
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
            }>
              <AnimatePresence>
                {filteredAnalyses.map((analysis, i) => (
                  <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'pitch' ? 'Pitch' : 'Analysis'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your 
              {deleteTarget?.type === 'pitch' ? ' pitch script' : ' AI Coach session'} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTarget?.type === 'pitch' ? handleDeletePitch : handleDeleteAnalysis}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPitches;
