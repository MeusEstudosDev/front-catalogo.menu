// Funções para máscaras
export const formatCpf = (value: string) => {
  const cpf = value.replace(/\D/g, "");
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const formatCep = (value: string) => {
  const cep = value.replace(/\D/g, "");
  return cep.replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatDate = (value: string) => {
  const date = value.replace(/\D/g, "");
  return date
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{4})\d+?$/, "$1");
};

// Função para converter ISO string em formato DD/MM/AAAA
export const formatISODateToDisplay = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

// Função para converter data DD/MM/AAAA em formato DDMMAAAA para processamento
export const convertDisplayDateToNumeric = (displayDate: string) => {
  return displayDate.replace(/\D/g, "");
};

export const removeMask = (value: string) => {
  return value.replace(/\D/g, "");
};

// Função para formatar número de telefone
export const formatPhone = (value: string) => {
  const phone = value.replace(/\D/g, "");
  if (phone.length <= 10) {
    return phone
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    return phone
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};

// Função para validar número de telefone
export const validatePhoneNumber = (
  number: string,
  countryCode?: string
): { isValid: boolean; message?: string } => {
  const cleanNumber = number.replace(/\D/g, "");

  if (!cleanNumber || cleanNumber.length === 0) {
    return { isValid: false, message: "Número de telefone é obrigatório" };
  }

  // Validação específica para Brasil (+55)
  if (countryCode === "+55") {
    // Telefone fixo: 10 dígitos (XX) XXXX-XXXX
    // Celular: 11 dígitos (XX) 9XXXX-XXXX
    if (cleanNumber.length === 10) {
      // Telefone fixo - primeiro dígito após DDD não pode ser 9
      if (cleanNumber.charAt(2) === "9") {
        return {
          isValid: false,
          message:
            "Para telefone fixo, o primeiro dígito após o DDD não pode ser 9",
        };
      }
    } else if (cleanNumber.length === 11) {
      // Celular - primeiro dígito após DDD deve ser 9
      if (cleanNumber.charAt(2) !== "9") {
        return {
          isValid: false,
          message: "Para celular, o primeiro dígito após o DDD deve ser 9",
        };
      }
    } else {
      return {
        isValid: false,
        message:
          "Número brasileiro deve ter 10 dígitos (fixo) ou 11 dígitos (celular)",
      };
    }
  }

  return { isValid: true };
};
