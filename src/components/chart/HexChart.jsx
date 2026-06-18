import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { STATUS_META, STATUS_ORDER } from '../../constants/statusConfig';
import { expToLevel } from '../../lib/expCalc';

export default function HexChart({ statusExp }) {
  const data = STATUS_ORDER.map((key) => ({
    subject: key,
    lv: Math.min(expToLevel(statusExp[key] ?? 0), 100),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="rgba(0,212,255,0.12)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={({ x, y, payload }) => {
            const meta = STATUS_META[payload.value];
            return (
              <text
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={meta?.color ?? '#7a8fa6'}
                fontSize={9}
                fontFamily="Orbitron, monospace"
                fontWeight="700"
                letterSpacing="1"
              >
                {payload.value}
              </text>
            );
          }}
        />
        <Radar
          dataKey="lv"
          stroke="#00d4ff"
          fill="#00d4ff"
          fillOpacity={0.12}
          strokeWidth={1.5}
          dot={{ r: 3, fill: '#00d4ff', stroke: '#05080f', strokeWidth: 1 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
