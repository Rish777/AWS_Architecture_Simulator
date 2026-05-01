import type { ServiceType } from '../services';

interface AuditNode { data: { serviceType: ServiceType } }

interface Finding {
  level: 'pass' | 'warn' | 'fail';
  text: string;
  points: number;
}

export interface AuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  findings: Finding[];
}

export function runSecurityAudit(nodes: AuditNode[]): AuditResult {
  if (nodes.length === 0) {
    return { score: 0, grade: 'F', color: '#ff4757', findings: [] };
  }

  const types = nodes.map(n => n.data.serviceType);
  const providers = nodes.map(n => {
    // This is a bit of a hack since we don't have the full CLOUD_SERVICES here
    // but we can infer from common types
    if (n.data.serviceType.startsWith('azure_') || n.data.serviceType === 'adf' || n.data.serviceType === 'blob_storage') return 'azure';
    if (n.data.serviceType.startsWith('compute_engine') || n.data.serviceType === 'gcs' || n.data.serviceType === 'dataflow' || n.data.serviceType === 'bigquery') return 'gcp';
    if (n.data.serviceType.includes('onprem') || ['oracle', 'db2', 'teradata'].includes(n.data.serviceType)) return 'on-prem';
    if (n.data.serviceType.includes('snowflake')) return 'snowflake';
    return 'aws';
  });
  
  const has = (t: ServiceType) => types.includes(t);
  const findings: Finding[] = [];
  let score = 50; // increased base score

  // ── SECURITY & ISOLATION ─────────────────────────────────────
  if (has('iam') || has('azure_ad') || has('gcp_iam')) {
    const iamName = has('azure_ad') ? 'Azure AD / RBAC' : has('gcp_iam') ? 'Cloud IAM' : 'IAM';
    score += 15;
    findings.push({ level: 'pass', text: `${iamName} active — using fine-grained permissions.`, points: 15 });
  } else {
    score -= 20;
    findings.push({ level: 'fail', text: 'CRITICAL: No Identity Management detected. Resources may be using over-permissive root access.', points: -20 });
  }

  if (has('vpc')) {
    score += 15;
    findings.push({ level: 'pass', text: 'VPC Network Isolation — compute resources are shielded from public internet.', points: 15 });
  } else if (has('ec2') || has('rds') || has('azure_vm') || has('compute_engine')) {
    score -= 15;
    findings.push({ level: 'fail', text: 'EXPOSURE: Compute/DB nodes present without VPC isolation.', points: -15 });
  }

  // ── HIGH AVAILABILITY & RELIABILITY ──────────────────────────
  if (has('alb') || has('route53')) {
    score += 10;
    findings.push({ level: 'pass', text: 'High Availability — automated failover and traffic distribution enabled.', points: 10 });
  } else if (nodes.length > 3) {
    score -= 10;
    findings.push({ level: 'warn', text: 'Single Point of Failure — complex architecture missing a Load Balancer.', points: -10 });
  }

  // ── DATA ARCHITECTURE & STORAGE ──────────────────────────────
  const storageNodes = types.filter(t => t.includes('s3') || t.includes('storage') || t.includes('gcs') || t.includes('bucket'));
  if (storageNodes.length > 0) {
    score += 5;
    findings.push({ level: 'pass', text: 'Managed Persistence — using high-durability object storage.', points: 5 });
  }

  // Multi-cloud Storage Check
  const storageProviders = new Set(storageNodes.map(t => {
    if (t.includes('s3')) return 'aws';
    if (t.includes('blob')) return 'azure';
    if (t.includes('gcs')) return 'gcp';
    return 'unknown';
  }));
  if (storageProviders.size > 1) {
    findings.push({ level: 'warn', text: 'Data Fragmentation — storage split across multiple clouds may increase egress costs.', points: 0 });
  }

  // ── SNOWFLAKE SPECIFIC ───────────────────────────────────────
  if (types.some(t => t.includes('snowflake'))) {
    const hasStaging = has('s3') || has('blob_storage') || has('gcs');
    if (hasStaging) {
      score += 10;
      findings.push({ level: 'pass', text: 'Optimized Ingestion — cloud storage detected as Snowflake staging area.', points: 10 });
    } else {
      score -= 5;
      findings.push({ level: 'warn', text: 'Inefficient Data Loading — Snowflake detected without dedicated staging bucket.', points: -5 });
    }
  }

  // ── MULTI-CLOUD GOVERNANCE ───────────────────────────────────
  const uniqueProviders = new Set(providers.filter(p => p !== 'on-prem'));
  if (uniqueProviders.size > 2) {
    score -= 10;
    findings.push({ level: 'warn', text: 'Operational Complexity — managing 3+ cloud providers increases overhead.', points: -10 });
  }

  // ── PERFORMANCE ──────────────────────────────────────────────
  if (has('elasticache') && (has('rds') || has('azure_sql'))) {
    score += 5;
    findings.push({ level: 'pass', text: 'Performance Optimized — in-memory caching layer reduces DB latency.', points: 5 });
  }

  // Clamp 0–100
  score = Math.max(0, Math.min(100, score));

  const grade: AuditResult['grade'] =
    score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

  const color =
    score >= 75 ? '#4cd137' : score >= 55 ? '#ffa502' : '#ff4757';

  return { score, grade, color, findings };
}

