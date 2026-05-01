import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  X, Download, ShieldCheck, AlertTriangle, DollarSign, Zap, 
  CheckCircle2, Layout, List, BarChart3, TrendingDown 
} from 'lucide-react';
import { CLOUD_SERVICES } from '../services';
import type { ServiceType } from '../services';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  totalCost: number;
  region: string;
  simulationParams: any;
  snowflakeConfig: any;
  calculateNodeCost: (node: any) => number;
}

export const ReportModal = ({ 
  isOpen, onClose, nodes = [], totalCost = 0, region = 'us-east-1',
  simulationParams, snowflakeConfig, calculateNodeCost
}: ReportModalProps) => {
  if (!isOpen) return null;

  // ── Data Analysis Engine ──
  const reportData = useMemo(() => {
    const items = nodes.map(n => {
      const svc = CLOUD_SERVICES[n.data.serviceType as ServiceType];
      const itemCost = calculateNodeCost(n);
      return {
        name: svc?.name || 'Unknown',
        provider: svc?.provider || 'Unknown',
        baseCost: svc?.monthlyCost || 0,
        adjustedCost: itemCost
      };
    });

    const computeNodes = nodes.filter(n => ['aws_ec2', 'aws_rds', 'aws_lambda'].includes(n.data.serviceType));
    const savingsPotential = computeNodes.length * 12.5; // Example dynamic logic: $12.50 savings per compute node via RIs

    const dynamicFindings = [];
    if (nodes.length > 5) dynamicFindings.push({ title: 'Resource Density Analysis', status: 'Notice', text: 'Detected a complex microservice environment. Recommendation: Implement service mesh for observability.' });
    if (!nodes.some(n => n.data.serviceType.includes('s3') || n.data.serviceType.includes('storage'))) {
      dynamicFindings.push({ title: 'Persistence Strategy', status: 'Warning', text: 'Missing managed storage layer. Potential risk for stateless-only application flow.' });
    }
    if (nodes.some(n => n.data.serviceType === 'aws_ec2')) {
      dynamicFindings.push({ title: 'Compute Efficiency', status: 'Optimize', text: 'Legacy compute (EC2) detected. Migration to Serverless Fargate or Lambda suggested for 30%+ cost reduction.' });
    }
    if (new Set(items.map(i => i.provider)).size > 1) {
      dynamicFindings.push({ title: 'Inter-Cloud Latency', status: 'Critical', text: 'Multi-cloud architecture detected. Ensure inter-cloud egress costs and latency are mapped.' });
    }

    return { items, dynamicFindings, savingsPotential };
  }, [nodes]);

  const handleExportPDF = () => {
    console.log('Starting PDF Export. Region:', region);
    try {
      
      // Inlined logic to prevent scoping issues in PDF export
      const multiplier = (() => {
        const CLOUD_REGIONS = [
          { code: 'us-east-1', multiplier: 1.00 },
          { code: 'us-east-2', multiplier: 1.00 },
          { code: 'us-west-1', multiplier: 1.12 },
          { code: 'us-west-2', multiplier: 1.00 },
          { code: 'ap-northeast-1', multiplier: 1.22 },
          { code: 'ap-south-1', multiplier: 1.14 },
          { code: 'eu-central-1', multiplier: 1.16 },
          { code: 'eastus', multiplier: 1.00 },
          { code: 'japaneast', multiplier: 1.20 },
          { code: 'us-central1', multiplier: 1.00 },
        ];
        return CLOUD_REGIONS.find(r => r.code === region)?.multiplier ?? 1.0;
      })();
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      });
      doc.setFont('helvetica'); // Use standard built-in font

      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 25;

      // ── Document Header ──
      doc.setFillColor(13, 17, 30);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('ARCHITECTURE STRATEGY REPORT', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`PREPARED FOR: ENTERPRISE CLOUD AUDIT | DATE: ${new Date().toLocaleDateString()}`, 20, 32);

      // ── 1. Executive Summary ──
      currentY = 55;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(13, 17, 30);
      doc.text('1. EXECUTIVE SUMMARY', 20, currentY);
      
      currentY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Target Region: ${region.toUpperCase()}`, 25, currentY);
      doc.text(`Estimated Monthly Expenditure: $${totalCost.toFixed(2)}`, 25, currentY + 7);
      doc.text(`Current Resource Count: ${nodes.length} Primary Assets`, 25, currentY + 14);
      doc.text(`Strategic Optimization Opportunity: $${reportData.savingsPotential.toFixed(2)} Potential Monthly Savings`, 25, currentY + 21);

      // ── 2. Bill of Materials ──
      currentY += 35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(13, 17, 30);
      doc.text('2. BILL OF MATERIALS (PRICE BREAKDOWN)', 20, currentY);

      const tableData = reportData.items.map(item => [
        item.name,
        item.provider.toUpperCase(),
        'Enterprise Tier',
        `$${item.adjustedCost.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Cloud Resource', 'Provider', 'Configuration', 'Regional Cost']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [13, 17, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { left: 20, right: 20 }
      });

      // ── 2.5 Financial Audit (NEW) ──
      // @ts-ignore
      currentY = (doc as any).lastAutoTable.finalY + 15;
      if (currentY > 240) { doc.addPage(); currentY = 25; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('FINANCIAL ASSUMPTIONS & SIMULATION PARAMETERS', 20, currentY);
      
      currentY += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`• Total Data Volume: ${simulationParams.dataVolumeTB} TB`, 25, currentY);
      currentY += 6;
      doc.text(`• Daily Change Rate: ${simulationParams.dailyChangeRate}%`, 25, currentY);
      currentY += 6;
      doc.text(`• Snowflake Warehouse: ${snowflakeConfig.warehouseSize} (${snowflakeConfig.tier})`, 25, currentY);
      currentY += 6;
      doc.text(`• Regional Multiplier: ${multiplier.toFixed(2)}x (Applied to all Cloud Assets)`, 25, currentY);
      currentY += 12;

      currentY += 15;
      if (currentY > 240) { doc.addPage(); currentY = 25; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('3. ARCHITECTURAL AUDIT FINDINGS', 20, currentY);

      currentY += 10;
      reportData.dynamicFindings.forEach((finding) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 17, 30);
        doc.text(`• ${finding.title.toUpperCase()} [${finding.status}]`, 25, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const splitText = doc.splitTextToSize(finding.text, pageWidth - 55);
        doc.text(splitText, 30, currentY);
        currentY += (splitText.length * 5) + 6;
        
        if (currentY > 270) { doc.addPage(); currentY = 25; }
      });

      // ── 4. Strategic Recommendations ──
      if (currentY > 230) { doc.addPage(); currentY = 25; }
      currentY += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(13, 17, 30);
      doc.text('4. STRATEGIC RECOMMENDATIONS', 20, currentY);

      const recommendations = [
        'Implement Reserved Instance (RI) strategy for baseline compute loads.',
        'Deploy Cross-Region replication for business continuity on S3/Storage.',
        'Activate Cost Anomaly Detection to prevent inter-cloud spend spikes.',
        'Consolidate Multi-Cloud IAM roles into a unified identity provider.'
      ];

      currentY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      recommendations.forEach(rec => {
        doc.text(`- ${rec}`, 25, currentY);
        currentY += 8;
      });

      // ── Footer ──
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Page ${i} of ${pageCount} | Strategic Architecture Report | Confidential`, pageWidth / 2, 285, { align: 'center' });
      }

      // ── Binary-Typed Manual Handover ──
      // ── Definitive Native Save ──
      doc.save('strategic-report.pdf');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert(`Strategic Report Export Failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{
            position: 'relative', width: '100%', maxWidth: '900px', maxHeight: '94vh',
            background: '#0d111e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '0.6rem', borderRadius: '12px', color: '#45f3ff' }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>Strategic Architectural Report</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Region: {region} | Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {/* Scrollable Dashboard View (Unchanged UI) */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(69, 243, 255, 0.03)', border: '1px solid rgba(69, 243, 255, 0.1)', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#45f3ff', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Monthly Spend</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>${totalCost.toFixed(2)}</div>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Resources</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{nodes.length} <span style={{ fontSize: '0.8rem', color: '#444' }}>Assets</span></div>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(76, 209, 55, 0.03)', border: '1px solid rgba(76, 209, 55, 0.1)', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4cd137', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Savings Potential</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4cd137' }}>${reportData.savingsPotential.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <List size={20} style={{ color: '#45f3ff' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Itemized Cost Breakdown</h3>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Resource</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Provider</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.items.map((item, i) => (
                        <tr key={`${item.name}_${i}`} style={{ borderBottom: i === reportData.items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', textTransform: 'uppercase' }}>
                              {item.provider}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#4cd137', fontWeight: 700, fontSize: '0.85rem' }}>${item.adjustedCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <ShieldCheck size={20} style={{ color: '#4cd137' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial Audit</h3>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Data Volume: <span style={{ color: 'white', fontWeight: 700 }}>{simulationParams.dataVolumeTB} TB</span></div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Daily Change: <span style={{ color: 'white', fontWeight: 700 }}>{simulationParams.dailyChangeRate}%</span></div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Snowflake Warehouse: <span style={{ color: 'white', fontWeight: 700 }}>{snowflakeConfig.warehouseSize}</span></div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Snowflake Tier: <span style={{ color: 'white', fontWeight: 700 }}>{snowflakeConfig.tier}</span></div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: '#444', lineHeight: 1.4 }}>
                      * Migration costs are scaled using volume factors. Storage is calculated at $23/TB baseline. On-prem costs include 1.5x TCO overhead for licenses and power.
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <TrendingDown size={20} style={{ color: '#ffa502' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strategic Path</h3>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(255, 165, 2, 0.05)', border: '1px dashed rgba(255, 165, 2, 0.2)', borderRadius: '20px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#64748b', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <li>Implement baseline Reserved Instances.</li>
                      <li>Activate Cross-Region replication.</li>
                      <li>Deploy Cost Anomaly Detection.</li>
                      <li>Unified Multi-Cloud IAM roles.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={onClose} style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            <button 
              onClick={handleExportPDF}
              style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none', background: '#ff9900', color: 'black', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={18} /> Export Full PDF Report
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
