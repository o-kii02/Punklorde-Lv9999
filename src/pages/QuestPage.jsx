import { useState, useMemo } from 'react';
import { useDailyQuests } from '../hooks/useDailyQuests';
import { useGame } from '../context/GameContext';
import { STATUS_META, STATUS_ORDER } from '../constants/statusConfig';
import { DIFFICULTY_EXP } from '../constants/questConfig';
import PcSidebar from '../components/layout/PcSidebar';

const DIFFICULTY_LABELS = ['', '軽め', 'やや軽い', '普通', 'きつい', '超ハード'];

function DifficultyStars({ difficulty }) {
  return (
    <span style={{ color: '#f0c060', fontSize: 11 }}>
      {'★'.repeat(difficulty)}{'☆'.repeat(5 - difficulty)}
    </span>
  );
}

function QuestCard({ quest, onToggle, onDelete }) {
  const meta = STATUS_META[quest.category] ?? {};
  const exp = DIFFICULTY_EXP[quest.difficulty] ?? 0;
  const expired = quest.expiresAt !== undefined && quest.expiresAt !== null && quest.expiresAt < Date.now();

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(13,20,32,0.85)',
        border: `1px solid ${quest.isCompleted ? '#22c55e66' : 'rgba(0,212,255,0.25)'}`,
        opacity: quest.isCompleted || expired ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <span
            className="font-bold text-sm leading-tight"
            style={{ color: quest.isCompleted ? '#22c55e' : '#e8edf5', fontFamily: 'Noto Sans JP, sans-serif' }}
          >
            {quest.isCompleted && '✓ '}{quest.title}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(quest.id)}
            className="text-xs shrink-0"
            style={{ color: '#7a8fa6' }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}
        >
          {meta.name}
        </span>
        <DifficultyStars difficulty={quest.difficulty} />
        <span className="text-xs" style={{ color: '#4fc3f7' }}>+{exp} EXP</span>
        {expired && <span className="text-xs" style={{ color: '#ef4444' }}>期限切れ</span>}
        {quest.expiresAt !== undefined && quest.expiresAt !== null && !expired && (
          <span className="text-xs" style={{ color: '#7a8fa6' }}>
            期限: {new Date(quest.expiresAt).toLocaleDateString('ja-JP')}
          </span>
        )}
      </div>

      {!expired && onToggle && (
        <button
          onClick={() => onToggle(quest.id)}
          className="mt-1 w-full py-2 rounded text-xs font-bold tracking-widest transition-all"
          style={{
            background: quest.isCompleted ? 'rgba(34,197,94,0.08)' : 'rgba(0,212,255,0.1)',
            border: quest.isCompleted ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(0,212,255,0.4)',
            color: quest.isCompleted ? '#22c55e' : '#00d4ff',
            fontFamily: 'Rajdhani, monospace',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = quest.isCompleted ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.2)';
            e.currentTarget.style.boxShadow = quest.isCompleted ? '0 0 8px #ef4444' : '0 0 8px #00d4ff';
            e.currentTarget.style.color = quest.isCompleted ? '#ef4444' : '#00d4ff';
            e.currentTarget.style.borderColor = quest.isCompleted ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.4)';
            if (quest.isCompleted) e.currentTarget.textContent = '✕ 取り消す';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = quest.isCompleted ? 'rgba(34,197,94,0.08)' : 'rgba(0,212,255,0.1)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = quest.isCompleted ? '#22c55e' : '#00d4ff';
            e.currentTarget.style.borderColor = quest.isCompleted ? 'rgba(34,197,94,0.3)' : 'rgba(0,212,255,0.4)';
            if (quest.isCompleted) e.currentTarget.textContent = '✓ COMPLETED';
          }}
        >
          {quest.isCompleted ? '✓ COMPLETED' : 'COMPLETE'}
        </button>
      )}
    </div>
  );
}

function AddQuestModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', category: 'STR', difficulty: 3, expiryDays: 1 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({ ...form, expiryDays: form.expiryDays === 'null' ? null : Number(form.expiryDays) });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d1420', border: '1px solid rgba(0,212,255,0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-sm font-bold tracking-widest mb-4"
          style={{ color: '#00d4ff', fontFamily: 'Rajdhani, monospace' }}
        >
          NEW QUEST
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="クエスト名"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={{
              background: '#05080f',
              border: '1px solid rgba(0,212,255,0.3)',
              color: '#e8edf5',
            }}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#7a8fa6' }}>ステータス</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{ background: '#05080f', border: '1px solid rgba(0,212,255,0.3)', color: '#e8edf5' }}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].name} ({s})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: '#7a8fa6' }}>
                難易度 — {DIFFICULTY_LABELS[form.difficulty]}（+{DIFFICULTY_EXP[form.difficulty]} EXP）
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: Number(e.target.value) }))}
                className="w-full"
                style={{ accentColor: '#00d4ff' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#7a8fa6' }}>期限</label>
            <div className="flex gap-2 flex-wrap">
              {[{ label: '1日', value: '1' }, { label: '3日', value: '3' }, { label: '1週間', value: '7' }, { label: '期限なし', value: 'null' }].map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, expiryDays: value }))}
                  className="px-3 py-1 rounded text-xs"
                  style={{
                    background: String(form.expiryDays) === value ? 'rgba(0,212,255,0.2)' : 'transparent',
                    border: `1px solid ${String(form.expiryDays) === value ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                    color: String(form.expiryDays) === value ? '#00d4ff' : '#7a8fa6',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 py-2 rounded font-bold tracking-widest text-sm"
            style={{
              background: 'rgba(0,212,255,0.15)',
              border: '1px solid rgba(0,212,255,0.5)',
              color: '#00d4ff',
              fontFamily: 'Rajdhani, monospace',
            }}
          >
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuestPage() {
  const { addExp } = useGame();
  const {
    randomQuests,
    customQuests,
    toggleRandomQuest,
    clearDailyQuests,
    toggleCustomQuest,
    clearCustomQuests,
    addCustomQuest,
    deleteCustomQuest,
    randomCompletedCount,
    allRandomDone,
  } = useDailyQuests(addExp);

  const [tab, setTab] = useState('daily');
  const [showModal, setShowModal] = useState(false);

  const todayRewardExp = useMemo(() => {
    return customQuests.filter((q) => q.isCompleted).reduce((s, q) => s + (DIFFICULTY_EXP[q.difficulty] ?? 0), 0);
  }, [customQuests]);

  const questContent = (tab, showAddBtn = true) => (
    <>
      {tab === 'daily' && (
        <div className="flex flex-col gap-3">
          {randomQuests.map((q) => <QuestCard key={q.id} quest={q} onToggle={toggleRandomQuest} />)}
          <button
            onClick={clearDailyQuests}
            disabled={randomCompletedCount === 0}
            className="mt-2 w-full py-3 rounded-lg text-sm font-bold tracking-widest transition-all"
            style={{
              background: randomCompletedCount > 0 ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.03)',
              border: `1px solid ${randomCompletedCount > 0 ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`,
              color: randomCompletedCount > 0 ? '#00d4ff' : '#3a5060',
              fontFamily: 'Rajdhani, monospace',
              boxShadow: randomCompletedCount > 0 ? '0 0 12px rgba(0,212,255,0.15)' : 'none',
              cursor: randomCompletedCount > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            QUESTS CLEAR ({randomCompletedCount}/{randomQuests.length})
          </button>
        </div>
      )}
      {tab === 'custom' && (
        <div className="flex flex-col gap-3">
          {showAddBtn && (
            <button onClick={() => setShowModal(true)} className="w-full py-3 rounded-lg text-sm font-bold tracking-widest"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px dashed rgba(0,212,255,0.35)', color: '#00d4ff', fontFamily: 'Rajdhani, monospace' }}>
              ＋ 新しいクエストを追加
            </button>
          )}
          {customQuests.length === 0
            ? <p className="text-center text-xs mt-6" style={{ color: '#7a8fa6' }}>クエストがありません</p>
            : customQuests.map((q) => <QuestCard key={q.id} quest={q} onToggle={toggleCustomQuest} onDelete={deleteCustomQuest} />)
          }
          {customQuests.length > 0 && (
            <button
              onClick={clearCustomQuests}
              disabled={customQuests.filter((q) => q.isCompleted).length === 0}
              className="mt-2 w-full py-3 rounded-lg text-sm font-bold tracking-widest transition-all"
              style={{
                background: customQuests.filter((q) => q.isCompleted).length > 0 ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.03)',
                border: `1px solid ${customQuests.filter((q) => q.isCompleted).length > 0 ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`,
                color: customQuests.filter((q) => q.isCompleted).length > 0 ? '#00d4ff' : '#3a5060',
                fontFamily: 'Rajdhani, monospace',
                boxShadow: customQuests.filter((q) => q.isCompleted).length > 0 ? '0 0 12px rgba(0,212,255,0.15)' : 'none',
                cursor: customQuests.filter((q) => q.isCompleted).length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              QUESTS CLEAR ({customQuests.filter((q) => q.isCompleted).length}/{customQuests.length})
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
    {/* SP レイアウト */}
    <div
      className="lg:hidden min-h-screen pb-24 pt-4 px-4"
      style={{ background: '#05080f', color: '#e8edf5' }}
    >
      {/* ヘッダー */}
      <div className="mb-4">
        <h1
          className="text-lg font-bold tracking-widest"
          style={{ color: '#00d4ff', fontFamily: 'Rajdhani, Orbitron, monospace', textShadow: '0 0 12px #00d4ff' }}
        >
          QUEST
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#7a8fa6' }}>
          {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
        </p>
      </div>

      {/* タブ */}
      <div
        className="flex rounded-lg mb-4 p-0.5"
        style={{ background: 'rgba(13,20,32,0.6)', border: '1px solid rgba(0,212,255,0.2)' }}
      >
        {[{ id: 'daily', label: 'デイリー' }, { id: 'custom', label: 'マイクエスト' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-2 rounded text-xs font-bold tracking-widest transition-all"
            style={{
              background: tab === id ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: tab === id ? '#00d4ff' : '#7a8fa6',
              border: tab === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
              fontFamily: 'Rajdhani, monospace',
            }}
          >
            {label}
            {id === 'daily' && (
              <span className="ml-1.5 text-[10px]" style={{ color: tab === id ? '#00d4ff' : '#7a8fa6' }}>
                {randomCompletedCount}/{randomQuests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* デイリー / マイクエスト */}
      {questContent(tab)}

      {showModal && <AddQuestModal onClose={() => setShowModal(false)} onAdd={addCustomQuest} />}
    </div>

    {/* PC レイアウト */}
    <div className="hidden lg:flex h-screen overflow-hidden" style={{ background: '#05080f', color: '#e8edf5' }}>
      <PcSidebar />

      <main className="flex-1 overflow-y-auto" style={{ borderRight: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="px-6 py-4 sticky top-0 z-20"
          style={{ background: 'rgba(13,20,32,0.95)', borderBottom: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}>
          <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>// QUEST LOG</div>
          <h1 className="text-2xl font-black tracking-wider" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>QUEST</h1>
          <p className="text-xs mt-0.5" style={{ color: '#7a8fa6' }}>
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>

        <div className="px-6 py-4">
          {/* タブ */}
          <div className="flex rounded-lg mb-4 p-0.5"
            style={{ background: 'rgba(13,20,32,0.6)', border: '1px solid rgba(0,212,255,0.2)' }}>
            {[{ id: 'daily', label: 'デイリー' }, { id: 'custom', label: 'マイクエスト' }].map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 py-2 rounded text-xs font-bold tracking-widest transition-all"
                style={{
                  background: tab === id ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: tab === id ? '#00d4ff' : '#7a8fa6',
                  border: tab === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                  fontFamily: 'Rajdhani, monospace',
                }}>
                {label}
                {id === 'daily' && (
                  <span className="ml-1.5 text-[10px]">{randomCompletedCount}/{randomQuests.length}</span>
                )}
              </button>
            ))}
          </div>
          {questContent(tab)}
        </div>

        {showModal && <AddQuestModal onClose={() => setShowModal(false)} onAdd={addCustomQuest} />}
      </main>

      {/* 右パネル: QUEST STATUS */}
      <aside className="shrink-0 flex flex-col overflow-y-auto"
        style={{ width: 280, background: 'rgba(10,15,24,0.95)', borderLeft: '1px solid rgba(0,212,255,0.12)' }}>
        <div className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-3 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
            <span className="text-[9px] tracking-widest font-bold"
              style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.7)' }}>QUEST STATUS</span>
          </div>
        </div>

        {/* デイリー進捗 */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="text-[8px] tracking-widest mb-2"
            style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>DAILY PROGRESS</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>
              {randomCompletedCount}
            </span>
            <span className="text-lg font-bold mb-0.5" style={{ color: '#7a8fa6' }}>/ {randomQuests.length}</span>
          </div>
          <div className="h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${randomQuests.length ? (randomCompletedCount / randomQuests.length) * 100 : 0}%`,
                background: allRandomDone ? '#22c55e' : '#00d4ff',
                boxShadow: `0 0 6px ${allRandomDone ? '#22c55e' : '#00d4ff'}`,
              }} />
          </div>
          {allRandomDone && (
            <p className="text-[9px] mt-2 font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#22c55e' }}>
              ALL COMPLETE ✓
            </p>
          )}
        </div>

        {/* 今日の獲得EXP */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="text-[8px] tracking-widest mb-2"
            style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>TODAY'S REWARD</div>
          <div className="px-3 py-3 rounded text-center"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <span className="text-2xl font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff', textShadow: '0 0 12px #00d4ff' }}>
              +{todayRewardExp}
            </span>
            <span className="text-xs ml-1.5" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.6)' }}>EXP</span>
          </div>
        </div>

        {/* マイクエスト件数 */}
        <div className="px-4 py-4">
          <div className="text-[8px] tracking-widest mb-2"
            style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>MY QUESTS</div>
          <div className="flex flex-col gap-2">
            {[
              { label: '登録数', value: customQuests.length },
              { label: '達成済み', value: customQuests.filter((q) => q.isCompleted).length },
              { label: '期限切れ間近', value: customQuests.filter((q) => q.expiresAt && q.expiresAt - Date.now() < 86400000 * 2 && !q.isCompleted).length },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-3 py-2 rounded"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <span className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>{label}</span>
                <span className="text-sm font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
    </>
  );
}
