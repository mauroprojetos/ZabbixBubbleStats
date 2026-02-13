# 🚀 Guia Rápido - Zabbix Bubble Stats Widget

Este guia vai te ajudar a ter o widget funcionando em **5 minutos**!

## ⚡ Instalação Rápida

### Passo 1: Copiar Arquivos (1 min)

```bash
# Copiar módulo
sudo cp -r ZabbixBubbleStats /usr/share/zabbix/modules/

# Ajustar permissões
sudo chown -R www-data:www-data /usr/share/zabbix/modules/ZabbixBubbleStats
```

### Passo 2: Ativar no Zabbix (1 min)

1. Acesse: **Administration → General → Modules**
2. Clique em **"Scan directory"**
3. Encontre **"Bubble Stats Widget"**
4. Clique em **"Enable"**

✅ Módulo ativado!

## 🎯 Primeira Configuração (3 min)

### Exemplo 1: Monitorar CPU

1. **Adicione o widget ao dashboard**
   - Vá para um dashboard
   - **Edit dashboard** → **Add widget**
   - Selecione **"Bubble Stats Widget"**

2. **Configure**:
   ```
   Nome: CPU Usage
   Tipo de Dados: Metrics (Items)
   Host groups: [Selecione seus servidores]
   Item patterns: CPU*
   Cálculo: Current value / Maximum value
   Tamanho da Bolha: Percentage Value
   Max Bubbles: 30
   ```

3. **Salve**
   - Clique em **"Add"**
   - Clique em **"Save changes"**

🎉 Pronto! Você verá bolhas representando o uso de CPU!

---

## 📊 Configurações Mais Usadas

### Para Métricas

#### CPU
```
Item patterns: CPU*, *cpu.util*
Cálculo: Current value / Maximum value
```

#### Memória
```
Item patterns: Memory*, *memory*
Cálculo: Percentage of threshold
Threshold: 80
```

#### Disco
```
Item patterns: *space*, *disk*
Cálculo: Current value / Maximum value
```

#### Rede
```
Item patterns: *bits*, *traffic*
Cálculo: Percentage change from previous period
```

### Para Problemas

#### Todos os Problemas
```
Tipo de Dados: Problems
Host groups: [Seus grupos]
Tamanho: Problem Severity
```

#### Apenas Críticos
```
Tipo de Dados: Problems
Show only unacknowledged: Yes
Tamanho: Problem Severity
```

---

## 🎨 Personalizações Rápidas

### Desabilitar Física (para melhor performance)
```
Enable Physics Simulation: No
```

### Aumentar Número de Bolhas
```
Maximum Number of Bubbles: 100
```

### Ocultar Estatísticas
```
Show Legend: No
```

---

## 💡 Dicas Rápidas

### ✅ Faça
- Use filtros específicos de items
- Comece com 30-50 bolhas
- Teste diferentes tipos de cálculo
- Use tooltips para ver detalhes

### ❌ Evite
- Mais de 100 bolhas com física ativada
- Padrões muito amplos (como apenas `*`)
- Muitos widgets no mesmo dashboard

---

## 🐛 Problemas Comuns

### Bolhas não aparecem
**Solução**: Verifique se há dados nos filtros configurados

### Widget está lento
**Solução**: Reduza o número de bolhas ou desative a física

### Cores estranhas
**Solução**: Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 📚 Próximos Passos

Agora que você tem o básico funcionando:

1. 📖 Leia o [README.md](README.md) completo
2. 🎯 Veja os [EXAMPLES.md](EXAMPLES.md) com 13 exemplos
3. 🔧 Consulte o [INSTALL.md](INSTALL.md) para detalhes
4. 💬 Compartilhe feedback!

---

## 🆘 Precisa de Ajuda?

- 📖 Documentação completa: [README.md](README.md)
- 💡 Exemplos práticos: [EXAMPLES.md](EXAMPLES.md)
- 🔧 Instalação detalhada: [INSTALL.md](INSTALL.md)
- 🐛 Reportar bugs: Abra uma issue

---

**Tempo total**: ~5 minutos ⏱️

**Dificuldade**: Fácil 🟢

**Resultado**: Dashboard visual e interativo! 🎉

