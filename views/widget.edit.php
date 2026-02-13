<?php
/*
** Zabbix Bubble Stats Widget - Edit Form
**/

/**
 * @var CView $this
 * @var array $data
 */

$form = new CWidgetFormView($data);

// Tipo de dados
$form->addField(
	new CWidgetFieldRadioButtonListView($data['fields']['data_type'])
);

// Grupos de hosts
$form->addField(
	new CWidgetFieldMultiSelectGroupView($data['fields']['groupids'])
);

// Hosts
$form->addField(
	new CWidgetFieldMultiSelectHostView($data['fields']['hostids'])
);

// Override host (para dashboards de template)
if (array_key_exists('override_hostid', $data['fields'])) {
	$form->addField(
		new CWidgetFieldMultiSelectOverrideHostView($data['fields']['override_hostid'])
	);
}

// Padrões de items
$form->addField(
	new CWidgetFieldPatternSelectItemView($data['fields']['items'])
);

// Tipo de cálculo
$form->addField(
	new CWidgetFieldSelectView($data['fields']['calc_type'])
);

// Valor de threshold
$form->addField(
	new CWidgetFieldTextBoxView($data['fields']['threshold_value'])
);

// Mostrar problemas suprimidos
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['show_suppressed'])
);

// Mostrar apenas não reconhecidos
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['show_unacknowledged'])
);

// Tamanho da bolha baseado em
$form->addField(
	new CWidgetFieldSelectView($data['fields']['bubble_size_by'])
);

// Número máximo de bolhas
$form->addField(
	new CWidgetFieldIntegerBoxView($data['fields']['max_bubbles'])
);

// Habilitar física
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['enable_physics'])
);

// Mostrar tooltip
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['show_tooltip'])
);

// Mostrar gráfico no tooltip
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['show_chart_in_tooltip'])
);

// Mostrar legenda
$form->addField(
	new CWidgetFieldCheckBoxView($data['fields']['show_legend'])
);

$form->show();
?>

