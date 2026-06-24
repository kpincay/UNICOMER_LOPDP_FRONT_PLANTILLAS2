import React from 'react';
import { fetchUserAttributes, updatePassword, updateUserAttributes } from 'aws-amplify/auth';
import { validatePassword } from '../services/passwordValidator';
import { CustomPasswordRequirements } from './CustomPasswordRequirements';
import UnicomerLogo from '../assets/unicomer.png';
import {
  View,
  Heading,
  Text,
  Button,
  PasswordField,
  Flex,
  Alert,
} from '@aws-amplify/ui-react';

// Props interface for the password expiration guard component
interface PasswordExpirationGuardProps {
  user: any;
  signOut: any;
  children: React.ReactNode;
}

export const PasswordExpirationGuard = ({ user, signOut, children }: PasswordExpirationGuardProps) => {
  const [passwordExpired, setPasswordExpired] = React.useState(() => {
    const username = user?.signInDetails?.loginId || user?.username;
    if (!username) return false;
    const updatedAtStr = localStorage.getItem(`password_updated_at_${username}`);
    if (updatedAtStr) {
      const diffDays = Math.ceil(
        Math.abs(Date.now() - new Date(updatedAtStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays > 60;
    }
    return false;
  });

  const [checking, setChecking] = React.useState(() => {
    const username = user?.signInDetails?.loginId || user?.username;
    if (!username) return true;
    const updatedAtStr = localStorage.getItem(`password_updated_at_${username}`);
    return !updatedAtStr;
  });

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [userAttributes, setUserAttributes] = React.useState<{ givenName?: string; familyName?: string }>({});

  const checkedRef = React.useRef(false);
  const justUpdatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!passwordExpired) return;

    let cancelled = false;
    async function loadAttributes() {
      try {
        const attributes = await fetchUserAttributes();
        if (cancelled) return;
        setUserAttributes({
          givenName: attributes.given_name || '',
          familyName: attributes.family_name || '',
        });
      } catch (err) {
        console.warn('Error fetching user attributes for password validation:', err);
      }
    }
    loadAttributes();
    return () => {
      cancelled = true;
    };
  }, [passwordExpired]);

  React.useEffect(() => {
    if (checkedRef.current || justUpdatedRef.current) return;

    const username = user?.signInDetails?.loginId || user?.username;
    if (!username) return;

    const localValue = localStorage.getItem(`password_updated_at_${username}`);
    if (localValue) {
      checkedRef.current = true;
      return;
    }

    let cancelled = false;

    async function checkCognitoFallback() {
      try {
        const attributes = await fetchUserAttributes();
        const updatedAtStr = attributes['custom:passwordUpdatedAt'] || null;
        if (cancelled) return;

        if (updatedAtStr) {
          localStorage.setItem(`password_updated_at_${username}`, updatedAtStr);
          const diffDays = Math.ceil(
            Math.abs(Date.now() - new Date(updatedAtStr).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays > 60) setPasswordExpired(true);
        } else {
          localStorage.setItem(`password_updated_at_${username}`, new Date().toISOString());
        }
      } catch (err) {
        console.warn('Cognito custom attribute not available:', err);
      } finally {
        if (!cancelled) {
          checkedRef.current = true;
          setChecking(false);
        }
      }
    }

    checkCognitoFallback();
    return () => { cancelled = true; };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    const username = user?.signInDetails?.loginId || user?.username;

    const complexityError = validatePassword(newPassword, {
      username: username || '',
      email: user?.signInDetails?.loginId,
      givenName: userAttributes.givenName,
      familyName: userAttributes.familyName,
    });

    if (complexityError) {
      setErrorMsg(complexityError);
      return;
    }

    setLoading(true);
    try {
      justUpdatedRef.current = true;

      await updatePassword({ oldPassword: currentPassword, newPassword });

      const nowStr = new Date().toISOString();
      localStorage.setItem(`password_updated_at_${username}`, nowStr);

      try {
        await updateUserAttributes({
          userAttributes: { 'custom:passwordUpdatedAt': nowStr },
        });
      } catch (cognitoErr) {
        console.warn('custom:passwordUpdatedAt not available in Cognito:', cognitoErr);
      }

      setSuccessMsg('Password updated successfully!');

      await new Promise(resolve => setTimeout(resolve, 2000));

      setPasswordExpired(false);
    } catch (err: any) {
      console.error(err);
      justUpdatedRef.current = false;
      setErrorMsg(err.message || 'Error updating password. Verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary, #fff)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img
              src={UnicomerLogo}
              alt="Unicomer Logo"
              style={{ height: '200px', width: 'auto', objectFit: 'contain', transform: 'scale(1.3)' }}
            />
          </div>
          <Heading level={3} className="login-branding" style={{ marginTop: '1rem' }}>
            Plantillas
          </Heading>
          <Text color="var(--text-muted)">Cargando...</Text>
        </div>
      </div>
    );
  }

  if (passwordExpired) {
    return (
      <div
        data-amplify-authenticator=""
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary, #fff)',
        }}
      >
        <div data-amplify-container="">
          <View textAlign="center" padding="var(--amplify-space-xl)">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <img
                src={UnicomerLogo}
                alt="Unicomer Logo"
                style={{ height: '200px', width: 'auto', objectFit: 'contain', transform: 'scale(1.3)' }}
              />
            </div>
            <Heading level={3} className="login-branding" style={{ marginTop: '1rem' }}>
              Plantillas
            </Heading>
            <Text color="var(--text-muted)">Sistema de Gesti&oacute;n de Documentos</Text>
          </View>

          <div data-amplify-router="">
            <form data-amplify-form="" onSubmit={handleSubmit}>
              <Flex direction="column" padding="var(--amplify-space-xl)" gap="var(--amplify-space-small)">
                <Heading level={4}>Update Password</Heading>
                <Text>
                  To ensure corporate security, your password must be updated every 60 days.
                </Text>

                {errorMsg && (
                  <Alert variation="error" isDismissible={false}>
                    {errorMsg}
                  </Alert>
                )}

                {successMsg && (
                  <Alert variation="success" isDismissible={false}>
                    {successMsg}
                  </Alert>
                )}

                <PasswordField
                  label="Current Password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  isRequired
                  isDisabled={loading}
                  autoComplete="current-password"
                />

                <PasswordField
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  isRequired
                  isDisabled={loading}
                  autoComplete="new-password"
                  descriptiveText={
                    <CustomPasswordRequirements
                      password={newPassword}
                      username={user?.signInDetails?.loginId || user?.username}
                      email={user?.signInDetails?.loginId}
                      givenName={userAttributes.givenName}
                      familyName={userAttributes.familyName}
                    />
                  }
                />

                <PasswordField
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isRequired
                  isDisabled={loading}
                  autoComplete="new-password"
                />

                <Button
                  variation="primary"
                  isFullWidth={true}
                  type="submit"
                  isLoading={loading}
                  loadingText="Updating..."
                >
                  Update Password
                </Button>

                <Button
                  variation="link"
                  isFullWidth={true}
                  onClick={signOut}
                  type="button"
                  size="small"
                >
                  Back to Sign In
                </Button>
              </Flex>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
