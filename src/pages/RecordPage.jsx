import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { STATUS_ORDER, STATUS_META, SKILL_PRESETS } from '../constants/statusConfig';
import { getCustomSkills, addCustomSkill } from '../lib/mockStorage';
import PcSidebar from '../components/layout/PcSidebar';

const DIFFICULTY_LABELS = ['', '軽め', 'やや軽い', '普通', 'きつい', '超ハード'];
const DIFFICULTY_EXP    = [0, 10, 25, 50, 100, 200];

const COUNT_CONFIG = {
  STR: { label: '回数', unit: '回',  placeholder: '例: 30' },
  DEX: { label: '回数', unit: '回',  placeholder: '例: 10' },
  INT: { label: '時間', unit: '分',  placeholder: '例: 30' },
  CHA: { label: '時間', unit: '分',  placeholder: '例: 60' },
  MEN: { label: '時間', unit: '分',  placeholder: '例: 20' },
  WEA: { label: '金額', unit: '円',  placeholder: '例: 1500' },
};

const fieldVar = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.32 } }),
};

function FieldLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-1 h-3 rounded-full inline-block" style={{ background: '#00d4ff', boxShadow: '0 0 5px #00d4ff' }} />
      <span className="text-[9px] tracking-widest font-bold uppercase"
        style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.7)' }}>
        {children}
      </span>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(13,20,32,0.9)',
  border: '1px solid rgba(0,212,255,0.2)',
  color: '#e8edf5',
  caretColor: '#00d4ff',
  outline: 'none',
  borderRadius: 6,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: 'Noto Sans JP, sans-serif',
};

function fmt(n) {
  return n.toLocaleString('ja-JP');
}

export default function RecordPage() {
  const { records, addRecord, editRecord, financeRecords, addFinanceRecord, removeFinanceRecord, weaFinanceExp } = useGame();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  const [activeTab, setActiveTab] = useState('record');

  // ── 活動記録フォーム state ──
  const [category,      setCategory]      = useState('STR');
  const [skillName,     setSkillName]     = useState('');
  const [difficulty,    setDifficulty]    = useState(3);
  const [count,         setCount]         = useState('');
  const [action,        setAction]        = useState('');
  const [isFirstTime,   setIsFirstTime]   = useState(false);
  const [flash,         setFlash]         = useState(null);
  const [customSkills,  setCustomSkills]  = useState(() => getCustomSkills());
  const [addingSkill,   setAddingSkill]   = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  // ── 財力フォーム state ──
  const [finType,     setFinType]     = useState('expense');
  const [finAmount,   setFinAmount]   = useState('');
const [finMemo,     setFinMemo]     = useState('');
  const [finDate,     setFinDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [finFlash,    setFinFlash]    = useState(false);

  // 編集モード：既存レコードをプリフィル
  useEffect(() => {
    if (!editId) return;
    const r = records.find((r) => r.id === editId);
    if (!r) return;
    setCategory(r.category ?? 'STR');
    setSkillName(r.skillName ?? '');
    setDifficulty(r.difficulty ?? 3);
    setCount(r.count != null ? String(r.count) : '');
    setAction(r.action ?? '');
    setIsFirstTime(r.isFirstTime ?? false);
  }, [editId, records]);

  // ── 財力：月次集計 ──
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const currentMonthRecords = useMemo(
    () => [...financeRecords]
      .filter((r) => r.date?.startsWith(currentMonthStr))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [financeRecords, currentMonthStr]
  );

  const monthIncome  = useMemo(() => currentMonthRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),  [currentMonthRecords]);
  const monthExpense = useMemo(() => currentMonthRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0), [currentMonthRecords]);
  const monthSurplus = monthIncome - monthExpense;
  const monthExp     = monthSurplus > 0 ? Math.floor(monthSurplus / 1000) : 0;

  const past3Months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7);
      const recs = financeRecords.filter((r) => r.date?.startsWith(mStr));
      const income  = recs.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = recs.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      return { mStr, income, expense, surplus: income - expense };
    });
  }, [financeRecords]);

  // ── ハンドラ：活動記録 ──
  const countCfg = COUNT_CONFIG[category] ?? COUNT_CONFIG.STR;

  const handleCategoryChange = (key) => {
    setCategory(key);
    setCount('');
    setSkillName('');
    setAddingSkill(false);
    setNewSkillInput('');
  };

  const getSkillsForCategory = (cat) => {
    const presets = SKILL_PRESETS[cat] ?? [];
    const custom  = customSkills[cat] ?? [];
    return [...new Set([...presets, ...custom])];
  };

  const handleAddSkill = () => {
    const name = newSkillInput.trim();
    if (!name) return;
    addCustomSkill(category, name);
    const updated = getCustomSkills();
    setCustomSkills(updated);
    setSkillName(name);
    setAddingSkill(false);
    setNewSkillInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillName.trim() || !action.trim()) return;
    const formData = {
      category,
      skillName: skillName.trim(),
      action: action.trim(),
      difficulty,
      count: count ? Number(count) : null,
      countUnit: countCfg.unit,
      isFirstTime,
    };
    const expGained = isEdit ? editRecord(editId, formData) : addRecord(formData);
    setFlash({ exp: expGained });
    setTimeout(() => navigate('/records'), 1400);
  };

  const totalPreviewExp = DIFFICULTY_EXP[difficulty] + (isFirstTime ? 50 : 0);
  const previewExp = useMemo(() => DIFFICULTY_EXP[difficulty] + (isFirstTime ? 50 : 0), [difficulty, isFirstTime]);

  // ── ハンドラ：財力 ──
  const handleFinanceSubmit = (e) => {
    e.preventDefault();
    if (!finAmount) return;
    addFinanceRecord({
      type: finType,
      amount: Number(finAmount),
      memo: finMemo.trim(),
      date: finDate,
    });
    setFinAmount('');
    setFinMemo('');
    setFinDate(new Date().toISOString().slice(0, 10));
    setFinFlash(true);
    setTimeout(() => setFinFlash(false), 1500);
  };

  const catMeta = STATUS_META[category];

  // ── タブバー ──
  const tabBarJSX = (
    !isEdit && (
      <div className="flex gap-1 mb-5">
        {[
          { id: 'record',  label: '活動記録' },
          { id: 'finance', label: '💰 財力' },
        ].map(({ id, label }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className="px-4 py-2 text-xs font-bold rounded tracking-wider transition-all"
              style={{
                fontFamily: 'Orbitron, monospace',
                background:  active ? 'rgba(0,212,255,0.12)' : 'rgba(13,20,32,0.8)',
                border:      `1px solid ${active ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                color:       active ? '#00d4ff' : '#7a8fa6',
                boxShadow:   active ? '0 0 10px rgba(0,212,255,0.25)' : 'none',
              }}>
              {label}
            </button>
          );
        })}
      </div>
    )
  );

  // ── 財力フォーム（SP・PC共通JSX） ──
  const financeFormJSX = (
    <form onSubmit={handleFinanceSubmit} className="flex flex-col gap-4">

      {/* 収入 / 支出 トグル */}
      <div>
        <FieldLabel>種別</FieldLabel>
        <div className="flex gap-2">
          {[
            { id: 'income',  label: '収入', color: '#22c55e' },
            { id: 'expense', label: '支出', color: '#ef4444' },
          ].map(({ id, label, color }) => {
            const active = finType === id;
            return (
              <button key={id} type="button" onClick={() => setFinType(id)}
                className="flex-1 py-2.5 text-sm font-black rounded transition-all"
                style={{
                  fontFamily: 'Rajdhani, Orbitron, monospace',
                  background: active ? `${color}18` : 'rgba(13,20,32,0.8)',
                  border:     `1px solid ${active ? color : 'rgba(0,212,255,0.15)'}`,
                  color:      active ? color : '#7a8fa6',
                  boxShadow:  active ? `0 0 10px ${color}40` : 'none',
                }}>
                {id === 'income' ? '＋' : '－'} {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 金額 */}
      <div>
        <FieldLabel>金額（円）</FieldLabel>
        <div className="relative">
          <input type="text" inputMode="numeric" value={finAmount} onChange={(e) => setFinAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="例: 3000" required
            style={{ ...inputStyle, width: '100%', paddingRight: 36 }} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
            style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>¥</span>
        </div>
      </div>

      {/* 日付 */}
      <div>
        <FieldLabel>日付</FieldLabel>
        <input type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)}
          style={{ ...inputStyle, width: '100%', colorScheme: 'dark' }} />
      </div>

      {/* メモ */}
      <div>
        <FieldLabel>メモ <span style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP', textTransform: 'none', letterSpacing: 0 }}>— 任意</span></FieldLabel>
        <input type="text" value={finMemo} onChange={(e) => setFinMemo(e.target.value)}
          placeholder="例: スーパーで購入"
          style={{ ...inputStyle, width: '100%' }} />
      </div>

      {/* 登録ボタン */}
      <button type="submit"
        className="w-full py-4 font-black text-base uppercase tracking-widest rounded mt-1"
        style={{
          fontFamily: 'Rajdhani, Orbitron, monospace',
          background: 'rgba(240,192,96,0.1)',
          border:     '1.5px solid #f0c060',
          color:      '#f0c060',
          boxShadow:  '0 0 20px rgba(240,192,96,0.2), inset 0 0 16px rgba(240,192,96,0.06)',
          letterSpacing: '0.15em',
        }}>
        ✦ 収支を記録する
      </button>
    </form>
  );

  // ── 月次サマリーカード ──
  const monthlySummaryJSX = (
    <div className="rounded-lg overflow-hidden"
      style={{ background: 'rgba(13,20,32,0.85)', border: '1px solid rgba(0,212,255,0.25)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.04)' }}>
        <span className="w-1 h-3 rounded-full" style={{ background: '#f0c060', boxShadow: '0 0 5px #f0c060' }} />
        <span className="text-[9px] tracking-widest font-bold"
          style={{ fontFamily: 'Orbitron, monospace', color: '#f0c060' }}>
          {currentMonthStr.replace('-', '年')}月 SUMMARY
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px]" style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP' }}>収入</span>
          <span className="text-sm font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#22c55e' }}>
            ＋¥{fmt(monthIncome)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px]" style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP' }}>支出</span>
          <span className="text-sm font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#ef4444' }}>
            －¥{fmt(monthExpense)}
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(0,212,255,0.1)', paddingTop: 8, marginTop: 2 }}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold" style={{ color: '#e8edf5', fontFamily: 'Noto Sans JP' }}>収支</span>
            <span className="text-base font-black"
              style={{
                fontFamily: 'Rajdhani, Orbitron, monospace',
                color: monthSurplus >= 0 ? '#22c55e' : '#ef4444',
                textShadow: monthSurplus >= 0 ? '0 0 8px #22c55e80' : '0 0 8px #ef444480',
              }}>
              {monthSurplus >= 0 ? '＋' : '－'}¥{fmt(Math.abs(monthSurplus))}
            </span>
          </div>
          {monthExp > 0 && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[10px]" style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP' }}>獲得EXP</span>
              <span className="text-xs font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#f0c060' }}>
                +{monthExp} EXP
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── 当月記録リスト ──
  const financeListJSX = (
    <div className="mt-4 flex flex-col gap-2">
      <div className="text-[8px] tracking-widest mb-1"
        style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>
        TODAY'S MONTH RECORDS ({currentMonthRecords.length})
      </div>
      {currentMonthRecords.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: '#7a8fa6' }}>まだ記録がありません</p>
      ) : (
        currentMonthRecords.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded"
            style={{ background: 'rgba(13,20,32,0.8)', border: '1px solid rgba(0,212,255,0.12)' }}>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold" style={{ fontFamily: 'Orbitron, monospace', color: r.type === 'income' ? '#22c55e' : '#ef4444' }}>
                  {r.type === 'income' ? '＋' : '－'}
                </span>
                <span className="text-xs font-bold truncate" style={{ color: '#e8edf5', fontFamily: 'Noto Sans JP' }}>{r.category}</span>
                {r.memo && <span className="text-[10px] truncate" style={{ color: '#7a8fa6' }}>{r.memo}</span>}
              </div>
              <span className="text-[9px] mt-0.5" style={{ color: '#4a5a6a', fontFamily: 'Orbitron, monospace' }}>{r.date}</span>
            </div>
            <span className="text-sm font-black shrink-0"
              style={{
                fontFamily: 'Rajdhani, Orbitron, monospace',
                color: r.type === 'income' ? '#22c55e' : '#ef4444',
              }}>
              ¥{fmt(r.amount)}
            </span>
            <button type="button" onClick={() => removeFinanceRecord(r.id)}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs transition-all"
              style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef444466' }}>
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
    {/* ════════════════════ SP レイアウト ════════════════════ */}
    <div className="lg:hidden flex flex-col pb-24 max-w-lg mx-auto w-full relative"
      style={{ background: '#05080f', minHeight: '100svh', color: '#e8edf5' }}>

      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ background: 'rgba(13,20,32,0.9)', borderBottom: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded text-sm"
          style={{ border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
          ‹
        </button>
        <div>
          <div className="text-[8px] tracking-widest"
            style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>
            {isEdit ? '// EDIT RECORD' : '// EXP ACQUISITION'}
          </div>
          <h1 className="text-xl font-black leading-none tracking-wider"
            style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>
            {isEdit ? '記録を編集' : '記録を残す'}
          </h1>
        </div>

        {activeTab === 'record' && (
          <div className="ml-auto px-3 py-1.5 rounded text-right"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>PREVIEW</div>
            <div className="text-lg font-black leading-tight"
              style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff', textShadow: '0 0 10px #00d4ff80' }}>
              +{totalPreviewExp}<span className="text-xs ml-1" style={{ color: '#7a8fa6' }}>EXP</span>
            </div>
          </div>
        )}
        {activeTab === 'finance' && (
          <div className="ml-auto px-3 py-1.5 rounded text-right"
            style={{ background: 'rgba(240,192,96,0.08)', border: '1px solid rgba(240,192,96,0.25)' }}>
            <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>WEA EXP</div>
            <div className="text-lg font-black leading-tight"
              style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#f0c060', textShadow: '0 0 10px #f0c06080' }}>
              {weaFinanceExp}<span className="text-xs ml-1" style={{ color: '#7a8fa6' }}>EXP</span>
            </div>
          </div>
        )}
      </div>

      {/* タブバー */}
      <div className="px-4 pt-4">
        {tabBarJSX}
      </div>

      {/* ── 活動記録タブ ── */}
      {activeTab === 'record' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pt-2">

          {/* ステータス選択 */}
          <motion.div custom={0} variants={fieldVar} initial="hidden" animate="visible">
            <FieldLabel>ステータス</FieldLabel>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_ORDER.filter((k) => k !== 'WEA').map((key) => {
                const meta = STATUS_META[key];
                const active = category === key;
                return (
                  <button key={key} type="button" onClick={() => handleCategoryChange(key)}
                    className="py-2.5 flex flex-col items-center gap-1 rounded text-xs font-bold transition-all"
                    style={{
                      background: active ? `${meta.color}18` : 'rgba(13,20,32,0.8)',
                      border:     `1px solid ${active ? meta.color : 'rgba(0,212,255,0.15)'}`,
                      color:      active ? meta.color : '#7a8fa6',
                      boxShadow:  active ? `0 0 10px ${meta.color}40` : 'none',
                    }}>
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-[9px] font-black tracking-wide" style={{ fontFamily: 'Orbitron, monospace' }}>{key}</span>
                    <span className="text-[9px]">{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 技能選択 */}
          <motion.div custom={1} variants={fieldVar} initial="hidden" animate="visible">
            <FieldLabel>技能</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {getSkillsForCategory(category).map((skill) => {
                const active = skillName === skill;
                const meta = STATUS_META[category];
                return (
                  <button key={skill} type="button" onClick={() => setSkillName(active ? '' : skill)}
                    className="px-3 py-1.5 rounded text-xs font-bold transition-all"
                    style={{
                      background: active ? `${meta.color}20` : 'rgba(13,20,32,0.8)',
                      border:     `1px solid ${active ? meta.color : 'rgba(0,212,255,0.2)'}`,
                      color:      active ? meta.color : '#7a8fa6',
                      boxShadow:  active ? `0 0 8px ${meta.color}40` : 'none',
                      fontFamily: 'Noto Sans JP, sans-serif',
                    }}>
                    {skill}
                  </button>
                );
              })}
              {addingSkill ? (
                <div className="flex items-center gap-1">
                  <input autoFocus type="text" value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } if (e.key === 'Escape') setAddingSkill(false); }}
                    placeholder="技能名を入力" className="px-2 py-1.5 rounded text-xs"
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: 12, width: 120 }} />
                  <button type="button" onClick={handleAddSkill} className="px-2 py-1.5 rounded text-xs font-bold"
                    style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff' }}>追加</button>
                  <button type="button" onClick={() => setAddingSkill(false)} className="px-2 py-1.5 rounded text-xs"
                    style={{ color: '#7a8fa6', border: '1px solid rgba(255,255,255,0.1)' }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingSkill(true)}
                  className="px-3 py-1.5 rounded text-xs font-bold transition-all"
                  style={{ background: 'transparent', border: '1px dashed rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.6)' }}>
                  ＋ 追加
                </button>
              )}
            </div>
            {!skillName && <p className="text-[10px] mt-1.5" style={{ color: '#ef444499' }}>技能を選択してください</p>}
          </motion.div>

          {/* 難易度 */}
          <motion.div custom={2} variants={fieldVar} initial="hidden" animate="visible">
            <FieldLabel>難易度</FieldLabel>
            <div className="flex gap-1.5 mb-1.5">
              {[1,2,3,4,5].map((d) => {
                const active = difficulty >= d;
                return (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className="flex-1 py-2 rounded text-sm font-black transition-all"
                    style={{
                      background: active ? 'rgba(0,212,255,0.12)' : 'rgba(13,20,32,0.8)',
                      border:     `1px solid ${active ? '#00d4ff' : 'rgba(0,212,255,0.15)'}`,
                      color:      active ? '#00d4ff' : '#7a8fa6',
                      boxShadow:  active ? '0 0 8px rgba(0,212,255,0.3)' : 'none',
                      fontFamily: 'Rajdhani, Orbitron, monospace',
                    }}>{d}</button>
                );
              })}
            </div>
            <p className="text-[10px] tracking-wider"
              style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.6)' }}>
              {DIFFICULTY_LABELS[difficulty]} — +{DIFFICULTY_EXP[difficulty]} EXP
            </p>
          </motion.div>

          {/* カテゴリ別カウント */}
          <motion.div custom={3} variants={fieldVar} initial="hidden" animate="visible">
            <FieldLabel>
              {countCfg.label}
              <span style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP', textTransform: 'none', letterSpacing: 0 }}>
                {' '}（{countCfg.unit}） — 任意
              </span>
            </FieldLabel>
            <div className="relative">
              <input type="number" value={count} onChange={(e) => setCount(e.target.value)}
                placeholder={countCfg.placeholder} min={1}
                style={{ ...inputStyle, width: '100%', paddingRight: 52 }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>
                {countCfg.unit}
              </span>
            </div>
          </motion.div>

          {/* 何をしたか */}
          <motion.div custom={4} variants={fieldVar} initial="hidden" animate="visible">
            <FieldLabel>何をしたか</FieldLabel>
            <textarea value={action} onChange={(e) => setAction(e.target.value)}
              placeholder="例: ベンチプレス30回3セット" required rows={3}
              style={{ ...inputStyle, resize: 'none', width: '100%' }} />
          </motion.div>

          {/* 初挑戦トグル */}
          <motion.div custom={5} variants={fieldVar} initial="hidden" animate="visible">
            <button type="button" onClick={() => setIsFirstTime((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between rounded transition-all"
              style={{
                background: isFirstTime ? 'rgba(0,212,255,0.1)' : 'rgba(13,20,32,0.8)',
                border:     `1px solid ${isFirstTime ? '#00d4ff' : 'rgba(0,212,255,0.15)'}`,
                boxShadow:  isFirstTime ? '0 0 12px rgba(0,212,255,0.25)' : 'none',
              }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: isFirstTime ? '#00d4ff' : '#7a8fa6', boxShadow: isFirstTime ? '0 0 6px #00d4ff' : 'none' }} />
                <span className="text-sm" style={{ color: isFirstTime ? '#00d4ff' : '#7a8fa6' }}>初挑戦ボーナス</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded font-bold"
                style={{
                  fontFamily: 'Rajdhani, Orbitron, monospace',
                  background: isFirstTime ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color:      isFirstTime ? '#00d4ff' : '#7a8fa6',
                  border:     `1px solid ${isFirstTime ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                {isFirstTime ? '+50 EXP' : 'OFF'}
              </span>
            </button>
          </motion.div>

          {/* 登録ボタン */}
          <motion.button custom={6} variants={fieldVar} initial="hidden" animate="visible"
            whileTap={{ scale: 0.97 }} type="submit"
            className="w-full py-4 font-black text-base uppercase tracking-widest rounded mt-1"
            style={{
              fontFamily: 'Rajdhani, Orbitron, monospace',
              background: isEdit ? 'rgba(240,192,96,0.1)' : 'rgba(0,212,255,0.12)',
              border:     `1.5px solid ${isEdit ? '#f0c060' : '#00d4ff'}`,
              color:      isEdit ? '#f0c060' : '#00d4ff',
              boxShadow:  isEdit
                ? '0 0 20px rgba(240,192,96,0.2), inset 0 0 16px rgba(240,192,96,0.06)'
                : '0 0 20px rgba(0,212,255,0.25), inset 0 0 16px rgba(0,212,255,0.06)',
              letterSpacing: '0.15em',
            }}>
            {isEdit ? '✦ 記録を更新する' : '✦ 経験値を獲得する'}
          </motion.button>
        </form>
      )}

      {/* ── 財力タブ ── */}
      {activeTab === 'finance' && (
        <div className="flex flex-col gap-5 px-4 pt-2">
          {monthlySummaryJSX}
          {financeFormJSX}
          {financeListJSX}
        </div>
      )}

      {/* フラッシュ（活動記録） */}
      <AnimatePresence>
        {flash && (
          <motion.div key="flash"
            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.15 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            style={{ background: 'rgba(5,8,15,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="px-12 py-10 flex flex-col items-center gap-3 rounded-lg"
              style={{
                background: 'rgba(13,20,32,0.95)',
                border:     `1.5px solid ${isEdit ? '#f0c060' : '#00d4ff'}`,
                boxShadow:  isEdit ? '0 0 40px rgba(240,192,96,0.3)' : '0 0 40px rgba(0,212,255,0.35), inset 0 0 24px rgba(0,212,255,0.08)',
              }}>
              <div className="text-[9px] tracking-widest"
                style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.6)' }}>
                {isEdit ? 'RECORD UPDATED' : 'EXP ACQUIRED'}
              </div>
              <div className="text-5xl font-black leading-none"
                style={{
                  fontFamily: 'Rajdhani, Orbitron, monospace',
                  color: isEdit ? '#f0c060' : '#00d4ff',
                  textShadow: isEdit ? '0 0 24px #f0c060' : '0 0 24px #00d4ff',
                }}>
                {isEdit ? '✓' : `+${flash.exp}`}
              </div>
              {!isEdit && <div className="text-sm font-bold" style={{ color: '#7a8fa6' }}>EXP</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フラッシュ（財力登録） */}
      <AnimatePresence>
        {finFlash && (
          <motion.div key="finflash"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg"
            style={{
              background: 'rgba(13,20,32,0.95)',
              border: '1.5px solid #f0c060',
              boxShadow: '0 0 24px rgba(240,192,96,0.4)',
              color: '#f0c060',
              fontFamily: 'Rajdhani, Orbitron, monospace',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '0.1em',
            }}>
            ✦ 収支を記録しました
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* ════════════════════ PC レイアウト ════════════════════ */}
    <div className="hidden lg:flex h-screen overflow-hidden" style={{ background: '#05080f', color: '#e8edf5' }}>
      <PcSidebar />

      {/* 中央：フォーム */}
      <main className="flex-1 overflow-y-auto flex justify-center" style={{ borderRight: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="w-full max-w-lg py-6 px-6">

          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>
                {isEdit ? '// EDIT RECORD' : '// EXP ACQUISITION'}
              </div>
              <h1 className="text-2xl font-black tracking-wider" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#e8edf5' }}>
                {isEdit ? '記録を編集' : '記録を残す'}
              </h1>
            </div>
            {activeTab === 'record' && (
              <div className="ml-auto px-3 py-1.5 rounded text-right"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
                <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>PREVIEW</div>
                <div className="text-lg font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff', textShadow: '0 0 10px #00d4ff80' }}>
                  +{totalPreviewExp}<span className="text-xs ml-1" style={{ color: '#7a8fa6' }}>EXP</span>
                </div>
              </div>
            )}
            {activeTab === 'finance' && (
              <div className="ml-auto px-3 py-1.5 rounded text-right"
                style={{ background: 'rgba(240,192,96,0.08)', border: '1px solid rgba(240,192,96,0.25)' }}>
                <div className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>WEA EXP</div>
                <div className="text-lg font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#f0c060', textShadow: '0 0 10px #f0c06080' }}>
                  {weaFinanceExp}<span className="text-xs ml-1" style={{ color: '#7a8fa6' }}>EXP</span>
                </div>
              </div>
            )}
          </div>

          {/* タブバー */}
          {tabBarJSX}

          {/* 活動記録フォーム（PCバージョン） */}
          {activeTab === 'record' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* ステータス選択 */}
              <div>
                <FieldLabel>ステータス</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_ORDER.filter((k) => k !== 'WEA').map((key) => {
                    const meta = STATUS_META[key];
                    const active = category === key;
                    return (
                      <button key={key} type="button" onClick={() => handleCategoryChange(key)}
                        className="py-2.5 flex flex-col items-center gap-1 rounded text-xs font-bold transition-all"
                        style={{
                          background: active ? `${meta.color}18` : 'rgba(13,20,32,0.8)',
                          border: `1px solid ${active ? meta.color : 'rgba(0,212,255,0.15)'}`,
                          color: active ? meta.color : '#7a8fa6',
                          boxShadow: active ? `0 0 10px ${meta.color}40` : 'none',
                        }}>
                        <span className="text-base">{meta.icon}</span>
                        <span className="text-[9px] font-black tracking-wide" style={{ fontFamily: 'Orbitron, monospace' }}>{key}</span>
                        <span className="text-[9px]">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 技能選択 */}
              <div>
                <FieldLabel>技能</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {getSkillsForCategory(category).map((skill) => {
                    const active = skillName === skill;
                    const meta = STATUS_META[category];
                    return (
                      <button key={skill} type="button" onClick={() => setSkillName(active ? '' : skill)}
                        className="px-3 py-1.5 rounded text-xs font-bold transition-all"
                        style={{
                          background: active ? `${meta.color}20` : 'rgba(13,20,32,0.8)',
                          border: `1px solid ${active ? meta.color : 'rgba(0,212,255,0.2)'}`,
                          color: active ? meta.color : '#7a8fa6',
                          boxShadow: active ? `0 0 8px ${meta.color}40` : 'none',
                          fontFamily: 'Noto Sans JP, sans-serif',
                        }}>
                        {skill}
                      </button>
                    );
                  })}
                  {addingSkill ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus type="text" value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } if (e.key === 'Escape') setAddingSkill(false); }}
                        placeholder="技能名を入力" className="px-2 py-1.5 rounded text-xs"
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: 12, width: 120 }} />
                      <button type="button" onClick={handleAddSkill} className="px-2 py-1.5 rounded text-xs font-bold"
                        style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff' }}>追加</button>
                      <button type="button" onClick={() => setAddingSkill(false)} className="px-2 py-1.5 rounded text-xs"
                        style={{ color: '#7a8fa6', border: '1px solid rgba(255,255,255,0.1)' }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAddingSkill(true)} className="px-3 py-1.5 rounded text-xs font-bold transition-all"
                      style={{ background: 'transparent', border: '1px dashed rgba(0,212,255,0.3)', color: 'rgba(0,212,255,0.6)' }}>
                      ＋ 追加
                    </button>
                  )}
                </div>
                {!skillName && <p className="text-[10px] mt-1.5" style={{ color: '#ef444499' }}>技能を選択してください</p>}
              </div>

              {/* 難易度 */}
              <div>
                <FieldLabel>難易度</FieldLabel>
                <div className="flex gap-1.5 mb-1.5">
                  {[1,2,3,4,5].map((d) => {
                    const active = difficulty >= d;
                    return (
                      <button key={d} type="button" onClick={() => setDifficulty(d)}
                        className="flex-1 py-2 rounded text-sm font-black transition-all"
                        style={{
                          background: active ? 'rgba(0,212,255,0.12)' : 'rgba(13,20,32,0.8)',
                          border: `1px solid ${active ? '#00d4ff' : 'rgba(0,212,255,0.15)'}`,
                          color: active ? '#00d4ff' : '#7a8fa6',
                          boxShadow: active ? '0 0 8px rgba(0,212,255,0.3)' : 'none',
                          fontFamily: 'Rajdhani, Orbitron, monospace',
                        }}>{d}</button>
                    );
                  })}
                </div>
                <p className="text-[10px] tracking-wider" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.6)' }}>
                  {DIFFICULTY_LABELS[difficulty]} — +{DIFFICULTY_EXP[difficulty]} EXP
                </p>
              </div>

              {/* カウント */}
              <div>
                <FieldLabel>
                  {countCfg.label}
                  <span style={{ color: '#7a8fa6', fontFamily: 'Noto Sans JP', textTransform: 'none', letterSpacing: 0 }}> （{countCfg.unit}） — 任意</span>
                </FieldLabel>
                <div className="relative">
                  <input type="number" value={count} onChange={(e) => setCount(e.target.value)}
                    placeholder={countCfg.placeholder} min={1}
                    style={{ ...inputStyle, width: '100%', paddingRight: 52 }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                    style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>{countCfg.unit}</span>
                </div>
              </div>

              {/* 何をしたか */}
              <div>
                <FieldLabel>何をしたか</FieldLabel>
                <textarea value={action} onChange={(e) => setAction(e.target.value)}
                  placeholder="例: ベンチプレス30回3セット" required rows={3}
                  style={{ ...inputStyle, resize: 'none', width: '100%' }} />
              </div>

              {/* 初挑戦トグル */}
              <button type="button" onClick={() => setIsFirstTime((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between rounded transition-all"
                style={{
                  background: isFirstTime ? 'rgba(0,212,255,0.1)' : 'rgba(13,20,32,0.8)',
                  border: `1px solid ${isFirstTime ? '#00d4ff' : 'rgba(0,212,255,0.15)'}`,
                  boxShadow: isFirstTime ? '0 0 12px rgba(0,212,255,0.25)' : 'none',
                }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full"
                    style={{ background: isFirstTime ? '#00d4ff' : '#7a8fa6', boxShadow: isFirstTime ? '0 0 6px #00d4ff' : 'none' }} />
                  <span className="text-sm" style={{ color: isFirstTime ? '#00d4ff' : '#7a8fa6' }}>初挑戦ボーナス</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded font-bold"
                  style={{
                    fontFamily: 'Rajdhani, Orbitron, monospace',
                    background: isFirstTime ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: isFirstTime ? '#00d4ff' : '#7a8fa6',
                    border: `1px solid ${isFirstTime ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {isFirstTime ? '+50 EXP' : 'OFF'}
                </span>
              </button>

              {/* 登録ボタン */}
              <button type="submit"
                className="w-full py-4 font-black text-base uppercase tracking-widest rounded mt-1"
                style={{
                  fontFamily: 'Rajdhani, Orbitron, monospace',
                  background: isEdit ? 'rgba(240,192,96,0.1)' : 'rgba(0,212,255,0.12)',
                  border: `1.5px solid ${isEdit ? '#f0c060' : '#00d4ff'}`,
                  color: isEdit ? '#f0c060' : '#00d4ff',
                  boxShadow: isEdit
                    ? '0 0 20px rgba(240,192,96,0.2), inset 0 0 16px rgba(240,192,96,0.06)'
                    : '0 0 20px rgba(0,212,255,0.25), inset 0 0 16px rgba(0,212,255,0.06)',
                  letterSpacing: '0.15em',
                }}>
                {isEdit ? '✦ 記録を更新する' : '✦ 経験値を獲得する'}
              </button>
            </form>
          )}

          {/* 財力タブ（PCメインエリア） */}
          {activeTab === 'finance' && (
            <div className="flex flex-col gap-5">
              {financeFormJSX}
              {financeListJSX}
            </div>
          )}
        </div>
      </main>

      {/* 右パネル */}
      <aside className="shrink-0 flex flex-col overflow-y-auto"
        style={{ width: 260, background: 'rgba(10,15,24,0.95)', borderLeft: '1px solid rgba(0,212,255,0.12)' }}>

        {/* 活動記録タブの右パネル */}
        {activeTab === 'record' && (
          <>
            <div className="px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,212,255,0.03)' }}>
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
                <span className="text-[9px] tracking-widest font-bold"
                  style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.7)' }}>EXP CALCULATOR</span>
              </div>
            </div>

            <div className="px-4 py-4 flex flex-col gap-1.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
              {[1,2,3,4,5].map((d) => {
                const active = difficulty === d;
                return (
                  <div key={d} className="flex items-center justify-between px-3 py-2 rounded transition-all"
                    style={{
                      background: active ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.03)',
                      border: `1px solid ${active ? '#00d4ff' : 'rgba(0,212,255,0.1)'}`,
                      boxShadow: active ? '0 0 8px rgba(0,212,255,0.2)' : 'none',
                    }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold" style={{ fontFamily: 'Orbitron, monospace', color: active ? '#00d4ff' : '#7a8fa6' }}>Lv{d}</span>
                      <span className="text-[9px]" style={{ color: active ? '#e8edf5' : '#7a8fa6' }}>{DIFFICULTY_LABELS[d]}</span>
                    </div>
                    <span className="text-sm font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: active ? '#00d4ff' : '#4a5a6a' }}>
                      +{DIFFICULTY_EXP[d]}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-3 py-2 rounded mt-1"
                style={{ background: 'rgba(240,192,96,0.06)', border: '1px solid rgba(240,192,96,0.2)' }}>
                <span className="text-[8px] font-bold tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: '#f0c060' }}>FIRST BONUS</span>
                <span className="text-sm font-black" style={{ fontFamily: 'Rajdhani, monospace', color: '#f0c060' }}>+50</span>
              </div>
            </div>

            <div className="px-4 py-5">
              <div className="text-[8px] tracking-widest mb-3" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>TOTAL PREVIEW</div>
              <div className="text-center py-4 rounded"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <div className="text-4xl font-black"
                  style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#00d4ff', textShadow: '0 0 16px #00d4ff' }}>
                  +{previewExp}
                </div>
                <div className="text-[9px] mt-1" style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(0,212,255,0.5)' }}>EXP</div>
              </div>
            </div>
          </>
        )}

        {/* 財力タブの右パネル */}
        {activeTab === 'finance' && (
          <>
            <div className="px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(240,192,96,0.03)' }}>
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 rounded-full" style={{ background: '#f0c060', boxShadow: '0 0 6px #f0c060' }} />
                <span className="text-[9px] tracking-widest font-bold"
                  style={{ fontFamily: 'Orbitron, monospace', color: '#f0c06099' }}>WEALTH TRACKER</span>
              </div>
            </div>

            <div className="px-4 py-4 flex flex-col gap-3">
              {monthlySummaryJSX}

              {/* 過去3ヶ月 */}
              <div>
                <div className="text-[8px] tracking-widest mb-2"
                  style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>PAST 3 MONTHS</div>
                <div className="flex flex-col gap-1.5">
                  {past3Months.map(({ mStr, income, expense, surplus }) => (
                    <div key={mStr} className="px-3 py-2 rounded"
                      style={{ background: 'rgba(13,20,32,0.8)', border: '1px solid rgba(0,212,255,0.1)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#7a8fa6' }}>
                          {mStr.replace('-', '/')}
                        </span>
                        <span className="text-xs font-black"
                          style={{
                            fontFamily: 'Rajdhani, Orbitron, monospace',
                            color: surplus >= 0 ? '#22c55e' : '#ef4444',
                          }}>
                          {surplus >= 0 ? '+' : ''}¥{fmt(surplus)}
                        </span>
                      </div>
                      {(income > 0 || expense > 0) && (
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px]" style={{ color: '#22c55e66' }}>↑¥{fmt(income)}</span>
                          <span className="text-[9px]" style={{ color: '#ef444466' }}>↓¥{fmt(expense)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 累計 WEA EXP */}
              <div className="px-3 py-3 rounded text-center"
                style={{ background: 'rgba(240,192,96,0.06)', border: '1px solid rgba(240,192,96,0.2)' }}>
                <div className="text-[8px] tracking-widest mb-1" style={{ fontFamily: 'Orbitron, monospace', color: '#f0c06099' }}>TOTAL WEA EXP</div>
                <div className="text-2xl font-black" style={{ fontFamily: 'Rajdhani, Orbitron, monospace', color: '#f0c060', textShadow: '0 0 12px #f0c06080' }}>
                  {weaFinanceExp}
                </div>
                <div className="text-[9px] mt-0.5" style={{ fontFamily: 'Orbitron, monospace', color: '#f0c06066' }}>EXP</div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
    </>
  );
}
