# backend/src/api/routes/temporal_analysis.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import sqlite3
import os

temporal_bp = Blueprint("temporal", __name__)

# Database path
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


@temporal_bp.route("/trends", methods=["GET"])
def get_temporal_trends():
    """Get temporal trends with moving averages"""
    try:
        period = request.args.get("period", "daily")
        days = int(request.args.get("days", 90))
        crime_type = request.args.get("crime_type", None)

        conn = get_db()
        if not conn:
            return jsonify({"trends": [], "message": "Database connection failed"}), 200

        # FIXED: Get actual date range from database
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) FROM crimes")
        max_date = cursor.fetchone()[0]

        if not max_date:
            conn.close()
            return jsonify({"trends": [], "message": "No data in database"})

        # Calculate cutoff from the latest date in database
        latest_date = datetime.strptime(max_date, "%Y-%m-%d")
        cutoff_date = (latest_date - timedelta(days=days)).strftime("%Y-%m-%d")

        print(f"Querying data from {cutoff_date} to {max_date}")

        if crime_type:
            query = """
                SELECT 
                    date,
                    crime_type,
                    COUNT(*) as count
                FROM crimes
                WHERE date >= ?
                AND crime_type = ?
                GROUP BY date, crime_type
                ORDER BY date
            """
            df = pd.read_sql_query(query, conn, params=[cutoff_date, crime_type])
        else:
            query = """
                SELECT 
                    date,
                    crime_type,
                    COUNT(*) as count
                FROM crimes
                WHERE date >= ?
                GROUP BY date, crime_type
                ORDER BY date
            """
            df = pd.read_sql_query(query, conn, params=[cutoff_date])

        conn.close()

        if df.empty:
            return jsonify({"trends": [], "message": "No data available"})

        # Calculate moving averages by crime type
        trends = []
        for crime_type_val in df["crime_type"].unique():
            crime_df = df[df["crime_type"] == crime_type_val].copy()
            crime_df["moving_avg"] = (
                crime_df["count"].rolling(window=7, min_periods=1).mean()
            )

            # Calculate trend direction
            if len(crime_df) > 1:
                slope = np.polyfit(range(len(crime_df)), crime_df["count"], 1)[0]
                trend_direction = "increasing" if slope > 0 else "decreasing"
            else:
                slope = 0
                trend_direction = "stable"

            trends.append(
                {
                    "crime_type": crime_type_val,
                    "data": crime_df[["date", "count", "moving_avg"]].to_dict(
                        "records"
                    ),
                    "trend": trend_direction,
                    "slope": float(slope),
                }
            )

        print(f"✓ Returning {len(trends)} temporal trends")
        return jsonify({"trends": trends, "period": period, "days_analyzed": days})

    except Exception as e:
        print(f"ERROR in temporal trends: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e), "trends": []}), 200


@temporal_bp.route("/hourly", methods=["GET"])
def get_hourly_distribution():
    """Get hourly crime distribution (synthetic based on daily patterns)"""
    try:
        days = int(request.args.get("days", 90))

        conn = get_db()
        if not conn:
            return jsonify({"heatmap": {}, "peak_hours": [], "total_crimes": 0}), 200

        # FIXED: Get actual date range from database
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) FROM crimes")
        max_date = cursor.fetchone()[0]

        if not max_date:
            conn.close()
            return jsonify({"heatmap": {}, "peak_hours": [], "total_crimes": 0})

        latest_date = datetime.strptime(max_date, "%Y-%m-%d")
        cutoff_date = (latest_date - timedelta(days=days)).strftime("%Y-%m-%d")

        print(f"Querying hourly data from {cutoff_date} to {max_date}")

        query = """
            SELECT 
                crime_type,
                date,
                COUNT(*) as daily_count
            FROM crimes
            WHERE date >= ?
            GROUP BY crime_type, date
            ORDER BY crime_type, date
        """
        df = pd.read_sql_query(query, conn, params=[cutoff_date])
        conn.close()

        if df.empty:
            print("WARNING: No data returned from hourly query")
            return jsonify({"heatmap": {}, "peak_hours": [], "total_crimes": 0})

        # Generate hourly distribution
        heatmap = {}
        hourly_totals = {h: 0 for h in range(24)}
        total_crimes = 0

        # Realistic hourly weights
        hour_weights = {
            0: 0.015,
            1: 0.010,
            2: 0.008,
            3: 0.007,
            4: 0.008,
            5: 0.012,
            6: 0.020,
            7: 0.025,
            8: 0.030,
            9: 0.035,
            10: 0.040,
            11: 0.045,
            12: 0.050,
            13: 0.052,
            14: 0.055,
            15: 0.057,
            16: 0.060,
            17: 0.062,
            18: 0.065,
            19: 0.063,
            20: 0.060,
            21: 0.055,
            22: 0.048,
            23: 0.038,
        }

        for crime_type_val in df["crime_type"].unique():
            crime_df = df[df["crime_type"] == crime_type_val]
            total_for_type = crime_df["daily_count"].sum()

            hourly_data = []
            for hour in range(24):
                hourly_count = int(total_for_type * hour_weights[hour])
                hourly_data.append({"hour": hour, "count": hourly_count})
                hourly_totals[hour] += hourly_count
                total_crimes += hourly_count

            heatmap[crime_type_val] = hourly_data

        # Find peak hours
        peak_hours = sorted(hourly_totals.items(), key=lambda x: x[1], reverse=True)[:3]
        peak_hours = sorted([hour for hour, _ in peak_hours])

        print(
            f"✓ Returning hourly data: {total_crimes} crimes, {len(peak_hours)} peak hours"
        )
        return jsonify(
            {
                "heatmap": heatmap,
                "peak_hours": peak_hours,
                "total_crimes": total_crimes,
            }
        )

    except Exception as e:
        print(f"ERROR in hourly distribution: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {"error": str(e), "heatmap": {}, "peak_hours": [], "total_crimes": 0}
        ), 200
