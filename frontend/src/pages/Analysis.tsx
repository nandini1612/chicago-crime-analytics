import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrimeData } from "@/hooks/use-crime-data";
import { HourlyPatternsChart } from "@/components/HourlyPatternsChart";
import { HeatmapChart } from "@/components/HeatmapChart";
import { ForecastChart } from "@/components/ForecastChart";
import { MonthlyTrendsChart } from "@/components/MonthlyTrendsChart";
import {
  Activity,
  Clock,
  MapPin,
  Download,
  Zap,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AnalysisData {
  hourlyData: HourlyData | null;
  forecast: Forecast[];
  riskAssessment: RiskAssessment | null;
  temporalTrends: TemporalTrend[];
  spatialData: SpatialData | null;
}

interface HourlyData {
  heatmap: Record<string, Array<{ hour: number; count: number }>>;
  peak_hours: number[];
  total_crimes: number;
}

interface Forecast {
  date: string;
  day: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface RiskAssessment {
  overall_risk: string;
  high_risk_areas?: Array<{
    area: string;
    count: number;
    lat?: number;
    lng?: number;
  }>;
}

interface TemporalTrend {
  crime_type: string;
  trend: 'increasing' | 'decreasing';
}

interface SpatialData {
  districts: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalCrimes: number;
}

const Analysis = () => {
  const [activeTimeRange, setActiveTimeRange] = useState("90d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    hourlyData: null,
    forecast: [],
    riskAssessment: null,
    temporalTrends: [],
    spatialData: null,
  });

  const {
    isConnected,
    crimeTypes,
    monthlyTrends,
    crimeData,
    loadTemporalTrends,
    loadHourlyDistribution,
    load7DayForecast,
    loadRiskAssessment,
  } = useCrimeData();

  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "1y": return 365;
      default: return 90;
    }
  };

  // Process spatial data from crime features
  const processedSpatialData = useMemo(() => {
    if (!crimeData?.features || crimeData.features.length === 0) {
      return null;
    }

    const districts = new Map<string, { count: number; crimes: any[] }>();
    
    crimeData.features.forEach(feature => {
      let district = feature.properties?.district || 
                     feature.properties?.ward || 
                     feature.properties?.beat;
      
      if (!district || district === '' || district === 'null') {
        const lat = feature.geometry?.coordinates[1];
        if (lat) {
          const districtNum = Math.floor((lat - 41.6) / 0.02) + 1;
          district = `District ${districtNum}`;
        } else {
          district = 'Unknown';
        }
      }
      
      const districtKey = String(district).trim();
      
      if (!districts.has(districtKey)) {
        districts.set(districtKey, { count: 0, crimes: [] });
      }
      const districtData = districts.get(districtKey)!;
      districtData.count++;
      districtData.crimes.push(feature);
    });

    const total = crimeData.features.length;
    const districtArray = Array.from(districts.entries())
      .map(([name, data]) => ({
        name: name,
        count: data.count,
        percentage: (data.count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      districts: districtArray,
      totalCrimes: total
    };
  }, [crimeData]);

  const loadAnalysisData = useCallback(async () => {
    if (!refreshing) {
      setLoading(true);
    }
    
    try {
      const days = getDaysFromRange(activeTimeRange);

      const [trends, hourly, forecastData, risk] = await Promise.allSettled([
        loadTemporalTrends({ period: 'daily', days }),
        loadHourlyDistribution(days),
        load7DayForecast('sma'),
        loadRiskAssessment(),
      ]);

      const newAnalysisData: AnalysisData = {
        temporalTrends: trends.status === 'fulfilled' ? (trends.value || []) : [],
        hourlyData: hourly.status === 'fulfilled' ? hourly.value : null,
        forecast: forecastData.status === 'fulfilled' ? (forecastData.value || []) : [],
        riskAssessment: risk.status === 'fulfilled' ? risk.value : null,
        spatialData: processedSpatialData,
      };

      setAnalysisData(newAnalysisData);

    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTimeRange, loadTemporalTrends, loadHourlyDistribution, load7DayForecast, loadRiskAssessment, processedSpatialData, refreshing]);

  useEffect(() => {
    if (isConnected) {
      loadAnalysisData();
    }
  }, [isConnected, loadAnalysisData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisData();
  };

  const handleExport = () => {
    const exportData = {
      timeRange: activeTimeRange,
      generatedAt: new Date().toISOString(),
      metrics: calculateMetrics(),
      ...analysisData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crime-analysis-${activeTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateMetrics = useCallback(() => {
    const { temporalTrends, hourlyData, riskAssessment, spatialData } = analysisData;

    if (loading && temporalTrends.length === 0) {
      return { 
        crimeRateChange: '...', 
        peakHourFormatted: 'N/A',
        hotspotCount: '...', 
        riskLevel: '...' 
      };
    }

    const totalTrends = temporalTrends.length;
    const increasingTrends = temporalTrends.filter(t => t.trend === 'increasing').length;
    const crimeRateChange = totalTrends > 0 
      ? (((increasingTrends - (totalTrends - increasingTrends)) / totalTrends) * 50).toFixed(1)
      : '0.0';

    // Get peak hour from hourly data (ensure array safe access)
    const peakHour = hourlyData?.peak_hours?.[0] ?? 0;

    // Get high risk area count
    const hotspotCount = riskAssessment?.high_risk_areas?.length ?? 0;

    return {
      crimeRateChange,
      peakHourFormatted: `${peakHour}:00`,
      hotspotCount,
      riskLevel: riskAssessment?.overall_risk || 'N/A',
    };
  }, [analysisData, loading]);

  const metrics = useMemo(() => calculateMetrics(), [calculateMetrics]);

  const EmptyStateCard = ({ icon: Icon, title, message, onRetry }: {
    icon: React.ElementType;
    title: string;
    message: string;
    onRetry?: () => void;
  }) => (
    <Card className="p-6 min-h-[400px]">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const ImprovedCrimeDistribution = () => {
    const colors = [
      'hsl(185, 84%, 44%)',
      'hsl(185, 70%, 55%)',
      'hsl(185, 60%, 65%)',
      'hsl(42, 78%, 60%)',
      'hsl(42, 70%, 70%)',
      'hsl(185, 50%, 75%)',
      'hsl(42, 60%, 80%)',
    ];

    if (!crimeTypes || crimeTypes.length === 0) {
      return (
        <EmptyStateCard
          icon={Activity}
          title="Crime Type Distribution"
          message="No crime type data available. Check if backend is running."
          onRetry={handleRefresh}
        />
      );
    }

    const maxTypes = 7;
    let chartData = [...crimeTypes];
    
    if (crimeTypes.length > maxTypes) {
      const topTypes = crimeTypes.slice(0, maxTypes - 1);
      const otherTypes = crimeTypes.slice(maxTypes - 1);
      const othersCount = otherTypes.reduce((sum, type) => sum + type.count, 0);
      const othersPercentage = otherTypes.reduce((sum, type) => sum + type.percentage, 0);
      
      chartData = [...topTypes, { 
        crime_type: 'Others', 
        count: othersCount, 
        percentage: othersPercentage 
      }];
    }

    const pieData = chartData.map(item => ({ 
      name: item.crime_type, 
      value: item.count, 
      percentage: item.percentage 
    }));
    
    const totalCrimes = crimeTypes.reduce((sum, item) => sum + item.count, 0);

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
            <Activity className="h-5 w-5 text-primary" />
            Crime Type Distribution
          </h2>
          <Badge variant="outline">Top {chartData.length} of {crimeTypes.length} Types</Badge>
        </div>

        <div className="space-y-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  outerRadius={140}
                  innerRadius={85}
                  fill="#8884d8" 
                  dataKey="value" 
                  stroke="hsl(var(--card))" 
                  strokeWidth={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => `${value} (${entry.payload.percentage.toFixed(1)}%)`}
                />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-0.5em" className="text-sm fill-muted-foreground">Total Crimes</tspan>
                  <tspan x="50%" dy="1.8em" className="text-3xl font-bold fill-foreground">{totalCrimes.toLocaleString()}</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

  const SpatialAnalysisTab = () => {
    const { spatialData } = analysisData;

    if (!spatialData || spatialData.districts.length === 0) {
      return (
        <EmptyStateCard
          icon={MapPin}
          title="No Spatial Data Available"
          message="Location data is not available in the current dataset"
          onRetry={handleRefresh}
        />
      );
    }

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Crime Distribution by Location</h3>
            </div>
            <Badge variant="secondary">
              {spatialData.totalCrimes.toLocaleString()} total crimes
            </Badge>
          </div>
          
          <div className="space-y-3">
            {spatialData.districts.map((district, index) => {
              const maxCount = spatialData.districts[0].count;
              const widthPercentage = (district.count / maxCount) * 100;
              
              return (
                <div key={`${district.name}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-semibold">{district.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{district.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{district.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${widthPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const ForecastTab = () => {
    const { forecast } = analysisData;

    if (!forecast || forecast.length === 0) {
      return (
        <EmptyStateCard
          icon={TrendingUp}
          title="No Forecast Data"
          message="Could not retrieve 7-day forecast. The backend may need more historical data."
          onRetry={handleRefresh}
        />
      );
    }

    const avgConfidence = Math.round(forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length);
    const trendDirection = forecast[forecast.length - 1].trend;

    return (
      <div className="space-y-6">
        {/* Forecast Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Trend Direction</p>
            </div>
            <p className="text-2xl font-bold capitalize">{trendDirection}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on 7-day analysis</p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-accent" />
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
            <p className="text-2xl font-bold">{avgConfidence}%</p>
            <p className="text-xs text-muted-foreground mt-1">Model accuracy</p>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">Forecast Period</p>
            </div>
            <p className="text-2xl font-bold">7 Days</p>
            <p className="text-xs text-muted-foreground mt-1">Short-term prediction</p>
          </Card>
        </div>

        {/* Forecast Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              7-Day Crime Forecast
            </h3>
            <Badge variant="secondary">SMA Model</Badge>
          </div>
          <ForecastChart data={forecast} historicalAvg={150} height={400} />
        </Card>

        {/* Daily Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Daily Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {forecast.slice(0, 7).map((day, index) => (
              <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{day.day}</p>
                  <Badge variant={
                    day.trend === 'up' ? 'destructive' : 
                    day.trend === 'down' ? 'default' : 
                    'secondary'
                  } className="text-xs">
                    {day.trend}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary">{day.predicted}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Range: {day.lower_bound} - {day.upper_bound}
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {day.confidence}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] p-6">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Backend Not Connected</h2>
          <p className="text-muted-foreground mb-4">
            Cannot load analysis data. Please ensure the backend is running at http://localhost:5000
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Crime Analysis</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights, patterns, and predictions for Chicago crime data</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <Button
                key={range}
                variant={activeTimeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTimeRange(range)}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing || loading ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <Activity className="h-8 w-8 text-primary mb-2" />
          <p className="text-2xl font-bold">{metrics.crimeRateChange}%</p>
          <p className="text-muted-foreground text-sm">Trend Change</p>
        </Card>
        <Card className="p-6">
          <Clock className="h-8 w-8 text-accent mb-2" />
          <p className="text-2xl font-bold">{metrics.peakHourFormatted || 'N/A'}</p>
          <p className="text-muted-foreground text-sm">Peak Hour</p>
        </Card>
        <Card className="p-6">
          <MapPin className="h-8 w-8 text-success mb-2" />
          <p className="text-2xl font-bold">{metrics.hotspotCount}</p>
          <p className="text-muted-foreground text-sm">Active Hotspots</p>
        </Card>
        <Card className="p-6">
          <Zap className="h-8 w-8 text-warning mb-2" />
          <p className="text-2xl font-bold">{metrics.riskLevel}</p>
          <p className="text-muted-foreground text-sm">Risk Index</p>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading analysis...</p>
        </div>
      ) : (
        <Tabs defaultValue="temporal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="temporal" className="py-2">Temporal Analysis</TabsTrigger>
            <TabsTrigger value="spatial" className="py-2">Spatial Analysis</TabsTrigger>
            <TabsTrigger value="patterns" className="py-2">Crime Patterns</TabsTrigger>
            <TabsTrigger value="forecast" className="py-2">7-Day Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="temporal" className="space-y-6">
            {monthlyTrends.length > 0 ? (
              <MonthlyTrendsChart data={monthlyTrends} type="line" height={400} />
            ) : (
              <EmptyStateCard
                icon={Clock}
                title="No Monthly Trend Data"
                message="Monthly trend data is not available"
                onRetry={handleRefresh}
              />
            )}
            {analysisData.hourlyData?.heatmap && 
             Object.keys(analysisData.hourlyData.heatmap).length > 0 && 
             analysisData.hourlyData.peak_hours ? (
              <HourlyPatternsChart 
                data={Object.values(analysisData.hourlyData.heatmap)[0] || []} 
                peakHours={analysisData.hourlyData.peak_hours} 
                height={350} 
              />
            ) : (
              <EmptyStateCard
                icon={Clock}
                title="No Hourly Pattern Data"
                message="Hourly pattern data is not available for the selected time range"
                onRetry={handleRefresh}
              />
            )}
          </TabsContent>

          <TabsContent value="spatial" className="space-y-6">
            <SpatialAnalysisTab />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <ImprovedCrimeDistribution />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <ForecastTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Analysis;