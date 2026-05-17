'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useScout } from '@/context/ScoutContext';

// ─── Íconos SVG inline ────────────────────────────────────────────────────────
const IconLineup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const IconTracking = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconStats = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="13" width="3" height="5" fill="currentColor" stroke="none" />
    <rect x="11" y="9" width="3" height="9" fill="currentColor" stroke="none" />
    <rect x="15" y="6" width="3" height="12" fill="currentColor" stroke="none" />
  </svg>
);

const IconReporte = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const NAV_ITEMS = [
  { href: '/',          label: 'Line-Up',  Icon: IconLineup   },
  { href: '/tracking',  label: 'Tracking', Icon: IconTracking },
  { href: '/stats',     label: 'Stats',    Icon: IconStats    },
  { href: '/reporte',   label: 'Reporte',  Icon: IconReporte  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { estado } = useScout();

  const partidoInfo = estado.partido;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          Mi<span>Scout</span>
        </div>
        {partidoInfo && (
          <div className="app-header__info">
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              vs {partidoInfo.rival}
            </div>
            <div>
              Inning {estado.inningActual} &nbsp;·&nbsp;{' '}
              {new Date(partidoInfo.fecha).toLocaleDateString('es-AR')}
            </div>
          </div>
        )}
        {!partidoInfo && (
          <div className="app-header__info">
            <div style={{ fontStyle: 'italic' }}>Sin partido activo</div>
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main className="app-main">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <button
              key={href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(href)}
              aria-label={label}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
