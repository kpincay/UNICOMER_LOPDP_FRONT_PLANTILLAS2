import React from 'react';
import { LogOut } from 'lucide-react';
import UnicomerLogo from '../assets/unicomer.png';
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
                        <div className="brand-mini" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={UnicomerLogo} alt="Unicomer" style={{ height: '150px', width: 'auto', objectFit: 'contain', transform: 'scale(1.2)' }} />
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Plantillas</span>
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
