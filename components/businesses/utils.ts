import { BusinessStatus } from "./types";

/**
 * Formata CNPJ com máscara: 00.000.000/0000-00
 */
export function formatCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  
  if (clean.length !== 14) return cnpj;

  return clean.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Traduz o status para português
 */
export function translateStatus(status: BusinessStatus): string {
  const translations: Record<BusinessStatus, string> = {
    [BusinessStatus.ACTIVE]: "Ativo",
    [BusinessStatus.INACTIVE]: "Inativo",
    [BusinessStatus.SUSPENDED]: "Suspenso",
    [BusinessStatus.PENDING]: "Pendente",
    [BusinessStatus.PAYMENT_PENDING]: "Pagamento Pendente",
    [BusinessStatus.TRIAL]: "Trial",
    [BusinessStatus.EXPIRED]: "Expirado",
    [BusinessStatus.ARCHIVED]: "Arquivado",
    [BusinessStatus.BANNED]: "Banido",
    [BusinessStatus.DELETED]: "Deletado",
  };

  return translations[status] || status;
}

/**
 * Retorna a cor do badge baseado no status
 */
export function getStatusColorScheme(status: BusinessStatus): string {
  const colorMap: Record<BusinessStatus, string> = {
    [BusinessStatus.ACTIVE]: "green",
    [BusinessStatus.INACTIVE]: "gray",
    [BusinessStatus.SUSPENDED]: "orange",
    [BusinessStatus.PENDING]: "yellow",
    [BusinessStatus.PAYMENT_PENDING]: "cyan",
    [BusinessStatus.TRIAL]: "blue",
    [BusinessStatus.EXPIRED]: "red",
    [BusinessStatus.ARCHIVED]: "purple",
    [BusinessStatus.BANNED]: "red",
    [BusinessStatus.DELETED]: "red",
  };

  return colorMap[status] || "gray";
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
