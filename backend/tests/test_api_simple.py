"""
Week 8: API Testing Suite
Testing all endpoints with proper validation
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000"


class Colors:
    """Terminal colors for better readability"""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def print_color(text, color):
    """Print colored text to terminal"""
    print(f"{color}{text}{Colors.RESET}")


def test_endpoint(name, url, expected_keys=[], validate_fn=None):
    """
    Test a single API endpoint with custom validation

    Args:
        name: Test name
        url: Endpoint URL
        expected_keys: List of required keys in response
        validate_fn: Optional function for custom validation
    """
    print(f"\n{Colors.BLUE}{'─' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}Testing: {name}{Colors.RESET}")
    print(f"URL: {url}")

    try:
        start = time.time()
        response = requests.get(url, timeout=10)
        duration = time.time() - start

        print(f"Status: {response.status_code}")
        print(f"Response Time: {duration:.2f}s")

        if response.status_code == 200:
            data = response.json()

            # Validate expected keys
            missing_keys = []
            for key in expected_keys:
                if key in data:
                    print_color(f"✓ Has '{key}' field", Colors.GREEN)
                else:
                    print_color(f"✗ Missing '{key}' field", Colors.RED)
                    missing_keys.append(key)

            # Show data metrics
            if "features" in data:
                feature_count = len(data["features"])
                print(f"Features count: {feature_count}")

                # Sample a feature to show structure
                if feature_count > 0:
                    sample = data["features"][0]
                    print(f"Sample feature keys: {list(sample.keys())}")

            elif isinstance(data, list):
                print(f"Items count: {len(data)}")

            elif isinstance(data, dict):
                # Show top-level structure
                print(f"Response keys: {list(data.keys())}")

            # Run custom validation if provided
            if validate_fn and callable(validate_fn):
                try:
                    validate_fn(data)
                except AssertionError as e:
                    print_color(f"✗ Validation failed: {e}", Colors.RED)
                    return False

            # Check for missing keys
            if missing_keys:
                print_color(f"Failed: Missing required keys", Colors.RED)
                return False

            print_color("✓ Test passed", Colors.GREEN)
            return True
        else:
            print_color(
                f"✗ HTTP {response.status_code}: {response.text[:200]}", Colors.RED
            )
            return False

    except requests.exceptions.Timeout:
        print_color("✗ Request timeout (>10s)", Colors.RED)
        return False
    except requests.exceptions.ConnectionError:
        print_color("✗ Connection failed - Is the server running?", Colors.RED)
        return False
    except json.JSONDecodeError:
        print_color("✗ Invalid JSON response", Colors.RED)
        return False
    except Exception as e:
        print_color(f"✗ Unexpected error: {str(e)}", Colors.RED)
        return False


def validate_geojson(data):
    """Validate GeoJSON structure"""
    assert data.get("type") == "FeatureCollection", "Must be FeatureCollection"
    assert "features" in data, "Must have features array"

    if len(data["features"]) > 0:
        feature = data["features"][0]
        assert feature.get("type") == "Feature", "Each item must be a Feature"
        assert "geometry" in feature, "Feature must have geometry"
        assert "properties" in feature, "Feature must have properties"

        geom = feature["geometry"]
        assert geom.get("type") == "Point", "Geometry must be Point"
        assert "coordinates" in geom, "Geometry must have coordinates"
        assert len(geom["coordinates"]) == 2, "Coordinates must be [lng, lat]"


def validate_monthly_stats(data):
    """Validate monthly statistics structure"""
    assert "monthly_trends" in data, "Must have monthly_trends"
    trends = data["monthly_trends"]

    if len(trends) > 0:
        first = trends[0]
        assert "year_month" in first, "Must have year_month"
        assert "count" in first, "Must have count"
        assert isinstance(first["count"], (int, float)), "Count must be numeric"


def validate_crime_types(data):
    """Validate crime types response"""
    assert "crime_types" in data, "Must have crime_types array"
    assert isinstance(data["crime_types"], list), "crime_types must be a list"

    if len(data["crime_types"]) > 0:
        crime_type = data["crime_types"][0]
        assert "type" in crime_type, "Must have type field"
        assert "count" in crime_type, "Must have count field"


def run_all_tests():
    """Execute complete test suite"""
    print_color("\n" + "=" * 60, Colors.BOLD)
    print_color("Chicago CRIME HEATMAP - API TEST SUITE", Colors.BOLD)
    print_color("=" * 60 + "\n", Colors.BOLD)
    print(f"Target: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Check if server is reachable first
    try:
        response = requests.get(BASE_URL, timeout=5)
        print_color("✓ Server is reachable\n", Colors.GREEN)
    except:
        print_color("✗ Cannot reach server. Make sure Flask is running!", Colors.RED)
        print("Start server with: python src/api/main.py")
        sys.exit(1)

    tests = [
        {
            "name": "Health Check",
            "url": f"{BASE_URL}/api/health",
            "keys": ["status", "total_crimes"],
            "validate": None,
        },
        {
            "name": "All Crimes (Limited to 100)",
            "url": f"{BASE_URL}/api/crimes/all?limit=100",
            "keys": ["type", "features"],
            "validate": validate_geojson,
        },
        {
            "name": "All Crimes (Default limit)",
            "url": f"{BASE_URL}/api/crimes/all",
            "keys": ["type", "features"],
            "validate": validate_geojson,
        },
        {
            "name": "Crime Hotspots",
            "url": f"{BASE_URL}/api/crimes/hotspots",
            "keys": ["type", "features"],
            "validate": validate_geojson,
        },
        {
            "name": "Monthly Statistics",
            "url": f"{BASE_URL}/api/stats/monthly",
            "keys": ["monthly_trends"],
            "validate": validate_monthly_stats,
        },
        {
            "name": "Crime Types Distribution",
            "url": f"{BASE_URL}/api/crimes/types",
            "keys": ["crime_types", "total_types"],
            "validate": validate_crime_types,
        },
        {
            "name": "Filter by Crime Type (Theft)",
            "url": f"{BASE_URL}/api/crimes/filter/Theft",
            "keys": ["crime_type", "total", "features"],
            "validate": None,
        },
        {
            "name": "Filter by Crime Type (Robbery)",
            "url": f"{BASE_URL}/api/crimes/filter/Robbery",
            "keys": ["crime_type", "total", "features"],
            "validate": None,
        },
        {
            "name": "Date Range Filter",
            "url": f"{BASE_URL}/api/crimes/all?start_date=2023-01-01&end_date=2023-12-31",
            "keys": ["type", "features"],
            "validate": None,
        },
    ]

    results = []
    start_time = time.time()

    for test in tests:
        success = test_endpoint(
            test["name"], test["url"], test["keys"], test.get("validate")
        )
        results.append({"name": test["name"], "passed": success})
        time.sleep(0.3)  # Small delay between tests

    total_duration = time.time() - start_time

    # Print summary
    print_color(f"\n{'=' * 60}", Colors.BOLD)
    print_color("TEST SUMMARY", Colors.BOLD)
    print_color("=" * 60, Colors.BOLD)

    passed = sum(1 for r in results if r["passed"])
    total = len(results)

    for result in results:
        if result["passed"]:
            print_color(f"✓ {result['name']}", Colors.GREEN)
        else:
            print_color(f"✗ {result['name']}", Colors.RED)

    print(f"\n{Colors.BOLD}Results:{Colors.RESET}")
    print(f"  Passed: {passed}/{total}")
    print(f"  Failed: {total - passed}/{total}")
    print(f"  Total time: {total_duration:.2f}s")

    if passed == total:
        print_color("\n🎉 All tests passed! API is working perfectly.", Colors.GREEN)
        return 0
    else:
        print_color(
            f"\n⚠️  {total - passed} test(s) failed. Check output above.", Colors.YELLOW
        )
        return 1


def test_performance():
    """
    Week 8: Performance testing
    Verify response times are acceptable
    """
    print_color("\n" + "=" * 60, Colors.BOLD)
    print_color("PERFORMANCE TESTS", Colors.BOLD)
    print_color("=" * 60 + "\n", Colors.BOLD)

    endpoints = [
        ("Health", f"{BASE_URL}/api/health"),
        ("Crimes (100)", f"{BASE_URL}/api/crimes/all?limit=100"),
        ("Crimes (1000)", f"{BASE_URL}/api/crimes/all?limit=1000"),
        ("Hotspots", f"{BASE_URL}/api/crimes/hotspots"),
        ("Monthly Stats", f"{BASE_URL}/api/stats/monthly"),
    ]

    for name, url in endpoints:
        times = []
        print(f"\nTesting: {name}")

        for i in range(3):
            start = time.time()
            try:
                response = requests.get(url, timeout=30)
                duration = time.time() - start
                times.append(duration)
                print(f"  Run {i + 1}: {duration:.3f}s")
            except Exception as e:
                print_color(f"  Run {i + 1}: Failed - {e}", Colors.RED)

        if times:
            avg_time = sum(times) / len(times)
            print(f"  Average: {avg_time:.3f}s")

            # Performance thresholds
            if avg_time < 1.0:
                print_color("  ✓ Excellent performance", Colors.GREEN)
            elif avg_time < 3.0:
                print_color("  ✓ Good performance", Colors.YELLOW)
            else:
                print_color("  ✗ Slow performance (>3s)", Colors.RED)


if __name__ == "__main__":
    exit_code = run_all_tests()

    # Run performance tests if all functional tests passed
    if exit_code == 0:
        test_performance()

    sys.exit(exit_code)
