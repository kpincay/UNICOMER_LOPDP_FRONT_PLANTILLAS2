import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Send, ShieldCheck } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { lopdService } from '../services/lopdService';

const client = generateClient<Schema>();

export const AcceptanceLanding: React.FC<{ transactionId: string }> = ({ transactionId }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [plantillas, setPlantillas] = useState<Schema['Plantilla']['type'][]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadTransactionData = async () => {
            try {
                // 1. Get transaction from external backend
                let response = await lopdService.getTransactionById(transactionId);

                // Handle inconsistent API: if response has a stringified body, unwrap it
                let transData = response;
                if (response.body && typeof response.body === 'string') {
                    try {
                        const parsedBody = JSON.parse(response.body);
                        transData = (parsedBody.data && parsedBody.data.length > 0) ? parsedBody.data[0] : parsedBody;
                    } catch (e) {
                        console.warn('Failed to parse response body string, using raw response', e);
                    }
                }

                setTransaction(transData);

                // 2. Fetch templates for the process associated with this transaction
                // Note: Assuming transData contains procesoId or we fetch based on the templates list
                // For this implementation, we'll fetch all templates and filter by those listed in the transaction
                // or just fetch all templates of the process if the backend provides the procesoId.
                const { data: allPlantillas } = await client.models.Plantilla.list();

                // Extract processId (Checking 'process' array as seen in successful GET response)
                const processId = (transData.process && transData.process.length > 0) ? transData.process[0] :
                    ((transData.proceso && transData.proceso.length > 0) ? transData.proceso[0] : transData.procesoId);

                if (transData.plantillas && transData.plantillas.length > 0) {
                    setPlantillas(allPlantillas.filter(p => transData.plantillas.includes(p.id)));
                } else if (processId) {
                    setPlantillas(allPlantillas.filter(p => p.procesoId === processId));
                } else {
                    // Fallback to all for demo/safety if nothing else found
                    setPlantillas(allPlantillas);
                }

                // Initialize checkboxes
                const initialChecked: Record<string, boolean> = {};
                setPlantillas(prev => {
                    prev.forEach(p => initialChecked[p.id] = false);
                    return prev;
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
            await lopdService.updateTransaction(transactionId, {
                nombres: transaction?.nombres || '',
                correo: transaction?.correo || '',
                estado: 'aprobado',
                fechaAceptacion: new Date().toISOString(),
                aceptaciones: checkedItems
            });

            setCompleted(true);
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
                <div className="glass-card acceptance-done animate-scaleUp">
                    <CheckCircle size={64} className="text-success" />
                    <h2>¡Proceso Completado!</h2>
                    <p>Muchas gracias, <strong>{transaction?.nombres}</strong>.</p>
                    <p>Tus aceptaciones de privacidad han sido registradas correctamente conforme a la LOPDP.</p>
                    <button className="btn btn-primary mt-20" onClick={() => window.close()}>
                        Cerrar Ventana
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-container">
            <header className="landing-header">
                <ShieldCheck size={32} className="brand-icon" />
                <h1>Autorización de Protección de Datos (LOPDP)</h1>
            </header>

            <main className="landing-content animate-fadeIn">
                <div className="customer-info glass-card">
                    <h3>Hola, {transaction?.nombres}</h3>
                    <p>Para continuar con tu solicitud, por favor revisa y acepta los siguientes términos y condiciones de protección de datos.</p>
                </div>

                <div className="plantillas-list">
                    {plantillas.map(p => (
                        <div key={p.id} className={`plantilla-item glass-card ${p.requiereAceptacion ? 'mandatory' : ''}`}>
                            <div className="plantilla-header">
                                <FileText size={20} />
                                <h4>{p.nombre}</h4>
                                {p.requiereAceptacion && <span className="badge badge-warning">Requerido</span>}
                            </div>
                            <div className="plantilla-body">
                                <p>{p.contenido || 'Contenido de la política de privacidad...'}</p>
                                {p.url && <a href={p.url} target="_blank" rel="noreferrer">Ver documento completo</a>}
                            </div>
                            <div className="plantilla-footer">
                                <label className="checkbox-container">
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
