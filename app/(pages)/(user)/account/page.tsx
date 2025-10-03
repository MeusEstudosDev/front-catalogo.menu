"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  Dialog,
  FileUpload,
  Image,
  Input,
  InputGroup,
  PinInput,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaCheckCircle, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa6";
import { GoAlert } from "react-icons/go";
import { HiUpload } from "react-icons/hi";
import {
  MdOutlineLocationOn,
  MdOutlineManageAccounts,
  MdOutlinePassword,
} from "react-icons/md";
import countries from "world-countries";
import z from "zod";

interface IProfile {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  email: string;
  name: string;
  status: string;
  profile_uri: string;
  type: string;
  cpf: string;
  birth_date: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}

interface IUserPhone {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "PERSONAL" | "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  country_code: string;
  number: string;
  primary: boolean;
  verified: Date | null;
  user_id: string;
}

interface IUserAddress {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "HOME" | "WORK" | "BILLING" | "SHIPPING" | "OTHER";
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  primary: boolean;
  user_id: string;
}

const schema = z.object({
  email: z.email("E-mail inválido."),
  name: z.string().min(1, "Nome é obrigatório."),
  cpf: z.string().min(11, "CPF deve ter ao menos 11 caracteres."),
  birth_date: z.string().min(8, "Data de nascimento é obrigatória."),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Gênero é obrigatório.",
  }),
});

type FormData = z.infer<typeof schema>;

export default function Page() {
  const router = useRouter();

  const [profile, setProfile] = useState<IProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [imageBust, setImageBust] = useState<number>(Date.now());
  const [stepChangePwd, setStepChangePwd] = useState<"form" | "code">("form");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isRequestingPwd, setIsRequestingPwd] = useState(false);
  const [isConfirmingPwd, setIsConfirmingPwd] = useState(false);
  const [userTokenId, setUserTokenId] = useState<string>("");
  const [maskedCpf, setMaskedCpf] = useState<string>("");
  const [maskedBirthdate, setMaskedBirthdate] = useState<string>("");

  // Estados para telefones
  const [phones, setPhones] = useState<IUserPhone[]>([]);
  const [isLoadingPhones, setIsLoadingPhones] = useState(false);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [editingPhone, setEditingPhone] = useState<IUserPhone | null>(null);
  const [newPhone, setNewPhone] = useState({
    type: "PERSONAL",
    country_code: "+55",
    number: "",
  });
  const [verificationPhoneCode, setVerificationPhoneCode] =
    useState<string>("");

  // Estados para endereços
  const [addresses, setAddresses] = useState<IUserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IUserAddress | null>(
    null
  );
  const [newAddress, setNewAddress] = useState({
    type: "HOME",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    country: "Brasil",
  });

  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState<IUserPhone | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifyConfirmModalOpen, setIsVerifyConfirmModalOpen] =
    useState(false);
  const [phoneToVerify, setPhoneToVerify] = useState<IUserPhone | null>(null);
  const [isConfirmingVerification, setIsConfirmingVerification] =
    useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Estados para modais de endereços
  const [isCreateAddressModalOpen, setIsCreateAddressModalOpen] =
    useState(false);
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [isDeleteAddressModalOpen, setIsDeleteAddressModalOpen] =
    useState(false);
  const [addressToDelete, setAddressToDelete] = useState<IUserAddress | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      email: profile?.email || "",
      name: profile?.name || "",
      cpf: profile?.cpf || "",
      birth_date: profile?.birth_date || "",
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/get-cookies?key=profile");
        const data = await res.json();
        if (data) {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            setProfile(parsed);
            setValue("email", parsed.email);
            setValue("name", parsed.name);
            setValue("cpf", parsed.cpf);
            setValue("birth_date", parsed.birth_date);
            setValue("gender", parsed.gender);
            setMaskedCpf(parsed.cpf ? formatCpf(parsed.cpf) : "");
            setMaskedBirthdate(
              parsed.birth_date ? formatISODateToDisplay(parsed.birth_date) : ""
            );
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    }
    fetchProfile();
  }, []);

  // Carregar telefones na inicialização
  useEffect(() => {
    fetchPhones();
  }, []);

  // Carregar endereços na inicialização
  useEffect(() => {
    fetchAddresses();
  }, []);

  const onSubmit = async (data: FormData) => {
    const token = await fetch("/api/get-cookies?key=access_token").then((res) =>
      res.json()
    );

    // Remove máscaras e transforma a data
    const cleanCpf = removeMask(data.cpf);
    const cleanBirthDate = convertDisplayDateToNumeric(maskedBirthdate);

    // Transforma a data em formato Date com horário 12:00:00
    let formattedBirthDate: string;
    if (cleanBirthDate && cleanBirthDate.length === 8) {
      // Formato esperado: DDMMAAAA
      const day = cleanBirthDate.substring(0, 2);
      const month = cleanBirthDate.substring(2, 4);
      const year = cleanBirthDate.substring(4, 8);

      // Cria objeto Date com horário 12:00:00
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        12,
        0,
        0,
        0
      );
      formattedBirthDate = dateObj.toISOString();
    } else {
      formattedBirthDate = cleanBirthDate;
    }

    const cleanData = {
      ...data,
      cpf: cleanCpf,
      birth_date: formattedBirthDate,
    };

    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}users/update/self`, {
        method: "PATCH",
        body: JSON.stringify(cleanData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              reject(err.message[0] || "Erro desconhecido");
            });
          }
          resolve(res.json());
        })
        .catch((err) => {
          reject(err.message || "Erro desconhecido");
        });
    });

    toaster.promise(promise, {
      loading: {
        title: "Atualizando...",
        description: "Por favor aguarde",
      },
      success: {
        title: "Atualização efetuada!",
        description: "Dados atualizados com sucesso.",
      },
      error: (err) => ({
        title: "Erro ao atualizar",
        description: err || "Erro desconhecido.",
      }),
    });

    await fetch("/api/delete-cookies?key=profile", {
      method: "DELETE",
    });
  };

  const withCacheBust = (url: string, bust: number) =>
    `${url}${url.includes("?") ? "&" : "?"}cb=${bust}`;

  // Funções para máscaras
  const formatCpf = (value: string) => {
    const cpf = value.replace(/\D/g, "");
    return cpf
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatDate = (value: string) => {
    const date = value.replace(/\D/g, "");
    return date
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+?$/, "$1");
  };

  // Função para converter ISO string em formato DD/MM/AAAA
  const formatISODateToDisplay = (isoString: string) => {
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
  const convertDisplayDateToNumeric = (displayDate: string) => {
    return displayDate.replace(/\D/g, "");
  };

  const removeMask = (value: string) => {
    return value.replace(/\D/g, "");
  };

  // Lista de países com códigos DDI
  const countryOptions = countries
    .filter((country) => country.idd && country.idd.root)
    .map((country) => ({
      code: country.cca2,
      name: country.name.common,
      dialCode: country.idd.root + (country.idd.suffixes?.[0] || ""),
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Adicionar Brasil no topo se não estiver lá
  const brazilIndex = countryOptions.findIndex((c) => c.code === "BR");
  if (brazilIndex > 0) {
    const brazil = countryOptions.splice(brazilIndex, 1)[0];
    countryOptions.unshift(brazil);
  }

  // Função para formatar número de telefone
  const formatPhone = (value: string) => {
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
  const validatePhoneNumber = (
    number: string
  ): { isValid: boolean; message?: string } => {
    const cleanNumber = removeMask(number);

    // Verifica se contém apenas números
    if (!/^\d+$/.test(cleanNumber)) {
      return { isValid: false, message: "O número deve conter apenas dígitos" };
    }

    // Verifica se tem pelo menos 8 dígitos (número mínimo válido)
    if (cleanNumber.length < 8) {
      return {
        isValid: false,
        message: "O número deve ter pelo menos 8 dígitos",
      };
    }

    // Verifica se não excede 15 dígitos (padrão internacional)
    if (cleanNumber.length > 15) {
      return {
        isValid: false,
        message: "O número não pode ter mais de 15 dígitos",
      };
    }

    // Para números brasileiros (quando DDI for +55), aplica validações específicas
    if (
      newPhone.country_code === "+55" ||
      (editingPhone && editingPhone.country_code === "+55")
    ) {
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

  // Funções para gerenciar telefones
  const fetchPhones = async () => {
    setIsLoadingPhones(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhones(data);
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao carregar telefones",
        description: "Não foi possível carregar a lista de telefones.",
      });
    } finally {
      setIsLoadingPhones(false);
    }
  };

  const addPhone = async () => {
    if (!newPhone.number.trim()) {
      toaster.error({
        title: "Número obrigatório",
        description: "Digite um número de telefone.",
      });
      return;
    }

    // Validar número de telefone
    const validation = validatePhoneNumber(newPhone.number);
    if (!validation.isValid) {
      toaster.error({
        title: "Número inválido",
        description: validation.message,
      });
      return;
    }

    setIsAddingPhone(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const cleanNumber = removeMask(newPhone.number);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: newPhone.type,
            country_code: newPhone.country_code,
            number: cleanNumber,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone adicionado!",
          description: "Telefone foi adicionado com sucesso.",
        });
        setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
        setIsCreateModalOpen(false);
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao adicionar telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao adicionar telefone",
        description: error.message || "Não foi possível adicionar o telefone.",
      });
    } finally {
      setIsAddingPhone(false);
    }
  };

  const updatePhone = async (phone: IUserPhone) => {
    // Validar número de telefone
    const validation = validatePhoneNumber(phone.number);
    if (!validation.isValid) {
      toaster.error({
        title: "Número inválido",
        description: validation.message,
      });
      return;
    }

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: phone.id,
            type: phone.type,
            country_code: phone.country_code,
            number: removeMask(phone.number),
            primary: phone.primary,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone atualizado!",
          description: "Telefone foi atualizado com sucesso.",
        });
        setEditingPhone(null);
        setIsEditModalOpen(false);
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao atualizar telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao atualizar telefone",
        description: error.message || "Não foi possível atualizar o telefone.",
      });
    }
  };

  const sendVerificationCode = (phone: IUserPhone) => {
    setPhoneToVerify(phone);
    setIsVerifyConfirmModalOpen(true);
  };

  const confirmSendVerificationCode = async () => {
    if (!phoneToVerify) return;

    setIsSendingCode(true);

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone_id: phoneToVerify.id }),
        }
      );

      if (response.ok) {
        setIsVerifyConfirmModalOpen(false);
        toaster.success({
          title: "Código enviado!",
          description: "Código de verificação foi enviado por SMS.",
        });
        setIsVerifyModalOpen(true);
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao enviar código");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao enviar código",
        description:
          error.message || "Não foi possível enviar o código de verificação.",
      });
      setPhoneToVerify(null);
      setIsVerifyConfirmModalOpen(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Funções para controlar modais
  const openCreateModal = () => {
    setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
  };

  const openEditModal = (phone: IUserPhone) => {
    setEditingPhone(phone);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPhone(null);
  };

  const openDeleteModal = (phone: IUserPhone) => {
    setPhoneToDelete(phone);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPhoneToDelete(null);
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setPhoneToVerify(null);
    setVerificationPhoneCode("");
  };

  const confirmPhoneVerification = async () => {
    if (
      !phoneToVerify ||
      !verificationPhoneCode ||
      verificationPhoneCode.length !== 6
    ) {
      toaster.error({
        title: "Código inválido",
        description: "Digite os 6 dígitos enviados por SMS.",
      });
      return;
    }

    setIsConfirmingVerification(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/confirm-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone_id: phoneToVerify.id,
            code: verificationPhoneCode,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone verificado!",
          description: "Seu telefone foi verificado com sucesso.",
        });
        closeVerifyModal();
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Código inválido");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro na verificação",
        description: error.message || "Não foi possível verificar o telefone.",
      });
    } finally {
      setIsConfirmingVerification(false);
    }
  };

  const confirmDeletePhone = async () => {
    if (!phoneToDelete) return;

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/${phoneToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone removido!",
          description: "Telefone foi removido com sucesso.",
        });
        closeDeleteModal();
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao remover telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao remover telefone",
        description: error.message || "Não foi possível remover o telefone.",
      });
    }
  };

  // Funções para gerenciar endereços
  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao carregar endereços",
        description: "Não foi possível carregar a lista de endereços.",
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const addAddress = async () => {
    if (
      !newAddress.street.trim() ||
      !newAddress.number.trim() ||
      !newAddress.neighborhood.trim() ||
      !newAddress.city.trim() ||
      !newAddress.state.trim() ||
      !newAddress.zip_code.trim()
    ) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsAddingAddress(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddress),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Endereço adicionado!",
          description: "Endereço foi adicionado com sucesso.",
        });
        closeCreateAddressModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao adicionar endereço");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao adicionar endereço",
        description: error.message || "Não foi possível adicionar o endereço.",
      });
    } finally {
      setIsAddingAddress(false);
    }
  };

  const updateAddress = async () => {
    if (!editingAddress) return;

    if (
      !editingAddress.street.trim() ||
      !editingAddress.number.trim() ||
      !editingAddress.neighborhood.trim() ||
      !editingAddress.city.trim() ||
      !editingAddress.state.trim() ||
      !editingAddress.zip_code.trim()
    ) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/addresses`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingAddress.id,
            type: editingAddress.type,
            street: editingAddress.street,
            number: editingAddress.number,
            complement: editingAddress.complement,
            neighborhood: editingAddress.neighborhood,
            city: editingAddress.city,
            state: editingAddress.state,
            zip_code: editingAddress.zip_code,
            country: editingAddress.country,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Endereço atualizado!",
          description: "Endereço foi atualizado com sucesso.",
        });
        closeEditAddressModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao atualizar endereço");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao atualizar endereço",
        description: error.message || "Não foi possível atualizar o endereço.",
      });
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/addresses/${addressToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Endereço removido!",
          description: "Endereço foi removido com sucesso.",
        });
        closeDeleteAddressModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao remover endereço");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao remover endereço",
        description: error.message || "Não foi possível remover o endereço.",
      });
    }
  };

  // Funções para controlar modais de endereços
  const openCreateAddressModal = () => {
    setNewAddress({
      type: "HOME",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Brasil",
    });
    setIsCreateAddressModalOpen(true);
  };

  const closeCreateAddressModal = () => {
    setIsCreateAddressModalOpen(false);
    setNewAddress({
      type: "HOME",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Brasil",
    });
  };

  const openEditAddressModal = (address: IUserAddress) => {
    setEditingAddress(address);
    setIsEditAddressModalOpen(true);
  };

  const closeEditAddressModal = () => {
    setIsEditAddressModalOpen(false);
    setEditingAddress(null);
  };

  const openDeleteAddressModal = (address: IUserAddress) => {
    setAddressToDelete(address);
    setIsDeleteAddressModalOpen(true);
  };

  const closeDeleteAddressModal = () => {
    setIsDeleteAddressModalOpen(false);
    setAddressToDelete(null);
  };

  // schema e form de alteração de senha
  const changePwdSchema = z
    .object({
      current_password: z.string().min(1, "Senha atual é obrigatória."),
      new_password: z
        .string()
        .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
      confirm_new_password: z.string().min(1, "Confirme a nova senha."),
    })
    .refine((data) => data.new_password === data.confirm_new_password, {
      message: "As senhas não coincidem.",
      path: ["confirm_new_password"],
    });

  type ChangePasswordFormData = z.infer<typeof changePwdSchema>;

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    formState: { errors: errorsPwd, isSubmitting: isSubmittingPwd },
    reset: resetPwd,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePwdSchema),
  });

  const onRequestChangePassword = async (data: ChangePasswordFormData) => {
    const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
      r.json()
    );

    setIsRequestingPwd(true);
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}users/change-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message?.[0] || err?.message || "Falha ao solicitar alteração"
        );
      }
      return res.json().catch(() => ({}));
    });

    toaster.promise(promise, {
      loading: {
        title: "Solicitando...",
        description: "Enviando código de verificação para seu e-mail.",
      },
      success: {
        title: "Código enviado",
        description:
          "Enviamos um código de 6 dígitos para seu e-mail. Digite abaixo para confirmar.",
      },
      error: (err: any) => ({
        title: "Erro",
        description:
          (typeof err === "string" ? err : err?.message) ||
          "Não foi possível iniciar a alteração de senha.",
      }),
    });

    try {
      const data = await promise;
      setUserTokenId(data.user_token_id);
      setStepChangePwd("code");
    } finally {
      setIsRequestingPwd(false);
    }
  };

  const onConfirmChangePassword = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toaster.error({
        title: "Código inválido",
        description: "Digite os 6 dígitos enviados para o seu e-mail.",
      });
      return;
    }
    const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
      r.json()
    );
    setIsConfirmingPwd(true);
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}users/confirm-change-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: verificationCode,
          user_token_id: userTokenId,
        }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message?.[0] || err?.message || "Falha ao confirmar alteração"
        );
      }
      return res.json().catch(() => ({}));
    });

    toaster.promise(promise, {
      loading: {
        title: "Confirmando...",
        description: "Validando o código informado.",
      },
      success: {
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      },
      error: (err: any) => ({
        title: "Erro na confirmação",
        description:
          (typeof err === "string" ? err : err?.message) ||
          "Não foi possível confirmar a alteração.",
      }),
    });

    try {
      await promise; // sucesso
      // Remove cookies apenas após confirmação bem-sucedida
      try {
        await Promise.all([
          fetch("/api/delete-cookies?key=profile", { method: "DELETE" }),
          fetch("/api/delete-cookies?key=access_token", { method: "DELETE" }),
          fetch("/api/delete-cookies?key=refresh_token", { method: "DELETE" }),
        ]);
      } catch {
        // silenciosamente ignora erros ao apagar cookies
      }

      setVerificationCode("");
      setStepChangePwd("form");
      resetPwd();
      router.push("/");
    } catch (e) {
    } finally {
      setIsConfirmingPwd(false);
    }
  };

  return (
    <Box px={8}>
      <Tabs.Root defaultValue="account" mt={8}>
        <Tabs.List>
          <Tabs.Trigger value="account">
            <MdOutlineManageAccounts />
            Meus dados
          </Tabs.Trigger>

          <Tabs.Trigger value="phones">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            Telefones
          </Tabs.Trigger>

          <Tabs.Trigger value="addresses">
            <MdOutlineLocationOn />
            Endereços
          </Tabs.Trigger>

          <Tabs.Trigger value="change-password">
            <MdOutlinePassword />
            Alterar senha
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          {profile && (
            <Box
              display={"flex"}
              flexDir={{ base: "column", lg: "row" }}
              gap={6}
              alignItems={{ base: "center", lg: "flex-start" }}
            >
              <Box
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                w={{ base: "200px", lg: "150px" }}
                minW={{ base: "200px", lg: "150px" }}
                h={{ base: "280px", lg: "260px" }}
                p={2}
                gap={2}
                flexShrink={0}
              >
                <Image
                  src={
                    previewUrl ||
                    withCacheBust(profile?.profile_uri || "", imageBust)
                  }
                  boxSize={{ base: "200px", lg: "150px" }}
                  borderRadius="full"
                  fit="cover"
                  alt={profile?.name || "Usuário"}
                />

                <FileUpload.Root
                  accept={["image/png", "image/jpg", "image/jpeg"]}
                >
                  <FileUpload.HiddenInput
                    onChange={(e) => {
                      const file =
                        (e.target as HTMLInputElement).files?.[0] || null;
                      if (!file) {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        return;
                      }
                      const validTypes = [
                        "image/png",
                        "image/jpg",
                        "image/jpeg",
                      ];
                      if (!validTypes.includes(file.type)) {
                        toaster.error({
                          title: "Tipo de arquivo inválido",
                          description: "Selecione uma imagem PNG ou JPG.",
                        });
                        (e.target as HTMLInputElement).value = "";
                        return;
                      }
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        toaster.error({
                          title: "Arquivo muito grande",
                          description: "O tamanho máximo é de 5MB.",
                        });
                        (e.target as HTMLInputElement).value = "";
                        return;
                      }

                      setSelectedFile(file);
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }}
                  />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm" w="100%">
                      <HiUpload /> Alterar foto
                    </Button>
                  </FileUpload.Trigger>
                </FileUpload.Root>

                {selectedFile && (
                  <Box display="flex" gap={2} mt={2}>
                    <Button
                      size="sm"
                      colorPalette="green"
                      loading={isUploadingPicture}
                      onClick={async () => {
                        if (!selectedFile) return;
                        setIsUploadingPicture(true);

                        const token = await fetch(
                          "/api/get-cookies?key=access_token"
                        ).then((res) => res.json());

                        const formData = new FormData();
                        formData.append("picture", selectedFile);

                        const promise: Promise<{ profile_uri?: string }> =
                          fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}users/update/picture`,
                            {
                              method: "PATCH",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body: formData,
                            }
                          ).then(async (res) => {
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(
                                err?.message?.[0] ||
                                  err?.message ||
                                  "Erro ao enviar imagem"
                              );
                            }
                            return res.json().catch(() => ({}));
                          });

                        toaster.promise(promise, {
                          loading: {
                            title: "Enviando imagem...",
                            description:
                              "Aguarde enquanto atualizamos sua foto de perfil.",
                          },
                          success: {
                            title: "Imagem atualizada!",
                            description:
                              "Sua foto de perfil foi alterada com sucesso.",
                          },
                          error: (err: any) => ({
                            title: "Falha no upload",
                            description:
                              (typeof err === "string" ? err : err?.message) ||
                              "Não foi possível enviar a imagem.",
                          }),
                        });

                        try {
                          const data = await promise;
                          if (data && typeof data.profile_uri === "string") {
                            const newUri: string = data.profile_uri;
                            setProfile((prev) =>
                              prev ? { ...prev, profile_uri: newUri } : prev
                            );
                            setImageBust(Date.now());
                            window.dispatchEvent(
                              new CustomEvent("profile-picture-updated", {
                                detail: newUri,
                              })
                            );
                          }
                          setSelectedFile(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          await fetch("/api/delete-cookies?key=profile", {
                            method: "DELETE",
                          });
                        } finally {
                          setIsUploadingPicture(false);
                        }
                      }}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                )}
              </Box>

              <Box display={"flex"} flexDir={"column"} gap={4} w={"100%"}>
                <Box display={"flex"} flexDir={"row"} gap={4}>
                  <InputGroup
                    startAddon="Código"
                    endElement={
                      <Box
                        as="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (profile?.code == null) return;
                          try {
                            await navigator.clipboard.writeText(
                              String(profile.code)
                            );
                            toaster.success({
                              title: "Copiado!",
                              description:
                                "Código copiado para a área de transferência.",
                            });
                          } catch {
                            toaster.error({
                              title: "Falha ao copiar",
                              description: "Não foi possível copiar o código.",
                            });
                          }
                        }}
                        aria-label="Copiar código"
                        cursor="pointer"
                        bg="transparent"
                        border="none"
                        _hover={{ color: "accent.solid" }}
                      >
                        <FaRegCopy />
                      </Box>
                    }
                  >
                    <Input value={profile?.code} disabled readOnly />
                  </InputGroup>

                  <InputGroup startAddon="Cadastrado">
                    <Input
                      value={formatDate(profile?.created_at.toString())}
                      disabled
                      readOnly
                    />
                  </InputGroup>

                  <InputGroup startAddon="Status">
                    <Input value={profile?.status} disabled readOnly />
                  </InputGroup>
                </Box>

                <Box
                  display={"flex"}
                  flexDir={{ base: "column", md: "row" }}
                  gap={4}
                >
                  <InputGroup startAddon="Nome">
                    <Input {...register("name")} />
                  </InputGroup>

                  <InputGroup
                    startAddon="E-mail"
                    endElement={
                      <Box
                        as="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (profile?.email == null) return;
                          try {
                            await navigator.clipboard.writeText(
                              String(profile.email)
                            );
                            toaster.success({
                              title: "Copiado!",
                              description:
                                "E-mail copiado para a área de transferência.",
                            });
                          } catch {
                            toaster.error({
                              title: "Falha ao copiar",
                              description: "Não foi possível copiar o e-mail.",
                            });
                          }
                        }}
                        aria-label="Copiar e-mail"
                        cursor="pointer"
                        bg="transparent"
                        border="none"
                        _hover={{ color: "accent.solid" }}
                      >
                        <FaRegCopy />
                      </Box>
                    }
                  >
                    <Input value={profile?.email} disabled readOnly />
                  </InputGroup>
                </Box>

                <Box
                  display={"flex"}
                  flexDir={{ base: "column", md: "row" }}
                  gap={4}
                  alignItems={"stretch"}
                >
                  <InputGroup startAddon="CPF" flex="1" minW="0">
                    <Input
                      value={maskedCpf}
                      onChange={(e) => {
                        const masked = formatCpf(e.target.value);
                        const clean = removeMask(e.target.value);
                        setMaskedCpf(masked);
                        setValue("cpf", clean);
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </InputGroup>

                  <InputGroup startAddon="Data de nascimento" flex="1" minW="0">
                    <Input
                      value={maskedBirthdate}
                      onChange={(e) => {
                        const masked = formatDate(e.target.value);
                        const clean = removeMask(e.target.value);
                        setMaskedBirthdate(masked);
                        setValue("birth_date", clean);
                      }}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </InputGroup>

                  <InputGroup startAddon="Gênero" flex="1" minW="0">
                    <Box position="relative" w="100%">
                      <select
                        {...register("gender")}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 32px 0 12px",
                          border: "1px solid var(--chakra-colors-border)",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "inherit",
                          fontSize: "14px",
                          outline: "none",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: "right 8px center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "16px",
                        }}
                        defaultValue={profile?.gender || ""}
                      >
                        <option value="">Selecione</option>
                        <option value="MALE">Homem</option>
                        <option value="FEMALE">Mulher</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </Box>
                  </InputGroup>
                </Box>

                <Button
                  onClick={handleSubmit(onSubmit)}
                  alignSelf={{ base: "stretch", md: "end" }}
                  w={{ base: "100%", md: "160px" }}
                  display={"flex"}
                  gap={2}
                >
                  <FaEdit />
                  <Text w="100%">Salvar alterações</Text>
                </Button>
              </Box>
            </Box>
          )}
        </Tabs.Content>

        <Tabs.Content value="phones">
          <Box display={"flex"} flexDir={"row"} gap={4}>
            <Box display={"flex"} flexDir={"column"} gap={4} w={"100%"}>
              <Box
                display={"flex"}
                flexDir={"row"}
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize="xl" fontWeight="bold">
                  Meus Telefones
                </Text>
                <Box display="flex" gap={2}>
                  <Button
                    onClick={openCreateModal}
                    colorPalette="black"
                    size="sm"
                    alignSelf={{ base: "stretch", md: "end" }}
                    w={{ base: "100%", md: "160px" }}
                    display={"flex"}
                    gap={2}
                  >
                    <FaPlus />
                    Adicionar Telefone
                  </Button>
                </Box>
              </Box>

              {isLoadingPhones ? (
                <Box textAlign="center" py={8}>
                  <Text>Carregando telefones...</Text>
                </Box>
              ) : phones.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">Nenhum telefone cadastrado.</Text>
                  <Button
                    onClick={openCreateModal}
                    colorPalette="blue"
                    size="sm"
                    mt={4}
                  >
                    Adicionar Primeiro Telefone
                  </Button>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    base: "1fr",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(5, 1fr)",
                  }}
                  gap={4}
                >
                  {phones
                    .sort((a, b) => {
                      // Telefone principal sempre primeiro
                      if (a.primary && !b.primary) return -1;
                      if (!a.primary && b.primary) return 1;
                      // Se ambos são principais ou nenhum é principal, manter ordem original
                      return 0;
                    })
                    .map((phone) => (
                      <Box
                        key={phone.id}
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        bg="white"
                        boxShadow="sm"
                        _hover={{ boxShadow: "md" }}
                        transition="box-shadow 0.2s"
                        position="relative"
                        minW="358px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                        cursor="default"
                      >
                        {/* Header do Card */}
                        <Box
                          h="100%"
                          display="flex"
                          flexDirection="column"
                          justifyContent="space-between"
                        >
                          {phone.primary && (
                            <Box
                              bg="green.600"
                              color="white"
                              px={2}
                              py={1}
                              borderRadius="md"
                              fontSize="xs"
                              fontWeight="bold"
                              textAlign="center"
                              mb={3}
                              w="fit-content"
                              position="absolute"
                              top={4}
                              right={4}
                            >
                              PRINCIPAL
                            </Box>
                          )}

                          <Text fontWeight="semibold" fontSize="lg" mb={2}>
                            {phone.country_code} {formatPhone(phone.number)}
                          </Text>

                          <Text color="gray.600" fontSize="sm" mb={3}>
                            {phone.type === "PERSONAL"
                              ? "Pessoal"
                              : phone.type === "RESIDENTIAL"
                              ? "Residencial"
                              : phone.type === "COMMERCIAL"
                              ? "Comercial"
                              : "Outro"}
                          </Text>
                        </Box>

                        {/* Footer do Card com Botões */}
                        <Box display="flex" gap={2} mt="auto">
                          {phone.verified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              flex="1"
                              color="green.600"
                              disabled
                            >
                              <FaCheckCircle />
                              <Text fontSize="sm">Verificado</Text>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendVerificationCode(phone)}
                              flex="1"
                              color="orange.600"
                            >
                              <GoAlert />
                              <Text fontSize="sm">Verificar</Text>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(phone)}
                            flex="1"
                          >
                            <FaEdit />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            colorPalette="red"
                            variant="outline"
                            onClick={() => openDeleteModal(phone)}
                          >
                            <FaTrash />
                          </Button>
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Modal de Criar Telefone */}
          <Dialog.Root
            open={isCreateModalOpen}
            onOpenChange={(details) => setIsCreateModalOpen(details.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Adicionar Novo Telefone</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Box display="flex" flexDir="column" gap={4}>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Tipo
                      </Text>
                      <select
                        value={newPhone.type}
                        onChange={(e) =>
                          setNewPhone((prev) => ({
                            ...prev,
                            type: e.target.value as any,
                          }))
                        }
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          border: "1px solid var(--chakra-colors-border)",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "inherit",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      >
                        <option value="PERSONAL">Pessoal</option>
                        <option value="RESIDENTIAL">Residencial</option>
                        <option value="COMMERCIAL">Comercial</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        País
                      </Text>
                      <select
                        value={newPhone.country_code}
                        onChange={(e) =>
                          setNewPhone((prev) => ({
                            ...prev,
                            country_code: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          border: "1px solid var(--chakra-colors-border)",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          color: "inherit",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      >
                        {countryOptions.map((country) => (
                          <option key={country.code} value={country.dialCode}>
                            {country.flag} {country.dialCode} {country.name}
                          </option>
                        ))}
                      </select>
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Número
                      </Text>
                      <Input
                        value={newPhone.number}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(
                            /[^\d\s()-]/g,
                            ""
                          );
                          const formatted = formatPhone(sanitized);
                          setNewPhone((prev) => ({
                            ...prev,
                            number: formatted,
                          }));
                        }}
                        placeholder="99999-9999"
                        maxLength={15}
                      />
                    </Box>
                  </Box>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeCreateModal}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={addPhone}
                    loading={isAddingPhone}
                  >
                    Adicionar
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Editar Telefone */}
          <Dialog.Root
            open={isEditModalOpen}
            onOpenChange={(details) => setIsEditModalOpen(details.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Editar Telefone</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  {editingPhone && (
                    <Box display="flex" flexDir="column" gap={4}>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Tipo
                        </Text>
                        <select
                          value={editingPhone.type}
                          onChange={(e) =>
                            setEditingPhone((prev) =>
                              prev
                                ? { ...prev, type: e.target.value as any }
                                : null
                            )
                          }
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            border: "1px solid var(--chakra-colors-border)",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            color: "inherit",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        >
                          <option value="PERSONAL">Pessoal</option>
                          <option value="RESIDENTIAL">Residencial</option>
                          <option value="COMMERCIAL">Comercial</option>
                          <option value="OTHER">Outro</option>
                        </select>
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          País
                        </Text>
                        <select
                          value={editingPhone.country_code}
                          onChange={(e) =>
                            setEditingPhone((prev) =>
                              prev
                                ? { ...prev, country_code: e.target.value }
                                : null
                            )
                          }
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            border: "1px solid var(--chakra-colors-border)",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            color: "inherit",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        >
                          {countryOptions.map((country) => (
                            <option key={country.code} value={country.dialCode}>
                              {country.flag} {country.dialCode} {country.name}
                            </option>
                          ))}
                        </select>
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Número
                        </Text>
                        <Input
                          value={formatPhone(editingPhone.number)}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(
                              /[^\d\s()-]/g,
                              ""
                            );
                            const formatted = formatPhone(sanitized);
                            setEditingPhone((prev) =>
                              prev
                                ? { ...prev, number: removeMask(formatted) }
                                : null
                            );
                          }}
                          maxLength={15}
                        />
                      </Box>
                      <Box>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editingPhone.primary}
                            onChange={(e) =>
                              setEditingPhone((prev) =>
                                prev
                                  ? { ...prev, primary: e.target.checked }
                                  : null
                              )
                            }
                          />
                          Telefone Principal
                        </label>
                      </Box>
                    </Box>
                  )}
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeEditModal}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="green"
                    onClick={() => editingPhone && updatePhone(editingPhone)}
                  >
                    Salvar
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Confirmação de Exclusão */}
          <Dialog.Root
            open={isDeleteModalOpen}
            onOpenChange={(details) => setIsDeleteModalOpen(details.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Confirmar Exclusão</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text>
                    Tem certeza que deseja remover o telefone{" "}
                    <Text as="span" fontWeight="bold">
                      {phoneToDelete &&
                        `${phoneToDelete.country_code} ${formatPhone(
                          phoneToDelete.number
                        )}`}
                    </Text>
                    ? Esta ação não pode ser desfeita.
                  </Text>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeDeleteModal}>
                    Cancelar
                  </Button>
                  <Button colorPalette="red" onClick={confirmDeletePhone}>
                    Remover
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Verificação de Telefone */}
          <Dialog.Root
            open={isVerifyModalOpen}
            onOpenChange={(details) => setIsVerifyModalOpen(details.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Verificar Telefone</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text mb={4}>
                    Enviamos um código de 6 dígitos para o número{" "}
                    <Text as="span" fontWeight="bold">
                      {phoneToVerify &&
                        `${phoneToVerify.country_code} ${formatPhone(
                          phoneToVerify.number
                        )}`}
                    </Text>
                    . Digite o código abaixo para confirmar:
                  </Text>
                  <Box>
                    <Text mb={2}>Código de verificação</Text>
                    <PinInput.Root
                      value={verificationPhoneCode.split("")}
                      onValueChange={(details) =>
                        setVerificationPhoneCode(
                          Array.isArray(details.value)
                            ? details.value.join("")
                            : details.value
                        )
                      }
                      otp
                      type="alphanumeric"
                    >
                      <PinInput.HiddenInput />
                      <PinInput.Control>
                        <PinInput.Input index={0} />
                        <PinInput.Input index={1} />
                        <PinInput.Input index={2} />
                        <PinInput.Input index={3} />
                        <PinInput.Input index={4} />
                        <PinInput.Input index={5} />
                      </PinInput.Control>
                    </PinInput.Root>
                  </Box>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeVerifyModal}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="green"
                    onClick={confirmPhoneVerification}
                    loading={isConfirmingVerification}
                  >
                    Confirmar Verificação
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Confirmação de Verificação */}
          <Dialog.Root
            open={isVerifyConfirmModalOpen}
            onOpenChange={(details) =>
              setIsVerifyConfirmModalOpen(details.open)
            }
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Confirmar Verificação</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Box display="flex" flexDir="column" gap={4}>
                    <Text>
                      Será enviado um código de verificação via SMS para o
                      número:
                    </Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontWeight="bold" fontSize="lg" textAlign="center">
                        {phoneToVerify?.country_code} {phoneToVerify?.number}
                      </Text>
                    </Box>
                    <Text fontSize="sm" color="gray.600">
                      Após receber o código, você poderá inserí-lo na próxima
                      tela para confirmar a verificação do telefone.
                    </Text>
                  </Box>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsVerifyConfirmModalOpen(false);
                      setPhoneToVerify(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={confirmSendVerificationCode}
                    loading={isSendingCode}
                  >
                    Enviar Código
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        </Tabs.Content>

        <Tabs.Content value="addresses">
          <Box
            display="flex"
            flexDir="column"
            gap={4}
            maxW={{ base: "100%", md: "100%" }}
            mx="auto"
            px={{ base: 4, md: 0 }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="xl" fontWeight="bold">
                Meus Endereços
              </Text>
              <Button
                colorPalette="blue"
                onClick={openCreateAddressModal}
                size="sm"
              >
                <FaPlus />
                Adicionar Endereço
              </Button>
            </Box>

            <Box>
              {isLoadingAddresses ? (
                <Text>Carregando endereços...</Text>
              ) : addresses.length === 0 ? (
                <Box
                  textAlign="center"
                  py={8}
                  border="1px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                >
                  <Text fontSize="lg" color="gray.500" mb={2}>
                    Nenhum endereço encontrado
                  </Text>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Adicione seu primeiro endereço para começar
                  </Text>
                  <Button
                    colorPalette="blue"
                    onClick={openCreateAddressModal}
                    size="sm"
                  >
                    <FaPlus />
                    Adicionar Endereço
                  </Button>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  }}
                  gap={4}
                >
                  {addresses.map((address) => (
                    <Box
                      key={address.id}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      p={4}
                      display="flex"
                      flexDirection="column"
                      gap={3}
                      bg="white"
                      _hover={{ borderColor: "blue.300" }}
                      transition="border-color 0.2s"
                      minH="200px"
                    >
                      {/* Header do Card */}
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="blue.600"
                          >
                            {address.type === "HOME" && "Residencial"}
                            {address.type === "WORK" && "Trabalho"}
                            {address.type === "BILLING" && "Cobrança"}
                            {address.type === "SHIPPING" && "Entrega"}
                            {address.type === "OTHER" && "Outro"}
                          </Text>
                          {address.primary && (
                            <Text
                              fontSize="xs"
                              color="green.600"
                              fontWeight="bold"
                            >
                              PRINCIPAL
                            </Text>
                          )}
                        </Box>
                      </Box>

                      {/* Conteúdo do Endereço */}
                      <Box flex="1">
                        <Text fontSize="sm" fontWeight="bold" mb={1}>
                          {address.street}, {address.number}
                        </Text>
                        {address.complement && (
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            {address.complement}
                          </Text>
                        )}
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          {address.neighborhood}
                        </Text>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          {address.city} - {address.state}
                        </Text>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          CEP: {address.zip_code}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {address.country}
                        </Text>
                      </Box>

                      {/* Footer do Card com Botões */}
                      <Box display="flex" gap={2} mt="auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditAddressModal(address)}
                          flex="1"
                        >
                          <FaEdit />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => openDeleteAddressModal(address)}
                        >
                          <FaTrash />
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Modal de Criar Endereço */}
          <Dialog.Root
            open={isCreateAddressModalOpen}
            onOpenChange={(details) =>
              setIsCreateAddressModalOpen(details.open)
            }
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="600px">
                <Dialog.Header>
                  <Dialog.Title>Adicionar Novo Endereço</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Box display="flex" flexDir="column" gap={4}>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Tipo
                      </Text>
                      <select
                        value={newAddress.type}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            type: e.target.value as any,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #E2E8F0",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      >
                        <option value="HOME">Residencial</option>
                        <option value="WORK">Trabalho</option>
                        <option value="BILLING">Cobrança</option>
                        <option value="SHIPPING">Entrega</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </Box>

                    <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Rua/Logradouro *
                        </Text>
                        <Input
                          placeholder="Nome da rua"
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              street: e.target.value,
                            })
                          }
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Número *
                        </Text>
                        <Input
                          placeholder="123"
                          value={newAddress.number}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              number: e.target.value,
                            })
                          }
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Complemento
                      </Text>
                      <Input
                        placeholder="Apartamento, bloco, etc."
                        value={newAddress.complement}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            complement: e.target.value,
                          })
                        }
                      />
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Bairro *
                      </Text>
                      <Input
                        placeholder="Nome do bairro"
                        value={newAddress.neighborhood}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            neighborhood: e.target.value,
                          })
                        }
                      />
                    </Box>

                    <Box display="grid" gridTemplateColumns="2fr 1fr" gap={2}>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Cidade *
                        </Text>
                        <Input
                          placeholder="Nome da cidade"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Estado *
                        </Text>
                        <Input
                          placeholder="SP"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                        />
                      </Box>
                    </Box>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          CEP *
                        </Text>
                        <Input
                          placeholder="00000-000"
                          value={newAddress.zip_code}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              zip_code: e.target.value,
                            })
                          }
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          País *
                        </Text>
                        <Input
                          placeholder="Brasil"
                          value={newAddress.country}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              country: e.target.value,
                            })
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeCreateAddressModal}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={addAddress}
                    loading={isAddingAddress}
                  >
                    Adicionar
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Editar Endereço */}
          <Dialog.Root
            open={isEditAddressModalOpen}
            onOpenChange={(details) => setIsEditAddressModalOpen(details.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="600px">
                <Dialog.Header>
                  <Dialog.Title>Editar Endereço</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  {editingAddress && (
                    <Box display="flex" flexDir="column" gap={4}>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Tipo
                        </Text>
                        <select
                          value={editingAddress.type}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              type: e.target.value as any,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <option value="HOME">Residencial</option>
                          <option value="WORK">Trabalho</option>
                          <option value="BILLING">Cobrança</option>
                          <option value="SHIPPING">Entrega</option>
                          <option value="OTHER">Outro</option>
                        </select>
                      </Box>

                      <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            Rua/Logradouro *
                          </Text>
                          <Input
                            placeholder="Nome da rua"
                            value={editingAddress.street}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                street: e.target.value,
                              })
                            }
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            Número *
                          </Text>
                          <Input
                            placeholder="123"
                            value={editingAddress.number}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                number: e.target.value,
                              })
                            }
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Complemento
                        </Text>
                        <Input
                          placeholder="Apartamento, bloco, etc."
                          value={editingAddress.complement || ""}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              complement: e.target.value,
                            })
                          }
                        />
                      </Box>

                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Bairro *
                        </Text>
                        <Input
                          placeholder="Nome do bairro"
                          value={editingAddress.neighborhood}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              neighborhood: e.target.value,
                            })
                          }
                        />
                      </Box>

                      <Box display="grid" gridTemplateColumns="2fr 1fr" gap={2}>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            Cidade *
                          </Text>
                          <Input
                            placeholder="Nome da cidade"
                            value={editingAddress.city}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                city: e.target.value,
                              })
                            }
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            Estado *
                          </Text>
                          <Input
                            placeholder="SP"
                            value={editingAddress.state}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                state: e.target.value,
                              })
                            }
                          />
                        </Box>
                      </Box>

                      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            CEP *
                          </Text>
                          <Input
                            placeholder="00000-000"
                            value={editingAddress.zip_code}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                zip_code: e.target.value,
                              })
                            }
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" mb={1}>
                            País *
                          </Text>
                          <Input
                            placeholder="Brasil"
                            value={editingAddress.country}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                country: e.target.value,
                              })
                            }
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeEditAddressModal}>
                    Cancelar
                  </Button>
                  <Button colorPalette="blue" onClick={updateAddress}>
                    Salvar Alterações
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Modal de Deletar Endereço */}
          <Dialog.Root
            open={isDeleteAddressModalOpen}
            onOpenChange={(details) =>
              setIsDeleteAddressModalOpen(details.open)
            }
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Confirmar Exclusão</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text>
                    Tem certeza que deseja remover este endereço? Esta ação não
                    pode ser desfeita.
                  </Text>
                  {addressToDelete && (
                    <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm" fontWeight="bold">
                        {addressToDelete.street}, {addressToDelete.number}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {addressToDelete.neighborhood} - {addressToDelete.city}/
                        {addressToDelete.state}
                      </Text>
                    </Box>
                  )}
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={closeDeleteAddressModal}>
                    Cancelar
                  </Button>
                  <Button colorPalette="red" onClick={confirmDeleteAddress}>
                    Remover
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        </Tabs.Content>

        <Tabs.Content value="change-password">
          <Box
            display="flex"
            flexDir="column"
            gap={4}
            maxW={{ base: "100%", md: "520px" }}
            mx={{ base: 0, md: "auto" }}
            px={{ base: 4, md: 0 }}
          >
            {stepChangePwd === "form" && (
              <>
                <PasswordInput
                  placeholder="Senha atual"
                  {...registerPwd("current_password")}
                />
                {errorsPwd.current_password && (
                  <Text color="red.500" textStyle="sm">
                    {errorsPwd.current_password.message}
                  </Text>
                )}

                <PasswordInput
                  placeholder="Nova senha"
                  {...registerPwd("new_password")}
                />
                {errorsPwd.new_password && (
                  <Text color="red.500" textStyle="sm">
                    {errorsPwd.new_password.message}
                  </Text>
                )}

                <PasswordInput
                  placeholder="Confirme a nova senha"
                  {...registerPwd("confirm_new_password")}
                />
                {errorsPwd.confirm_new_password && (
                  <Text color="red.500" textStyle="sm">
                    {errorsPwd.confirm_new_password.message}
                  </Text>
                )}

                <Button
                  alignSelf={{ base: "stretch", md: "start" }}
                  w={{ base: "100%", md: "auto" }}
                  loading={isRequestingPwd || isSubmittingPwd}
                  onClick={handleSubmitPwd(onRequestChangePassword)}
                >
                  Enviar
                </Button>
              </>
            )}

            {stepChangePwd === "code" && (
              <>
                <Box>
                  <Text mb={2}>Código de verificação</Text>
                  <Box
                    display="flex"
                    justifyContent={{ base: "center", md: "flex-start" }}
                  >
                    <PinInput.Root
                      value={verificationCode.split("")}
                      onValueChange={(details) =>
                        setVerificationCode(
                          Array.isArray(details.value)
                            ? details.value.join("")
                            : details.value
                        )
                      }
                      otp
                      type="alphanumeric"
                    >
                      <PinInput.HiddenInput />
                      <PinInput.Control>
                        <PinInput.Input index={0} />
                        <PinInput.Input index={1} />
                        <PinInput.Input index={2} />
                        <PinInput.Input index={3} />
                        <PinInput.Input index={4} />
                        <PinInput.Input index={5} />
                      </PinInput.Control>
                    </PinInput.Root>
                  </Box>
                </Box>
                <Button
                  alignSelf={{ base: "stretch", md: "start" }}
                  w={{ base: "100%", md: "auto" }}
                  loading={isConfirmingPwd}
                  onClick={onConfirmChangePassword}
                >
                  Confirmar alteração
                </Button>
              </>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
