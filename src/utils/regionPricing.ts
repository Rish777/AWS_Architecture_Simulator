export interface CloudRegion {
  code: string;
  name: string;
  flag: string;
  multiplier: number; // relative to us-east-1 baseline (1.0)
  provider: 'aws' | 'azure' | 'gcp';
}

export const CLOUD_REGIONS: CloudRegion[] = [
  // AWS - North America
  { code: 'us-east-1',      name: 'US East (N. Virginia)',   flag: '🇺🇸', multiplier: 1.00, provider: 'aws' },
  { code: 'us-east-2',      name: 'US East (Ohio)',           flag: '🇺🇸', multiplier: 1.00, provider: 'aws' },
  { code: 'us-west-1',      name: 'US West (N. California)',  flag: '🇺🇸', multiplier: 1.12, provider: 'aws' },
  { code: 'us-west-2',      name: 'US West (Oregon)',         flag: '🇺🇸', multiplier: 1.00, provider: 'aws' },
  { code: 'ca-central-1',   name: 'Canada (Central)',         flag: '🇨🇦', multiplier: 1.08, provider: 'aws' },
  
  // AWS - Europe
  { code: 'eu-central-1',   name: 'Europe (Frankfurt)',       flag: '🇩🇪', multiplier: 1.16, provider: 'aws' },
  { code: 'eu-west-1',      name: 'Europe (Ireland)',         flag: '🇮🇪', multiplier: 1.12, provider: 'aws' },
  { code: 'eu-west-2',      name: 'Europe (London)',          flag: '🇬🇧', multiplier: 1.18, provider: 'aws' },
  { code: 'eu-south-1',     name: 'Europe (Milan)',           flag: '🇮🇹', multiplier: 1.18, provider: 'aws' },
  { code: 'eu-west-3',      name: 'Europe (Paris)',           flag: '🇫🇷', multiplier: 1.18, provider: 'aws' },
  { code: 'eu-north-1',     name: 'Europe (Stockholm)',       flag: '🇸🇪', multiplier: 1.10, provider: 'aws' },

  // AWS - Asia Pacific
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)',     flag: '🇯🇵', multiplier: 1.22, provider: 'aws' },
  { code: 'ap-northeast-2', name: 'Asia Pacific (Seoul)',     flag: '🇰🇷', multiplier: 1.18, provider: 'aws' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', flag: '🇸🇬', multiplier: 1.18, provider: 'aws' },
  { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)',    flag: '🇦🇺', multiplier: 1.22, provider: 'aws' },
  { code: 'ap-south-1',     name: 'Asia Pacific (Mumbai)',    flag: '🇮🇳', multiplier: 1.14, provider: 'aws' },

  // AZURE - North America
  { code: 'eastus',         name: 'East US',                  flag: '🇺🇸', multiplier: 1.00, provider: 'azure' },
  { code: 'eastus2',        name: 'East US 2',                flag: '🇺🇸', multiplier: 1.00, provider: 'azure' },
  { code: 'westus',         name: 'West US',                  flag: '🇺🇸', multiplier: 1.05, provider: 'azure' },
  { code: 'westus2',        name: 'West US 2',                flag: '🇺🇸', multiplier: 1.05, provider: 'azure' },
  { code: 'centralus',      name: 'Central US',               flag: '🇺🇸', multiplier: 1.02, provider: 'azure' },
  { code: 'canadacentral',  name: 'Canada Central',           flag: '🇨🇦', multiplier: 1.08, provider: 'azure' },

  // AZURE - Europe
  { code: 'northeurope',    name: 'North Europe',             flag: '🇮🇪', multiplier: 1.10, provider: 'azure' },
  { code: 'westeurope',     name: 'West Europe',              flag: '🇳🇱', multiplier: 1.12, provider: 'azure' },
  { code: 'uksouth',        name: 'UK South',                 flag: '🇬🇧', multiplier: 1.15, provider: 'azure' },
  { code: 'francecentral',  name: 'France Central',           flag: '🇫🇷', multiplier: 1.15, provider: 'azure' },
  { code: 'germanywestcentral', name: 'Germany West Central', flag: '🇩🇪', multiplier: 1.15, provider: 'azure' },

  // AZURE - Asia
  { code: 'southeastasia',  name: 'Southeast Asia',           flag: '🇸🇬', multiplier: 1.18, provider: 'azure' },
  { code: 'eastasia',       name: 'East Asia',                flag: '🇭🇰', multiplier: 1.18, provider: 'azure' },
  { code: 'japaneast',      name: 'Japan East',               flag: '🇯🇵', multiplier: 1.20, provider: 'azure' },
  { code: 'australiaeast',  name: 'Australia East',           flag: '🇦🇺', multiplier: 1.20, provider: 'azure' },
  { code: 'centralindia',   name: 'Central India',            flag: '🇮🇳', multiplier: 1.12, provider: 'azure' },

  // GCP - North America
  { code: 'us-central1',    name: 'US Central (Iowa)',        flag: '🇺🇸', multiplier: 1.00, provider: 'gcp' },
  { code: 'us-east1',       name: 'US East (S. Carolina)',    flag: '🇺🇸', multiplier: 1.00, provider: 'gcp' },
  { code: 'us-east4',       name: 'US East (N. Virginia)',    flag: '🇺🇸', multiplier: 1.00, provider: 'gcp' },
  { code: 'us-west1',       name: 'US West (Oregon)',         flag: '🇺🇸', multiplier: 1.00, provider: 'gcp' },
  { code: 'northamerica-northeast1', name: 'North America (Montreal)', flag: '🇨🇦', multiplier: 1.08, provider: 'gcp' },

  // GCP - Europe
  { code: 'europe-west1',   name: 'Europe West (Belgium)',    flag: '🇧🇪', multiplier: 1.10, provider: 'gcp' },
  { code: 'europe-west2',   name: 'Europe West (London)',     flag: '🇬🇧', multiplier: 1.15, provider: 'gcp' },
  { code: 'europe-west3',   name: 'Europe West (Frankfurt)',  flag: '🇩🇪', multiplier: 1.15, provider: 'gcp' },
  { code: 'europe-west4',   name: 'Europe West (Netherlands)', flag: '🇳🇱', multiplier: 1.12, provider: 'gcp' },
  { code: 'europe-north1',  name: 'Europe North (Finland)',   flag: '🇫🇮', multiplier: 1.10, provider: 'gcp' },

  // GCP - Asia
  { code: 'asia-east1',     name: 'Asia East (Taiwan)',       flag: '🇹🇼', multiplier: 1.18, provider: 'gcp' },
  { code: 'asia-east2',     name: 'Asia East (Hong Kong)',    flag: '🇭🇰', multiplier: 1.18, provider: 'gcp' },
  { code: 'asia-northeast1', name: 'Asia Northeast (Tokyo)',  flag: '🇯🇵', multiplier: 1.20, provider: 'gcp' },
  { code: 'asia-southeast1', name: 'Asia Southeast (Singapore)', flag: '🇸🇬', multiplier: 1.18, provider: 'gcp' },
  { code: 'australia-southeast1', name: 'Australia Southeast (Sydney)', flag: '🇦🇺', multiplier: 1.20, provider: 'gcp' },
];

export const DEFAULT_REGION = 'us-east-1';

export function getRegionMultiplier(code: string): number {
  return CLOUD_REGIONS.find(r => r.code === code)?.multiplier ?? 1.0;
}

export function getRegion(code: string): CloudRegion {
  return CLOUD_REGIONS.find(r => r.code === code) ?? CLOUD_REGIONS[0];
}
