// // src/components/MonthlyTrendsChart.tsx
// import { Card } from './ui/card';
// import { TrendingUp } from 'lucide-react';
// import { 
//   LineChart, 
//   Line, 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer, 
//   Legend 
// } from 'recharts';

// interface MonthlyTrend {
//   year_month: string;
//   crime_count: number;
// }

// interface MonthlyTrendsChartProps {
//   data: MonthlyTrend[];
//   type?: 'line' | 'bar';
//   height?: number;
// }

// // FIXED: Format month from "2025-08" to "Aug 2025"
// const formatMonth = (yearMonth: string): string => {
//   try {
//     const [year, month] = yearMonth.split('-');
//     const date = new Date(parseInt(year), parseInt(month) - 1);
//     return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
//   } catch (e) {
//     return yearMonth; // Fallback to original if parsing fails
//   }
// };

// // Get short month for axis labels
// const getShortMonth = (yearMonth: string): string => {
//   try {
//     const [year, month] = yearMonth.split('-');
//     const date = new Date(parseInt(year), parseInt(month) - 1);
//     const shortMonth = date.toLocaleDateString('en-US', { month: 'short' });
//     const shortYear = year.slice(-2); // Last 2 digits of year
//     return `${shortMonth} '${shortYear}`;
//   } catch (e) {
//     return yearMonth;
//   }
// };

// export const MonthlyTrendsChart = ({ 
//   data, 
//   type = 'line',
//   height = 350 
// }: MonthlyTrendsChartProps) => {
  
//   if (!data || data.length === 0) {
//     return (
//       <Card className="p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-semibold flex items-center gap-2">
//             <TrendingUp className="h-5 w-5 text-primary" />
//             Monthly Crime Trends
//           </h2>
//         </div>
//         <div className="flex items-center justify-center" style={{ height }}>
//           <p className="text-muted-foreground">No monthly trend data available</p>
//         </div>
//       </Card>
//     );
//   }

//   // FIXED: Transform data with readable month names
//   const chartData = data.map(item => ({
//     ...item,
//     month: formatMonth(item.year_month),           // Full: "Aug 2025"
//     displayMonth: getShortMonth(item.year_month),  // Short: "Aug '25"
//   }));

//   // Calculate statistics
//   const avgCrimes = Math.round(
//     chartData.reduce((sum, item) => sum + item.crime_count, 0) / chartData.length
//   );
  
//   const minCrimes = Math.min(...chartData.map(item => item.crime_count));
//   const maxCrimes = Math.max(...chartData.map(item => item.crime_count));

//   // Calculate trend direction
//   const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
//   const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
  
//   const firstAvg = firstHalf.reduce((sum, item) => sum + item.crime_count, 0) / firstHalf.length;
//   const secondAvg = secondHalf.reduce((sum, item) => sum + item.crime_count, 0) / secondHalf.length;
  
//   const trendDirection = secondAvg > firstAvg ? 'increasing' : 'decreasing';
//   const trendPercentage = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1);

//   const CustomTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
//           <p className="font-semibold mb-1">{data.month}</p>
//           <p className="text-primary">
//             Crimes: <span className="font-bold">{data.crime_count.toLocaleString()}</span>
//           </p>
//           <p className="text-xs text-muted-foreground mt-1">
//             {data.crime_count > avgCrimes ? 'Above' : 'Below'} average
//           </p>
//         </div>
//       );
//     }
//     return null;
//   };

//   const ChartComponent = type === 'line' ? LineChart : BarChart;
//   const DataComponent = type === 'line' ? Line : Bar;

//   return (
//     <Card className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-xl font-semibold flex items-center gap-2">
//             <TrendingUp className="h-5 w-5 text-primary" />
//             Monthly Crime Trends
//           </h2>
//           <p className="text-sm text-muted-foreground mt-1">
//             Showing last {chartData.length} months
//           </p>
//         </div>
        
//         {/* Statistics badges */}
//         <div className="flex gap-4 items-center">
//           <div className="text-right">
//             <p className="text-xs text-muted-foreground">Average</p>
//             <p className="text-lg font-bold">{avgCrimes.toLocaleString()}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-muted-foreground">Trend</p>
//             <p className={`text-lg font-bold ${trendDirection === 'increasing' ? 'text-destructive' : 'text-success'}`}>
//               {trendDirection === 'increasing' ? '+' : '-'}{trendPercentage}%
//             </p>
//           </div>
//         </div>
//       </div>

//       <ResponsiveContainer width="100%" height={height}>
//         <ChartComponent data={chartData}>
//           <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
//           <XAxis 
//             dataKey="displayMonth" 
//             stroke="hsl(var(--muted-foreground))"
//             tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
//             angle={-45}
//             textAnchor="end"
//             height={70}
//           />
//           <YAxis 
//             stroke="hsl(var(--muted-foreground))"
//             tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
//             label={{ 
//               value: 'Number of Crimes', 
//               angle: -90, 
//               position: 'insideLeft',
//               style: { fill: 'hsl(var(--muted-foreground))' }
//             }}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           <Legend />
//           <DataComponent 
//             type={type === 'line' ? 'monotone' : undefined}
//             dataKey="crime_count" 
//             stroke="hsl(var(--primary))" 
//             fill="hsl(var(--primary))"
//             strokeWidth={type === 'line' ? 3 : undefined}
//             name="Crime Count"
//             radius={type === 'bar' ? [8, 8, 0, 0] : undefined}
//           />
//         </ChartComponent>
//       </ResponsiveContainer>

//       {/* Summary statistics */}
//       <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
//         <div>
//           <p className="text-sm text-muted-foreground">Peak Month</p>
//           <p className="font-semibold">
//             {chartData.find(d => d.crime_count === maxCrimes)?.displayMonth || 'N/A'}
//           </p>
//           <p className="text-xs text-primary">{maxCrimes.toLocaleString()} crimes</p>
//         </div>
//         <div>
//           <p className="text-sm text-muted-foreground">Lowest Month</p>
//           <p className="font-semibold">
//             {chartData.find(d => d.crime_count === minCrimes)?.displayMonth || 'N/A'}
//           </p>
//           <p className="text-xs text-success">{minCrimes.toLocaleString()} crimes</p>
//         </div>
//         <div>
//           <p className="text-sm text-muted-foreground">Variation</p>
//           <p className="font-semibold">{((maxCrimes - minCrimes) / avgCrimes * 100).toFixed(0)}%</p>
//           <p className="text-xs text-muted-foreground">from average</p>
//         </div>
//       </div>
//     </Card>
//   );
// };
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface MonthlyTrend {
  year_month: string;
  crime_count: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrend[];
  type?: 'line' | 'area';
  height?: number;
}

export const MonthlyTrendsChart = ({
  data,
  type = 'line',
  height = 400,
}: MonthlyTrendsChartProps) => {
  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.crime_count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.crime_count, 0) / secondHalf.length;
    
    const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return {
      direction: percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable',
      percentage: Math.abs(percentageChange).toFixed(1),
    };
  };

  const trend = calculateTrend();
  const totalCrimes = data.reduce((sum, d) => sum + d.crime_count, 0);
  const avgPerMonth = Math.round(totalCrimes / data.length);
  const maxMonth = data.reduce((max, d) => d.crime_count > max.crime_count ? d : max, data[0]);
  const minMonth = data.reduce((min, d) => d.crime_count < min.crime_count ? d : min, data[0]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{data.year_month}</p>
          <p className="text-primary">
            <span className="font-bold">{data.crime_count.toLocaleString()}</span> crimes
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-5 w-5 text-destructive" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="h-5 w-5 text-success" />
            ) : (
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            )}
            Monthly Crime Trends
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {data.length} months analyzed
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={
            trend.direction === 'up' ? 'destructive' : 
            trend.direction === 'down' ? 'default' : 
            'secondary'
          }>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.percentage}%
          </Badge>
        </div>
      </div>

      <div className={`h-[${height}px] mb-6`}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year_month"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {type === 'area' ? (
              <Area
                type="monotone"
                dataKey="crime_count"
                stroke="hsl(185, 84%, 44%)"
                fill="hsl(185, 84%, 44%)"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Monthly Crimes"
              />
            ) : (
              <Line
                type="monotone"
                dataKey="crime_count"
                stroke="hsl(185, 84%, 44%)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'hsl(185, 84%, 44%)' }}
                activeDot={{ r: 6 }}
                name="Monthly Crimes"
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Peak Month</p>
          <p className="text-lg font-bold">{maxMonth.year_month}</p>
          <p className="text-xs text-primary">{maxMonth.crime_count.toLocaleString()} crimes</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Lowest Month</p>
          <p className="text-lg font-bold">{minMonth.year_month}</p>
          <p className="text-xs text-muted-foreground">{minMonth.crime_count.toLocaleString()} crimes</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Average/Month</p>
          <p className="text-lg font-bold">{avgPerMonth.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">per month</p>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Period</p>
          <p className="text-lg font-bold">{totalCrimes.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">total crimes</p>
        </div>
      </div>
    </Card>
  );
};