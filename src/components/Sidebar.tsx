import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, ChevronDown, Sparkles, 
  Trash2, Zap, Cloud, Map as MapIcon
} from 'lucide-react';
import { CLOUD_SERVICES } from '../services';
import type { ServiceType } from '../services';

interface SidebarProps {
  onAddNode: (type: ServiceType) => void;
  onAutoGenerate: (prompt: string) => void;
  onClear: () => void;
  explanation: any;
  showExplanation: boolean;
  setShowExplanation: (show: boolean) => void;
  isInsightMinimized: boolean;
  setIsInsightMinimized: (minimized: boolean) => void;
}

export const Sidebar = ({ 
  onAddNode, onAutoGenerate, onClear, 
  explanation, showExplanation, setShowExplanation,
  isInsightMinimized, setIsInsightMinimized
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoPrompt, setAutoPrompt] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>('aws');

  const providers = ['aws', 'azure', 'gcp', 'snowflake', 'on-prem'];
  
  const filteredServices = Object.values(CLOUD_SERVICES).filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getServicesByProvider = (provider: string) => 
    filteredServices.filter(s => s.provider === provider);

  return (
    <div style={{ 
      width: '320px', height: '100vh', background: '#0a0e1a', borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', color: 'white', zIndex: 30, overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Cloud size={18} color="white" />
          </div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Ai Architect
          </h1>
        </div>
      </div>

      {/* AI Architect Panel */}
      <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#a855f7' }}>
          <Sparkles size={16} />
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>AI Architect</h3>
        </div>
        <div style={{ position: 'relative' }}>
          <textarea 
            value={autoPrompt}
            onChange={(e) => setAutoPrompt(e.target.value)}
            placeholder="e.g. Migration from SQL Server to Snowflake on Azure..."
            style={{ 
              width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: 'white', resize: 'none', marginBottom: '0.5rem', outline: 'none'
            }}
          />
          <button 
            onClick={() => {
              onAutoGenerate(autoPrompt);
            }}
            style={{ 
              position: 'absolute', bottom: '10px', right: '10px', background: '#ff9900', border: 'none', 
              borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'white', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
            }}
          >
            Generate
          </button>
        </div>
      </div>

      {/* Architect's Insight - Integrated Sidebar Collapse State */}
      <AnimatePresence>
        {explanation && showExplanation && isInsightMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onClick={() => setIsInsightMinimized(false)}
            style={{ 
              background: 'rgba(255, 153, 0, 0.08)', 
              borderBottom: '1px solid rgba(255, 153, 0, 0.2)',
              cursor: 'pointer', overflow: 'hidden'
            }}
          >
            <div style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff9900' }}>
                <MapIcon size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Architect's Insight</span>
              </div>
              <ChevronRight size={14} style={{ color: '#ff9900' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Browser */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={14} />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search services..."
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', color: 'white', outline: 'none' }}
          />
        </div>

        {providers.map(provider => (
          <div key={provider} style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => setExpandedProvider(expandedProvider === provider ? null : provider)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', borderRadius: '6px' }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{provider}</span>
              {expandedProvider === provider ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedProvider === provider && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', marginTop: '0.4rem', paddingLeft: '0.5rem' }}>
                {getServicesByProvider(provider).map(service => (
                  <div 
                    key={service.id} onClick={() => onAddNode(service.id as ServiceType)}
                    style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <service.icon size={16} color={service.provider === 'aws' ? '#ff9900' : service.provider === 'azure' ? '#0078d4' : '#4285f4'} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{service.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear Canvas at Bottom */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={onClear}
          style={{ 
            width: '100%', padding: '0.75rem', borderRadius: '10px', 
            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
            color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <Trash2 size={14} /> Clear Canvas
        </button>
      </div>
    </div>
  );
};
