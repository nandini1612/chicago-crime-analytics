// src/components/CrimeTypeDistribution.tsx
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';

interface CrimeType {
  crime_type: string;
  count: number;
  percentage: number;
}

interface CrimeTypeDistributionProps {
  data: CrimeType[];
  height?: number;
  maxTypes?: number;
}

// Function to get computed style of CSS variables
const getColor = (variable: string) => {
    if (typeof window === 'undefined') return '#000';
    const colorValue = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return `hsl(${colorValue})`;
};

export const CrimeTypeDistribution = ({ 
  data, 
  height = 350,
  maxTypes = 7 
}: CrimeTypeDistributionProps) => {
  const [colors, setColors] = useState<string[]>([]);

  // Get colors from CSS design system on mount
  useEffect(() => {
    setColors([
      getColor('--primary'),       // Teal
      getColor('--accent'),         // Golden Yellow
      getColor('--destructive'),    // Red
      getColor('--success'),        // Green
      getColor('--warning'),        // Orange
      'hsl(185, 84%, 60%)',        // Light Teal
      'hsl(42, 78%, 72%)',         // Light Gold
    ]);
  }, []);
  
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            Crime Type Distribution
          </h2>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No crime type data available</p>
        </div>
      </Card>
    );
  }

  // Group smaller slices into "Others"
  let chartData = [...data];
  if (data.length > maxTypes) {
    const topTypes = data.slice(0, maxTypes - 1);
    const otherTypes = data.slice(maxTypes - 1);
    const othersCount = otherTypes.reduce((sum, type) => sum + type.count, 0);
    const othersPercentage = otherTypes.reduce((sum, type) => sum + type.percentage, 0);
    
    chartData = [...topTypes, { crime_type: 'Others', count: othersCount, percentage: othersPercentage }];
  }

  const pieData = chartData.map(item => ({ 
    name: item.crime_type, 
    value: item.count, 
    percentage: item.percentage 
  }));
  
  const totalCrimes = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-primary">Count: <span className="font-bold">{data.value.toLocaleString()}</span></p>
          <p className="text-sm text-muted-foreground">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-primary" />
          Crime Type Distribution
        </h2>
        <Badge variant="outline">Top {chartData.length} of {data.length} Types</Badge>
      </div>

      {/* FIXED: Balanced 50/50 layout instead of 3/5 and 2/5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Donut Chart - Takes 50% of the space */}
        <div className="h-[350px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                outerRadius={110}
                innerRadius={65}
                fill="#8884d8" 
                dataKey="value" 
                stroke="hsl(var(--card))" 
                strokeWidth={3}
              >
                {pieData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Crimes</p>
              <p className="text-3xl font-bold">{totalCrimes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* FIXED: Structured List - Takes 50% with scrolling */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {chartData.map((type, index) => (
            <div 
              key={type.crime_type} 
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg transition-all hover:bg-secondary group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }} 
                />
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {type.crime_type}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-bold text-sm">{type.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{type.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};