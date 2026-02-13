<?php declare(strict_types = 0);

namespace Modules\BubbleStatsWidget\Actions;

use API,
	CItemHelper,
	CControllerDashboardWidgetView,
	CControllerResponseData,
	Manager;
use Modules\BubbleStatsWidget\Includes\WidgetForm;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$data_type = $this->fields_values["data_type"] ?? WidgetForm::DATA_TYPE_METRICS;
		
		if ($data_type == WidgetForm::DATA_TYPE_METRICS) {
			$bubbles_data = $this->getMetricsData();
		} else {
			$bubbles_data = $this->getProblemsData();
		}

		$stats = $this->calculateStats($bubbles_data);

		$output = [
			"name" => $this->getInput("name", $this->widget->getName()),
			"body" => $this->getInput("body", ""), // Suporte para propriedade body
			"bubbles_data" => $bubbles_data,
			"stats" => $stats,
			"fields_values" => $this->fields_values ?? [],
			"data_type" => $data_type,
			"debug" => [
				"has_filters" => $this->hasFilters(),
				"filters_applied" => $this->getAppliedFilters(),
				"items_found" => count($bubbles_data)
			],
			"user" => [
				"debug_mode" => $this->getDebugMode()
			]
		];

		$this->setResponse(new CControllerResponseData($output));
	}

	private function hasFilters(): bool {
		if ($this->isTemplateDashboard() && !empty($this->fields_values["override_hostid"])) {
			return true;
		}
		if (!empty($this->fields_values["groupids"])) {
			return true;
		}
		if (!empty($this->fields_values["hostids"])) {
			return true;
		}
		if (!empty($this->fields_values["items"])) {
			return true;
		}
		return false;
	}

	private function getAppliedFilters(): array {
		$filters = [];
		if (!empty($this->fields_values["groupids"])) {
			$filters["groupids"] = $this->fields_values["groupids"];
		}
		if (!empty($this->fields_values["hostids"])) {
			$filters["hostids"] = $this->fields_values["hostids"];
		}
		if (!empty($this->fields_values["items"])) {
			$filters["items"] = $this->fields_values["items"];
		}
		return $filters;
	}

	private function getMetricsData(): array {
		$options = [
			"output" => ["itemid", "name", "lastvalue", "lastclock", "units", "value_type", "history", "trends"],
			"webitems" => true,
			"preservekeys" => true,
			"selectHosts" => ["name", "hostid", "tags"], // Incluir tags do host para busca de imagens
			"selectTags" => ["tag", "value"], // Buscar tags do item para suporte a imagens
			"monitored" => true
		];

		$has_filters = false;

		if ($this->isTemplateDashboard() && !empty($this->fields_values["override_hostid"])) {
			$options["hostids"] = $this->fields_values["override_hostid"];
			$has_filters = true;
		} else {
			if (!empty($this->fields_values["groupids"])) {
				$options["groupids"] = $this->fields_values["groupids"];
				$has_filters = true;
			}
			if (!empty($this->fields_values["hostids"])) {
				$options["hostids"] = $this->fields_values["hostids"];
				$has_filters = true;
			}
		}

		if (!empty($this->fields_values["items"])) {
			$patterns = [];
			foreach ($this->fields_values["items"] as $pattern) {
				$cleanPattern = preg_replace("/^\*:\s*/", "", $pattern);
				if (!empty($cleanPattern)) {
					$patterns[] = $cleanPattern;
				}
			}
			if (!empty($patterns)) {
				$options["search"] = ["name" => $patterns];
				$options["searchByAny"] = true;
				$options["searchWildcardsEnabled"] = true;
				$has_filters = true;
			}
		}

		if (!$has_filters) {
			return [];
		}

		$db_items = API::Item()->get($options);
		$bubbles = [];
		$max_bubbles = intval($this->fields_values["max_bubbles"] ?? 50);
		$calc_type = intval($this->fields_values["calc_type"] ?? WidgetForm::CALC_TYPE_VALUE_OF_MAX);
		$threshold = floatval($this->fields_values["threshold_value"] ?? 100);

		if ($db_items && count($db_items) > 0) {
			// Coletar IDs dos itens para buscar problemas relacionados
			$itemids = array_keys($db_items);
			
			// Buscar problemas recentes para estes itens
			$problems = API::Problem()->get([
				"output" => ["eventid", "objectid", "severity"],
				"objectids" => $itemids,
				"recent" => true, // Incluir problemas resolvidos recentemente também? Ou apenas ativos? 'recent' inclui ambos.
				"suppressed" => false // Não mostrar problemas suprimidos por padrão
			]);
			
			// Mapear problemas por item ID (pegando a maior severidade)
			$item_severity = [];
			if ($problems) {
				foreach ($problems as $problem) {
					$itemid = $problem["objectid"];
					$severity = intval($problem["severity"]);
					
					if (!isset($item_severity[$itemid]) || $severity > $item_severity[$itemid]) {
						$item_severity[$itemid] = $severity;
					}
				}
			}

			$count = 0;
			foreach ($db_items as $itemid => $item) {
				if ($count >= $max_bubbles) break;

				$value = $item["lastvalue"] ?? null;
				if ($value === null || $value === "") continue;

				$numeric_value = $this->parseNumericValue($value);
				if ($numeric_value === null) continue;

				// Usar o valor direto do item, sem calcular porcentagem
				// O valor já será formatado no frontend conforme necessário

				$host_name = "Unknown";
				if (!empty($item["hosts"]) && is_array($item["hosts"]) && count($item["hosts"]) > 0) {
					$host_name = $item["hosts"][0]["name"] ?? "Unknown";
				}

				// Buscar imagem usando estratégia melhorada
				$image_url = $this->findItemImage($item);
				
				// Determinar severidade do item (se houver problema ativo)
				$severity = $item_severity[$itemid] ?? 0;

				$bubbles[] = [
					"id" => (string)$itemid,
					"name" => $item["name"] ?? "Unknown Item",
					"host" => $host_name,
					"value" => $numeric_value,
					"percentage" => $numeric_value, // Usar o valor real em vez de porcentagem
					"units" => $item["units"] ?? "",
					"lastclock" => $item["lastclock"] ?? 0,
					"type" => "metric",
					"image" => $image_url, // Adicionar imagem se encontrada
					"severity" => $severity // Adicionar severidade para override de cor
				];

				$count++;
			}
		}

		return $bubbles;
	}

	private function getProblemsData(): array {
		$options = [
			"output" => ["eventid", "objectid", "name", "severity", "clock", "acknowledged"],
			"recent" => true,
			"suppressed" => $this->fields_values["show_suppressed"] ?? false,
			"preservekeys" => true,
			"selectHosts" => ["name", "hostid"],
			"selectTriggers" => ["description", "priority"]
		];

		$has_filters = false;

		if ($this->isTemplateDashboard() && !empty($this->fields_values["override_hostid"])) {
			$options["hostids"] = $this->fields_values["override_hostid"];
			$has_filters = true;
		} else {
			if (!empty($this->fields_values["groupids"])) {
				$options["groupids"] = $this->fields_values["groupids"];
				$has_filters = true;
			}
			if (!empty($this->fields_values["hostids"])) {
				$options["hostids"] = $this->fields_values["hostids"];
				$has_filters = true;
			}
		}

		if (!$has_filters) {
			return [];
		}

		if (!empty($this->fields_values["show_unacknowledged"])) {
			$options["acknowledged"] = false;
		}

		$db_problems = API::Problem()->get($options);
		$bubbles = [];
		$max_bubbles = intval($this->fields_values["max_bubbles"] ?? 50);

		if ($db_problems && count($db_problems) > 0) {
			$problem_stats = [];
			
			foreach ($db_problems as $problem) {
				$host = "Unknown";
				if (!empty($problem["hosts"]) && is_array($problem["hosts"]) && count($problem["hosts"]) > 0) {
					$host = $problem["hosts"][0]["name"] ?? "Unknown";
				}
				$severity = intval($problem["severity"] ?? 0);
				
				if (!isset($problem_stats[$host])) {
					$problem_stats[$host] = [
						"total" => 0,
						"by_severity" => array_fill(0, 6, 0),
						"host" => $host
					];
				}
				
				$problem_stats[$host]["total"]++;
				$problem_stats[$host]["by_severity"][$severity]++;
			}

			$count = 0;
			foreach ($problem_stats as $host => $stats) {
				if ($count >= $max_bubbles) break;

				$max_severity = 0;
				$dominant_severity = 0;
				foreach ($stats["by_severity"] as $sev => $cnt) {
					if ($cnt > $max_severity) {
						$max_severity = $cnt;
						$dominant_severity = $sev;
					}
				}

				$high_severity_count = $stats["by_severity"][4] + $stats["by_severity"][5];
				$percentage = ($stats["total"] > 0) ? ($high_severity_count / $stats["total"]) * 100 : 0;

				$bubbles[] = [
					"id" => $host,
					"name" => $host,
					"host" => $host,
					"value" => $stats["total"],
					"percentage" => $percentage,
					"severity" => $dominant_severity,
					"severity_distribution" => $stats["by_severity"],
					"type" => "problem"
				];

				$count++;
			}
		}

		return $bubbles;
	}

	private function calculatePercentage(float $value, int $calc_type, float $threshold, string $itemid): float {
		switch ($calc_type) {
			case WidgetForm::CALC_TYPE_THRESHOLD_PERCENT:
				// Porcentagem em relação ao threshold
				return ($threshold > 0) ? ($value / $threshold) * 100 : 0;

			case WidgetForm::CALC_TYPE_CHANGE_PERCENT:
				// Se o valor já está entre 0-100 e threshold é 100, usar diretamente
				if ($threshold == 100 && $value >= 0 && $value <= 100) {
					return $value;
				}
				// Caso contrário, calcular porcentagem do threshold
				return ($threshold > 0) ? ($value / $threshold) * 100 : 0;

			case WidgetForm::CALC_TYPE_VALUE_OF_MAX:
			default:
				// Se o threshold for 100 e o valor já for porcentagem, usar diretamente
				if ($threshold == 100 && $value >= 0 && $value <= 100) {
					return $value;
				}
				// Caso contrário, calcular porcentagem do threshold
				return ($threshold > 0) ? ($value / $threshold) * 100 : 0;
		}
	}

	/**
	 * Busca imagem para um item usando estratégia melhorada com múltiplas fontes
	 * 
	 * Estratégia de busca (em ordem de prioridade):
	 * 1. Tags do item: bubble_icon, bubble_image, icon, image, img
	 * 2. Tags do host: bubble_icon, bubble_image, icon, image
	 * 3. Padrões por nome do item (ex: "CPU" -> "/assets/images/cpu.png")
	 * 
	 * Formatos suportados:
	 * - URLs completas: http://, https://
	 * - Caminhos absolutos: /path/to/image.png
	 * - Caminhos relativos: assets/images/icon.png
	 * - Nomes de arquivo: icon.png (assume /assets/images/)
	 * 
	 * @param array $item Item do Zabbix com tags e informações do host
	 * @return string|null URL da imagem ou null se não encontrada
	 */
	private function findItemImage(array $item): ?string {
		// Prioridade de tags do item (mais específicas primeiro)
		$item_tag_priority = [
			"bubble_icon",
			"bubble_image", 
			"icon",
			"image",
			"img"
		];
		
		// 1. Buscar nas tags do item (prioridade mais alta)
		if (!empty($item["tags"]) && is_array($item["tags"])) {
			foreach ($item_tag_priority as $tag_name) {
				foreach ($item["tags"] as $tag) {
					$current_tag_name = strtolower($tag["tag"] ?? "");
					if ($current_tag_name === $tag_name) {
						$tag_value = trim($tag["value"] ?? "");
						if (!empty($tag_value)) {
							$image_url = $this->normalizeImageUrl($tag_value);
							if ($image_url) {
								return $image_url;
							}
						}
					}
				}
			}
		}
		
		// 2. Buscar nas tags do host (se disponível)
		if (!empty($item["hosts"]) && is_array($item["hosts"]) && count($item["hosts"]) > 0) {
			$host = $item["hosts"][0];
			if (!empty($host["tags"]) && is_array($host["tags"])) {
				$host_tag_priority = ["bubble_icon", "bubble_image", "icon", "image"];
				foreach ($host_tag_priority as $tag_name) {
					foreach ($host["tags"] as $tag) {
						$current_tag_name = strtolower($tag["tag"] ?? "");
						if ($current_tag_name === $tag_name) {
							$tag_value = trim($tag["value"] ?? "");
							if (!empty($tag_value)) {
								$image_url = $this->normalizeImageUrl($tag_value);
								if ($image_url) {
									return $image_url;
								}
							}
						}
					}
				}
			}
		}
		
		// 3. Tentar padrões baseados no nome do item (fallback)
		$item_name = strtolower($item["name"] ?? "");
		$image_patterns = [
			"cpu" => "/assets/images/cpu.png",
			"memory" => "/assets/images/memory.png",
			"disk" => "/assets/images/disk.png",
			"network" => "/assets/images/network.png",
			"temperature" => "/assets/images/temperature.png",
			"uptime" => "/assets/images/uptime.png"
		];
		
		foreach ($image_patterns as $pattern => $image_path) {
			if (strpos($item_name, $pattern) !== false) {
				// Verificar se o arquivo existe (opcional, pode ser removido se não necessário)
				return $image_path;
			}
		}
		
		return null;
	}
	
	/**
	 * Normaliza URL de imagem para formato válido
	 * 
	 * @param string $url URL ou caminho da imagem
	 * @return string|null URL normalizada ou null se inválida
	 */
	private function normalizeImageUrl(string $url): ?string {
		$url = trim($url);
		if (empty($url)) {
			return null;
		}
		
		// URLs completas (http:// ou https://)
		if (preg_match("/^https?:\/\//i", $url)) {
			return $url;
		}
		
		// Caminho absoluto (começa com /)
		if (strpos($url, "/") === 0) {
			return $url;
		}
		
		// Caminho relativo ou nome de arquivo
		// Se já contém "assets/images", usar diretamente
		if (strpos($url, "assets/images") !== false) {
			return "/" . ltrim($url, "/");
		}
		
		// Caso contrário, assumir que está em assets/images/
		return "/assets/images/" . $url;
	}
	
	private function parseNumericValue($value): ?float {
		if (is_numeric($value)) {
			return floatval($value);
		}

		$cleaned = preg_replace("/[^\d.-]/", "", strval($value));
		if (is_numeric($cleaned)) {
			return floatval($cleaned);
		}

		return null;
	}

	private function calculateStats(array $bubbles): array {
		if (empty($bubbles)) {
			return [
				"total" => 0,
				"avg_percentage" => 0,
				"max_percentage" => 0,
				"min_percentage" => 0
			];
		}

		$percentages = array_column($bubbles, "percentage");
		
		return [
			"total" => count($bubbles),
			"avg_percentage" => array_sum($percentages) / count($percentages),
			"max_percentage" => max($percentages),
			"min_percentage" => min($percentages)
		];
	}
}
