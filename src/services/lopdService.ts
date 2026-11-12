/**
 * Utility for interacting with the external LOPD Backend
 */

const LOPD_BASE_URL = 'https://0sikyas0mf.execute-api.us-east-1.amazonaws.com/v1';
const API_KEY = '6FWGvXEkV38x9nuqGDayV6bfxZBe7Zvc997JO5hn'; // Updated from user providing Postman image
const ACCEPTANCE_API_URL = import.meta.env.VITE_ACCEPTANCE_API_URL || 'https://9civzmoz57.execute-api.us-east-1.amazonaws.com/v1/aceptaciones';
const ACCEPTANCE_API_KEY = import.meta.env.VITE_ACCEPTANCE_API_KEY;

interface AcceptanceResponse {
    success: boolean;
    aceptacionId: string;
    aceptacionGuardada: boolean;
    correo?: { estado?: string };
    correlacionId?: string;
    message?: string;
}

export interface TransactionData {
    cedula: string;
    ip: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    telefono: string;
    channel: string;
    storeId: string;
    proceso: string[]; 
    process?: string[]; // Campo para compatibilidad con backend
    procesos?: string[]; // Campo para compatibilidad con backend
    plantillas?: string[]; // IDs de plantillas especificas a firmar
}

export interface TransactionUpdateData {
    id: string;
    nombres: string;
    correo: string;
    telefono: string;
    estado: string;
    channel: string;
    storeId: string;
    process: string[];
}

export const lopdService = {
    async registerAcceptance(transaccionId: string, plantillasAceptadas: string[]): Promise<AcceptanceResponse> {
        if (!ACCEPTANCE_API_URL || !ACCEPTANCE_API_KEY) {
            throw new Error('El servicio de aceptación no está configurado.');
        }

        const response = await fetch(ACCEPTANCE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ACCEPTANCE_API_KEY
            },
            body: JSON.stringify({ transaccionId, plantillasAceptadas })
        });

        let result: AcceptanceResponse;
        try {
            result = await response.json();
        } catch {
            throw new Error(`Respuesta inválida del servicio de aceptación (HTTP ${response.status}).`);
        }

        if (!response.ok || result.success !== true || result.aceptacionGuardada !== true) {
            throw new Error(result.message || `No se pudo guardar la aceptación (HTTP ${response.status}).`);
        }

        return result;
    },

    /**
     * Creates a new LOPD transaction
     */
    async createTransaction(data: TransactionData) {
        const response = await fetch(`${LOPD_BASE_URL}/rest/faceid/lopd/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error creating transaction: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Gets transaction details by ID
     */
    async getTransactionById(id: string) {
        const response = await fetch(`${LOPD_BASE_URL}/rest/faceid/lopd/get?id=${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({}) // Added empty body as Postman seems to include it
        });

        if (!response.ok) {
            throw new Error(`Error fetching transaction: ${response.statusText}`);
        }

        return await response.json();
    },

    async updateTransaction(data: TransactionUpdateData) {
        const response = await fetch(`${LOPD_BASE_URL}/rest/faceid/lopd/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error updating transaction: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Gets all historical transactions
     */
    async getHistoricalTransactions() {
        const response = await fetch(`${LOPD_BASE_URL}/rest/faceid/lopd/get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`Error fetching historical transactions: ${response.statusText}`);
        }

        return await response.json();
    }
};
