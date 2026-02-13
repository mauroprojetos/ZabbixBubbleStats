# Guia de Simulação Downdetector para Zabbix Bubble Stats

Este guia explica como usar o template de simulação incluído para gerar dados fictícios de serviços populares (TIM, Vivo, Bancos, Redes Sociais) e testar o Bubble Stats Widget.

## 1. Importar o Template

1. Acesse a interface web do Zabbix.
2. Vá para **Configuration** > **Templates**.
3. Clique em **Import** (canto superior direito).
4. Selecione o arquivo `templates/zabbix_simulation_template.xml` deste módulo.
5. Marque a opção **Create new** para Templates e Groups.
6. Clique em **Import**.

## 2. Imagens Incluídas

O template já vem pré-configurado com uma lista de todos os serviços que tiveram imagens detectadas na pasta `modules/ZabbixBubbleStats/assets/images/`.

São mais de 150 serviços mapeados automaticamente, incluindo bancos (Nubank, Inter), operadoras (Vivo, Tim), redes sociais e games.

## 3. Criar e Configurar o Host

1. Vá para **Configuration** > **Hosts**.
2. Clique em **Create host**.
3. Preencha os dados:
    *   **Host name**: `Downdetector Simulation`
    *   **Groups**: `Templates/Simulation`
    *   **Interfaces**: Adicione uma interface do tipo **Agent** (IP: 127.0.0.1, Porta: 10050).
4. Na aba **Templates**, linke o template: `Template_Bubble_Stats_Simulation_Downdetector`.
5. Clique em **Add**.

## 4. Verificar a Geração de Dados

1. Aguarde alguns instantes ou force a execução do Discovery.
2. O Zabbix irá criar itens para todos os serviços mapeados no XML.
3. Se você adicionar uma nova imagem, **será necessário atualizar o XML do template manualmennte** ou solicitar uma nova geração.

## 5. Configurar o Widget Bubble Stats

1. No seu Dashboard, adicione ou edite o widget **Bubble Stats**.
2. No campo **Host**, selecione `Downdetector Simulation`.
3. No campo **Item pattern**, coloque `*` ou deixe em branco para pegar todos.
4. **Data Type**: Metrics.
5. **Threshold**: Defina um valor como `50` ou `100`.
    *   Valores baixos (0-10) ficarão Verdes.
    *   Valores médios (10-50) ficarão Amarelos.
    *   Valores altos (>50) ficarão Vermelhos.
6. Salve o widget.

Você verá as bolhas representando os serviços, mudando de tamanho e cor conforme os valores aleatórios gerados!

Você verá as bolhas representando os serviços, mudando de tamanho e cor conforme os valores aleatórios gerados!
