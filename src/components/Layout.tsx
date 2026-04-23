import React from 'react';
import { LogOut, Book } from 'lucide-react';
import UnicomerLogo from '../assets/unicomer.png';
import { Dashboard } from './Dashboard';
import { ApiDocs } from './ApiDocs';

interface LayoutProps {
    user?: any;
    signOut?: () => void;
    activeView?: string;
}

export const Layout: React.FC<LayoutProps> = ({ user, signOut, activeView }) => {
    return (
        <div className="view">
            {/* ══════════════════════ DASHBOARD VIEW ══════════════════════ */}
            <section id="dashboard-view" className="view">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="brand-mini" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={UnicomerLogo} alt="Unicomer" style={{ height: '150px', width: 'auto', objectFit: 'contain', transform: 'scale(1.2)' }} />
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Plantillas</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <a
                            href="/api-docs"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem', fontWeight: 500,
                                color: activeView === 'api-docs' ? '#fff' : 'var(--text-secondary)',
                                background: activeView === 'api-docs' ? 'linear-gradient(135deg, var(--accent), #8b5cf6)' : 'transparent',
                                textDecoration: 'none', transition: 'all 0.2s'
                            }}
                        >
                            <Book size={16} /> API Docs
                        </a>
                        {activeView === 'api-docs' && (
                            <a href="/" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 14px' }}>
                                ← Dashboard
                            </a>
                        )}
                        <div className="user-info">
                            <span className="user-avatar" id="user-avatar">
                                {user?.signInDetails?.loginId?.charAt(0).toUpperCase() || 'U'}
                            </span>
                            <span className="user-name" id="user-name">
                                {user?.signInDetails?.loginId || 'Usuario'}
                            </span>
                        </div>
                        <button className="btn btn-ghost" onClick={signOut} title="Cerrar sesión">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-main">
                    {activeView === 'api-docs' ? <ApiDocs /> : <Dashboard />}
                </main>
            </section>
        </div>
    );
};

