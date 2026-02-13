<?php declare(strict_types = 0);

namespace Modules\BubbleStatsWidget\Includes;

use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};
use Zabbix\Widgets\Fields\{
	CWidgetFieldCheckBox,
	CWidgetFieldIntegerBox,
	CWidgetFieldMultiSelectGroup,
	CWidgetFieldMultiSelectHost,
	CWidgetFieldMultiSelectOverrideHost,
	CWidgetFieldPatternSelectItem,
	CWidgetFieldRadioButtonList,
	CWidgetFieldSelect,
	CWidgetFieldTextBox
};

use CWidgetsData;

/**
 * Bubble Stats widget form.
 */
class WidgetForm extends CWidgetForm {

	// Tipos de dados
	public const DATA_TYPE_METRICS = 0;
	public const DATA_TYPE_PROBLEMS = 1;

	// Tipos de cálculo de porcentagem para métricas
	public const CALC_TYPE_VALUE_OF_MAX = 0;      // Valor atual / Valor máximo
	public const CALC_TYPE_CHANGE_PERCENT = 1;    // Mudança percentual em relação ao período anterior
	public const CALC_TYPE_THRESHOLD_PERCENT = 2; // Porcentagem em relação a um threshold definido

	// Tamanho da bolha baseado em
	public const SIZE_BY_PERCENTAGE = 0;
	public const SIZE_BY_ABSOLUTE_VALUE = 1;
	public const SIZE_BY_SEVERITY = 2;

	// Severidade de problemas
	public const SEVERITY_NOT_CLASSIFIED = 0;
	public const SEVERITY_INFORMATION = 1;
	public const SEVERITY_WARNING = 2;
	public const SEVERITY_AVERAGE = 3;
	public const SEVERITY_HIGH = 4;
	public const SEVERITY_DISASTER = 5;

	public function addFields(): self {
		$this->addField(
			(new CWidgetFieldRadioButtonList('data_type', _('Data Type'), [
				self::DATA_TYPE_METRICS => _('Metrics (Items)'),
				self::DATA_TYPE_PROBLEMS => _('Problems')
			]))
				->setDefault(self::DATA_TYPE_METRICS)
				->setFlags(CWidgetField::FLAG_NOT_EMPTY)
		);

		// Campos para seleção de hosts e grupos
		$this->addField(
			new CWidgetFieldMultiSelectGroup('groupids', _('Host groups'))
		)
		->addField(
			new CWidgetFieldMultiSelectHost('hostids', _('Hosts'))
		);

		// Override para dashboards de template
		if ($this->isTemplateDashboard()) {
			$this->addField(
				(new CWidgetFieldMultiSelectOverrideHost('override_hostid', _('Host')))
			);
		}

		// Campos para métricas - removido FLAG_LABEL_ASTERISK para permitir salvar sem items
		$this->addField(
			new CWidgetFieldPatternSelectItem('items', _('Item patterns'))
		);

		$this->addField(
			(new CWidgetFieldSelect('calc_type', _('Percentage Calculation'), [
				self::CALC_TYPE_VALUE_OF_MAX => _('Current value / Maximum value'),
				self::CALC_TYPE_CHANGE_PERCENT => _('Percentage change from previous period'),
				self::CALC_TYPE_THRESHOLD_PERCENT => _('Percentage of threshold')
			]))
				->setDefault(self::CALC_TYPE_VALUE_OF_MAX)
		);

		$this->addField(
			(new CWidgetFieldTextBox('threshold_value', _('Threshold Value')))
				->setDefault('100')
		);

		// Campos para problemas
		$this->addField(
			(new CWidgetFieldCheckBox('show_suppressed', _('Show suppressed problems')))
				->setDefault(0)
		);

		$this->addField(
			(new CWidgetFieldCheckBox('show_unacknowledged', _('Show only unacknowledged')))
				->setDefault(0)
		);

		// Configurações de visualização
		$this->addField(
			(new CWidgetFieldSelect('bubble_size_by', _('Bubble Size Based On'), [
				self::SIZE_BY_PERCENTAGE => _('Percentage Value'),
				self::SIZE_BY_ABSOLUTE_VALUE => _('Absolute Value'),
				self::SIZE_BY_SEVERITY => _('Problem Severity')
			]))
				->setDefault(self::SIZE_BY_PERCENTAGE)
		);

		// max_bubbles - removido FLAG_NOT_EMPTY pois já tem valor padrão
		$this->addField(
			(new CWidgetFieldIntegerBox('max_bubbles', _('Maximum Number of Bubbles')))
				->setDefault(50)
		);

		$this->addField(
			(new CWidgetFieldCheckBox('enable_physics', _('Enable Physics Simulation')))
				->setDefault(1)
		);

		$this->addField(
			(new CWidgetFieldCheckBox('show_tooltip', _('Show Tooltip on Hover')))
				->setDefault(1)
		);

		$this->addField(
			(new CWidgetFieldCheckBox('show_chart_in_tooltip', _('Show Chart in Tooltip')))
				->setDefault(0)
		);

		$this->addField(
			(new CWidgetFieldCheckBox('show_legend', _('Show Legend')))
				->setDefault(1)
		);

		return $this;
	}
}
