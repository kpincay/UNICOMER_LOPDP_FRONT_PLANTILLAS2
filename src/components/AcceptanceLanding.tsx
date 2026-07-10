import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';
import UnicomerLogo from '../assets/unicomer.png';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { lopdService } from '../services/lopdService';

const client = generateClient<Schema>();

export const AcceptanceLanding: React.FC<{ transactionId: string }> = ({ transactionId }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [procesoConfig, setProcesoConfig] = useState<Schema['Proceso']['type'] | null>(null);
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [processIds, setProcessIds] = useState<string[]>([]);

    const extractProcessIds = (transData: any): string[] => {
        const ids = new Set<string>();

        const addValue = (value: any) => {
            if (Array.isArray(value)) {
                value.forEach(item => addValue(item));
                return;
            }

            if (typeof value === 'string' && value.trim()) {
                value.split(',').map(item => item.trim()).filter(Boolean).forEach(item => ids.add(item));
            }
        };

        addValue(transData?.process);
        addValue(transData?.proceso);
        addValue(transData?.procesoId ?? transData?.id_proceso ?? transData?.proceso_id);

        const pendingProcessId = sessionStorage.getItem('pending_proceso_id');
        if (pendingProcessId) {
            ids.add(pendingProcessId);
        }

        return Array.from(ids);
    };

    useEffect(() => {
        const loadTransactionData = async () => {
            try {
                // 1. Get transaction from external backend
                let response = await lopdService.getTransactionById(transactionId);

                // Handle inconsistent API: stringified body vs direct object, array vs object
                let transData = response;

                if (response.body && typeof response.body === 'string') {
                    try {
                        const parsedBody = JSON.parse(response.body);
                        const rData = parsedBody.data;
                        if (Array.isArray(rData)) {
                            transData = rData.find((item: any) => item.id === transactionId) || (rData.length > 0 ? rData[0] : parsedBody);
                        } else if (rData && typeof rData === 'object') {
                            transData = rData;
                        } else {
                            transData = parsedBody;
                        }
                    } catch (e) {
                        console.warn('Failed to parse response body string, using raw response', e);
                    }
                } else if (response.data) {
                    if (Array.isArray(response.data)) {
                        transData = response.data.find((item: any) => item.id === transactionId) || (response.data.length > 0 ? response.data[0] : response);
                    } else if (typeof response.data === 'object') {
                        transData = response.data;
                    }
                }

                setTransaction(transData);

                // 2. Fetch templates for the process(es) associated with this transaction
                const { data: allPlantillas } = await client.models.Plantilla.list();
                const extractedProcessIds = extractProcessIds(transData);

                // Filter templates: only show those associated with this transaction or process(es)
                let filteredPlantillas: Schema['Plantilla']['type'][] = [];

                if (transData.plantillas && Array.isArray(transData.plantillas) && transData.plantillas.length > 0) {
                    filteredPlantillas = allPlantillas.filter(p => transData.plantillas.includes(p.id));
                } else if (extractedProcessIds.length > 0) {
                    filteredPlantillas = allPlantillas.filter(p => typeof p.procesoId === 'string' && extractedProcessIds.includes(p.procesoId));
                } else {
                    // IMPORTANT: No longer falling back to all templates.
                    // This prevents privacy leaks and ensures only relevant documents are shown.
                    console.warn('No processId found for transaction:', transactionId);
                    filteredPlantillas = [];
                }

                const filteredProcessIds = Array.from(new Set(
                    filteredPlantillas
                        .map(p => p.procesoId)
                        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
                ));

                setPlantillas(filteredPlantillas);
                setProcessIds(filteredProcessIds);

                const primaryProcessId = filteredProcessIds[0] || null;

                if (primaryProcessId) {
                    try {
                        const { data: pData, errors } = await client.models.Proceso.get({ id: primaryProcessId });
                        if (errors) console.error('GraphQL Errors fetching proceso:', errors);
                        setProcesoConfig(pData);
                    } catch (e) {
                        console.error('Network Error fetching proceso config:', e);
                    }
                }

                // Initialize checkboxes correctly
                const initialChecked: Record<string, boolean> = {};
                filteredPlantillas.forEach(p => {
                    initialChecked[p.id] = false;
                });
                setCheckedItems(initialChecked);

            } catch (error) {
                console.error('Error loading landing data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTransactionData();
    }, [transactionId]);

    const replacePlaceholders = (text: string | null | undefined, transData: any) => {
        if (!text) return text;
        let replaced = text;
        if (transData) {
            const fullName = [transData.nombres, transData.apellidoPaterno, transData.apellidoMaterno].filter(Boolean).join(' ');

            if (transData.nombres) replaced = replaced.replace(/\[\s*nombres?\s*\]/gi, transData.nombres);
            if (transData.apellidoPaterno) replaced = replaced.replace(/\[\s*apellidoPaterno\s*\]/gi, transData.apellidoPaterno);
            if (transData.apellidoMaterno) replaced = replaced.replace(/\[\s*apellidoMaterno\s*\]/gi, transData.apellidoMaterno);
            replaced = replaced.replace(/\[\s*nombre[s]?\s*completo[s]?\s*\]/gi, fullName);

            if (transData.cedula || transData.documento) replaced = replaced.replace(/\[\s*(n[uú]mero|c[eé]dula|identificaci[oó]n|id)\s*\]/gi, transData.cedula || transData.documento);
            if (transData.correo) replaced = replaced.replace(/\[\s*(correo|email|correo\s*electr[oó]nico)\s*\]/gi, transData.correo);
            if (transData.telefono) replaced = replaced.replace(/\[\s*(tel[eé]fono|celular)\s*\]/gi, transData.telefono);
        }
        return replaced;
    };

    const handleCheck = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isFormValid = () => {
        // Must check all plantillas that have 'requiereAceptacion' as true
        return plantillas.every(p => !p.requiereAceptacion || checkedItems[p.id]);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // 1. Update transaction state in external backend to 'aprobado' (matching successful POST /update example)
            const acceptedPlantillas = plantillas.filter(p => !p.requiereAceptacion || checkedItems[p.id]);
            const acceptedPlantillaIds = acceptedPlantillas.map(p => p.id);

            await lopdService.updateTransaction(transactionId, {
                nombres: transaction?.nombres || '',
                apellidoPaterno: transaction?.apellidoPaterno || '',
                apellidoMaterno: transaction?.apellidoMaterno || '',
                correo: transaction?.correo || '',
                estado: 'aprobado',
                fechaAceptacion: new Date().toISOString(),
                aceptaciones: checkedItems,
                procesos: processIds,
                plantillasAceptadas: acceptedPlantillaIds
            });

            // 2. Send confirmation email
            if (transaction?.correo) {
                const acceptedTemplatesList = acceptedPlantillas
                    .map(p => `<li>${p.nombre}</li>`)
                    .join('');

                const cleanName = (val: any) => val && val !== 'undefined' ? val : '';
                const apellidos = cleanName(transaction?.apellidos) || [cleanName(transaction?.apellidoPaterno), cleanName(transaction?.apellidoMaterno)].filter(Boolean).join(' ');
                const fullName = [cleanName(transaction?.nombres), apellidos].filter(Boolean).join(' ');

                const emailBody = `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 0; border: 2px solid #1554a1; border-radius: 8px; overflow: hidden;">
                        <div style="text-align: center; background-color: #1554a1; padding: 20px 0;">
                            <img src="https://master.d373a3mueuc4js.amplifyapp.com/LOGO_UNICOMER_2.jpg?v=3" alt="Unicomer" width="200" style="display: inline-block; height: auto;" />
                        </div>
                        <div style="padding: 20px;">
                            <p>Estimado/a <strong>${fullName}</strong>,</p>
                            <p>Por medio del presente, le informamos que el <strong>${new Date().toLocaleString('es-EC')}</strong> hemos registrado correctamente su aceptación del consentimiento para el tratamiento de sus datos personales, conforme a la normativa vigente en materia de protección de datos personales.</p>
                            <p>Las cláusulas aceptadas con las siguientes:</p>
                            <ul>
                                ${acceptedTemplatesList}
                            </ul>
                            <p style="font-size: 0.9rem;">El tratamiento se realiza bajo los principios de legalidad, finalidad, proporcionalidad y seguridad. Podrá conocer nuestra política en: <a href="https://www.artefacta.com/politica-de-proteccion-de-datos-personales" target="_blank" rel="noopener noreferrer" style="color: #1554a1; font-weight: bold;">https://www.artefacta.com/politica-de-proteccion-de-datos-personales</a> y ejercer sus derechos de protección de datos contactándose al correo: <a href="mailto:dpo_ec@unicomer.com" style="color: #1554a1; font-weight: bold;">dpo_ec@unicomer.com</a></p>
                        </div>
                    </div>
                `;

                try {
                    await (client.mutations as any).sendEmail({
                        to: transaction.correo,
                        subject: 'Confirmación de consentimiento para el tratamiento de datos personales - UNICOMER',
                        body: emailBody
                    });
                } catch (emailError) {
                    console.error('Error al enviar el correo de confirmación:', emailError);
                }
            }

            setCompleted(true);
            sessionStorage.removeItem('pending_proceso_id');
        } catch (error) {
            console.error('Error submitting acceptance:', error);
            alert('Error al procesar la aceptación. Por favor intente de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="landing-container flex-center">
                <div className="spinner"></div>
                <p>Cargando información del proceso...</p>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="landing-container flex-center">
                <div className="glass-card acceptance-done animate-scaleUp" style={{ maxWidth: '640px', textAlign: 'center', padding: '2.5rem' }}>
                    <CheckCircle size={72} className="text-success" />
                    <h2 style={{ marginTop: '1rem' }}>¡Proceso completado con éxito!</h2>
                    <p style={{ marginTop: '0.75rem', fontSize: '1.05rem' }}>
                        Muchas gracias, <strong>{transaction?.nombres} {transaction?.apellidoPaterno}</strong>.
                    </p>
                    <p>
                        Tus aceptaciones de privacidad han sido registradas correctamente conforme a la LOPDP.
                    </p>
                    <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>
                        No es necesario realizar ninguna acción adicional. Este proceso ha finalizado.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-container">
            <header className="landing-header">
                <img src={UnicomerLogo} alt="Unicomer Logo" style={{ height: '150px', width: 'auto', objectFit: 'contain', marginBottom: '1rem', transform: 'scale(1.2)', transformOrigin: 'left center' }} />
                <h1>{replacePlaceholders(procesoConfig?.tituloLanding, transaction) || procesoConfig?.nombre || 'Solicitud de Aceptación'}</h1>
            </header>

            <main className="landing-content animate-fadeIn">
                {!(procesoConfig?.tituloLanding?.toLowerCase().includes('buro') || procesoConfig?.tituloLanding?.toLowerCase().includes('buró') || procesoConfig?.nombre?.toLowerCase().includes('buro') || procesoConfig?.nombre?.toLowerCase().includes('buró')) && (
                    <div className="customer-info glass-card">
                        <h3>Hola, {transaction?.nombres} {transaction?.apellidoPaterno}</h3>
                        <p>Antes de empezar, ten en cuenta que necesitamos tu consentimiento para el tratamiento de tus datos personales, en la política de privacidad.</p>
                    </div>
                )}

                <div className="plantillas-list">
                    {plantillas.map(p => (
                        <div key={p.id} className={`plantilla-item glass-card ${p.requiereAceptacion ? 'mandatory' : ''}`}>
                            <div className="plantilla-header">
                                <FileText size={20} />
                                <h4>{p.nombre}</h4>
                                {p.requiereAceptacion && <span className="badge badge-warning">Requerido</span>}
                            </div>
                            <div className="plantilla-body">
                                <p>{replacePlaceholders(p.contenido, transaction) || 'Contenido de la política de privacidad...'}</p>
                                {p.url && <a href={p.url} target="_blank" rel="noreferrer">Ver documento completo</a>}
                            </div>
                            <div className="plantilla-footer">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={checkedItems[p.id] || false}
                                        onChange={() => handleCheck(p.id)}
                                    />
                                    <span className="checkmark"></span>
                                    <span>He leído y acepto los términos de esta cláusula.</span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                {!isFormValid() && (
                    <div className="validation-alert animate-bounce">
                        <AlertCircle size={18} />
                        <span>Por favor, acepta todas las cláusulas requeridas para continuar.</span>
                    </div>
                )}

                <footer className="landing-footer">
                    <button
                        className="btn btn-primary btn-lg"
                        disabled={submitting || !isFormValid()}
                        onClick={handleSubmit}
                    >
                        {submitting ? (
                            <>
                                <div className="spinner spinner-xs"></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Confirmar y Aceptar
                            </>
                        )}
                    </button>
                </footer>
            </main>
        </div>
    );
};
