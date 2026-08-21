import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Select from 'react-select';
import type { Schema } from '../../amplify/data/resource';

interface ProcesoFormProps {
    proceso: Schema['Proceso']['type'] | null;
    plantillas: Schema['Plantilla']['type'][];
    selectedPlantillasIds?: string[];
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export const ProcesoForm: React.FC<ProcesoFormProps> = ({ proceso, plantillas, selectedPlantillasIds = [], onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tituloLanding: '',
        encabezadoLanding: '',
        plantillasIds: [] as string[]
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (proceso) {
            setFormData({
                nombre: proceso.nombre,
                descripcion: proceso.descripcion || '',
                tituloLanding: proceso.tituloLanding || '',
                encabezadoLanding: proceso.encabezadoLanding || '',
                plantillasIds: selectedPlantillasIds
            });
        }
    }, [proceso, selectedPlantillasIds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const plantillaOptions = plantillas.filter(p => !p.eliminada).map(p => ({
        value: p.id,
        label: p.nombre
    }));

    const selectedOptions = plantillaOptions.filter(opt => formData.plantillasIds.includes(opt.value));

    return (
        <div className="modal-overlay">
            <div className="modal modal-sm glass-card">
                <div className="modal-header">
                    <h3>{proceso ? 'Editar Proceso' : 'Nuevo Proceso'}</h3>
                    <button className="btn btn-ghost btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Nombre del Proceso <span className="required">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Autorización de Compra"
                            />
                        </div>
                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Describe brevemente el proceso..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Plantillas Asociadas</label>
                            <Select
                                isMulti
                                options={plantillaOptions}
                                value={selectedOptions}
                                onChange={(selected) => {
                                    setFormData({
                                        ...formData,
                                        plantillasIds: selected.map(s => s.value)
                                    });
                                }}
                                placeholder="Buscar y seleccionar plantillas..."
                                noOptionsMessage={() => "No se encontraron plantillas"}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderColor: 'var(--border-color)',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            borderColor: 'var(--primary-color)'
                                        }
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: 'rgba(59,130,246,0.1)',
                                        borderRadius: '4px'
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: 'var(--primary-color)',
                                        fontSize: '0.85rem'
                                    }),
                                    multiValueRemove: (base) => ({
                                        ...base,
                                        color: 'var(--primary-color)',
                                        ':hover': {
                                            backgroundColor: 'rgba(59,130,246,0.2)',
                                            color: 'var(--primary-color)',
                                        },
                                    }),
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Título de la Landing (Opcional)</label>
                            <input
                                type="text"
                                value={formData.tituloLanding}
                                onChange={(e) => setFormData({ ...formData, tituloLanding: e.target.value })}
                                placeholder="Ej: Autorización de Protección de Datos (LOPDP)"
                            />
                        </div>
                        <div className="form-group">
                            <label>Encabezado de la Landing (Opcional)</label>
                            <textarea
                                value={formData.encabezadoLanding}
                                onChange={(e) => setFormData({ ...formData, encabezadoLanding: e.target.value })}
                                placeholder="Mensaje para el cliente debajo del título..."
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <div className="spinner spinner-sm"></div> : <Save size={18} />}
                            {proceso ? 'Actualizar' : 'Crear'} Proceso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
