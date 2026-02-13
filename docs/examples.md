# Exemplos de Configuração - Zabbix Bubble Stats Widget

Este documento contém exemplos práticos de configuração do widget para diferentes cenários de monitoramento.

## 📊 Exemplos de Métricas

### Exemplo 1: Monitoramento de CPU

**Objetivo**: Visualizar o uso de CPU de todos os servidores Linux

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Host groups: Linux servers
Item patterns: CPU utilization*
Cálculo de Porcentagem: Current value / Maximum value
Tamanho da Bolha: Percentage Value
Número Máximo de Bolhas: 30
Física: Enabled
```

**Resultado**: Bolhas representando cada servidor, com tamanho proporcional ao uso de CPU. Servidores com alto uso aparecem como bolhas maiores e mais vermelhas.

---

### Exemplo 2: Uso de Memória

**Objetivo**: Monitorar memória disponível em relação a um threshold

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Hosts: [Selecione seus servidores]
Item patterns: Available memory, Memory utilization
Cálculo de Porcentagem: Percentage of threshold
Threshold Value: 80
Tamanho da Bolha: Percentage Value
```

**Resultado**: Bolhas mostrando quanto da memória está sendo utilizada em relação ao limite de 80%. Valores acima de 80% aparecem maiores.

---

### Exemplo 3: Espaço em Disco

**Objetivo**: Visualizar uso de disco de múltiplos filesystems

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Host groups: All servers
Item patterns: *: Space utilization, Disk space usage*
Cálculo de Porcentagem: Current value / Maximum value
Tamanho da Bolha: Absolute Value
Número Máximo de Bolhas: 50
```

**Resultado**: Cada filesystem aparece como uma bolha. Tamanho baseado no espaço total, cor baseada na porcentagem de uso.

---

### Exemplo 4: Tráfego de Rede

**Objetivo**: Monitorar mudanças no tráfego de rede

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Host groups: Network devices
Item patterns: *bits received*, *bits sent*
Cálculo de Porcentagem: Percentage change from previous period
Tamanho da Bolha: Absolute Value
Física: Enabled
```

**Resultado**: Bolhas verdes indicam aumento de tráfego, vermelhas indicam diminuição. Tamanho proporcional ao volume de dados.

---

### Exemplo 5: Tempo de Resposta de Serviços

**Objetivo**: Visualizar performance de aplicações web

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Hosts: [Web servers]
Item patterns: *response time*, *latency*
Cálculo de Porcentagem: Percentage of threshold
Threshold Value: 1000 (1 segundo)
Tamanho da Bolha: Percentage Value
Tooltip: Enabled
```

**Resultado**: Serviços com tempo de resposta alto aparecem como bolhas maiores e vermelhas.

---

## 🚨 Exemplos de Problemas

### Exemplo 6: Visão Geral de Problemas

**Objetivo**: Dashboard executivo com todos os problemas ativos

**Configuração**:
```
Tipo de Dados: Problems
Host groups: [Todos os grupos]
Tamanho da Bolha: Problem Severity
Show suppressed problems: No
Show only unacknowledged: No
Número Máximo de Bolhas: 50
Legenda: Enabled
```

**Resultado**: Cada host com problemas aparece como uma bolha. Cor baseada na severidade mais alta, tamanho baseado na quantidade de problemas.

---

### Exemplo 7: Problemas Críticos Não Reconhecidos

**Objetivo**: Foco em problemas que precisam de atenção imediata

**Configuração**:
```
Tipo de Dados: Problems
Host groups: Production
Show suppressed problems: No
Show only unacknowledged: Yes
Tamanho da Bolha: Problem Severity
Física: Disabled
```

**Resultado**: Apenas problemas não reconhecidos são exibidos. Física desabilitada para facilitar leitura rápida.

---

### Exemplo 8: Análise por Severidade

**Objetivo**: Identificar hosts com muitos problemas de alta severidade

**Configuração**:
```
Tipo de Dados: Problems
Host groups: All servers
Tamanho da Bolha: Percentage Value
Show suppressed problems: No
Número Máximo de Bolhas: 30
```

**Resultado**: Porcentagem calculada baseada na proporção de problemas High/Disaster. Hosts com mais problemas críticos aparecem maiores.

---

## 🔄 Exemplos de Mudança Percentual

### Exemplo 9: Crescimento de Banco de Dados

**Objetivo**: Monitorar taxa de crescimento de databases

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Hosts: [Database servers]
Item patterns: Database size*, Table size*
Cálculo de Porcentagem: Percentage change from previous period
Tamanho da Bolha: Absolute Value
```

**Resultado**: Databases crescendo rapidamente aparecem como bolhas verdes grandes. Shrinking databases aparecem vermelhas.

---

### Exemplo 10: Variação de Temperatura

**Objetivo**: Monitorar mudanças de temperatura em datacenters

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Host groups: Environmental sensors
Item patterns: Temperature*
Cálculo de Porcentagem: Percentage change from previous period
Tamanho da Bolha: Percentage Value
Threshold Value: 25 (temperatura base)
```

**Resultado**: Sensores com aumento de temperatura aparecem vermelhos, com diminuição aparecem verdes.

---

## 🎯 Casos de Uso Avançados

### Exemplo 11: Dashboard Multi-Camada

**Configuração de 4 Widgets**:

**Widget 1 - CPU**:
```
Item patterns: CPU*
Cálculo: Current value / Maximum value
Max Bubbles: 20
```

**Widget 2 - Memória**:
```
Item patterns: Memory*
Cálculo: Percentage of threshold
Threshold: 80
Max Bubbles: 20
```

**Widget 3 - Disco**:
```
Item patterns: *space*
Cálculo: Current value / Maximum value
Max Bubbles: 30
```

**Widget 4 - Problemas**:
```
Data Type: Problems
Show only unacknowledged: Yes
Max Bubbles: 15
```

**Resultado**: Dashboard completo com visão de recursos e problemas.

---

### Exemplo 12: Monitoramento de Containers

**Objetivo**: Visualizar performance de containers Docker/Kubernetes

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Host groups: Containers
Item patterns: container.cpu*, container.memory*
Cálculo de Porcentagem: Percentage of threshold
Threshold Value: 100
Tamanho da Bolha: Percentage Value
Número Máximo de Bolhas: 100
Física: Enabled
```

**Resultado**: Cada container como uma bolha, facilitando identificação de containers com problemas de performance.

---

### Exemplo 13: SLA Monitoring

**Objetivo**: Visualizar disponibilidade de serviços

**Configuração**:
```
Tipo de Dados: Metrics (Items)
Item patterns: *uptime*, *availability*
Cálculo de Porcentagem: Percentage of threshold
Threshold Value: 99.9 (SLA target)
Tamanho da Bolha: Absolute Value
```

**Resultado**: Serviços abaixo do SLA aparecem como bolhas vermelhas maiores.

---

## 💡 Dicas de Configuração

### Otimização de Performance

1. **Limite o número de bolhas**:
   - Use 30-50 para melhor performance
   - Mais de 100 pode causar lentidão

2. **Desative física para muitas bolhas**:
   - Física desabilitada é mais rápida
   - Útil para dashboards de overview

3. **Use filtros específicos**:
   - Quanto mais específico o filtro, melhor a performance
   - Evite padrões muito amplos como `*`

### Melhores Práticas

1. **Escolha o cálculo correto**:
   - **Current/Maximum**: Para métricas com histórico
   - **Change percent**: Para detectar anomalias
   - **Threshold**: Para limites conhecidos

2. **Tamanho da bolha**:
   - **Percentage**: Para destacar problemas
   - **Absolute**: Para mostrar escala real
   - **Severity**: Apenas para problemas

3. **Cores e visualização**:
   - Verde = Bom/Crescimento positivo
   - Vermelho = Ruim/Decréscimo
   - Tamanho = Importância/Severidade

### Padrões de Items Úteis

```
CPU:
- CPU utilization*
- CPU*usage*
- system.cpu*

Memória:
- Memory*
- Available memory
- mem.util*

Disco:
- *space*
- Disk*usage*
- vfs.fs.size*

Rede:
- *bits*
- *traffic*
- net.if*

Aplicações:
- *response*
- *latency*
- *time*
```

---

## 🎨 Personalizações Visuais

### Ajustar Tamanhos

Para modificar o range de tamanhos das bolhas, edite `class.widget.js`:

```javascript
_calculateBubbleSize(data, settings) {
    const minSize = 40;   // Menor bolha (padrão: 60)
    const maxSize = 250;  // Maior bolha (padrão: 180)
    // ...
}
```

### Ajustar Cores

Para modificar as cores, edite `widget.css`:

```css
/* Cor para valores positivos */
.bubble.positive {
    /* Ajuste os valores RGB */
}

/* Cor para valores negativos */
.bubble.negative {
    /* Ajuste os valores RGB */
}
```

---

## 📝 Notas Finais

- Experimente diferentes combinações de configurações
- Monitore a performance do navegador com muitas bolhas
- Use múltiplos widgets para diferentes aspectos do monitoramento
- Salve configurações que funcionam bem para reutilizar

---

**Precisa de mais exemplos?** Abra uma issue no repositório do projeto!

