# Estratégia de Imagens e Ícones no Zabbix Bubble Stats Widget

Este documento descreve como adicionar imagens e ícones aos itens exibidos no widget Bubble Stats.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estratégia de Busca](#estratégia-de-busca)
- [Formatos Suportados](#formatos-suportados)
- [Como Usar](#como-usar)
- [Exemplos Práticos](#exemplos-práticos)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O widget Bubble Stats suporta exibição de imagens/ícones dentro das bolhas para facilitar a identificação visual dos itens. As imagens são buscadas através de uma estratégia hierárquica que prioriza tags específicas e oferece fallbacks automáticos.

### Características

- ✅ Múltiplas fontes de imagens (item, host, padrões)
- ✅ Prioridade clara de busca
- ✅ Suporte a URLs, caminhos absolutos e relativos
- ✅ Fallback automático baseado em padrões de nome
- ✅ Validação e normalização de URLs

---

## 🔍 Estratégia de Busca

A busca de imagens segue uma ordem de prioridade específica:

### 1️⃣ Tags do Item (Prioridade Mais Alta)

O widget busca primeiro nas tags do próprio item, na seguinte ordem:

1. `bubble_icon` - Tag específica para ícones de bolhas
2. `bubble_image` - Tag específica para imagens de bolhas
3. `icon` - Tag genérica de ícone
4. `image` - Tag genérica de imagem
5. `img` - Tag abreviada de imagem

**A primeira tag encontrada com valor válido é utilizada.**

### 2️⃣ Tags do Host (Segunda Prioridade)

Se nenhuma imagem for encontrada nas tags do item, o widget busca nas tags do host:

1. `bubble_icon`
2. `bubble_image`
3. `icon`
4. `image`

**Útil para aplicar ícones padrão a todos os itens de um host.**

### 3️⃣ Padrões por Nome (Fallback Automático)

Se nenhuma tag for encontrada, o widget tenta identificar padrões no nome do item e mapeia para ícones padrão:

| Palavra-chave | Caminho do Ícone |
|---------------|------------------|
| `cpu` | `/assets/images/cpu.png` |
| `memory` | `/assets/images/memory.png` |
| `disk` | `/assets/images/disk.png` |
| `network` | `/assets/images/network.png` |
| `temperature` | `/assets/images/temperature.png` |
| `uptime` | `/assets/images/uptime.png` |

**A busca é case-insensitive e verifica se a palavra-chave está contida no nome do item.**

---

## 📁 Formatos Suportados

O widget suporta múltiplos formatos de referência de imagens:

### URLs Completas

```
https://example.com/icons/server.png
http://cdn.example.com/images/icon.svg
```

**Uso:** Para imagens hospedadas externamente ou em CDNs.

### Caminhos Absolutos

```
/assets/images/cpu.png
/var/www/zabbix/icons/server.svg
```

**Uso:** Para imagens no servidor Zabbix com caminho completo.

### Caminhos Relativos

```
assets/images/icon.png
images/server-icon.png
```

**Uso:** Caminhos relativos à raiz do Zabbix.

### Nomes de Arquivo Simples

```
cpu.png
server-icon.svg
icon.png
```

**Uso:** O widget assume que o arquivo está em `/assets/images/`.

**Exemplo:** `cpu.png` → `/assets/images/cpu.png`

---

## 🚀 Como Usar

### Método 1: Tags do Item (Recomendado)

Este é o método mais flexível e específico. Permite definir ícones diferentes para cada item.

#### Passo a Passo

1. No Zabbix, vá para **Configuration** → **Hosts** → Selecione um host
2. Clique em **Items** → Selecione o item desejado
3. Vá para a aba **Tags**
4. Adicione uma nova tag:
   - **Tag:** `bubble_icon` (ou `icon`, `image`, etc.)
   - **Value:** Caminho ou URL da imagem
5. Salve o item

#### Exemplos de Valores

```
# Nome de arquivo simples
cpu.png

# Caminho absoluto
/assets/images/server-icon.png

# URL completa
https://cdn.example.com/icons/disk.svg
```

### Método 2: Tags do Host

Útil quando você quer aplicar o mesmo ícone a todos os itens de um host.

#### Passo a Passo

1. No Zabbix, vá para **Configuration** → **Hosts**
2. Selecione o host desejado
3. Vá para a aba **Tags**
4. Adicione uma nova tag:
   - **Tag:** `bubble_icon` (ou `icon`, `image`)
   - **Value:** Caminho ou URL da imagem
5. Salve o host

**Nota:** Esta tag será aplicada a todos os itens do host que não tiverem suas próprias tags de imagem.

### Método 3: Padrões Automáticos

Não requer configuração! O widget detecta automaticamente palavras-chave no nome do item.

#### Como Funciona

Se o nome do item contém palavras como:
- "CPU" → Usa `/assets/images/cpu.png`
- "Memory" → Usa `/assets/images/memory.png`
- "Disk" → Usa `/assets/images/disk.png`
- etc.

**Exemplo:**
- Item: "CPU Usage" → Ícone automático: `cpu.png`
- Item: "Memory Utilization" → Ícone automático: `memory.png`

---

## 💡 Exemplos Práticos

### Exemplo 1: Ícone Específico por Item

**Cenário:** Você quer um ícone diferente para cada tipo de métrica.

**Solução:** Use tags do item.

```
Item: "CPU Usage"
Tag: bubble_icon = "cpu.png"
→ Resultado: /assets/images/cpu.png

Item: "Disk Space"
Tag: bubble_icon = "disk.png"
→ Resultado: /assets/images/disk.png

Item: "Network Traffic"
Tag: bubble_icon = "https://cdn.example.com/network.svg"
→ Resultado: https://cdn.example.com/network.svg
```

### Exemplo 2: Ícone Padrão por Host

**Cenário:** Todos os itens de um servidor devem usar o mesmo ícone.

**Solução:** Use tags do host.

```
Host: "Web Server 01"
Tag: bubble_icon = "server.png"
→ Todos os itens deste host usarão /assets/images/server.png
(Exceto aqueles que tiverem tags próprias)
```

### Exemplo 3: Fallback Automático

**Cenário:** Você não quer configurar tags manualmente.

**Solução:** Use nomes descritivos nos itens.

```
Item: "CPU Utilization"
→ Sem tags configuradas
→ Widget detecta "CPU" no nome
→ Usa automaticamente: /assets/images/cpu.png

Item: "Memory Usage"
→ Sem tags configuradas
→ Widget detecta "Memory" no nome
→ Usa automaticamente: /assets/images/memory.png
```

### Exemplo 4: Múltiplas Fontes Combinadas

**Cenário:** Alguns itens têm tags, outros não.

**Hierarquia de busca:**

```
Item: "CPU Usage" com tag bubble_icon = "custom-cpu.png"
→ Usa: /assets/images/custom-cpu.png (tag do item)

Item: "Disk Space" sem tags, mas host tem tag bubble_icon = "server.png"
→ Usa: /assets/images/server.png (tag do host)

Item: "Memory Usage" sem tags, host sem tags, mas nome contém "Memory"
→ Usa: /assets/images/memory.png (padrão automático)
```

---

## ✅ Boas Práticas

### 1. Use Tags Específicas

Prefira `bubble_icon` ou `bubble_image` em vez de `icon` genérico para evitar conflitos com outras funcionalidades do Zabbix.

### 2. Organize seus Ícones

Mantenha todos os ícones em uma pasta organizada:
```
/assets/images/bubbles/
  ├── cpu.png
  ├── memory.png
  ├── disk.png
  └── network.png
```

### 3. Use Formatos Adequados

- **PNG**: Para ícones com transparência
- **SVG**: Para ícones escaláveis (recomendado)
- **JPG**: Evite (não suporta transparência)

### 4. Tamanhos Recomendados

- **Tamanho ideal:** 64x64px ou 128x128px
- **Formato:** Quadrado (1:1) funciona melhor
- **Peso:** Mantenha arquivos leves (< 50KB)

### 5. Nomenclatura Consistente

Use nomes descritivos e consistentes:
```
✅ cpu.png
✅ memory.png
✅ disk-space.png
❌ icon1.png
❌ img.png
```

### 6. URLs Externas

Se usar URLs externas:
- Certifique-se de que são HTTPS
- Verifique se o servidor permite CORS
- Considere cache/CDN para performance

---

## 🔧 Troubleshooting

### Problema: Imagem não aparece

**Possíveis causas e soluções:**

1. **Tag não encontrada**
   - Verifique se a tag está escrita corretamente (case-insensitive)
   - Confirme que o valor da tag não está vazio

2. **Caminho incorreto**
   - Verifique se o arquivo existe no caminho especificado
   - Teste o caminho diretamente no navegador: `http://seu-zabbix/assets/images/icon.png`

3. **Permissões**
   - Verifique permissões de leitura do arquivo
   - Confirme que o servidor web tem acesso ao diretório

4. **Formato não suportado**
   - Use PNG, SVG ou JPG
   - Evite formatos exóticos

### Problema: Imagem errada aparece

**Solução:** Verifique a ordem de prioridade:
1. Tags do item têm prioridade sobre tags do host
2. Tags do host têm prioridade sobre padrões automáticos
3. Remova tags conflitantes se necessário

### Problema: Imagem muito grande/pequena

**Solução:** O tamanho é ajustado automaticamente baseado no tamanho da bolha. Se necessário:
- Use imagens com proporção 1:1
- Ajuste o tamanho da bolha no widget
- Considere usar SVG para melhor escalabilidade

### Problema: Imagem não carrega de URL externa

**Possíveis causas:**
- CORS não configurado no servidor externo
- URL incorreta ou inacessível
- Firewall bloqueando requisições

**Solução:**
- Teste a URL diretamente no navegador
- Verifique logs do servidor
- Considere hospedar a imagem localmente

---

## 📚 Referências

### Tags Suportadas

| Tag | Prioridade | Uso |
|-----|------------|-----|
| `bubble_icon` | Alta | Específica para ícones de bolhas |
| `bubble_image` | Alta | Específica para imagens de bolhas |
| `icon` | Média | Genérica para ícones |
| `image` | Média | Genérica para imagens |
| `img` | Baixa | Abreviação de imagem |

### Padrões Automáticos

| Palavra-chave | Ícone Padrão |
|---------------|--------------|
| cpu | `/assets/images/cpu.png` |
| memory | `/assets/images/memory.png` |
| disk | `/assets/images/disk.png` |
| network | `/assets/images/network.png` |
| temperature | `/assets/images/temperature.png` |
| uptime | `/assets/images/uptime.png` |

---

## 🎨 Customização Avançada

### Criar seus Próprios Padrões

Para adicionar novos padrões automáticos, edite o arquivo:
```
actions/WidgetView.php
```

Procure pelo método `findItemImage()` e adicione novos padrões no array `$image_patterns`:

```php
$image_patterns = [
    "cpu" => "/assets/images/cpu.png",
    "memory" => "/assets/images/memory.png",
    "seu-padrao" => "/assets/images/seu-icone.png", // Novo padrão
];
```

### Estilização CSS

As imagens podem ser estilizadas através do CSS:

```css
.bubble-image {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
```

Edite o arquivo `assets/css/widget.css` para personalizar.

---

## 📝 Notas Finais

- As imagens são redimensionadas automaticamente para caber dentro da bolha
- O tamanho da imagem é proporcional ao tamanho da bolha
- Imagens são exibidas acima do nome do item
- Se uma imagem não carregar, apenas o nome e valor são exibidos (sem erro)

---

**Última atualização:** 2024
**Versão do Widget:** 1.0+
