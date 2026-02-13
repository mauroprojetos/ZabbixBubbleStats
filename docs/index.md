# Zabbix Bubble Stats Widget

Widget de visualização em formato de bolhas para o Zabbix, que exibe estatísticas de métricas e problemas baseadas em porcentagem.

![Zabbix Bubble Stats](https://img.shields.io/badge/Zabbix-Widget-red)
![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-GPL--2.0-green)

## 📋 Descrição

O **Bubble Stats Widget** é um módulo para Zabbix que transforma dados de métricas e problemas em uma visualização interativa de bolhas. Cada bolha representa um item ou problema, com tamanho e cor baseados em porcentagens e valores configuráveis.

Inspirado no conceito de "Crypto Bubbles", este widget traz uma forma visual e intuitiva de monitorar o estado da sua infraestrutura.

## ✨ Características

### Visualização de Dados

- **Bolhas Interativas**: Cada bolha representa uma métrica ou problema
- **Física de Movimento**: Simulação física opcional para movimento natural das bolhas
- **Cores Dinâmicas**: Gradientes baseados na intensidade dos valores
- **Tamanhos Variáveis**: Tamanho das bolhas baseado em porcentagem, valor absoluto ou severidade

### Tipos de Dados Suportados

#### 1. Métricas (Items)
- Exibição de valores de items do Zabbix
- Três tipos de cálculo de porcentagem:
  - **Valor atual / Valor máximo**: Compara com o valor máximo histórico
  - **Mudança percentual**: Calcula a variação em relação ao período anterior
  - **Porcentagem de threshold**: Compara com um valor de referência definido

#### 2. Problemas
- Visualização de problemas ativos
- Agrupamento por host
- Cores baseadas na severidade do Zabbix:
  - Cinza: Não classificado
  - Azul: Informação
  - Amarelo: Aviso
  - Laranja: Média
  - Vermelho: Alta
  - Vermelho Escuro: Desastre

### Recursos Interativos

- **Tooltip Detalhado**: Informações completas ao passar o mouse
- **Drag & Drop**: Arraste bolhas para reposicioná-las
- **Painel de Estatísticas**: Resumo com total, média, máximo e mínimo
- **Física Desabilitável**: Opção de desativar a simulação física
- **Responsivo**: Adapta-se ao tamanho do widget

## 📦 Instalação

### Requisitos

- Zabbix 6.0 ou superior
- PHP 7.4 ou superior
- Navegador moderno com suporte a ES6

### Passos de Instalação

1. **Copie o módulo para o diretório de módulos do Zabbix:**

```bash
cd /usr/share/zabbix/modules/
sudo cp -r ZabbixBubbleStats .
sudo chown -R www-data:www-data ZabbixBubbleStats
```

2. **Ative o módulo no Zabbix:**

   - Acesse: **Administration → General → Modules**
   - Clique em **Scan directory**
   - Encontre **Bubble Stats Widget** na lista
   - Clique em **Enable**

3. **Adicione o widget ao dashboard:**

   - Vá para um dashboard
   - Clique em **Edit dashboard**
   - Clique em **Add widget**
   - Selecione **Bubble Stats Widget**

## ⚙️ Configuração

### Configurações Básicas

#### Tipo de Dados
- **Metrics (Items)**: Exibe métricas de items
- **Problems**: Exibe problemas ativos

#### Filtros de Host
- **Host groups**: Filtrar por grupos de hosts
- **Hosts**: Filtrar por hosts específicos
- **Host** (em dashboards de template): Host específico para override

### Configurações de Métricas

#### Item Patterns
Padrões para selecionar items. Exemplos:
- `CPU*` - Todos os items que começam com "CPU"
- `*usage*` - Items que contêm "usage"
- `Memory available` - Item específico

#### Cálculo de Porcentagem
- **Current value / Maximum value**: Usa o valor máximo dos últimos 7 dias
- **Percentage change from previous period**: Compara com 1 hora atrás
- **Percentage of threshold**: Compara com valor definido em "Threshold Value"

#### Threshold Value
Valor de referência para cálculo de porcentagem (padrão: 100)

### Configurações de Problemas

#### Show suppressed problems
Incluir problemas suprimidos na visualização

#### Show only unacknowledged
Mostrar apenas problemas não reconhecidos

### Configurações de Visualização

#### Bubble Size Based On
- **Percentage Value**: Tamanho baseado na porcentagem calculada
- **Absolute Value**: Tamanho baseado no valor absoluto
- **Problem Severity**: Tamanho baseado na severidade (apenas para problemas)

#### Maximum Number of Bubbles
Limite de bolhas exibidas (padrão: 50)

#### Enable Physics Simulation
Ativar/desativar simulação física de movimento

#### Show Tooltip on Hover
Exibir tooltip ao passar o mouse sobre as bolhas

#### Show Legend
Exibir painel de estatísticas

## 🎨 Exemplos de Uso

### Exemplo 1: Monitoramento de CPU

```
Tipo de Dados: Metrics
Item Patterns: CPU*
Cálculo: Current value / Maximum value
Tamanho da Bolha: Percentage Value
```

**Resultado**: Bolhas mostrando uso de CPU de diferentes hosts, com tamanho proporcional à porcentagem de uso.

### Exemplo 2: Análise de Problemas

```
Tipo de Dados: Problems
Host groups: Linux servers
Tamanho da Bolha: Problem Severity
Show only unacknowledged: Yes
```

**Resultado**: Bolhas representando hosts com problemas, coloridas por severidade e dimensionadas pela quantidade de problemas.

### Exemplo 3: Mudança de Performance

```
Tipo de Dados: Metrics
Item Patterns: *response time*
Cálculo: Percentage change from previous period
Tamanho da Bolha: Absolute Value
```

**Resultado**: Visualização de mudanças no tempo de resposta, com cores indicando melhora (verde) ou piora (vermelho).

## 🔧 Personalização

### Imagens e Ícones

O widget suporta exibição de imagens/ícones dentro das bolhas para facilitar a identificação visual dos itens. 

**📖 Documentação completa:** Veja [IMAGES.md](IMAGES.md) para detalhes sobre:
- Como adicionar imagens usando tags do Zabbix
- Formatos suportados (URLs, caminhos absolutos/relativos)
- Estratégia de busca hierárquica (item → host → padrões)
- Exemplos práticos e troubleshooting

### Cores

As cores são aplicadas automaticamente baseadas nos valores:

- **Verde**: Valores positivos (crescimento)
- **Vermelho**: Valores negativos (decréscimo)
- **Cinza**: Valores neutros
- **Cores de Severidade**: Para problemas (seguem o padrão Zabbix)

### Física

A simulação física pode ser ajustada modificando os parâmetros no arquivo `class.widget.js`:

```javascript
// Velocidade inicial
vx: (Math.random() - 0.5) * 2,
vy: (Math.random() - 0.5) * 2,

// Fricção
bubble.vx *= 0.99;
bubble.vy *= 0.99;
```

## 📊 Estrutura do Projeto

```
ZabbixBubbleStats/
├── manifest.json           # Manifesto do módulo
├── Widget.php             # Classe principal do widget
├── README.md              # Documentação principal
├── IMAGES.md              # Documentação sobre imagens e ícones
├── includes/
│   └── WidgetForm.php     # Formulário de configuração
├── actions/
│   └── WidgetView.php     # Lógica de busca de dados
├── views/
│   ├── widget.view.php    # View principal
│   └── widget.edit.php    # View de edição
└── assets/
    ├── css/
    │   └── widget.css     # Estilos
    └── js/
        └── class.widget.js # JavaScript principal
```

## 🐛 Troubleshooting

### Bolhas não aparecem

1. Verifique se há dados nos filtros configurados
2. Confirme que os hosts/items estão ativos
3. Verifique o console do navegador para erros JavaScript

### Performance lenta

1. Reduza o número máximo de bolhas
2. Desative a simulação física
3. Reduza a quantidade de items selecionados

### Cores não aparecem corretamente

1. Limpe o cache do navegador
2. Verifique se o CSS foi carregado corretamente
3. Confirme que os valores estão sendo calculados (veja o tooltip)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### Versão 1.0 (2025)
- Lançamento inicial
- Suporte para métricas e problemas
- Três tipos de cálculo de porcentagem
- Simulação física de movimento
- Tooltips interativos
- Painel de estatísticas

## 📄 Licença

Este projeto está licenciado sob a GNU General Public License v2.0 - veja o arquivo LICENSE para detalhes.

## 👤 Autor

**Mauro**

## 🙏 Agradecimentos

- Inspirado no conceito de Crypto Bubbles
- Baseado no exemplo Echarts-Zabbix Widget
- Comunidade Zabbix

## 📞 Suporte

Para reportar bugs ou solicitar features, por favor abra uma issue no repositório do projeto.

---

**Nota**: Este widget foi desenvolvido de forma independente e não é oficialmente suportado pela Zabbix SIA.

