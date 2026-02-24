import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Schema } from '../../amplify/data/resource';

interface PlantillaFormProps {
    plantilla?: Schema['Plantilla']['type'] | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export const PlantillaForm: React.FC<PlantillaFormProps> = ({ plantilla, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        version: '',
        url: '',
        contenido: '',
        requiereAceptacion: false,
        solicitarAceptacion: false
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (plantilla) {
            setFormData({
                nombre: plantilla.nombre || '',
                codigo: plantilla.codigo || '',
                version: plantilla.version || '',
                url: plantilla.url || '',
                contenido: plantilla.contenido || '',
                requiereAceptacion: !!plantilla.requiereAceptacion,
                solicitarAceptacion: !!plantilla.solicitarAceptacion
            });
        }
    }, [plantilla]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await onSave(formData);
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal glass-card">
                <div className="modal-header">
                    <h3>{plantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
                    <button className="btn btn-ghost btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre <span className="required">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Nombre de la plantilla"
                            />
                        </div>
                        <div className="form-group">
                            <label>Código <span className="required">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="Ej: PLT-001"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Versión</label>
                            <input
                                type="text"
                                value={formData.version}
                                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                placeholder="Ej: 1.0"
                            />
                        </div>
                        <div className="form-group">
                            <label>URL</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contenido</label>
                        <textarea
                            rows={4}
                            value={formData.contenido}
                            onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                            placeholder="Contenido o descripción..."
                        />
                    </div>

                    <div className="form-row checkbox-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.requiereAceptacion}
                                onChange={(e) => setFormData({ ...formData, requiereAceptacion: e.target.checked })}
                            />
                            <span className="checkmark"></span>
                            Requiere Aceptación
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.solicitarAceptacion}
                                onChange={(e) => setFormData({ ...formData, solicitarAceptacion: e.target.checked })}
                            />
                            <span className="checkmark"></span>
                            Solicitar Aceptación
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? <div className="spinner spinner-sm"></div> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
