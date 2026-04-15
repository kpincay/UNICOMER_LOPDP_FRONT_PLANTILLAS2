import React, { useState, useEffect } from 'react';
import { Send, User, IdCard, Mail, Phone, Hash, CheckCircle, Copy } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { lopdService } from '../services/lopdService';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface TransactionInitiatorProps {
    procesos: Schema['Proceso']['type'][];
    initialProcesoId?: string;
    onClose: () => void;
    onSuccess: (url: string) => void;
}

export const TransactionInitiator: React.FC<TransactionInitiatorProps> = ({ procesos, initialProcesoId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cedula: '',
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        correo: '',
        telefono: '',
        procesoId: '',
    });

    const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'yahoo.com'];

    useEffect(() => {
        if (procesos && procesos.length > 0 && !formData.procesoId) {
            const defaultProceso = initialProcesoId && procesos.some(p => p.id === initialProcesoId)
                ? initialProcesoId
                : procesos[0].id;
            setFormData(prev => ({ ...prev, procesoId: defaultProceso }));
        }
    }, [procesos, initialProcesoId]);

    const validateCedula = (cedula: string) => {
        if (!/^\d{10}$/.test(cedula)) return false;
        const digits = cedula.split('').map(Number);
        const province = parseInt(cedula.substring(0, 2), 10);
        if (province < 1 || (province > 24 && province !== 30)) return false;
        const thirdDigit = digits[2];
        if (thirdDigit >= 6) return false;

        const coeficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let val = digits[i] * coeficients[i];
            if (val > 9) val -= 9;
            sum += val;
        }
        const lastDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
        return lastDigit === digits[9];
    };

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone: string) => {
        return /^0\d{9}$/.test(phone);
    };

    const isCedulaValid = !formData.cedula || validateCedula(formData.cedula);
    const isEmailValid = !formData.correo || validateEmail(formData.correo);
    const isPhoneValid = !formData.telefono || validatePhone(formData.telefono);
    const isFormComplete = formData.cedula && formData.nombres && formData.apellidoPaterno && 
                          formData.apellidoMaterno && formData.correo && formData.telefono &&
                          validateCedula(formData.cedula) && validateEmail(formData.correo) && 
                          validatePhone(formData.telefono);

    const handleEmailChange = (value: string) => {
        setFormData({ ...formData, correo: value });
        if (value.includes('@')) {
            const [username, domainPart] = value.split('@');
            if (domainPart !== undefined) {
                const filtered = domains
                    .filter(d => d.startsWith(domainPart) && d !== domainPart)
                    .map(d => `${username}@${d}`);
                setEmailSuggestions(filtered);
            }
        } else {
            setEmailSuggestions([]);
        }
    };

    const selectEmailSuggestion = (suggestion: string) => {
        setFormData({ ...formData, correo: suggestion });
        setEmailSuggestions([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCedula(formData.cedula)) {
            alert('Cédula inválida');
            return;
        }

        if (!validateEmail(formData.correo)) {
            alert('Correo electrónico inválido');
            return;
        }

        if (!validatePhone(formData.telefono)) {
            alert('El celular debe tener 10 dígitos');
            return;
        }

        setLoading(true);
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => ({ json: () => ({ ip: '127.0.0.1' }) }));
            const { ip } = await (ipResponse as any).json();

            const transactionData = {
                cedula: formData.cedula,
                ip: ip,
                nombres: formData.nombres,
                apellidoPaterno: formData.apellidoPaterno,
                apellidoMaterno: formData.apellidoMaterno,
                correo: formData.correo,
                telefono: formData.telefono,
                channel: 'web',
                storeId: 'MAIN_STORE',
                proceso: [formData.procesoId]
            };

            const result = await lopdService.createTransaction(transactionData);

            let parsedResult = result;
            if (result.body && typeof result.body === 'string') {
                try {
                    const parsedBody = JSON.parse(result.body);
                    parsedResult = (parsedBody.data && Array.isArray(parsedBody.data)) ? parsedBody.data[0] : (parsedBody.data || parsedBody);
                } catch (e) {
                    console.warn('Failed to parse response body string', e);
                }
            } else if (result.data) {
                parsedResult = Array.isArray(result.data) ? result.data[0] : result.data;
            }

            const backendUrl = parsedResult.url || parsedResult.link || parsedResult.Url || parsedResult.URL || parsedResult.url_transaccion;
            const transactionId = parsedResult.id || result.id;
            const landingUrl = backendUrl || `${window.location.origin}?id=${transactionId}`;

            window.location.href = landingUrl;

            const emailBody = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Autorización de Protección de Datos (LOPDP)</h2>
                    <p>Hola <strong>${formData.nombres} ${formData.apellidoPaterno}</strong>,</p>
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
            } catch (emailError) {
                console.error('Error al enviar correo via SES:', emailError);
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
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label><IdCard size={14} /> Cédula de identidad</label>
                        <input
                            type="text"
                            required
                            maxLength={10}
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
                            placeholder="Ej: 0987654321"
                            className={!isCedulaValid ? 'input-error' : ''}
                        />
                        {!isCedulaValid && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '4px' }}>
                                Cédula ecuatoriana inválida
                            </span>
                        )}
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label><User size={14} /> Nombres</label>
                        <input
                            type="text"
                            required
                            value={formData.nombres}
                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                            placeholder="Ej: Juan Antonio"
                        />
                    </div>

                    <div className="form-group">
                        <label><User size={14} /> Apellido Paterno</label>
                        <input
                            type="text"
                            required
                            value={formData.apellidoPaterno}
                            onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                            placeholder="Ej: Pérez"
                        />
                    </div>

                    <div className="form-group">
                        <label><User size={14} /> Apellido Materno</label>
                        <input
                            type="text"
                            required
                            value={formData.apellidoMaterno}
                            onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                            placeholder="Ej: García"
                        />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label><Mail size={14} /> Correo electrónico</label>
                        <input
                            type="email"
                            required
                            value={formData.correo}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            className={!isEmailValid ? 'input-error' : ''}
                            autoComplete="off"
                        />
                        {!isEmailValid && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '4px' }}>
                                Formato de correo inválido
                            </span>
                        )}
                        {emailSuggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-md)',
                                zIndex: 10,
                                marginTop: '4px'
                            }}>
                                {emailSuggestions.map((s, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => selectEmailSuggestion(s)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            borderBottom: i === emailSuggestions.length - 1 ? 'none' : '1px solid var(--border-color)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label><Phone size={14} /> Número de celular</label>
                        <input
                            type="tel"
                            required
                            maxLength={10}
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
                            placeholder="Ej: 0998877665"
                            className={!isPhoneValid ? 'input-error' : ''}
                        />
                        {!isPhoneValid && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '4px' }}>
                                Debe iniciar con 0 y tener 10 dígitos
                            </span>
                        )}
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label hidden><Hash size={14} /> Proceso a Seguir</label>
                        <select
                            hidden
                            required
                            value={formData.procesoId}
                            onChange={(e) => setFormData({ ...formData, procesoId: e.target.value })}
                        >
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
                    <button type="submit" className="btn btn-primary" disabled={loading || !isFormComplete}>
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

