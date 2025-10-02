import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { datasetId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, [datasetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Dataset ID: {datasetId}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Dashboard Coming Soon
            </CardTitle>
            <CardDescription>
              Comprehensive analytics dashboard with interactive visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This dashboard will feature advanced data visualizations, customer segment analysis, 
              and key performance indicators for your retail analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;