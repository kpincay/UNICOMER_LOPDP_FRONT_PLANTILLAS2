


export const RESTRICTED_WORDS: string[] = [
    'unicomer',
    'courts',
    'emma',
    'milady',
    'curacao',
    'gollo',
    'artefacta',
    'radioshack',
    'tropigas',
    'servitotal',
    'locoluis',
    'luckydollar',
    'electrofacil',
    'baratodo',
    'corporativo',
    'millennium',
    'elsalvador',
    'guatemala',
    'honduras',
    'costarica',
    'nicaragua',
    'paraguay',
    'ecuador',
    'guyana',
    'estadosunidos',
    'galerias',
    'granada',
    'dominica',
    'antigua',
    'trinidad',
    'tobago',
    'belize',
    'aruba',
    'barbados',
    'jamaica'
];


export function hasConsecutiveNumbers(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
        const char1 = password.charCodeAt(i);
        const char2 = password.charCodeAt(i + 1);
        const char3 = password.charCodeAt(i + 2);

        // Validar si los tres caracteres son números (0 = 48, 9 = 57)
        if (
            char1 >= 48 && char1 <= 57 &&
            char2 >= 48 && char2 <= 57 &&
            char3 >= 48 && char3 <= 57
        ) {
            if (char2 === char1 + 1 && char3 === char2 + 1) {
                return true;
            }
            if (char2 === char1 - 1 && char3 === char2 - 1) {
                return true;
            }
        }
    }
    return false;
}

interface UserInfo {
    username?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
}

export function validatePassword(password: string, user: UserInfo = {}): string | null {
    // 1. Longitud mínima de 12 caracteres
    if (password.length < 12) {
        return 'Password must be at least 12 characters long.';
    }


    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
        return 'Password must include at least: one uppercase letter, one lowercase letter, one number, and one symbol.';
    }

    const lowercasePassword = password.toLowerCase();

    // 3. Restricción de contenido: No debe contener el nombre o apellido del usuario
    const excludedParts: string[] = [];

    if (user.username) {
        excludedParts.push(user.username.toLowerCase());
        // Si el usuario es un correo, extraer la parte del alias
        if (user.username.includes('@')) {
            excludedParts.push(user.username.split('@')[0].toLowerCase());
        }
    }
    if (user.email) {
        excludedParts.push(user.email.toLowerCase());
        excludedParts.push(user.email.split('@')[0].toLowerCase());
    }
    if (user.givenName) {
        excludedParts.push(user.givenName.toLowerCase());
    }
    if (user.familyName) {
        excludedParts.push(user.familyName.toLowerCase());
    }

    const userTerms = excludedParts
        .filter(t => t && t.length >= 3)
        .map(t => t.trim());

    for (const term of userTerms) {
        if (lowercasePassword.includes(term)) {
            return 'Password must not contain the user\'s name, surname, or identifier.';
        }
    }


    for (const word of RESTRICTED_WORDS) {
        if (lowercasePassword.includes(word)) {
            return 'Password contains a restricted term not permitted by corporate policies.';
        }
    }


    if (hasConsecutiveNumbers(password)) {
        return 'Password cannot contain consecutive number sequences (e.g., 123 or 321).';
    }

    return null;
}
