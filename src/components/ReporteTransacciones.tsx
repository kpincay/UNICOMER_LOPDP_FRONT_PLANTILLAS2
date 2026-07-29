import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, Eye, FileText, X, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown, Download } from 'lucide-react';
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
    procesos?: string[];
    proceso?: string[] | string;
    procesoId?: string;
    plantillas?: string[];
    plantillasAceptadas?: string[];
    createdAt: number;
    aceptaciones?: Record<string, boolean>; // Campo para rastrear qué se aceptó
}

export const ReporteTransacciones: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [procesos, setProcesos] = useState<Schema['Proceso']['type'][]>([]);
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: 'fecha' | 'cedula', direction: 'asc' | 'desc' } | null>({ key: 'fecha', direction: 'desc' });


    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedAceptacionPlantillas, setSelectedAceptacionPlantillas] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trxRes, procesoRes, plantillaRes] = await Promise.all([
                lopdService.getHistoricalTransactions(),
                client.models.Proceso.list({ authMode: 'apiKey' }),
                client.models.Plantilla.list({ authMode: 'apiKey' })
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
            setPlantillas(plantillaRes.data);
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

    const getProcessIds = (trx: any): string[] => {
        const ids = new Set<string>();
        const addValue = (value: any) => {
            if (Array.isArray(value)) {
                value.forEach(item => addValue(item));
                return;
            }
            if (typeof value === 'string' && value.trim()) {
                value.split(',').map(item => item.trim()).filter(Boolean).forEach(item => ids.add(item));
            }
        };
        addValue(trx?.process);
        addValue(trx?.proceso);
        addValue(trx?.procesos);
        addValue(trx?.procesoId ?? trx?.id_proceso ?? trx?.proceso_id);
        return Array.from(ids);
    };

    const getProcesoName = (trx: any) => {
        const pIds = getProcessIds(trx);
        if (pIds.length === 0) return 'Sin Proceso';
        const procesoId = pIds[0];
        const proceso = procesos.find(p => p.id === procesoId);
        return proceso ? proceso.nombre : 'Proceso Desconocido';
    };

    const filteredTransactions = transactions.filter(t => 
        t.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProcesoName(t).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let sortedTransactions = [...filteredTransactions];
    if (sortConfig) {
        sortedTransactions.sort((a, b) => {
            if (sortConfig.key === 'fecha') {
                const getMs = (t: Transaction) => {
                    const ts = t.createdAt || t.timestamp || 0;
                    return ts.toString().length === 10 ? ts * 1000 : ts;
                };
                const dateA = getMs(a);
                const dateB = getMs(b);
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortConfig.key === 'cedula') {
                const cedA = a.cedula || '';
                const cedB = b.cedula || '';
                return sortConfig.direction === 'asc' ? cedA.localeCompare(cedB) : cedB.localeCompare(cedA);
            }
            return 0;
        });
    }

    const handleExportCSV = () => {
        const headers = ['Fecha de Aceptación', 'Cédula', 'Nombres', 'Correo', 'Estado', 'IP', 'Proceso'];
        const rows = sortedTransactions.map(t => [
            formatDate(t.createdAt || t.timestamp).replace(/,/g, ''),
            t.cedula || '',
            t.nombres || '',
            t.correo || '',
            t.estado === 'aprobado' ? 'Aprobado' : 'Pendiente',
            t.ip || '',
            getProcesoName(t) || ''
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Transacciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination logic
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const paginatedTransactions = sortedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleOpenDetail = async (transaction: Transaction) => {
        setIsDetailModalOpen(true);
        setLoadingDetail(true);
        setSelectedAceptacionPlantillas([]);
        try {
            const detailRes = await lopdService.getTransactionById(transaction.id);
            let detailData = transaction;
            
            // Logic to extract data similar to AcceptanceLanding
            if (detailRes.body && typeof detailRes.body === 'string') {
                const parsed = JSON.parse(detailRes.body);
                detailData = parsed.data || parsed;
            } else if (detailRes.data) {
                detailData = detailRes.data;
            }

            // Ensure we handle array response from API
            if (Array.isArray(detailData)) {
                detailData = detailData.find((item: any) => item.id === transaction.id) || detailData[0];
            }

            setSelectedTransactionDetail(detailData);

            // Fetch specific template acceptances from Amplify
            try {
                const { data: aceptaciones } = await client.models.Aceptacion.list({
                    filter: { transaccionId: { eq: transaction.id } },
                    authMode: 'apiKey'
                });
                if (aceptaciones && aceptaciones.length > 0) {
                    const ids = aceptaciones[0].plantillasAceptadas.split(',').map((id: string) => id.trim()).filter(Boolean);
                    setSelectedAceptacionPlantillas(ids);
                }
            } catch (err) {
                console.error('Error fetching template acceptances from Amplify:', err);
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            setSelectedTransactionDetail(transaction);
        } finally {
            setLoadingDetail(false);
        }
    };

    const getPlantillasForTrx = (trx: any) => {
        const pIds = getProcessIds(trx);
        // Filtrar plantillas que corresponden al proceso de la transaccion
        let relatedPlantillas = plantillas.filter(p => typeof p.procesoId === 'string' && pIds.includes(p.procesoId));

        const addExtraPlantillas = (arr: string[]) => {
            if (arr && Array.isArray(arr)) {
                // Solo se agregan plantillas adicionales si pertenecen al proceso asociado
                const extraPlantillas = plantillas.filter(p => 
                    arr.includes(p.id) && 
                    typeof p.procesoId === 'string' && 
                    pIds.includes(p.procesoId)
                );
                const existingIds = new Set(relatedPlantillas.map(p => p.id));
                extraPlantillas.forEach(p => {
                    if (!existingIds.has(p.id)) relatedPlantillas.push(p);
                });
            }
        };

        addExtraPlantillas(trx.plantillas);
        addExtraPlantillas(trx.plantillasAceptadas);

        return relatedPlantillas;
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCSV} title="Descargar en Excel/CSV">
                            <Download size={16} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>DESCARGAR REPORTE</span>
                        </button>
                        <button className="btn btn-ghost" onClick={fetchData} title="Refrescar datos">
                            <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
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
                                        <th 
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => setSortConfig(prev => prev?.key === 'fecha' && prev.direction === 'asc' ? { key: 'fecha', direction: 'desc' } : { key: 'fecha', direction: 'asc' })}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Fecha
                                                {sortConfig?.key === 'fecha' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                                            </div>
                                        </th>
                                        <th 
                                            style={{ cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => setSortConfig(prev => prev?.key === 'cedula' && prev.direction === 'asc' ? { key: 'cedula', direction: 'desc' } : { key: 'cedula', direction: 'asc' })}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Cédula
                                                {sortConfig?.key === 'cedula' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                                            </div>
                                        </th>
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
                                                    title="Ver Detalle de Aceptación"
                                                    onClick={() => handleOpenDetail(t)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

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

            {/* Modal de Detalle (Presentación) */}
            {isDetailModalOpen && createPortal(
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="modal-content glass-card animate-scaleUp" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <div>
                                <h3>Resumen de Aceptación</h3>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Visualizando registro histórico</p>
                            </div>
                            <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {loadingDetail ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                                    <div className="spinner"></div>
                                    <p style={{ marginTop: '15px' }}>Consultando detalles del backend...</p>
                                </div>
                            ) : selectedTransactionDetail ? (
                                <>
                                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.3)', borderRadius: '12px' }}>
                                        <div className="info-item">
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliente</label>
                                            <div style={{ fontWeight: 600 }}>{selectedTransactionDetail.nombres}</div>
                                        </div>
                                        <div className="info-item">
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cédula</label>
                                            <div style={{ fontWeight: 600 }}>{selectedTransactionDetail.cedula}</div>
                                        </div>
                                        <div className="info-item">
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proceso</label>
                                            <div style={{ fontWeight: 600 }}>{getProcesoName(selectedTransactionDetail)}</div>
                                        </div>
                                        <div className="info-item">
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado</label>
                                            <span className={`badge ${selectedTransactionDetail.estado === 'aprobado' ? 'badge-yes' : 'badge-no'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                                                {selectedTransactionDetail.estado.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={18} /> Plantillas y Estado de Firma
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {(() => {
                                            // Filtrar las plantillas del proceso que de verdad han sido aceptadas
                                            const plantillasAceptadas = getPlantillasForTrx(selectedTransactionDetail).filter(p => {
                                                let isAccepted = false;
                                                if (selectedAceptacionPlantillas.length > 0) {
                                                    isAccepted = selectedAceptacionPlantillas.includes(p.id);
                                                } else if (selectedTransactionDetail.aceptaciones && selectedTransactionDetail.aceptaciones[p.id]) {
                                                    isAccepted = true;
                                                } else if (selectedTransactionDetail.estado === 'aprobado' || selectedTransactionDetail.estado === 'APROBADO') {
                                                    isAccepted = true;
                                                }
                                                return isAccepted;
                                            });

                                            if (plantillasAceptadas.length > 0) {
                                                return plantillasAceptadas.map(p => (
                                                    <div key={p.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.codigo} v{p.version}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>ACEPTADO</span>
                                                            <CheckCircle size={20} color="#10b981" />
                                                        </div>
                                                    </div>
                                                ));
                                            } else {
                                                return (
                                                    <div style={{ 
                                                        textAlign: 'center', 
                                                        padding: '30px 20px', 
                                                        background: 'rgba(255,255,255,0.15)', 
                                                        borderRadius: '8px', 
                                                        border: '1px dashed var(--border-color)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        No hay plantillas aprobadas para este proceso
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </>
                            ) : (
                                <p>No se pudo cargar la información de la transacción.</p>
                            )}
                        </div>

                        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setIsDetailModalOpen(false)}>
                                Cerrar Reporte
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
