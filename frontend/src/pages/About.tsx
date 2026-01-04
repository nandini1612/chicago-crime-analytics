import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Database, 
  BarChart3, 
  Users,
  Globe,
  Code,
  Mail,
  Github,
  ExternalLink,
  Target,
  Zap,
  Lock,
  Brain,
  FileText,
  TrendingUp,
  Map,
  BookOpen,
  Lightbulb,
  Linkedin
} from "lucide-react";

export const About = () => {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header />
      
      <div className="pt-20 px-6 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 relative">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 opacity-20 rounded-3xl -z-10"></div>
            <h1 className="text-4xl font-bold text-foreground">Chicago Crime Analytics</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Full-stack data visualization platform analyzing 50K+ crime records with temporal patterns, spatial distribution, and predictive forecasting
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                Real-time Data
              </Badge>
              <Badge variant="outline" className="text-success border-success/20 bg-success/10">
                Time Series Analysis
              </Badge>
              <Badge variant="outline" className="text-accent border-accent/20 bg-accent/10">
                Full Stack
              </Badge>
            </div>
          </div>

          {/* Why I Built This */}
          <Card className="p-8">
            <div className="text-center space-y-4">
              <Lightbulb className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Why I Built This Project</h2>
              <div className="text-left space-y-4 text-muted-foreground max-w-3xl mx-auto">
                <p className="leading-relaxed">
                  As a data science learner, I wanted to build a project that demonstrates the complete data pipeline—from 
                  raw data acquisition to deployment. I initially started with Delhi's crime data but quickly realized 
                  it lacked the temporal granularity needed for meaningful time-series analysis.
                </p>
                <p className="leading-relaxed">
                  I switched to Chicago's publicly available crime database (50K+ recent records from their Data Portal), 
                  which provided sufficient volume for statistical analysis, spatial visualization, and time-series forecasting. 
                  This decision was crucial as it allowed me to implement real analytical techniques rather than just displaying static data.
                </p>
                <p className="leading-relaxed">
                  Through this project, I gained hands-on experience with REST API design, database optimization, 
                  geospatial data handling, time series decomposition, and building responsive React applications. 
                  The challenges I faced—like dealing with missing temporal data and implementing efficient spatial queries—taught 
                  me more than any tutorial could.
                </p>
              </div>
            </div>
          </Card>

          {/* Methodology Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold">Technical Implementation</h2>
                <p className="text-muted-foreground mt-2">What I actually built and learned</p>
              </div>

              {/* Data Pipeline */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="h-6 w-6 text-primary" />
                  1. Data Acquisition & Processing
                </h3>
                <div className="pl-8 space-y-3 text-muted-foreground">
                  <p><strong>Source:</strong> Chicago Data Portal REST API - 50K+ crime records (July-September 2025 sample)</p>
                  <p><strong>Database:</strong> SQLite with optimized indexes on date, crime_type, and location columns</p>
                  <p><strong>ETL Pipeline:</strong></p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Python script to fetch and clean data from Chicago's API</li>
                    <li>Data validation: removed records with invalid coordinates, standardized crime type names</li>
                    <li>Feature engineering: extracted year_month for temporal aggregation</li>
                    <li>Stored as normalized TEXT dates (YYYY-MM-DD) for SQL compatibility</li>
                  </ul>
                  <p><strong>Key Learning:</strong> Dealing with real-world messy data—missing districts, inconsistent naming, coordinate outliers</p>
                </div>
              </div>

              {/* Analysis Techniques */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-accent" />
                  2. Analytical Techniques Implemented
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Temporal Analysis */}
                  <div className="p-6 bg-gradient-subtle rounded-lg border border-border">
                    <TrendingUp className="h-8 w-8 text-success mb-3" />
                    <h4 className="text-lg font-semibold mb-3">Temporal Analysis</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Time-based aggregation (daily, monthly trends)</li>
                      <li>• 7-day moving average for smoothing</li>
                      <li>• Linear regression (NumPy polyfit) for trend detection</li>
                      <li>• <strong>Challenge solved:</strong> Database lacks hour data, so I synthesized realistic hourly patterns using empirically-based weights</li>
                      <li>• Peak hour identification through distribution analysis</li>
                    </ul>
                  </div>

                  {/* Spatial Analysis */}
                  <div className="p-6 bg-gradient-subtle rounded-lg border border-border">
                    <Map className="h-8 w-8 text-accent mb-3" />
                    <h4 className="text-lg font-semibold mb-3">Spatial Analysis</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• GeoJSON format for efficient mapping (Leaflet.js)</li>
                      <li>• District-level aggregation with Pandas groupby</li>
                      <li>• Interactive heatmap using Leaflet.heat plugin</li>
                      <li>• Geographic concentration metrics (top 10 districts = 60% of crimes)</li>
                      <li>• <strong>Learning:</strong> Coordinate system (WGS84) and map projections</li>
                    </ul>
                  </div>

                  {/* Predictive Modeling */}
                  <div className="p-6 bg-gradient-subtle rounded-lg border border-border">
                    <Zap className="h-8 w-8 text-warning mb-3" />
                    <h4 className="text-lg font-semibold mb-3">Predictive Modeling</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Simple Moving Average (SMA) for 7-day forecast</li>
                      <li>• Calculated from 30-day trailing average</li>
                      <li>• Weekend adjustment factor (±15% variation)</li>
                      <li>• Confidence bands using standard deviation</li>
                      <li>• <strong>Honest note:</strong> Simple technique but demonstrates understanding of forecasting fundamentals</li>
                    </ul>
                  </div>

                  {/* Risk Assessment */}
                  <div className="p-6 bg-gradient-subtle rounded-lg border border-border">
                    <Shield className="h-8 w-8 text-destructive mb-3" />
                    <h4 className="text-lg font-semibold mb-3">Risk Assessment</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Calculated from 30-day crime volume</li>
                      <li>• Risk levels: HIGH (&gt;150/day), MEDIUM (100-150), LOW (&lt;100)</li>
                      <li>• High-risk district identification (SQL aggregation)</li>
                      <li>• Hourly risk categorization based on typical crime patterns</li>
                      <li>• Real-time risk index updates based on recent data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Findings */}
              <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Data Insights & Patterns</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <strong className="text-foreground">Crime Distribution:</strong>
                        <p>Theft (23.2%) and Battery (18.5%) account for 41.7% of all crimes. Each type shows distinct temporal patterns when analyzed separately.</p>
                      </div>
                      <div>
                        <strong className="text-foreground">Geographic Concentration:</strong>
                        <p>Top 3 districts (Near West, Central, Chicago Lawn) account for ~18% of crimes. Top 10 districts represent 58% of total volume—indicating concentrated hotspots.</p>
                      </div>
                      <div>
                        <strong className="text-foreground">Temporal Patterns:</strong>
                        <p>Peak crime hours: 17:00-19:00 (5 PM - 7 PM) based on synthetic distribution weighted by empirical crime research. Monthly data shows August 2025 had highest crime count (20,872).</p>
                      </div>
                      <div>
                        <strong className="text-foreground">Trend Analysis:</strong>
                        <p>3-month period (July-Sept 2025) shows -11.5% decline from peak to lowest month. Linear regression reveals decreasing trend (negative slope) for this period.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Challenges */}
              <div className="mt-6 p-6 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-start gap-3">
                  <Code className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Technical Challenges & Solutions</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <strong className="text-foreground">Challenge 1: Missing Temporal Granularity</strong>
                        <p><strong>Problem:</strong> Database stores only dates (YYYY-MM-DD), no hour information</p>
                        <p><strong>Solution:</strong> Generated synthetic hourly distribution using empirically-based weights (higher probability 12-23:00) to demonstrate visualization techniques while being transparent about data limitations</p>
                      </div>
                      <div>
                        <strong className="text-foreground">Challenge 2: Date Range Mismatch</strong>
                        <p><strong>Problem:</strong> Initial queries looked for "last 90 days from today" but data was historical (2025)</p>
                        <p><strong>Solution:</strong> Modified backend to dynamically find latest date in database and calculate ranges backwards—made system adaptable to any dataset</p>
                      </div>
                      <div>
                        <strong className="text-foreground">Challenge 3: API Performance</strong>
                        <p><strong>Problem:</strong> Loading 50K records overwhelmed frontend</p>
                        <p><strong>Solution:</strong> Implemented pagination (default 5K limit), SQL indexes, and client-side data caching</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Database className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">ETL Pipeline</h3>
              <p className="text-muted-foreground text-sm">
                Python-based data extraction, cleaning, and loading into SQLite with optimized indexes
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <BarChart3 className="h-12 w-12 mx-auto text-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Visualizations</h3>
              <p className="text-muted-foreground text-sm">
                Built with Recharts and Leaflet.js—heatmaps, time-series charts, spatial distributions
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Zap className="h-12 w-12 mx-auto text-warning mb-4" />
              <h3 className="text-lg font-semibold mb-2">Predictive Forecasting</h3>
              <p className="text-muted-foreground text-sm">
                7-day crime prediction using SMA with confidence intervals and trend detection
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-semibold mb-2">REST API Design</h3>
              <p className="text-muted-foreground text-sm">
                Flask backend with 15+ endpoints for crime data, analytics, and forecasting
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Globe className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Responsive Frontend</h3>
              <p className="text-muted-foreground text-sm">
                React + TypeScript with Tailwind CSS—mobile-first design, dark mode support
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Map className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geospatial Analysis</h3>
              <p className="text-muted-foreground text-sm">
                GeoJSON formatting, coordinate validation, district-level aggregation
              </p>
            </Card>
          </div>

          {/* Technology Stack */}
          <Card className="p-8">
            <div className="text-center mb-6">
              <Code className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Technology Stack</h2>
              <p className="text-muted-foreground mt-2">Modern, production-ready technologies</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Frontend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">React 18 + TypeScript</span>
                    <Badge variant="outline">UI Framework</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="font-medium">Tailwind CSS + shadcn/ui</span>
                    <Badge variant="outline">Styling</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="font-medium">Leaflet.js + Leaflet.heat</span>
                    <Badge variant="outline">Mapping</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="font-medium">Recharts</span>
                    <Badge variant="outline">Charts</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">Vite</span>
                    <Badge variant="outline">Build Tool</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Backend & Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">Python 3.11 + Flask</span>
                    <Badge variant="outline">API Server</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="font-medium">SQLite</span>
                    <Badge variant="outline">Database</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="font-medium">Pandas + NumPy</span>
                    <Badge variant="outline">Data Processing</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="font-medium">Flask-CORS</span>
                    <Badge variant="outline">API Security</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="font-medium">Requests</span>
                    <Badge variant="outline">Data Fetching</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact & Links */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Connect With Me
            </h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://github.com/nandini1612', '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                View Project on GitHub
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://www.linkedin.com/in/nandini-saxena1111/', '_blank')}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Connect on LinkedIn
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <a href="mailto:nandinisaxenawork@gmail.com">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Me
                </a>
              </Button>
            </div>
          </Card>

          {/* Footer */}
          <Card className="p-6">
            <div className="text-center text-muted-foreground text-sm">
              <p className="font-semibold text-foreground mb-2">Learning Project & Portfolio Demonstration</p>
              <p>This project demonstrates full-stack development, data analysis, and visualization skills.</p>
              <p className="mt-2">Built to learn modern web technologies and data science techniques.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;