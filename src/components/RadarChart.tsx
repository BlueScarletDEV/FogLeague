import React from 'react';

interface RadarChartProps {
  stats: {
    chase: number;      // 0-100
    macro: number;      // 0-100
    altruism: number;   // 0-100
    lethality: number;  // 0-100
    vision: number;     // 0-100
    karma: number;      // 0-100
  };
  size?: number;
}

interface LabelDef {
  key: string;
  lines: string[];
  val: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ stats, size = 340 }) => {
  // Leave generous padding so labels never clip
  const padding = 72;
  const svgSize = size + padding * 2;
  const center = svgSize / 2;
  const radius = size / 2;

  const labels: LabelDef[] = [
    { key: 'chase',     lines: ['Poursuite', '(Chase)'],          val: stats.chase },
    { key: 'macro',     lines: ['Générateurs', '(Macro)'],        val: stats.macro },
    { key: 'altruism',  lines: ['Altruisme', '& Soins'],          val: stats.altruism },
    { key: 'lethality', lines: ['Létalité', 'Tueur'],             val: stats.lethality },
    { key: 'vision',    lines: ['Vision', 'de Jeu'],              val: stats.vision },
    { key: 'karma',     lines: ['Fair-Play', '& Sang-Froid'],     val: stats.karma },
  ];

  const totalPoints = labels.length;
  const angleStep = (Math.PI * 2) / totalPoints;

  const getPolygonPoints = (levelRatio: number) =>
    labels
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * levelRatio * Math.cos(angle);
        const y = center + radius * levelRatio * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

  const dataPolygonPoints = labels
    .map((label, i) => {
      const ratio = Math.max(0.08, Math.min(1, label.val / 100));
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * ratio * Math.cos(angle);
      const y = center + radius * ratio * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  // Compute label anchor position — push well outside the max polygon
  const getLabelPos = (i: number) => {
    const angle = i * angleStep - Math.PI / 2;
    const dist = radius * 1.32;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle),
    };
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid rings */}
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={getPolygonPoints(level)}
            fill={level === 0.25 ? 'rgba(255,85,0,0.04)' : 'none'}
            stroke={level === 1 ? '#3f3f46' : '#2A2A2E'}
            strokeWidth={level === 1 ? 1.5 : 1}
            strokeDasharray={level === 1 ? 'none' : '4 4'}
          />
        ))}

        {/* Percentage labels on rings */}
        {[25, 50, 75, 100].map((pct) => {
          const ratio = pct / 100;
          const x = center;
          const y = center - radius * ratio - 4;
          return (
            <text
              key={pct}
              x={x}
              y={y}
              fill="#52525b"
              fontSize="9"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {pct}
            </text>
          );
        })}

        {/* Axis lines */}
        {labels.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#2A2A2E"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Filled data shape */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(255, 85, 0, 0.18)"
          stroke="#FF5500"
          strokeWidth="2.5"
          filter="url(#glow)"
          style={{ transition: 'all 0.7s ease-out' }}
        />

        {/* Data vertex dots */}
        {labels.map((label, i) => {
          const ratio = Math.max(0.08, Math.min(1, label.val / 100));
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * ratio * Math.cos(angle);
          const y = center + radius * ratio * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              fill="#FF5500"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
          );
        })}

        {/* Labels — 2 lines + value */}
        {labels.map((label, i) => {
          const { x, y } = getLabelPos(i);
          const lineHeight = 13;
          const totalLines = label.lines.length + 1; // +1 for value line
          const startDy = -((totalLines - 1) / 2) * lineHeight;

          return (
            <text
              key={i}
              x={x}
              y={y}
              fontFamily="'Segoe UI', system-ui, sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label.lines.map((line, li) => (
                <tspan
                  key={li}
                  x={x}
                  dy={li === 0 ? startDy : lineHeight}
                  fill="#d4d4d8"
                  fontSize="11"
                  fontWeight="600"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {line}
                </tspan>
              ))}
              {/* Value badge */}
              <tspan
                x={x}
                dy={lineHeight}
                fill="#FF5500"
                fontSize="12"
                fontWeight="800"
              >
                {label.val}%
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};
