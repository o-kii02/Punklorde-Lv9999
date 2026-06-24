import { useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const STYLE = `
@keyframes lu-burst {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes lu-ring-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes lu-ring-ccw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
@keyframes lu-glow-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
@keyframes lu-text-in {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
.lu-burst   { animation: lu-burst 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
.lu-ring-cw { animation: lu-ring-cw 6s linear infinite; }
.lu-ring-ccw{ animation: lu-ring-ccw 4s linear infinite; }
.lu-pulse   { animation: lu-glow-pulse 2s ease-in-out infinite; }
.lu-text    { animation: lu-text-in 0.4s 0.3s ease-out both; }
`;

export default function LevelUpModal() {
  const { levelUpQueue, dismissLevelUp } = useGame();
  const newLevel = levelUpQueue[0];

  useEffect(() => {
    if (!newLevel) return;
    const t = setTimeout(dismissLevelUp, 3500);
    return () => clearTimeout(t);
  }, [newLevel]);

  if (!newLevel) return null;

  return (
    <>
      <style>{STYLE}</style>
      {/* オーバーレイ */}
      <div
        onClick={dismissLevelUp}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* カード本体 */}
        <div
          className="lu-burst"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 300, height: 300,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* 外リング */}
          <div className="lu-ring-cw" style={{
            position: 'absolute', inset: 0,
            border: '2px solid rgba(0,212,255,0.5)',
            borderRadius: '50%',
            boxShadow: '0 0 12px rgba(0,212,255,0.4)',
          }} />
          {/* 内リング */}
          <div className="lu-ring-ccw" style={{
            position: 'absolute', inset: 24,
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '50%',
          }} />
          {/* グロー中心 */}
          <div className="lu-pulse" style={{
            position: 'absolute',
            width: 140, height: 140,
            background: 'radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          {/* テキスト群 */}
          <div className="lu-text" style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{
              fontFamily: 'Orbitron, Rajdhani, sans-serif',
              fontSize: 11,
              letterSpacing: '0.3em',
              color: '#00d4ff',
              textTransform: 'uppercase',
              textShadow: '0 0 8px #00d4ff',
              marginBottom: 6,
            }}>
              Level Up
            </div>
            <div style={{
              fontFamily: 'Orbitron, Rajdhani, sans-serif',
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: '0 0 20px #00d4ff, 0 0 40px rgba(0,212,255,0.6)',
              letterSpacing: '-2px',
            }}>
              {newLevel}
            </div>
            <div style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: 12,
              color: '#7a8fa6',
              marginTop: 8,
              letterSpacing: '0.1em',
            }}>
              タップで閉じる
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
