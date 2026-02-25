import React, { useState } from 'react';
import { Send, User, IdCard, Mail, Phone, Hash, CheckCircle, Copy } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { lopdService } from '../services/lopdService';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

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

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const isEmailValid = validateEmail(formData.correo);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEmailValid) {
            alert('Por favor ingresa un correo electrónico válido');
            return;
        }

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
                proceso: [formData.procesoId]
            };

            // 1. Create transaction in external backend
            const result = await lopdService.createTransaction(transactionData);

            // Assuming result contains the transaction ID as shown in the example
            // e.g. https://master.d373a3mueuc4js.amplifyapp.com?id=UUID
            // We use current origin for the landing page
            const transactionId = result.id || result.data?.id; // Adjust based on actual API response
            const landingUrl = `${window.location.origin}?id=${transactionId}`;

            // 2. Logic to send email (Real integration via SES)
            const emailBody = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Autorización de Protección de Datos (LOPDP)</h2>
                    <p>Hola <strong>${formData.nombres}</strong>,</p>
                    <p>Para continuar con tu solicitud en UNICOMER, por favor revisa y acepta los términos de protección de datos en el siguiente enlace:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${landingUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Revisar y Aceptar Documentos</a>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
                    <p style="font-size: 0.8rem; color: #999; word-break: break-all;">${landingUrl}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.75rem; color: #999;">Este es un mensaje automático, por favor no responda directamente.</p>
                </div>
            `;

            try {
                await (client.mutations as any).sendEmail({
                    to: formData.correo,
                    subject: 'Autorización LOPDP - UNICOMER',
                    body: emailBody
                });
                console.log(`Correo enviado exitosamente a ${formData.correo}`);
            } catch (emailError) {
                console.error('Error al enviar correo via SES:', emailError);
                // No lanzamos error aquí para permitir mostrar la URL en pantalla como respaldo
            }

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
                            className={formData.correo && !isEmailValid ? 'input-error' : ''}
                        />
                        {formData.correo && !isEmailValid && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '4px', display: 'block' }}>
                                Formato de correo inválido
                            </span>
                        )}
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
                    <button type="submit" className="btn btn-primary" disabled={loading || !isEmailValid}>
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
