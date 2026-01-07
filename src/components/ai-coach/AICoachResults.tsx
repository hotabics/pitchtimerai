// AI Coach Results View - The Feedback Dashboard

import { motion } from 'framer-motion';
import { 
  Eye, 
  Gauge, 
  MessageSquare, 
  Target, 
  ThumbsUp, 
  AlertTriangle,
  Check,
  X,
  Lightbulb,
  Quote,
  Star,
  RotateCcw,
  Edit3,
  Smile,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAICoachStore } from '@/stores/aiCoachStore';

interface AICoachResultsProps {
  onReRecord: () => void;
  onEditScript: () => void;
}

export const AICoachResults = ({ onReRecord, onEditScript }: AICoachResultsProps) => {
  const { results } = useAICoachStore();

  if (!results) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No results available</p>
      </div>
    );
  }

  const { deliveryMetrics, contentAnalysis, contentCoverage, transcript } = results;
  
  // WPM color coding
  const getWPMStatus = (wpm: number) => {
    if (wpm >= 130 && wpm <= 150) return { color: 'text-success', label: 'Optimal' };
    if (wpm >= 110 && wpm < 130) return { color: 'text-warning', label: 'Slightly slow' };
    if (wpm > 150 && wpm <= 170) return { color: 'text-warning', label: 'Slightly fast' };
    return { color: 'text-destructive', label: wpm < 110 ? 'Too slow' : 'Too fast' };
  };

  const wpmStatus = getWPMStatus(deliveryMetrics.wpm);

  // Sentiment to emoji
  const sentimentEmoji: Record<string, string> = {
    'Confident': '💪',
    'Hesitant': '😬',
    'Nervous': '😰',
    'Passionate': '🔥',
    'Monotone': '😐',
    'Engaging': '✨',
  };

  const coverageItems = [
    { key: 'problem', label: 'Problem Statement', covered: contentCoverage.problem },
    { key: 'solution', label: 'Solution', covered: contentCoverage.solution },
    { key: 'market', label: 'Market Size', covered: contentCoverage.market },
    { key: 'traction', label: 'Traction', covered: contentCoverage.traction },
    { key: 'team', label: 'Team', covered: contentCoverage.team },
    { key: 'uniqueValue', label: 'Unique Value', covered: contentCoverage.uniqueValue },
    { key: 'ask', label: 'Ask/CTA', covered: contentCoverage.ask },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Coach Feedback</h2>
          <p className="text-muted-foreground">
            Analysis completed • {results.processedAt.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReRecord}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Re-Record
          </Button>
          <Button onClick={onEditScript}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Script
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Delivery Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Delivery
            </CardTitle>
            <CardDescription>How you presented</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Eye Contact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Eye Contact</span>
                </div>
                <span className={`text-lg font-bold ${
                  deliveryMetrics.eyeContactPercent >= 70 ? 'text-success' : 
                  deliveryMetrics.eyeContactPercent >= 50 ? 'text-warning' : 'text-destructive'
                }`}>
                  {deliveryMetrics.eyeContactPercent}%
                </span>
              </div>
              <Progress value={deliveryMetrics.eyeContactPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {deliveryMetrics.eyeContactPercent >= 70 
                  ? 'Great job maintaining eye contact!' 
                  : 'Try looking at the camera more often'}
              </p>
            </div>

            {/* WPM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pace (WPM)</span>
                </div>
                <span className={`text-lg font-bold ${wpmStatus.color}`}>
                  {deliveryMetrics.wpm}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-1/5 bg-destructive/30" />
                  <div className="w-1/5 bg-warning/30" />
                  <div className="w-1/5 bg-success/30" />
                  <div className="w-1/5 bg-warning/30" />
                  <div className="w-1/5 bg-destructive/30" />
                </div>
                <div 
                  className="absolute top-0 w-1 h-full bg-foreground rounded"
                  style={{ 
                    left: `${Math.min(100, Math.max(0, (deliveryMetrics.wpm - 80) / 140 * 100))}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {wpmStatus.label} • Optimal: 130-150 WPM
              </p>
            </div>

            {/* Filler Words */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filler Words</span>
                </div>
                <span className={`text-lg font-bold ${
                  deliveryMetrics.fillerCount <= 3 ? 'text-success' : 
                  deliveryMetrics.fillerCount <= 7 ? 'text-warning' : 'text-destructive'
                }`}>
                  {deliveryMetrics.fillerCount}
                </span>
              </div>
              {Object.keys(deliveryMetrics.fillerBreakdown).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(deliveryMetrics.fillerBreakdown).map(([word, count]) => (
                    <Badge key={word} variant="secondary" className="text-xs">
                      "{word}" × {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Smile & Stability */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Smile className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{deliveryMetrics.smilePercent}%</p>
                <p className="text-xs text-muted-foreground">Smiling</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{deliveryMetrics.stabilityScore}%</p>
                <p className="text-xs text-muted-foreground">Stability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Content Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Content
            </CardTitle>
            <CardDescription>What you covered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coverage Checklist */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Coverage Checklist</p>
              <div className="space-y-1">
                {coverageItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    {item.covered ? (
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className={item.covered ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Points */}
            {contentAnalysis?.key_missing_points && contentAnalysis.key_missing_points.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <p className="text-sm font-medium">Missing Elements</p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {contentAnalysis.key_missing_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-warning">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tone/Sentiment */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Detected Tone</p>
                <span className="text-2xl">{sentimentEmoji[contentAnalysis?.sentiment || 'Engaging']}</span>
              </div>
              <p className="text-xl font-bold">{contentAnalysis?.sentiment || 'Engaging'}</p>
            </div>

            {/* Strengths */}
            {contentAnalysis?.strengths && contentAnalysis.strengths.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-success" />
                  <p className="text-sm font-medium">Strengths</p>
                </div>
                <ul className="space-y-1 text-sm">
                  {contentAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 3: Jury Verdict */}
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Jury Verdict
            </CardTitle>
            <CardDescription>Expert evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Score */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {contentAnalysis?.score || 7}
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>

            {/* Persona Quote */}
            <div className="relative p-4 rounded-lg bg-muted/50">
              <Quote className="absolute top-2 left-2 w-6 h-6 text-muted-foreground/30" />
              <div className="flex items-center gap-2 mb-2 pl-4">
                <span className="text-xl">👨‍💼</span>
                <span className="text-sm font-medium">VC Investor</span>
              </div>
              <p className="text-sm italic pl-4">
                "{contentAnalysis?.specific_feedback || 'Good start, but needs more data-driven insights.'}"
              </p>
            </div>

            {/* Recommendations */}
            {contentAnalysis?.recommendations && contentAnalysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Recommendations</p>
                </div>
                <ul className="space-y-2">
                  {contentAnalysis.recommendations.slice(0, 5).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Full Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{transcript}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
