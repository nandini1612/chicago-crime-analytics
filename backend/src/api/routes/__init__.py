from flask import Blueprint

# Create blueprints
temporal_bp = Blueprint("temporal", __name__, url_prefix="/api/analysis/temporal")
forecasting_bp = Blueprint("forecast", __name__, url_prefix="/api/forecast")

__all__ = ["temporal_bp", "forecasting_bp"]
