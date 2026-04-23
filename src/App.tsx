import React from 'react';
import UnicomerLogo from './assets/unicomer.png';
import { Authenticator, View, Text, Heading, useTheme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { Layout } from './components/Layout';
import './index.css';
import { AcceptanceLanding } from './components/AcceptanceLanding';
import { TransactionInitiator } from './components/TransactionInitiator';
// import { ApiDocs } from './components/ApiDocs';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

Amplify.configure(outputs);

const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.xl}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <img src={UnicomerLogo} alt="Unicomer Logo" style={{ height: '200px', width: 'auto', objectFit: 'contain', transform: 'scale(1.3)' }} />
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
  const [selectedProcesoId, setSelectedProcesoId] = React.useState<string | null>(null);
  const [isCreationRoute, setIsCreationRoute] = React.useState(false);
  const [isApiDocsRoute, setIsApiDocsRoute] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const idProceso = params.get('idProceso');
    const path = window.location.pathname.replace(/\/$/, ''); // Remove trailing slash for comparison

    if (id) {
      setTransactionId(id);
    } else if (idProceso) {
      setSelectedProcesoId(idProceso);
      setIsCreationRoute(true);
    } else if (path === '/creacionProceso') {
      setIsCreationRoute(true);
    } else if (path === '/api-docs') {
      setIsApiDocsRoute(true);
    }
  }, []);

  // 1. PUBLIC ROUTE: Acceptance Landing (Landing by UUID)
  if (transactionId) {
    return <AcceptanceLanding transactionId={transactionId} />;
  }

  // 2. PUBLIC ROUTE: Process Creation (Initiator)
  if (isCreationRoute) {
    return <TransactionInitiatorPage initialProcesoId={selectedProcesoId} />;
  }

  // 3. PRIVATE ROUTE: API Documentation (Authentication Required)
  if (isApiDocsRoute) {
    return (
      <Authenticator components={components}>
        {({ signOut, user }) => (
          <Layout user={user} signOut={signOut} activeView="api-docs" />
        )}
      </Authenticator>
    );
  }

  // 4. PRIVATE ROUTE: Admin Dashboard (Authentication Required)
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
const TransactionInitiatorPage = ({ initialProcesoId }: { initialProcesoId?: string | null }) => {
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
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <img src={UnicomerLogo} alt="Unicomer Logo" style={{ height: '150px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h1>Generar Solicitud</h1>
        <p>¡Hola! Para continuar con tu solicitud, por favor completa tus datos:</p>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <TransactionInitiator
          procesos={procesos}
          initialProcesoId={initialProcesoId || undefined}
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
