'use client';

import { useLocale } from '@/context/LocaleContext';

interface DelayChartProps {
  stops: { name: string; delay: number }[];
  threshold: number;
}

export default function DelayChart({ stops, threshold }: DelayChartProps) {
  const { t } = useLocale();

  if (!stops || stops.length === 0) return null;

  const maxDelay = Math.max(...stops.map(s => Math.abs(s.delay)), threshold, 5);
  const W = 100;
  const barW = Math.max(Math.min(W / stops.length - 1, 14), 4);
  const H = 60;
  const baseline = H * 0.65;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
        {t('train.delayPerStop', { defaultValue: 'Delay per stop (min)' })}
      </div>
      <svg
        viewBox={`0 -5 ${W} ${H + 25}`}
        width="100%"
        style={{ maxHeight: 180, overflow: 'visible' }}
        role="img"
        aria-label="Delay chart"
      >
        {/* Baseline */}
        <line x1="0" y1={baseline} x2={W} y2={baseline} stroke="var(--border-color)" strokeWidth="0.3" />

        {/* Threshold line */}
        {threshold > 0 && (
          <>
            <line
              x1="0"
              y1={baseline - (threshold / maxDelay) * (baseline - 4)}
              x2={W}
              y2={baseline - (threshold / maxDelay) * (baseline - 4)}
              stroke="var(--status-cancelled)"
              strokeWidth="0.25"
              strokeDasharray="1.5 1"
              opacity="0.6"
            />
              <text
              x={W - 1}
              y={baseline - (threshold / maxDelay) * (baseline - 4) - 1}
              fontSize="4.5"
              fill="var(--status-cancelled)"
              textAnchor="end"
              opacity="0.8"
            >
              {threshold}m
            </text>
          </>
        )}

        {/* Bars */}
        {stops.map((stop, i) => {
          const x = (i / stops.length) * W + (barW * 0.15);
          const absDelay = Math.abs(stop.delay);
          const barH = (absDelay / maxDelay) * (baseline - 4);
          const isNeg = stop.delay < 0;
          const y = isNeg ? baseline : baseline - barH;

          let fill: string;
          if (stop.delay <= 0) fill = 'var(--status-on-time)';
          else if (stop.delay >= threshold) fill = 'var(--status-cancelled)';
          else fill = 'var(--status-delayed)';

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW * 0.7}
                height={Math.max(barH, 0.5)}
                rx="0.8"
                fill={fill}
                opacity="0.85"
              >
                <title>{stop.name}: {stop.delay > 0 ? '+' : ''}{stop.delay} min</title>
              </rect>
              {/* Station label (every other to avoid clutter) */}
              {(stops.length <= 10 || i % 2 === 0) && (
                <text
                  x={x + barW * 0.35}
                  y={H + 14}
                  fontSize="3.8"
                  fill="var(--text-secondary)"
                  textAnchor="middle"
                  transform={`rotate(-40, ${x + barW * 0.35}, ${H + 14})`}
                >
                  {stop.name.length > 8 ? stop.name.slice(0, 7) + '…' : stop.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Y-axis labels */}
        <text x="1" y={2} fontSize="4.5" fill="var(--text-secondary)">+{Math.round(maxDelay)}</text>
        <text x="1" y={baseline - 1} fontSize="4.5" fill="var(--text-secondary)">0</text>
      </svg>
    </div>
  );
}
