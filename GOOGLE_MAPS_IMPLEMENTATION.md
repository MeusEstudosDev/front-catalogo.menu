# Implementação do Google Maps e Geocoding API

## ✅ Alterações Realizadas

### 1. **Variáveis de Ambiente (.env.local)**
- Alterado `GOOGLE_GEOCODING_API_KEY` para `NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY`
- Necessário o prefixo `NEXT_PUBLIC_` para variáveis acessíveis no cliente (browser)

### 2. **Layout Principal (app/layout.tsx)**
- Adicionado script do Google Maps JavaScript API no `<head>`
- Inclui a biblioteca `places` para funcionalidades avançadas
- Carregamento assíncrono para não bloquear a renderização da página

### 3. **Componente GoogleMap (components/account/GoogleMap.tsx)**
Novo componente criado com as seguintes funcionalidades:

#### Recursos:
- ✅ Exibe mapa interativo do Google Maps
- ✅ Marcador arrastável para ajuste preciso da localização
- ✅ Clique no mapa para reposicionar o marcador
- ✅ Callback `onLocationChange` para atualizar coordenadas no componente pai
- ✅ Centralização automática quando coordenadas mudam
- ✅ Controles de zoom, street view, e tipo de mapa
- ✅ Altura customizável
- ✅ Zoom customizável (padrão: 17 para visualização de rua)

#### Props:
```typescript
interface GoogleMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string; // padrão: "400px"
  zoom?: number; // padrão: 17
}
```

### 4. **Integração Google Geocoding API (page.tsx)**

#### Função `getCoordinates` atualizada:
- ❌ **Removido:** OpenStreetMap Nominatim API
- ✅ **Adicionado:** Google Geocoding API
- Maior precisão e confiabilidade
- Melhor cobertura global
- Respostas mais rápidas

#### Fluxo de Funcionamento:

1. **Usuário digita CEP** → Busca dados do endereço via ViaCEP
2. **Dados preenchidos automaticamente** → Envia endereço completo para Google Geocoding API
3. **Obtém coordenadas (latitude/longitude)** → Exibe mapa com localização
4. **Usuário pode ajustar** → Clica ou arrasta marcador no mapa
5. **Coordenadas atualizadas** → Salvas junto com o endereço

### 5. **Interface de Usuário**

#### Modal de Criar Endereço:
- Formulário com todos os campos (CEP, Rua, Número, etc.)
- Busca automática de endereço ao digitar CEP completo
- Indicador de loading durante busca de CEP
- Indicador de loading durante obtenção de coordenadas
- **Mapa interativo aparece após obter coordenadas**
- Instruções claras: "Clique ou arraste o marcador para ajustar a localização exata"
- Exibição das coordenadas atuais abaixo do mapa

#### Modal de Editar Endereço:
- Mesmas funcionalidades do modal de criar
- Mapa carregado com as coordenadas existentes
- Permite reposicionar o marcador para correção

### 6. **Tipos TypeScript (types/google-maps.d.ts)**
- Declaração global do namespace `google` no objeto `Window`
- Necessário para TypeScript reconhecer a API do Google Maps
- Instalado `@types/google.maps` via npm para tipos completos

## 📦 Dependências Instaladas

```bash
npm install --save-dev @types/google.maps
```

## 🔑 Configuração da API Key

A mesma API Key é usada para:
1. **Google Geocoding API** - Converter endereços em coordenadas
2. **Google Maps JavaScript API** - Exibir mapas interativos

Certifique-se de que ambas as APIs estão habilitadas no Google Cloud Console:
- ✅ Geocoding API
- ✅ Maps JavaScript API

## 🎯 Benefícios

1. **Precisão Melhorada**: Google Geocoding é mais preciso que OpenStreetMap
2. **UX Aprimorada**: Usuário vê exatamente onde está marcando o endereço
3. **Flexibilidade**: Permite ajuste manual fino da localização
4. **Validação Visual**: Usuário confirma visualmente o local correto
5. **Coordenadas Precisas**: Importantes para cálculo de distância, rotas, etc.

## 📝 Exemplo de Uso

```tsx
<GoogleMap
  latitude={-23.550520}
  longitude={-46.633308}
  onLocationChange={(lat, lng) => {
    console.log(`Nova localização: ${lat}, ${lng}`);
    // Atualizar estado do componente pai
  }}
  height="400px"
  zoom={17}
/>
```

## 🚀 Próximos Passos Sugeridos

1. Adicionar autocomplete de endereços usando Google Places API
2. Implementar busca reversa (clicar no mapa para preencher endereço)
3. Adicionar marcadores para múltiplos endereços do usuário
4. Mostrar raio de entrega em relação a um ponto central
5. Calcular distância entre dois endereços

## ⚠️ Observações Importantes

- A variável de ambiente deve começar com `NEXT_PUBLIC_` para ser acessível no browser
- O script do Google Maps é carregado no layout para estar disponível em toda a aplicação
- O componente GoogleMap verifica se `window.google` está disponível antes de inicializar
- As coordenadas são armazenadas com 6 casas decimais para precisão adequada
