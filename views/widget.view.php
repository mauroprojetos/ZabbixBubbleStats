<?php declare(strict_types = 0);
/*
** Zabbix Bubble Stats Widget - View
**/

/**
 * @var CView $this
 * @var array $data
 */

// Seguindo o padrão do Echarts-Zabbix - estrutura simples que não interfere com o header
$view = new CWidgetView($data);

// Container para as bolhas - estrutura simples sem estilos inline que possam interferir
$container = (new CDiv())
	->setId('bubble-container-' . ($data['uniqueid'] ?? uniqid()))
	->addClass('bubble-stats-container');

$widget_div = (new CDiv())
	->addClass('bubble-stats-widget')
	->addItem($container);

$view->addItem($widget_div);

// Passar dados para o JavaScript via setVar
if (isset($data['bubbles_data'])) {
	$view->setVar('bubbles_data', $data['bubbles_data']);
}
if (isset($data['stats'])) {
	$view->setVar('stats', $data['stats']);
}
if (isset($data['fields_values'])) {
	$view->setVar('fields_values', $data['fields_values']);
}
if (isset($data['data_type'])) {
	$view->setVar('data_type', $data['data_type']);
}
if (isset($data['debug'])) {
	$view->setVar('debug', $data['debug']);
}

$view->show();
