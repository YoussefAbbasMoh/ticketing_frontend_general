import React, { useId, useMemo } from 'react';

/**
 * Lightweight responsive line chart with soft grid and area fill (no extra deps).
 */
export default function AdminLineChart({ data, dataKey = 'value', color = '#080936', fillOpacity = 0.12 }) {
  const uid = useId().replace(/:/g, '');
  const { points, areaPoints, gridYs, viewW, viewH } = useMemo(() => {
    const w = 640;
    const h = 220;
    const padX = 10;
    const padY = 14;
    const list = Array.isArray(data) ? data : [];
    if (!list.length) {
      return { points: '', areaPoints: '', gridYs: [], viewW: w, viewH: h };
    }
    const values = list.map((d) => Number(d[dataKey]) || 0);
    const maxVal = Math.max(...values, 1);
    const n = list.length;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const pts = list
      .map((d, i) => {
        const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
        const v = Number(d[dataKey]) || 0;
        const y = padY + innerH - (v / maxVal) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
    const firstX = padX + (n === 1 ? innerW / 2 : 0);
    const lastX = padX + (n === 1 ? innerW / 2 : innerW);
    const bottomY = padY + innerH;
    const area = `${pts} ${lastX},${bottomY} ${firstX},${bottomY}`;
    const gridYs = [0.25, 0.5, 0.75].map((t) => padY + innerH * (1 - t));
    return { points: pts, areaPoints: area, gridYs, viewW: w, viewH: h };
  }, [data, dataKey]);

  if (!data?.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-app-input bg-app-surface-variant/30 text-sm text-app-text-secondary">
        No data
      </div>
    );
  }

  const gid = `admin-chart-grad-${uid}`;

  return (
    <div className="h-[260px] w-full min-w-0">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity + 0.08} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={viewW} height={viewH} fill="transparent" />
        {gridYs.map((gy, i) => (
          <line
            key={i}
            x1={10}
            y1={gy}
            x2={viewW - 10}
            y2={gy}
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="text-app-divider"
          />
        ))}
        {areaPoints ? (
          <polygon points={areaPoints} fill={`url(#${gid})`} stroke="none" />
        ) : null}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-app-text-tertiary">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
