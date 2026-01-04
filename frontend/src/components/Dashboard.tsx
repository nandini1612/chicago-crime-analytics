// src/components/Dashboard.tsx - Simplified with Leaflet Heatmap
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCrimeData } from "@/hooks/use-crime-data";
import { MonthlyTrendsChart } from "@/components/MonthlyTrendsChart";
import { 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Activity,
  RefreshCw,
  Database,
  Shield,
  Clock,
  Filter,
  Download
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Leaflet imports - these will be loaded from CDN
declare const L: any;

export const Dashboard = () => {
  const { 
    isConnected, 
    loading, 
    crimeData, 
    crimeTypes = [],
    monthlyTrends = [],
    totalCrimes = 0,
    loadCrimeData,
    loadCrimeTypes,
    loadMonthlyStats
  } = useCrimeData();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrimeType, setSelectedCrimeType] = useState<string>("all");
  const [dataLimit, setDataLimit] = useState<number>(5000);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  // Load Leaflet scripts
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (typeof window !== 'undefined' && !(window as any).L) {
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(leafletCss);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      leafletScript.onload = () => {
        const heatScript = document.createElement('script');
        heatScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
        heatScript.onload = () => setMapLoaded(true);
        document.head.appendChild(heatScript);
      };
      document.head.appendChild(leafletScript);
    } else if ((window as any).L && (window as any).L.heatLayer) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current) {
      // Chicago coordinates
      const chicago = [41.8781, -87.6298];
      
      mapInstanceRef.current = L.map(mapRef.current).setView(chicago, 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstanceRef.current);
    }
  }, [mapLoaded]);

  // Update heatmap when crime data changes
  useEffect(() => {
    if (mapInstanceRef.current && crimeData && mapLoaded) {
      updateHeatmap();
    }
  }, [crimeData, mapLoaded]);

  const updateHeatmap = () => {
    if (!mapInstanceRef.current || !crimeData) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    // Convert GeoJSON to heat layer format [lat, lng, intensity]
    const heatData = crimeData.features
      .filter(f => f.geometry && f.geometry.coordinates)
      .map(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        return [lat, lng, 0.8]; // intensity
      });

    if (heatData.length > 0) {
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 25,  // Increased from 10
        blur: 15,    // Reduced from 20
        maxZoom: 17,
        max: 1.0,    // Increased from 0.6
        gradient: {
          0.0: 'blue',
          0.5: 'cyan',
          0.7: 'lime',
          0.85: 'yellow',
          1.0: 'red'
        }
      }).addTo(mapInstanceRef.current);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCrimeData({ 
          limit: dataLimit,
          crime_type: selectedCrimeType !== "all" ? selectedCrimeType : undefined
        }),
        loadCrimeTypes(),
        loadMonthlyStats()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = async (type: string) => {
    setSelectedCrimeType(type);
    try {
      await loadCrimeData({ 
        limit: dataLimit,
        crime_type: type !== "all" ? type : undefined
      });
    } catch (error) {
      console.error('Error filtering data:', error);
    }
  };

  const handleLimitChange = async (limit: string) => {
    const newLimit = parseInt(limit);
    setDataLimit(newLimit);
    try {
      await loadCrimeData({ 
        limit: newLimit,
        crime_type: selectedCrimeType !== "all" ? selectedCrimeType : undefined
      });
    } catch (error) {
      console.error('Error changing limit:', error);
    }
  };

  const exportData = () => {
    if (!crimeData) return;
    
    try {
      const csvData = [
        ['ID', 'Date', 'Crime Type', 'District', 'Latitude', 'Longitude'],
        ...crimeData.features.map(f => [
          f.properties.id,
          f.properties.date,
          f.properties.crime_type,
          f.properties.district,
          f.geometry.coordinates[1],
          f.geometry.coordinates[0]
        ])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chicago-crime-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Safe calculations with fallbacks
  const recentCrimesCount = crimeData?.metadata?.count || 0;
  const topCrimeType = crimeTypes[0];
  const latestMonth = monthlyTrends[monthlyTrends.length - 1];
  const previousMonth = monthlyTrends[monthlyTrends.length - 2];
  const monthlyChange = previousMonth && latestMonth
    ? ((latestMonth.crime_count - previousMonth.crime_count) / previousMonth.crime_count * 100).toFixed(1)
    : "0";

  // Loading state
  if (loading && !isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Connecting to backend...</p>
          <p className="text-sm text-muted-foreground">Checking http://localhost:5000</p>
        </div>
      </div>
    );
  }

  // Error state - Backend not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Backend Not Connected</h2>
          <p className="text-muted-foreground mb-4">
            Cannot connect to Flask API at http://localhost:5000
          </p>
          <div className="text-sm text-left bg-secondary/30 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">To start the backend:</p>
            <code className="text-xs block bg-black/20 p-2 rounded">
              cd backend<br/>
              python src/api/main.py
            </code>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Crime Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time Chicago crime data analysis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-success border-success/20 bg-success/10">
            <Database className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          
          <Select value={dataLimit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">1K records</SelectItem>
              <SelectItem value="5000">5K records</SelectItem>
              <SelectItem value="10000">10K records</SelectItem>
              <SelectItem value="20000">20K records</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh: {autoRefresh ? "ON" : "OFF"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportData}
            disabled={!crimeData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-primary" />
          <Select value={selectedCrimeType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by crime type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crime Types</SelectItem>
              {crimeTypes.map((type) => (
                <SelectItem key={type.crime_type} value={type.crime_type}>
                  {type.crime_type} ({type.count.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCrimeType !== "all" && (
            <Badge variant="secondary">
              Filtered: {crimeData?.metadata.count.toLocaleString()} results
            </Badge>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <Badge variant="outline">Database</Badge>
          </div>
          <p className="text-3xl font-bold">{totalCrimes.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Total Crimes Recorded</p>
          <div className="mt-3 h-1 bg-secondary rounded-full">
            <div className="h-1 bg-primary rounded-full w-full"></div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="h-8 w-8 text-accent" />
            <Badge variant="outline">Loaded</Badge>
          </div>
          <p className="text-3xl font-bold">{recentCrimesCount.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Records in View</p>
          <div className="mt-3 h-1 bg-secondary rounded-full">
            <div 
              className="h-1 bg-accent rounded-full" 
              style={{ width: `${totalCrimes ? (recentCrimesCount / totalCrimes) * 100 : 0}%` }}
            ></div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-success" />
            <Badge 
              variant="outline" 
              className={Number(monthlyChange) > 0 ? 'text-destructive border-destructive/20' : 'text-success border-success/20'}
            >
              {Number(monthlyChange) > 0 ? '+' : ''}{monthlyChange}%
            </Badge>
          </div>
          <p className="text-3xl font-bold">
            {latestMonth?.crime_count.toLocaleString() || 0}
          </p>
          <p className="text-muted-foreground text-sm">This Month</p>
          <div className="mt-3 h-1 bg-secondary rounded-full">
            <div className="h-1 bg-success rounded-full w-4/5"></div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-8 w-8 text-warning" />
            <Badge variant="outline">Top Crime</Badge>
          </div>
          <p className="text-2xl font-bold truncate">
            {topCrimeType?.crime_type || 'N/A'}
          </p>
          <p className="text-muted-foreground text-sm">
            {topCrimeType?.count.toLocaleString() || 0} incidents ({topCrimeType?.percentage.toFixed(1) || 0}%)
          </p>
          <div className="mt-3 h-1 bg-secondary rounded-full">
            <div 
              className="h-1 bg-warning rounded-full" 
              style={{ width: `${topCrimeType?.percentage || 0}%` }}
            ></div>
          </div>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      {monthlyTrends.length > 0 ? (
        <MonthlyTrendsChart 
          data={monthlyTrends}
          type="bar"
          height={350}
        />
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No monthly trend data available</p>
        </Card>
      )}

      {/* Leaflet Heatmap */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Interactive Crime Heatmap
          </h2>
          <Badge variant="secondary">
            {recentCrimesCount.toLocaleString()} points displayed
          </Badge>
        </div>
        
        <div 
          ref={mapRef} 
          className="rounded-lg h-[500px] border-2 border-border"
          style={{ zIndex: 1 }}
        >
          {!mapLoaded && (
            <div className="flex items-center justify-center h-full bg-secondary/20">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;