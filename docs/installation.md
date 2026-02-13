# Guia de Instalação - Zabbix Bubble Stats Widget

## Requisitos do Sistema

### Zabbix
- Zabbix Server 6.0 ou superior
- Zabbix Frontend 6.0 ou superior

### PHP
- PHP 7.4 ou superior
- Extensões PHP necessárias:
  - php-json
  - php-mbstring

### Navegador
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Instalação Passo a Passo

### 1. Download do Módulo

Clone ou baixe o repositório:

```bash
git clone https://github.com/seu-usuario/ZabbixBubbleStats.git
```

Ou baixe o arquivo ZIP e extraia.

### 2. Copiar para o Diretório de Módulos

#### Para instalações padrão do Zabbix:

```bash
# Copiar o módulo
sudo cp -r ZabbixBubbleStats /usr/share/zabbix/modules/

# Ajustar permissões
sudo chown -R www-data:www-data /usr/share/zabbix/modules/ZabbixBubbleStats
sudo chmod -R 755 /usr/share/zabbix/modules/ZabbixBubbleStats
```

#### Para instalações via Docker:

```bash
# Copiar para o volume de módulos
docker cp ZabbixBubbleStats zabbix-web:/usr/share/zabbix/modules/

# Ajustar permissões dentro do container
docker exec -it zabbix-web chown -R www-data:www-data /usr/share/zabbix/modules/ZabbixBubbleStats
```

### 3. Verificar a Estrutura de Arquivos

Certifique-se de que a estrutura está correta:

```
/usr/share/zabbix/modules/ZabbixBubbleStats/
├── manifest.json
├── Widget.php
├── LICENSE
├── README.md
├── INSTALL.md
├── includes/
│   └── WidgetForm.php
├── actions/
│   └── WidgetView.php
├── views/
│   ├── widget.view.php
│   └── widget.edit.php
└── assets/
    ├── css/
    │   └── widget.css
    └── js/
        └── class.widget.js
```

### 4. Ativar o Módulo no Zabbix

1. **Acesse a interface web do Zabbix**
   - URL: `http://seu-servidor-zabbix/`

2. **Navegue até Módulos**
   - Administration → General → Modules

3. **Escaneie o diretório**
   - Clique no botão **"Scan directory"**
   - O Zabbix irá procurar por novos módulos

4. **Ative o módulo**
   - Encontre **"Bubble Stats Widget"** na lista
   - Clique no botão **"Enable"** (ou **"Disabled"** para ativar)
   - Status deve mudar para **"Enabled"**

5. **Verifique a ativação**
   - O módulo deve aparecer com status verde "Enabled"
   - Versão: 1.0
   - Namespace: BubbleStatsWidget

### 5. Adicionar o Widget ao Dashboard

1. **Acesse ou crie um Dashboard**
   - Monitoring → Dashboards
   - Selecione um dashboard existente ou crie um novo

2. **Entre no modo de edição**
   - Clique em **"Edit dashboard"**

3. **Adicione o widget**
   - Clique em **"Add widget"**
   - Na lista de widgets, procure por **"Bubble Stats Widget"**
   - Clique para selecionar

4. **Configure o widget**
   - Defina o tipo de dados (Metrics ou Problems)
   - Selecione hosts ou grupos de hosts
   - Configure os padrões de items (para métricas)
   - Ajuste as opções de visualização
   - Clique em **"Add"**

5. **Salve o dashboard**
   - Clique em **"Save changes"**

## Verificação da Instalação

### Teste 1: Widget Aparece na Lista

1. Ao adicionar um widget, "Bubble Stats Widget" deve aparecer na lista
2. Se não aparecer, verifique:
   - Módulo está ativado
   - Permissões dos arquivos
   - Logs do Apache/Nginx

### Teste 2: Widget Carrega Corretamente

1. Adicione o widget ao dashboard
2. Configure com hosts e items existentes
3. Verifique se as bolhas aparecem
4. Teste interações (hover, drag)

### Teste 3: Dados São Exibidos

1. Configure para exibir métricas de CPU
2. Verifique se os valores estão corretos
3. Compare com outros widgets

## Troubleshooting

### Módulo não aparece na lista

**Problema**: Após escanear, o módulo não aparece

**Soluções**:
```bash
# Verificar permissões
ls -la /usr/share/zabbix/modules/ZabbixBubbleStats/

# Verificar manifest.json
cat /usr/share/zabbix/modules/ZabbixBubbleStats/manifest.json

# Verificar logs do Apache
sudo tail -f /var/log/apache2/error.log

# Verificar logs do Zabbix
sudo tail -f /var/log/zabbix/zabbix_server.log
```

### Erro ao ativar o módulo

**Problema**: Erro ao clicar em "Enable"

**Soluções**:
1. Verificar sintaxe do manifest.json
2. Verificar se todos os arquivos PHP estão presentes
3. Verificar logs de erro do PHP

### Widget não carrega dados

**Problema**: Widget aparece vazio ou com erro

**Soluções**:
1. Verificar se há hosts/items configurados
2. Verificar permissões de API
3. Abrir console do navegador (F12) e verificar erros JavaScript
4. Verificar se o CSS foi carregado

### Erro de permissão

**Problema**: Erro 403 ou permissão negada

**Soluções**:
```bash
# Corrigir permissões
sudo chown -R www-data:www-data /usr/share/zabbix/modules/ZabbixBubbleStats
sudo chmod -R 755 /usr/share/zabbix/modules/ZabbixBubbleStats

# Para SELinux (se aplicável)
sudo chcon -R -t httpd_sys_content_t /usr/share/zabbix/modules/ZabbixBubbleStats
```

## Desinstalação

### Remover o módulo

1. **Desative o módulo no Zabbix**
   - Administration → General → Modules
   - Encontre "Bubble Stats Widget"
   - Clique em "Disable"

2. **Remova os arquivos**
```bash
sudo rm -rf /usr/share/zabbix/modules/ZabbixBubbleStats
```

3. **Limpe o cache do navegador**
   - Pressione Ctrl+Shift+Delete
   - Limpe cache e cookies

## Atualização

### Para atualizar para uma nova versão:

1. **Faça backup do módulo atual**
```bash
sudo cp -r /usr/share/zabbix/modules/ZabbixBubbleStats /tmp/ZabbixBubbleStats.backup
```

2. **Desative o módulo no Zabbix**

3. **Substitua os arquivos**
```bash
sudo rm -rf /usr/share/zabbix/modules/ZabbixBubbleStats
sudo cp -r ZabbixBubbleStats-nova-versao /usr/share/zabbix/modules/ZabbixBubbleStats
sudo chown -R www-data:www-data /usr/share/zabbix/modules/ZabbixBubbleStats
```

4. **Reative o módulo**
   - Administration → General → Modules
   - Scan directory
   - Enable

5. **Limpe o cache do navegador**

## Suporte

Para problemas durante a instalação:

1. Verifique os logs do sistema
2. Consulte a documentação do Zabbix
3. Abra uma issue no repositório do projeto
4. Entre em contato com o suporte

## Próximos Passos

Após a instalação bem-sucedida:

1. Leia o [README.md](README.md) para entender os recursos
2. Experimente diferentes configurações
3. Crie dashboards personalizados
4. Compartilhe feedback e sugestões

---

**Última atualização**: 2025
**Versão do documento**: 1.0

