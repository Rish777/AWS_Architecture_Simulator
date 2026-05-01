import type { ServiceType } from '../services';

export interface ArchitectureExplanation {
  title: string;
  summary: string;
  flow: string;
  services: { type: ServiceType; role: string }[];
  proTip: string;
}

// Role descriptions are context-aware — they explain WHY in this specific architecture
const EXPLANATIONS: Record<string, ArchitectureExplanation> = {
  ecommerce: {
    title: '🛒 E-Commerce Architecture',
    summary:
      'A production-grade, highly available e-commerce stack designed to handle traffic spikes (Black Friday, sales events) without downtime. Separates concerns across CDN, compute, cache, and async layers.',
    flow: 'User → Route 53 → CloudFront → Load Balancer → EC2 → RDS / ElastiCache / S3',
    services: [
      { type: 'route53', role: 'DNS routing — translates your domain into the CloudFront IP. Also performs health checks so traffic is never sent to a downed region.' },
      { type: 'cloudfront', role: 'CDN layer — caches product images, CSS, and JS at 400+ edge locations globally. Reduces load on your servers by ~70% for static assets.' },
      { type: 'alb', role: 'Traffic distributor — spreads orders across multiple EC2 instances. If one crashes, traffic is instantly rerouted to healthy servers.' },
      { type: 'ec2', role: 'Application server — runs your storefront, checkout logic, and payment processing. Scales horizontally behind the load balancer.' },
      { type: 'rds', role: 'Relational database — stores customers, orders, products, and transactions. Multi-AZ enabled so a database failure does not cause downtime.' },
      { type: 'elasticache', role: 'Redis cache — stores user sessions and frequently-viewed product data in memory. Makes product pages 10× faster without hitting the database.' },
      { type: 's3', role: 'Object storage — stores product images, invoices, and static assets. Extremely cheap at $0.023/GB, with 99.999999999% durability.' },
      { type: 'sqs', role: 'Order queue — decouples checkout from order processing. When you place an order, SQS queues it so a backend worker can process payment, inventory, and email asynchronously.' },
      { type: 'iam', role: 'Security layer — gives each service only the minimum permissions needed. Prevents a compromised EC2 from accessing your database credentials.' },
    ],
    proTip: '💡 Add ElastiCache for session storage so users stay logged in across multiple EC2 instances. Without it, users get logged out when traffic switches to a different server.',
  },

  serverless: {
    title: '⚡ Serverless Architecture',
    summary:
      'A zero-infrastructure serverless stack where AWS manages all servers. You pay only when code runs (per millisecond). Ideal for APIs with variable traffic — scales from 0 to millions of requests automatically.',
    flow: 'User → Route 53 → CloudFront → API Gateway → Lambda → DynamoDB',
    services: [
      { type: 'route53', role: 'DNS — maps your custom domain to the CloudFront distribution.' },
      { type: 'cloudfront', role: 'CDN + cache — caches API responses and serves static frontend files. Reduces Lambda cold starts for frequently-accessed endpoints.' },
      { type: 's3', role: 'Frontend hosting — serves your React/Vue/HTML frontend as a static website. Zero server cost for the UI layer.' },
      { type: 'apigw', role: 'API front door — receives HTTP requests, authenticates them (via API key or JWT), and routes to the correct Lambda function. Handles rate limiting automatically.' },
      { type: 'lambda', role: 'Compute — executes your business logic. Auto-scales from 0 to 10,000 concurrent executions in seconds. You only pay while code is running (~$0.20 per million requests).' },
      { type: 'dynamodb', role: 'NoSQL database — serverless like Lambda. Handles millions of reads/writes per second with no capacity planning. Perfect for user profiles, sessions, and event logs.' },
      { type: 'iam', role: 'Least-privilege permissions — Lambda only has access to the specific DynamoDB tables it needs, nothing else.' },
    ],
    proTip: '💡 Use DynamoDB Streams + Lambda to build real-time event pipelines without any additional infrastructure. When a record changes in DynamoDB, Lambda fires automatically.',
  },

  datapipeline: {
    title: '🔄 Data Migration / ETL Pipeline',
    summary:
      'An enterprise-grade migration pipeline to move data from legacy on-premises databases (Teradata, Oracle, SQL Server) to a modern cloud data warehouse (Snowflake) with zero downtime.',
    flow: 'Source DB → DMS (replicate) → S3 (stage) → Glue (transform) → Snowflake (warehouse)',
    services: [
      { type: 'rds', role: 'Source database — represents your on-premises or legacy database. DMS connects here to replicate data in real time using CDC (Change Data Capture).' },
      { type: 'dms', role: 'Database Migration Service — streams data from source to target with minimal downtime. Handles schema conversion and supports 20+ database engines. Charges per GB transferred.' },
      { type: 's3', role: 'Staging area — DMS dumps migrated data here as CSV/Parquet files before transformation. Acts as a buffer and audit trail for all migrated records.' },
      { type: 'glue', role: 'ETL engine — runs serverless Spark jobs to clean, reshape, and enrich data. Handles type casting, deduplication, and schema normalization before loading to Snowflake.' },
      { type: 'snowflake_core', role: 'Target data warehouse — receives clean, transformed data ready for analytics. Separates storage from compute so your BI team can query data without impacting the ETL pipeline.' },
    ],
    proTip: '💡 For migrations over 50TB, use AWS Snowball (physical device) to ship data to S3 instead of DMS — uploading 50TB over the internet at 1Gbps takes 4+ days. Snowball takes 1 week but costs ~$300 flat.',
  },

  streaming: {
    title: '🎬 Video Streaming Platform',
    summary:
      'A scalable media delivery architecture for video-on-demand or live streaming. Uses CloudFront as the CDN backbone and S3 for cheap, durable video storage.',
    flow: 'User → Route 53 → CloudFront (CDN) → S3 (video) / EC2 (encoding) → DynamoDB (metadata)',
    services: [
      { type: 'route53', role: 'DNS routing with latency-based routing — sends users to the closest region automatically.' },
      { type: 'cloudfront', role: 'Video CDN — delivers video segments from 400+ edge locations. Reduces buffering and enables adaptive bitrate streaming. This is how Netflix/YouTube deliver video efficiently.' },
      { type: 's3', role: 'Video storage — stores raw uploads and encoded video segments. Extremely cheap for large files. Use S3 Intelligent-Tiering to automatically move old videos to cheaper storage.' },
      { type: 'alb', role: 'Load balancer — distributes video transcoding and upload requests across EC2 workers.' },
      { type: 'ec2', role: 'Transcoding workers — convert uploaded videos into multiple resolutions (1080p, 720p, 480p) for adaptive streaming.' },
      { type: 'sqs', role: 'Transcoding queue — when a video is uploaded, SQS queues the transcoding job. Workers pull from the queue so jobs are never lost even if a worker crashes mid-encoding.' },
      { type: 'dynamodb', role: 'Video metadata store — stores titles, thumbnails, view counts, user watch history, and recommendations data. Handles millions of read operations per second.' },
    ],
    proTip: '💡 Use CloudFront signed URLs to protect premium content. Only users with a valid subscription token can access video URLs — without this, anyone can scrape and download your content for free.',
  },

  ml: {
    title: '🤖 Machine Learning Pipeline',
    summary:
      'An end-to-end ML pipeline from raw data ingestion to model serving via API. Uses serverless components where possible to minimize idle costs.',
    flow: 'S3 (data) → Glue (prep) → EC2 (train) → Lambda (inference) → API Gateway (serve) → DynamoDB (results)',
    services: [
      { type: 's3', role: 'Data lake — stores raw training data (CSV, JSON, images). The starting point for all ML pipelines. Keep raw data here forever — storage is cheap and you may need to retrain.' },
      { type: 'glue', role: 'Feature engineering — cleans and transforms raw data into ML-ready feature vectors. Handles missing values, normalization, and train/test splitting at scale.' },
      { type: 'ec2', role: 'Training instance — runs your ML training job (GPU instance for deep learning). Only used during training, then shut down to avoid paying for idle compute.' },
      { type: 'lambda', role: 'Inference engine — loads the trained model and runs predictions. Serverless means you only pay when someone requests a prediction, not 24/7.' },
      { type: 'apigw', role: 'Model API — exposes your ML model as an HTTP endpoint. External apps call POST /predict and get predictions back in JSON.' },
      { type: 'dynamodb', role: 'Prediction store — logs every prediction with its input, output, confidence score, and timestamp. Essential for model monitoring and detecting drift.' },
      { type: 'iam', role: 'Access control — Lambda has permission to read the model from S3 and write to DynamoDB. Nothing else.' },
    ],
    proTip: '💡 Store your trained model artifact in S3 and load it into Lambda at cold start. For larger models, use AWS EFS (shared file system) mounted to Lambda so the model loads in <100ms.',
  },

  microservices: {
    title: '🐳 Microservices Architecture',
    summary:
      'A distributed system where each business capability runs as an independent service. Services communicate via SQS (async) or HTTP (sync). Scales each service independently.',
    flow: 'User → Route 53 → ALB → EC2 Services → RDS / ElastiCache / SQS',
    services: [
      { type: 'route53', role: 'DNS — routes traffic to the ALB. Also enables blue/green deployments by switching DNS weights between old and new versions.' },
      { type: 'alb', role: 'API router — uses path-based routing to direct /users to User Service, /orders to Order Service, and /payments to Payment Service — all on the same load balancer.' },
      { type: 'ec2', role: 'Service containers — each EC2 instance (or container) runs one microservice independently. Team A can deploy the Order Service without affecting the User Service.' },
      { type: 'rds', role: 'Shared relational database — used for services that need strong consistency (payments, inventory). Each microservice should ideally have its own database schema.' },
      { type: 'elasticache', role: 'Distributed cache — stores shared state (user sessions, rate limit counters) that multiple services need to read. Prevents every service from querying the database for the same data.' },
      { type: 'sqs', role: 'Event bus — services publish events (OrderPlaced, PaymentFailed) to SQS queues. Other services subscribe and react asynchronously. This decouples services so they can evolve independently.' },
      { type: 'vpc', role: 'Network isolation — each service tier (web, app, database) lives in a separate subnet. Database services are in private subnets with no internet access.' },
    ],
    proTip: '💡 Use ALB path-based routing instead of running separate load balancers per service — it cuts your load balancer costs from $22×N to just $22 flat for all services.',
  },

  webapp: {
    title: '🌐 Full-Stack Web Application',
    summary:
      'A classic, battle-tested 3-tier architecture (frontend → backend → database) deployed on AWS. Reliable, well-understood, and easy to operate. The right choice for most applications.',
    flow: 'User → Route 53 → CloudFront → ALB → EC2 → RDS / S3',
    services: [
      { type: 'route53', role: 'DNS — maps your domain to CloudFront. Failover routing means traffic is automatically redirected if your primary region goes down.' },
      { type: 'cloudfront', role: 'CDN — caches static assets (images, CSS, JS) globally so users get fast load times regardless of where your EC2 is located.' },
      { type: 'alb', role: 'Load balancer — enables horizontal scaling. As traffic grows, you add more EC2 instances behind the ALB — no downtime, no DNS changes.' },
      { type: 'ec2', role: 'Web/App server — runs your application code (Node.js, Python, Ruby, Java, etc.). The main compute layer of the stack.' },
      { type: 'rds', role: 'Database — stores all application data. Automated backups, Multi-AZ failover, and read replicas are all managed by AWS.' },
      { type: 's3', role: 'File storage — stores user uploads, avatars, exports, and backups. Offloads file storage from EC2 disk so instances remain stateless and replaceable.' },
      { type: 'iam', role: 'Security roles — EC2 instances use an IAM role to access S3 and RDS without hardcoded credentials. Never store AWS keys inside application code.' },
    ],
    proTip: '💡 Make your EC2 instances stateless — store all files in S3 and all sessions in ElastiCache (not on local disk). Stateless instances can be replaced at any time, enabling auto-scaling.',
  },

  fallback: {
    title: '☁️ Standard Cloud Architecture',
    summary:
      'A solid, general-purpose cloud deployment with a CDN, compute, and database layer. This covers most use cases and can be extended with additional services as your needs grow.',
    flow: 'User → CloudFront → Load Balancer → EC2 → RDS / S3',
    services: [
      { type: 'cloudfront', role: 'CDN — caches and serves content from edge locations worldwide for fast load times.' },
      { type: 'alb', role: 'Load balancer — distributes incoming traffic and enables horizontal scaling.' },
      { type: 'ec2', role: 'Compute — your application runs here. Scalable, configurable virtual servers.' },
      { type: 'rds', role: 'Database — managed relational database for persistent data storage.' },
      { type: 's3', role: 'Storage — cheap, durable object storage for files, backups, and static assets.' },
    ],
    proTip: '💡 Start with this architecture. Add caching (ElastiCache), queuing (SQS), and DNS (Route 53) as your traffic grows.',
  },
};

export function getExplanation(templateKey: string): ArchitectureExplanation {
  return EXPLANATIONS[templateKey] ?? EXPLANATIONS.fallback;
}
