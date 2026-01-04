// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Type Definitions
export interface CrimeFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: number;
    date: string;
    crime_type: string;
    district: string;
    description?: string;
    ward?: string;
    beat?: string;
  };
}

export interface CrimeGeoJSON {
  type: 'FeatureCollection';
  features: CrimeFeature[];
  metadata: {
    count: number;
    filters: Record<string, any>;
  };
}

export interface CrimeType {
  crime_type: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  year_month: string;
  crime_count: number;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  total_crimes: number;
  message: string;
}

export interface CrimeFilters {
  limit?: number;
  crime_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface CrimeTypeDetail {
  crime_type: string;
  total: number;
  monthly_breakdown: Array<{
    total: number;
    month: string;
    monthly_count: number;
  }>;
}

// API Service Class
class CrimeAPIService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<HealthStatus> {
    return this.fetchWithErrorHandling<HealthStatus>(`${this.baseURL}/api/health`);
  }

  async getAllCrimes(filters: CrimeFilters = {}): Promise<CrimeGeoJSON> {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.crime_type) params.append('crime_type', filters.crime_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    return this.fetchWithErrorHandling<CrimeGeoJSON>(
      `${this.baseURL}/api/crimes/all?${params}`
    );
  }

  async getCrimeTypes(): Promise<{ crime_types: CrimeType[]; total_types: number }> {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/api/crimes/types`
    );
  }

  async getMonthlyStats(): Promise<{ monthly_trends: MonthlyTrend[]; metadata: any }> {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/api/stats/monthly`
    );
  }

  async getCrimeTypeDetails(crimeType: string): Promise<CrimeTypeDetail> {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/api/crimes/filter/${encodeURIComponent(crimeType)}`
    );
  }

  async getHotspots(): Promise<any> {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/api/crimes/hotspots`
    );
  }
}

// Export singleton instance
export const crimeAPI = new CrimeAPIService();
export default crimeAPI;