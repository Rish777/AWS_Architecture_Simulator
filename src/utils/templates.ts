export const ARCHITECTURE_TEMPLATES = [
  {
    key: 'enterprise_stack',
    title: 'Full Enterprise Stack',
    description: 'A production-grade, highly available enterprise deployment with multi-layer security and optimized CDN delivery.',
    services: [
      { type: 'route53', role: 'Global DNS & health checks' },
      { type: 'cloudfront', role: 'Edge caching & SSL termination' },
      { type: 'alb', role: 'Traffic distribution & failover' },
      { type: 'ec2', role: 'Scalable application compute' },
      { type: 'rds', role: 'Managed relational storage' },
      { type: 's3', role: 'Durable object storage' },
      { type: 'iam', role: 'Identity & Access Management' }
    ],
    nodes: [
      { id: 'dns', type: 'route53', pos: { x: 0, y: 150 } },
      { id: 'cdn', type: 'cloudfront', pos: { x: 200, y: 150 } },
      { id: 'lb', type: 'alb', pos: { x: 400, y: 150 } },
      { id: 'app', type: 'ec2', pos: { x: 600, y: 150 } },
      { id: 'db', type: 'rds', pos: { x: 800, y: 50 } },
      { id: 'store', type: 's3', pos: { x: 800, y: 250 } },
      { id: 'sec', type: 'iam', pos: { x: 400, y: 0 } }
    ],
    edges: [
      { from: 'dns', to: 'cdn' }, { from: 'cdn', to: 'lb' }, { from: 'lb', to: 'app' },
      { from: 'app', to: 'db' }, { from: 'app', to: 'store' }, { from: 'sec', to: 'app' }
    ]
  },
  {
    key: 'snowflake_migration',
    title: 'Cloud Data Migration',
    description: 'Enterprise-grade ETL pipeline for moving legacy databases to Snowflake with automated transformation and staging.',
    services: [
      { type: 'dms', role: 'Continuous data replication' },
      { type: 's3', role: 'Data staging & landing zone' },
      { type: 'glue', role: 'Serverless ETL & cataloging' },
      { type: 'snowflake_aws', role: 'High-performance data cloud' },
      { type: 'iam', role: 'Cross-account security roles' }
    ],
    nodes: [
      { id: 'src', type: 'oracle', pos: { x: 0, y: 150 } },
      { id: 'mig', type: 'dms', pos: { x: 200, y: 150 } },
      { id: 'stg', type: 's3', pos: { x: 400, y: 150 } },
      { id: 'trans', type: 'glue', pos: { x: 600, y: 150 } },
      { id: 'target', type: 'snowflake_aws', pos: { x: 850, y: 150 } },
      { id: 'sec', type: 'iam', pos: { x: 400, y: 0 } }
    ],
    edges: [
      { from: 'src', to: 'mig' }, { from: 'mig', to: 'stg' }, { from: 'stg', to: 'trans' },
      { from: 'trans', to: 'target' }, { from: 'sec', to: 'mig' }, { from: 'sec', to: 'stg' }
    ]
  },
  {
    key: 'ai_analytics',
    title: 'AI & Analytics Pipeline',
    description: 'Modern data stack for ML training and real-time analytics using serverless processing and cloud warehousing.',
    services: [
      { type: 'lambda', role: 'Event-driven data ingestion' },
      { type: 'glue', role: 'Data preparation & cleanup' },
      { type: 'athena', role: 'Ad-hoc SQL analysis' },
      { type: 'snowflake_aws', role: 'Centralized analytics engine' },
      { type: 'iam', role: 'Encrypted access control' }
    ],
    nodes: [
      { id: 'ingest', type: 'lambda', pos: { x: 0, y: 150 } },
      { id: 'process', type: 'glue', pos: { x: 250, y: 150 } },
      { id: 'query', type: 'athena', pos: { x: 500, y: 50 } },
      { id: 'warehouse', type: 'snowflake_aws', pos: { x: 750, y: 150 } },
      { id: 'sec', type: 'iam', pos: { x: 375, y: 0 } }
    ],
    edges: [
      { from: 'ingest', to: 'process' }, { from: 'process', to: 'query' },
      { from: 'process', to: 'warehouse' }, { from: 'sec', to: 'process' }
    ]
  },
  {
    key: 'web_app',
    title: 'Serverless Web App',
    description: 'Fully managed, zero-infrastructure application stack that scales automatically with user demand.',
    services: [
      { type: 'apigw', role: 'Managed REST API interface' },
      { type: 'lambda', role: 'Serverless business logic' },
      { type: 'dynamodb', role: 'High-scale NoSQL storage' },
      { type: 'iam', role: 'Fine-grained service execution' }
    ],
    nodes: [
      { id: 'gw', type: 'apigw', pos: { x: 0, y: 150 } },
      { id: 'logic', type: 'lambda', pos: { x: 250, y: 150 } },
      { id: 'data', type: 'dynamodb', pos: { x: 500, y: 150 } },
      { id: 'sec', type: 'iam', pos: { x: 250, y: 0 } }
    ],
    edges: [
      { from: 'gw', to: 'logic' }, { from: 'logic', to: 'data' }, { from: 'sec', to: 'logic' }
    ]
  }
];

export const getExplanation = (key: string, source?: string) => {
  const template = ARCHITECTURE_TEMPLATES.find(t => t.key === key);
  if (!template) return { title: 'Custom Architecture', description: 'User-defined architecture pattern.', services: [] };

  let title = template.title;
  if (key === 'snowflake_migration') title = `Legacy ${source || 'Database'} to Snowflake Migration`;

  return { 
    title, 
    description: template.description,
    services: template.services
  };
};
