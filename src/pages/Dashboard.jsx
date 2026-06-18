import { useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { expToLevel, expProgress, getCurrentTitle, levelToRequiredExp } from '../lib/expCalc';
import { getCharacterStage } from '../constants/characterStages';
import { STATUS_ORDER, STATUS_META, SKILL_PRESETS } from '../constants/statusConfig';
import { getCustomSkills } from '../lib/mockStorage';
import { useDailyQuests } from '../hooks/useDailyQuests';
import PcSidebar from '../components/layout/PcSidebar';

const DISPLAY_STATUS = STATUS_ORDER;

const NAV_ITEMS = [
  { label: 'STATUS',  icon: '◈', to: '/' },
  { label: 'RECORD',  icon: '✦', to: '/record' },
  { label: 'QUEST',   icon: '⬡', to: '/quest' },
  { label: 'LOG',     icon: '≡', to: '/records' },
];

const HOLO_STYLE = `
  @keyframes ring-cw    { to { transform: rotate(360deg); } }
  @keyframes ring-ccw   { to { transform: rotate(-360deg); } }
  @keyframes scan-y     { 0%,100%{ top:10%; opacity:0.6; } 50%{ top:85%; opacity:0.2; } }
  @keyframes pulse-c    { 0%,100%{ opacity:0.5; transform:scale(1); } 50%{ opacity:1; transform:scale(1.12); } }
  @keyframes data-blink { 0%,100%{ opacity:0.7; } 50%{ opacity:0.2; } }
  @keyframes holo-scan  { 0%{ top:-30%; } 100%{ top:110%; } }
  @keyframes holo-flicker {
    0%,89%,91%,93%,100% { opacity:1; }
    90%  { opacity:0.55; }
    92%  { opacity:0.82; }
    92.5%{ opacity:0.4; }
    93%  { opacity:0.9; }
  }
  @keyframes holo-glitch {
    0%,88%,100%       { clip-path: none; transform: translateX(0); }
    89%               { clip-path: inset(20% 0 60% 0); transform: translateX(-3px); }
    89.5%             { clip-path: inset(50% 0 20% 0); transform: translateX(3px); }
    90%               { clip-path: none; transform: translateX(0); }
  }
  @keyframes holo-rgb {
    0%,88%,100% { text-shadow: none; filter: none; }
    89%         { filter: drop-shadow(-2px 0 rgba(255,0,80,0.7)) drop-shadow(2px 0 rgba(0,212,255,0.7)); }
    89.5%       { filter: none; }
  }
  .ring-cw       { animation: ring-cw    12s linear infinite; }
  .ring-ccw      { animation: ring-ccw    8s linear infinite; }
  .scan-y        { animation: scan-y      3s ease-in-out infinite; }
  .pulse-c       { animation: pulse-c    2.5s ease-in-out infinite; }
  .blink         { animation: data-blink 1.8s ease-in-out infinite; }
  .holo-scan-bar { animation: holo-scan    4s linear infinite; }
  .holo-flicker  { animation: holo-flicker 6s ease-in-out infinite; }
  .holo-glitch   { animation: holo-glitch  7s ease-in-out infinite; }
  .holo-rgb      { animation: holo-rgb     7s ease-in-out infinite; }
`;

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1 h-3 rounded-full shrink-0"
        style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
      <span className="text-[9px] tracking-widest font-bold"
        style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.7)' }}>
        {children}
      </span>
    </div>
  );
}

function HoloRing({ size = 160 }) {
  const outer      = size;
  const inner      = Math.round(size * 0.74);
  const glow       = Math.round(size * 0.44);
  const r          = outer / 2;
  const outerRing1 = Math.round(size * 1.35);
  const outerRing2 = Math.round(size * 1.65);
  const containerSize = outerRing2 + 40;

  return (
    <div className="relative flex items-center justify-center"
      style={{ width: containerSize, height: containerSize }}>

      {/* ── 外側大リング（キャラより外に出て見える） ── */}
      <div className="ring-ccw absolute rounded-full" style={{
        width: outerRing2, height: outerRing2,
        border: '1px dashed rgba(0,212,255,0.09)',
        borderTopColor: 'rgba(0,212,255,0.28)',
        animationDuration: '32s',
      }} />
      <div className="ring-cw absolute rounded-full" style={{
        width: outerRing1, height: outerRing1,
        border: '1px dotted rgba(0,212,255,0.18)',
        borderTopColor: 'rgba(0,212,255,0.50)',
        animationDuration: '20s',
      }} />

      {/* ── リング群（キャラの後ろ z-0） ── */}
      <div className="ring-cw absolute" style={{
        width: outer, height: outer, borderRadius: '50%',
        border: '1px solid rgba(0,212,255,0.35)',
        borderTopColor: '#00d4ff', borderRightColor: 'transparent',
      }} />
      <div className="ring-ccw absolute" style={{
        width: inner, height: inner, borderRadius: '50%',
        border: '1px dashed rgba(0,212,255,0.25)',
      }} />
      <div className="pulse-c absolute" style={{
        width: glow, height: glow, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%)',
        boxShadow: '0 0 24px rgba(0,212,255,0.25), 0 0 48px rgba(0,212,255,0.08)',
      }} />
      {[0, 90, 180, 270].map((deg) => (
        <div key={deg} className="absolute" style={{
          width: 6, height: 6, top: '50%', left: '50%',
          transform: `rotate(${deg}deg) translateX(${r}px) translateY(-3px)`,
          background: '#00d4ff', boxShadow: '0 0 6px #00d4ff',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }} />
      ))}


      {/* スキャンライン（リング上・最前面） */}
      <div className="scan-y absolute" style={{
        width: 1, height: Math.round(size * 0.175), left: '50%', marginLeft: -0.5, zIndex: 20,
        background: 'linear-gradient(to bottom, transparent, #00d4ff, transparent)',
        boxShadow: '0 0 6px #00d4ff',
      }} />
    </div>
  );
}

function StatusAccordion({ category, exp, skillExp, index }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[category];
  const lv = expToLevel(exp);
  const title = getCurrentTitle(category, lv);
  const prog = expProgress(exp);

  const skills = useMemo(() => {
    const presets = SKILL_PRESETS[category] ?? [];
    const custom = getCustomSkills()[category] ?? [];
    return [...new Set([...presets, ...custom])];
  }, [category]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}
    >
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: open ? 'rgba(0,212,255,0.03)' : 'transparent' }}>
        <div className="w-9 h-9 shrink-0 flex items-center justify-center text-[10px] font-black rounded"
          style={{ fontFamily: 'Orbitron, monospace', color: meta.color,
            border: `1px solid ${meta.color}50`, background: `${meta.color}12` }}>
          {category}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: '#e8edf5' }}>{meta.name}</span>
            <span className="text-[9px] tracking-wide" style={{ color: meta.color, opacity: 0.8 }}>{title}</span>
          </div>
          <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(prog * 100, 100)}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 + 0.1 }} />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="text-right">
            <span className="text-xl font-black leading-none"
              style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: meta.color }}>{lv}</span>
            <div className="text-[8px] text-[#7a8fa6] tracking-widest">LV</div>
          </div>
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}
            style={{ color: 'rgba(0,212,255,0.5)', fontSize: 10, lineHeight: 1 }}>▶</motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="skills"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-3 pt-1 flex flex-col gap-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {category === 'WEA' ? (
                <p className="text-[10px]" style={{ color: '#7a8fa6' }}>EXPは収支の黒字から自動付与されます</p>
              ) : skills.length === 0 ? (
                <p className="text-[10px]" style={{ color: '#7a8fa6' }}>技能が登録されていません</p>
              ) : skills.map((skill) => {
                const sExp = skillExp[`${category}::${skill}`] ?? 0;
                const sLv = expToLevel(sExp);
                const sProg = expProgress(sExp);
                return (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="text-[10px] w-1 shrink-0" style={{ color: 'rgba(0,212,255,0.3)' }}>└</span>
                    <span className="text-[11px] flex-1 min-w-0 truncate"
                      style={{ color: '#9ab0c4', fontFamily: 'Noto Sans JP, sans-serif' }}>{skill}</span>
                    <div className="w-16 h-[2px] rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${Math.min(sProg * 100, 100)}%`, background: meta.color, opacity: 0.7 }} />
                    </div>
                    <span className="text-[10px] font-black w-8 text-right shrink-0"
                      style={{ fontFamily: 'Rajdhani, monospace', color: meta.color }}>Lv{sLv}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   PC専用サブコンポーネント
══════════════════════════════════════════════ */

function QuestCheckItem({ quest, onToggle }) {
  return (
    <motion.li layout onClick={() => onToggle(quest.id)}
      className="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer select-none"
      style={{
        background: quest.isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(0,212,255,0.04)',
        border: `1px solid ${quest.isCompleted ? 'rgba(34,197,94,0.25)' : 'rgba(0,212,255,0.12)'}`,
      }} whileTap={{ scale: 0.97 }}>
      <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
        style={{ border: `1.5px solid ${quest.isCompleted ? '#22c55e' : 'rgba(0,212,255,0.35)'}`,
          background: quest.isCompleted ? 'rgba(34,197,94,0.2)' : 'transparent',
          boxShadow: quest.isCompleted ? '0 0 6px rgba(34,197,94,0.5)' : 'none' }}>
        <AnimatePresence>
          {quest.isCompleted && (
            <motion.svg key="check"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
              width="10" height="10" viewBox="0 0 12 12"
              fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs flex-1 truncate"
        style={{ color: quest.isCompleted ? '#22c55e' : '#9ab0c4',
          textDecoration: quest.isCompleted ? 'line-through' : 'none', opacity: quest.isCompleted ? 0.7 : 1 }}>
        {quest.title ?? quest.label}
      </span>
      <span className="text-[9px] tracking-widest shrink-0"
        style={{ fontFamily: 'Orbitron, monospace', color: quest.isCompleted ? '#22c55e' : 'rgba(0,212,255,0.25)' }}>
        {quest.isCompleted ? 'DONE' : '----'}
      </span>
    </motion.li>
  );
}

function ClearButton({ checkedCount, total, onClick }) {
  const active = checkedCount > 0;
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className="mt-2 w-full py-2 rounded text-[10px] font-bold tracking-widest transition-all"
      style={{
        background: active ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.03)',
        border: `1px solid ${active ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.12)'}`,
        color: active ? '#00d4ff' : '#3a5060',
        fontFamily: 'Rajdhani, monospace',
        boxShadow: active ? '0 0 10px rgba(0,212,255,0.15)' : 'none',
        cursor: active ? 'pointer' : 'not-allowed',
      }}
    >
      QUESTS CLEAR ({checkedCount}/{total})
    </button>
  );
}

function PcQuestList({ quests, toggle, completedCount, total, onClear, customQuests, onToggleCustom, onClearCustom }) {
  return (
    <div className="flex flex-col gap-4">
      {/* DAILY QUEST */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>DAILY QUEST</SectionTitle>
          <span className="text-[10px] font-black mb-3"
            style={{ fontFamily: 'Orbitron, monospace', color: completedCount === total ? '#22c55e' : '#00d4ff' }}>
            {completedCount}/{total}
          </span>
        </div>
        <div className="h-[2px] rounded-full mb-3" style={{ background: 'rgba(0,212,255,0.1)' }}>
          <motion.div className="h-full rounded-full"
            animate={{ width: `${(completedCount / (total || 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              background: completedCount === total ? '#22c55e' : '#00d4ff',
              boxShadow: completedCount === total ? '0 0 6px #22c55e' : '0 0 6px #00d4ff',
            }} />
        </div>
        <ul className="flex flex-col gap-2">
          {quests.map((q) => (
            <QuestCheckItem key={q.id} quest={{ ...q, isCompleted: q.done }} onToggle={toggle} />
          ))}
        </ul>
        <ClearButton checkedCount={completedCount} total={total} onClick={onClear} />
      </div>

      {/* MY QUESTS */}
      <div>
        <SectionTitle>MY QUESTS</SectionTitle>
        {customQuests.length === 0 ? (
          <p className="text-[10px] text-center py-3" style={{ color: '#3a5060' }}>登録なし</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customQuests.map((q) => (
              <QuestCheckItem key={q.id} quest={q} onToggle={onToggleCustom} />
            ))}
          </ul>
        )}
        {customQuests.length > 0 && (
          <ClearButton
            checkedCount={customQuests.filter((q) => q.isCompleted).length}
            total={customQuests.length}
            onClick={onClearCustom}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   メインコンポーネント
══════════════════════════════════════════════ */
export default function Dashboard() {
  const { totalExp, totalLevel, totalProgress, statusExp, skillExp, records, addExp } = useGame();
  const navigate = useNavigate();
  const stage = getCharacterStage(totalLevel);
  const progressPct = Math.round(totalProgress * 100);
  const {
    quests,
    toggle,
    completedCount,
    total,
    clearDailyQuests,
    customQuests,
    toggleCustomQuest,
    clearCustomQuests,
  } = useDailyQuests(addExp);

  const streak = useMemo(() => {
    if (!records.length) return 0;
    return new Set(records.map((r) => new Date(r.createdAt).toDateString())).size;
  }, [records]);

  const expToNext = useMemo(() => {
    return Math.max(0, levelToRequiredExp(totalLevel + 1) - totalExp);
  }, [totalLevel, totalExp]);


  const statsData = [
    { label: 'TOTAL EXP', value: totalExp.toLocaleString() },
    { label: 'RECORDS',   value: records.length },
    { label: 'STREAK',    value: `${streak}D` },
  ];

  return (
    <div style={{ background: '#05080f', color: '#e8edf5', fontFamily: 'Noto Sans JP, sans-serif' }}>
      <style>{HOLO_STYLE}</style>

      {/* ════════════════════════════════════
          SP レイアウト（< lg）
      ════════════════════════════════════ */}
      <div className="lg:hidden min-h-svh pb-20">

        {/* ① ヘッダー */}
        <header className="px-4 pt-4 pb-4"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'rgba(5,8,15,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[8px] tracking-widest mb-1"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.4)' }}>
                // PUNK-ROAD-LV999
              </div>
              <h1 className="text-3xl font-black leading-none tracking-wider mb-1"
                style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>
                PUNK-LORD
              </h1>
              <p className="text-[10px] tracking-widest" style={{ color: '#7a8fa6' }}>{stage.label}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[8px] tracking-widest mb-0.5"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>TOTAL LEVEL</div>
              <div className="text-5xl font-black leading-none"
                style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff',
                  textShadow: '0 0 20px #00d4ff, 0 0 40px rgba(0,212,255,0.3)' }}>{totalLevel}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[8px] tracking-widest"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.4)' }}>EXP</span>
              <span className="text-[9px] font-bold"
                style={{ fontFamily: 'Rajdhani, monospace', color: 'rgba(0,212,255,0.6)' }}>{progressPct}%</span>
            </div>
            <div className="h-[3px] rounded-full" style={{ background: 'rgba(0,212,255,0.12)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.4, ease: 'easeOut' }} />
            </div>
          </div>
        </header>

        {/* ② ホログラフィック演出 */}
        <div className="relative flex justify-center"
          style={{ background: 'linear-gradient(to bottom, rgba(0,212,255,0.03), transparent)', minHeight: 220 }}>
          <HoloRing size={160} />
        </div>

        {/* ③ ナビゲーションボタン */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <SectionTitle>NAVIGATION</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {NAV_ITEMS.map(({ label, icon, to }) => {
              const isActive = to === location.pathname;
              return (
                <button key={label} onClick={() => navigate(to)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded transition-all"
                  style={{ background: isActive ? 'rgba(0,212,255,0.12)' : 'rgba(13,20,32,0.8)',
                    border: `1px solid ${isActive ? '#00d4ff' : 'rgba(0,212,255,0.18)'}`,
                    boxShadow: isActive ? '0 0 10px rgba(0,212,255,0.2)' : 'none' }}>
                  <span style={{ fontSize: 18, color: isActive ? '#00d4ff' : '#7a8fa6',
                    textShadow: isActive ? '0 0 10px #00d4ff' : 'none' }}>{icon}</span>
                  <span className="text-[9px] tracking-widest font-bold"
                    style={{ fontFamily: 'Rajdhani, Orbitron, monospace',
                      color: isActive ? '#00d4ff' : '#7a8fa6' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ④ CHARACTER STATS */}
        <div className="py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div className="px-4"><SectionTitle>CHARACTER STATS</SectionTitle></div>
          <div className="rounded-lg mx-4 overflow-hidden"
            style={{ background: 'rgba(13,20,32,0.6)', border: '1px solid rgba(0,212,255,0.18)' }}>
            {DISPLAY_STATUS.map((cat, i) => (
              <StatusAccordion key={cat} category={cat} exp={statusExp[cat] ?? 0} skillExp={skillExp} index={i} />
            ))}
          </div>
          <p className="text-center text-[9px] mt-2" style={{ color: 'rgba(0,212,255,0.3)' }}>TAP TO EXPAND SKILLS</p>
        </div>

        {/* ⑤ DAILY QUEST */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <PcQuestList quests={quests} toggle={toggle} completedCount={completedCount} total={total} onClear={clearDailyQuests} customQuests={customQuests} onToggleCustom={toggleCustomQuest} onClearCustom={clearCustomQuests} />
        </div>

        {/* ⑥ フッター統計 */}
        <div className="px-4 py-4 grid grid-cols-3 gap-2">
          {statsData.map(({ label, value }) => (
            <div key={label} className="text-center py-3 rounded"
              style={{ background: 'rgba(13,20,32,0.6)', border: '1px solid rgba(0,212,255,0.12)' }}>
              <div className="text-[8px] tracking-widest mb-1"
                style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>{label}</div>
              <div className="text-lg font-black leading-tight"
                style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff',
                  textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          PC レイアウト（>= lg）
          左サイドバー | 中央 | 右パネル
      ════════════════════════════════════ */}
      <div className="hidden lg:flex h-screen overflow-hidden">

        {/* ─── 左サイドバー（共通） ─── */}
        <PcSidebar />

        {/* ─── 中央パネル ─── */}
        <main className="flex-1 flex flex-col overflow-y-auto"
          style={{ borderRight: '1px solid rgba(0,212,255,0.1)' }}>

          {/* 上部タブバー風ヘッダー */}
          <div className="px-6 py-3 flex items-center gap-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(5,8,15,0.6)', backdropFilter: 'blur(8px)' }}>
            <span className="text-[9px] tracking-widest font-bold"
              style={{ fontFamily: 'Orbitron, monospace', color: '#00d4ff',
                borderBottom: '2px solid #00d4ff', paddingBottom: 4 }}>
              STATUS
            </span>
            {['RECORD', 'QUEST', 'LOG'].map((t) => (
              <span key={t} className="text-[9px] tracking-widest font-bold cursor-pointer"
                style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}
                onClick={() => navigate(`/${t.toLowerCase()}`)}>
                {t}
              </span>
            ))}
            <div className="ml-auto text-[9px] tracking-widest blink"
              style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.4)' }}>
              SYS::ONLINE
            </div>
          </div>

          {/* ホログラフィックリング（大） */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.04) 0%, transparent 70%)' }}>
            {/* 背景グリッド線 */}
            {[20, 40, 60, 80].map((pct) => (
              <div key={pct} className="absolute left-0 right-0" style={{
                top: `${pct}%`, height: 1,
                background: `linear-gradient(to right, transparent, rgba(0,212,255,0.05), transparent)`,
              }} />
            ))}
            {[20, 40, 60, 80].map((pct) => (
              <div key={pct} className="absolute top-0 bottom-0" style={{
                left: `${pct}%`, width: 1,
                background: `linear-gradient(to bottom, transparent, rgba(0,212,255,0.04), transparent)`,
              }} />
            ))}
            <HoloRing size={280} />
          </div>

          {/* EXP バー + ステータスバッジ */}
          <div className="px-6 py-3 shrink-0"
            style={{ borderTop: '1px solid rgba(0,212,255,0.08)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="flex items-center gap-3 mb-2.5">
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, color: '#7a8fa6', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
                NEXT LV
              </span>
              <div className="flex-1 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff, 0 0 12px rgba(0,212,255,0.4)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
              <span style={{ fontFamily: 'Rajdhani, monospace', fontSize: 11, color: '#4fc3f7', whiteSpace: 'nowrap' }}>
                {expToNext.toLocaleString()} EXP
              </span>
            </div>
          </div>

          {/* CHARACTER STATS */}
          <div className="shrink-0 px-4 py-2"
            style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,212,255,0.03)' }}>
            <SectionTitle>CHARACTER STATS</SectionTitle>
          </div>
          <div className="flex-1 overflow-y-auto">
            {DISPLAY_STATUS.map((cat, i) => (
              <StatusAccordion key={cat} category={cat} exp={statusExp[cat] ?? 0} skillExp={skillExp} index={i} />
            ))}
          </div>
        </main>

        {/* ─── 右パネル DAILY QUEST ─── */}
        <aside className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: 280, background: 'rgba(10,15,24,0.95)',
            borderLeft: '1px solid rgba(0,212,255,0.12)' }}>

          <div className="px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
            <SectionTitle>DAILY QUEST</SectionTitle>
          </div>

          <div className="px-4 py-4 flex-1 overflow-y-auto">
            <PcQuestList quests={quests} toggle={toggle} completedCount={completedCount} total={total} onClear={clearDailyQuests} customQuests={customQuests} onToggleCustom={toggleCustomQuest} onClearCustom={clearCustomQuests} />
          </div>

          <div className="px-4 py-3 shrink-0"
            style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
            <div className="text-[8px] tracking-widest blink text-center"
              style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.25)' }}>
              PUNK-ROAD-LV999 // v0.1.0
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
