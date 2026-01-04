# src/analysis/time_series_analyzer.py (Continuation)

    def analyze_crime_type_temporal_patterns(self):
        """Analyze temporal patterns by crime type"""
        # Top crime types
        top_crime_types = self.crimes_df['primary_type'].value_counts().head(5).index
        
        crime_type_patterns = {}
        
        for crime_type in top_crime_types:
            crime_subset = self.crimes_df[self.crimes_df['primary_type'] == crime_type]
            
            # Monthly pattern
            monthly_pattern = crime_subset.groupby('month').size()
            
            # Hourly pattern
            hourly_pattern = crime_subset.groupby('hour').size()
            
            # Weekly pattern
            weekly_pattern = crime_subset.groupby('day_of_week').size()
            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                        'Friday', 'Saturday', 'Sunday']
            weekly_pattern = weekly_pattern.reindex(day_order, fill_value=0)
            
            crime_type_patterns[crime_type] = {
                'monthly': monthly_pattern,
                'hourly': hourly_pattern,
                'weekly': weekly_pattern,
                'peak_month': monthly_pattern.idxmax(),
                'peak_hour': hourly_pattern.idxmax(),
                'weekend_percentage': crime_subset['is_weekend'].mean() * 100
            }
        
        return crime_type_patterns
    
    def calculate_trend(self, time_series):
        """Calculate linear trend in time series"""
        x = np.arange(len(time_series))
        y = time_series.values
        
        # Remove NaN values
        mask = ~np.isnan(y)
        if mask.sum() < 2:
            return 0
        
        slope, intercept, r_value, p_value, std_err = stats.linregress(x[mask], y[mask])
        return slope
    
    def detect_anomalies(self, time_series, threshold=2):
        """Detect anomalies in daily crime counts"""
        # Calculate rolling statistics
        rolling_mean = time_series.rolling(window=7, center=True).mean()
        rolling_std = time_series.rolling(window=7, center=True).std()
        
        # Identify anomalies
        anomalies = time_series[
            (time_series > rolling_mean + threshold * rolling_std) |
            (time_series < rolling_mean - threshold * rolling_std)
        ]
        
        return anomalies
    
    def create_comprehensive_temporal_visualization(self):
        """Create comprehensive temporal analysis visualization"""
        fig, axes = plt.subplots(3, 2, figsize=(20, 15))
        
        # 1. Daily trend
        daily_crimes, daily_stats = self.analyze_daily_trends()
        axes[0,0].plot(daily_crimes.index, daily_crimes.values, alpha=0.7, linewidth=1)
        axes[0,0].set_title(f'Daily Crime Counts\n(Avg: {daily_stats["mean_daily_crimes"]:.1f}, Trend: {daily_stats["trend_slope"]:.3f})')
        axes[0,0].set_xlabel('Date')
        axes[0,0].set_ylabel('Daily Crime Count')
        
        # Add trend line
        x_trend = np.arange(len(daily_crimes))
        y_trend = daily_stats['trend_slope'] * x_trend + daily_crimes.iloc[0]
        axes[0,0].plot(daily_crimes.index, y_trend, 'r--', alpha=0.8, label=f'Trend (slope: {daily_stats["trend_slope"]:.3f})')
        axes[0,0].legend()
        axes[0,0].grid(True, alpha=0.3)
        
        # 2. Weekly patterns
        weekly_patterns, weekend_analysis = self.analyze_weekly_patterns()
        weekly_patterns.plot(kind='bar', ax=axes[0,1], color='skyblue')
        axes[0,1].set_title(f'Weekly Crime Patterns\n(Weekend: {weekend_analysis["weekend_percentage"]:.1f}%)')
        axes[0,1].set_xlabel('Day of Week')
        axes[0,1].set_ylabel('Total Crimes')
        axes[0,1].tick_params(axis='x', rotation=45)
        
        # 3. Hourly patterns
        hourly_crimes, hourly_stats = self.analyze_hourly_patterns()
        hourly_crimes.plot(kind='line', ax=axes[1,0], marker='o', color='green')
        axes[1,0].set_title(f'Hourly Crime Patterns\n(Peak: {hourly_stats["peak_hour"]}:00, Night: {hourly_stats["night_percentage"]:.1f}%)')
        axes[1,0].set_xlabel('Hour of Day')
        axes[1,0].set_ylabel('Total Crimes')
        axes[1,0].axvline(x=hourly_stats["peak_hour"], color='red', linestyle='--', alpha=0.7, label=f'Peak Hour ({hourly_stats["peak_hour"]}:00)')
        axes[1,0].legend()
        axes[1,0].grid(True, alpha=0.3)
        
        # 4. Monthly patterns
        monthly_crimes, seasonal_crimes, monthly_by_year, seasonal_stats = self.analyze_seasonal_patterns()
        monthly_crimes.plot(kind='bar', ax=axes[1,1], color='orange')
        axes[1,1].set_title(f'Monthly Crime Patterns\n(Peak: Month {seasonal_stats["peak_month"]})')
        axes[1,1].set_xlabel('Month')
        axes[1,1].set_ylabel('Total Crimes')
        
        # 5. Crime type temporal heatmap
        crime_type_patterns = self.analyze_crime_type_temporal_patterns()
        
        # Create heatmap data
        heatmap_data = []
        for crime_type, patterns in crime_type_patterns.items():
            monthly = patterns['monthly'].reindex(range(1, 13), fill_value=0)
            heatmap_data.append(monthly.values)
        
        if heatmap_data:
            heatmap_df = pd.DataFrame(heatmap_data, 
                                    index=list(crime_type_patterns.keys()),
                                    columns=[f'M{i}' for i in range(1, 13)])
            
            sns.heatmap(heatmap_df, ax=axes[2,0], cmap='YlOrRd', annot=True, fmt='d')
            axes[2,0].set_title('Crime Types by Month')
            axes[2,0].set_xlabel('Month')
            axes[2,0].set_ylabel('Crime Type')
        
        # 6. Year-over-year comparison
        if len(monthly_by_year.columns) > 1:
            monthly_by_year.plot(kind='line', ax=axes[2,1], marker='o')
            axes[2,1].set_title('Monthly Trends by Year')
            axes[2,1].set_xlabel('Month')
            axes[2,1].set_ylabel('Crime Count')
            axes[2,1].legend(title='Year', bbox_to_anchor=(1.05, 1), loc='upper left')
        
        plt.tight_layout()
        return fig
    
    def generate_temporal_insights(self):
        """Generate key insights from temporal analysis"""
        # Run all analyses
        daily_crimes, daily_stats = self.analyze_daily_trends()
        weekly_patterns, weekend_analysis = self.analyze_weekly_patterns()
        hourly_crimes, hourly_stats = self.analyze_hourly_patterns()
        monthly_crimes, seasonal_crimes, monthly_by_year, seasonal_stats = self.analyze_seasonal_patterns()
        crime_type_patterns = self.analyze_crime_type_temporal_patterns()
        
        # Generate insights
        insights = {
            'overview': {
                'total_crimes': len(self.crimes_df),
                'daily_average': daily_stats['mean_daily_crimes'],
                'date_range': f"{self.crimes_df['date'].min().date()} to {self.crimes_df['date'].max().date()}",
                'trend_direction': 'increasing' if daily_stats['trend_slope'] > 0 else 'decreasing',
                'trend_magnitude': abs(daily_stats['trend_slope'])
            },
            'peak_patterns': {
                'peak_day': weekly_patterns.idxmax(),
                'peak_hour': hourly_stats['peak_hour'],
                'peak_month': seasonal_stats['peak_month'],
                'weekend_preference': weekend_analysis['weekend_percentage'] > 35
            },
            'seasonal_insights': {
                'summer_winter_ratio': seasonal_stats['summer_vs_winter'],
                'seasonal_variation': seasonal_crimes.max() / seasonal_crimes.min(),
                'most_active_season': seasonal_crimes.idxmax()
            },
            'security_recommendations': {
                'night_patrol_priority': hourly_stats['night_percentage'] > 30,
                'weekend_staffing_increase': weekend_analysis['weekend_percentage'] > 35,
                'seasonal_resource_allocation': seasonal_stats['peak_month']
            }
        }
        
        return insights


# Usage and testing script
if __name__ == "__main__":
    import sqlite3
    
    # Load data
    conn = sqlite3.connect("../../data/processed/chicago_crimes.db")
    query = "SELECT * FROM crimes"
    crimes_df = pd.read_sql_query(query, conn)
    
    print("Starting temporal analysis...")
    
    # Initialize analyzer
    analyzer = ChicagoTimeSeriesAnalyzer(crimes_df)
    
    # Generate comprehensive visualization
    fig = analyzer.create_comprehensive_temporal_visualization()
    plt.savefig("../../data/exports/temporal_analysis_comprehensive.png", 
                dpi=300, bbox_inches='tight')
    plt.show()
    
    # Generate insights
    insights = analyzer.generate_temporal_insights()
    
    # Save insights
    import json
    with open("../../data/exports/temporal_insights.json", 'w') as f:
        json.dump(insights, f, indent=2, default=str)
    
    # Print key insights
    print("\n=== KEY TEMPORAL INSIGHTS ===")
    print(f"Daily Average: {insights['overview']['daily_average']:.1f} crimes")
    print(f"Trend: {insights['overview']['trend_direction']} by {insights['overview']['trend_magnitude']:.3f} crimes/day")
    print(f"Peak Day: {insights['peak_patterns']['peak_day']}")
    print(f"Peak Hour: {insights['peak_patterns']['peak_hour']}:00")
    print(f"Peak Month: {insights['peak_patterns']['peak_month']}")
    print(f"Most Active Season: {insights['seasonal_insights']['most_active_season']}")
    
    conn.close()
    print("Temporal analysis completed!")