import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, FileText, CheckCircle, AlertTriangle, Edit, Trash2, Layers, ClipboardList, QrCode, Download, Maximize2, X, Copy, Link } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { PlantillaForm } from './PlantillaForm';
import { ProcesoForm } from './ProcesoForm';
import { ReporteTransacciones } from './ReporteTransacciones';

const client = generateClient<Schema>();

export const Dashboard: React.FC = () => {
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [procesos, setProcesos] = useState<Schema['Proceso']['type'][]>([]);
    const [procesoPlantillas, setProcesoPlantillas] = useState<Schema['ProcesoPlantilla']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'plantillas' | 'procesos' | 'reportes'>('plantillas');
    const [plantillaSearch, setPlantillaSearch] = useState('');
    const [plantillaProcesoFilter, setPlantillaProcesoFilter] = useState('');
    const [plantillaAceptacionFilter, setPlantillaAceptacionFilter] = useState<'all' | 'si' | 'no'>('all');
    const [procesoSearch, setProcesoSearch] = useState('');

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcesoFormOpen, setIsProcesoFormOpen] = useState(false);
    const [selectedPlantilla, setSelectedPlantilla] = useState<Schema['Plantilla']['type'] | null>(null);
    const [selectedProceso, setSelectedProceso] = useState<Schema['Proceso']['type'] | null>(null);
    const [selectedQRProceso, setSelectedQRProceso] = useState<Schema['Proceso']['type'] | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [plantillaRes, procesoRes, pPlantillaRes] = await Promise.all([
                client.models.Plantilla.list({ authMode: 'apiKey' }),
                client.models.Proceso.list({ authMode: 'apiKey' }),
                client.models.ProcesoPlantilla.list({ authMode: 'apiKey' })
            ]);
            setPlantillas(plantillaRes.data);
            setProcesos(procesoRes.data);
            setProcesoPlantillas(pPlantillaRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    }

    async function handleSavePlantilla(data: any) {
        try {
            const { procesosIds, ...plantillaData } = data;
            let plantillaId = selectedPlantilla?.id;

            if (selectedPlantilla) {
                await client.models.Plantilla.update({
                    id: selectedPlantilla.id,
                    ...plantillaData
                }, { authMode: 'apiKey' });
            } else {
                const res = await client.models.Plantilla.create(plantillaData, { authMode: 'apiKey' });
                plantillaId = res.data?.id;
            }

            if (plantillaId && procesosIds !== undefined) {
                // Find existing relations
                const existingRelations = procesoPlantillas.filter(pp => pp.plantillaId === plantillaId);
                const existingProcesoIds = existingRelations.map(pp => pp.procesoId);

                // Add new relations
                const toAdd = procesosIds.filter((id: string) => !existingProcesoIds.includes(id));
                for (const pid of toAdd) {
                    await client.models.ProcesoPlantilla.create({
                        plantillaId,
                        procesoId: pid
                    }, { authMode: 'apiKey' });
                }

                // Delete removed relations
                const toDelete = existingRelations.filter(pp => !procesosIds.includes(pp.procesoId));
                for (const pp of toDelete) {
                    await client.models.ProcesoPlantilla.delete({ id: pp.id }, { authMode: 'apiKey' });
                }
            }

            setIsFormOpen(false);
            setSelectedPlantilla(null);
            fetchData();
        } catch (error) {
            console.error('Error saving plantilla:', error);
            alert('Error al guardar la plantilla');
        }
    }

    async function handleSaveProceso(data: any) {
        try {
            const { plantillasIds, ...procesoData } = data;
            let procesoId = selectedProceso?.id;

            if (selectedProceso) {
                await client.models.Proceso.update({
                    id: selectedProceso.id,
                    ...procesoData
                }, { authMode: 'apiKey' });
            } else {
                const res = await client.models.Proceso.create(procesoData, { authMode: 'apiKey' });
                procesoId = res.data?.id;
            }

            if (procesoId && plantillasIds) {
                // Find existing relations for this proceso
                const existingRelations = procesoPlantillas.filter(pp => pp.procesoId === procesoId);
                const existingPlantillaIds = existingRelations.map(pp => pp.plantillaId);

                // Add new relations
                const toAdd = plantillasIds.filter((id: string) => !existingPlantillaIds.includes(id));
                for (const pid of toAdd) {
                    await client.models.ProcesoPlantilla.create({
                        procesoId,
                        plantillaId: pid
                    }, { authMode: 'apiKey' });
                }

                // Delete removed relations
                const toDelete = existingRelations.filter(pp => !plantillasIds.includes(pp.plantillaId));
                for (const pp of toDelete) {
                    await client.models.ProcesoPlantilla.delete({ id: pp.id }, { authMode: 'apiKey' });
                }
            }

            setIsProcesoFormOpen(false);
            setSelectedProceso(null);
            fetchData();
        } catch (error) {
            console.error('Error saving proceso:', error);
            alert('Error al guardar el proceso');
        }
    }

    async function handleDeletePlantilla(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
        try {
            await client.models.Plantilla.update({ id, eliminada: true }, { authMode: 'apiKey' });
            fetchData();
        } catch (error) {
            console.error('Error deleting plantilla:', error);
        }
    }

    async function handleDeleteProceso(id: string) {
        if (!confirm('¿Estás seguro de eliminar este proceso? También se desasociarán las plantillas.')) return;
        try {
            await client.models.Proceso.delete({ id }, { authMode: 'apiKey' });
            fetchData();
        } catch (error) {
            console.error('Error deleting proceso:', error);
        }
    }

    const downloadQR = (id: string, name: string) => {
        const canvas = document.getElementById(`qr-gen-${id}`) as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const copyURL = (url: string) => {
        navigator.clipboard.writeText(url);
        alert('URL copiada al portapapeles');
    };

    const filteredPlantillas = plantillas.filter((p: Schema['Plantilla']['type']) => {
        if (p.eliminada) return false;
        const term = plantillaSearch.toLowerCase();
        const matchText = !term ||
            p.nombre?.toLowerCase().includes(term) ||
            p.codigo?.toLowerCase().includes(term);
        const matchProceso = !plantillaProcesoFilter || procesoPlantillas.some(pp => pp.plantillaId === p.id && pp.procesoId === plantillaProcesoFilter);
        const matchAceptacion =
            plantillaAceptacionFilter === 'all' ||
            (plantillaAceptacionFilter === 'si' && !!p.requiereAceptacion) ||
            (plantillaAceptacionFilter === 'no' && !p.requiereAceptacion);
        return matchText && matchProceso && matchAceptacion;
    });

    const filteredProcesos = procesos.filter((pr: Schema['Proceso']['type']) => {
        const term = procesoSearch.toLowerCase();
        return !term ||
            pr.nombre?.toLowerCase().includes(term) ||
            pr.descripcion?.toLowerCase().includes(term);
    });

    const hasPlantillaFilters = !!plantillaSearch || !!plantillaProcesoFilter || plantillaAceptacionFilter !== 'all';
    const hasProcesoFilters = !!procesoSearch;

    const clearPlantillaFilters = () => {
        setPlantillaSearch('');
        setPlantillaProcesoFilter('');
        setPlantillaAceptacionFilter('all');
    };

    const clearProcesoFilters = () => setProcesoSearch('');

    const stats = {
        total: plantillas.length,
        requieren: plantillas.filter((p: Schema['Plantilla']['type']) => p.requiereAceptacion).length,
        solicitar: plantillas.filter((p: Schema['Plantilla']['type']) => p.solicitarAceptacion).length
    };

    return (
        <>
            <div className="content-header">
                <div>
                    <h2>
                        {activeTab === 'plantillas' && 'Gestión de Plantillas'}
                        {activeTab === 'procesos' && 'Gestión de Procesos'}
                        {activeTab === 'reportes' && 'Reporte de Transacciones'}
                    </h2>
                    <p className="content-subtitle">
                        {activeTab === 'plantillas' && 'Administra las plantillas de documentos del sistema'}
                        {activeTab === 'procesos' && 'Agrupa y organiza tus plantillas mediante procesos de negocio'}
                        {activeTab === 'reportes' && 'Seguimiento de documentos aceptados y firmados por clientes'}
                    </p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <div className="tab-switcher glass-card" style={{ display: 'flex', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                        <button
                            className={`btn btn-sm ${activeTab === 'plantillas' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('plantillas')}
                        >
                            <FileText size={16} /> Plantillas
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'procesos' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('procesos')}
                        >
                            <Layers size={16} /> Procesos
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'reportes' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('reportes')}
                        >
                            <ClipboardList size={16} /> Reportes
                        </button>
                    </div>
                    {activeTab === 'plantillas' && (
                        <button className="btn btn-primary" onClick={() => { setSelectedPlantilla(null); setIsFormOpen(true); }}>
                            <Plus size={20} /> Nueva Plantilla
                        </button>
                    )}
                    {activeTab === 'procesos' && (
                        <button className="btn btn-primary" onClick={() => { setSelectedProceso(null); setIsProcesoFormOpen(true); }}>
                            <Plus size={20} /> Nuevo Proceso
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ '--accent': '#6366f1' } as any}>
                        <FileText size={22} color="#6366f1" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Plantillas</span>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ '--accent': '#10b981' } as any}>
                        <CheckCircle size={22} color="#10b981" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.requieren}</span>
                        <span className="stat-label">Requieren Aceptación</span>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ '--accent': '#f59e0b' } as any}>
                        <AlertTriangle size={22} color="#f59e0b" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.solicitar}</span>
                        <span className="stat-label">Solicitar Aceptación</span>
                    </div>
                </div>
            </div>

            <div className="table-container glass-card">
                {activeTab !== 'reportes' && (
                    <div className="table-header-bar">
                        <div className="filters-bar">
                            {activeTab === 'plantillas' && (
                                <>
                                    <div className="search-box">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o código..."
                                            value={plantillaSearch}
                                            onChange={(e) => setPlantillaSearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="filter-select"
                                        value={plantillaProcesoFilter}
                                        onChange={(e) => setPlantillaProcesoFilter(e.target.value)}
                                        title="Filtrar por proceso"
                                    >
                                        <option value="">Todos los procesos</option>
                                        {procesos.map((pr: Schema['Proceso']['type']) => (
                                            <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="filter-select"
                                        value={plantillaAceptacionFilter}
                                        onChange={(e) => setPlantillaAceptacionFilter(e.target.value as 'all' | 'si' | 'no')}
                                        title="Filtrar por requiere aceptación"
                                    >
                                        <option value="all">Req. aceptación: Todos</option>
                                        <option value="si">Requiere aceptación</option>
                                        <option value="no">No requiere aceptación</option>
                                    </select>
                                    {hasPlantillaFilters && (
                                        <button className="btn btn-ghost btn-sm filter-clear" onClick={clearPlantillaFilters} title="Limpiar filtros">
                                            <X size={14} /> Limpiar
                                        </button>
                                    )}
                                </>
                            )}
                            {activeTab === 'procesos' && (
                                <>
                                    <div className="search-box">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o descripción..."
                                            value={procesoSearch}
                                            onChange={(e) => setProcesoSearch(e.target.value)}
                                        />
                                    </div>
                                    {hasProcesoFilters && (
                                        <button className="btn btn-ghost btn-sm filter-clear" onClick={clearProcesoFilters} title="Limpiar filtros">
                                            <X size={14} /> Limpiar
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <button className="btn btn-ghost" onClick={fetchData} title="Refrescar">
                            <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                )}

                <div className="table-wrapper">
                    {activeTab === 'reportes' ? (
                        <ReporteTransacciones />
                    ) : loading ? (
                        <div className="table-loading">
                            <div className="spinner spinner-sm"></div>
                            <span>Cargando datos...</span>
                        </div>
                    ) : activeTab === 'plantillas' ? (
                        filteredPlantillas.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={56} />
                                <p>No hay plantillas registradas</p>
                                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedPlantilla(null); setIsFormOpen(true); }}>
                                    Crear primera plantilla
                                </button>
                            </div>
                        ) : (
                            <table id="plantillas-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Código</th>
                                        <th>Proceso</th>
                                        <th>Versión</th>
                                        <th>Req. Aceptación</th>
                                        <th className="th-actions">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlantillas.map((p: Schema['Plantilla']['type']) => {
                                        const pIds = procesoPlantillas.filter(pp => pp.plantillaId === p.id).map(pp => pp.procesoId);
                                        const pNombres = pIds.map(id => procesos.find(pr => pr.id === id)?.nombre).filter(Boolean);
                                        return (
                                            <tr key={p.id}>
                                                <td>{p.nombre}</td>
                                                <td>{p.codigo}</td>
                                                <td>
                                                    {pNombres.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                            {pNombres.map((nombre, i) => (
                                                                <span key={i} className="badge badge-info" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                                                    {nombre}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td>{p.version}</td>
                                                <td>
                                                    <span className={`badge ${p.requiereAceptacion ? 'badge-yes' : 'badge-no'}`}>
                                                        {p.requiereAceptacion ? 'Sí' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn btn-ghost btn-icon-edit" onClick={() => { setSelectedPlantilla(p); setIsFormOpen(true); }} title="Editar"><Edit size={16} /></button>
                                                    <button className="btn btn-ghost btn-icon-delete" onClick={() => handleDeletePlantilla(p.id)} title="Eliminar"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )
                    ) : (
                        // PROCESOS TABLE
                        filteredProcesos.length === 0 ? (
                            <div className="empty-state">
                                <Layers size={56} />
                                <p>No hay procesos registrados</p>
                                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedProceso(null); setIsProcesoFormOpen(true); }}>
                                    Crear primer proceso
                                </button>
                            </div>
                        ) : (
                            <table id="procesos-table">
                                <thead>
                                    <tr>
                                        <th>Nombre del Proceso</th>
                                        <th>Descripción</th>
                                        <th>Plantillas Asociadas</th>
                                        <th>Código QR</th>
                                        <th className="th-actions">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcesos.map((pr: Schema['Proceso']['type']) => {
                                        const count = procesoPlantillas.filter((pp: Schema['ProcesoPlantilla']['type']) => pp.procesoId === pr.id).length;
                                        return (
                                            <tr key={pr.id}>
                                                <td style={{ fontWeight: 600 }}>{pr.nombre}</td>
                                                <td>{pr.descripcion || <span className="text-muted">Sin descripción</span>}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {count} {count === 1 ? 'Plantilla' : 'Plantillas'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="qr-thumbnail" style={{ background: '#fff', padding: '4px', borderRadius: '4px', display: 'flex' }}>
                                                            <QRCodeCanvas 
                                                                value={`https://master.d373a3mueuc4js.amplifyapp.com/?idProceso=${pr.id}`}
                                                                size={32}
                                                                level={"H"}
                                                            />
                                                        </div>
                                                        <button 
                                                            className="btn btn-ghost btn-xs" 
                                                            style={{ padding: '4px' }}
                                                            onClick={() => setSelectedQRProceso(pr)}
                                                            title="Expandir QR"
                                                        >
                                                            <Maximize2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn btn-ghost btn-icon-edit" onClick={() => { setSelectedProceso(pr); setIsProcesoFormOpen(true); }} title="Editar"><Edit size={16} /></button>
                                                    <button className="btn btn-ghost btn-icon-delete" onClick={() => handleDeleteProceso(pr.id)} title="Eliminar"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>

            {isFormOpen && (
                <PlantillaForm
                    plantilla={selectedPlantilla}
                    plantillas={plantillas}
                    procesos={procesos}
                    selectedProcesosIds={selectedPlantilla ? procesoPlantillas.filter(pp => pp.plantillaId === selectedPlantilla.id).map(pp => pp.procesoId) : []}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSavePlantilla}
                />
            )}

            {isProcesoFormOpen && (
                <ProcesoForm
                    proceso={selectedProceso}
                    plantillas={plantillas}
                    selectedPlantillasIds={selectedProceso ? procesoPlantillas.filter(pp => pp.procesoId === selectedProceso.id).map(pp => pp.plantillaId) : []}
                    onClose={() => setIsProcesoFormOpen(false)}
                    onSave={handleSaveProceso}
                />
            )}

            {selectedQRProceso && (
                <div className="modal-overlay" onClick={() => setSelectedQRProceso(null)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="brand-icon" style={{ width: '32px', height: '32px', marginBottom: 0 }}>
                                    <QrCode size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>Código QR de Acceso</h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedQRProceso.nombre}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-close" onClick={() => setSelectedQRProceso(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
                            <div style={{ 
                                background: '#fff', 
                                padding: '16px', 
                                borderRadius: '16px', 
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                marginBottom: '24px'
                            }}>
                                <QRCodeCanvas 
                                    id={`qr-gen-${selectedQRProceso.id}`}
                                    value={`https://master.d373a3mueuc4js.amplifyapp.com/?idProceso=${selectedQRProceso.id}`}
                                    size={200}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                Escanea este código para acceder directamente al flujo de plantillas para este proceso.
                            </p>

                            <div style={{ 
                                width: '100%', 
                                background: 'var(--bg-tertiary)', 
                                padding: '12px', 
                                borderRadius: 'var(--radius-md)', 
                                marginBottom: '24px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Link size={16} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                                <code style={{ 
                                    flex: 1, 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {`https://master.d373a3mueuc4js.amplifyapp.com/?idProceso=${selectedQRProceso.id}`}
                                </code>
                                <button 
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => copyURL(`https://master.d373a3mueuc4js.amplifyapp.com/?idProceso=${selectedQRProceso.id}`)}
                                    title="Copiar URL"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <button 
                                className="btn btn-primary btn-block" 
                                onClick={() => downloadQR(selectedQRProceso.id, selectedQRProceso.nombre)}
                            >
                                <Download size={18} /> Descargar QR (PNG)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
