import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

interface CrimeFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: number;
    date: string;
    crime_type: string;
    description: string;
    district: string;
    ward?: string;
    beat?: string;
    case_number: string;
  };
}

interface CrimeData {
  type: 'FeatureCollection';
  features: CrimeFeature[];
  metadata: {
    count: number;
    filters: Record<string, any>;
  };
}

interface CrimeType {
  crime_type: string;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  year_month: string;
  crime_count: number;
}

interface TemporalTrend {
  crime_type: string;
  data: Array<{
    date: string;
    count: number;
    moving_avg: number;
  }>;
  trend: 'increasing' | 'decreasing';
  slope: number;
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
  risk_period: string;
  hourly_risk: Array<{
    hour: number;
    risk_level: string;
  }>;
  high_risk_hours: number;
  high_risk_areas: Array<{
    area: string;
    count: number;
    lat?: number;
    lng?: number;
  }>;
}

export const useCrimeData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crimeData, setCrimeData] = useState<CrimeData | null>(null);
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [totalCrimes, setTotalCrimes] = useState(0);

  // Check backend connection
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setTotalCrimes(data.total_crimes || 0);
        console.log('✓ Backend connected:', data.total_crimes, 'crimes');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Load crime data
  const loadCrimeData = useCallback(async (options?: {
    limit?: number;
    crime_type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.crime_type) params.append('crime_type', options.crime_type);
      if (options?.start_date) params.append('start_date', options.start_date);
      if (options?.end_date) params.append('end_date', options.end_date);

      const response = await fetch(`${API_BASE_URL}/crimes/all?${params}`);
      if (!response.ok) throw new Error('Failed to fetch crime data');
      
      const data = await response.json();
      setCrimeData(data);
      console.log('✓ Loaded crime data:', data.metadata.count, 'crimes');
      return data;
    } catch (error) {
      console.error('Error loading crime data:', error);
      return null;
    }
  }, []);

  // Load crime types
  const loadCrimeTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crimes/types`);
      if (!response.ok) throw new Error('Failed to fetch crime types');
      
      const data = await response.json();
      setCrimeTypes(data.crime_types || []);
      console.log('✓ Loaded crime types:', data.crime_types?.length || 0, 'types');
      return data.crime_types;
    } catch (error) {
      console.error('Error loading crime types:', error);
      return [];
    }
  }, []);

  // Load monthly stats
  const loadMonthlyStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/monthly`);
      if (!response.ok) throw new Error('Failed to fetch monthly stats');
      
      const data = await response.json();
      setMonthlyTrends(data.monthly_trends || []);
      console.log('✓ Loaded monthly trends:', data.monthly_trends?.length || 0, 'months');
      return data.monthly_trends;
    } catch (error) {
      console.error('Error loading monthly stats:', error);
      return [];
    }
  }, []);

  // Load temporal trends
  const loadTemporalTrends = useCallback(async (options?: {
    period?: 'daily' | 'weekly' | 'monthly';
    days?: number;
    crime_type?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (options?.period) params.append('period', options.period);
      if (options?.days) params.append('days', options.days.toString());
      if (options?.crime_type) params.append('crime_type', options.crime_type);

      const response = await fetch(`${API_BASE_URL}/analysis/temporal/trends?${params}`);
      if (!response.ok) throw new Error('Failed to fetch temporal trends');
      
      const data = await response.json();
      const trends = data.trends || [];
      console.log('✓ Loaded temporal trends:', trends.length, 'trends');
      return trends as TemporalTrend[];
    } catch (error) {
      console.error('Error loading temporal trends:', error);
      return [];
    }
  }, []);

  // Load hourly distribution
  const loadHourlyDistribution = useCallback(async (days: number = 90) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/temporal/hourly?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch hourly data');
      
      const data = await response.json();
      console.log('✓ Loaded hourly data:', data.total_crimes || 0, 'crimes,', data.peak_hours?.length || 0, 'peak hours');
      return data as HourlyData;
    } catch (error) {
      console.error('Error loading hourly distribution:', error);
      return { heatmap: {}, peak_hours: [], total_crimes: 0 };
    }
  }, []);

  // Load 7-day forecast - FIXED: handle direct array response
  const load7DayForecast = useCallback(async (model: 'sma' | 'es' = 'sma') => {
    try {
      const response = await fetch(`${API_BASE_URL}/forecast/short-term?model=${model}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      
      const data = await response.json();
      // Backend returns array directly, not wrapped in object
      const forecast = Array.isArray(data) ? data : [];
      console.log('✓ Loaded forecast:', forecast.length, 'days');
      return forecast as Forecast[];
    } catch (error) {
      console.error('Error loading forecast:', error);
      return [];
    }
  }, []);

  // Load risk assessment
  const loadRiskAssessment = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/forecast/risk-assessment`);
      if (!response.ok) throw new Error('Failed to fetch risk assessment');
      
      const data = await response.json();
      console.log('✓ Loaded risk assessment:', data.overall_risk, 'risk,', data.high_risk_areas?.length || 0, 'areas');
      return data as RiskAssessment;
    } catch (error) {
      console.error('Error loading risk assessment:', error);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const connected = await checkConnection();
      
      if (connected) {
        await Promise.all([
          loadCrimeData({ limit: 5000 }),
          loadCrimeTypes(),
          loadMonthlyStats(),
        ]);
      }
      
      setLoading(false);
    };

    initialize();
  }, [checkConnection, loadCrimeData, loadCrimeTypes, loadMonthlyStats]);

  return {
    // State
    isConnected,
    loading,
    crimeData,
    crimeTypes,
    monthlyTrends,
    totalCrimes,
    
    // Actions
    checkConnection,
    loadCrimeData,
    loadCrimeTypes,
    loadMonthlyStats,
    loadTemporalTrends,
    loadHourlyDistribution,
    load7DayForecast,
    loadRiskAssessment,
  };
};