import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { hasConsecutiveNumbers, RESTRICTED_WORDS } from '../services/passwordValidator';

interface CustomPasswordRequirementsProps {
  password?: string;
  username?: string;
  email?: string;
}

const CUSTOM_MARKER = 'data-custom-requirement';

const MESSAGES = {
  consecutive: 'Password cannot contain consecutive number sequences (e.g., 123 or 321)',
  userDetail: "Password must not contain the user's name, surname, or identifier",
  restricted: 'Password contains a restricted term not permitted by corporate policies',
};

// Determina el estado de las validaciones personalizadas basadas en el password e informacion del usuario
function buildValidationState(password: string, username: string, email: string) {
  const lowerPassword = password.toLowerCase();

  const isConsecutiveError = hasConsecutiveNumbers(password);

  let isUserDetailError = false;
  const excludedParts: string[] = [];
  if (username) {
    excludedParts.push(username.toLowerCase());
    if (username.includes('@')) {
      excludedParts.push(username.split('@')[0].toLowerCase());
    }
  }
  if (email) {
    excludedParts.push(email.toLowerCase());
    excludedParts.push(email.split('@')[0].toLowerCase());
  }
  const userTerms = excludedParts.filter(t => t && t.length >= 3);
  for (const term of userTerms) {
    if (lowerPassword.includes(term)) {
      isUserDetailError = true;
      break;
    }
  }

  let isRestrictedError = false;
  for (const word of RESTRICTED_WORDS) {
    if (lowerPassword.includes(word)) {
      isRestrictedError = true;
      break;
    }
  }

  return { isConsecutiveError, isUserDetailError, isRestrictedError };
}

// Busca el contenedor nativo de requisitos de Amplify dentro del campo o sus hermanos directos
function findNativeRequirementsContainer(passwordFieldEl: Element): Element | null {
  // Buscar dentro del propio passwordField (Amplify a menudo los renderiza como hijos)
  const innerReq = passwordFieldEl.querySelector('.amplify-field__requirements, .amplify-passwordfield__requirements, ul');
  if (innerReq) return innerReq;

  // Buscar en los elementos hermanos siguientes
  let sibling = passwordFieldEl.nextElementSibling;
  while (sibling) {
    if (
      sibling.tagName === 'UL' ||
      sibling.classList.contains('amplify-field__requirements') ||
      sibling.textContent?.includes('Password must have') ||
      sibling.textContent?.includes('Password must contain')
    ) {
      return sibling;
    }
    // Detener si llegamos a otro campo de formulario
    if (
      sibling.classList.contains('amplify-passwordfield') ||
      sibling.classList.contains('amplify-textfield') ||
      sibling.tagName === 'BUTTON'
    ) {
      break;
    }
    sibling = sibling.nextElementSibling;
  }

  return null;
}

// Crea un elemento de requisito con estilos consistentes, clonando el de referencia
function createRequirementItem(
  message: string,
  referenceItem: Element,
): HTMLElement {
  const tagName = referenceItem.tagName.toLowerCase();
  const item = document.createElement(tagName);
  item.setAttribute(CUSTOM_MARKER, 'true');
  item.setAttribute('data-custom-msg', message);
  item.className = referenceItem.className;

  // Copiar estilos computados para integracion visual limpia
  const refStyle = window.getComputedStyle(referenceItem);
  item.style.display = refStyle.display;
  item.style.alignItems = refStyle.alignItems;
  item.style.gap = refStyle.gap;
  item.style.flexDirection = refStyle.flexDirection;

  // Clonar icono SVG si existe en la referencia
  const svg = referenceItem.querySelector('svg');
  if (svg) {
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    clonedSvg.style.color = 'var(--amplify-colors-font-error, #950404)';
    item.appendChild(clonedSvg);
  }

  const refTextEl = referenceItem.querySelector('span, p');
  const textEl = document.createElement(refTextEl ? refTextEl.tagName.toLowerCase() : 'span');
  if (refTextEl) {
    textEl.className = refTextEl.className;
  }
  textEl.textContent = message;
  textEl.style.color = 'var(--amplify-colors-font-error, #950404)';
  item.appendChild(textEl);

  return item;
}

// Sincroniza la lista de requisitos personalizados en el contenedor nativo
function syncCustomItems(
  container: Element,
  validations: { message: string; isError: boolean }[],
) {
  const existingCustom = container.querySelectorAll(`[${CUSTOM_MARKER}]`);
  const existingByMsg = new Map<string, HTMLElement>();
  existingCustom.forEach(el => {
    existingByMsg.set(el.getAttribute('data-custom-msg') || '', el as HTMLElement);
  });

  const referenceItem = container.querySelector(`:scope > :not([${CUSTOM_MARKER}])`);
  if (!referenceItem) return;

  const activeMessages = new Set<string>();

  for (const { message, isError } of validations) {
    if (!isError) {
      const existing = existingByMsg.get(message);
      if (existing) existing.remove();
      continue;
    }

    activeMessages.add(message);

    if (!existingByMsg.has(message)) {
      const item = createRequirementItem(message, referenceItem);
      container.appendChild(item);
    }
  }

  existingCustom.forEach(el => {
    const msg = el.getAttribute('data-custom-msg') || '';
    if (!activeMessages.has(msg)) {
      el.remove();
    }
  });
}

export const CustomPasswordRequirements = ({
  password: propPassword,
  username: propUsername,
  email: propEmail,
}: CustomPasswordRequirementsProps) => {
  let formData: any = {};

  try {
    const context = useAuthenticator((c) => [(c as any).formData]) as any;
    formData = context.formData || {};
  } catch (e) {
    // Fuera del contexto del autenticador
  }

  const [localPassword, setLocalPassword] = React.useState('');
  const [formValues, setFormValues] = React.useState({ username: '', email: '' });
  const containerRef = React.useRef<HTMLSpanElement>(null);
  const [hasNative, setHasNative] = React.useState(false);

  // Escuchar cambios en los inputs del formulario activo para actualizar en tiempo real
  React.useEffect(() => {
    if (propPassword !== undefined) return;

    let intervalId: any;
    let passwordInput: HTMLInputElement | null = null;

    const handlePasswordInput = (e: Event) => {
      setLocalPassword((e.target as HTMLInputElement).value);
    };

    const handleOtherInput = (e: Event) => {
      const input = e.target as HTMLInputElement;
      setFormValues(prev => ({
        ...prev,
        [input.name]: input.value
      }));
    };

    const setupListeners = () => {
      if (!containerRef.current) return false;
      const form = containerRef.current.closest('form, .amplify-authenticator, .amplify-tabs__panel');
      if (!form) return false;

      passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;

      if (passwordInput) {
        setLocalPassword(passwordInput.value);
        passwordInput.addEventListener('input', handlePasswordInput);

        const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement;
        const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
        setFormValues({
          username: usernameInput ? usernameInput.value : '',
          email: emailInput ? emailInput.value : ''
        });

        // Escuchar todos los inputs que no sean de password (ej. email, username, nombre, apellido)
        const otherInputs = form.querySelectorAll('input:not([name="password"])');
        otherInputs.forEach(input => {
          input.addEventListener('input', handleOtherInput);
        });
        return true;
      }
      return false;
    };

    if (!setupListeners()) {
      intervalId = setInterval(() => {
        if (setupListeners()) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (passwordInput) {
        passwordInput.removeEventListener('input', handlePasswordInput);
      }
      if (containerRef.current) {
        const form = containerRef.current.closest('form, .amplify-authenticator, .amplify-tabs__panel');
        if (form) {
          const otherInputs = form.querySelectorAll('input:not([name="password"])');
          otherInputs.forEach(input => {
            input.removeEventListener('input', handleOtherInput);
          });
        }
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [propPassword]);

  const password = propPassword !== undefined ? propPassword : localPassword;

  // Busca los valores del nombre de usuario y correo dentro del formulario actual para evitar colisiones
  const getUsername = () => {
    if (propUsername !== undefined) return propUsername;
    if (formValues.username) return formValues.username;
    if (containerRef.current) {
      const form = containerRef.current.closest('form, .amplify-authenticator, .amplify-tabs__panel');
      if (form) {
        const input = form.querySelector('input[name="username"]') as HTMLInputElement;
        if (input) return input.value;
      }
    }
    const input = document.querySelector('input[name="username"]') as HTMLInputElement;
    if (input) return input.value;
    return formData.username || '';
  };

  const getEmail = () => {
    if (propEmail !== undefined) return propEmail;
    if (formValues.email) return formValues.email;
    if (containerRef.current) {
      const form = containerRef.current.closest('form, .amplify-authenticator, .amplify-tabs__panel');
      if (form) {
        const input = form.querySelector('input[name="email"]') as HTMLInputElement;
        if (input) return input.value;
      }
    }
    const input = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (input) return input.value;
    return formData.email || '';
  };

  // Efecto principal para inyeccion de requisitos y limpieza
  React.useEffect(() => {
    if (propPassword !== undefined) return;
    if (!containerRef.current) return;

    const passwordField = containerRef.current.closest('.amplify-passwordfield');
    if (!passwordField) {
      setHasNative(false);
      return;
    }

    if (!password) {
      // Limpiar items personalizados si no hay password
      const nativeContainer = findNativeRequirementsContainer(passwordField);
      if (nativeContainer) {
        nativeContainer.querySelectorAll(`[${CUSTOM_MARKER}]`).forEach(el => el.remove());
      }
      setHasNative(false);
      return;
    }

    const username = getUsername();
    const email = getEmail();
    const { isConsecutiveError, isUserDetailError, isRestrictedError } =
      buildValidationState(password, username, email);

    const validations = [
      { message: MESSAGES.consecutive, isError: isConsecutiveError },
      { message: MESSAGES.userDetail, isError: isUserDetailError },
      { message: MESSAGES.restricted, isError: isRestrictedError },
    ];

    let attempts = 0;
    const maxAttempts = 20;

    const tryInject = () => {
      const nativeContainer = findNativeRequirementsContainer(passwordField);
      if (nativeContainer) {
        const firstChild = nativeContainer.querySelector(`:scope > :not([${CUSTOM_MARKER}])`);
        if (firstChild) {
          syncCustomItems(nativeContainer, validations);
          setHasNative(true);
          return true;
        }
      }
      setHasNative(false);
      return false;
    };

    if (tryInject()) return;

    const retryInterval = setInterval(() => {
      attempts++;
      if (tryInject() || attempts >= maxAttempts) {
        clearInterval(retryInterval);
        if (attempts >= maxAttempts) {
          setHasNative(false);
        }
      }
    }, 50);

    return () => clearInterval(retryInterval);
  }, [password, formValues]);

  const username = getUsername();
  const email = getEmail();
  const { isConsecutiveError, isUserDetailError, isRestrictedError } =
    buildValidationState(password, username, email);

  const errorStyle: React.CSSProperties = {
    color: 'var(--amplify-colors-font-error, #950404)',
    fontSize: 'var(--amplify-font-sizes-xs, 0.85rem)',
    marginTop: '0.25rem',
    display: 'block',
  };

  // Mostrar el fallback en React si es un campo controlado externo o si la lista nativa no existe en el DOM
  const showFallback = propPassword !== undefined || !hasNative;

  return (
    <>
      <span ref={containerRef} style={{ display: 'none' }} />
      {showFallback && password && (
        <div style={{ marginTop: '0.25rem' }}>
          {isConsecutiveError && (
            <span className="amplify-text amplify-text--error" style={errorStyle}>
              {MESSAGES.consecutive}
            </span>
          )}
          {isUserDetailError && (
            <span className="amplify-text amplify-text--error" style={errorStyle}>
              {MESSAGES.userDetail}
            </span>
          )}
          {isRestrictedError && (
            <span className="amplify-text amplify-text--error" style={errorStyle}>
              {MESSAGES.restricted}
            </span>
          )}
        </div>
      )}
    </>
  );
};
