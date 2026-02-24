import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, FileText, CheckCircle, AlertTriangle, Edit, Trash2, Eye, Layers } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { PlantillaForm } from './PlantillaForm';
import { ProcesoForm } from './ProcesoForm';

const client = generateClient<Schema>();

export const Dashboard: React.FC = () => {
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [procesos, setProcesos] = useState<Schema['Proceso']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'plantillas' | 'procesos'>('plantillas');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProcesoFormOpen, setIsProcesoFormOpen] = useState(false);
    const [selectedPlantilla, setSelectedPlantilla] = useState<Schema['Plantilla']['type'] | null>(null);
    const [selectedProceso, setSelectedProceso] = useState<Schema['Proceso']['type'] | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [plantillaRes, procesoRes] = await Promise.all([
                client.models.Plantilla.list(),
                client.models.Proceso.list()
            ]);
            setPlantillas(plantillaRes.data);
            setProcesos(procesoRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    }

    async function handleSavePlantilla(data: any) {
        try {
            if (selectedPlantilla) {
                await client.models.Plantilla.update({
                    id: selectedPlantilla.id,
                    ...data
                });
            } else {
                await client.models.Plantilla.create(data);
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
            if (selectedProceso) {
                await client.models.Proceso.update({
                    id: selectedProceso.id,
                    ...data
                });
            } else {
                await client.models.Proceso.create(data);
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
            await client.models.Plantilla.delete({ id });
            fetchData();
        } catch (error) {
            console.error('Error deleting plantilla:', error);
        }
    }

    async function handleDeleteProceso(id: string) {
        if (!confirm('¿Estás seguro de eliminar este proceso? También se desasociarán las plantillas.')) return;
        try {
            await client.models.Proceso.delete({ id });
            fetchData();
        } catch (error) {
            console.error('Error deleting proceso:', error);
        }
    }

    const filteredPlantillas = plantillas.filter((p: Schema['Plantilla']['type']) =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProcesos = procesos.filter((pr: Schema['Proceso']['type']) =>
        pr.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: plantillas.length,
        requieren: plantillas.filter((p: Schema['Plantilla']['type']) => p.requiereAceptacion).length,
        solicitar: plantillas.filter((p: Schema['Plantilla']['type']) => p.solicitarAceptacion).length
    };

    return (
        <>
            <div className="content-header">
                <div>
                    <h2>{activeTab === 'plantillas' ? 'Gestión de Plantillas' : 'Gestión de Procesos'}</h2>
                    <p className="content-subtitle">
                        {activeTab === 'plantillas'
                            ? 'Administra las plantillas de documentos del sistema'
                            : 'Agrupa y organiza tus plantillas mediante procesos de negocio'}
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
                    </div>
                    {activeTab === 'plantillas' ? (
                        <button className="btn btn-primary" onClick={() => { setSelectedPlantilla(null); setIsFormOpen(true); }}>
                            <Plus size={20} /> Nueva Plantilla
                        </button>
                    ) : (
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
                <div className="table-header-bar">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar plantillas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-ghost" onClick={fetchData} title="Refrescar">
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading ? (
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
                                        const proceso = procesos.find((pr: Schema['Proceso']['type']) => pr.id === p.procesoId);
                                        return (
                                            <tr key={p.id}>
                                                <td>{p.nombre}</td>
                                                <td>{p.codigo}</td>
                                                <td>
                                                    {proceso ? (
                                                        <span className="badge badge-info" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                                            {proceso.nombre}
                                                        </span>
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
                                                    <button className="btn btn-ghost btn-icon-view" title="Ver detalle"><Eye size={16} /></button>
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
                                        <th className="th-actions">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcesos.map((pr: Schema['Proceso']['type']) => {
                                        const count = plantillas.filter((p: Schema['Plantilla']['type']) => p.procesoId === pr.id).length;
                                        return (
                                            <tr key={pr.id}>
                                                <td style={{ fontWeight: 600 }}>{pr.nombre}</td>
                                                <td>{pr.descripcion || <span className="text-muted">Sin descripción</span>}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {count} {count === 1 ? 'Plantilla' : 'Plantillas'}
                                                    </span>
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
                    procesos={procesos}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSavePlantilla}
                />
            )}

            {isProcesoFormOpen && (
                <ProcesoForm
                    proceso={selectedProceso}
                    onClose={() => setIsProcesoFormOpen(false)}
                    onSave={handleSaveProceso}
                />
            )}
        </>
    );
};
