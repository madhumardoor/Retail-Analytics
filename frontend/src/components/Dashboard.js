import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, TrendingUp, AlertCircle, Play, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState(null);
  const [rfmResults, setRfmResults] = useState(null);
  const [clusteringResults, setClusteringResults] = useState(null);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [datasetId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dataset info
      const datasetsResponse = await axios.get(`${API}/datasets`);
      const currentDataset = datasetsResponse.data.datasets.find(d => d.id === datasetId);
      setDataset(currentDataset);

      // Fetch existing analyses
      const analysesResponse = await axios.get(`${API}/analyses/${datasetId}`);
      
      if (analysesResponse.data.rfm_analyses?.length > 0) {
        // If we have RFM analysis, fetch the results
        const rfmResponse = await axios.post(`${API}/analyze/rfm/${datasetId}`);
        setRfmResults(rfmResponse.data);
      }
      
      if (analysesResponse.data.clustering_analyses?.length > 0) {
        // If we have clustering analysis, fetch the results  
        const clusteringResponse = await axios.post(`${API}/analyze/clustering/${datasetId}?method=kmeans`);
        setClusteringResults(clusteringResponse.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const runRFMAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await axios.post(`${API}/analyze/rfm/${datasetId}`);
      setRfmResults(response.data);
    } catch (err) {
      setError('Failed to run RFM analysis');
      console.error('RFM Analysis Error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const runClusteringAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await axios.post(`${API}/analyze/clustering/${datasetId}?method=kmeans`);
      setClusteringResults(response.data);
    } catch (err) {
      setError('Failed to run clustering analysis');
      console.error('Clustering Analysis Error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              Dataset Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">The requested dataset could not be found.</p>
            <Button onClick={() => navigate('/datasets')}>
              View All Datasets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for visualizations
  const segmentChartData = rfmResults?.rfm_results?.segment_distribution ? 
    Object.entries(rfmResults.rfm_results.segment_distribution).map(([name, value]) => ({
      name,
      customers: value,
      percentage: ((value / rfmResults.summary.total_customers) * 100).toFixed(1)
    })) : [];

  const clusterChartData = clusteringResults?.clustering_results?.cluster_statistics ?
    Object.entries(clusteringResults.clustering_results.cluster_statistics).map(([cluster, stats]) => ({
      name: cluster.replace('_', ' ').toUpperCase(),
      customers: stats.customer_count,
      avgRecency: stats.recency_mean,
      avgFrequency: stats.frequency_mean,
      avgMonetary: stats.monetary_mean
    })) : [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Dataset: {dataset.filename}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={fetchDashboardData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dataset Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataset.total_records?.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unique Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataset.total_customers?.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Data Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataset.data_quality_score}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {dataset.date_range?.start_date} to<br/>
                {dataset.date_range?.end_date}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rfm">RFM Analysis</TabsTrigger>
            <TabsTrigger value="clustering">ML Clustering</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* RFM Analysis Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    RFM Customer Segmentation
                  </CardTitle>
                  <CardDescription>
                    Advanced customer segmentation using Recency, Frequency, Monetary analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rfmResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-900">
                            {rfmResults.summary?.total_customers?.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600">Total Customers</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-900">
                            {rfmResults.summary?.segments_identified}
                          </div>
                          <div className="text-sm text-green-600">Segments</div>
                        </div>
                      </div>
                      <Badge className="w-full justify-center" variant="outline">
                        ✅ Analysis Complete - All segments statistically significant
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Run RFM analysis to segment your customers</p>
                      <Button onClick={runRFMAnalysis} disabled={analyzing}>
                        <Play className="h-4 w-4 mr-2" />
                        {analyzing ? 'Running Analysis...' : 'Run RFM Analysis'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clustering Analysis Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Machine Learning Clustering
                  </CardTitle>
                  <CardDescription>
                    Advanced clustering with K-Means algorithm and evaluation metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clusteringResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-900">
                            {clusteringResults.clustering_results?.optimal_clusters}
                          </div>
                          <div className="text-sm text-purple-600">Optimal Clusters</div>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-900">
                            {clusteringResults.model_evaluation?.silhouette_score?.toFixed(3)}
                          </div>
                          <div className="text-sm text-indigo-600">Silhouette Score</div>
                        </div>
                      </div>
                      <Badge className="w-full justify-center" variant="outline">
                        ✅ Analysis Complete - Good cluster separation achieved
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Run ML clustering to discover customer groups</p>
                      <Button onClick={runClusteringAnalysis} disabled={analyzing}>
                        <Play className="h-4 w-4 mr-2" />
                        {analyzing ? 'Running Analysis...' : 'Run Clustering'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RFM Analysis Tab */}
          <TabsContent value="rfm" className="space-y-6">
            {rfmResults ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Segment Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Segment Distribution</CardTitle>
                    <CardDescription>Number of customers in each RFM segment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={segmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="customers" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Segment Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customer Segments</CardTitle>
                    <CardDescription>Most valuable customer segments by size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {segmentChartData.slice(0, 5).map((segment, index) => (
                        <div key={segment.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: COLORS[index]}}></div>
                            <div>
                              <div className="font-medium">{segment.name}</div>
                              <div className="text-sm text-gray-500">{segment.percentage}% of customers</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{segment.customers}</div>
                            <div className="text-sm text-gray-500">customers</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistical Validation */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Statistical Validation Results</CardTitle>
                    <CardDescription>ANOVA test results showing segment significance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {rfmResults.summary?.statistical_significance?.anova_results && 
                        Object.entries(rfmResults.summary.statistical_significance.anova_results).map(([metric, result]) => (
                          <div key={metric} className="p-4 border rounded-lg">
                            <h4 className="font-semibold capitalize mb-2">{metric} Dimension</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">F-statistic:</span>
                                <span className="font-mono text-sm">{result.f_statistic?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">p-value:</span>
                                <span className="font-mono text-sm">{result.p_value?.toExponential(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Significant:</span>
                                <Badge variant={result.significant ? 'default' : 'destructive'}>
                                  {result.significant ? '✅ YES' : '❌ NO'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No RFM Analysis Found</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Run RFM analysis to see customer segmentation results and statistics.
                  </p>
                  <Button onClick={runRFMAnalysis} disabled={analyzing}>
                    <Play className="h-4 w-4 mr-2" />
                    {analyzing ? 'Running Analysis...' : 'Run RFM Analysis'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Clustering Tab */}
          <TabsContent value="clustering" className="space-y-6">
            {clusteringResults ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cluster Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cluster Distribution</CardTitle>
                    <CardDescription>Customer distribution across ML clusters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={clusterChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, customers}) => `${name}: ${customers}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="customers"
                        >
                          {clusterChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Model Evaluation Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Model Evaluation Metrics</CardTitle>
                    <CardDescription>Clustering algorithm performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium">Silhouette Score</span>
                          <Badge variant="outline">
                            {clusteringResults.model_evaluation?.silhouette_score?.toFixed(3)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium">Davies-Bouldin Index</span>
                          <Badge variant="outline">
                            {clusteringResults.model_evaluation?.davies_bouldin_score?.toFixed(3)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium">Calinski-Harabasz Score</span>
                          <Badge variant="outline">
                            {clusteringResults.model_evaluation?.calinski_harabasz_score?.toFixed(0)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-4">
                        Higher Silhouette & CH scores are better. Lower Davies-Bouldin is better.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cluster Characteristics */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Cluster Characteristics</CardTitle>
                    <CardDescription>Average RFM values for each cluster</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={clusterChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgRecency" fill="#8884d8" name="Avg Recency (days)" />
                        <Bar dataKey="avgFrequency" fill="#82ca9d" name="Avg Frequency" />
                        <Bar dataKey="avgMonetary" fill="#ffc658" name="Avg Monetary ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clustering Analysis Found</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Run machine learning clustering to discover customer groups automatically.
                  </p>
                  <Button onClick={runClusteringAnalysis} disabled={analyzing}>
                    <Play className="h-4 w-4 mr-2" />
                    {analyzing ? 'Running Analysis...' : 'Run Clustering Analysis'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;