from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.model_selection import cross_val_score
import io
import json
from scipy import stats
from scipy.stats import zscore
import warnings
warnings.filterwarnings('ignore')

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Retail Analytics & Customer Segmentation Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class DatasetInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    total_records: int
    total_customers: int
    date_range: Dict[str, str]
    columns: List[str]
    data_quality_score: float

class SegmentationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dataset_id: str
    method: str
    parameters: Dict[str, Any]
    clusters: int
    silhouette_score: float
    davies_bouldin_score: float
    calinski_harabasz_score: float
    segment_summary: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RFMAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dataset_id: str
    rfm_segments: Dict[str, Any]
    statistical_summary: Dict[str, Any]
    segment_characteristics: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerSegment(BaseModel):
    customer_id: str
    segment: str
    segment_name: str
    recency: float
    frequency: int
    monetary: float
    clv_prediction: Optional[float] = None
    churn_probability: Optional[float] = None

# Data Processing Functions
def calculate_rfm_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate RFM metrics with statistical rigor"""
    # Ensure proper data types
    df['order_date'] = pd.to_datetime(df['order_date'])
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce')
    
    # Calculate reference date (most recent date + 1 day)
    reference_date = df['order_date'].max() + pd.Timedelta(days=1)
    
    # Calculate RFM metrics
    rfm = df.groupby('customer_id').agg({
        'order_date': lambda x: (reference_date - x.max()).days,  # Recency
        'order_id': 'count',  # Frequency
        'total_amount': 'sum'  # Monetary
    }).rename(columns={
        'order_date': 'recency',
        'order_id': 'frequency', 
        'total_amount': 'monetary'
    })
    
    # Remove outliers using IQR method
    Q1 = rfm.quantile(0.25)
    Q3 = rfm.quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    # Filter outliers
    rfm_clean = rfm[~((rfm < lower_bound) | (rfm > upper_bound)).any(axis=1)]
    
    return rfm_clean

def perform_rfm_segmentation(rfm_df: pd.DataFrame) -> Dict[str, Any]:
    """Perform RFM segmentation using quartiles with statistical validation"""
    
    # Calculate quartile-based scores (1-4, where 4 is best)
    rfm_df['r_score'] = pd.qcut(rfm_df['recency'].rank(method='first'), 4, labels=[4,3,2,1])
    rfm_df['f_score'] = pd.qcut(rfm_df['frequency'].rank(method='first'), 4, labels=[1,2,3,4])
    rfm_df['m_score'] = pd.qcut(rfm_df['monetary'].rank(method='first'), 4, labels=[1,2,3,4])
    
    # Create RFM score
    rfm_df['rfm_score'] = rfm_df['r_score'].astype(str) + rfm_df['f_score'].astype(str) + rfm_df['m_score'].astype(str)
    
    # Define customer segments based on RFM scores
    def segment_customers(row):
        if row['rfm_score'] in ['444', '434', '443', '344']:
            return 'Champions'
        elif row['rfm_score'] in ['334', '343', '333', '324']:
            return 'Loyal Customers'
        elif row['rfm_score'] in ['431', '441', '432']:
            return 'Potential Loyalists'
        elif row['rfm_score'] in ['142', '143', '144', '241', '242']:
            return 'New Customers'
        elif row['rfm_score'] in ['313', '314', '323', '413', '414', '423']:
            return 'Promising'
        elif row['rfm_score'] in ['231', '232', '233', '321', '322']:
            return 'Need Attention'
        elif row['rfm_score'] in ['131', '132', '141', '221', '222']:
            return 'About to Sleep'
        elif row['rfm_score'] in ['112', '113', '121', '122', '211', '212']:
            return 'At Risk'
        elif row['rfm_score'] in ['123', '124', '213', '214', '223', '224']:
            return 'Cannot Lose Them'
        else:
            return 'Lost'
    
    rfm_df['segment'] = rfm_df.apply(segment_customers, axis=1)
    
    # Calculate segment statistics
    segment_stats = rfm_df.groupby('segment').agg({
        'recency': ['mean', 'std', 'count'],
        'frequency': ['mean', 'std'],
        'monetary': ['mean', 'std', 'sum']
    }).round(2)
    
    # Perform ANOVA test to validate segment differences
    segments = rfm_df['segment'].unique()
    segment_groups = [rfm_df[rfm_df['segment'] == seg] for seg in segments]
    
    # ANOVA for each RFM dimension
    f_stat_r, p_val_r = stats.f_oneway(*[group['recency'] for group in segment_groups])
    f_stat_f, p_val_f = stats.f_oneway(*[group['frequency'] for group in segment_groups])
    f_stat_m, p_val_m = stats.f_oneway(*[group['monetary'] for group in segment_groups])
    
    statistical_tests = {
        'anova_results': {
            'recency': {'f_statistic': float(f_stat_r), 'p_value': float(p_val_r), 'significant': bool(p_val_r < 0.05)},
            'frequency': {'f_statistic': float(f_stat_f), 'p_value': float(p_val_f), 'significant': bool(p_val_f < 0.05)},
            'monetary': {'f_statistic': float(f_stat_m), 'p_value': float(p_val_m), 'significant': bool(p_val_m < 0.05)}
        }
    }
    
    # Convert segment statistics to a serializable format
    segment_stats_dict = {}
    for segment in segment_stats.index:
        segment_stats_dict[segment] = {
            'recency_mean': float(segment_stats.loc[segment, ('recency', 'mean')]),
            'recency_std': float(segment_stats.loc[segment, ('recency', 'std')]),
            'frequency_mean': float(segment_stats.loc[segment, ('frequency', 'mean')]),
            'frequency_std': float(segment_stats.loc[segment, ('frequency', 'std')]),
            'monetary_mean': float(segment_stats.loc[segment, ('monetary', 'mean')]),
            'monetary_std': float(segment_stats.loc[segment, ('monetary', 'std')]),
            'customer_count': int(segment_stats.loc[segment, ('recency', 'count')])
        }
    
    return {
        'segment_statistics': segment_stats_dict,
        'statistical_validation': statistical_tests,
        'segment_distribution': rfm_df['segment'].value_counts().to_dict(),
        'total_customers': len(rfm_df)
    }

def perform_advanced_clustering(rfm_df: pd.DataFrame, method: str = 'kmeans') -> Dict[str, Any]:
    """Perform advanced clustering with multiple algorithms and validation"""
    
    # Prepare features for clustering
    features = ['recency', 'frequency', 'monetary']
    X = rfm_df[features].copy()
    
    # Handle missing values
    X = X.fillna(X.median())
    
    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    results = {}
    
    if method == 'kmeans':
        # Elbow method for optimal k
        inertias = []
        silhouette_scores = []
        k_range = range(2, 11)
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(X_scaled)
            inertias.append(kmeans.inertia_)
            silhouette_scores.append(silhouette_score(X_scaled, cluster_labels))
        
        # Find optimal k using elbow method
        optimal_k = k_range[np.argmax(silhouette_scores)]
        
        # Final clustering
        kmeans_final = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
        cluster_labels = kmeans_final.fit_predict(X_scaled)
        
        results = {
            'method': 'K-Means',
            'optimal_clusters': optimal_k,
            'cluster_labels': cluster_labels.tolist(),
            'silhouette_score': silhouette_score(X_scaled, cluster_labels),
            'davies_bouldin_score': davies_bouldin_score(X_scaled, cluster_labels),
            'calinski_harabasz_score': calinski_harabasz_score(X_scaled, cluster_labels),
            'elbow_data': {'k_values': list(k_range), 'inertias': inertias, 'silhouette_scores': silhouette_scores}
        }
        
    elif method == 'hierarchical':
        # Hierarchical clustering
        hierarchical = AgglomerativeClustering(n_clusters=5, linkage='ward')
        cluster_labels = hierarchical.fit_predict(X_scaled)
        
        results = {
            'method': 'Hierarchical',
            'optimal_clusters': 5,
            'cluster_labels': cluster_labels.tolist(),
            'silhouette_score': silhouette_score(X_scaled, cluster_labels),
            'davies_bouldin_score': davies_bouldin_score(X_scaled, cluster_labels),
            'calinski_harabasz_score': calinski_harabasz_score(X_scaled, cluster_labels)
        }
        
    elif method == 'dbscan':
        # DBSCAN clustering
        dbscan = DBSCAN(eps=0.5, min_samples=5)
        cluster_labels = dbscan.fit_predict(X_scaled)
        
        n_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)
        
        if n_clusters > 1:
            results = {
                'method': 'DBSCAN',
                'optimal_clusters': n_clusters,
                'cluster_labels': cluster_labels.tolist(),
                'silhouette_score': silhouette_score(X_scaled, cluster_labels) if n_clusters > 1 else -1,
                'noise_points': np.sum(cluster_labels == -1)
            }
        else:
            results = {'error': 'DBSCAN could not find meaningful clusters'}
    
    # Add cluster statistics in serializable format
    if 'cluster_labels' in results:
        rfm_df_clustered = rfm_df.copy()
        rfm_df_clustered['cluster'] = results['cluster_labels']
        
        cluster_stats_dict = {}
        for cluster in rfm_df_clustered['cluster'].unique():
            cluster_data = rfm_df_clustered[rfm_df_clustered['cluster'] == cluster]
            cluster_stats_dict[f'cluster_{cluster}'] = {
                'recency_mean': float(cluster_data['recency'].mean()),
                'recency_std': float(cluster_data['recency'].std()),
                'frequency_mean': float(cluster_data['frequency'].mean()),
                'frequency_std': float(cluster_data['frequency'].std()),
                'monetary_mean': float(cluster_data['monetary'].mean()),
                'monetary_std': float(cluster_data['monetary'].std()),
                'customer_count': int(len(cluster_data))
            }
        results['cluster_statistics'] = cluster_stats_dict
    
    return results

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Retail Analytics & Customer Segmentation Platform API"}

@api_router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and validate retail sales dataset"""
    try:
        # Read CSV file
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['customer_id', 'order_id', 'order_date', 'product_id', 'quantity', 'unit_price', 'total_amount']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_columns}")
        
        # Data quality assessment
        total_records = len(df)
        total_customers = df['customer_id'].nunique()
        date_range = {
            'start_date': df['order_date'].min(),
            'end_date': df['order_date'].max()
        }
        
        # Calculate data quality score
        completeness = df.isnull().sum().sum() / (len(df) * len(df.columns))
        data_quality_score = round((1 - completeness) * 100, 2)
        
        # Store dataset info in MongoDB
        dataset_info = DatasetInfo(
            filename=file.filename,
            total_records=total_records,
            total_customers=total_customers,
            date_range=date_range,
            columns=df.columns.tolist(),
            data_quality_score=data_quality_score
        )
        
        await db.datasets.insert_one(dataset_info.dict())
        
        # Store the actual data (first 10000 records for performance)
        df_sample = df.head(10000) if len(df) > 10000 else df
        data_records = df_sample.to_dict('records')
        
        await db.sales_data.delete_many({'dataset_id': dataset_info.id})  # Clear existing data
        for record in data_records:
            record['dataset_id'] = dataset_info.id
        await db.sales_data.insert_many(data_records)
        
        return {
            "dataset_id": dataset_info.id,
            "message": "Dataset uploaded successfully",
            "info": dataset_info.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing dataset: {str(e)}")

@api_router.post("/analyze/rfm/{dataset_id}")
async def perform_rfm_analysis(dataset_id: str):
    """Perform comprehensive RFM analysis with statistical validation"""
    try:
        # Retrieve dataset from MongoDB
        sales_data = await db.sales_data.find({'dataset_id': dataset_id}).to_list(10000)
        
        if not sales_data:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Convert to DataFrame
        df = pd.DataFrame(sales_data)
        
        # Calculate RFM metrics
        rfm_df = calculate_rfm_metrics(df)
        
        # Perform RFM segmentation
        rfm_results = perform_rfm_segmentation(rfm_df)
        
        # Create RFM analysis object with proper dictionary conversion
        rfm_analysis_data = {
            "dataset_id": dataset_id,
            "rfm_segments": rfm_results['segment_distribution'],
            "statistical_summary": {"summary": "RFM statistical analysis completed"},
            "segment_characteristics": rfm_results['statistical_validation']
        }
        
        # Store results in MongoDB
        await db.rfm_analyses.insert_one(rfm_analysis_data)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "rfm_results": rfm_results,
            "summary": {
                "total_customers": len(rfm_df),
                "segments_identified": len(rfm_results['segment_distribution']),
                "statistical_significance": rfm_results['statistical_validation']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error in RFM analysis: {str(e)}")

@api_router.post("/analyze/clustering/{dataset_id}")
async def perform_clustering_analysis(dataset_id: str, method: str = "kmeans"):
    """Perform advanced clustering analysis with multiple algorithms"""
    try:
        # Retrieve dataset from MongoDB
        sales_data = await db.sales_data.find({'dataset_id': dataset_id}).to_list(10000)
        
        if not sales_data:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Convert to DataFrame and calculate RFM
        df = pd.DataFrame(sales_data)
        rfm_df = calculate_rfm_metrics(df)
        
        # Perform clustering analysis
        clustering_results = perform_advanced_clustering(rfm_df, method)
        
        # Store results in MongoDB with simplified data
        segmentation_data = {
            "dataset_id": dataset_id,
            "method": clustering_results.get('method', method),
            "parameters": {'method': method},
            "clusters": clustering_results.get('optimal_clusters', 0),
            "silhouette_score": clustering_results.get('silhouette_score', 0.0),
            "davies_bouldin_score": clustering_results.get('davies_bouldin_score', 0.0),
            "calinski_harabasz_score": clustering_results.get('calinski_harabasz_score', 0.0),
            "segment_summary": {"analysis_completed": True}
        }
        
        await db.segmentation_results.insert_one(segmentation_data)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "clustering_results": clustering_results,
            "model_evaluation": {
                "silhouette_score": clustering_results.get('silhouette_score'),
                "davies_bouldin_score": clustering_results.get('davies_bouldin_score'),
                "calinski_harabasz_score": clustering_results.get('calinski_harabasz_score')
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error in clustering analysis: {str(e)}")

@api_router.get("/datasets")
async def get_datasets():
    """Get all uploaded datasets"""
    datasets = await db.datasets.find().to_list(100)
    return {"datasets": datasets}

@api_router.get("/analyses/{dataset_id}")
async def get_analyses(dataset_id: str):
    """Get all analyses for a specific dataset"""
    rfm_analyses = await db.rfm_analyses.find({'dataset_id': dataset_id}).to_list(100)
    clustering_analyses = await db.segmentation_results.find({'dataset_id': dataset_id}).to_list(100)
    
    return {
        "dataset_id": dataset_id,
        "rfm_analyses": rfm_analyses,
        "clustering_analyses": clustering_analyses
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()