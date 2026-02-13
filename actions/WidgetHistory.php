<?php declare(strict_types = 0);
/*
** Zabbix Bubble Stats Widget - History Controller
** Busca histórico de itens para exibir em gráficos no tooltip
*/

namespace Modules\BubbleStatsWidget\Actions;

use CController;
use CControllerResponseData;
use API;

class WidgetHistory extends CController {

	protected function init(): void {
		$this->disableCsrfValidation();
	}

	protected function checkInput(): bool {
		$fields = [
			'itemid' => 'required|string',
			'time_from' => 'int32',
			'time_to' => 'int32',
			'limit' => 'int32'
		];

		$ret = $this->validateInput($fields);
		return $ret;
	}

	protected function checkPermissions(): bool {
		// Permitir acesso para qualquer usuário autenticado
		// Verificar se o usuário está logado usando getUserType()
		try {
			$user_type = $this->getUserType();
			return $user_type >= USER_TYPE_ZABBIX_USER;
		} catch (\Exception $e) {
			// Se houver erro ao verificar permissões, retornar false
			// O doAction() será chamado mesmo assim para retornar JSON de erro
			return false;
		}
	}

	protected function doAction(): void {
		// Limpar qualquer output buffer anterior
		while (ob_get_level()) {
			ob_end_clean();
		}
		
		// Iniciar output buffering para garantir que não há output antes do JSON
		ob_start();
		
		// Definir header JSON ANTES de qualquer output ou verificação
		// Isso garante que mesmo em caso de erro, retornamos JSON
		header('Content-Type: application/json; charset=UTF-8');
		header('Cache-Control: no-cache, must-revalidate');
		header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
		
		// Verificar permissões manualmente aqui também para garantir retorno JSON
		try {
			$user_type = $this->getUserType();
			if ($user_type < USER_TYPE_ZABBIX_USER) {
				ob_end_clean();
				echo json_encode([
					'success' => false,
					'error' => 'Permissão negada. Usuário não autenticado ou sem permissões suficientes.'
				], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
				exit;
			}
		} catch (\Exception $e) {
			ob_end_clean();
			echo json_encode([
				'success' => false,
				'error' => 'Erro ao verificar permissões: ' . $e->getMessage()
			], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		}
		
		// Verificar se itemid foi fornecido
		if (!$this->hasInput('itemid')) {
			ob_end_clean();
			echo json_encode([
				'success' => false,
				'error' => 'Item ID is required'
			], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		}
		
		$itemid = $this->getInput('itemid');
		$time_from = $this->getInput('time_from', time() - 3600); // Última hora por padrão
		$time_to = $this->getInput('time_to', time());
		$limit = $this->getInput('limit', 100); // Limitar a 100 pontos por padrão

		try {
			// Converter itemid para inteiro se necessário
			if (!is_numeric($itemid)) {
				throw new \Exception('Invalid itemid format');
			}
			$itemid = (int)$itemid;
			
			// Primeiro, buscar informações do item
			$item_info = API::Item()->get([
				'itemids' => [$itemid],
				'output' => ['name', 'units', 'value_type'],
				'limit' => 1
			]);
			
			if (empty($item_info)) {
				throw new \Exception('Item not found');
			}
			
			$item = $item_info[0];
			$value_type = isset($item['value_type']) ? (int)$item['value_type'] : 0;
			
			// Buscar histórico do item
			// É necessário especificar o tipo de histórico baseado no value_type
			// 0 = float (history), 1 = character (history_str), 2 = log (history_log), 
			// 3 = integer (history_uint), 4 = text (history_text)
			$history_params = [
				'itemids' => [$itemid],
				'history' => $value_type, // Especificar o tipo de histórico
				'time_from' => $time_from,
				'time_till' => $time_to, // API History usa time_till, não time_to
				'output' => ['clock', 'value'],
				'sortfield' => 'clock',
				'sortorder' => 'ASC',
				'limit' => min($limit, 500)
			];
			
			$history = API::History()->get($history_params);
			
			// Formatar dados para o gráfico
			$data = [];
			if (is_array($history)) {
				foreach ($history as $point) {
					if (!isset($point['value']) || !isset($point['clock'])) {
						continue;
					}
					
					$value = $point['value'];
					$clock = $point['clock'];
					
					// Para tipos numéricos (0, 3), converter para float
					// Para outros tipos, tentar converter se possível
					$numeric_value = null;
					if (in_array($value_type, [0, 3])) {
						// Tipos numéricos
						$numeric_value = is_numeric($value) ? (float)$value : null;
					} else {
						// Outros tipos - tentar converter se for número
						if (is_numeric($value)) {
							$numeric_value = (float)$value;
						}
					}
					
					if ($numeric_value !== null) {
						$data[] = [
							'time' => (int)$clock,
							'value' => $numeric_value
						];
					}
				}
			}
			
			// Se não encontrou dados em history, tentar buscar trends (para itens numéricos)
			if (empty($data) && in_array($value_type, [0, 3])) {
				// Tentar buscar trends - dados agregados para períodos maiores
				try {
					$trends = API::Trend()->get([
						'itemids' => [$itemid],
						'time_from' => $time_from,
						'time_to' => $time_to,
						'output' => ['clock', 'value_min', 'value_avg', 'value_max'],
						'sortfield' => 'clock',
						'sortorder' => 'ASC',
						'limit' => min($limit, 500)
					]);
					
					if (is_array($trends) && !empty($trends)) {
						foreach ($trends as $point) {
							if (!isset($point['clock'])) {
								continue;
							}
							
							// Usar valor médio dos trends
							$value = isset($point['value_avg']) ? $point['value_avg'] : 
							         (isset($point['value_min']) ? $point['value_min'] : 
							         (isset($point['value_max']) ? $point['value_max'] : null));
							
							if ($value !== null && is_numeric($value)) {
								$data[] = [
									'time' => (int)$point['clock'],
									'value' => (float)$value
								];
							}
						}
					}
				} catch (\Exception $e) {
					// Se trends também falhar, continuar sem dados
				}
			}
			
			// Se ainda não encontrou dados, tentar período maior (últimas 24 horas)
			if (empty($data) && ($time_to - $time_from) < 86400) {
				$time_from_extended = $time_to - 86400;
				$history_extended = API::History()->get([
					'itemids' => [$itemid],
					'history' => $value_type,
					'time_from' => $time_from_extended,
					'time_till' => $time_to, // API History usa time_till, não time_to
					'output' => ['clock', 'value'],
					'sortfield' => 'clock',
					'sortorder' => 'ASC',
					'limit' => min($limit, 500)
				]);
				
				if (is_array($history_extended)) {
					foreach ($history_extended as $point) {
						if (!isset($point['value']) || !isset($point['clock'])) {
							continue;
						}
						
						$value = $point['value'];
						$clock = $point['clock'];
						
						$numeric_value = null;
						if (in_array($value_type, [0, 3])) {
							$numeric_value = is_numeric($value) ? (float)$value : null;
						} else {
							if (is_numeric($value)) {
								$numeric_value = (float)$value;
							}
						}
						
						if ($numeric_value !== null) {
							$data[] = [
								'time' => (int)$clock,
								'value' => $numeric_value
							];
						}
					}
				}
			}
			
			// Ordenar por tempo (já deve estar ordenado, mas garantir)
			usort($data, function($a, $b) {
				return $a['time'] - $b['time'];
			});

			// Usar informações do item já buscadas
			$units = isset($item['units']) ? $item['units'] : '';
			$item_name = isset($item['name']) ? $item['name'] : '';

			$response_data = [
				'success' => true,
				'data' => $data,
				'units' => $units,
				'item_name' => $item_name,
				'count' => count($data),
				'debug' => [
					'itemid' => $itemid,
					'value_type' => $value_type,
					'history_count' => is_array($history) ? count($history) : 0,
					'data_count' => count($data),
					'time_from' => $time_from,
					'time_to' => $time_to
				]
			];
			
			// Limpar buffer e retornar JSON diretamente
			ob_end_clean();
			echo json_encode($response_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		} catch (\Exception $e) {
			ob_end_clean();
			$error_data = [
				'success' => false,
				'error' => $e->getMessage()
			];
			echo json_encode($error_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		} catch (\Throwable $e) {
			ob_end_clean();
			$error_data = [
				'success' => false,
				'error' => 'Unexpected error: ' . $e->getMessage()
			];
			echo json_encode($error_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		}
	}
}
