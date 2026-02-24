import { Authenticator, View, Text, Heading, useTheme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { Layout } from './components/Layout';
import './index.css';

Amplify.configure(outputs);

const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.xl}>
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
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
  return (
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <Layout user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}
