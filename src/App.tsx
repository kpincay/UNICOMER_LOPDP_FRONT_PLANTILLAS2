import React from 'react';
import UnicomerLogo from './assets/unicomer.png';
import { Authenticator, View, Text, Heading, useTheme, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import { signUp, confirmResetPassword, signIn, fetchUserAttributes } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';
import { Layout } from './components/Layout';
import './index.css';
import { AcceptanceLanding } from './components/AcceptanceLanding';
import { TransactionInitiator } from './components/TransactionInitiator';
// import { ApiDocs } from './components/ApiDocs';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { validatePassword } from './services/passwordValidator';
import { PasswordExpirationGuard } from './components/PasswordExpirationGuard';
import { CustomPasswordRequirements } from './components/CustomPasswordRequirements';

Amplify.configure(outputs);

const authenticatorServices = {
  async handleSignIn(input: any) {
    const { username, password, options } = input;
    const result = await signIn({ username, password, options });
    if (result.isSignedIn) {
      try {
        const attributes = await fetchUserAttributes();
        const updatedAtStr = attributes['custom:passwordUpdatedAt'] || null;
        if (updatedAtStr) {
          localStorage.setItem(`password_updated_at_${username}`, updatedAtStr);
        } else {
          localStorage.setItem(`password_updated_at_${username}`, new Date().toISOString());
        }
      } catch (err) {
        console.warn(err);
      }
    }
    return result;
  },
  async handleSignUp(input: any) {
    const { username, password, options } = input;
    const validationError = validatePassword(password, {
      username,
      email: options?.userAttributes?.email,
      givenName: options?.userAttributes?.given_name,
      familyName: options?.userAttributes?.family_name,
    });
    if (validationError) {
      throw new Error(validationError);
    }

    localStorage.setItem(`password_updated_at_${username}`, new Date().toISOString());

    const updatedOptions = {
      ...options,
      userAttributes: {
        ...options?.userAttributes,
        'custom:passwordUpdatedAt': new Date().toISOString()
      }
    };
    return signUp({ username, password, options: updatedOptions });
  },
  async handleForgotPasswordSubmit(input: any) {
    const { username, confirmationCode, newPassword } = input;

    const lastUpdate = localStorage.getItem(`password_updated_at_${username}`);
    if (lastUpdate) {
      const diffMs = Math.abs(Date.now() - new Date(lastUpdate).getTime());
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        throw new Error('You cannot change it more than once a day.');
      }
    }

    const validationError = validatePassword(newPassword, {
      username,
    });
    if (validationError) {
      throw new Error(validationError);
    }

    localStorage.setItem(`password_updated_at_${username}`, new Date().toISOString());

    return confirmResetPassword({ username, confirmationCode, newPassword });
  },
};

const authenticatorFormFields: any = {
  signUp: {
    password: {
      descriptiveText: <CustomPasswordRequirements />,
    },
  },
  confirmResetPassword: {
    password: {
      descriptiveText: <CustomPasswordRequirements />,
    },
  },
  forceNewPassword: {
    password: {
      descriptiveText: <CustomPasswordRequirements />,
    },
  },
};


const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.xl}>
        <div style={{ marginBottom: 0, display: 'flex', justifyContent: 'center' }}>
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

const StableLayout = React.memo(
  ({ user, signOut, activeView }: { user: any; signOut: any; activeView?: string }) => (
    <Layout user={user} signOut={signOut} activeView={activeView} />
  ),
  (prev, next) =>
    prev.user?.username === next.user?.username && prev.activeView === next.activeView
);

const BeforeUnloadGuard = () => {
  const { route } = useAuthenticator((context) => [context.route]);

  React.useEffect(() => {
    if (route === 'confirmSignUp') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [route]);

  return null;
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
    const path = window.location.pathname.replace(/\/$/, '');

    if (id) {
      setTransactionId(id);
    } else if (idProceso) {
      sessionStorage.setItem('pending_proceso_id', idProceso);
      setSelectedProcesoId(idProceso);
      setIsCreationRoute(true);
    } else if (path === '/creacionProceso') {
      setIsCreationRoute(true);
    } else if (path === '/api-docs') {
      setIsApiDocsRoute(true);
    }
  }, []);

  if (transactionId) {
    return <AcceptanceLanding transactionId={transactionId} />;
  }

  if (isCreationRoute) {
    return <TransactionInitiatorPage initialProcesoId={selectedProcesoId} />;
  }

  if (isApiDocsRoute) {
    return (
      <Authenticator.Provider>
        <BeforeUnloadGuard />
        <Authenticator components={components} services={authenticatorServices} formFields={authenticatorFormFields}>
          {({ signOut, user }) => (
            <PasswordExpirationGuard user={user} signOut={signOut}>
              <StableLayout user={user} signOut={signOut} activeView="api-docs" />
            </PasswordExpirationGuard>
          )}
        </Authenticator>
      </Authenticator.Provider>
    );
  }

  return (
    <Authenticator.Provider>
      <BeforeUnloadGuard />
      <Authenticator components={components} services={authenticatorServices} formFields={authenticatorFormFields}>
        {({ signOut, user }) => (
          <PasswordExpirationGuard user={user} signOut={signOut}>
            <StableLayout user={user} signOut={signOut} />
          </PasswordExpirationGuard>
        )}
      </Authenticator>
    </Authenticator.Provider>
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

  if (loading) return <div className="request-page flex-center"><div className="spinner"></div></div>;

  return (
    <div className="request-page" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: 'var(--space-2xl) var(--space-lg)' }}>
      <div className="landing-header request-header">
        <div className="request-logo-wrap">
          <img src={UnicomerLogo} alt="Unicomer Logo" />
        </div>
        <div className="partner-logos" aria-label="Marcas asociadas">
          <span className="partner-logo-card partner-logo-artefacta">
            <img src="/artefacta-logo.png" alt="Artefacta" />
          </span>
          <span className="partner-logo-card partner-logo-radioshack">
            <img src="/radioshack-logo-2.png" alt="RadioShack" />
          </span>
        </div>
        <h1>Generar Solicitud</h1>
        <p>¡Hola! Para continuar con tu solicitud, por favor completa tus datos:</p>
      </div>
      <div className="request-form-wrap" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
