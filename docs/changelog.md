# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-01-11

### Adicionado

#### Funcionalidades Principais
- Widget de visualização em formato de bolhas para Zabbix
- Suporte para dois tipos de dados: Métricas (Items) e Problemas
- Três tipos de cálculo de porcentagem para métricas:
  - Valor atual / Valor máximo
  - Mudança percentual em relação ao período anterior
  - Porcentagem em relação a threshold definido
- Simulação física de movimento das bolhas (habilitável/desabilitável)
- Sistema de cores dinâmicas baseadas em intensidade de valores
- Suporte a cores de severidade do Zabbix para problemas

#### Interface e Interatividade
- Tooltips informativos ao passar o mouse
- Drag & Drop para reposicionar bolhas manualmente
- Painel de estatísticas com total, média, máximo e mínimo
- Legenda configurável
- Animações suaves e responsivas

#### Configurações
- Filtros por grupos de hosts e hosts específicos
- Suporte a padrões de items com wildcards
- Configuração de número máximo de bolhas exibidas
- Opções de tamanho de bolha baseado em:
  - Porcentagem
  - Valor absoluto
  - Severidade de problema
- Filtros para problemas:
  - Mostrar/ocultar problemas suprimidos
  - Filtrar apenas não reconhecidos

#### Documentação
- README.md completo com descrição e exemplos
- INSTALL.md com guia detalhado de instalação
- EXAMPLES.md com 13 exemplos práticos de configuração
- Comentários no código para facilitar manutenção

#### Arquitetura
- Estrutura modular seguindo padrões do Zabbix
- Separação clara entre backend (PHP) e frontend (JavaScript)
- CSS organizado e bem documentado
- JavaScript orientado a objetos com classe WidgetBubbleStats

### Características Técnicas

#### Backend (PHP)
- Widget.php: Classe principal do widget
- WidgetForm.php: Formulário de configuração com validações
- WidgetView.php: Lógica de busca e processamento de dados
- Integração com API do Zabbix para buscar items e problemas
- Cálculo automático de porcentagens
- Busca de valores históricos para comparações

#### Frontend (JavaScript)
- Classe WidgetBubbleStats estendendo CWidget
- Engine de física para movimento das bolhas
- Sistema de colisão entre bolhas e paredes
- Renderização otimizada com requestAnimationFrame
- Gerenciamento de eventos (mouse, resize)

#### Estilos (CSS)
- Design moderno com gradientes radiais
- Efeitos de hover e interação
- Suporte a diferentes severidades de problemas
- Responsivo e adaptável a diferentes tamanhos
- Tema escuro integrado ao Zabbix

### Compatibilidade
- Zabbix 6.0+
- PHP 7.4+
- Navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Performance
- Limite configurável de bolhas para otimização
- Opção de desabilitar física para melhor performance
- Renderização eficiente com canvas positioning
- Throttling de eventos de mouse

### Segurança
- Validação de inputs no backend
- Escape de dados para prevenir XSS
- Uso de API oficial do Zabbix
- Respeito a permissões de usuário do Zabbix

## [Unreleased]

### Planejado para Versões Futuras

#### Funcionalidades
- [ ] Exportação de snapshot das bolhas
- [ ] Modo de comparação temporal
- [ ] Agrupamento de bolhas por tags
- [ ] Filtros avançados de items
- [ ] Gráficos históricos ao clicar na bolha
- [ ] Alertas visuais para valores críticos
- [ ] Modo de apresentação (fullscreen)
- [ ] Temas de cores personalizáveis

#### Melhorias
- [ ] Cache de dados para melhor performance
- [ ] Animações de transição entre atualizações
- [ ] Suporte a mais tipos de cálculo
- [ ] Integração com mapas do Zabbix
- [ ] Exportação de configurações
- [ ] Templates pré-configurados

#### Otimizações
- [ ] WebGL para renderização de muitas bolhas
- [ ] Web Workers para cálculos pesados
- [ ] Lazy loading de dados
- [ ] Compressão de assets

## Notas de Versão

### Versão 1.0.0

Esta é a primeira versão estável do Zabbix Bubble Stats Widget. O widget foi desenvolvido com foco em:

1. **Usabilidade**: Interface intuitiva e fácil de configurar
2. **Performance**: Otimizado para dashboards com muitos dados
3. **Flexibilidade**: Múltiplas opções de configuração
4. **Visualização**: Representação clara e atrativa dos dados

### Agradecimentos

- Inspirado no conceito de Crypto Bubbles
- Baseado na estrutura do Echarts-Zabbix Widget
- Desenvolvido para a comunidade Zabbix

### Contribuidores

- Mauro - Desenvolvedor principal

---

## Como Contribuir

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Reportando Bugs

Ao reportar bugs, inclua:
- Versão do Zabbix
- Versão do widget
- Navegador e versão
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots se aplicável

### Sugerindo Melhorias

Para sugerir melhorias:
- Descreva o caso de uso
- Explique o benefício
- Forneça exemplos se possível

---

**Última atualização**: 11 de Janeiro de 2025

