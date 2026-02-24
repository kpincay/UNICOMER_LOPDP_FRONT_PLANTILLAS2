import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Schema } from '../../amplify/data/resource';

interface ProcesoFormProps {
    proceso: Schema['Proceso']['type'] | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export const ProcesoForm: React.FC<ProcesoFormProps> = ({ proceso, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (proceso) {
            setFormData({
                nombre: proceso.nombre,
                descripcion: proceso.descripcion || ''
            });
        }
    }, [proceso]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

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
