import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, Database, Upload, AlertCircle, FileText, Target } from "lucide-react";
import DataUpload from "./components/DataUpload";
import Dashboard from "./components/Dashboard";
import RFMAnalysis from "./components/RFMAnalysis";
import ClusteringAnalysis from "./components/ClusteringAnalysis";
import DatasetOverview from "./components/DatasetOverview";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/upload", label: "Data Upload", icon: Upload },
    { path: "/datasets", label: "Datasets", icon: Database },
    { path: "/rfm-analysis", label: "RFM Analysis", icon: Users },
    { path: "/clustering", label: "Clustering", icon: Target },
  ];
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900">
            Retail Analytics Platform
          </h1>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Data Science Platform v1.0
        </Badge>
      </div>
    </nav>
  );
};

const Home = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkSystemStatus = async () => {
    try {
      const response = await axios.get(`${API}/`);
      setSystemStatus({ status: "online", message: response.data.message });
    } catch (e) {
      console.error("System status check failed:", e);
      setSystemStatus({ status: "offline", message: "API connection failed" });
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await axios.get(`${API}/datasets`);
      setDatasets(response.data.datasets || []);
    } catch (e) {
      console.error("Failed to fetch datasets:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([checkSystemStatus(), fetchDatasets()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status */}
        <div className="mb-8">
          <Card className={`border-l-4 ${systemStatus?.status === 'online' ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${systemStatus?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  System Status
                </CardTitle>
                <Badge variant={systemStatus?.status === 'online' ? 'default' : 'destructive'}>
                  {systemStatus?.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{systemStatus?.message}</p>
            </CardContent>
          </Card>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Retail Analytics & Customer Segmentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Leverage machine learning algorithms and statistical analysis for comprehensive customer segmentation, 
            RFM analysis, and predictive insights. Built with academic rigor for data science excellence.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/upload">
              <Button size="lg" className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Dataset
              </Button>
            </Link>
            <Link to="/datasets">
              <Button variant="outline" size="lg" className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                View Datasets
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                RFM Analysis
              </CardTitle>
              <CardDescription>
                Recency, Frequency, Monetary segmentation with statistical validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Statistical quartile-based segmentation</li>
                <li>• ANOVA testing for segment validation</li>
                <li>• Customer lifecycle insights</li>
                <li>• Segment performance metrics</li>
              </ul>
              <Link to="/rfm-analysis" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Explore RFM →</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-2 text-green-600" />
                Advanced Clustering
              </CardTitle>
              <CardDescription>
                Multiple ML algorithms with comprehensive evaluation metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• K-Means, Hierarchical, DBSCAN</li>
                <li>• Silhouette & Davies-Bouldin scores</li>
                <li>• Elbow method optimization</li>
                <li>• Feature engineering pipeline</li>
              </ul>
              <Link to="/clustering" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Analyze Clusters →</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                Statistical Insights
              </CardTitle>
              <CardDescription>
                Academic-level statistical analysis and model validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Hypothesis testing (ANOVA, Chi-square)</li>
                <li>• Cross-validation & model metrics</li>
                <li>• Feature importance analysis</li>
                <li>• Business intelligence reporting</li>
              </ul>
              <Link to="/" className="mt-4 inline-block">
                <Button variant="outline" size="sm">View Dashboard →</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Dataset Overview */}
        {datasets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-6 w-6 mr-2" />
                Recent Datasets
              </CardTitle>
              <CardDescription>
                {datasets.length} dataset(s) available for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datasets.slice(0, 3).map((dataset) => (
                  <div key={dataset.id} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">{dataset.filename}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Records: {dataset.total_records?.toLocaleString()}</p>
                      <p>Customers: {dataset.total_customers?.toLocaleString()}</p>
                      <p>Quality: {dataset.data_quality_score}%</p>
                    </div>
                    <Badge className="mt-2" variant="outline">
                      {new Date(dataset.upload_timestamp).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
              {datasets.length > 3 && (
                <div className="mt-4 text-center">
                  <Link to="/datasets">
                    <Button variant="outline">View All Datasets →</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Quick guide to start your retail analytics journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">1. Upload Data</h4>
                <p className="text-sm text-gray-600">
                  Upload your retail sales CSV with customer transactions
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">2. Analyze</h4>
                <p className="text-sm text-gray-600">
                  Run RFM analysis and clustering algorithms on your data
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">3. Insights</h4>
                <p className="text-sm text-gray-600">
                  Get actionable insights and export results for business decisions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/datasets" element={<DatasetOverview />} />
          <Route path="/dashboard/:datasetId" element={<Dashboard />} />
          <Route path="/rfm-analysis" element={<RFMAnalysis />} />
          <Route path="/clustering" element={<ClusteringAnalysis />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;