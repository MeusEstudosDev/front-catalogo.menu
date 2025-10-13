/**
 * Remove máscara de strings (deixa apenas números)
 */
export function removeMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata telefone com máscara
 */
export function formatPhone(phone: string): string {
  const clean = removeMask(phone);

  if (clean.length === 10) {
    // Fixo: (99) 9999-9999
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  } else if (clean.length === 11) {
    // Celular: (99) 99999-9999
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return phone;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Formata CEP
 */
export function formatCep(cep: string): string {
  const clean = removeMask(cep);
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  }
  return cep;
}
