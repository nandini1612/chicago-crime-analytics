import { useState } from "react";
import { 
  Filter, 
  Calendar, 
  MapPin, 
  BarChart3, 
  Activity, 
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [displayExpanded, setDisplayExpanded] = useState(true);

  const statsCards = [
    {
      label: "Total Crimes",
      value: "24,567",
      change: "+2.3%",
      trend: "up",
      icon: BarChart3,
      color: "text-primary"
    },
    {
      label: "Active Hotspots", 
      value: "18",
      change: "-5.2%",
      trend: "down",
      icon: MapPin,
      color: "text-accent"
    },
    {
      label: "Daily Average",
      value: "342",
      change: "+1.8%",
      trend: "up", 
      icon: Activity,
      color: "text-success"
    },
    {
      label: "Trend Index",
      value: "76.4",
      change: "+0.9%",
      trend: "up",
      icon: TrendingUp,
      color: "text-warning"
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        dashboard-sidebar fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 z-50
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 space-y-6">
          {/* Mobile close button */}
          <div className="flex justify-end lg:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Filters</h3>
              </div>
              {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {filtersExpanded && (
              <div className="space-y-4 pl-2 fade-in">
                <div>
                  <Label className="text-sm font-medium">Crime Type</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types (24,567)</SelectItem>
                      <SelectItem value="theft">Theft (8,432)</SelectItem>
                      <SelectItem value="assault">Assault (4,231)</SelectItem>
                      <SelectItem value="burglary">Burglary (3,124)</SelectItem>
                      <SelectItem value="robbery">Robbery (2,890)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last 7 Days
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      This Month
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">District</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      <SelectItem value="001">District 001 - Central</SelectItem>
                      <SelectItem value="002">District 002 - Wentworth</SelectItem>
                      <SelectItem value="003">District 003 - Grand Crossing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="primary-button flex-1">Apply Filters</Button>
                  <Button variant="outline" size="sm">Clear</Button>
                </div>
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <button
              onClick={() => setDisplayExpanded(!displayExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="font-semibold text-foreground">Display Options</h3>
              {displayExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {displayExpanded && (
              <div className="space-y-3 pl-2 fade-in">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Heatmap</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Hotspots</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Districts</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Cluster Markers</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Stats</h3>
            <div className="space-y-3">
              {statsCards.map((stat, index) => (
                <Card key={index} className="p-4 stat-card slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <div>
                        <p className="metric-label">{stat.label}</p>
                        <p className="metric-value text-xl">{stat.value}</p>
                      </div>
                    </div>
                    <div className={stat.trend === 'up' ? 'trend-positive' : 'trend-negative'}>
                      {stat.change}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Last updated: 2 minutes ago
          </div>
        </div>
      </aside>
    </>
  );
};