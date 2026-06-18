import { motion } from 'framer-motion';
import ExpBar from '../common/ExpBar';
import { STATUS_META } from '../../constants/statusConfig';
import { expToLevel, expProgress, getCurrentTitle } from '../../lib/expCalc';

export default function StatusCard({ category, exp, index }) {
  const meta = STATUS_META[category];
  const lv = expToLevel(exp);
  const progress = expProgress(exp);
  const title = getCurrentTitle(category, lv);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`rounded-xl border p-3 flex flex-col gap-2 ${meta.bg} ${meta.border}`}
      style={{ borderWidth: 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <span className={`font-bold text-sm ${meta.tailwind}`}>{meta.name}</span>
        </div>
        <span
          className="font-display font-bold text-lg"
          style={{ color: meta.color, fontFamily: 'Orbitron, sans-serif' }}
        >
          Lv{lv}
        </span>
      </div>
      <p className="text-xs text-[#9090a8] truncate">{title}</p>
      <div>
        <ExpBar progress={progress} color={meta.color} height={5} />
        <p className="text-right text-xs text-[#9090a8] mt-1">{exp} EXP</p>
      </div>
    </motion.div>
  );
}
