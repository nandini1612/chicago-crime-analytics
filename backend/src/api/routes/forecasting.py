# backend/src/api/routes/forecasting.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import sqlite3
import os

forecast_bp = Blueprint("forecast", __name__)

DB_PATH = os.path.join(
    os.path.dirname(__file__), "../../../data/processed/crimes_clean.db"
)


def get_db():
    """Get database connection"""
    try:
        db_path = os.path.abspath(DB_PATH)
        if not os.path.exists(db_path):
            print(f"ERROR: Database file not found at {db_path}")
            return None
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"ERROR connecting to database: {e}")
        return None


@forecast_bp.route("/short-term", methods=["GET"])
def get_short_term_forecast():
    """7-day crime forecast"""
    try:
        model = request.args.get("model", "sma")

        conn = get_db()
        if not conn:
            return jsonify([]), 200

        # FIXED: Get actual date range from database
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date), MIN(date) FROM crimes")
        result = cursor.fetchone()
        max_date = result[0]

        if not max_date:
            conn.close()
            return jsonify([])

        latest_date = datetime.strptime(max_date, "%Y-%m-%d")
        cutoff_date = (latest_date - timedelta(days=30)).strftime("%Y-%m-%d")

        print(f"Generating forecast from data: {cutoff_date} to {max_date}")

        query = """
            SELECT 
                date,
                COUNT(*) as count
            FROM crimes
            WHERE date >= ?
            GROUP BY date
            ORDER BY date DESC
        """
        df = pd.read_sql_query(query, conn, params=[cutoff_date])
        conn.close()

        if df.empty:
            print("WARNING: No data for forecast")
            return jsonify([])

        avg_crimes = df["count"].mean()
        std_crimes = df["count"].std()

        forecast = []
        days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        # Generate forecast starting from the day after latest data
        for i in range(7):
            forecast_date = latest_date + timedelta(days=i + 1)
            day_of_week = days_of_week[forecast_date.weekday()]

            if forecast_date.weekday() in [5, 6]:
                variation = np.random.uniform(-0.1, 0.15)
            else:
                variation = np.random.uniform(-0.15, 0.1)

            predicted = int(avg_crimes * (1 + variation))
            lower_bound = int(predicted - std_crimes)
            upper_bound = int(predicted + std_crimes)
            confidence = max(70, 90 - (i * 2))

            if i > 0 and len(forecast) > 0:
                prev_predicted = forecast[-1]["predicted"]
                if predicted > prev_predicted * 1.05:
                    trend = "up"
                elif predicted < prev_predicted * 0.95:
                    trend = "down"
                else:
                    trend = "stable"
            else:
                trend = "stable"

            forecast.append(
                {
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "day": day_of_week,
                    "predicted": predicted,
                    "lower_bound": max(0, lower_bound),
                    "upper_bound": upper_bound,
                    "confidence": confidence,
                    "trend": trend,
                }
            )

        print(
            f"✓ Returning {len(forecast)} day forecast (from {forecast[0]['date']} to {forecast[-1]['date']})"
        )
        return jsonify(forecast)

    except Exception as e:
        print(f"ERROR in short-term forecast: {e}")
        import traceback

        traceback.print_exc()
        return jsonify([]), 200


@forecast_bp.route("/risk-assessment", methods=["GET"])
def get_risk_assessment():
    """Assess crime risk by area"""
    try:
        conn = get_db()
        if not conn:
            return jsonify(
                {
                    "overall_risk": "unknown",
                    "high_risk_areas": [],
                    "high_risk_hours": 0,
                    "hourly_risk": [],
                    "risk_period": "30_days",
                }
            ), 200

        # FIXED: Get actual date range from database
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) FROM crimes")
        max_date = cursor.fetchone()[0]

        if not max_date:
            conn.close()
            return jsonify(
                {
                    "overall_risk": "unknown",
                    "high_risk_areas": [],
                    "high_risk_hours": 0,
                    "hourly_risk": [],
                    "risk_period": "30_days",
                }
            )

        latest_date = datetime.strptime(max_date, "%Y-%m-%d")
        cutoff_date = (latest_date - timedelta(days=30)).strftime("%Y-%m-%d")

        print(f"Assessing risk from {cutoff_date} to {max_date}")

        query = """
            SELECT 
                district,
                COUNT(*) as count,
                AVG(latitude) as lat,
                AVG(longitude) as lng
            FROM crimes
            WHERE date >= ?
                AND district IS NOT NULL 
                AND district != ''
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
            GROUP BY district
            ORDER BY count DESC
            LIMIT 10
        """
        df = pd.read_sql_query(query, conn, params=[cutoff_date])

        query_total = """
            SELECT COUNT(*) as total
            FROM crimes
            WHERE date >= ?
        """
        total_df = pd.read_sql_query(query_total, conn, params=[cutoff_date])
        total_crimes = total_df["total"].iloc[0] if not total_df.empty else 0

        conn.close()

        if df.empty:
            print("WARNING: No risk assessment data")
            return jsonify(
                {
                    "overall_risk": "unknown",
                    "high_risk_areas": [],
                    "high_risk_hours": 0,
                    "hourly_risk": [],
                    "risk_period": "30_days",
                }
            )

        high_risk_areas = []
        for _, row in df.iterrows():
            high_risk_areas.append(
                {
                    "area": f"District {row['district']}",
                    "count": int(row["count"]),
                    "lat": float(row["lat"]),
                    "lng": float(row["lng"]),
                }
            )

        avg_daily_crimes = total_crimes / 30
        if avg_daily_crimes > 150:
            overall_risk = "HIGH"
        elif avg_daily_crimes > 100:
            overall_risk = "MEDIUM"
        else:
            overall_risk = "LOW"

        hourly_risk = []
        for hour in range(24):
            if 18 <= hour <= 23 or 0 <= hour <= 2:
                risk_level = "high"
            elif 6 <= hour <= 17:
                risk_level = "medium"
            else:
                risk_level = "low"
            hourly_risk.append({"hour": hour, "risk_level": risk_level})

        high_risk_hours = sum(1 for hr in hourly_risk if hr["risk_level"] == "high")

        print(
            f"✓ Returning risk assessment: {overall_risk} risk, {len(high_risk_areas)} areas"
        )
        return jsonify(
            {
                "overall_risk": overall_risk,
                "high_risk_areas": high_risk_areas,
                "high_risk_hours": high_risk_hours,
                "hourly_risk": hourly_risk,
                "risk_period": "30_days",
                "total_crimes_analyzed": int(total_crimes),
                "avg_daily_crimes": round(avg_daily_crimes, 1),
            }
        )

    except Exception as e:
        print(f"ERROR in risk assessment: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "overall_risk": "unknown",
                "high_risk_areas": [],
                "high_risk_hours": 0,
                "hourly_risk": [],
                "risk_period": "30_days",
            }
        ), 200
