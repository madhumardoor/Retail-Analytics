import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Database, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DataUpload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      const response = await axios.post(`${API}/upload-dataset`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const requiredColumns = [
    'customer_id', 'order_id', 'order_date', 'product_id', 
    'quantity', 'unit_price', 'total_amount'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Retail Sales Dataset
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your retail sales data in CSV format to begin advanced customer segmentation 
            and RFM analysis. Ensure your dataset follows the required schema.
          </p>
        </div>

        {/* Data Schema Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Required Data Schema
            </CardTitle>
            <CardDescription>
              Your CSV file must contain the following columns for successful analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredColumns.map((column) => (
                <div key={column} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{column}</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {column === 'customer_id' && 'Unique customer identifier'}
                      {column === 'order_id' && 'Unique order/transaction ID'}
                      {column === 'order_date' && 'Date of purchase (YYYY-MM-DD)'}
                      {column === 'product_id' && 'Product identifier'}
                      {column === 'quantity' && 'Number of items purchased'}
                      {column === 'unit_price' && 'Price per unit'}
                      {column === 'total_amount' && 'Total line item amount'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                {isDragActive ? (
                  <p className="text-lg text-blue-600">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-lg text-gray-600">
                      Drag and drop your retail sales CSV file here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse files</p>
                  </>
                )}
                <div className="flex justify-center space-x-2">
                  <Badge variant="outline">CSV</Badge>
                  <Badge variant="outline">Excel</Badge>
                  <Badge variant="outline">Max 50MB</Badge>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uploading and processing...</span>
                  <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">
                  Please wait while we validate and process your dataset
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Result */}
            {uploadResult && (
              <div className="mt-6 space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Dataset uploaded successfully! Your data is ready for analysis.
                  </AlertDescription>
                </Alert>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      Dataset Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {uploadResult.info?.total_records?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Total Records</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {uploadResult.info?.total_customers?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Unique Customers</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {uploadResult.info?.data_quality_score}%
                        </p>
                        <p className="text-sm text-gray-600">Data Quality</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {uploadResult.info?.columns?.length}
                        </p>
                        <p className="text-sm text-gray-600">Columns</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Date Range</h4>
                        <p className="text-sm text-gray-600">
                          {uploadResult.info?.date_range?.start_date} to {uploadResult.info?.date_range?.end_date}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Available Columns</h4>
                        <div className="flex flex-wrap gap-2">
                          {uploadResult.info?.columns?.map((column) => (
                            <Badge key={column} variant="secondary">
                              {column}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-6 space-x-4">
                      <Button
                        onClick={() => navigate(`/dashboard/${uploadResult.dataset_id}`)}
                        className="flex items-center"
                      >
                        View Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/datasets')}
                      >
                        View All Datasets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Data Information */}
        <Card>
          <CardHeader>
            <CardTitle>Need Sample Data?</CardTitle>
            <CardDescription>
              Don't have a dataset ready? Download our sample retail sales dataset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Sample Retail Dataset Available
                  </h4>
                  <p className="text-blue-800 text-sm mb-4">
                    We've generated a comprehensive sample dataset with 58,000+ transactions 
                    from 2,500 customers across 8 product categories. This dataset includes 
                    realistic customer behavior patterns perfect for testing all analytics features.
                  </p>
                  <div className="space-x-3">
                    <Button 
                      variant="outline" 
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${BACKEND_URL}/api/download/sample-dataset`;
                        link.download = 'retail_sales_sample_dataset.csv';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Download Sample Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${BACKEND_URL}/api/download/data-dictionary`;
                        link.download = 'data_dictionary.json';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Data Dictionary
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataUpload;