import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { expProgress } from '../../lib/expCalc';
import { getCharacterStage } from '../../constants/characterStages';

const NAV_ITEMS = [
  { label: 'STATUS',  icon: '◈', to: '/' },
  { label: 'RECORD',  icon: '✦', to: '/record' },
  { label: 'QUEST',   icon: '⬡', to: '/quest' },
  { label: 'LOG',     icon: '≡', to: '/records' },
];

export default function PcSidebar({ statsData }) {
  const { totalExp, totalLevel, records } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const stage = getCharacterStage(totalLevel);
  const progressPct = Math.round(expProgress(totalExp) * 100);

  const defaultStats = useMemo(() => {
    const streak = records.length
      ? new Set(records.map((r) => new Date(r.createdAt).toDateString())).size
      : 0;
    return [
      { label: 'TOTAL EXP', value: totalExp.toLocaleString() },
      { label: 'RECORDS',   value: records.length },
      { label: 'STREAK',    value: `${streak}D` },
    ];
  }, [totalExp, records]);

  const stats = statsData ?? defaultStats;

  return (
    <aside
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: 220,
        background: 'rgba(8,12,22,0.97)',
        borderRight: '1px solid rgba(0,212,255,0.15)',
      }}
    >
      {/* プレイヤー情報 */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="text-[8px] tracking-widest mb-1"
          style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.35)' }}>
          // PUNK-ROAD-LV999
        </div>
        <h2 className="text-2xl font-black leading-none tracking-wider mb-1"
          style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>
          PUNK-LORD
        </h2>
        <p className="text-[10px] tracking-widest mb-3" style={{ color: '#7a8fa6' }}>
          {stage.label}
        </p>
        <div className="text-[8px] tracking-widest mb-0.5"
          style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.4)' }}>
          TOTAL LEVEL
        </div>
        <div className="text-4xl font-black leading-none mb-2"
          style={{
            fontFamily: 'Rajdhani, Orbitron, monospace',
            color: '#00d4ff',
            textShadow: '0 0 16px #00d4ff, 0 0 32px rgba(0,212,255,0.25)',
          }}>
          {totalLevel}
        </div>
        <div className="h-[2px] rounded-full" style={{ background: 'rgba(0,212,255,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="text-[9px] mt-0.5 text-right"
          style={{ fontFamily: 'Rajdhani, monospace', color: 'rgba(0,212,255,0.5)' }}>
          {progressPct}%
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(({ label, icon, to }) => {
          const isActive = to === location.pathname;
          return (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 px-5 py-3 relative transition-all text-left"
              style={{
                background: isActive ? 'rgba(0,212,255,0.07)' : 'transparent',
                color: isActive ? '#00d4ff' : '#7a8fa6',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(0,212,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                  style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}
                />
              )}
              <span style={{ fontSize: 16, textShadow: isActive ? '0 0 10px #00d4ff' : 'none' }}>{icon}</span>
              <span className="text-xs font-bold tracking-widest"
                style={{ fontFamily: 'Rajdhani, Orbitron, monospace' }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 統計 */}
      <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}>
        {stats.map(({ label, value }) => (
          <div key={label}
            className="flex items-center justify-between px-2 py-1.5 rounded"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <span className="text-[8px] tracking-widest"
              style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>{label}</span>
            <span className="text-sm font-black"
              style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
