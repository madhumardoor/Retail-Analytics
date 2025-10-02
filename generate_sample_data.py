import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import uuid

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_retail_sales_dataset(n_customers=2500, n_transactions=12000):
    """
    Generate a comprehensive retail sales dataset with realistic patterns
    for customer segmentation and RFM analysis.
    
    This dataset includes:
    - Seasonal trends
    - Customer behavior patterns (loyal, churned, new)
    - Product categories with different price ranges
    - Geographic distribution
    """
    
    # Define product categories and their characteristics
    products = {
        'Electronics': {'price_range': (50, 2000), 'seasonal_factor': 1.3},
        'Clothing': {'price_range': (15, 300), 'seasonal_factor': 1.5},
        'Home & Garden': {'price_range': (10, 800), 'seasonal_factor': 0.8},
        'Sports & Outdoors': {'price_range': (20, 500), 'seasonal_factor': 1.2},
        'Books': {'price_range': (5, 50), 'seasonal_factor': 0.9},
        'Beauty & Health': {'price_range': (8, 200), 'seasonal_factor': 1.1},
        'Toys & Games': {'price_range': (10, 150), 'seasonal_factor': 2.0},
        'Automotive': {'price_range': (25, 1500), 'seasonal_factor': 0.7}
    }
    
    # Generate customer profiles with different segments
    customer_segments = {
        'Champions': 0.15,      # 15% - High value, frequent, recent
        'Loyal_Customers': 0.20, # 20% - High frequency, moderate value
        'Potential_Loyalists': 0.15, # 15% - Recent, good frequency
        'New_Customers': 0.10,   # 10% - Recent but low frequency
        'Promising': 0.12,       # 12% - Recent, moderate value
        'Need_Attention': 0.08,  # 8% - Above average frequency but declining
        'About_to_Sleep': 0.07,  # 7% - Low recency and frequency
        'At_Risk': 0.06,         # 6% - High value but declining activity
        'Cannot_Lose_Them': 0.04, # 4% - High value, low activity
        'Lost': 0.03             # 3% - Lowest recency, frequency, and value
    }
    
    customers = []
    customer_id_counter = 1
    
    for segment, proportion in customer_segments.items():
        segment_size = int(n_customers * proportion)
        
        for _ in range(segment_size):
            customer_id = f"CUST_{customer_id_counter:06d}"
            
            # Define segment characteristics
            if segment == 'Champions':
                avg_transactions = random.randint(15, 30)
                avg_order_value = random.uniform(200, 800)
                recency_days = random.randint(1, 30)
            elif segment == 'Loyal_Customers':
                avg_transactions = random.randint(10, 20)
                avg_order_value = random.uniform(150, 500)
                recency_days = random.randint(15, 60)
            elif segment == 'Potential_Loyalists':
                avg_transactions = random.randint(5, 12)
                avg_order_value = random.uniform(100, 400)
                recency_days = random.randint(1, 45)
            elif segment == 'New_Customers':
                avg_transactions = random.randint(1, 3)
                avg_order_value = random.uniform(80, 300)
                recency_days = random.randint(1, 30)
            elif segment == 'Promising':
                avg_transactions = random.randint(3, 8)
                avg_order_value = random.uniform(120, 350)
                recency_days = random.randint(1, 40)
            elif segment == 'Need_Attention':
                avg_transactions = random.randint(6, 15)
                avg_order_value = random.uniform(100, 300)
                recency_days = random.randint(45, 90)
            elif segment == 'About_to_Sleep':
                avg_transactions = random.randint(2, 6)
                avg_order_value = random.uniform(80, 250)
                recency_days = random.randint(90, 180)
            elif segment == 'At_Risk':
                avg_transactions = random.randint(8, 18)
                avg_order_value = random.uniform(300, 700)
                recency_days = random.randint(60, 150)
            elif segment == 'Cannot_Lose_Them':
                avg_transactions = random.randint(10, 25)
                avg_order_value = random.uniform(400, 1000)
                recency_days = random.randint(90, 200)
            else:  # Lost
                avg_transactions = random.randint(1, 5)
                avg_order_value = random.uniform(50, 200)
                recency_days = random.randint(180, 365)
            
            customers.append({
                'customer_id': customer_id,
                'segment': segment,
                'avg_transactions': avg_transactions,
                'avg_order_value': avg_order_value,
                'recency_days': recency_days
            })
            
            customer_id_counter += 1
    
    # Generate transactions
    transactions = []
    product_list = list(products.keys())
    
    # Define date range (last 2 years)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)
    
    transaction_id_counter = 1
    
    for customer in customers:
        customer_id = customer['customer_id']
        n_orders = max(1, int(np.random.poisson(customer['avg_transactions'])))
        
        # Generate order dates based on recency
        last_order_date = end_date - timedelta(days=customer['recency_days'])
        order_dates = []
        
        for i in range(n_orders):
            if i == 0:  # Most recent order
                order_date = last_order_date
            else:
                # Previous orders distributed over the period
                days_back = random.randint(customer['recency_days'], 
                                         min(730, customer['recency_days'] + 300))
                order_date = end_date - timedelta(days=days_back)
            
            order_dates.append(order_date)
        
        order_dates.sort()  # Sort chronologically
        
        for order_date in order_dates:
            order_id = f"ORD_{transaction_id_counter:08d}"
            
            # Determine number of products in this order (1-5 items)
            n_products = random.choices([1, 2, 3, 4, 5], weights=[0.4, 0.3, 0.15, 0.1, 0.05])[0]
            
            order_total = 0
            
            for _ in range(n_products):
                # Select product category
                category = random.choice(product_list)
                product_info = products[category]
                
                # Generate product details
                product_id = f"{category[:3].upper()}_{random.randint(1000, 9999)}"
                quantity = random.choices([1, 2, 3, 4, 5], weights=[0.6, 0.2, 0.1, 0.06, 0.04])[0]
                
                # Base price with some variation
                base_price = random.uniform(product_info['price_range'][0], 
                                          product_info['price_range'][1])
                
                # Apply seasonal factor (higher during holiday seasons)
                month = order_date.month
                seasonal_multiplier = 1.0
                if month in [11, 12]:  # Holiday season
                    seasonal_multiplier = product_info['seasonal_factor']
                elif month in [6, 7, 8]:  # Summer season
                    seasonal_multiplier = 1.1
                
                unit_price = round(base_price * seasonal_multiplier, 2)
                total_amount = round(unit_price * quantity, 2)
                order_total += total_amount
                
                transactions.append({
                    'customer_id': customer_id,
                    'order_id': order_id,
                    'order_date': order_date.strftime('%Y-%m-%d'),
                    'product_id': product_id,
                    'product_category': category,
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'total_amount': total_amount
                })
            
            transaction_id_counter += 1
    
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    
    # Add some additional realistic features
    df['day_of_week'] = pd.to_datetime(df['order_date']).dt.day_name()
    df['month'] = pd.to_datetime(df['order_date']).dt.month
    df['year'] = pd.to_datetime(df['order_date']).dt.year
    
    # Add customer demographics (simplified)
    df['customer_age_group'] = df['customer_id'].apply(
        lambda x: random.choice(['18-25', '26-35', '36-45', '46-55', '56-65', '65+'])
    )
    
    df['customer_gender'] = df['customer_id'].apply(
        lambda x: random.choice(['Male', 'Female'])
    )
    
    # Shuffle the dataframe to make it more realistic
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df

def generate_data_dictionary():
    """Generate a comprehensive data dictionary"""
    return {
        "columns": {
            "customer_id": {
                "description": "Unique identifier for each customer",
                "data_type": "String",
                "example": "CUST_000001"
            },
            "order_id": {
                "description": "Unique identifier for each order/transaction",
                "data_type": "String", 
                "example": "ORD_00000001"
            },
            "order_date": {
                "description": "Date when the order was placed",
                "data_type": "Date (YYYY-MM-DD)",
                "example": "2024-01-15"
            },
            "product_id": {
                "description": "Unique identifier for each product",
                "data_type": "String",
                "example": "ELE_1234"
            },
            "product_category": {
                "description": "Category of the product",
                "data_type": "String",
                "values": ["Electronics", "Clothing", "Home & Garden", "Sports & Outdoors", 
                          "Books", "Beauty & Health", "Toys & Games", "Automotive"]
            },
            "quantity": {
                "description": "Number of units purchased",
                "data_type": "Integer",
                "range": "1-5"
            },
            "unit_price": {
                "description": "Price per unit of the product",
                "data_type": "Float",
                "currency": "USD"
            },
            "total_amount": {
                "description": "Total amount for this line item (quantity * unit_price)",
                "data_type": "Float",
                "currency": "USD"
            },
            "day_of_week": {
                "description": "Day of the week when order was placed",
                "data_type": "String",
                "values": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            },
            "month": {
                "description": "Month when order was placed",
                "data_type": "Integer",
                "range": "1-12"
            },
            "year": {
                "description": "Year when order was placed",
                "data_type": "Integer"
            },
            "customer_age_group": {
                "description": "Age group of the customer",
                "data_type": "String",
                "values": ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"]
            },
            "customer_gender": {
                "description": "Gender of the customer",
                "data_type": "String",
                "values": ["Male", "Female"]
            }
        },
        "analysis_notes": {
            "rfm_analysis": "Use customer_id, order_date, and total_amount for RFM calculation",
            "segmentation": "Customer segments are embedded based on purchasing patterns",
            "time_series": "Data spans 2 years with seasonal variations",
            "outliers": "Some high-value customers and transactions are included realistically"
        }
    }

if __name__ == "__main__":
    print("Generating comprehensive retail sales dataset...")
    
    # Generate the dataset
    df = generate_retail_sales_dataset(n_customers=2500, n_transactions=12000)
    
    # Save to CSV
    df.to_csv('/app/sample_retail_data.csv', index=False)
    
    # Generate and save data dictionary
    data_dict = generate_data_dictionary()
    
    with open('/app/data_dictionary.json', 'w') as f:
        import json
        json.dump(data_dict, f, indent=2)
    
    print(f"Dataset generated successfully!")
    print(f"Total transactions: {len(df):,}")
    print(f"Unique customers: {df['customer_id'].nunique():,}")
    print(f"Date range: {df['order_date'].min()} to {df['order_date'].max()}")
    print(f"Product categories: {df['product_category'].nunique()}")
    print(f"Total revenue: ${df['total_amount'].sum():,.2f}")
    
    # Display sample statistics
    print("\n=== SAMPLE STATISTICS ===")
    print(f"Average order value: ${df.groupby('order_id')['total_amount'].sum().mean():.2f}")
    print(f"Customers by category:")
    category_stats = df.groupby('product_category')['total_amount'].agg(['count', 'sum', 'mean']).round(2)
    print(category_stats)
    
    print("\nDataset saved as 'sample_retail_data.csv'")
    print("Data dictionary saved as 'data_dictionary.json'")