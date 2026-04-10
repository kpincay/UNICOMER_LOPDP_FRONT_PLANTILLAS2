import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, FileText, X, CheckCircle, Clock } from 'lucide-react';
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
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch everything we need for unification
            const [trxRes, procesoRes, plantillaRes] = await Promise.all([
                lopdService.getHistoricalTransactions(),
                client.models.Proceso.list({ authMode: 'apiKey' }),
                client.models.Plantilla.list({ authMode: 'apiKey' })
            ]);

            // Backend returns { statusCode: 200, body: "{\"message\":..., \"data\": [...] }" }
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
            setPlantillas(plantillaRes.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'N/A';
        // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
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

    const getPlantillasForTrx = (trx: Transaction) => {
        if (!trx.process || trx.process.length === 0) return [];
        const procesoId = trx.process[0];
        return plantillas.filter(p => p.procesoId === procesoId);
    };

    const filteredTransactions = transactions.filter(t => 
        t.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProcesoName(t.process).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetail = (trx: Transaction) => {
        setSelectedTransaction(trx);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="animate-fadeIn">
            <div className="table-container glass-card">
                <div className="table-header-bar">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cédula, correo o proceso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                    ) : filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={56} />
                            <p>No se encontraron transacciones</p>
                        </div>
                    ) : (
                        <table id="reporte-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Cédula</th>
                                    <th>Nombres</th>
                                    <th>Correo</th>
                                    <th>Proceso</th>
                                    <th>Estado</th>
                                    <th>IP</th>
                                    <th className="th-actions">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                            {formatDate(t.createdAt || t.timestamp)}
                                        </td>
                                        <td>{t.cedula}</td>
                                        <td style={{ fontWeight: 500 }}>{t.nombres}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{t.correo}</td>
                                        <td>
                                            <span className="badge badge-info" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary-color)' }}>
                                                {getProcesoName(t.process)}
                                            </span>
                                        </td>
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
                                                title="Ver Plantillas"
                                                onClick={() => handleViewDetail(t)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Detalle de Plantillas */}
            {isDetailModalOpen && selectedTransaction && (
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="modal-content glass-card animate-scaleUp" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div>
                                <h3>Detalle de Transacción</h3>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>ID: {selectedTransaction.id}</p>
                            </div>
                            <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                                <div className="info-item">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Cliente</label>
                                    <strong>{selectedTransaction.nombres}</strong>
                                </div>
                                <div className="info-item">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Proceso</label>
                                    <strong>{getProcesoName(selectedTransaction.process)}</strong>
                                </div>
                                <div className="info-item">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha de Inicio</label>
                                    <span>{formatDate(selectedTransaction.createdAt)}</span>
                                </div>
                                <div className="info-item">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estado Final</label>
                                    <span className={`badge ${selectedTransaction.estado === 'aprobado' ? 'badge-yes' : 'badge-no'}`}>
                                        {selectedTransaction.estado.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Plantillas Asociadas
                            </h4>

                            <div className="plantillas-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {getPlantillasForTrx(selectedTransaction).length === 0 ? (
                                    <p className="text-muted">No hay plantillas registradas para este proceso.</p>
                                ) : (
                                    getPlantillasForTrx(selectedTransaction).map(p => (
                                        <div key={p.id} className="plantilla-item-detail glass-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cód: {p.codigo} | Ver: {p.version}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {p.requiereAceptacion && (
                                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>REQ. FIRMA</span>
                                                )}
                                                {selectedTransaction.estado === 'aprobado' ? (
                                                    <CheckCircle size={18} className="text-success" />
                                                ) : (
                                                    <Clock size={18} className="text-warning" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setIsDetailModalOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
