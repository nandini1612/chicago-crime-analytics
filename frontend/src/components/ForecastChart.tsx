import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ForecastData {
  date: string;
  day: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface ForecastChartProps {
  data: ForecastData[];
  historicalAvg: number;
  height?: number;
}

export const ForecastChart = ({
  data,
  historicalAvg,
  height = 400,
}: ForecastChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No forecast data available</p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background border border-border p-4 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.day}</p>
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="space-y-1">
            <p className="text-primary font-bold">
              Predicted: {data.predicted} crimes
            </p>
            <p className="text-xs text-muted-foreground">
              Range: {data.lower_bound} - {data.upper_bound}
            </p>
            <p className="text-xs text-muted-foreground">
              Confidence: {data.confidence}%
            </p>
            <div className="flex items-center gap-1 mt-2">
              {data.trend === 'up' && <TrendingUp className="h-3 w-3 text-destructive" />}
              {data.trend === 'down' && <TrendingDown className="h-3 w-3 text-success" />}
              {data.trend === 'stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
              <span className="text-xs capitalize">{data.trend} trend</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="confidenceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(185, 84%, 44%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(185, 84%, 44%)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            label={{ value: 'Day of Week', position: 'insideBottom', offset: -5 }}
          />
          
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            label={{ value: 'Crime Count', angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Confidence Interval Area */}
          <Area
            type="monotone"
            dataKey="upper_bound"
            stroke="none"
            fill="url(#confidenceArea)"
            fillOpacity={1}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="lower_bound"
            stroke="none"
            fill="url(#confidenceArea)"
            fillOpacity={1}
            name="Lower Bound"
          />
          
          {/* Predicted Line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="hsl(185, 84%, 44%)"
            strokeWidth={3}
            dot={{ r: 6, fill: 'hsl(185, 84%, 44%)', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8 }}
            name="Predicted Crimes"
          />
          
          {/* Historical Average Line */}
          {historicalAvg > 0 && (
            <Line
              type="monotone"
              dataKey={() => historicalAvg}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Historical Avg"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};