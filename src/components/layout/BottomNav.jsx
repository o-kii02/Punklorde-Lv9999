import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',        label: 'STATUS',  icon: '◈' },
  { to: '/record',  label: 'RECORD',  icon: '✦' },
  { to: '/quest',   label: 'QUEST',   icon: '⬡' },
  { to: '/records', label: 'LOG',     icon: '≡' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 lg:hidden"
      style={{
        background: 'rgba(8,12,22,0.95)',
        borderTop: '1px solid rgba(0,212,255,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className="flex flex-col items-center gap-0.5 flex-1 py-2 relative transition-all"
          style={({ isActive }) => ({
            color: isActive ? '#00d4ff' : '#7a8fa6',
            textShadow: isActive ? '0 0 12px #00d4ff' : 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <span className="text-lg leading-none" style={{ fontFamily: 'Orbitron, monospace' }}>{icon}</span>
              <span className="text-[9px] tracking-widest font-bold" style={{ fontFamily: 'Rajdhani, Orbitron, monospace' }}>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-12 h-[2px] rounded-full"
                  style={{ backgroundColor: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
