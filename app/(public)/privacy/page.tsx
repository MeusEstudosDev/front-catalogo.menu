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
          Política de Privacidade
        </Heading>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            1. Informações que Coletamos
          </Heading>
          <Text color="gray.600" lineHeight="1.8" mb={3}>
            No catalogo.menu, coletamos informações para fornecer e melhorar
            nossos serviços. As informações coletadas incluem:
          </Text>
          <Text color="gray.600" lineHeight="1.8" ml={4}>
            • Informações de cadastro (nome, e-mail, telefone, endereço)
            <br />
            • Informações de pedidos e histórico de compras
            <br />
            • Dados de pagamento (processados por terceiros seguros)
            <br />
            • Informações de uso e navegação no site
            <br />• Endereço IP e dados do dispositivo
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            2. Como Usamos Suas Informações
          </Heading>
          <Text color="gray.600" lineHeight="1.8" mb={3}>
            Utilizamos as informações coletadas para:
          </Text>
          <Text color="gray.600" lineHeight="1.8" ml={4}>
            • Processar e gerenciar seus pedidos
            <br />
            • Comunicar sobre o status dos pedidos
            <br />
            • Melhorar nossos serviços e experiência do usuário
            <br />
            • Enviar notificações e atualizações importantes
            <br />
            • Prevenir fraudes e garantir a segurança
            <br />• Cumprir obrigações legais e regulatórias
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            3. Compartilhamento de Informações
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Não vendemos suas informações pessoais. Compartilhamos dados apenas
            quando necessário com:
          </Text>
          <Text color="gray.600" lineHeight="1.8" ml={4} mt={3}>
            • Estabelecimentos parceiros para processar pedidos
            <br />
            • Processadores de pagamento para transações seguras
            <br />
            • Prestadores de serviços de entrega
            <br />
            • Autoridades legais quando exigido por lei
            <br />• Provedores de serviços que nos auxiliam nas operações
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            4. Cookies e Tecnologias Semelhantes
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Utilizamos cookies e tecnologias semelhantes para melhorar sua
            experiência, lembrar suas preferências e analisar o uso do site.
            Você pode gerenciar as configurações de cookies através do seu
            navegador, mas isso pode afetar algumas funcionalidades do serviço.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            5. Segurança dos Dados
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Implementamos medidas de segurança técnicas e organizacionais para
            proteger suas informações pessoais contra acesso não autorizado,
            alteração, divulgação ou destruição. No entanto, nenhum método de
            transmissão pela internet é 100% seguro, e não podemos garantir
            segurança absoluta.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            6. Seus Direitos
          </Heading>
          <Text color="gray.600" lineHeight="1.8" mb={3}>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os
            seguintes direitos:
          </Text>
          <Text color="gray.600" lineHeight="1.8" ml={4}>
            • Acessar seus dados pessoais
            <br />
            • Corrigir dados incompletos, inexatos ou desatualizados
            <br />
            • Solicitar a exclusão de seus dados
            <br />
            • Revogar o consentimento
            <br />
            • Solicitar a portabilidade dos dados
            <br />• Obter informações sobre o uso compartilhado de dados
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            7. Retenção de Dados
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Mantemos suas informações pessoais apenas pelo tempo necessário para
            cumprir as finalidades descritas nesta política, a menos que um
            período de retenção mais longo seja exigido ou permitido por lei.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            8. Menores de Idade
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Nosso serviço não se destina a menores de 18 anos. Não coletamos
            intencionalmente informações pessoais de menores. Se tomarmos
            conhecimento de que coletamos dados de menores, tomaremos medidas
            para excluir essas informações.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            9. Alterações nesta Política
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Podemos atualizar esta política de privacidade periodicamente.
            Notificaremos sobre alterações significativas publicando a nova
            política em nosso site. Recomendamos revisar esta página
            regularmente para se manter informado.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            10. Contato
          </Heading>
          <Text color="gray.600" lineHeight="1.8">
            Se você tiver dúvidas sobre esta política de privacidade ou sobre o
            tratamento de seus dados pessoais, entre em contato conosco através
            dos nossos canais oficiais de atendimento.
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
