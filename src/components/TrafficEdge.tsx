import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react';

const LOAD_CONFIG = {
  high:   { color: '#ff4757', dur: '0.6s', r: 5 },
  medium: { color: '#ffa502', dur: '1.0s', r: 4 },
  low:    { color: '#4cd137', dur: '1.8s', r: 3 },
  idle:   { color: '#45f3ff', dur: '2.5s', r: 3 },
} as const;

type Load = keyof typeof LOAD_CONFIG;

export function TrafficEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, markerEnd, data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const load = (data?.load as Load) ?? 'idle';
  const cfg = LOAD_CONFIG[load];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke: cfg.color, strokeWidth: 2, opacity: 0.85 }}
      />
      {/* Moving particle along edge */}
      <circle r={cfg.r} fill={cfg.color} opacity={0.9}>
        <animateMotion dur={cfg.dur} repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
      {/* Second offset particle for high traffic */}
      {(load === 'high' || load === 'medium') && (
        <circle r={cfg.r - 1} fill={cfg.color} opacity={0.5}>
          <animateMotion dur={cfg.dur} begin={`-${parseFloat(cfg.dur) / 2}s`} repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
      {/* Hidden path for mpath reference */}
      <path id={id} d={edgePath} style={{ display: 'none' }} />
    </>
  );
}
