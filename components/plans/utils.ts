/**
 * Retorna o símbolo da moeda
 */
export function getCurrencySymbol(currency: string): string {
  const currencySymbols: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    EUR: "€",
  };

  return currencySymbols[currency] || currency;
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(
  value: string | number,
  currency: string = "BRL"
): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  const symbol = getCurrencySymbol(currency);

  return `${symbol} ${numValue.toFixed(2).replace(".", ",")}`;
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Retorna a cor do badge baseado no status ativo/inativo
 */
export function getStatusColorScheme(isActive: boolean): string {
  return isActive ? "green" : "red";
}

/**
 * Traduz o status ativo/inativo para português
 */
export function translateStatus(isActive: boolean): string {
  return isActive ? "Ativo" : "Inativo";
}

/**
 * Retorna o nome da moeda por extenso
 */
export function getCurrencyName(currency: string): string {
  const currencyNames: Record<string, string> = {
    BRL: "Real Brasileiro",
    USD: "Dólar Americano",
    EUR: "Euro",
  };

  return currencyNames[currency] || currency;
}

/**
 * Formata número ou exibe "Ilimitado" se null/undefined
 */
export function formatLimit(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Ilimitado";
  }
  return String(value);
}
