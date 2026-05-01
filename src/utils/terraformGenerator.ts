import type { ServiceType } from '../services';

interface CanvasNode {
  id: string;
  data: { serviceType: ServiceType };
}

interface CanvasEdge {
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Resource block generators — one per ServiceType
// ---------------------------------------------------------------------------
const GENERATORS: Partial<Record<ServiceType, (index: number) => string>> = {
  ec2: (i) => `
resource "aws_instance" "app_server_${i}" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 (us-east-1)
  instance_type = "t3.medium"

  tags = {
    Name        = "AppServer-${i}"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}`,

  rds: (i) => `
resource "aws_db_instance" "database_${i}" {
  identifier        = "app-database-${i}"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  db_name           = "appdb"
  username          = "admin"
  password          = var.db_password

  skip_final_snapshot = false
  final_snapshot_identifier = "app-database-${i}-final"
  multi_az            = true
  storage_encrypted   = true

  tags = {
    Name      = "AppDatabase-${i}"
    ManagedBy = "Terraform"
  }
}`,

  s3: (i) => `
resource "aws_s3_bucket" "storage_${i}" {
  bucket = "my-app-storage-${i}-\${random_id.bucket_suffix.hex}"

  tags = {
    Name      = "AppStorage-${i}"
    ManagedBy = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "storage_${i}_versioning" {
  bucket = aws_s3_bucket.storage_${i}.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage_${i}_sse" {
  bucket = aws_s3_bucket.storage_${i}.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}`,

  lambda: (i) => `
resource "aws_lambda_function" "handler_${i}" {
  function_name = "app-handler-${i}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = "lambda_function_payload.zip"

  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }

  tags = {
    Name      = "AppHandler-${i}"
    ManagedBy = "Terraform"
  }
}`,

  apigw: (i) => `
resource "aws_api_gateway_rest_api" "api_${i}" {
  name        = "app-api-${i}"
  description = "Main application API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name      = "AppAPI-${i}"
    ManagedBy = "Terraform"
  }
}`,

  cloudfront: (i) => `
resource "aws_cloudfront_distribution" "cdn_${i}" {
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.storage_0.bucket_regional_domain_name
    origin_id   = "S3Origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3Origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name      = "AppCDN-${i}"
    ManagedBy = "Terraform"
  }
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for app CDN"
}`,

  iam: (_i) => `
resource "aws_iam_role" "app_role" {
  name = "app-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = { ManagedBy = "Terraform" }
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = { ManagedBy = "Terraform" }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}`,

  vpc: (_i) => `
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "main-vpc", ManagedBy = "Terraform" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "\${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "public-subnet-a", ManagedBy = "Terraform" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "\${var.aws_region}a"
  tags = { Name = "private-subnet-a", ManagedBy = "Terraform" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "main-igw", ManagedBy = "Terraform" }
}`,

  dynamodb: (i) => `
resource "aws_dynamodb_table" "table_${i}" {
  name         = "app-table-${i}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption  { enabled = true }

  tags = {
    Name      = "AppTable-${i}"
    ManagedBy = "Terraform"
  }
}`,

  elasticache: (i) => `
resource "aws_elasticache_cluster" "cache_${i}" {
  cluster_id           = "app-cache-${i}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  tags = {
    Name      = "AppCache-${i}"
    ManagedBy = "Terraform"
  }
}`,

  sqs: (i) => `
resource "aws_sqs_queue" "queue_${i}" {
  name                       = "app-queue-${i}"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 86400
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true

  tags = {
    Name      = "AppQueue-${i}"
    ManagedBy = "Terraform"
  }
}`,

  route53: (_i) => `
resource "aws_route53_zone" "primary" {
  name = var.domain_name
  tags = { ManagedBy = "Terraform" }
}`,

  alb: (i) => `
resource "aws_lb" "load_balancer_${i}" {
  name               = "app-alb-${i}"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public_a.id]

  tags = {
    Name      = "AppALB-${i}"
    ManagedBy = "Terraform"
  }
}

resource "aws_lb_target_group" "app_tg_${i}" {
  name     = "app-tg-${i}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http_${i}" {
  load_balancer_arn = aws_lb.load_balancer_${i}.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg_${i}.arn
  }
}`,

  dms: (i) => `
resource "aws_dms_replication_instance" "migration_${i}" {
  allocated_storage            = 50
  apply_immediately            = true
  auto_minor_version_upgrade   = true
  engine_version               = "3.5.1"
  multi_az                     = false
  preferred_maintenance_window = "sun:10:30-sun:14:30"
  publicly_accessible          = false
  replication_instance_class   = "dms.t3.medium"
  replication_instance_id      = "dms-migration-${i}"

  tags = {
    Name      = "DMSMigration-${i}"
    ManagedBy = "Terraform"
  }
}`,

  glue: (i) => `
resource "aws_glue_job" "etl_job_${i}" {
  name     = "app-etl-job-${i}"
  role_arn = aws_iam_role.app_role.arn

  command {
    script_location = "s3://\${aws_s3_bucket.storage_0.bucket}/scripts/etl.py"
    python_version  = "3"
  }

  default_arguments = {
    "--job-language"   = "python"
    "--TempDir"        = "s3://\${aws_s3_bucket.storage_0.bucket}/temp/"
    "--enable-metrics" = ""
  }

  max_retries       = 1
  number_of_workers = 2
  worker_type       = "G.1X"

  tags = { Name = "ETLJob-${i}", ManagedBy = "Terraform" }
}`,

  snowball: (_i) => `
# ─────────────────────────────────────────────────────────────────────────────
# AWS Snowball — Physical device. No Terraform resource available.
# Order via AWS Console: https://console.aws.amazon.com/importexport
# Estimated device cost: ~$300 flat fee + $0.03/GB data loaded.
# ─────────────────────────────────────────────────────────────────────────────`,

  snowflake_core: (_i: number) => `
# ─────────────────────────────────────────────────────────────────────────────
# Snowflake — Managed by the Snowflake Terraform Provider (not AWS).
# Add to your providers.tf:
#   terraform {
#     required_providers {
#       snowflake = { source = "Snowflake-Labs/snowflake" version = "~> 0.61" }
#     }
#   }
# ─────────────────────────────────────────────────────────────────────────────

resource "snowflake_database" "data_warehouse" {
  name    = "APP_DATA_WAREHOUSE"
  comment = "Primary data warehouse"
}

resource "snowflake_warehouse" "compute_wh" {
  name           = "APP_COMPUTE_WH"
  warehouse_size = "x-small"
  auto_suspend   = 60
  auto_resume    = true
}`,
};

// ---------------------------------------------------------------------------
// Header boilerplate
// ---------------------------------------------------------------------------
const HEADER = `# ════════════════════════════════════════════════════════════════════════════════
# AUTO-GENERATED TERRAFORM — AWS Architecture Simulator
# Generated: {DATE}
# DO NOT COMMIT credentials. Use environment variables or AWS Vault.
# ════════════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Variables ────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Your Route 53 domain name"
  type        = string
  default     = "example.com"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ── Resources ─────────────────────────────────────────────────────────────────
`;

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------
export function generateTerraform(nodes: CanvasNode[], _edges: CanvasEdge[]): string {
  if (nodes.length === 0) return '# No services on canvas.';

  // Count occurrences of each type to give unique indices
  const typeCount: Partial<Record<ServiceType, number>> = {};

  const resourceBlocks: string[] = [];

  for (const node of nodes) {
    const t = node.data.serviceType;
    typeCount[t] = (typeCount[t] ?? -1) + 1;
    const idx = typeCount[t]!;
    const generator = GENERATORS[t];
    if (generator) {
      resourceBlocks.push(generator(idx));
    }
  }

  const header = HEADER.replace('{DATE}', new Date().toISOString());
  return header + resourceBlocks.join('\n') + '\n';
}
