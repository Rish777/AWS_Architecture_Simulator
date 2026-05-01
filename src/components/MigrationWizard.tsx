import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ChevronLeft, Database, Cloud, Snowflake, CheckCircle2, Layout, Zap, BarChart3, ShieldCheck, MapPin, Globe } from 'lucide-react';
import { ARCHITECTURE_TEMPLATES, getExplanation } from '../utils/templates';
import { CLOUD_REGIONS } from '../utils/regionPricing';

interface MigrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (nodes: any[], edges: any[]) => void;
  setExplanation: (exp: any) => void;
  setShowExplanation: (show: boolean) => void;
}

export const MigrationWizard = ({ isOpen, onClose, onComplete, setExplanation, setShowExplanation }: MigrationWizardProps) => {
  const [step, setStep] = useState(1);
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [targetCloud, setTargetCloud] = useState<string>('aws');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('oracle');

  const isMigration = templateKey === 'snowflake_migration';
  const totalSteps = isMigration ? 4 : 3;

  if (!isOpen) return null;

  const handleGenerate = () => {
    const template = ARCHITECTURE_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;

    // Service mapping for cross-cloud consistency
    const getMappedService = (originalType: string, target: string): any => {
      if (target === 'aws') return originalType;
      
      const azureMap: Record<string, string> = {
        'dms': 'adf',
        's3': 'blob_storage',
        'iam': 'azure_ad',
        'ec2': 'azure_vm',
        'rds': 'azure_sql',
        'lambda': 'azure_functions',
        'snowflake_aws': 'snowflake_azure',
        'vpc': 'azure_ad', // Azure doesn't have a direct 1:1 'vpc' node in our current list but we can map security
      };

      const gcpMap: Record<string, string> = {
        'dms': 'dataflow',
        's3': 'gcs',
        'iam': 'gcp_iam',
        'ec2': 'compute_engine',
        'rds': 'cloud_sql',
        'lambda': 'cloud_functions',
        'snowflake_aws': 'snowflake_gcp',
      };

      const map = target === 'azure' ? azureMap : gcpMap;
      return map[originalType] || originalType;
    };

    const nodes = template.nodes.map(n => {
      let serviceType = n.type;
      
      // Map original template service to target cloud equivalent
      serviceType = getMappedService(serviceType, targetCloud);
      
      // Override source for migration
      if (n.id === 'src' && isMigration) {
        serviceType = selectedSource as any;
      }
      
      // Double check Snowflake provider consistency
      if (serviceType.toString().startsWith('snowflake_') && serviceType !== 'snowflake_core') {
        if (targetCloud === 'aws') serviceType = 'snowflake_aws';
        if (targetCloud === 'azure') serviceType = 'snowflake_azure';
        if (targetCloud === 'gcp') serviceType = 'snowflake_gcp';
      }

      return {
        id: `m_${n.id}`,
        type: 'custom',
        position: n.pos,
        data: { 
          serviceType,
          region: selectedRegion,
          provider: targetCloud
        }
      };
    });

    const edges = template.edges.map((e, idx) => ({
      id: `me_${idx}`,
      source: `m_${e.from}`,
      target: `m_${e.to}`,
      animated: true,
      type: 'traffic'
    }));

    onComplete(nodes, edges);
    setExplanation(getExplanation(templateKey, selectedSource));
    setShowExplanation(true);
    onClose();
  };

  const templateOptions = [
    { id: 'enterprise_stack', name: 'Full Enterprise Stack', desc: 'Route 53, CloudFront, ALB, EC2, RDS, S3', icon: Layout },
    { id: 'snowflake_migration', name: 'Legacy Data Migration', desc: 'Oracle to Snowflake via DMS & S3', icon: Database },
    { id: 'ai_analytics', name: 'AI & Analytics Pipeline', desc: 'Lambda, Glue, Athena, Snowflake', icon: Zap },
    { id: 'web_app', name: 'Serverless Web App', desc: 'API GW, Lambda, DynamoDB', icon: BarChart3 },
  ];

  const clouds = [
    { id: 'aws', name: 'AWS', color: '#ff9900', desc: 'Amazon Web Services' },
    { id: 'azure', name: 'Azure', color: '#0078d4', desc: 'Microsoft Cloud' },
    { id: 'gcp', name: 'GCP', color: '#4285f4', desc: 'Google Cloud' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(20px)', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '42rem', backgroundColor: '#0d111e', border: '1px solid rgba(69, 243, 255, 0.3)', borderRadius: '1rem', boxShadow: '0 0 50px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, rgba(69,243,255,0.1), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ color: '#45f3ff' }} /> Architecture Architect
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Step {step} of {totalSteps}: {
                step === 1 ? 'Select Template' : 
                (isMigration && step === 2) ? 'Select Source' : 
                (isMigration ? step === 3 : step === 2) ? 'Choose Provider' : 
                'Select Region'
              }
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '2rem', minHeight: '340px' }}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {templateOptions.map(t => (
                  <button key={t.id} onClick={() => setTemplateKey(t.id)} style={{ padding: '1.25rem', borderRadius: '0.75rem', border: `1px solid ${templateKey === t.id ? '#45f3ff' : 'rgba(255,255,255,0.05)'}`, background: templateKey === t.id ? 'rgba(69,243,255,0.1)' : 'rgba(255,255,255,0.02)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <t.icon style={{ color: templateKey === t.id ? '#45f3ff' : '#64748b', marginBottom: '0.5rem' }} size={24} />
                    <div style={{ fontWeight: 'bold', color: 'white' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4, marginTop: '0.2rem' }}>{t.desc}</div>
                  </button>
                ))}
              </motion.div>
            ) : (isMigration && step === 2) ? (
              <motion.div key="stepSource" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={16} style={{ color: '#45f3ff' }} /> Choose Legacy Source
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Select the on-premises database you wish to migrate.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {[
                    { id: 'oracle', name: 'Oracle DB', icon: Database },
                    { id: 'sqlserver_onprem', name: 'SQL Server', icon: Database },
                    { id: 'db2', name: 'IBM DB2', icon: Database },
                    { id: 'teradata', name: 'Teradata', icon: Layout }
                  ].map(s => (
                    <button key={s.id} onClick={() => setSelectedSource(s.id)} style={{ padding: '1.25rem', borderRadius: '0.75rem', border: `1px solid ${selectedSource === s.id ? '#45f3ff' : 'rgba(255,255,255,0.05)'}`, background: selectedSource === s.id ? 'rgba(69,243,255,0.1)' : 'rgba(255,255,255,0.02)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <s.icon style={{ color: selectedSource === s.id ? '#45f3ff' : '#64748b', marginBottom: '0.5rem' }} size={20} />
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{s.name}</div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Migrate from local {s.name}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (isMigration ? step === 3 : step === 2) ? (
              <motion.div key="stepProvider" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {clouds.map(c => (
                  <button key={c.id} onClick={() => { setTargetCloud(c.id); setSelectedRegion(''); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '0.75rem', border: `1px solid ${targetCloud === c.id ? c.color : 'rgba(255,255,255,0.05)'}`, background: targetCloud === c.id ? `${c.color}15` : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${c.color}20`, display: 'flex', alignItems: 'center', justifySelf: 'center', color: c.color }}><Cloud size={20} style={{ margin: '0 auto' }} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Deploy to {c.name} environment</div>
                    </div>
                    {targetCloud === c.id && <CheckCircle2 size={20} style={{ marginLeft: 'auto', color: c.color }} />}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={16} style={{ color: '#45f3ff' }} /> Available Regions for {targetCloud.toUpperCase()}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Selecting a region ensures data residency and low latency.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {CLOUD_REGIONS.filter(r => r.provider === targetCloud).map(r => (
                    <button key={r.code} onClick={() => setSelectedRegion(r.code)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${selectedRegion === r.code ? '#45f3ff' : 'rgba(255,255,255,0.05)'}`, background: selectedRegion === r.code ? 'rgba(69,243,255,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                      <MapPin size={16} style={{ color: selectedRegion === r.code ? '#45f3ff' : '#64748b' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{r.name}</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{r.code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(1)} disabled={step === 1} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}>
            <ChevronLeft size={16} /> Back
          </button>
          
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!templateKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: '#45f3ff', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: !templateKey ? 0.5 : 1 }}>
              {isMigration ? 'Continue to Source' : 'Continue to Provider'} <ArrowRight size={16} />
            </button>
          ) : step < totalSteps ? (
            <button onClick={() => setStep(step + 1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', background: '#45f3ff', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={!selectedRegion} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', background: '#45f3ff', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 30px rgba(69,243,255,0.3)', opacity: !selectedRegion ? 0.5 : 1 }}>
              Generate Full Stack <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
