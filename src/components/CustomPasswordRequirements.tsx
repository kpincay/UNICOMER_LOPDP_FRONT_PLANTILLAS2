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
  // 1. Buscar dentro del propio passwordField (ya que Amplify a menudo renderiza los requisitos como hijos del campo)
  const innerReq = passwordFieldEl.querySelector('.amplify-field__requirements, .amplify-passwordfield__requirements, ul');
  if (innerReq) return innerReq;

  // 2. Buscar como hermanos directos
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

function createRequirementItem(
  message: string,
  referenceItem: Element,
): HTMLElement {
  const tagName = referenceItem.tagName.toLowerCase();
  const item = document.createElement(tagName);
  item.setAttribute(CUSTOM_MARKER, 'true');
  item.setAttribute('data-custom-msg', message);
  item.className = referenceItem.className;

  // Copiar todos los atributos de estilo computados relevantes del item de referencia
  const refStyle = window.getComputedStyle(referenceItem);
  item.style.display = refStyle.display;
  item.style.alignItems = refStyle.alignItems;
  item.style.gap = refStyle.gap;
  item.style.flexDirection = refStyle.flexDirection;

  // Clonar el icono SVG si existe
  const svg = referenceItem.querySelector('svg');
  if (svg) {
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    clonedSvg.style.color = 'var(--amplify-colors-font-error, #950404)';
    item.appendChild(clonedSvg);
  }

  // Crear el span/p de texto clonando estilos del elemento de referencia
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
    // Fuera del contexto Authenticator
  }

  const [localPassword, setLocalPassword] = React.useState('');
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (propPassword !== undefined) return;

    let passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    let intervalId: any;

    const handleInput = (e: Event) => {
      setLocalPassword((e.target as HTMLInputElement).value);
    };

    if (passwordInput) {
      setLocalPassword(passwordInput.value);
      passwordInput.addEventListener('input', handleInput);
    } else {
      intervalId = setInterval(() => {
        passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
        if (passwordInput) {
          setLocalPassword(passwordInput.value);
          passwordInput.addEventListener('input', handleInput);
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (passwordInput) {
        passwordInput.removeEventListener('input', handleInput);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [propPassword]);

  const password = propPassword !== undefined ? propPassword : localPassword;

  const getUsername = () => {
    if (propUsername !== undefined) return propUsername;
    const input = document.querySelector('input[name="username"]') as HTMLInputElement;
    if (input) return input.value;
    return formData.username || '';
  };

  const getEmail = () => {
    if (propEmail !== undefined) return propEmail;
    const input = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (input) return input.value;
    return formData.email || '';
  };

  // Efecto principal: busca el contenedor nativo como HERMANO del password field e inyecta
  React.useEffect(() => {
    // Evitar el proceso de inyeccion si es un control controlado externo (como en el cambio de contrasena expirada)
    if (propPassword !== undefined) return;
    if (!containerRef.current) return;

    const passwordField = containerRef.current.closest('.amplify-passwordfield');
    if (!passwordField) return;

    if (!password) {
      // Limpiar items personalizados si no hay password
      const nativeContainer = findNativeRequirementsContainer(passwordField);
      if (nativeContainer) {
        nativeContainer.querySelectorAll(`[${CUSTOM_MARKER}]`).forEach(el => el.remove());
      }
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
          return true;
        }
      }
      return false;
    };

    if (tryInject()) return;

    const retryInterval = setInterval(() => {
      attempts++;
      if (tryInject() || attempts >= maxAttempts) {
        clearInterval(retryInterval);
      }
    }, 50);

    return () => clearInterval(retryInterval);
  }, [password]);

  // Si el componente recibe la contrasena como prop, renderizamos las validaciones directamente en el DOM de React
  if (propPassword !== undefined) {
    if (!password) return null;
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

    return (
      <>
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
      </>
    );
  }

  return <span ref={containerRef} style={{ display: 'none' }} />;
};
