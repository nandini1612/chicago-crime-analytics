# src/api/main.py
"""
Chicago Crime Analytics API - Complete Working Version
Combines existing endpoints with new temporal analysis & forecasting
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import pandas as pd
import os
import sys

# ==================== DISTRICT NAME MAPPING ====================

DISTRICT_NAMES = {
    "1": "Central",
    "2": "Wentworth",
    "3": "Grand Crossing",
    "4": "South Chicago",
    "5": "Calumet",
    "6": "Gresham",
    "7": "Englewood",
    "8": "Chicago Lawn",
    "9": "Deering",
    "10": "Ogden",
    "11": "Harrison",
    "12": "Near West",
    "14": "Shakespeare",
    "15": "Austin",
    "16": "Jefferson Park",
    "17": "Albany Park",
    "18": "Near North",
    "19": "Town Hall",
    "20": "Lincoln",
    "22": "Morgan Park",
    "24": "Rogers Park",
    "25": "Grand Central",
}


def get_district_name(district_num):
    """Convert district number to readable name."""
    district_str = str(district_num)
    return DISTRICT_NAMES.get(district_str, f"District {district_str}")


# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = "data/processed/crimes_clean.db"


def get_db():
    """Get database connection"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"DB Error: {e}")
        return None


# ==================== HEALTH CHECK ====================


@app.route("/api/health", methods=["GET"])
def health_check():
    """API health check"""
    try:
        conn = get_db()
        if conn:
            cursor = conn.execute("SELECT COUNT(*) as count FROM crimes")
            count = cursor.fetchone()["count"]
            conn.close()

            return jsonify(
                {
                    "status": "healthy",
                    "database": "connected",
                    "total_crimes": count,
                    "endpoints": {
                        "existing": [
                            "/api/crimes/all",
                            "/api/crimes/hotspots",
                            "/api/stats/monthly",
                            "/api/crimes/types",
                        ],
                        "temporal_analysis": [
                            "/api/analysis/temporal/trends",
                            "/api/analysis/temporal/hourly",
                            "/api/analysis/temporal/monthly",
                            "/api/analysis/temporal/seasonality",
                        ],
                        "forecasting": [
                            "/api/forecast/short-term",
                            "/api/forecast/medium-term",
                            "/api/forecast/risk-assessment",
                            "/api/forecast/hotspots",
                            "/api/forecast/accuracy",
                        ],
                    },
                }
            )
        else:
            return jsonify({"status": "unhealthy", "database": "error"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==================== EXISTING CORE ENDPOINTS ====================


@app.route("/api/crimes/all", methods=["GET"])
def get_all_crimes():
    """Get all crime points as GeoJSON"""
    try:
        limit = request.args.get("limit", 5000, type=int)
        crime_type = request.args.get("crime_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        query = "SELECT * FROM crimes WHERE 1=1"
        params = []

        if crime_type:
            query += " AND crime_type = ?"
            params.append(crime_type)

        if start_date:
            query += " AND date >= ?"
            params.append(start_date)

        if end_date:
            query += " AND date <= ?"
            params.append(end_date)

        query += " ORDER BY date DESC LIMIT ?"
        params.append(limit)

        conn = get_db()
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()

        features = []
        for _, row in df.iterrows():
            if pd.notna(row["latitude"]) and pd.notna(row["longitude"]):
                # Get district name
                district_name = get_district_name(row.get("district", "Unknown"))

                features.append(
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                float(row["longitude"]),
                                float(row["latitude"]),
                            ],
                        },
                        "properties": {
                            "id": int(row["id"]),
                            "date": str(row["date"]),
                            "crime_type": row["crime_type"],
                            "description": row.get("description", ""),
                            "district": district_name,  # Human-readable name
                            "district_num": str(
                                row.get("district", "")
                            ),  # Numeric value for filtering
                            "case_number": row.get("case_number", ""),
                        },
                    }
                )

        return jsonify(
            {
                "type": "FeatureCollection",
                "features": features,
                "metadata": {
                    "count": len(features),
                    "filters": {
                        "crime_type": crime_type,
                        "limit": limit,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/crimes/types", methods=["GET"])
def get_crime_types():
    """Get list of crime types with counts"""
    try:
        conn = get_db()

        query = """
            SELECT 
                crime_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM crimes), 2) as percentage
            FROM crimes 
            GROUP BY crime_type 
            ORDER BY count DESC
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        return jsonify(
            {
                "success": True,
                "crime_types": df.to_dict("records"),
                "total_types": len(df),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stats/monthly", methods=["GET"])
def get_monthly_stats():
    """Get monthly statistics"""
    try:
        conn = get_db()

        query = """
            SELECT 
                year_month,
                COUNT(*) as crime_count
            FROM crimes
            WHERE year_month IS NOT NULL
            GROUP BY year_month
            ORDER BY year_month DESC
            LIMIT 12
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        # Reverse to get chronological order
        df = df.iloc[::-1]

        return jsonify(
            {
                "success": True,
                "monthly_trends": df.to_dict("records"),
                "metadata": {
                    "total_months": len(df),
                    "date_range": f"{df['year_month'].iloc[0]} to {df['year_month'].iloc[-1]}"
                    if len(df) > 0
                    else None,
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/crimes/hotspots", methods=["GET"])
def get_hotspots():
    """Get crime hotspots"""
    try:
        conn = get_db()

        query = """
            SELECT 
                latitude,
                longitude,
                COUNT(*) as crime_count
            FROM crimes
            WHERE date >= date('now', '-30 days')
            GROUP BY ROUND(latitude, 2), ROUND(longitude, 2)
            HAVING crime_count > 5
            ORDER BY crime_count DESC
            LIMIT 50
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        hotspots = [
            {
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "intensity": int(row["crime_count"]),
            }
            for _, row in df.iterrows()
        ]

        return jsonify({"success": True, "hotspots": hotspots, "count": len(hotspots)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== IMPORT NEW ROUTE MODULES ====================

try:
    import sys
    import os

    # Add src directory to path
    src_dir = os.path.dirname(os.path.dirname(__file__))
    if src_dir not in sys.path:
        sys.path.insert(0, src_dir)

    # Import blueprints
    from api.routes.temporal_analysis import temporal_bp
    from api.routes.forecasting import forecast_bp

    # Register blueprints with URL prefixes
    app.register_blueprint(temporal_bp, url_prefix="/api/analysis/temporal")
    app.register_blueprint(forecast_bp, url_prefix="/api/forecast")

    print("✓ Loaded temporal analysis & forecasting routes")
    print("  - /api/analysis/temporal/trends")
    print("  - /api/analysis/temporal/hourly")
    print("  - /api/forecast/short-term")
    print("  - /api/forecast/risk-assessment")
except ImportError as e:
    print(f"⚠ Warning: Could not load new routes: {e}")
    print(f"  Error details: {str(e)}")
except Exception as e:
    print(f"⚠ Error registering routes: {e}")


# ==================== ERROR HANDLERS ====================


@app.errorhandler(404)
def not_found(error):
    return jsonify(
        {
            "success": False,
            "error": "Endpoint not found",
            "message": "Please check the API documentation",
        }
    ), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify(
        {"success": False, "error": "Internal server error", "message": str(error)}
    ), 500


# ==================== SERVER STARTUP ====================

if __name__ == "__main__":
    print("=" * 60)
    print("Chicago CRIME ANALYTICS API")
    print("Enhanced with Temporal Analysis & Forecasting")
    print("=" * 60)
    print()
    print("Starting Flask server...")
    print("Dashboard: http://localhost:5000")
    print("API Health: http://localhost:5000/api/health")
    print()
    print("Core Endpoints:")
    print("  GET /api/crimes/all        - All crime points (GeoJSON)")
    print("  GET /api/crimes/hotspots   - Crime hotspots")
    print("  GET /api/stats/monthly     - Monthly statistics")
    print("  GET /api/crimes/types      - Crime type list")
    print()
    print("New Temporal Analysis:")
    print("  GET /api/analysis/temporal/trends?period=daily&days=90")
    print("  GET /api/analysis/temporal/hourly?days=90")
    print("  GET /api/analysis/temporal/monthly?months=3")
    print("  GET /api/analysis/temporal/seasonality")
    print()
    print("New Forecasting:")
    print("  GET /api/forecast/short-term?model=sma")
    print("  GET /api/forecast/medium-term")
    print("  GET /api/forecast/risk-assessment")
    print("  GET /api/forecast/hotspots")
    print("  GET /api/forecast/accuracy")
    print()
    print("=" * 60)

    app.run(host="0.0.0.0", port=5000, debug=True)
