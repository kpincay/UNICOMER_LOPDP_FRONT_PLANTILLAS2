import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { hasConsecutiveNumbers, RESTRICTED_WORDS } from '../services/passwordValidator';

interface CustomPasswordRequirementsProps {
  password?: string;
  username?: string;
  email?: string;
}

const CUSTOM_MARKER = 'data-custom-requirement';
const CUSTOM_CONTAINER_MARKER = 'data-custom-requirements-container';

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
  // Buscar dentro del propio passwordField, omitiendo nuestro contenedor personalizado
  const selector = `.amplify-field__requirements:not([${CUSTOM_CONTAINER_MARKER}]), .amplify-passwordfield__requirements:not([${CUSTOM_CONTAINER_MARKER}]), ul:not([${CUSTOM_CONTAINER_MARKER}])`;
  const innerReq = passwordFieldEl.querySelector(selector);
  if (innerReq) return innerReq;

  // Buscar en los elementos hermanos siguientes
  let sibling = passwordFieldEl.nextElementSibling;
  while (sibling) {
    if (
      (sibling.tagName === 'UL' || sibling.classList.contains('amplify-field__requirements')) &&
      !sibling.hasAttribute(CUSTOM_CONTAINER_MARKER)
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

// Obtiene el contenedor de requisitos nativo o crea uno personalizado si no existe
function getOrCreateRequirementsContainer(passwordFieldEl: Element): Element | null {
  const nativeContainer = findNativeRequirementsContainer(passwordFieldEl);
  if (nativeContainer) {
    return nativeContainer;
  }

  const customContainer = passwordFieldEl.querySelector(`ul[${CUSTOM_CONTAINER_MARKER}]`);
  if (customContainer) {
    return customContainer;
  }

  // Crear contenedor dinámico con las clases de estilo nativas de Amplify
  const newContainer = document.createElement('ul');
  newContainer.setAttribute(CUSTOM_CONTAINER_MARKER, 'true');
  newContainer.className = 'amplify-field__requirements';
  newContainer.style.marginTop = '0.5rem';
  newContainer.style.paddingLeft = '0';
  newContainer.style.listStyleType = 'none';

  // Insertar justo después del contenedor de entrada de la contraseña
  const inputEl = passwordFieldEl.querySelector('input[name="password"]');
  const inputContainer = inputEl ? (inputEl.closest('.amplify-input') || inputEl.parentElement) : null;
  const targetParent = inputContainer || passwordFieldEl;

  if (targetParent && targetParent.nextSibling) {
    passwordFieldEl.insertBefore(newContainer, targetParent.nextSibling);
  } else {
    passwordFieldEl.appendChild(newContainer);
  }

  return newContainer;
}

// Crea un elemento de requisito con estilos consistentes, clonando el de referencia o usando defaults
function createRequirementItem(
  message: string,
  referenceItem: Element | null,
): HTMLElement {
  const tagName = referenceItem ? referenceItem.tagName.toLowerCase() : 'li';
  const item = document.createElement(tagName);
  item.setAttribute(CUSTOM_MARKER, 'true');
  item.setAttribute('data-custom-msg', message);

  if (referenceItem) {
    item.className = referenceItem.className;

    // Copiar estilos computados para integracion visual limpia
    const refStyle = window.getComputedStyle(referenceItem);
    item.style.display = refStyle.display;
    item.style.alignItems = refStyle.alignItems;
    item.style.gap = refStyle.gap;
    item.style.flexDirection = refStyle.flexDirection;

    // Clonar icono SVG
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
  } else {
    // Estilos por defecto adaptados de los estilos nativos de Amplify para advertencias
    item.className = 'amplify-text amplify-text--error';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '0.5rem';
    item.style.marginTop = '0.25rem';
    item.style.color = 'var(--amplify-colors-font-error, #950404)';
    item.style.fontSize = 'var(--amplify-font-sizes-xs, 0.85rem)';

    // Icono SVG de alerta de error
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'currentColor');
    svg.style.color = 'var(--amplify-colors-font-error, #950404)';
    svg.innerHTML = '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>';
    item.appendChild(svg);

    const textEl = document.createElement('span');
    textEl.textContent = message;
    item.appendChild(textEl);
  }

  return item;
}

// Sincroniza la lista de requisitos personalizados en el contenedor
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
    if (!passwordField) return;

    const username = getUsername();
    const email = getEmail();
    const { isConsecutiveError, isUserDetailError, isRestrictedError } =
      buildValidationState(password, username, email);

    const validations = [
      { message: MESSAGES.consecutive, isError: isConsecutiveError },
      { message: MESSAGES.userDetail, isError: isUserDetailError },
      { message: MESSAGES.restricted, isError: isRestrictedError },
    ];

    const hasActiveErrors = validations.some(v => v.isError);

    if (!password) {
      // Limpiar contenedores y elementos personalizados si no hay texto ingresado
      const customContainer = passwordField.querySelector(`ul[${CUSTOM_CONTAINER_MARKER}]`);
      if (customContainer) {
        customContainer.remove();
      }
      const nativeContainer = findNativeRequirementsContainer(passwordField);
      if (nativeContainer) {
        nativeContainer.querySelectorAll(`[${CUSTOM_MARKER}]`).forEach(el => el.remove());
      }
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const tryInject = () => {
      if (!hasActiveErrors) {
        // Remover el contenedor personalizado y borrar elementos inyectados si ya no hay errores
        const customContainer = passwordField.querySelector(`ul[${CUSTOM_CONTAINER_MARKER}]`);
        if (customContainer) {
          customContainer.remove();
        }
        const nativeContainer = findNativeRequirementsContainer(passwordField);
        if (nativeContainer) {
          nativeContainer.querySelectorAll(`[${CUSTOM_MARKER}]`).forEach(el => el.remove());
        }
        return true;
      }

      const container = getOrCreateRequirementsContainer(passwordField);
      if (container) {
        // Si el contenedor resuelto es el nativo, nos aseguramos de destruir el personalizado previo para evitar duplicados
        if (!container.hasAttribute(CUSTOM_CONTAINER_MARKER)) {
          const customContainer = passwordField.querySelector(`ul[${CUSTOM_CONTAINER_MARKER}]`);
          if (customContainer) {
            customContainer.remove();
          }
        }
        syncCustomItems(container, validations);
        return true;
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
  }, [password, formValues]);

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
