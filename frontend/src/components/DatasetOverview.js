import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Calendar, Users, FileText, BarChart3, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DatasetOverview = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/datasets`);
      setDatasets(response.data.datasets || []);
    } catch (err) {
      setError('Failed to fetch datasets. Please try again.');
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Datasets</h1>
              <p className="text-gray-600">
                Manage and analyze your uploaded retail sales datasets
              </p>
            </div>
            <Button onClick={() => navigate('/upload')} className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Upload New Dataset
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datasets Grid */}
        {datasets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
              <p className="text-gray-500 text-center mb-6">
                Upload your first retail sales dataset to begin customer segmentation and analysis.
              </p>
              <Button onClick={() => navigate('/upload')}>
                Upload Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {dataset.filename}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Uploaded {formatDate(dataset.upload_timestamp)}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={dataset.data_quality_score >= 90 ? 'default' : dataset.data_quality_score >= 70 ? 'secondary' : 'destructive'}
                      className="ml-2"
                    >
                      {dataset.data_quality_score}% Quality
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <FileText className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-xs text-gray-600">Records</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {dataset.total_records?.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Users className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-xs text-gray-600">Customers</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {dataset.total_customers?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Date Range</span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {dataset.date_range?.start_date} to {dataset.date_range?.end_date}
                    </p>
                  </div>

                  {/* Columns */}
                  <div>
                    <div className="flex items-center mb-2">
                      <BarChart3 className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Columns ({dataset.columns?.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
                      {dataset.columns?.slice(0, 6).map((column) => (
                        <Badge key={column} variant="outline" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                      {dataset.columns?.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{dataset.columns.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      onClick={() => navigate(`/dashboard/${dataset.id}`)}
                      className="flex-1"
                      size="sm"
                    >
                      Dashboard
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/rfm-analysis?dataset=${dataset.id}`)}
                      size="sm"
                    >
                      RFM
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/clustering?dataset=${dataset.id}`)}
                      size="sm"
                    >
                      Cluster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetOverview;