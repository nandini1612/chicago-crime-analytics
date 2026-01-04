// // src/components/HourlyPatternsChart.tsx
// import { Card } from './ui/card';
// import { Badge } from './ui/badge';
// import { Clock, TrendingUp } from 'lucide-react';
// import { BarChart, Cell, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';

// interface HourlyData {
//   hour: number;
//   count: number;
// }

// interface HourlyPatternsChartProps {
//   data: HourlyData[];
//   peakHours?: number[];
//   height?: number;
// }

// export const HourlyPatternsChart = ({ 
//   data, 
//   peakHours = [],
//   height = 300 
// }: HourlyPatternsChartProps) => {
//   if (!data || data.length === 0) {
//     return (
//       <Card className="p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-semibold flex items-center gap-2">
//             <Clock className="h-5 w-5 text-primary" />
//             Hourly Crime Patterns
//           </h2>
//         </div>
//         <div className="flex items-center justify-center" style={{ height }}>
//           <p className="text-muted-foreground">No hourly data available</p>
//         </div>
//       </Card>
//     );
//   }

//   // Ensure all 24 hours are present
//   const completeData = Array.from({ length: 24 }, (_, hour) => {
//     const existing = data.find(d => d.hour === hour);
//     return existing || { hour, count: 0 };
//   });

//   // Format data for display
//   const formattedData = completeData.map(item => ({
//     ...item,
//     hourLabel: `${item.hour.toString().padStart(2, '0')}:00`,
//     isPeak: peakHours.includes(item.hour)
//   }));

//   // Calculate statistics
//   const totalCrimes = completeData.reduce((sum, d) => sum + d.count, 0);
//   const avgPerHour = Math.round(totalCrimes / 24);
//   const maxHour = completeData.reduce((max, d) => d.count > max.count ? d : max, completeData[0]);
//   const minHour = completeData.reduce((min, d) => d.count < min.count ? d : min, completeData[0]);

//   // Calculate average line data
//   const averageLine = Array(24).fill(avgPerHour);

//   // Determine time of day labels
//   const getTimeOfDay = (hour: number) => {
//     if (hour >= 6 && hour < 12) return 'Morning';
//     if (hour >= 12 && hour < 17) return 'Afternoon';
//     if (hour >= 17 && hour < 21) return 'Evening';
//     return 'Night';
//   };

//   // Group by time of day
//   const timeOfDayStats = {
//     morning: completeData.filter(d => d.hour >= 6 && d.hour < 12).reduce((sum, d) => sum + d.count, 0),
//     afternoon: completeData.filter(d => d.hour >= 12 && d.hour < 17).reduce((sum, d) => sum + d.count, 0),
//     evening: completeData.filter(d => d.hour >= 17 && d.hour < 21).reduce((sum, d) => sum + d.count, 0),
//     night: completeData.filter(d => d.hour >= 21 || d.hour < 6).reduce((sum, d) => sum + d.count, 0)
//   };

//   const maxTimeOfDay = Object.entries(timeOfDayStats).reduce((max, [period, count]) => 
//     count > max.count ? { period, count } : max
//   , { period: 'morning', count: 0 });

//   // Custom tooltip
//   const CustomTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
//           <p className="font-semibold mb-1">{data.hourLabel}</p>
//           <p className="text-primary">
//             Crimes: <span className="font-bold">{data.count.toLocaleString()}</span>
//           </p>
//           <p className="text-sm text-muted-foreground">
//             {getTimeOfDay(data.hour)}
//           </p>
//           {data.isPeak && (
//             <Badge variant="destructive" className="mt-1">Peak Hour</Badge>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <Card className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-xl font-semibold flex items-center gap-2">
//           <Clock className="h-5 w-5 text-primary" />
//           Hourly Crime Patterns
//         </h2>
//         <Badge variant="outline">
//           24-hour analysis
//         </Badge>
//       </div>

//       <ResponsiveContainer width="100%" height={height}>
//         <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//           <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
//           <XAxis 
//             dataKey="hourLabel" 
//             angle={-45}
//             textAnchor="end"
//             height={80}
//             tick={{ fontSize: 10 }}
//             interval={1}
//           />
//           <YAxis 
//             tick={{ fontSize: 12 }}
//             label={{ value: 'Crime Count', angle: -90, position: 'insideLeft' }}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           <Legend />
          
//           {/* Average line */}
//           <Line
//             type="monotone"
//             dataKey={() => avgPerHour}
//             stroke="hsl(var(--muted-foreground))"
//             strokeWidth={2}
//             strokeDasharray="5 5"
//             dot={false}
//             name="Average"
//           />
          
//           {/* Bars for actual counts */}
//           <Bar 
//             dataKey="count" 
//             fill="hsl(var(--primary))"
//             name="Crimes"
//             radius={[4, 4, 0, 0]}
//           >
//             {formattedData.map((entry, index) => (
//               <Cell 
//                 key={`cell-${index}`} 
//                 fill={entry.isPeak ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
//               />
//             ))}
//           </Bar>
//         </ComposedChart>
//       </ResponsiveContainer>

//       {/* Statistics Grid */}
//       <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
//         <div className="text-center p-3 bg-gradient-subtle rounded-lg">
//           <div className="flex items-center justify-center gap-1 mb-1">
//             <TrendingUp className="h-4 w-4 text-primary" />
//             <p className="text-xs text-muted-foreground">Peak Hour</p>
//           </div>
//           <p className="font-bold text-lg">{maxHour.hour.toString().padStart(2, '0')}:00</p>
//           <p className="text-xs text-destructive">{maxHour.count.toLocaleString()} crimes</p>
//         </div>
        
//         <div className="text-center p-3 bg-gradient-subtle rounded-lg">
//           <p className="text-xs text-muted-foreground mb-1">Quietest Hour</p>
//           <p className="font-bold text-lg">{minHour.hour.toString().padStart(2, '0')}:00</p>
//           <p className="text-xs text-success">{minHour.count.toLocaleString()} crimes</p>
//         </div>
        
//         <div className="text-center p-3 bg-gradient-subtle rounded-lg">
//           <p className="text-xs text-muted-foreground mb-1">Average/Hour</p>
//           <p className="font-bold text-lg">{avgPerHour.toLocaleString()}</p>
//           <p className="text-xs text-muted-foreground">per hour</p>
//         </div>
        
//         <div className="text-center p-3 bg-gradient-subtle rounded-lg">
//           <p className="text-xs text-muted-foreground mb-1">Most Active</p>
//           <p className="font-bold text-lg capitalize">{maxTimeOfDay.period}</p>
//           <p className="text-xs text-muted-foreground">{maxTimeOfDay.count.toLocaleString()} total</p>
//         </div>
//       </div>

//       {/* Time of Day Breakdown */}
//       <div className="mt-6">
//         <h3 className="font-semibold mb-3">Time of Day Breakdown</h3>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           {Object.entries(timeOfDayStats).map(([period, count]) => {
//             const percentage = ((count / totalCrimes) * 100).toFixed(1);
//             return (
//               <div key={period} className="p-4 bg-secondary/30 rounded-lg">
//                 <div className="flex items-center justify-between mb-2">
//                   <p className="font-semibold capitalize">{period}</p>
//                   <Badge variant="outline" className="text-xs">
//                     {percentage}%
//                   </Badge>
//                 </div>
//                 <p className="text-2xl font-bold">{count.toLocaleString()}</p>
//                 <div className="mt-2 h-2 bg-secondary rounded-full">
//                   <div 
//                     className="h-2 bg-primary rounded-full transition-all" 
//                     style={{ width: `${percentage}%` }}
//                   ></div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Peak Hours List */}
//       {peakHours.length > 0 && (
//         <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
//           <p className="font-semibold mb-2">Peak Hours Identified:</p>
//           <div className="flex flex-wrap gap-2">
//             {peakHours.map(hour => (
//               <Badge key={hour} variant="destructive">
//                 {hour.toString().padStart(2, '0')}:00
//               </Badge>
//             ))}
//           </div>
//         </div>
//       )}
//     </Card>
//   );
// };
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface HourlyPatternsChartProps {
  data: Array<{ hour: number; count: number }>;
  peakHours: number[];
  height?: number;
}

export const HourlyPatternsChart = ({
  data,
  peakHours,
  height = 350,
}: HourlyPatternsChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPeak = peakHours.includes(data.hour);
      
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">
            {data.hour}:00 - {data.hour + 1}:00
            {isPeak && <Badge variant="destructive" className="ml-2 text-xs">Peak</Badge>}
          </p>
          <p className="text-primary">
            <span className="font-bold">{data.count}</span> crimes
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const totalCrimes = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerHour = Math.round(totalCrimes / 24);
  const maxHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0]);
  const minHour = data.reduce((min, d) => d.count < min.count ? d : min, data[0]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Hourly Crime Patterns</h3>
        </div>
        <Badge variant="secondary">{totalCrimes.toLocaleString()} total crimes</Badge>
      </div>

      <div className="h-[${height}px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="hour"
              tickFormatter={(hour) => `${hour}:00`}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="count"
              fill="hsl(185, 84%, 44%)"
              radius={[4, 4, 0, 0]}
              name="Crimes"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Peak Hour</p>
          <p className="text-xl font-bold">{maxHour.hour}:00</p>
          <p className="text-xs text-primary">{maxHour.count} crimes</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Quietest Hour</p>
          <p className="text-xl font-bold">{minHour.hour}:00</p>
          <p className="text-xs text-muted-foreground">{minHour.count} crimes</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Average/Hour</p>
          <p className="text-xl font-bold">{avgPerHour}</p>
          <p className="text-xs text-muted-foreground">per hour</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Most Active</p>
          <p className="text-xl font-bold">
            {maxHour.hour >= 18 || maxHour.hour < 6 ? 'Night' : 'Day'}
          </p>
          <p className="text-xs text-muted-foreground">
            {maxHour.hour >= 18 || maxHour.hour < 6 ? `${maxHour.count} total` : `${maxHour.count} total`}
          </p>
        </div>
      </div>

      {/* Peak Hours Identified */}
      {peakHours.length > 0 && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="font-semibold mb-2 text-destructive">Peak Hours Identified:</p>
          <div className="flex flex-wrap gap-2">
            {peakHours.map((hour) => (
              <Badge key={hour} variant="destructive">
                {hour}:00
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};