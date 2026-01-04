# src/analysis/forecasting.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings("ignore")


class SimpleCrimeForecaster:
    """
    Simple crime forecasting using trend + seasonal patterns
    Realistic for beginners - no ARIMA complexity
    """

    def __init__(self, crimes_df):
        self.crimes_df = crimes_df
        self.daily_series = None
        self.monthly_series = None
        self.trend_model = None
        self.seasonal_patterns = None

    def prepare_time_series(self):
        """Prepare daily and monthly time series"""
        self.crimes_df["date"] = pd.to_datetime(self.crimes_df["date"])

        # Daily series
        self.daily_series = self.crimes_df.groupby(
            self.crimes_df["date"].dt.date
        ).size()
        self.daily_series.index = pd.to_datetime(self.daily_series.index)
        self.daily_series = self.daily_series.sort_index()

        # Monthly series
        self.monthly_series = self.crimes_df.groupby(
            self.crimes_df["date"].dt.to_period("M")
        ).size()
        self.monthly_series.index = self.monthly_series.index.to_timestamp()

        print(f"Prepared time series: {len(self.monthly_series)} months")

    def fit_trend_model(self):
        """Fit simple linear trend - recruiter-friendly explanation"""
        X = np.arange(len(self.monthly_series)).reshape(-1, 1)
        y = self.monthly_series.values

        self.trend_model = LinearRegression()
        self.trend_model.fit(X, y)

        predictions = self.trend_model.predict(X)
        mae = mean_absolute_error(y, predictions)

        print(f"Trend model: MAE={mae:.1f} crimes/month")
        return {"mae": mae, "slope": self.trend_model.coef_[0]}

    def calculate_seasonal_patterns(self):
        """Calculate monthly seasonal factors"""
        monthly_df = pd.DataFrame(
            {
                "crime_count": self.monthly_series.values,
                "month": self.monthly_series.index.month,
            }
        )

        monthly_avg = monthly_df.groupby("month")["crime_count"].mean()
        overall_avg = monthly_df["crime_count"].mean()

        seasonal_factors = monthly_avg / overall_avg

        self.seasonal_patterns = {
            "monthly_factors": seasonal_factors.to_dict(),
            "overall_average": overall_avg,
        }

        return self.seasonal_patterns

    def forecast_simple(self, periods=6):
        """
        Generate 6-month forecast using trend + seasonality
        Simple enough for interview explanation
        """
        if self.trend_model is None:
            self.fit_trend_model()
        if self.seasonal_patterns is None:
            self.calculate_seasonal_patterns()

        last_date = self.monthly_series.index[-1]
        forecast_dates = pd.date_range(
            start=last_date + pd.DateOffset(months=1), periods=periods, freq="MS"
        )

        # Predict trend
        last_x = len(self.monthly_series) - 1
        future_x = np.arange(last_x + 1, last_x + 1 + periods).reshape(-1, 1)
        trend_forecasts = self.trend_model.predict(future_x)

        # Apply seasonal adjustment
        forecasts = []
        for date, trend_value in zip(forecast_dates, trend_forecasts):
            month = date.month
            seasonal_factor = self.seasonal_patterns["monthly_factors"].get(month, 1.0)
            final_forecast = max(0, trend_value * seasonal_factor)

            forecasts.append(
                {
                    "date": date,
                    "forecast": int(final_forecast),
                    "month_name": date.strftime("%b %Y"),
                }
            )

        return pd.DataFrame(forecasts)

    def visualize_forecast(self, forecast_df):
        """Create simple, clean forecast visualization"""
        fig, ax = plt.subplots(figsize=(12, 6))

        # Historical data
        ax.plot(
            self.monthly_series.index,
            self.monthly_series.values,
            "b-",
            label="Historical",
            linewidth=2,
        )

        # Forecast
        ax.plot(
            forecast_df["date"],
            forecast_df["forecast"],
            "r--",
            label="Forecast",
            linewidth=2,
            marker="o",
        )

        ax.set_title("Chicago Crime Forecast (Next 6 Months)", fontsize=14)
        ax.set_xlabel("Date")
        ax.set_ylabel("Monthly Crime Count")
        ax.legend()
        ax.grid(True, alpha=0.3)

        plt.tight_layout()
        return fig


# Week 4 Usage Script
if __name__ == "__main__":
    import sqlite3

    print("=== Chicago CRIME FORECASTING ===")

    # Load data from database
    conn = sqlite3.connect("data/processed/crimes_clean.db")
    crimes_df = pd.read_sql_query("SELECT * FROM crimes", conn)

    # Initialize forecaster
    forecaster = SimpleCrimeForecaster(crimes_df)
    forecaster.prepare_time_series()

    # Fit models
    trend_stats = forecaster.fit_trend_model()
    seasonal_patterns = forecaster.calculate_seasonal_patterns()

    # Generate forecast
    forecast_df = forecaster.forecast_simple(periods=6)

    print("\n6-Month Crime Forecast:")
    for _, row in forecast_df.iterrows():
        print(f"{row['month_name']}: {row['forecast']} crimes")

    # Save results
    forecast_df.to_csv("data/processed/crime_forecast.csv", index=False)

    # Create visualization
    fig = forecaster.visualize_forecast(forecast_df)
    plt.savefig("data/processed/forecast_visualization.png", dpi=300)
    plt.show()

    print("\nForecasting completed!")
    conn.close()
