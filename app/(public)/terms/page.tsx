"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

export default function Page() {
  const router = useRouter();

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" gap={6}>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          alignSelf="flex-start"
          mb={2}
        >
          <LuArrowLeft />
          Voltar
        </Button>

        <Heading as="h1" size="2xl" mb={4}>
          Termos de Uso
        </Heading>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            1. Aceitação dos Termos
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Ao acessar e usar o catalogo.menu, você concorda em cumprir e estar
            vinculado aos seguintes termos e condições de uso. Se você não
            concordar com qualquer parte destes termos, não deverá usar nosso
            serviço.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            2. Uso do Serviço
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            O catalogo.menu é um sistema de pedidos online. Você concorda em
            usar o serviço apenas para fins legais e de acordo com estes termos.
            É proibido usar o serviço de forma que possa danificar, desabilitar,
            sobrecarregar ou prejudicar o sistema.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            3. Conta de Usuário
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Para usar determinadas funcionalidades do serviço, você precisará
            criar uma conta. Você é responsável por manter a confidencialidade
            de suas informações de conta e por todas as atividades que ocorram
            em sua conta. Você concorda em notificar-nos imediatamente sobre
            qualquer uso não autorizado de sua conta.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            4. Pedidos e Pagamentos
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Ao fazer um pedido através do catalogo.menu, você concorda em
            fornecer informações de pagamento precisas e completas. Todos os
            pedidos estão sujeitos à disponibilidade e confirmação do
            estabelecimento. Reservamos o direito de recusar ou cancelar
            qualquer pedido a qualquer momento.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            5. Propriedade Intelectual
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Todo o conteúdo presente no catalogo.menu, incluindo textos,
            gráficos, logos, imagens e software, é propriedade do catalogo.menu
            ou de seus fornecedores de conteúdo e é protegido por leis de
            direitos autorais e propriedade intelectual.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            6. Limitação de Responsabilidade
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            O catalogo.menu não será responsável por quaisquer danos diretos,
            indiretos, incidentais, especiais ou consequenciais resultantes do
            uso ou da incapacidade de usar o serviço. Não garantimos que o
            serviço estará sempre disponível, oportuno, seguro ou livre de
            erros.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            7. Modificações dos Termos
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Reservamos o direito de modificar estes termos a qualquer momento.
            As alterações entrarão em vigor imediatamente após a publicação no
            site. Seu uso continuado do serviço após as alterações constitui sua
            aceitação dos novos termos.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            8. Lei Aplicável
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Estes termos serão regidos e interpretados de acordo com as leis do
            Brasil. Qualquer disputa relacionada a estes termos será submetida à
            jurisdição exclusiva dos tribunais brasileiros.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            9. Contato
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Se você tiver dúvidas sobre estes termos, entre em contato conosco
            através do nosso site ou canais de atendimento oficial.
          </Text>
        </Box>

        <Box pt={4} borderTop="1px" borderColor="gray.200">
          <Text fontSize="sm" color="gray.500">
            Última atualização: 8 de outubro de 2025
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
