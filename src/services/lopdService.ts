/**
 * Utility for interacting with the external LOPD Backend
 */

const LOPD_BASE_URL = 'https://0sikyas0mf.execute-api.us-east-1.amazonaws.com/v1';
const API_KEY = '6FWGvXEkV38x9nuqGDayV6bfxZBe7Zvc997JO5hn'; // Updated from user providing Postman image

export interface TransactionData {
    cedula: string;
    ip: string;
    nombres: string;
    correo: string;
    telefono: string;
    channel: string;
    storeId: string;
    proceso: string[]; 
}

export const lopdService = {
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

    /**
     * Updates transaction state (e.g., to "procesado")
     */
    async updateTransaction(id: string, data: any) {
        const response = await fetch(`${LOPD_BASE_URL}/rest/faceid/lopd/update?id=${id}`, {
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
    }
};
