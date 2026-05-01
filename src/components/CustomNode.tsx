import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { X, Cloud, Database, Snowflake as SnowflakeIcon } from 'lucide-react';
import { CLOUD_SERVICES } from '../services';
import type { ServiceType } from '../services';

export type CustomNodeType = Node<{
  serviceType: ServiceType;
  label?: string;
}, 'custom'>;

const CATEGORY_COLORS: Record<string, string> = {
  Compute:    '#ff9900',
  Database:   '#3b82f6',
  Storage:    '#10b981',
  Networking: '#8b5cf6',
  Security:   '#ef4444',
  Source:     '#c0c8d8',
  Migration:  '#45f3ff',
};

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
  snowflake: '#45f3ff',
  'on-prem': '#c0c8d8',
};

export const CustomNode = ({ id, data, selected }: NodeProps<CustomNodeType>) => {
  const service = CLOUD_SERVICES[data.serviceType];
  const { setNodes, setEdges } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  if (!service) return null;
  const Icon = service.icon;
  const badgeColor = CATEGORY_COLORS[service.category] || '#ff9900';
  const providerColor = PROVIDER_COLORS[service.provider] || '#ffffff';

  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        position: 'relative',
        borderColor: selected ? providerColor : 'rgba(255,255,255,0.1)'
      }}
    >
      {/* Provider Accent Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: providerColor,
        borderRadius: '8px 8px 0 0',
        opacity: 0.8
      }} />

      {/* Delete button */}
      <button
        className="node-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          setNodes((nodes) => nodes.filter((n) => n.id !== id));
          setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
        }}
      >
        <X size={12} />
      </button>

      <Handle type="target" position={Position.Top}  style={{ background: providerColor, width: '8px', height: '8px' }} />
      <Handle type="target" position={Position.Left} style={{ background: providerColor, width: '8px', height: '8px' }} />

      <div className="node-icon" style={{ color: providerColor }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div className="node-label">{data.label || service.name}</div>
      <div className="node-cost" style={{ fontSize: '9px', opacity: 0.6 }}>
        {service.provider.toUpperCase()}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: providerColor, width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Right}  style={{ background: providerColor, width: '8px', height: '8px' }} />

      {/* Hover Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '260px',
          background: 'rgba(10, 15, 30, 0.97)',
          border: `1px solid ${providerColor}55`,
          borderRadius: '10px',
          padding: '12px 14px',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${providerColor}22`,
          backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.15s ease',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ color: providerColor, display: 'flex', alignItems: 'center' }}>
              <Icon size={16} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{service.name}</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '20px',
              background: `${providerColor}22`,
              color: providerColor,
              border: `1px solid ${providerColor}44`,
              whiteSpace: 'nowrap',
            }}>{service.provider.toUpperCase()}</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.75rem', color: '#c0c8d8', lineHeight: 1.55, margin: '0 0 10px 0' }}>
            {service.description}
          </p>

          {/* Cost Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Base Multiplier</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: providerColor }}>
              {service.isSnowflake ? 'CALC_DYNAMIC' : `$${service.monthlyCost.toFixed(2)}/mo`}
            </span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '-7px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: `7px solid ${providerColor}55`,
          }} />
        </div>
      )}
    </div>
  );
};
