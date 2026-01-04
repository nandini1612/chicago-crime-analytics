import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-bg">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mx-auto">
          <AlertCircle className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold gradient-primary bg-clip-text text-transparent">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist in the Chicago Crime Analytics system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="primary-button">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
          
          <Button variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            View Crime Map
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-4 border-t">
          If you believe this is an error, please contact the system administrator.
        </div>
      </div>
    </div>
  );
};

export default NotFound;
