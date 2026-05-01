import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Activity, ShieldCheck, ShieldAlert, ImageDown, Trash2, 
  FileCode2, Globe, Zap, MapPin, Sparkles, Snowflake, 
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Map as MapIcon
} from 'lucide-react';
import { toPng } from 'html-to-image';

import { Sidebar } from './components/Sidebar';
import { CustomNode } from './components/CustomNode';
import { TrafficEdge } from './components/TrafficEdge';
import { ReportModal } from './components/ReportModal';
import { MigrationWizard } from './components/MigrationWizard';

import { CLOUD_SERVICES } from './services';
import type { ServiceType } from './services';
import { generateTerraform } from './utils/terraformGenerator';
import { runSecurityAudit } from './utils/securityAudit';
import { ARCHITECTURE_TEMPLATES } from './utils/templates';
import { getExplanation as getHighFidelityExplanation } from './utils/architectureExplainer';
import { CLOUD_REGIONS, getRegionMultiplier } from './utils/regionPricing';

import '@xyflow/react/dist/style.css';
import './App.css';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { traffic: TrafficEdge };

function ArchitectureSimulator() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [explanation, setExplanation] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isInsightMinimized, setIsInsightMinimized] = useState(false);

  const [snowflakeConfig, setSnowflakeConfig] = useState({
    warehouseSize: 'XS',
    tier: 'Standard',
    hoursPerDay: 8,
    storageGB: 1000
  });

  const [simulationParams, setSimulationParams] = useState({
    dataVolumeTB: 10,
    dailyChangeRate: 5, // percentage
    transferCosts: true
  });

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as ServiceType;
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: { serviceType: type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const addNode = (type: ServiceType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
      data: { serviceType: type },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleAutoGenerate = (prompt: string) => {
    const lp = prompt.toLowerCase();
    
    // 1. Detect Template
    let templateKey = 'enterprise_stack';
    if (lp.includes('snowflake') || lp.includes('migration')) templateKey = 'snowflake_migration';
    if (lp.includes('ai') || lp.includes('analytics') || lp.includes('pipeline')) templateKey = 'ai_analytics';
    if (lp.includes('serverless') || lp.includes('web app')) templateKey = 'web_app';

    // 2. Detect Cloud
    let targetCloud = 'aws';
    if (lp.includes('azure')) targetCloud = 'azure';
    if (lp.includes('gcp') || lp.includes('google')) targetCloud = 'gcp';

    // 3. Detect Source (for migration)
    let selectedSource = 'oracle';
    if (lp.includes('sql server') || lp.includes('mssql')) selectedSource = 'sqlserver_onprem';
    if (lp.includes('teradata')) selectedSource = 'teradata';
    if (lp.includes('db2')) selectedSource = 'db2';

    const template = ARCHITECTURE_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;

    // Service mapping for cross-cloud consistency
    const getMappedService = (originalType: string, target: string): any => {
      if (target === 'aws') return originalType;
      const azureMap: Record<string, string> = {
        'dms': 'adf', 's3': 'blob_storage', 'iam': 'azure_ad', 'ec2': 'azure_vm', 'rds': 'azure_sql',
        'lambda': 'azure_functions', 'snowflake_aws': 'snowflake_azure', 'vpc': 'azure_ad',
      };
      const gcpMap: Record<string, string> = {
        'dms': 'dataflow', 's3': 'gcs', 'iam': 'gcp_iam', 'ec2': 'compute_engine', 'rds': 'cloud_sql',
        'lambda': 'cloud_functions', 'snowflake_aws': 'snowflake_gcp',
      };
      const map = target === 'azure' ? azureMap : gcpMap;
      return map[originalType] || originalType;
    };

    const newNodes = template.nodes.map(n => {
      let serviceType = n.type;
      serviceType = getMappedService(serviceType, targetCloud);
      if (n.id === 'src' && templateKey === 'snowflake_migration') serviceType = selectedSource as any;
      
      // Handle Snowflake provider specifically
      if (serviceType.toString().startsWith('snowflake_') && serviceType !== 'snowflake_core') {
        if (targetCloud === 'aws') serviceType = 'snowflake_aws';
        if (targetCloud === 'azure') serviceType = 'snowflake_azure';
        if (targetCloud === 'gcp') serviceType = 'snowflake_gcp';
      }

      return {
        id: `node_${Date.now()}_${n.id}`,
        type: 'custom',
        position: n.pos,
        data: { serviceType, region: selectedRegion, provider: targetCloud }
      };
    });

    const newEdges = template.edges.map((e, idx) => ({
      id: `edge_${Date.now()}_${idx}`,
      source: newNodes.find(n => n.id.endsWith(`_${e.from}`))?.id || '',
      target: newNodes.find(n => n.id.endsWith(`_${e.to}`))?.id || '',
      animated: true,
      type: 'traffic'
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    
    // Map template keys to high-fidelity explainer keys
    const explainerMap: Record<string, string> = {
      'enterprise_stack': 'ecommerce',
      'snowflake_migration': 'datapipeline',
      'ai_analytics': 'ml',
      'web_app': 'serverless'
    };
    
    const highFidelityExpl = getHighFidelityExplanation(explainerMap[templateKey] || 'fallback');
    setExplanation(highFidelityExpl);
    setShowExplanation(true);
    setIsInsightMinimized(false);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setExplanation(null);
    setShowExplanation(false);
  };

  const toggleTraffic = () => {
    setIsSimulating(!isSimulating);
    setEdges((eds) => eds.map(e => ({ ...e, type: !isSimulating ? 'traffic' : 'default', animated: !isSimulating })));
  };

  const exportToPng = () => {
    const element = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!element) return;
    setIsExporting(true);
    toPng(element, { 
      backgroundColor: '#0d111e',
      pixelRatio: 1.5, // slightly lower for performance
      skipFonts: true, // prevent font loading hangs
      style: {
        transform: 'scale(1)',
        transition: 'none'
      }
    })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'architecture.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    })
    .catch((err) => {
      console.error('Export failed:', err);
      alert('Visual export failed.');
    })
    .finally(() => setIsExporting(false));
  };

  const exportTerraform = () => {
    try {
      const tf = generateTerraform(nodes, edges);
      // Explicitly specify UTF-8 encoding for cross-platform compatibility
      const blob = new Blob([tf], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      // ── Definitive Native Save ──
      const link = document.createElement('a');
      link.href = url;
      link.download = 'main.tf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Terraform export failed:', err);
      alert('Could not generate Terraform manifest.');
    }
  };


  const regionMultiplier = getRegionMultiplier(selectedRegion);
  const calculateNodeCost = (node: any) => {
    const svc = CLOUD_SERVICES[node.data.serviceType as ServiceType];
    if (!svc) return 0;

    let baseMonthly = svc.monthlyCost;

    // 1. SNOWFLAKE CALCULATIONS
    if (svc.isSnowflake) {
      const sizeMult: any = { 'XS': 1, 'S': 2, 'M': 4, 'L': 8, 'XL': 16, '2XL': 32 };
      const tierMult: any = { 'Standard': 2, 'Enterprise': 3, 'Business Critical': 4 };
      const compute = (sizeMult[snowflakeConfig.warehouseSize] || 1) * (tierMult[snowflakeConfig.tier] || 2) * snowflakeConfig.hoursPerDay * 30;
      const storage = (snowflakeConfig.storageGB / 1000) * 23; // $23 per TB
      return compute + storage;
    }

    // 2. MIGRATION SERVICES (DMS/ADF/Dataflow)
    if (['dms', 'adf', 'dataflow'].includes(svc.id)) {
      // Scale migration cost based on data volume and change rate
      const volumeFactor = Math.sqrt(simulationParams.dataVolumeTB);
      const activityFactor = 1 + (simulationParams.dailyChangeRate / 100);
      return baseMonthly * volumeFactor * activityFactor;
    }

    // 3. STORAGE SERVICES (S3/Blob/GCS)
    if (['s3', 'blob_storage', 'gcs'].includes(svc.id)) {
      return simulationParams.dataVolumeTB * 23; // Baseline $23 per TB for standard tier
    }

    // 4. ON-PREM SOURCES (TCO)
    if (['oracle', 'sqlserver_onprem', 'db2', 'teradata'].includes(svc.id)) {
      // On-prem TCO includes licensing, hardware, cooling, and labor (~1.5x base)
      return baseMonthly * 1.5;
    }

    // 5. COMPUTE (EC2/Azure VM/Compute Engine)
    if (['ec2', 'azure_vm', 'compute_engine'].includes(svc.id)) {
      // Add operational overhead for logging/monitoring (10%)
      return baseMonthly * 1.1;
    }

    return baseMonthly;
  };
  const totalCost = nodes.reduce((acc, n) => acc + calculateNodeCost(n), 0) * regionMultiplier;

  const hasSnowflake = nodes.some(n => CLOUD_SERVICES[n.data.serviceType as ServiceType]?.isSnowflake);

  return (
    <div className="app-wrapper" style={{ overflow: 'hidden', width: '100vw', height: '100vh', position: 'relative' }}>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? '0px' : '320px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ height: '100vh', zIndex: 30, overflow: 'hidden', position: 'relative' }}
      >
        <Sidebar 
          onAddNode={addNode}
          onAutoGenerate={handleAutoGenerate}
          onClear={clearCanvas}
          explanation={explanation}
          showExplanation={showExplanation}
          setShowExplanation={setShowExplanation}
          isInsightMinimized={isInsightMinimized}
          setIsInsightMinimized={setIsInsightMinimized}
        />
      </motion.div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed', 
          left: isCollapsed ? '0px' : '320px', 
          top: '50%',
          transform: 'translate(-50%, -50%)', 
          zIndex: 100, 
          background: '#0d111e',
          border: '1px solid rgba(255,255,255,0.1)', 
          color: 'white',
          width: '32px', height: '32px', borderRadius: '0 50% 50% 0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          boxShadow: '4px 0 12px rgba(0,0,0,0.5)',
          paddingLeft: '4px'
        }}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Architect's Insight - Side Pop-up (Scrollable Drawer) */}
      <AnimatePresence>
        {explanation && showExplanation && !isInsightMinimized && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            style={{ 
              position: 'fixed', left: isCollapsed ? '20px' : '330px', top: '1.5rem', bottom: '1.5rem',
              width: '380px', zIndex: 40,
              background: 'rgba(10, 14, 26, 0.95)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 153, 0, 0.2)', borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff9900' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,153,0,0.1)', borderRadius: '8px' }}>
                  <MapIcon size={20} />
                </div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Architect's Insight</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsInsightMinimized(true)} title="Collapse" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setIsInsightMinimized(true)} title="Collapse" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

                {/* Scrollable Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', scrollbarWidth: 'thin' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', marginBottom: '0.75rem', lineHeight: 1.2 }}>{explanation.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{explanation.summary || explanation.description}</p>
                  </div>

                  {/* Flow Visualization */}
                  {explanation.flow && (
                    <div style={{ 
                      padding: '1rem', background: 'rgba(0, 210, 255, 0.05)', 
                      border: '1px solid rgba(0, 210, 255, 0.1)', borderRadius: '12px',
                      marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem'
                    }}>
                      <Zap size={18} style={{ color: '#00d2ff', marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.8rem', color: '#00d2ff', fontFamily: 'monospace', lineHeight: 1.5, fontWeight: 500 }}>{explanation.flow}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Why each service?</div>
                    {(explanation.services || []).map((s: any, idx: number) => (
                      <div key={`${s.type}_${idx}`} style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {CLOUD_SERVICES[s.type as ServiceType]?.icon && React.createElement(CLOUD_SERVICES[s.type as ServiceType].icon, { size: 20, style: { color: '#ff9900' } })}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>{CLOUD_SERVICES[s.type as ServiceType]?.name || s.type}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{s.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {explanation.proTip && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,153,0,0.03)', borderRadius: '12px', borderLeft: '4px solid #ff9900' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>{explanation.proTip}</div>
                    </div>
                  )}
                </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsRightCollapsed(!isRightCollapsed)}
        style={{
          position: 'fixed', 
          right: isRightCollapsed ? '0px' : '320px', 
          top: '50%',
          transform: 'translate(50%, -50%)', 
          zIndex: 100, 
          background: '#0d111e',
          border: '1px solid rgba(255,255,255,0.1)', 
          color: 'white',
          width: '32px', height: '32px', borderRadius: '50% 0 0 50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          boxShadow: '-4px 0 12px rgba(0,0,0,0.5)',
          paddingRight: '4px'
        }}
      >
        {isRightCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>





      <div style={{ flex: 1, position: 'relative', height: '100vh' }}>
        <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'rgba(13, 17, 30, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <Globe size={18} style={{ color: '#45f3ff' }} />
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
              <optgroup label="AWS" style={{ background: '#1a1f2e', color: '#ff9900' }}>
                {CLOUD_REGIONS.filter(r => r.provider === 'aws').map(r => <option key={r.code} value={r.code} style={{ background: '#1a1f2e', color: 'white' }}>{r.flag} {r.name}</option>)}
              </optgroup>
              <optgroup label="Azure" style={{ background: '#1a1f2e', color: '#0078d4' }}>
                {CLOUD_REGIONS.filter(r => r.provider === 'azure').map(r => <option key={r.code} value={r.code} style={{ background: '#1a1f2e', color: 'white' }}>{r.flag} {r.name}</option>)}
              </optgroup>
              <optgroup label="GCP" style={{ background: '#1a1f2e', color: '#4285f4' }}>
                {CLOUD_REGIONS.filter(r => r.provider === 'gcp').map(r => <option key={r.code} value={r.code} style={{ background: '#1a1f2e', color: 'white' }}>{r.flag} {r.name}</option>)}
              </optgroup>
            </select>
          </div>
          <button onClick={() => setShowWizard(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(69, 243, 255, 0.1)', color: '#45f3ff', border: '1px solid rgba(69, 243, 255, 0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} /> Migration Wizard
          </button>
        </div>

        <div className="flow-container" ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            fitView proOptions={{ hideAttribution: true }} className="bg-gray-900"
          >
            <Background color="#333" gap={16} />
            <Controls showInteractive={false} style={{ position: 'fixed', left: '50%', bottom: '40px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'row', gap: '6px', background: 'rgba(13,17,30,0.9)', border: '1px solid rgba(69, 243, 255, 0.2)', borderRadius: '12px', padding: '10px 16px', zIndex: 1000 }} />
          </ReactFlow>
        </div>
      </div>

      <motion.aside 
        initial={false} animate={{ width: isRightCollapsed ? '10px' : '320px' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ height: '100vh', background: 'rgba(13, 17, 30, 0.95)', backdropFilter: 'blur(16px)', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', padding: isRightCollapsed ? '0' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', overflowX: 'hidden', zIndex: 10, position: 'relative' }}
      >
        <AnimatePresence>
          {!isRightCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '270px' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffab00', marginBottom: '0.5rem' }}>
                  <DollarSign size={20} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monthly Estimate</h3>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
                  <MapPin size={10} style={{ marginRight: '4px' }} /> {selectedRegion}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>${totalCost.toFixed(2)}</span>
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>/mo</span>
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(69, 243, 255, 0.05)', border: '1px solid rgba(69, 243, 255, 0.1)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#45f3ff', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Architecture State</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4cd137', fontSize: '0.8rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> {nodes.length > 0 ? 'Valid Architecture' : 'Awaiting Design'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button onClick={toggleTraffic} disabled={nodes.length === 0} style={{ width: '100%', padding: '0.75rem', background: isSimulating ? 'rgba(255,71,87,0.15)' : 'rgba(255,153,0,0.1)', color: isSimulating ? '#ff4757' : '#ff9900', fontWeight: 'bold', border: '1px solid rgba(255,153,0,0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  <Activity size={16} /> {isSimulating ? '⏹ Stop Simulation' : '▶ Simulate Traffic Flow'}
                </button>
                <button onClick={() => setShowReport(true)} disabled={nodes.length === 0} style={{ width: '100%', padding: '0.75rem', background: '#ffab00', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  <DollarSign size={18} /> Best Practice Report
                </button>
                <button onClick={exportToPng} disabled={nodes.length === 0} style={{ width: '100%', padding: '0.75rem', background: 'rgba(69,243,255,0.1)', color: '#45f3ff', border: '1px solid rgba(69,243,255,0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  <ImageDown size={18} /> Export PNG
                </button>
                <button onClick={clearCanvas} disabled={nodes.length === 0} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,71,87,0.08)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  <Trash2 size={16} /> Clear Canvas
                </button>
              </div>

              {hasSnowflake && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#45f3ff', marginBottom: '1rem' }}>
                    <Snowflake size={18} />
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Snowflake Config</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Warehouse Size</label>
                      <select value={snowflakeConfig.warehouseSize} onChange={e => setSnowflakeConfig({...snowflakeConfig, warehouseSize: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                        {['XS','S','M','L','XL','2XL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Hours / Day</label>
                        <span style={{ fontSize: '0.7rem', color: '#45f3ff' }}>{snowflakeConfig.hoursPerDay}h</span>
                      </div>
                      <input type="range" min="1" max="24" value={snowflakeConfig.hoursPerDay} onChange={e => setSnowflakeConfig({...snowflakeConfig, hoursPerDay: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', accentColor: '#45f3ff' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4cd137', marginBottom: '1rem' }}>
                  <Activity size={18} />
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Global Parameters</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Data Volume (TB)</label>
                      <span style={{ fontSize: '0.7rem', color: '#4cd137', fontWeight: 700 }}>{simulationParams.dataVolumeTB} TB</span>
                    </div>
                    <input type="range" min="1" max="1000" step="5" value={simulationParams.dataVolumeTB} onChange={e => setSimulationParams({...simulationParams, dataVolumeTB: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', accentColor: '#4cd137' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Daily Change Rate</label>
                      <span style={{ fontSize: '0.7rem', color: '#ffa502', fontWeight: 700 }}>{simulationParams.dailyChangeRate}%</span>
                    </div>
                    <input type="range" min="1" max="20" step="1" value={simulationParams.dailyChangeRate} onChange={e => setSimulationParams({...simulationParams, dailyChangeRate: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', accentColor: '#ffa502' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      <ReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        nodes={nodes} 
        totalCost={totalCost} 
        region={selectedRegion}
        simulationParams={simulationParams}
        snowflakeConfig={snowflakeConfig}
        calculateNodeCost={calculateNodeCost}
      />
      <MigrationWizard 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)} 
        onComplete={(n, e) => { setNodes(n); setEdges(e); setShowWizard(false); }}
        setExplanation={setExplanation}
        setShowExplanation={setShowExplanation}
      />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', textAlign: 'center', fontSize: '0.72rem', color: '#555', background: 'rgba(10,14,26,0.5)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 5 }}>
        © {new Date().getFullYear()} Developed by <span style={{ color: '#ff9900', fontWeight: 600 }}>Rishabh S</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <ArchitectureSimulator />
    </ReactFlowProvider>
  );
}
