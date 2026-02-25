import React, { useState } from 'react';
import { Send, User, IdCard, Mail, Phone, Hash, CheckCircle, Copy } from 'lucide-react';
import { lopdService } from '../services/lopdService';
import type { Schema } from '../../amplify/data/resource';

interface TransactionInitiatorProps {
    procesos: Schema['Proceso']['type'][];
    onClose: () => void;
    onSuccess: (url: string) => void;
}

export const TransactionInitiator: React.FC<TransactionInitiatorProps> = ({ procesos, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cedula: '',
        nombres: '',
        correo: '',
        telefono: '',
        procesoId: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.procesoId) {
            alert('Por favor selecciona un proceso');
            return;
        }

        setLoading(true);
        try {
            // Get public IP (simplified for demo, in production we might use a service)
            const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => ({ json: () => ({ ip: '127.0.0.1' }) }));
            const { ip } = await (ipResponse as any).json();

            // Prepare transaction data
            const transactionData = {
                cedula: formData.cedula,
                ip: ip, // Use captured IP
                nombres: formData.nombres,
                correo: formData.correo,
                telefono: formData.telefono,
                channel: 'web',
                storeId: 'MAIN_STORE', // Default or from context if available
                plantillas: [] // Backend might handle this or we can fetch them here
            };

            // 1. Create transaction in external backend
            const result = await lopdService.createTransaction(transactionData);

            // Assuming result contains the transaction ID as shown in the example
            // e.g. https://master.d373a3mueuc4js.amplifyapp.com?id=UUID
            // We use current origin for the landing page
            const transactionId = result.id || result.data?.id; // Adjust based on actual API response
            const landingUrl = `${window.location.origin}?id=${transactionId}`;

            // 2. Logic to send email (Local Logic as requested)
            // Note: This would typically call a local API or SES directly
            console.log(`Simulando envío de correo a ${formData.correo} con la URL: ${landingUrl}`);

            setGeneratedUrl(landingUrl);
            onSuccess(landingUrl);
        } catch (error) {
            console.error('Error initiating transaction:', error);
            alert('Error al iniciar la transacción');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedUrl) {
            navigator.clipboard.writeText(generatedUrl);
            alert('URL copiada al portapapeles');
        }
    };

    if (generatedUrl) {
        return (
            <div className="glass-card animate-scaleUp" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <CheckCircle size={48} className="text-success" style={{ marginBottom: 'var(--space-md)' }} />
                <h3>¡Solicitud Generada!</h3>
                <p>La transacción se ha registrado correctamente. Comparte el siguiente enlace con el cliente:</p>

                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    margin: 'var(--space-lg) 0',
                    border: '1px solid var(--border-color)',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                }}>
                    {generatedUrl}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={copyToClipboard}>
                        <Copy size={18} /> Copiar Enlace
                    </button>
                    <button className="btn btn-primary" onClick={() => setGeneratedUrl(null)}>
                        Generar Otra
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card animate-scaleUp" style={{ padding: 'var(--space-xl)' }}>
            <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label><IdCard size={14} /> Cédula / ID</label>
                        <input
                            type="text"
                            required
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                            placeholder="Ej: 0987654321"
                        />
                    </div>

                    <div className="form-group">
                        <label><User size={14} /> Nombres Completos</label>
                        <input
                            type="text"
                            required
                            value={formData.nombres}
                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="form-group">
                        <label><Mail size={14} /> Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            placeholder="ejemplo@correo.com"
                        />
                    </div>

                    <div className="form-group">
                        <label><Phone size={14} /> Teléfono</label>
                        <input
                            type="tel"
                            required
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="Ej: 0998877665"
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label><Hash size={14} /> Proceso a Seguir</label>
                        <select
                            required
                            value={formData.procesoId}
                            onChange={(e) => setFormData({ ...formData, procesoId: e.target.value })}
                        >
                            <option value="">-- Selecciona un Proceso --</option>
                            {procesos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner spinner-xs"></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Generar y Enviar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
