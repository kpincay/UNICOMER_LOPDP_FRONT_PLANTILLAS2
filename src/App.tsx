import React from 'react';
import { Authenticator, View, Text, Heading, useTheme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { Layout } from './components/Layout';
import './index.css';
import { AcceptanceLanding } from './components/AcceptanceLanding';
import { TransactionInitiator } from './components/TransactionInitiator';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

Amplify.configure(outputs);

const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.xl}>
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H66a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <Heading level={3} className="login-branding" style={{ marginTop: '1rem' }}>
          Plantillas
        </Heading>
        <Text color="var(--text-muted)">Sistema de Gestión de Documentos</Text>
      </View>
    );
  },
};

export default function App() {
  const [transactionId, setTransactionId] = React.useState<string | null>(null);
  const [isCreationRoute, setIsCreationRoute] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const path = window.location.pathname.replace(/\/$/, ''); // Remove trailing slash for comparison

    if (id) {
      setTransactionId(id);
    } else if (path === '/creacionProceso') {
      setIsCreationRoute(true);
    }
  }, []);

  // 1. PUBLIC ROUTE: Acceptance Landing (Landing by UUID)
  if (transactionId) {
    return <AcceptanceLanding transactionId={transactionId} />;
  }

  // 2. PUBLIC ROUTE: Process Creation (Initiator)
  if (isCreationRoute) {
    return <TransactionInitiatorPage />;
  }

  // 3. PRIVATE ROUTE: Admin Dashboard (Authentication Required)
  return (
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <Layout user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}

/**
 * Wrapper for the public Transaction Initiator page
 */
const TransactionInitiatorPage = () => {
  const [procesos, setProcesos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const client = React.useMemo(() => generateClient<Schema>(), []);

  React.useEffect(() => {
    async function fetchProcesos() {
      try {
        const { data } = await client.models.Proceso.list();
        setProcesos(data);
      } catch (error) {
        console.error('Error loading procesos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProcesos();
  }, [client]);

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner"></div></div>;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: 'var(--space-2xl) var(--space-lg)' }}>
      <div className="landing-header">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h1>Generar Solicitud LOPDP</h1>
        <p>Registro de nueva transacción de aceptación de datos</p>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <TransactionInitiator
          procesos={procesos}
          onClose={() => window.location.href = '/'}
          onSuccess={(url) => {
            // For public page, we show a result view instead of just an alert
            alert(`Solicitud generada con éxito. URL para el cliente: ${url}`);
          }}
        />
      </div>
    </div>
  );
};
