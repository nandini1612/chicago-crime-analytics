import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useMemo } from "react";

interface HeatmapChartProps {
  data: Record<string, Array<{ hour: number; count: number }>>;
  height?: number;
}

export const HeatmapChart = ({ data, height = 500 }: HeatmapChartProps) => {
  // Get top 10 crime types
  const crimeTypes = useMemo(() => {
    return Object.keys(data)
      .slice(0, 10)
      .filter(type => data[type] && data[type].length > 0);
  }, [data]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate max count for color intensity
  const maxCount = useMemo(() => {
    let max = 0;
    crimeTypes.forEach(type => {
      data[type].forEach(item => {
        if (item.count > max) max = item.count;
      });
    });
    return max;
  }, [data, crimeTypes]);

  // Color scale function
  const getColor = (count: number) => {
    if (count === 0) return 'hsl(var(--secondary))';
    const intensity = (count / maxCount);
    
    if (intensity > 0.75) return 'hsl(185, 84%, 35%)'; // Darkest teal
    if (intensity > 0.50) return 'hsl(185, 84%, 44%)'; // Dark teal
    if (intensity > 0.25) return 'hsl(185, 70%, 55%)'; // Medium teal
    return 'hsl(185, 60%, 70%)'; // Light teal
  };

  // Get count for specific hour
  const getCountForHour = (crimeType: string, hour: number): number => {
    const hourData = data[crimeType]?.find(item => item.hour === hour);
    return hourData ? hourData.count : 0;
  };

  if (crimeTypes.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No heatmap data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Hourly Crime Heatmap by Type</h3>
        </div>
        <Badge variant="outline">{crimeTypes.length} crime types</Badge>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Hour headers */}
          <div className="flex mb-2">
            <div className="w-48 flex-shrink-0 pr-4">
              <span className="text-xs font-semibold text-muted-foreground">Crime Type</span>
            </div>
            <div className="flex-1 grid grid-cols-24 gap-1">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="text-center text-[10px] font-medium text-muted-foreground"
                  style={{ fontSize: '9px' }}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap rows */}
          <div className="space-y-1">
            {crimeTypes.map((type) => {
              const totalForType = data[type].reduce((sum, item) => sum + item.count, 0);
              
              return (
                <div key={type} className="flex items-center">
                  {/* Crime type label */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold truncate" title={type}>
                        {type}
                      </p>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {totalForType}
                      </span>
                    </div>
                  </div>
                  
                  {/* Hour cells */}
                  <div className="flex-1 grid grid-cols-24 gap-1">
                    {hours.map((hour) => {
                      const count = getCountForHour(type, hour);
                      const color = getColor(count);
                      
                      return (
                        <div
                          key={hour}
                          className="aspect-square rounded transition-all hover:scale-125 hover:z-10 hover:shadow-lg cursor-pointer relative group"
                          style={{ backgroundColor: color }}
                          title={`${type}\n${hour}:00 - ${count} crimes`}
                        >
                          {/* Tooltip on hover */}
                          {count > 0 && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-xs">
                              <p className="font-semibold">{type}</p>
                              <p className="text-muted-foreground">{hour}:00</p>
                              <p className="text-primary font-bold">{count} crimes</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-4 pt-4 border-t">
            <span className="text-xs font-medium text-muted-foreground">Low</span>
            <div className="flex gap-1">
              <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(185, 60%, 70%)' }}></div>
              <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(185, 70%, 55%)' }}></div>
              <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(185, 84%, 44%)' }}></div>
              <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(185, 84%, 35%)' }}></div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">High</span>
            <div className="ml-4 flex items-center gap-2">
              <div className="w-8 h-4 rounded bg-secondary"></div>
              <span className="text-xs text-muted-foreground">No Data</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};