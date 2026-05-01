import {
  Server, Database, HardDrive,
  Globe, Zap, Shield, Key, Network,
  Layers, MessageSquare, Map, SplitSquareHorizontal,
  ArrowRightLeft, Box, Snowflake, Search, RefreshCw,
  BarChart2, Activity, Package, Bell
} from 'lucide-react';
import React from 'react';

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'snowflake' | 'on-prem';

export type ServiceType =
  // Sources
  'oracle' | 'sqlserver_onprem' | 'db2' | 'teradata' |
  // AWS
  'ec2' | 'rds' | 's3' | 'apigw' | 'lambda' | 'iam' | 'cloudfront' | 'vpc' |
  'dynamodb' | 'elasticache' | 'sqs' | 'route53' | 'alb' | 'dms' | 'glue' |
  'snowball' | 'snowflake_aws' | 'ecs' | 'eks' | 'fargate' | 'athena' | 'redshift' | 'sns' |
  // Azure
  'azure_vm' | 'azure_sql' | 'blob_storage' | 'azure_functions' | 'adf' | 'synapse' | 'snowflake_azure' | 'azure_ad' |
  'aks' | 'azure_lb' | 'app_service' | 'vnet' | 'key_vault' | 'service_bus' | 'cosmos_db' |
  // GCP
  'compute_engine' | 'cloud_sql' | 'gcs' | 'cloud_functions' | 'dataflow' | 'bigquery' | 'snowflake_gcp' | 'gcp_iam' |
  'gke' | 'pubsub' | 'spanner' | 'firestore' | 'cloud_run' | 'gcp_vpc' | 'gcp_lb' |
  // Specialized
  'snowflake_core';

export interface CloudService {
  id: ServiceType;
  name: string;
  category: string;
  provider: CloudProvider;
  monthlyCost: number;
  icon: React.ElementType;
  description: string;
  isSnowflake?: boolean;
}

export const CLOUD_SERVICES: Record<ServiceType, CloudService> = {
  // ── ON-PREM SOURCES ──────────────────────────────────────────
  oracle: { id: 'oracle', name: 'Oracle DB', category: 'Source', provider: 'on-prem', monthlyCost: 500, icon: Database, description: '🏛️ Legacy Oracle Database.' },
  sqlserver_onprem: { id: 'sqlserver_onprem', name: 'SQL Server', category: 'Source', provider: 'on-prem', monthlyCost: 400, icon: Database, description: '🏢 On-premises SQL Server.' },
  db2: { id: 'db2', name: 'IBM DB2', category: 'Source', provider: 'on-prem', monthlyCost: 600, icon: Database, description: '📦 Enterprise IBM DB2.' },
  teradata: { id: 'teradata', name: 'Teradata', category: 'Source', provider: 'on-prem', monthlyCost: 1200, icon: Layers, description: '📊 Legacy Data Warehouse.' },

  // ── AWS SERVICES ─────────────────────────────────────────────
  ec2: { id: 'ec2', name: 'EC2 Instance', category: 'Compute', provider: 'aws', monthlyCost: 35.00, icon: Server, description: '🖥️ Virtual server in the cloud.' },
  lambda: { id: 'lambda', name: 'AWS Lambda', category: 'Compute', provider: 'aws', monthlyCost: 5.00, icon: Zap, description: '⚡ Serverless compute.' },
  rds: { id: 'rds', name: 'RDS Database', category: 'Database', provider: 'aws', monthlyCost: 45.00, icon: Database, description: '🗄️ Managed SQL database.' },
  s3: { id: 's3', name: 'S3 Bucket', category: 'Storage', provider: 'aws', monthlyCost: 2.50, icon: HardDrive, description: '📦 Unlimited object storage.' },
  apigw: { id: 'apigw', name: 'API Gateway', category: 'Networking', provider: 'aws', monthlyCost: 3.50, icon: Network, description: '🚪 Front door for APIs.' },
  iam: { id: 'iam', name: 'IAM', category: 'Security', provider: 'aws', monthlyCost: 0, icon: Key, description: '🔐 Identity & Access Management.' },
  cloudfront: { id: 'cloudfront', name: 'CloudFront', category: 'Networking', provider: 'aws', monthlyCost: 10.00, icon: Globe, description: '🌍 Global CDN.' },
  vpc: { id: 'vpc', name: 'VPC', category: 'Networking', provider: 'aws', monthlyCost: 0, icon: Shield, description: '🛡️ Isolated network.' },
  dynamodb: { id: 'dynamodb', name: 'DynamoDB', category: 'Database', provider: 'aws', monthlyCost: 2.50, icon: Database, description: '⚡ Serverless NoSQL.' },
  elasticache: { id: 'elasticache', name: 'ElastiCache', category: 'Database', provider: 'aws', monthlyCost: 16.00, icon: Layers, description: '🚀 In-memory cache.' },
  sqs: { id: 'sqs', name: 'Amazon SQS', category: 'Messaging', provider: 'aws', monthlyCost: 0.40, icon: MessageSquare, description: '📬 Message queue.' },
  route53: { id: 'route53', name: 'Route 53', category: 'Networking', provider: 'aws', monthlyCost: 0.50, icon: Map, description: '🌐 AWS DNS service.' },
  alb: { id: 'alb', name: 'Load Balancer', category: 'Networking', provider: 'aws', monthlyCost: 22.00, icon: SplitSquareHorizontal, description: '⚖️ Application Load Balancer.' },
  dms: { id: 'dms', name: 'AWS DMS', category: 'Migration', provider: 'aws', monthlyCost: 15.00, icon: ArrowRightLeft, description: '🔄 Database Migration Service.' },
  glue: { id: 'glue', name: 'AWS Glue', category: 'Analytics', provider: 'aws', monthlyCost: 20.00, icon: Layers, description: '🔧 Serverless ETL.' },
  athena: { id: 'athena', name: 'Athena', category: 'Analytics', provider: 'aws', monthlyCost: 5.00, icon: Search, description: '🔎 Query S3 data with SQL.' },
  redshift: { id: 'redshift', name: 'Redshift', category: 'Database', provider: 'aws', monthlyCost: 180.00, icon: Database, description: '📊 Cloud data warehouse.' },
  snowflake_aws: { id: 'snowflake_aws', name: 'Snowflake (AWS)', category: 'Database', provider: 'snowflake', monthlyCost: 150.00, icon: Snowflake, description: '❄️ Snowflake on AWS.', isSnowflake: true },
  snowball: { id: 'snowball', name: 'Snowball', category: 'Migration', provider: 'aws', monthlyCost: 200, icon: Box, description: '📦 Physical data transport.' },
  ecs: { id: 'ecs', name: 'ECS', category: 'Compute', provider: 'aws', monthlyCost: 0, icon: Box, description: '📦 Elastic Container Service.' },
  eks: { id: 'eks', name: 'EKS', category: 'Compute', provider: 'aws', monthlyCost: 72, icon: Package, description: '☸️ Managed Kubernetes.' },
  fargate: { id: 'fargate', name: 'Fargate', category: 'Compute', provider: 'aws', monthlyCost: 0, icon: Box, description: '🚀 Serverless containers.' },
  sns: { id: 'sns', name: 'SNS', category: 'Messaging', provider: 'aws', monthlyCost: 0, icon: Bell, description: '🔔 Push notifications.' },

  // ── AZURE SERVICES ───────────────────────────────────────────
  azure_vm: { id: 'azure_vm', name: 'Azure VM', category: 'Compute', provider: 'azure', monthlyCost: 40.00, icon: Server, description: '💻 Azure Virtual Machine.' },
  blob_storage: { id: 'blob_storage', name: 'Blob Storage', category: 'Storage', provider: 'azure', monthlyCost: 3.00, icon: HardDrive, description: '☁️ Azure Blob Storage.' },
  adf: { id: 'adf', name: 'Data Factory', category: 'Migration', provider: 'azure', monthlyCost: 25.00, icon: RefreshCw, description: '🏭 Azure Data Factory.' },
  snowflake_azure: { id: 'snowflake_azure', name: 'Snowflake (Azure)', category: 'Database', provider: 'snowflake', monthlyCost: 150.00, icon: Snowflake, description: '❄️ Snowflake on Azure.', isSnowflake: true },
  azure_ad: { id: 'azure_ad', name: 'Azure AD / RBAC', category: 'Security', provider: 'azure', monthlyCost: 0, icon: Shield, description: '🔐 Entra ID & Role-Based Access Control.' },
  azure_sql: { id: 'azure_sql', name: 'Azure SQL', category: 'Database', provider: 'azure', monthlyCost: 40.00, icon: Database, description: '🗄️ Managed SQL database.' },
  azure_functions: { id: 'azure_functions', name: 'Functions', category: 'Compute', provider: 'azure', monthlyCost: 5.00, icon: Zap, description: '⚡ Event-driven serverless compute.' },
  synapse: { id: 'synapse', name: 'Synapse Analytics', category: 'Analytics', provider: 'azure', monthlyCost: 120.00, icon: BarChart2, description: '📊 Limitless analytics service.' },
  aks: { id: 'aks', name: 'AKS', category: 'Compute', provider: 'azure', monthlyCost: 72.00, icon: Package, description: '☸️ Managed Kubernetes Service.' },
  azure_lb: { id: 'azure_lb', name: 'Load Balancer', category: 'Networking', provider: 'azure', monthlyCost: 18.00, icon: SplitSquareHorizontal, description: '⚖️ Azure Load Balancer.' },
  app_service: { id: 'app_service', name: 'App Service', category: 'Compute', provider: 'azure', monthlyCost: 25.00, icon: Globe, description: '🌐 Build and host web apps.' },
  vnet: { id: 'vnet', name: 'Virtual Network', category: 'Networking', provider: 'azure', monthlyCost: 0, icon: Shield, description: '🛡️ Isolated network in Azure.' },
  key_vault: { id: 'key_vault', name: 'Key Vault', category: 'Security', provider: 'azure', monthlyCost: 3.00, icon: Key, description: '🔑 Safeguard cryptographic keys.' },
  service_bus: { id: 'service_bus', name: 'Service Bus', category: 'Messaging', provider: 'azure', monthlyCost: 10.00, icon: MessageSquare, description: '📬 Reliable cloud messaging.' },
  cosmos_db: { id: 'cosmos_db', name: 'Cosmos DB', category: 'Database', provider: 'azure', monthlyCost: 24.00, icon: Database, description: '🌍 Globally distributed NoSQL.' },

  // ── GCP SERVICES ─────────────────────────────────────────────
  compute_engine: { id: 'compute_engine', name: 'Compute Engine', category: 'Compute', provider: 'gcp', monthlyCost: 32.00, icon: Server, description: '🚀 Google Compute Engine.' },
  gcs: { id: 'gcs', name: 'Cloud Storage', category: 'Storage', provider: 'gcp', monthlyCost: 2.50, icon: HardDrive, description: '📦 Google Cloud Storage.' },
  dataflow: { id: 'dataflow', name: 'Cloud Dataflow', category: 'Migration', provider: 'gcp', monthlyCost: 45.00, icon: Activity, description: '🌊 Cloud Dataflow.' },
  snowflake_gcp: { id: 'snowflake_gcp', name: 'Snowflake (GCP)', category: 'Database', provider: 'snowflake', monthlyCost: 150.00, icon: Snowflake, description: '❄️ Snowflake on GCP.', isSnowflake: true },
  gcp_iam: { id: 'gcp_iam', name: 'Cloud IAM', category: 'Security', provider: 'gcp', monthlyCost: 0, icon: Shield, description: '🔐 Google Cloud Identity & Access Management.' },
  cloud_sql: { id: 'cloud_sql', name: 'Cloud SQL', category: 'Database', provider: 'gcp', monthlyCost: 42.00, icon: Database, description: '🗄️ Fully managed relational database.' },
  cloud_functions: { id: 'cloud_functions', name: 'Cloud Functions', category: 'Compute', provider: 'gcp', monthlyCost: 5.00, icon: Zap, description: '⚡ Serverless functions.' },
  bigquery: { id: 'bigquery', name: 'BigQuery', category: 'Analytics', provider: 'gcp', monthlyCost: 100.00, icon: Search, description: '🔍 Serverless enterprise data warehouse.' },
  gke: { id: 'gke', name: 'GKE', category: 'Compute', provider: 'gcp', monthlyCost: 75.00, icon: Package, description: '☸️ Google Kubernetes Engine.' },
  pubsub: { id: 'pubsub', name: 'Pub/Sub', category: 'Messaging', provider: 'gcp', monthlyCost: 5.00, icon: MessageSquare, description: '📬 Messaging and ingestion.' },
  spanner: { id: 'spanner', name: 'Cloud Spanner', category: 'Database', provider: 'gcp', monthlyCost: 200.00, icon: Database, description: '🌍 Planet-scale relational database.' },
  firestore: { id: 'firestore', name: 'Firestore', category: 'Database', provider: 'gcp', monthlyCost: 5.00, icon: Database, description: '⚡ NoSQL document database.' },
  cloud_run: { id: 'cloud_run', name: 'Cloud Run', category: 'Compute', provider: 'gcp', monthlyCost: 10.00, icon: Box, description: '📦 Run containers serverlessly.' },
  gcp_vpc: { id: 'gcp_vpc', name: 'VPC Network', category: 'Networking', provider: 'gcp', monthlyCost: 0, icon: Shield, description: '🛡️ Global VPC network.' },
  gcp_lb: { id: 'gcp_lb', name: 'Load Balancing', category: 'Networking', provider: 'gcp', monthlyCost: 20.00, icon: SplitSquareHorizontal, description: '⚖️ High-performance load balancing.' },

  // ── SNOWFLAKE CORE ───────────────────────────────────────────
  snowflake_core: { id: 'snowflake_core', name: 'Snowflake Core', category: 'Warehouse', provider: 'snowflake', monthlyCost: 0, icon: Snowflake, description: '💎 Snowflake Data Cloud.', isSnowflake: true },
};

// ── COMPARISON ENGINE MAPPING ──────────────────────────────────
// This hidden mapping allows the comparison engine to identify equivalent 
// services across providers for the "Shadow Pricing" report section.

export const SERVICE_EQUIVALENTS: Partial<Record<ServiceType, string>> = {
  // Compute
  'ec2': 'compute_general', 'azure_vm': 'compute_general', 'compute_engine': 'compute_general',
  'lambda': 'serverless_compute', 'azure_functions': 'serverless_compute', 'cloud_functions': 'serverless_compute',
  'eks': 'kubernetes', 'aks': 'kubernetes', 'gke': 'kubernetes',
  'ecs': 'containers', 'app_service': 'containers', 'cloud_run': 'containers',
  
  // Storage & Database
  's3': 'object_storage', 'blob_storage': 'object_storage', 'gcs': 'object_storage',
  'rds': 'sql_db', 'azure_sql': 'sql_db', 'cloud_sql': 'sql_db',
  'dynamodb': 'nosql_db', 'cosmos_db': 'nosql_db', 'firestore': 'nosql_db',
  
  // Analytics & Warehouse
  'redshift': 'data_warehouse', 'synapse': 'data_warehouse', 'bigquery': 'data_warehouse', 'snowflake_core': 'data_warehouse',
  'glue': 'etl_service', 'adf': 'etl_service', 'dataflow': 'etl_service',
  
  // Networking
  'alb': 'load_balancer', 'azure_lb': 'load_balancer', 'gcp_lb': 'load_balancer',
  'vpc': 'private_network', 'vnet': 'private_network', 'gcp_vpc': 'private_network',
  'route53': 'dns_service', 'azure_ad': 'dns_service', 
};

// Returns a group of equivalent services for a given service ID
export const getEquivalents = (serviceId: ServiceType): CloudService[] => {
  const group = SERVICE_EQUIVALENTS[serviceId];
  if (!group) return [];
  
  return Object.values(CLOUD_SERVICES).filter(s => SERVICE_EQUIVALENTS[s.id] === group);
};


