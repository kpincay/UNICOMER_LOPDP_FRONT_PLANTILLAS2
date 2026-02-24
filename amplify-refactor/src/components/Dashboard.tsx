import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, FileText, CheckCircle, AlertTriangle, Edit, Trash2, Eye } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { PlantillaForm } from './PlantillaForm';

const client = generateClient<Schema>();

export const Dashboard: React.FC = () => {
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPlantilla, setSelectedPlantilla] = useState<Schema['Plantilla']['type'] | null>(null);

    useEffect(() => {
        fetchPlantillas();
    }, []);

    async function fetchPlantillas() {
        setLoading(true);
        try {
            const { data: items } = await client.models.Plantilla.list();
            setPlantillas(items);
        } catch (error) {
            console.error('Error fetching plantillas:', error);
        }
        setLoading(false);
    }

    async function handleSave(data: any) {
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
            fetchPlantillas();
        } catch (error) {
            console.error('Error saving plantilla:', error);
            alert('Error al guardar la plantilla');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
        try {
            await client.models.Plantilla.delete({ id });
            fetchPlantillas();
        } catch (error) {
            console.error('Error deleting plantilla:', error);
        }
    }

    const filteredPlantillas = plantillas.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: plantillas.length,
        requieren: plantillas.filter(p => p.requiereAceptacion).length,
        solicitar: plantillas.filter(p => p.solicitarAceptacion).length
    };

    return (
        <>
            <div className="content-header">
                <div>
                    <h2>Gestión de Plantillas</h2>
                    <p className="content-subtitle">Administra las plantillas de documentos del sistema (Amplify Edition)</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedPlantilla(null); setIsFormOpen(true); }}>
                    <Plus size={20} />
                    Nueva Plantilla
                </button>
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
                    <button className="btn btn-ghost" onClick={fetchPlantillas} title="Refrescar">
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading ? (
                        <div className="table-loading">
                            <div className="spinner spinner-sm"></div>
                            <span>Cargando plantillas...</span>
                        </div>
                    ) : filteredPlantillas.length === 0 ? (
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
                                    <th>Versión</th>
                                    <th>Req. Aceptación</th>
                                    <th>Sol. Aceptación</th>
                                    <th className="th-actions">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlantillas.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.nombre}</td>
                                        <td>{p.codigo}</td>
                                        <td>{p.version}</td>
                                        <td>
                                            <span className={`badge ${p.requiereAceptacion ? 'badge-yes' : 'badge-no'}`}>
                                                {p.requiereAceptacion ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.solicitarAceptacion ? 'badge-yes' : 'badge-no'}`}>
                                                {p.solicitarAceptacion ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="btn btn-ghost btn-icon-view" title="Ver detalle"><Eye size={16} /></button>
                                            <button className="btn btn-ghost btn-icon-edit" onClick={() => { setSelectedPlantilla(p); setIsFormOpen(true); }} title="Editar"><Edit size={16} /></button>
                                            <button className="btn btn-ghost btn-icon-delete" onClick={() => handleDelete(p.id)} title="Eliminar"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <PlantillaForm
                    plantilla={selectedPlantilla}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};
