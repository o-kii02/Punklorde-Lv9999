import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { STATUS_META, STATUS_ORDER } from '../constants/statusConfig';
import { expToLevel, expProgress } from '../lib/expCalc';
import PcSidebar from '../components/layout/PcSidebar';

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const FALLBACK_META = { color: '#7a8fa6', icon: '◈', name: '不明' };

function ConfirmDialog({ record, onConfirm, onCancel }) {
  const meta = STATUS_META[record.category] ?? FALLBACK_META;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(5,8,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-sm rounded-lg p-6 flex flex-col gap-4"
        style={{ background: 'rgba(13,20,32,0.98)', border: '1.5px solid rgba(239,68,68,0.5)', boxShadow: '0 0 32px rgba(239,68,68,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[9px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(239,68,68,0.7)' }}>
          // CONFIRM DELETE
        </div>
        <p className="text-sm" style={{ color: '#e8edf5' }}>
          <span style={{ color: meta.color, fontWeight: 700 }}>{record.category}</span> — {record.skillName} の記録を削除しますか？
        </p>
        <p className="text-xs" style={{ color: '#7a8fa6' }}>
          「{record.action}」（{record.expGained} EXP）
        </p>
        <div className="flex gap-3 mt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded text-sm font-bold transition-all"
            style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#7a8fa6', background: 'transparent' }}>
            キャンセル
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded text-sm font-bold transition-all"
            style={{ border: '1px solid rgba(239,68,68,0.6)', color: '#ef4444', background: 'rgba(239,68,68,0.1)', boxShadow: '0 0 12px rgba(239,68,68,0.2)' }}>
            削除する
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecordsRightPanel({ records, statusExp, totalExp }) {
  const streak = useMemo(() => {
    if (!records.length) return 0;
    return new Set(records.map((r) => new Date(r.createdAt).toDateString())).size;
  }, [records]);

  const maxExp = Math.max(1, ...STATUS_ORDER.map((s) => statusExp[s] ?? 0));

  return (
    <aside className="shrink-0 flex flex-col overflow-y-auto"
      style={{ width: 280, background: 'rgba(10,15,24,0.95)', borderLeft: '1px solid rgba(0,212,255,0.12)' }}>
      <div className="px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-3 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
          <span className="text-[9px] tracking-widest font-bold"
            style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.7)' }}>STATS SUMMARY</span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
        {[
          { label: 'TOTAL EXP', value: totalExp.toLocaleString() },
          { label: 'RECORDS',   value: records.length },
          { label: 'STREAK',    value: `${streak}D` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-3 py-2 rounded"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <span className="text-[8px] tracking-widest"
              style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>{label}</span>
            <span className="text-sm font-black"
              style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-2.5">
        <div className="text-[8px] tracking-widest mb-1"
          style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>STATUS EXP</div>
        {STATUS_ORDER.map((cat) => {
          const meta = STATUS_META[cat];
          const exp = statusExp[cat] ?? 0;
          const lv = expToLevel(exp);
          const pct = Math.min((exp / maxExp) * 100, 100);
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-[9px] font-black w-8 shrink-0"
                style={{ fontFamily: 'Orbitron, monospace', color: meta.color }}>{cat}</span>
              <div className="flex-1 h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: meta.color, boxShadow: `0 0 4px ${meta.color}` }} />
              </div>
              <span className="text-[9px] font-black w-5 text-right shrink-0"
                style={{ fontFamily: 'Rajdhani, monospace', color: meta.color }}>
                {lv}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function RecordsPage() {
  const { records, removeRecord, totalExp, statusExp } = useGame();
  const navigate = useNavigate();
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.createdAt - a.createdAt),
    [records]
  );

  const categories = ['ALL', ...Object.keys(STATUS_META)];

  const filtered = useMemo(
    () => filter === 'ALL' ? sorted : sorted.filter((r) => r.category === filter),
    [sorted, filter]
  );

  const handleDelete = () => {
    if (!confirmTarget) return;
    removeRecord(confirmTarget.id);
    setConfirmTarget(null);
  };

  const spContent = (
    <div className="flex flex-col pb-24 min-h-svh lg:hidden" style={{ background: '#05080f', color: '#e8edf5' }}>

      {/* ── ヘッダー ── */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ background: 'rgba(13,20,32,0.95)', borderBottom: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div className="text-[8px] tracking-widest"
            style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>
            // ACTIVITY LOG
          </div>
          <h1 className="text-xl font-black leading-none tracking-wider"
            style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>
            記録一覧
          </h1>
        </div>
        <div className="ml-auto px-3 py-1.5 rounded"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <span className="text-[8px] tracking-widest block" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>TOTAL</span>
          <span className="text-lg font-black leading-tight"
            style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>
            {records.length}
          </span>
        </div>
      </div>

      {/* ── カテゴリフィルタ ── */}
      <div className="px-4 py-2.5 flex gap-1.5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)', scrollbarWidth: 'none' }}>
        {categories.map((cat) => {
          const meta = cat !== 'ALL' ? STATUS_META[cat] : null;
          const active = filter === cat;
          return (
            <button key={cat} onClick={() => setFilter(cat)}
              className="shrink-0 px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all"
              style={{
                fontFamily: 'Orbitron, monospace',
                background: active ? (meta ? `${meta.color}20` : 'rgba(0,212,255,0.15)') : 'rgba(13,20,32,0.8)',
                border:     `1px solid ${active ? (meta?.color ?? '#00d4ff') : 'rgba(0,212,255,0.15)'}`,
                color:      active ? (meta?.color ?? '#00d4ff') : '#7a8fa6',
                boxShadow:  active ? `0 0 8px ${meta?.color ?? '#00d4ff'}40` : 'none',
              }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── 記録リスト ── */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: '#7a8fa6' }}>
            <div className="text-3xl mb-3">◈</div>
            <p className="text-sm">記録がありません</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {filtered.map((record, i) => {
            const meta = STATUS_META[record.category] ?? FALLBACK_META;
            return (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ delay: i < 20 ? i * 0.03 : 0, duration: 0.25 }}
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(13,20,32,0.7)' }}
              >
                {/* カラーバー + メイン情報 */}
                <div className="flex items-stretch">
                  {/* 左端カラーライン */}
                  <div className="w-1 shrink-0 rounded-l-lg" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}80` }} />

                  <div className="flex-1 px-3 py-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* カテゴリバッジ */}
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{
                          fontFamily: 'Orbitron, monospace',
                          color: meta.color,
                          background: `${meta.color}18`,
                          border: `1px solid ${meta.color}40`,
                        }}>
                        {record.category}
                      </span>
                      <span className="text-xs font-bold truncate" style={{ color: '#e8edf5' }}>
                        {record.skillName}
                      </span>
                      {record.isFirstTime && (
                        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ fontFamily: 'Orbitron, monospace', color: '#f0c060', background: 'rgba(240,192,96,0.12)', border: '1px solid rgba(240,192,96,0.3)' }}>
                          FIRST
                        </span>
                      )}
                    </div>

                    <p className="text-xs mb-1.5 line-clamp-2" style={{ color: '#7a8fa6' }}>
                      {record.action}
                    </p>

                    <div className="flex items-center gap-3 text-[9px]" style={{ fontFamily: 'Orbitron, monospace' }}>
                      <span style={{ color: '#00d4ff' }}>+{record.expGained} EXP</span>
                      {record.count != null && (
                        <span style={{ color: '#7a8fa6' }}>{record.count}{record.countUnit ?? ''}</span>
                      )}
                      <span className="ml-auto" style={{ color: '#4a5a6a' }}>{formatDate(record.createdAt)}</span>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col border-l" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
                    <button
                      onClick={() => navigate(`/record?edit=${record.id}`)}
                      className="flex-1 px-3 flex items-center justify-center transition-all"
                      style={{ color: '#f0c060', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
                      title="編集"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmTarget(record)}
                      className="flex-1 px-3 flex items-center justify-center transition-all"
                      style={{ color: '#ef4444' }}
                      title="削除"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── 削除確認ダイアログ ── */}
      <AnimatePresence>
        {confirmTarget && (
          <ConfirmDialog
            record={confirmTarget}
            onConfirm={handleDelete}
            onCancel={() => setConfirmTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {spContent}

      {/* PC レイアウト */}
      <div className="hidden lg:flex h-screen overflow-hidden" style={{ background: '#05080f', color: '#e8edf5' }}>
        <PcSidebar />

        <main className="flex-1 overflow-y-auto" style={{ borderRight: '1px solid rgba(0,212,255,0.1)' }}>
          {/* ヘッダー */}
          <div className="px-6 py-4 flex items-center gap-4 sticky top-0 z-20"
            style={{ background: 'rgba(13,20,32,0.95)', borderBottom: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}>
            <div>
              <div className="text-[8px] tracking-widest"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>// ACTIVITY LOG</div>
              <h1 className="text-2xl font-black tracking-wider"
                style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>記録一覧</h1>
            </div>
            <div className="ml-auto px-4 py-2 rounded"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <span className="text-[8px] tracking-widest block" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>TOTAL</span>
              <span className="text-xl font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>{records.length}</span>
            </div>
          </div>

          {/* フィルタ */}
          <div className="px-6 py-3 flex gap-2 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(0,212,255,0.1)', scrollbarWidth: 'none' }}>
            {categories.map((cat) => {
              const meta = cat !== 'ALL' ? STATUS_META[cat] : null;
              const active = filter === cat;
              return (
                <button key={cat} onClick={() => setFilter(cat)}
                  className="shrink-0 px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    background: active ? (meta ? `${meta.color}20` : 'rgba(0,212,255,0.15)') : 'rgba(13,20,32,0.8)',
                    border:     `1px solid ${active ? (meta?.color ?? '#00d4ff') : 'rgba(0,212,255,0.15)'}`,
                    color:      active ? (meta?.color ?? '#00d4ff') : '#7a8fa6',
                    boxShadow:  active ? `0 0 8px ${meta?.color ?? '#00d4ff'}40` : 'none',
                  }}>
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 記録リスト */}
          <div className="px-6 py-4 flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="text-center py-16" style={{ color: '#7a8fa6' }}>
                <div className="text-3xl mb-3">◈</div>
                <p className="text-sm">記録がありません</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {filtered.map((record, i) => {
                const meta = STATUS_META[record.category] ?? FALLBACK_META;
                return (
                  <motion.div
                    key={record.id} layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                    transition={{ delay: i < 20 ? i * 0.03 : 0, duration: 0.25 }}
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(13,20,32,0.7)' }}
                  >
                    <div className="flex items-stretch">
                      <div className="w-1 shrink-0 rounded-l-lg"
                        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}80` }} />
                      <div className="flex-1 px-4 py-3 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                            style={{ fontFamily: 'Orbitron, monospace', color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
                            {record.category}
                          </span>
                          <span className="text-xs font-bold truncate" style={{ color: '#e8edf5' }}>{record.skillName}</span>
                          {record.isFirstTime && (
                            <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded shrink-0"
                              style={{ fontFamily: 'Orbitron, monospace', color: '#f0c060', background: 'rgba(240,192,96,0.12)', border: '1px solid rgba(240,192,96,0.3)' }}>
                              FIRST
                            </span>
                          )}
                        </div>
                        <p className="text-xs mb-1.5" style={{ color: '#7a8fa6' }}>{record.action}</p>
                        <div className="flex items-center gap-3 text-[9px]" style={{ fontFamily: 'Orbitron, monospace' }}>
                          <span style={{ color: '#00d4ff' }}>+{record.expGained} EXP</span>
                          {record.count != null && <span style={{ color: '#7a8fa6' }}>{record.count}{record.countUnit ?? ''}</span>}
                          <span className="ml-auto" style={{ color: '#4a5a6a' }}>{formatDate(record.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col border-l" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
                        <button onClick={() => navigate(`/record?edit=${record.id}`)}
                          className="flex-1 px-3 flex items-center justify-center"
                          style={{ color: '#f0c060', borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => setConfirmTarget(record)}
                          className="flex-1 px-3 flex items-center justify-center"
                          style={{ color: '#ef4444' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {confirmTarget && (
              <ConfirmDialog record={confirmTarget} onConfirm={handleDelete} onCancel={() => setConfirmTarget(null)} />
            )}
          </AnimatePresence>
        </main>

        <RecordsRightPanel records={records} statusExp={statusExp} totalExp={totalExp} />
      </div>
    </>
  );
}
