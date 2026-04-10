import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, FileText } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { lopdService } from '../services/lopdService';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface Transaction {
    id: string;
    cedula: string;
    timestamp: number;
    ip: string;
    nombres: string;
    estado: string;
    correo: string;
    telefono: string;
    active: boolean;
    modifyAt: number | null;
    channel: string;
    storeId: string;
    process: string[];
    createdAt: number;
}

export const ReporteTransacciones: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [procesos, setProcesos] = useState<Schema['Proceso']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trxRes, procesoRes] = await Promise.all([
                lopdService.getHistoricalTransactions(),
                client.models.Proceso.list({ authMode: 'apiKey' })
            ]);

            let trxData: Transaction[] = [];
            if (trxRes.body && typeof trxRes.body === 'string') {
                try {
                    const parsedBody = JSON.parse(trxRes.body);
                    trxData = parsedBody.data || [];
                } catch (e) {
                    console.error('Error parsing trx body', e);
                }
            } else if (trxRes.data) {
                trxData = trxRes.data;
            }

            setTransactions(trxData);
            setProcesos(procesoRes.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'N/A';
        const ts = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
        return new Intl.DateTimeFormat('es-EC', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(ts));
    };

    const getProcesoName = (trxProcess: string[]) => {
        if (!trxProcess || trxProcess.length === 0) return 'Sin Proceso';
        const procesoId = trxProcess[0];
        const proceso = procesos.find(p => p.id === procesoId);
        return proceso ? proceso.nombre : 'Proceso Desconocido';
    };

    const filteredTransactions = transactions.filter(t => 
        t.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProcesoName(t.process).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleOpenDetail = (transactionId: string) => {
        const url = `${window.location.origin}?id=${transactionId}`;
        window.open(url, '_blank');
    };

    return (
        <div className="animate-fadeIn">
            <div className="table-container glass-card">
                <div className="table-header-bar">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cédula o correo..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-ghost" onClick={fetchData} title="Refrescar datos">
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading ? (
                        <div className="table-loading">
                            <div className="spinner spinner-sm"></div>
                            <span>Cargando transacciones...</span>
                        </div>
                    ) : paginatedTransactions.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={56} />
                            <p>No se encontraron transacciones</p>
                        </div>
                    ) : (
                        <>
                            <table id="reporte-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cédula</th>
                                        <th>Nombres</th>
                                        <th>Correo</th>
                                        <th>Estado</th>
                                        <th>IP</th>
                                        <th className="th-actions">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTransactions.map((t) => (
                                        <tr key={t.id}>
                                            <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {formatDate(t.createdAt || t.timestamp)}
                                            </td>
                                            <td>{t.cedula}</td>
                                            <td style={{ fontWeight: 500 }}>{t.nombres}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{t.correo}</td>
                                            <td>
                                                <span className={`badge ${t.estado === 'aprobado' ? 'badge-yes' : 'badge-no'}`} style={{ 
                                                    background: t.estado === 'aprobado' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                    color: t.estado === 'aprobado' ? '#10b981' : '#f59e0b'
                                                }}>
                                                    {t.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                                {t.ip}
                                            </td>
                                            <td className="actions-cell">
                                                <button 
                                                    className="btn btn-ghost btn-icon-view" 
                                                    title="Ver Landing de Aceptación"
                                                    onClick={() => handleOpenDetail(t.id)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination" style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    gap: '15px', 
                                    padding: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <button 
                                        className="btn btn-sm btn-ghost" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Anterior
                                    </button>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        Página <strong>{currentPage}</strong> de {totalPages}
                                    </span>
                                    <button 
                                        className="btn btn-sm btn-ghost" 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
