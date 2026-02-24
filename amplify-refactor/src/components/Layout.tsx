import React from 'react';
import { LogOut } from 'lucide-react';
import { Dashboard } from './Dashboard';

interface LayoutProps {
    user?: any;
    signOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, signOut }) => {
    return (
        <div className="view">
            {/* ══════════════════════ DASHBOARD VIEW ══════════════════════ */}
            <section id="dashboard-view" className="view">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="brand-mini">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>Plantillas</span>
                        </div>
                    </div>
                    <div className="header-right">
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
                    <Dashboard />
                </main>
            </section>
        </div>
    );
};
