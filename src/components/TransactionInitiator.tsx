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

    const buildAcceptanceUrl = (baseUrl: string | undefined, transactionId: string, procesoId: string) => {
        const fallbackUrl = `${window.location.origin}?id=${encodeURIComponent(transactionId)}&idProceso=${encodeURIComponent(procesoId)}`;

        if (!baseUrl) {
            return fallbackUrl;
        }

        try {
            const url = new URL(baseUrl);
            url.searchParams.set('id', transactionId);
            url.searchParams.set('idProceso', procesoId);
            return url.toString();
        } catch {
            let safeUrl = baseUrl.replace(/[?&](id|idProceso|transactionId)=([^&]+)/gi, '');
            const newSeparator = safeUrl.includes('?') ? '&' : '?';
            return `${safeUrl}${newSeparator}id=${encodeURIComponent(transactionId)}&idProceso=${encodeURIComponent(procesoId)}`;
        }
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
            const landingUrl = buildAcceptanceUrl(backendUrl, transactionId, formData.procesoId);



            window.location.href = landingUrl;

            const emailBody = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 0; border: 2px solid #1554a1; border-radius: 8px; overflow: hidden;">
                    <div style="text-align: center; background-color: #1554a1; padding: 20px 0;">
                        <img src="https://master.d373a3mueuc4js.amplifyapp.com/LOGO_UNICOMER_2.jpg?v=3" alt="Unicomer" width="200" style="display: inline-block; height: auto;" />
                    </div>
                    <div style="padding: 20px;">
                        <p>Estimado/a Cliente <strong>${formData.nombres} ${formData.apellidoPaterno}</strong>,</p>
                        <p>En Unicomer del Ecuador valoramos la transparencia y la protección de sus datos personales.</p>
                        <p>En cumplimiento de la normativa vigente sobre protección de datos personales, le solicitamos de manera amable su consentimiento para el tratamiento de sus datos personales.</p>

                        <p>Para otorgar su consentimiento, le pedimos por favor acceder al siguiente enlace o escanear el código QR:</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${landingUrl}" style="background-color: #1554a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Enlace al formulario de consentimiento</a>
                        </div>
                        <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
                        <p style="word-break: break-all;"><a href="${landingUrl}">${landingUrl}</a></p>
                        <div style="margin: 30px 0; text-align: center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(landingUrl)}" alt="Código QR al formulario de consentimiento" />
                        </div>
                        <hr style="border: 0; border-top: 2px solid #1554a1; margin: 20px 0;" />
                        <p style="font-size: 0.9rem;">Podrá conocer nuestra política en: <a href="https://www.artefacta.com/politica-proteccion-de-datos-personales" target="_blank" rel="noopener noreferrer" style="color: #1554a1; font-weight: bold;">https://www.artefacta.com/politica-proteccion-de-datos-personales</a> y ejercer sus derechos de protección de datos contactándose al correo: <a href="mailto:dpo_ec@unicomer.com" style="color: #1554a1; font-weight: bold;">dpo_ec@unicomer.com</a></p>
                        <p style="font-size: 0.9rem;">El otorgamiento del consentimiento es voluntario y podrá revocarlo en cualquier momento, conforme a la ley aplicable.</p>
                    </div>
                </div>
            `;

            try {
                await (client.mutations as any).sendEmail({
                    to: formData.correo,
                    subject: 'Autorización para el Tratamiento de sus Datos Personales - UNICOMER',
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
            <div className="glass-card request-result-card animate-scaleUp" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
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
        <div className="glass-card request-card animate-scaleUp" style={{ padding: 'var(--space-xl)' }}>
            <form className="request-form" onSubmit={handleSubmit}>
                <div className="form-grid request-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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

                <div className="request-actions" style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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

