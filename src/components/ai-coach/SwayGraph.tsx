// Sway Graph - Body movement visualization over time

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Move, AlertTriangle } from 'lucide-react';

interface SwayDataPoint {
  time: number;
  sway: number;
}

interface SwayGraphProps {
  data: SwayDataPoint[];
  className?: string;
}

export const SwayGraph = ({ data, className }: SwayGraphProps) => {
  // Find spikes (nervousness indicators)
  const spikes = useMemo(() => {
    if (data.length < 2) return [];
    
    const threshold = 30; // sway > 30 indicates nervousness
    return data
      .filter((d, i) => {
        if (i === 0) return false;
        const change = Math.abs(d.sway - data[i - 1].sway);
        return change > 20 || Math.abs(d.sway) > threshold;
      })
      .map(d => d.time);
  }, [data]);

  // Calculate average sway for stability grade
  const avgAbsSway = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + Math.abs(d.sway), 0) / data.length;
  }, [data]);

  const getStabilityGrade = () => {
    if (avgAbsSway < 10) return { grade: 'A', label: 'Very Stable', color: 'text-green-500' };
    if (avgAbsSway < 20) return { grade: 'B', label: 'Mostly Stable', color: 'text-yellow-500' };
    return { grade: 'C', label: 'Too Much Movement', color: 'text-red-500' };
  };

  const stability = getStabilityGrade();

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Move className="w-4 h-4" />
            Body Stability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No body tracking data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Move className="w-4 h-4" />
              Body Stability Over Time
            </CardTitle>
            <CardDescription>
              Horizontal movement (sway) during your pitch
            </CardDescription>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${stability.color}`}>{stability.grade}</span>
            <p className="text-xs text-muted-foreground">{stability.label}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="swayGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="swayGradientNeg" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="time" 
                tickFormatter={(t) => `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[-50, 50]}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              
              {/* Center line (ideal - no sway) */}
              <ReferenceLine y={0} stroke="hsl(var(--success))" strokeDasharray="3 3" />
              
              {/* Danger zones */}
              <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeOpacity={0.5} strokeDasharray="2 2" />
              <ReferenceLine y={-30} stroke="hsl(var(--destructive))" strokeOpacity={0.5} strokeDasharray="2 2" />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [
                  `${value > 0 ? '+' : ''}${value}% ${Math.abs(value) > 30 ? '⚠️ Swaying!' : ''}`,
                  'Movement'
                ]}
                labelFormatter={(time) => `Time: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`}
              />
              
              <Area
                type="monotone"
                dataKey="sway"
                stroke="none"
                fill="url(#swayGradientPos)"
              />
              
              <Line
                type="monotone"
                dataKey="sway"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                  fill: 'hsl(var(--primary))',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Spike indicators */}
        {spikes.length > 0 && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-medium text-destructive">Nervousness detected</span>
              <span className="text-muted-foreground"> at </span>
              <span className="text-foreground">
                {spikes.slice(0, 3).map(t => 
                  `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
                ).join(', ')}
                {spikes.length > 3 && ` +${spikes.length - 3} more`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
