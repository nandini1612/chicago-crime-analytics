import { Menu, Sun, Moon, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Header = ({ onToggleSidebar, sidebarOpen }: HeaderProps) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="dashboard-header fixed top-0 left-0 right-0 z-50 h-16 px-6">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Chicago Crime Analytics</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Real-time crime data visualization</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/analysis" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/analysis' ? 'text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Analysis
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/about' ? 'text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              About
            </Link>
          </nav>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};