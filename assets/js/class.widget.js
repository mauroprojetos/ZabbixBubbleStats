/*
** Zabbix Bubble Stats Widget - JavaScript baseado em itemMAX
** Copyright (C) 2025
*/

class WidgetBubbleStats extends CWidget {

	onInitialize() {
		super.onInitialize();
		this._bubbles = [];
		this._bubbleData = []; // Armazenar dados de física das bolhas
		this._container = null;
		this._lastBubblesData = [];
		this._bubbles_data = [];
		this._stats = {};
		this._fields_values = {};
		this._data_type = 0;
		this._name = "";
		this._bodyContent = ""; // Conteúdo HTML do body (não confundir com this._body do CWidget)
		this._debug = {};
		this._animationFrameId = null;
		this._physicsEnabled = true; // Física habilitada por padrão
		this._lastContainerSize = null; // Armazenar tamanho anterior do container para redimensionamento proporcional
		this._currentContainerWidth = null; // Dimensões atuais do container para física
		this._currentContainerHeight = null;
		this._tooltip = null; // Tooltip avançado com gráfico
		this._tooltipTimeout = null; // Timeout para carregar gráfico
		this._chartCache = {}; // Cache de gráficos já carregados

		// Drag and Drop state
		this._draggedBubble = null;
		this._dragOffsetX = 0;
		this._dragOffsetY = 0;
		this._isDragging = false;
	}

	onActivate() {
		console.log("[BubbleStats] onActivate called");
		this._findOrCreateContainer();
	}

	processUpdateResponse(response) {
		const isDebug = response?.debug && Object.keys(response.debug).length > 0;

		if (isDebug) {
			console.log("[BubbleStats] processUpdateResponse called");
			console.log("[BubbleStats] Response keys:", response ? Object.keys(response) : "response is null");
		}

		// Extrair dados do response
		this._name = response?.name || "";
		this._bodyContent = response?.body || ""; // Conteúdo HTML do body
		const newBubblesData = response?.bubbles_data || [];
		this._stats = response?.stats || {};
		this._fields_values = response?.fields_values || {};
		this._data_type = response?.data_type || 0;
		this._debug = response?.debug || {};

		if (isDebug) {
			console.log("[BubbleStats] Extracted data:", {
				name: this._name,
				bodyContent: this._bodyContent,
				bubbles_count: newBubblesData.length,
				bubbles_data: newBubblesData,
				debug: this._debug
			});
		}

		// Verificar se já temos bolhas renderizadas e podemos fazer atualização incremental
		const canDoIncrementalUpdate = this._container &&
			this._bubbleData &&
			this._bubbleData.length > 0 &&
			this._bubbles_data &&
			this._bubbles_data.length > 0;

		// Atualizar dados
		this._bubbles_data = newBubblesData;

		if (canDoIncrementalUpdate) {
			// Fazer atualização incremental sem recriar tudo
			if (isDebug) {
				console.log("[BubbleStats] Doing incremental update - updating existing bubbles");
			}
			this._updateBubblesIncremental(newBubblesData);
		} else {
			// Primeira renderização ou mudança estrutural - renderizar tudo
			if (isDebug) {
				console.log("[BubbleStats] Doing full render - no existing bubbles or container");
			}
			// Garantir que os dados dos bubbles sejam preservados
			if (this._bubbles_data && this._bubbles_data.length > 0) {
				this._lastBubblesData = this._bubbles_data;
			}
			this.setContents(response);
		}
	}

	setContents(response) {
		const isDebug = response?.debug && Object.keys(response.debug).length > 0;

		// Seguindo o padrão do Echarts-Zabbix: só chamar super.setContents na primeira renderização
		// Se já temos container e bolhas renderizadas, não recriar o HTML
		if (!this._container || !this._bubbleData || this._bubbleData.length === 0) {
			// Primeira renderização - criar estrutura HTML
			if (isDebug) {
				console.log("[BubbleStats] First render - calling super.setContents");
			}

			// Limpar referências antigas antes de atualizar
			this._container = null;

			// Chamar super.setContents para criar a estrutura HTML inicial
			super.setContents(response);

			// Extrair dados do response
			if (response) {
				if (response.name !== undefined) this._name = response.name;
				if (response.body !== undefined) this._bodyContent = response.body;
				if (response.bubbles_data !== undefined) this._bubbles_data = response.bubbles_data;
				if (response.stats !== undefined) this._stats = response.stats;
				if (response.fields_values !== undefined) this._fields_values = response.fields_values;
				if (response.data_type !== undefined) this._data_type = response.data_type;
				if (response.debug !== undefined) this._debug = response.debug;
			}

			// Log de debug apenas se habilitado
			if (isDebug) {
				console.log("[BubbleStats] setContents called (first render)");
				console.log("[BubbleStats] After super.setContents:");
				console.log("[BubbleStats] _body:", this._body);
				console.log("[BubbleStats] _target:", this._target);
				console.log("[BubbleStats] Debug info:", this._debug);
				console.log("[BubbleStats] Bubbles data count:", this._bubbles_data?.length || 0);
			}

			// Buscar o container após o super.setContents ter renderizado o HTML
			this._ensureContainerAndRender();
		} else {
			// Já temos estrutura renderizada - apenas atualizar dados (já feito em processUpdateResponse)
			if (isDebug) {
				console.log("[BubbleStats] setContents called but skipping super.setContents (incremental update)");
			}
		}
	}

	_ensureContainerAndRender() {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;
		let attempts = 0;
		const maxAttempts = 10;

		const tryRender = () => {
			attempts++;

			// Tentar encontrar ou criar o container
			this._findOrCreateContainer();

			if (this._container) {
				if (isDebug) {
					console.log("[BubbleStats] Container found, rendering bubbles (attempt", attempts + ")");
				}
				this._updateBubbles();
			} else if (attempts < maxAttempts) {
				// Se não encontrou, tentar novamente após um pequeno delay
				if (isDebug) {
					console.log("[BubbleStats] Container not found, retrying... (attempt", attempts + "/" + maxAttempts + ")");
				}
				setTimeout(tryRender, 50);
			} else {
				// Se esgotou as tentativas, mostrar erro
				console.error("[BubbleStats] Failed to find container after", maxAttempts, "attempts");
				if (this._body) {
					this._body.innerHTML = '<div style="padding: 20px; color: #e74c3c;">Erro: Container não encontrado após refresh</div>';
				}
			}
		};

		// Começar tentativas após um pequeno delay inicial
		setTimeout(tryRender, 50);
	}

	_updateBubbles() {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;

		if (isDebug) {
			console.log("[BubbleStats] _updateBubbles called");
			console.log("[BubbleStats] Container:", this._container ? "found" : "NOT FOUND");
			console.log("[BubbleStats] Bubbles data:", this._bubbles_data);
		}

		// Garantir que o container existe
		if (!this._container) {
			console.warn("[BubbleStats] Container not found in _updateBubbles, trying to find/create...");
			this._findOrCreateContainer();

			// Se ainda não encontrou, abortar
			if (!this._container) {
				console.error("[BubbleStats] Cannot update bubbles: container not found");
				return;
			}
		}

		// Verificar se há dados de bubbles
		if (this._bubbles_data && Array.isArray(this._bubbles_data) && this._bubbles_data.length > 0) {
			if (isDebug) {
				console.log("[BubbleStats] Rendering", this._bubbles_data.length, "bubbles");
			}
			this._lastBubblesData = this._bubbles_data;
			this._renderBubbles(this._bubbles_data, this._fields_values || {});
		} else {
			if (isDebug) {
				console.log("[BubbleStats] No bubbles data available");
			}
			this._showNoData();
		}
	}

	/**
	 * Atualização incremental das bolhas - atualiza apenas valores e tamanhos sem recriar o DOM
	 * Similar ao comportamento do Echarts-Zabbix que atualiza apenas os dados do gráfico
	 */
	_updateBubblesIncremental(newBubblesData) {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;

		// Garantir que o container existe (pode ter sido perdido)
		if (!this._container) {
			this._findOrCreateContainer();
		}

		if (!this._container || !this._bubbleData || this._bubbleData.length === 0) {
			// Se não temos estrutura existente, fazer renderização completa
			if (isDebug) {
				console.log("[BubbleStats] Cannot do incremental update - no existing structure, doing full render");
			}
			// Atualizar dados antes de renderizar
			if (this._bubbles_data && this._bubbles_data.length > 0) {
				this._lastBubblesData = this._bubbles_data;
			}
			this._updateBubbles();
			return;
		}

		if (isDebug) {
			console.log("[BubbleStats] Starting incremental update:", {
				existingBubbles: this._bubbleData.length,
				newBubbles: newBubblesData.length
			});
		}

		// Criar mapa dos novos dados por ID para acesso rápido
		const newDataMap = new Map();
		newBubblesData.forEach(data => {
			newDataMap.set(data.id, data);
		});

		// Criar mapa das bolhas existentes por ID
		const existingBubbleMap = new Map();
		this._bubbleData.forEach(bubblePhysics => {
			if (bubblePhysics.data && bubblePhysics.data.id) {
				existingBubbleMap.set(bubblePhysics.data.id, bubblePhysics);
			}
		});

		// Calcular min/max dos novos valores para normalização
		const values = newBubblesData.map(d => Math.abs(d.value || 0));
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const valueRange = maxValue - minValue || 1;
		const median = (minValue + maxValue) / 2;

		// Obter escala de tamanho atual (reutilizar do cálculo existente)
		const validWidth = this._currentContainerWidth || this._container.offsetWidth || 400;
		const validHeight = this._currentContainerHeight || this._container.offsetHeight || 300;
		const referenceArea = 400 * 300;
		const currentArea = validWidth * validHeight;
		const areaRatio = currentArea / referenceArea;
		let sizeScale = areaRatio >= 1 ? Math.sqrt(areaRatio) : Math.pow(areaRatio, 0.7);
		let finalSizeScale = Math.max(0.15, Math.min(sizeScale, 2.0));

		// Aplicar fator de densidade
		const bubbleCount = newBubblesData.length;
		const referenceBubbleCount = 20;
		let densityScale = 1.0;
		if (bubbleCount > referenceBubbleCount) {
			const densityRatio = referenceBubbleCount / bubbleCount;
			if (bubbleCount > 100) {
				densityScale = Math.pow(densityRatio, 0.5);
			} else if (bubbleCount > 50) {
				densityScale = Math.pow(densityRatio, 0.6);
			} else {
				densityScale = Math.sqrt(densityRatio);
			}
		}
		finalSizeScale = Math.max(0.1, finalSizeScale * densityScale);

		// Atualizar bolhas existentes
		const bubblesToRemove = [];
		this._bubbleData.forEach((bubblePhysics, index) => {
			const bubbleId = bubblePhysics.data?.id;
			if (!bubbleId) return;

			const newData = newDataMap.get(bubbleId);

			if (newData) {
				// Bolha existe nos novos dados - atualizar valores e tamanho
				const value = newData.value || 0;
				const absValue = Math.abs(value);
				const normalized = valueRange > 0 ? (absValue - minValue) / valueRange : 0;

				// Calcular novo tamanho
				const baseMinSize = 60;
				const baseMaxSize = 180;
				const minSize = baseMinSize * finalSizeScale;
				const maxSize = baseMaxSize * finalSizeScale;
				const curved = Math.pow(Math.min(normalized, 1), 0.65);
				const newSize = minSize + curved * (maxSize - minSize);
				const newRadius = newSize / 2;

				// Calcular nova cor baseada no valor
				const isPositive = value < median;
				const distanceFromMedian = Math.abs(value - median);
				const maxDistance = Math.max(median - minValue, maxValue - median) || 1;
				const intensity = Math.min(distanceFromMedian / maxDistance, 1);
				const baseOpacity = 0.4 + (intensity * 0.4);

				// Cores padrão do Zabbix (Severidades + OK)
				const ZABBIX_COLORS = {
					green: '#43A047',   // OK / Recovered (Verde escuro para melhor contraste)
					blue: '#1E88E5',    // Information (Azul mais forte)
					yellow: '#FBC02D',  // Warning (Amarelo mais escuro)
					orange: '#F57C00',  // Average (Laranja mais forte)
					dorange: '#E64A19', // High (Laranja avermelhado)
					red: '#D32F2F',     // Disaster (Vermelho escuro)
					gray: '#78909C'     // Not classified (Cinza azulado)
				};

				let gradientColor;

				// Lógica de Threshold e Severidade
				const threshold = parseFloat(this._fields_values?.threshold_value || 100);

				// Verificar severidade do Zabbix (Override)
				// Se severidade >= 2 (Warning), usa a cor da severidade
				const zabbixSeverity = parseInt(newData.severity || 0);

				if (zabbixSeverity >= 2) {
					// Usar cor da severidade do Zabbix
					switch (zabbixSeverity) {
						case 5: gradientColor = ZABBIX_COLORS.red; break;     // Disaster
						case 4: gradientColor = ZABBIX_COLORS.dorange; break; // High
						case 3: gradientColor = ZABBIX_COLORS.orange; break;  // Average
						case 2: gradientColor = ZABBIX_COLORS.yellow; break;  // Warning
						default: gradientColor = ZABBIX_COLORS.gray;
					}
				} else if (newData.type === 'problem') {
					// Se for tipo problema mas severidade baixa (Info/Not Classified), usa cores apropriadas
					switch (zabbixSeverity) {
						case 1: gradientColor = ZABBIX_COLORS.blue; break;    // Information
						default: gradientColor = ZABBIX_COLORS.gray;          // Not classified
					}
				} else {
					// Lógica de Threshold para Métricas
					// Calcular porcentagem em relação ao threshold
					let percentageOfThreshold = 0;
					if (threshold > 0) {
						percentageOfThreshold = (value / threshold) * 100;
					}

					// Aplicar regras de cor baseadas no threshold
					if (percentageOfThreshold < 80) {
						gradientColor = ZABBIX_COLORS.green;  // 0 - 80%
					} else if (percentageOfThreshold < 90) {
						gradientColor = ZABBIX_COLORS.yellow; // 80% - 90%
					} else {
						gradientColor = ZABBIX_COLORS.red;    // > 90%
					}
				}

				const finalOpacity = Math.min(baseOpacity + 0.15, 0.95);
				// Atualizar elemento da bolha
				const bubble = bubblePhysics.element;

				// Atualizar tamanho (com animação suave)
				const sizeDiff = Math.abs(newSize - bubblePhysics.size);
				if (sizeDiff > 1) { // Só atualizar se houver diferença significativa
					bubble.style.setProperty('width', `${newSize}px`, 'important');
					bubble.style.setProperty('height', `${newSize}px`, 'important');
					bubblePhysics.size = newSize;
					bubblePhysics.radius = newRadius;
					bubblePhysics.baseSize = newSize;
					bubblePhysics.baseRadius = newRadius;
				}

				// Apply Crypto Bubbles style (Dark background + Colored Glow)
				bubble.style.background = 'rgba(20, 20, 20, 0.85)';
				bubble.style.borderColor = gradientColor;
				bubble.style.borderWidth = '1px';
				bubble.style.borderStyle = 'solid';

				// Enhanced inner glow based on size + strong outer shadow
				// Using hex alpha for transparency (e.g. #RRGGBBAA)
				const glowSize = Math.max(10, newSize / 3);
				bubble.style.boxShadow = `inset 0 0 ${glowSize}px ${gradientColor}60, 0 6px 12px rgba(0,0,0,0.5)`;
				bubble.style.backdropFilter = 'blur(4px)';

				// Atualizar classes positiva/negativa
				bubble.classList.remove('positive', 'negative');
				bubble.classList.add(isPositive ? 'positive' : 'negative');

				// Atualizar valor exibido
				const valueEl = bubble.querySelector('.bubble-value');
				if (valueEl) {
					// Usar valor absoluto sem formatação forçada de zeros
					let valueStr;
					if (typeof value === 'number') {
						if (Math.abs(value) < 0.0001) {
							valueStr = "0";
						} else if (Number.isInteger(value)) {
							valueStr = value.toString();
						} else {
							// Remove zeros à direita desnecessários
							valueStr = parseFloat(value.toFixed(2)).toString();
						}
					} else {
						valueStr = String(value);
					}
					valueEl.textContent = valueStr + (newData.units ? " " + newData.units : ""); // _updateBubblesIncremental tooltip logic is separated
				}

				// Atualizar dados da bolha
				bubblePhysics.data = newData;
				bubble._bubbleData = newData;

				// Remover dos novos dados para saber quais são realmente novos
				newDataMap.delete(bubbleId);
			} else {
				// Bolha não existe mais nos novos dados - marcar para remoção
				bubblesToRemove.push(index);
			}
		});

		// Remover bolhas que não existem mais
		bubblesToRemove.reverse().forEach(index => {
			const bubblePhysics = this._bubbleData[index];
			if (bubblePhysics && bubblePhysics.element) {
				bubblePhysics.element.remove();
			}
			this._bubbleData.splice(index, 1);
			this._bubbles.splice(index, 1);
		});

		// Adicionar novas bolhas que não existiam antes
		if (newDataMap.size > 0) {
			if (isDebug) {
				console.log("[BubbleStats] Adding", newDataMap.size, "new bubbles");
			}

			// Criar array temporário apenas com novos dados para renderizar
			const newBubblesArray = Array.from(newDataMap.values());

			// Usar método auxiliar para renderizar apenas as novas bolhas
			this._renderNewBubbles(newBubblesArray, {
				minValue,
				maxValue,
				valueRange,
				median,
				finalSizeScale,
				validWidth,
				validHeight
			});
		}

		if (isDebug) {
			console.log("[BubbleStats] Incremental update complete:", {
				updated: this._bubbleData.length - bubblesToRemove.length,
				removed: bubblesToRemove.length,
				added: newDataMap.size,
				total: this._bubbleData.length
			});
		}
	}

	/**
	 * Renderiza apenas novas bolhas (usado na atualização incremental)
	 */
	_renderNewBubbles(newBubblesData, context) {
		const { minValue, maxValue, valueRange, median, finalSizeScale, validWidth, validHeight } = context;
		const isDebug = this._debug && Object.keys(this._debug).length > 0;

		newBubblesData.forEach((data) => {
			const value = data.value || 0;
			const absValue = Math.abs(value);
			const normalized = valueRange > 0 ? (absValue - minValue) / valueRange : 0;

			const baseMinSize = 60;
			const baseMaxSize = 180;
			const minSize = baseMinSize * finalSizeScale;
			const maxSize = baseMaxSize * finalSizeScale;
			const curved = Math.pow(Math.min(normalized, 1), 0.65);
			const size = minSize + curved * (maxSize - minSize);
			const radius = size / 2;

			const bubble = document.createElement("div");
			bubble.className = "bubble";

			const isPositive = value < median;
			const distanceFromMedian = Math.abs(value - median);
			const maxDistance = Math.max(median - minValue, maxValue - median) || 1;
			const intensity = Math.min(distanceFromMedian / maxDistance, 1);
			const baseOpacity = 0.4 + (intensity * 0.4);

			// Cores padrão do Zabbix (Severidades + OK)
			const ZABBIX_COLORS = {
				green: '#43A047',   // OK / Recovered
				blue: '#1E88E5',    // Information
				yellow: '#FBC02D',  // Warning
				orange: '#F57C00',  // Average
				dorange: '#E64A19', // High
				red: '#D32F2F',     // Disaster
				gray: '#78909C'     // Not classified
			};

			let gradientColor;

			// Se for tipo problema, usar cor da severidade
			if (data.type === 'problem') {
				const severity = parseInt(data.severity || 0);
				switch (severity) {
					case 5: gradientColor = ZABBIX_COLORS.red; break;     // Disaster
					case 4: gradientColor = ZABBIX_COLORS.dorange; break; // High
					case 3: gradientColor = ZABBIX_COLORS.orange; break;  // Average
					case 2: gradientColor = ZABBIX_COLORS.yellow; break;  // Warning
					case 1: gradientColor = ZABBIX_COLORS.blue; break;    // Information
					default: gradientColor = ZABBIX_COLORS.gray;          // Not classified
				}
			} else {
				// Métrica: Good (Green) ou Bad (Alert colors)
				if (isPositive) {
					gradientColor = ZABBIX_COLORS.green;
				} else {
					if (intensity < 0.33) {
						gradientColor = ZABBIX_COLORS.yellow;
					} else if (intensity < 0.66) {
						gradientColor = ZABBIX_COLORS.dorange;
					} else {
						gradientColor = ZABBIX_COLORS.red;
					}
				}
			}

			// Apply Crypto Bubbles style (Dark background + Colored Glow)
			bubble.style.background = 'rgba(20, 20, 20, 0.85)';
			bubble.style.borderColor = gradientColor;
			bubble.style.borderWidth = '1px';
			bubble.style.borderStyle = 'solid';

			// Enhanced inner glow based on size + strong outer shadow
			const glowSize = Math.max(10, size / 3);
			bubble.style.boxShadow = `inset 0 0 ${glowSize}px ${gradientColor}60, 0 6px 12px rgba(0,0,0,0.5)`;
			bubble.style.backdropFilter = 'blur(4px)';

			bubble.style.setProperty('width', `${size}px`, 'important');
			bubble.style.setProperty('height', `${size}px`, 'important');

			// Posição inicial
			let initialX, initialY;
			let attempts = 0;
			const maxAttempts = 50;

			do {
				initialX = radius + Math.random() * (validWidth - size);
				initialY = radius + Math.random() * (validHeight - size);
				attempts++;

				let hasOverlap = false;
				for (const existing of this._bubbleData) {
					const dx = initialX - existing.x;
					const dy = initialY - existing.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const minDist = radius + existing.radius + 5;

					if (distance < minDist) {
						hasOverlap = true;
						break;
					}
				}

				if (!hasOverlap || attempts >= maxAttempts) break;
			} while (attempts < maxAttempts);

			const bubblePhysics = {
				element: bubble,
				data: data,
				x: initialX,
				y: initialY,
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				radius: radius,
				size: size,
				baseSize: size,
				baseRadius: radius
			};

			bubble.style.left = `${initialX - radius}px`;
			bubble.style.top = `${initialY - radius}px`;

			// Criar conteúdo da bolha (mesmo código do _renderBubbles)
			if (data.image) {
				const imageEl = document.createElement("img");
				imageEl.className = "bubble-image";
				imageEl.src = data.image;
				imageEl.alt = data.name || "Item";
				imageEl.style.width = `${Math.max(20, size / 4)}px`;
				imageEl.style.height = `${Math.max(20, size / 4)}px`;
				imageEl.style.objectFit = "contain";
				imageEl.style.marginBottom = "4px";
				bubble.appendChild(imageEl);
			}

			const nameEl = document.createElement("div");
			nameEl.className = "bubble-name";
			const nameSize = Math.min(20, Math.max(11, size / 6));
			nameEl.style.fontSize = `${nameSize}px`;
			nameEl.style.fontWeight = "600";
			nameEl.style.maxWidth = `${size - 12}px`;
			nameEl.style.marginBottom = "4px";
			nameEl.textContent = (data.name || "Unknown").substring(0, 25);
			bubble.appendChild(nameEl);

			const valueEl = document.createElement("div");
			valueEl.className = "bubble-value";
			const valSize = Math.min(24, Math.max(12, size / 5));
			valueEl.style.fontSize = `${valSize}px`;
			valueEl.style.fontWeight = "700";
			valueEl.style.opacity = "1.0";

			if (data.value !== undefined && data.value !== null) {
				// Usar valor absoluto sem formatação forçada de zeros
				let valueStr;
				if (typeof data.value === 'number') {
					if (Math.abs(data.value) < 0.0001) {
						valueStr = "0";
					} else if (Number.isInteger(data.value)) {
						valueStr = data.value.toString();
					} else {
						// Remove zeros à direita desnecessários
						valueStr = parseFloat(data.value.toFixed(2)).toString();
					}
				} else {
					valueStr = String(data.value);
				}
				valueEl.textContent = valueStr + (data.units ? " " + data.units : "");
			} else {
				valueEl.textContent = "N/A";
				valueEl.style.opacity = "0.6";
			}

			bubble.appendChild(valueEl);

			bubble.classList.add(isPositive ? "positive" : "negative");
			bubble.title = '';

			this._setupAdvancedTooltip(bubble, data);

			if (this._container && this._container.parentElement) {
				try {
					if (bubble !== this._container && !this._container.contains(bubble)) {
						this._container.appendChild(bubble);
						this._bubbles.push(bubble);
						this._bubbleData.push(bubblePhysics);
					}
				} catch (e) {
					console.error("[BubbleStats] Error appending new bubble:", e);
				}
			}
		});
	}

	onUpdate(response) {
		const isDebug = response?.debug && Object.keys(response.debug).length > 0;

		if (isDebug) {
			console.log("[BubbleStats] ====== onUpdate CALLED ======");
			console.log("[BubbleStats] Response:", response);
		}

		// Extrair dados do response (consolidado)
		if (response) {
			if (response.name !== undefined) {
				this._name = response.name;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded name:", this._name);
			}
			if (response.body !== undefined) {
				this._bodyContent = response.body; // Conteúdo HTML do body
				if (isDebug) console.log("[BubbleStats] ✓ Loaded bodyContent:", this._bodyContent);
			}
			if (response.bubbles_data !== undefined) {
				this._bubbles_data = response.bubbles_data;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded bubbles_data:", this._bubbles_data);
			} else if (isDebug) {
				console.warn("[BubbleStats] ✗ bubbles_data NOT FOUND");
			}
			if (response.stats !== undefined) {
				this._stats = response.stats;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded stats:", this._stats);
			}
			if (response.fields_values !== undefined) {
				this._fields_values = response.fields_values;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded fields_values:", this._fields_values);
			}
			if (response.data_type !== undefined) {
				this._data_type = response.data_type;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded data_type:", this._data_type);
			}
			if (response.debug !== undefined) {
				this._debug = response.debug;
				if (isDebug) console.log("[BubbleStats] ✓ Loaded debug:", this._debug);
			}
		}

		// Chamar setContents que já cuida de tudo corretamente
		this.setContents(response);
	}

	onResize() {
		// Parar animação anterior
		if (this._animationFrameId) {
			cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}

		if (this._lastBubblesData && this._lastBubblesData.length > 0) {
			// Recalcular dimensões do container
			if (this._container) {
				const rect = this._container.getBoundingClientRect();
				const newWidth = rect.width || this._container.clientWidth || 400;
				const newHeight = rect.height || this._container.clientHeight || 300;

				// Ajustar posições e tamanhos das bolhas existentes proporcionalmente
				if (this._bubbleData && this._bubbleData.length > 0 && this._lastContainerSize) {
					const oldWidth = this._lastContainerSize.width;
					const oldHeight = this._lastContainerSize.height;

					// Evitar divisão por zero
					if (oldWidth === 0 || oldHeight === 0) {
						// Se tamanho anterior inválido, re-renderizar completamente
						this._renderBubbles(this._lastBubblesData, {});
						return;
					}

					// Calcular fatores de escala para posição
					const scaleX = newWidth / oldWidth;
					const scaleY = newHeight / oldHeight;

					// Calcular fator de escala para tamanho baseado no NOVO tamanho do container
					// IMPORTANTE: Usar a MESMA lógica do _renderBubbles para garantir consistência
					// Quando o container aumenta, as bolhas devem AUMENTAR (comportamento correto)
					// Quando o container diminui, as bolhas devem DIMINUIR muito (proporção dinâmica agressiva)
					// Usar área de referência de 400x300 como base (120000 pixels)
					const referenceArea = 400 * 300; // 120000
					const newArea = newWidth * newHeight;
					const areaRatio = newArea / referenceArea;

					// Usar curva assimétrica: quando container diminui, diminuir mais agressivamente
					let sizeScale;
					if (areaRatio >= 1) {
						// Container maior ou igual à referência: usar raiz quadrada normal
						sizeScale = Math.sqrt(areaRatio);
					} else {
						// Container menor que referência: usar potência maior para diminuir mais agressivamente
						// areaRatio^0.7 diminui mais rápido que sqrt quando < 1
						sizeScale = Math.pow(areaRatio, 0.7);
					}

					// Limitar escala entre 0.15 e 2.0 (mesmo limite do _renderBubbles para consistência)
					// Quando container diminui muito, bolhas podem diminuir até 0.15x (muito pequenas)
					// Quando container aumenta muito, bolhas podem aumentar até 2.0x
					let finalSizeScale = Math.max(0.15, Math.min(sizeScale, 2.0));

					// IMPORTANTE: Reduzir tamanho quando há muitas bolhas para evitar sobreposição
					// Quanto mais bolhas, menor elas devem ser para caber no container
					const bubbleCount = this._bubbleData.length;
					const referenceBubbleCount = 20; // Número de referência de bolhas
					const highDensityThreshold = 50; // Quando há mais de 50 bolhas, reduzir ainda mais
					const veryHighDensityThreshold = 100; // Quando há mais de 100 bolhas, reduzir muito mais
					let densityScale = 1.0;

					if (bubbleCount > referenceBubbleCount) {
						// Quando há mais bolhas que a referência, reduzir proporcionalmente
						const densityRatio = referenceBubbleCount / bubbleCount;

						if (bubbleCount > veryHighDensityThreshold) {
							// Mais de 100 bolhas: redução muito mais agressiva usando potência menor
							// Usar potência 0.5 para reduzir ainda mais (raiz quadrada do ratio)
							densityScale = Math.pow(densityRatio, 0.5);
						} else if (bubbleCount > highDensityThreshold) {
							// Mais de 50 bolhas: redução mais agressiva usando potência maior
							// Usar potência 0.6 em vez de 0.5 (raiz quadrada) para reduzir mais
							densityScale = Math.pow(densityRatio, 0.6);
						} else {
							// Entre 20 e 50 bolhas: usar raiz quadrada para redução suave mas efetiva
							densityScale = Math.sqrt(densityRatio);
						}
					}

					// Aplicar fator de densidade ao tamanho final
					finalSizeScale = finalSizeScale * densityScale;

					// Garantir que não fique muito pequeno (mínimo absoluto de 0.1)
					finalSizeScale = Math.max(0.1, finalSizeScale);

					// Debug: log do redimensionamento
					const isDebug = this._debug && Object.keys(this._debug).length > 0;
					if (isDebug) {
						console.log("[BubbleStats] Resizing:", {
							oldSize: `${oldWidth}x${oldHeight}`,
							newSize: `${newWidth}x${newHeight}`,
							referenceArea: referenceArea,
							newArea: newArea,
							areaRatio: areaRatio.toFixed(3),
							sizeScale: sizeScale.toFixed(3),
							bubbleCount: bubbleCount,
							densityScale: densityScale.toFixed(3),
							finalSizeScale: finalSizeScale.toFixed(3),
							scaleX: scaleX.toFixed(3),
							scaleY: scaleY.toFixed(3)
						});
					}

					// PRIMEIRO: Atualizar tamanhos de todas as bolhas ANTES de qualquer cálculo
					// Isso garante que os raios estejam corretos para física e colisões
					this._bubbleData.forEach(bubble => {
						// RECALCULAR tamanho baseado no novo tamanho do container
						// Usar a mesma lógica do _renderBubbles para garantir consistência
						const percentage = bubble.data.percentage || 0;
						const absPercentage = Math.abs(percentage);
						const baseMinSize = 60;  // Tamanho base mínimo
						const baseMaxSize = 180; // Tamanho base máximo
						const minSize = baseMinSize * finalSizeScale;  // Escalar proporcionalmente
						const maxSize = baseMaxSize * finalSizeScale;  // Escalar proporcionalmente
						const normalized = Math.min(absPercentage / 100, 1);
						const curved = Math.pow(normalized, 0.65); // Curva mais suave
						const newSize = minSize + curved * (maxSize - minSize);

						// Atualizar tamanhos ANTES de qualquer cálculo de posição
						bubble.size = newSize;
						bubble.radius = newSize / 2;
						bubble.baseSize = newSize; // Atualizar baseSize para próximo redimensionamento
						bubble.baseRadius = bubble.radius;

						// Atualizar tamanho visual da bolha IMEDIATAMENTE
						// Usar setProperty com important para garantir que seja aplicado
						bubble.element.style.setProperty('width', `${bubble.size}px`, 'important');
						bubble.element.style.setProperty('height', `${bubble.size}px`, 'important');

						// Debug: verificar se o tamanho foi aplicado
						if (isDebug && bubble === this._bubbleData[0]) {
							console.log("[BubbleStats] First bubble resize:", {
								oldBaseSize: bubble.baseSize,
								newSize: bubble.size,
								newRadius: bubble.radius,
								finalSizeScale: finalSizeScale.toFixed(3),
								elementWidth: bubble.element.style.width,
								elementHeight: bubble.element.style.height,
								computedWidth: window.getComputedStyle(bubble.element).width,
								computedHeight: window.getComputedStyle(bubble.element).height
							});
						}

						// Atualizar tamanhos de fonte e imagem proporcionalmente
						const imageEl = bubble.element.querySelector('.bubble-image');
						const nameEl = bubble.element.querySelector('.bubble-name');
						const valueEl = bubble.element.querySelector('.bubble-value');

						if (imageEl) {
							imageEl.style.width = `${Math.max(20, bubble.size / 4)}px`;
							imageEl.style.height = `${Math.max(20, bubble.size / 4)}px`;
						}
						if (nameEl) {
							// Hide name if bubble is too small (< 50px)
							if (bubble.size < 50) {
								nameEl.style.display = 'none';
							} else {
								nameEl.style.display = 'block';
								// Improved font scaling: size/5.5 (min 10, max 24)
								const nameSize = Math.min(24, Math.max(10, bubble.size / 5.5));
								nameEl.style.fontSize = `${nameSize}px`;
								nameEl.style.maxWidth = `${bubble.size - 10}px`;
							}
						}
						if (valueEl) {
							// If name is hidden, value can be slightly larger and centered
							const isSmall = bubble.size < 50;
							// Improved font scaling: size/4 (min 12, max 28)
							const valScale = isSmall ? 3.5 : 4; // Larger relative size for small bubbles
							const valSize = Math.min(28, Math.max(12, bubble.size / valScale));
							valueEl.style.fontSize = `${valSize}px`;
						}
					});

					// SEGUNDO: Ajustar posições mantendo proporção relativa ao centro
					this._bubbleData.forEach(bubble => {
						// Escalar posição mantendo proporção relativa ao centro
						bubble.x = bubble.x * scaleX;
						bubble.y = bubble.y * scaleY;

						// Garantir que fique dentro dos novos limites (usando NOVO raio)
						if (bubble.x - bubble.radius < 0) bubble.x = bubble.radius;
						if (bubble.x + bubble.radius > newWidth) bubble.x = newWidth - bubble.radius;
						if (bubble.y - bubble.radius < 0) bubble.y = bubble.radius;
						if (bubble.y + bubble.radius > newHeight) bubble.y = newHeight - bubble.radius;

						// Reduzir velocidade para evitar comportamento errático após resize
						bubble.vx *= 0.5;
						bubble.vy *= 0.5;
					});

					// TERCEIRO: Aplicar posições e tamanhos visualmente
					this._bubbleData.forEach(bubble => {
						bubble.element.style.left = `${bubble.x - bubble.radius}px`;
						bubble.element.style.top = `${bubble.y - bubble.radius}px`;
					});

					// QUARTO: Resolver sobreposições que podem ter ocorrido após o redimensionamento
					// IMPORTANTE: Fazer isso DEPOIS de aplicar os tamanhos para garantir detecção correta
					this._resolveInitialOverlaps(newWidth, newHeight);

					// Atualizar tamanho do container armazenado
					this._lastContainerSize = { width: newWidth, height: newHeight };
					// Atualizar dimensões atuais para física
					this._currentContainerWidth = newWidth;
					this._currentContainerHeight = newHeight;

					// Reiniciar física IMEDIATAMENTE com novas dimensões
					// A física deve continuar funcionando normalmente após o resize
					// (a física já foi parada no início do onResize)
					if (this._physicsEnabled) {
						// Reiniciar física com novas dimensões
						this._startPhysics(newWidth, newHeight);
					}
				} else {
					// Se não há dados de física ou tamanho anterior, re-renderizar completamente
					// Isso garante que as bolhas sejam criadas com o tamanho correto do container
					this._renderBubbles(this._lastBubblesData, {});
				}
			} else {
				// Se não há container, re-renderizar completamente
				this._renderBubbles(this._lastBubblesData, {});
			}
		} else {
			this._showNoData();
		}
	}

	onDestroy() {
		// Limpar animação quando o widget for destruído
		if (this._animationFrameId) {
			cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}

		// Limpar tooltip avançado
		if (this._tooltip && this._tooltip.parentNode) {
			try {
				document.body.removeChild(this._tooltip);
			} catch (e) {
				// Tooltip já foi removido ou não está no DOM
			}
			this._tooltip = null;
		}

		// Limpar cache de gráficos
		this._chartCache = {};

		// NÃO limpar _container aqui - ele será recriado/encontrado no próximo refresh
		// Limpar apenas a referência para forçar busca no próximo render
		this._container = null;

		super.onDestroy();
	}

	_findOrCreateContainer() {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;

		// Seguindo padrão Echarts-Zabbix - buscar container diretamente no _body
		// O _body é criado pelo super.setContents() e já está posicionado abaixo do header
		if (!this._container) {
			// Buscar no _body primeiro (padrão Zabbix - como Echarts-Zabbix faz)
			if (this._body) {
				// Tentar buscar diretamente o container (pode estar dentro do wrapper)
				this._container = this._body.querySelector(".bubble-stats-container");

				// Se não encontrou diretamente, buscar dentro do wrapper (como está na view PHP)
				if (!this._container) {
					const widgetDiv = this._body.querySelector(".bubble-stats-widget");
					if (widgetDiv) {
						this._container = widgetDiv.querySelector(".bubble-stats-container");
					}
				}

				if (this._container) {
					if (isDebug) console.log("[BubbleStats] ✓ Container found in _body");
					return this._container;
				} else if (isDebug) {
					console.warn("[BubbleStats] Container not found in _body");
				}
			} else if (isDebug) {
				console.warn("[BubbleStats] _body is null!");
			}

			// Se não encontrou no _body, buscar no _target (onde o CWidgetView pode ter colocado)
			if (!this._container && this._target) {
				this._container = this._target.querySelector(".bubble-stats-container");
				if (this._container) {
					if (isDebug) {
						console.warn("[BubbleStats] ⚠ Container found in _target (should be in _body)");
					}
					// Tentar mover para dentro do _body se possível
					if (this._body) {
						const containerParent = this._container.parentElement;
						if (containerParent && containerParent !== this._body) {
							// Verificar se não há hierarquia circular
							if (!containerParent.contains(this._body)) {
								// Se o parent é o widget div, mover ele inteiro
								if (containerParent.classList.contains('bubble-stats-widget')) {
									try {
										// Limpar _body e mover widget div para dentro
										this._body.innerHTML = '';
										this._body.appendChild(containerParent);
										if (isDebug) console.log("[BubbleStats] ✓ Moved widget div from _target to _body");
									} catch (e) {
										console.error("[BubbleStats] ✗ Error moving widget div:", e);
									}
								} else {
									// Mover apenas o container
									try {
										this._body.appendChild(this._container);
										if (isDebug) console.log("[BubbleStats] ✓ Moved container from _target to _body");
									} catch (e) {
										console.error("[BubbleStats] ✗ Error moving container:", e);
									}
								}
							} else if (isDebug) {
								console.warn("[BubbleStats] ⚠ Cannot move - circular reference detected");
							}
						}
					}
					return this._container;
				}
			}

			// Última tentativa: buscar no documento (fallback)
			if (!this._container) {
				this._container = document.querySelector(".bubble-stats-container");
				if (this._container) {
					if (isDebug) console.warn("[BubbleStats] ⚠ Container found in document (fallback)");
					// Tentar mover para dentro do _body se possível
					if (this._body && this._container.parentElement && this._container.parentElement !== this._body) {
						const containerParent = this._container.parentElement;
						// Verificar se não há hierarquia circular
						if (!containerParent.contains(this._body)) {
							try {
								if (containerParent.classList.contains('bubble-stats-widget')) {
									this._body.innerHTML = '';
									this._body.appendChild(containerParent);
									if (isDebug) console.log("[BubbleStats] ✓ Moved widget div from document to _body");
								} else {
									this._body.appendChild(this._container);
									if (isDebug) console.log("[BubbleStats] ✓ Moved container from document to _body");
								}
							} catch (e) {
								console.error("[BubbleStats] ✗ Error moving from document:", e);
							}
						} else if (isDebug) {
							console.warn("[BubbleStats] ⚠ Cannot move from document - circular reference");
						}
					}
					return this._container;
				}
			}

			// Se ainda não encontrou, buscar por ID
			if (!this._container) {
				const containers = document.querySelectorAll("[id^='bubble-container-']");
				if (containers.length > 0) {
					this._container = containers[0];
					if (isDebug) console.warn("[BubbleStats] ⚠ Container found by ID (fallback)");
					// Tentar mover para dentro do _body
					if (this._body && this._container.parentElement && this._container.parentElement !== this._body) {
						const containerParent = this._container.parentElement;
						// Verificar se não há hierarquia circular
						if (!containerParent.contains(this._body)) {
							try {
								if (containerParent.classList.contains('bubble-stats-widget')) {
									this._body.innerHTML = '';
									this._body.appendChild(containerParent);
									if (isDebug) console.log("[BubbleStats] ✓ Moved widget div (found by ID) to _body");
								} else {
									this._body.appendChild(this._container);
									if (isDebug) console.log("[BubbleStats] ✓ Moved container (found by ID) to _body");
								}
							} catch (e) {
								console.error("[BubbleStats] ✗ Error moving container found by ID:", e);
							}
						} else if (isDebug) {
							console.warn("[BubbleStats] ⚠ Cannot move container found by ID - circular reference");
						}
					}
					return this._container;
				}
			}

			// Se ainda não encontrou, criar o container manualmente
			if (!this._container && this._body) {
				if (isDebug) {
					console.warn("[BubbleStats] Container not found, creating it manually...");
				}

				// Criar wrapper se não existir
				let widgetDiv = this._body.querySelector(".bubble-stats-widget");
				if (!widgetDiv) {
					widgetDiv = document.createElement("div");
					widgetDiv.className = "bubble-stats-widget";
					this._body.appendChild(widgetDiv);
				}

				// Criar container
				this._container = document.createElement("div");
				this._container.className = "bubble-stats-container";
				widgetDiv.appendChild(this._container);

				if (isDebug) {
					console.log("[BubbleStats] ✓ Container created manually");
				}
			} else if (!this._container) {
				console.error("[BubbleStats] ✗ Container not found anywhere and _body is null!");
			}
		}
		return this._container;
	}

	_renderBubbles(bubblesData, settings) {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;

		if (isDebug) {
			console.log("[BubbleStats] _renderBubbles called with", bubblesData.length, "bubbles");
		}

		this._findOrCreateContainer();

		if (!this._container) {
			console.error("[BubbleStats] Container is still null!");
			return;
		}

		// Garantir que o container está visível e tem dimensões
		if (this._container.offsetParent === null) {
			if (isDebug) {
				console.warn("[BubbleStats] Container is not visible, waiting...");
			}
			setTimeout(() => this._renderBubbles(bubblesData, settings), 100);
			return;
		}

		// Garantir que o widget div ocupe todo o espaço disponível
		const widgetDiv = this._container.closest('.bubble-stats-widget') ||
			(this._body ? this._body.querySelector('.bubble-stats-widget') : null);
		if (widgetDiv) {
			Object.assign(widgetDiv.style, {
				width: '100%',
				height: '100%',
				minHeight: '200px',
				position: 'relative',
				display: 'block'
			});
		}

		// CRÍTICO: Garantir que o container não sobreponha o header do widget
		// O container deve estar dentro do _body, que já está posicionado abaixo do header
		// Seguindo o padrão do Echarts-Zabbix, aplicamos position: absolute com top: 0
		// mas o _body já está posicionado corretamente abaixo do header pelo CWidgetView
		// Aplicar estilos apenas se necessário para garantir comportamento correto
		const currentPosition = window.getComputedStyle(this._container).position;
		if (currentPosition !== 'absolute') {
			// Usar Object.assign para preservar estilos existentes do CSS
			Object.assign(this._container.style, {
				position: 'absolute',
				top: '0',
				left: '0',
				right: '0',
				bottom: '0',
				width: '100%',
				height: '100%',
				overflow: 'hidden'
			});
			if (isDebug) {
				console.log("[BubbleStats] Applied container positioning styles");
			}
		}

		// CRÍTICO: Garantir que o container esteja dentro do _body
		// O _body é criado pelo CWidgetView e já está posicionado abaixo do header
		if (this._body && this._container) {
			if (!this._body.contains(this._container)) {
				if (isDebug) {
					console.warn("[BubbleStats] ⚠ Container is NOT inside _body! Moving it now...");
					console.warn("[BubbleStats] Container parent:", this._container.parentElement);
				}

				// Verificar se o container ou seus pais contêm o _body (evitar hierarquia circular)
				let currentElement = this._container;
				let containsBody = false;
				while (currentElement && currentElement !== document.body) {
					if (currentElement === this._body || currentElement.contains(this._body)) {
						containsBody = true;
						break;
					}
					currentElement = currentElement.parentElement;
				}

				if (containsBody) {
					// Hierarquia circular detectada - criar novo container dentro do _body
					if (isDebug) {
						console.warn("[BubbleStats] ⚠ Circular hierarchy detected - creating new container in _body");
					}

					// Criar novo container dentro do _body
					this._body.innerHTML = '';
					const newContainer = document.createElement('div');
					newContainer.className = 'bubble-stats-container';
					this._body.appendChild(newContainer);
					this._container = newContainer;

					if (isDebug) {
						console.log("[BubbleStats] ✓ Created new container inside _body");
					}
					// Continuar com a renderização usando o novo container
				} else {
					// Tentar encontrar o widget wrapper
					let widgetDiv = this._container.closest(".bubble-stats-widget");

					// Se encontrou o widget div, mover ele inteiro para dentro do _body
					if (widgetDiv) {
						// Verificar se widgetDiv não contém _body
						if (!widgetDiv.contains(this._body) && !this._body.contains(widgetDiv)) {
							// Limpar o _body primeiro (caso tenha conteúdo antigo)
							this._body.innerHTML = '';
							// Mover o widget div para dentro do _body
							this._body.appendChild(widgetDiv);
							if (isDebug) {
								console.log("[BubbleStats] ✓ Moved widget div into _body");
							}
						} else if (isDebug) {
							console.warn("[BubbleStats] ⚠ Cannot move widgetDiv - circular reference");
						}
					} else {
						// Se não encontrou o widget div, mover apenas o container
						// Mas primeiro verificar se o container tem um parent que precisa ser movido
						const containerParent = this._container.parentElement;
						if (containerParent && containerParent !== this._body) {
							// Verificar se containerParent não contém _body
							if (!containerParent.contains(this._body)) {
								// Se o parent não é o _body, tentar mover o parent inteiro
								if (containerParent.parentElement) {
									try {
										// Remover o parent do lugar atual
										containerParent.parentElement.removeChild(containerParent);
										// Adicionar ao _body
										this._body.appendChild(containerParent);
										if (isDebug) {
											console.log("[BubbleStats] ✓ Moved container parent into _body");
										}
									} catch (e) {
										console.error("[BubbleStats] ✗ Error moving container parent:", e);
										// Fallback: tentar mover apenas o container
										try {
											this._container.parentElement.removeChild(this._container);
											this._body.appendChild(this._container);
											if (isDebug) {
												console.log("[BubbleStats] ✓ Moved container directly (fallback)");
											}
										} catch (e2) {
											console.error("[BubbleStats] ✗ Error moving container:", e2);
										}
									}
								} else {
									// Se não tem parent, mover o container diretamente
									try {
										this._body.appendChild(this._container);
										if (isDebug) {
											console.log("[BubbleStats] ✓ Moved container directly into _body");
										}
									} catch (e) {
										console.error("[BubbleStats] ✗ Error moving container:", e);
									}
								}
							} else if (isDebug) {
								console.warn("[BubbleStats] ⚠ Cannot move containerParent - it contains _body");
							}
						} else if (!containerParent) {
							// Container não tem parent, pode ser adicionado diretamente
							try {
								this._body.appendChild(this._container);
								if (isDebug) {
									console.log("[BubbleStats] ✓ Moved container directly (no parent)");
								}
							} catch (e) {
								console.error("[BubbleStats] ✗ Error moving container:", e);
							}
						}
					}

					// Verificar novamente se agora está dentro do _body
					if (this._body.contains(this._container)) {
						if (isDebug) {
							console.log("[BubbleStats] ✓ Container is now correctly inside _body");
						}
					} else {
						console.error("[BubbleStats] ✗ Failed to move container into _body");
					}
				}
			} else if (isDebug) {
				console.log("[BubbleStats] ✓ Container is correctly inside _body");
			}

			// Verificar sobreposição com o header (mesmo que esteja no _body agora)
			if (isDebug) {
				const widgetHeader = this._target ? this._target.querySelector('.dashboard-widget-head') : null;
				if (widgetHeader) {
					const headerRect = widgetHeader.getBoundingClientRect();
					const containerRect = this._container.getBoundingClientRect();

					if (containerRect.top < headerRect.bottom) {
						console.warn("[BubbleStats] ⚠ Container may be overlapping widget header");
						console.warn("[BubbleStats] Header bottom:", headerRect.bottom, "Container top:", containerRect.top);
					}
				}
			}

			// Garantir que o container tenha pointer-events: none para não bloquear o header
			// As bolhas terão pointer-events: auto individualmente
			const computedPointerEvents = window.getComputedStyle(this._container).pointerEvents;
			if (computedPointerEvents !== 'none') {
				this._container.style.pointerEvents = 'none';
				if (isDebug) {
					console.log("[BubbleStats] Applied pointer-events: none to container");
				}
			}
		} else {
			if (isDebug) {
				if (!this._body) {
					console.warn("[BubbleStats] ⚠ _body is null, cannot verify container position");
				}
				if (!this._container) {
					console.warn("[BubbleStats] ⚠ Container is null");
				}
			}
		}

		// Parar animação anterior se existir
		if (this._animationFrameId) {
			cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}

		this._container.innerHTML = "";
		this._bubbles = [];
		this._bubbleData = [];

		// Obter dimensões do container de forma mais confiável
		// Usar getBoundingClientRect para obter dimensões reais
		const rect = this._container.getBoundingClientRect();
		const containerWidth = rect.width || this._container.clientWidth || this._container.offsetWidth || 400;
		const containerHeight = rect.height || this._container.clientHeight || this._container.offsetHeight || 300;

		// Garantir dimensões mínimas válidas
		const validWidth = Math.max(containerWidth, 200);
		const validHeight = Math.max(containerHeight, 200);

		// Armazenar tamanho do container para redimensionamento proporcional
		// SEMPRE atualizar o tamanho do container (será usado no próximo redimensionamento)
		this._lastContainerSize = { width: validWidth, height: validHeight };
		// Atualizar dimensões atuais para física
		this._currentContainerWidth = validWidth;
		this._currentContainerHeight = validHeight;

		if (isDebug) {
			console.log("[BubbleStats] Container dimensions:", validWidth, "x", validHeight);
		}

		// Calcular fator de escala baseado no tamanho do container
		// Quanto maior o container, MAIOR as bolhas (comportamento correto)
		// Quanto menor o container, MENOR as bolhas (diminuição agressiva)
		// Usar área de referência de 400x300 como base (120000 pixels)
		const referenceArea = 400 * 300; // 120000
		const currentArea = validWidth * validHeight;
		const areaRatio = currentArea / referenceArea;

		// Usar curva assimétrica: quando container diminui, diminuir mais agressivamente
		let sizeScale;
		if (areaRatio >= 1) {
			// Container maior ou igual à referência: usar raiz quadrada normal
			sizeScale = Math.sqrt(areaRatio);
		} else {
			// Container menor que referência: usar potência maior para diminuir mais agressivamente
			// areaRatio^0.7 diminui mais rápido que sqrt quando < 1
			sizeScale = Math.pow(areaRatio, 0.7);
		}

		// Limitar escala entre 0.15 e 2.0
		// Quando container diminui muito, bolhas podem diminuir até 0.15x (muito pequenas)
		// Quando container aumenta muito, bolhas podem aumentar até 2.0x
		let finalSizeScale = Math.max(0.15, Math.min(sizeScale, 2.0));

		// IMPORTANTE: Reduzir tamanho quando há muitas bolhas para evitar sobreposição
		// Quanto mais bolhas, menor elas devem ser para caber no container
		const bubbleCount = bubblesData.length;
		const referenceBubbleCount = 20; // Número de referência de bolhas
		const highDensityThreshold = 50; // Quando há mais de 50 bolhas, reduzir ainda mais
		const veryHighDensityThreshold = 100; // Quando há mais de 100 bolhas, reduzir muito mais
		let densityScale = 1.0;

		if (bubbleCount > referenceBubbleCount) {
			// Quando há mais bolhas que a referência, reduzir proporcionalmente
			const densityRatio = referenceBubbleCount / bubbleCount;

			if (bubbleCount > veryHighDensityThreshold) {
				// Mais de 100 bolhas: redução muito mais agressiva usando potência menor
				// Usar potência 0.5 para reduzir ainda mais (raiz quadrada do ratio)
				densityScale = Math.pow(densityRatio, 0.5);
			} else if (bubbleCount > highDensityThreshold) {
				// Mais de 50 bolhas: redução mais agressiva usando potência maior
				// Usar potência 0.6 em vez de 0.5 (raiz quadrada) para reduzir mais
				densityScale = Math.pow(densityRatio, 0.6);
			} else {
				// Entre 20 e 50 bolhas: usar raiz quadrada para redução suave mas efetiva
				densityScale = Math.sqrt(densityRatio);
			}
		}

		// Aplicar fator de densidade ao tamanho final
		finalSizeScale = finalSizeScale * densityScale;

		// Garantir que não fique muito pequeno (mínimo absoluto de 0.1)
		finalSizeScale = Math.max(0.1, finalSizeScale);

		if (isDebug) {
			console.log("[BubbleStats] Size scale:", {
				referenceArea,
				currentArea,
				areaRatio: areaRatio.toFixed(3),
				sizeScale: sizeScale.toFixed(3),
				bubbleCount: bubbleCount,
				densityScale: densityScale.toFixed(3),
				finalSizeScale: finalSizeScale.toFixed(3)
			});
		}

		// Calcular min/max dos valores reais para normalização
		const values = bubblesData.map(d => Math.abs(d.value || 0));
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const valueRange = maxValue - minValue || 1; // Evitar divisão por zero

		if (isDebug) {
			console.log('[BubbleStats] Value range:', { minValue, maxValue, valueRange });
		}

		// Criar todas as bolhas primeiro
		bubblesData.forEach((data, index) => {
			const value = data.value || 0;
			const absValue = Math.abs(value);

			// Tamanho baseado no valor real do item, proporcional ao min/max
			// Normalizar o valor entre 0 e 1 baseado no range de valores
			const normalized = valueRange > 0 ? (absValue - minValue) / valueRange : 0;

			// Tamanhos base escalados proporcionalmente ao container
			const baseMinSize = 60;  // Bolhas pequenas para valores baixos (tamanho base)
			const baseMaxSize = 180; // Bolhas grandes para valores altos (tamanho base)
			const minSize = baseMinSize * finalSizeScale;  // Escalar proporcionalmente
			const maxSize = baseMaxSize * finalSizeScale;  // Escalar proporcionalmente

			// Usar curva para suavizar a distribuição de tamanhos
			const curved = Math.pow(Math.min(normalized, 1), 0.65); // Curva mais suave
			const size = minSize + curved * (maxSize - minSize);

			const bubble = document.createElement("div");
			bubble.className = "bubble";

			// Determinar cor baseado no valor (valores altos = vermelho, baixos = verde)
			// Usar mediana como ponto de referência
			const median = (minValue + maxValue) / 2;
			const isPositive = value < median; // Valores abaixo da mediana são "bons" (verde)

			// Intensidade baseada na distância da mediana
			const distanceFromMedian = Math.abs(value - median);
			const maxDistance = Math.max(median - minValue, maxValue - median) || 1;
			const intensity = Math.min(distanceFromMedian / maxDistance, 1);
			const baseOpacity = 0.4 + (intensity * 0.4); // 0.4 a 0.8 - mais opaco e vibrante

			// Cores mais vibrantes e saturadas como na imagem
			// Cores padrão do Zabbix (Severidades + OK)
			const ZABBIX_COLORS = {
				green: '#43A047',   // OK / Recovered
				blue: '#1E88E5',    // Information
				yellow: '#FBC02D',  // Warning
				orange: '#F57C00',  // Average
				dorange: '#E64A19', // High
				red: '#D32F2F',     // Disaster
				gray: '#78909C'     // Not classified
			};

			let gradientColor;

			if (data.type === 'problem') {
				// Lógica existente para problemas
				const severity = parseInt(data.severity || 0);
				switch (severity) {
					case 5: gradientColor = ZABBIX_COLORS.red; break;
					case 4: gradientColor = ZABBIX_COLORS.dorange; break;
					case 3: gradientColor = ZABBIX_COLORS.orange; break;
					case 2: gradientColor = ZABBIX_COLORS.yellow; break;
					case 1: gradientColor = ZABBIX_COLORS.blue; break;
					default: gradientColor = ZABBIX_COLORS.gray;
				}
			} else {
				// Lógica de Threshold e Severidade Combinada
				const threshold = parseFloat(this._fields_values?.threshold_value || 100);

				// Verificar severidade do Zabbix (Override)
				// Se severidade >= 2 (Warning), usa a cor da severidade
				const zabbixSeverity = parseInt(data.severity || 0);

				if (zabbixSeverity >= 2) {
					// Usar cor da severidade do Zabbix
					switch (zabbixSeverity) {
						case 5: gradientColor = ZABBIX_COLORS.red; break;     // Disaster
						case 4: gradientColor = ZABBIX_COLORS.dorange; break; // High
						case 3: gradientColor = ZABBIX_COLORS.orange; break;  // Average
						case 2: gradientColor = ZABBIX_COLORS.yellow; break;  // Warning
						default: gradientColor = ZABBIX_COLORS.gray;
					}
				} else {
					// Lógica de Threshold para Métricas
					// Calcular porcentagem em relação ao threshold
					let percentageOfThreshold = 0;
					if (threshold > 0) {
						percentageOfThreshold = (value / threshold) * 100;
					}

					// Aplicar regras de cor baseadas no threshold
					if (percentageOfThreshold < 80) {
						gradientColor = ZABBIX_COLORS.green;  // 0 - 80%
					} else if (percentageOfThreshold < 90) {
						gradientColor = ZABBIX_COLORS.yellow; // 80% - 90%
					} else {
						gradientColor = ZABBIX_COLORS.red;    // > 90%
					}
				}
			}

			// Calcular cor final com maior opacidade e brilho
			const finalOpacity = Math.min(baseOpacity + 0.15, 0.95);
			const finalGradientColor = gradientColor.replace(/[\d.]+(?=\)$)/, finalOpacity.toFixed(2));

			// Gradiente radial mais vibrante e com melhor contraste (como na imagem)
			bubble.style.background = `radial-gradient(circle at center, 
				rgba(0, 0, 0, 0.3) 0%, 
				rgba(0, 0, 0, 0.2) 20%, 
				rgba(0, 0, 0, 0.1) 40%, 
				${gradientColor} 70%, 
				${finalGradientColor} 100%)`;

			// Aplicar apenas estilos essenciais - o resto vem do CSS
			// Usar setProperty com important para garantir que seja aplicado
			bubble.style.setProperty('width', `${size}px`, 'important');
			bubble.style.setProperty('height', `${size}px`, 'important');

			const radius = size / 2;

			// Posição inicial - tentar evitar sobreposição desde o início
			// Tentar posições aleatórias até encontrar uma que não sobreponha muito
			let initialX, initialY;
			let attempts = 0;
			const maxAttempts = 50;

			do {
				initialX = radius + Math.random() * (validWidth - size);
				initialY = radius + Math.random() * (validHeight - size);
				attempts++;

				// Verificar se há sobreposição significativa com bolhas já criadas
				let hasOverlap = false;
				for (const existing of this._bubbleData) {
					const dx = initialX - existing.x;
					const dy = initialY - existing.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const minDist = radius + existing.radius + 5; // Margem de segurança

					if (distance < minDist) {
						hasOverlap = true;
						break;
					}
				}

				if (!hasOverlap || attempts >= maxAttempts) break;
			} while (attempts < maxAttempts);

			// Criar objeto de dados de física para a bolha
			const bubblePhysics = {
				element: bubble,
				data: data,
				x: initialX,
				y: initialY,
				vx: (Math.random() - 0.5) * 2, // Velocidade inicial aleatória
				vy: (Math.random() - 0.5) * 2,
				radius: radius,
				size: size,
				baseSize: size, // Tamanho original baseado no valor (para redimensionamento proporcional)
				baseRadius: radius // Raio original
			};

			// Posição inicial (será ajustada pela física)
			bubble.style.left = `${initialX - radius}px`;
			bubble.style.top = `${initialY - radius}px`;

			// Criar elementos usando classes CSS - design simplificado
			// Mostrar apenas: Nome, Valor (porcentagem OU valor absoluto), Imagem (se houver)

			// Imagem primeiro (se disponível)
			if (data.image) {
				const imageEl = document.createElement("img");
				imageEl.className = "bubble-image";
				imageEl.src = data.image;
				imageEl.alt = data.name || "Item";
				imageEl.style.width = `${Math.max(20, size / 4)}px`;
				imageEl.style.height = `${Math.max(20, size / 4)}px`;
				imageEl.style.objectFit = "contain";
				imageEl.style.marginBottom = "4px";
				bubble.appendChild(imageEl);
			}

			// Nome do item - mais destacado
			const nameEl = document.createElement("div");
			nameEl.className = "bubble-name";

			// Typography Logic: Hide name if bubble < 50px
			if (size < 50) {
				nameEl.style.display = 'none';
			}

			// Improved font scaling: size/5.5 (min 10, max 24)
			const nameSize = Math.min(24, Math.max(10, size / 5.5));
			nameEl.style.fontSize = `${nameSize}px`;
			nameEl.style.fontWeight = "600"; // Semi-bold
			nameEl.style.maxWidth = `${size - 10}px`;
			nameEl.style.marginBottom = "4px";
			nameEl.textContent = (data.name || "Unknown").substring(0, 25); // Mais caracteres
			bubble.appendChild(nameEl);

			// Valor: sempre mostrar o valor real formatado do item
			const valueEl = document.createElement("div");
			valueEl.className = "bubble-value";

			// Improved font scaling: size/4 (min 12, max 28)
			// If small bubble (no name), make value slightly larger relative to size
			const valScale = size < 50 ? 3.5 : 4;
			const valSize = Math.min(28, Math.max(12, size / valScale));

			valueEl.style.fontSize = `${valSize}px`;
			valueEl.style.fontWeight = "700"; // Bold para destacar
			valueEl.style.opacity = "1.0";

			// Sempre mostrar o valor real formatado
			if (data.value !== undefined && data.value !== null) {
				// Formatar valor numérico
				let valueStr;
				if (typeof data.value === 'number') {
					// Formatar com decimais apropriados baseado no tamanho do valor
					if (Math.abs(data.value) < 0.0001) {
						valueStr = "0";
					} else if (Number.isInteger(data.value)) {
						valueStr = data.value.toString();
					} else {
						// Remove zeros à direita desnecessários
						valueStr = parseFloat(data.value.toFixed(2)).toString();
					}
				} else {
					valueStr = String(data.value);
				}
				valueEl.textContent = valueStr + (data.units ? " " + data.units : "");
			} else {
				// Sem valor disponível
				valueEl.textContent = "N/A";
				valueEl.style.opacity = "0.6";
			}

			bubble.appendChild(valueEl);

			// Adicionar classe positiva/negativa para estilização CSS adicional
			if (isPositive) {
				bubble.classList.add("positive");
			} else {
				bubble.classList.add("negative");
			}

			// Remover tooltip padrão do HTML para evitar conflito com tooltip customizado
			// O tooltip customizado será usado em vez do padrão
			bubble.title = '';

			// Adicionar eventos para tooltip avançado com gráfico
			this._setupAdvancedTooltip(bubble, data);

			// Setup Drag Events
			this._setupDragEvents(bubble, bubblePhysics);

			// Garantir que a bolha seja adicionada ao container correto
			if (this._container && this._container.parentElement) {
				try {
					// Verificar se bubble não é o container ou um de seus ancestrais
					if (bubble !== this._container && !this._container.contains(bubble)) {
						this._container.appendChild(bubble);
						this._bubbles.push(bubble);
						this._bubbleData.push(bubblePhysics);
					} else {
						console.error("[BubbleStats] Cannot append bubble - circular reference detected");
					}
				} catch (e) {
					console.error("[BubbleStats] Error appending bubble:", e);
				}
			} else {
				console.error("[BubbleStats] Cannot append bubble - container invalid:", this._container);
			}
		});

		// Resolver sobreposições iniciais rapidamente (poucas iterações)
		// A física contínua fará o trabalho principal de separação
		this._resolveInitialOverlaps(validWidth, validHeight, 20); // Apenas 20 iterações iniciais

		// Iniciar loop de física se habilitado
		// A física contínua garantirá que nunca se sobreponham
		if (this._physicsEnabled && this._bubbleData.length > 0) {
			this._startPhysics(validWidth, validHeight);
		}

		if (isDebug) {
			console.log("[BubbleStats] Rendered", this._bubbles.length, "bubbles successfully");
		}
	}

	_resolveInitialOverlaps(containerWidth, containerHeight, maxIterationsOverride = null) {
		// Algoritmo de força direcionada (similar ao cryptobubbles.net)
		// A física contínua fará a maior parte do trabalho
		const maxIterations = maxIterationsOverride || 100; // Mais iterações para melhor separação
		const minDistance = 8; // Distância mínima entre bordas (aumentada de 2 para 8)
		const forceMultiplier = 3.0; // Multiplicador de força mais agressivo (aumentado de 2.0 para 3.0)

		for (let iter = 0; iter < maxIterations; iter++) {
			let totalOverlap = 0;
			let maxOverlap = 0;

			// Primeiro passo: calcular todas as forças de repulsão
			const forces = this._bubbleData.map(() => ({ fx: 0, fy: 0 }));

			for (let i = 0; i < this._bubbleData.length; i++) {
				const bubble = this._bubbleData[i];

				// Força de repulsão de outras bolhas
				for (let j = i + 1; j < this._bubbleData.length; j++) {
					const other = this._bubbleData[j];
					const dx = other.x - bubble.x;
					const dy = other.y - bubble.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const minDist = bubble.radius + other.radius + minDistance;

					if (distance < minDist) {
						if (distance === 0) {
							// Caso especial: mesma posição - separar aleatoriamente
							const angle = Math.random() * Math.PI * 2;
							const separation = minDist;
							forces[i].fx -= Math.cos(angle) * separation * forceMultiplier;
							forces[i].fy -= Math.sin(angle) * separation * forceMultiplier;
							forces[j].fx += Math.cos(angle) * separation * forceMultiplier;
							forces[j].fy += Math.sin(angle) * separation * forceMultiplier;
							totalOverlap += minDist;
							maxOverlap = Math.max(maxOverlap, minDist);
						} else {
							// Calcular força de repulsão proporcional à sobreposição
							const overlap = minDist - distance;
							totalOverlap += overlap;
							maxOverlap = Math.max(maxOverlap, overlap);

							// Força inversamente proporcional à distância (mais forte quando mais próximo)
							const force = (overlap / distance) * forceMultiplier;
							const fx = (dx / distance) * force;
							const fy = (dy / distance) * force;

							forces[i].fx -= fx;
							forces[i].fy -= fy;
							forces[j].fx += fx;
							forces[j].fy += fy;
						}
					}
				}

				// Força de repulsão das bordas
				const margin = bubble.radius + minDistance;
				if (bubble.x - margin < 0) {
					forces[i].fx += (margin - bubble.x) * forceMultiplier;
					totalOverlap += margin - bubble.x;
				}
				if (bubble.x + margin > containerWidth) {
					forces[i].fx -= (bubble.x + margin - containerWidth) * forceMultiplier;
					totalOverlap += bubble.x + margin - containerWidth;
				}
				if (bubble.y - margin < 0) {
					forces[i].fy += (margin - bubble.y) * forceMultiplier;
					totalOverlap += margin - bubble.y;
				}
				if (bubble.y + margin > containerHeight) {
					forces[i].fy -= (bubble.y + margin - containerHeight) * forceMultiplier;
					totalOverlap += bubble.y + margin - containerHeight;
				}
			}

			// Segundo passo: aplicar forças (com amortecimento progressivo)
			const damping = 1.0 - (iter / maxIterations) * 0.3; // Reduz movimento nas últimas iterações
			for (let i = 0; i < this._bubbleData.length; i++) {
				const bubble = this._bubbleData[i];
				bubble.x += forces[i].fx * damping;
				bubble.y += forces[i].fy * damping;

				// Garantir que fique dentro dos limites
				const margin = bubble.radius + minDistance;
				bubble.x = Math.max(margin, Math.min(bubble.x, containerWidth - margin));
				bubble.y = Math.max(margin, Math.min(bubble.y, containerHeight - margin));
			}

			// Parar se não há sobreposição significativa
			if (totalOverlap < 0.01 || (iter > 10 && maxOverlap < 1.0)) break;
		}

		// Aplicar posições resolvidas
		this._bubbleData.forEach(bubble => {
			bubble.element.style.left = `${bubble.x - bubble.radius}px`;
			bubble.element.style.top = `${bubble.y - bubble.radius}px`;
		});
	}

	_startPhysics(containerWidth, containerHeight) {
		// Atualizar dimensões atuais
		this._currentContainerWidth = containerWidth;
		this._currentContainerHeight = containerHeight;

		const animate = () => {
			if (this._physicsEnabled && this._bubbleData.length > 0) {
				// Sempre usar as dimensões mais atualizadas do container
				const width = this._currentContainerWidth || containerWidth;
				const height = this._currentContainerHeight || containerHeight;
				this._updatePhysics(width, height);
				this._renderBubblesPhysics();
			}
			this._animationFrameId = requestAnimationFrame(animate);
		};
		animate();
	}

	_updatePhysics(containerWidth, containerHeight) {
		// Velocidade de animação reduzida para comportamento mais suave
		const speed = 0.8; // Reduzido de 1.0 para 0.8

		// Primeiro passo: atualizar posições
		this._bubbleData.forEach((bubble) => {
			// Skip physics update for dragged bubble
			if (bubble === this._draggedBubble) return;

			bubble.x += bubble.vx * speed;
			bubble.y += bubble.vy * speed;
		});

		// Segundo passo: colisão com bordas
		this._bubbleData.forEach((bubble) => {
			if (bubble.x - bubble.radius < 0) {
				bubble.x = bubble.radius;
				bubble.vx *= -0.7; // Reduzido de -0.8 para menos rebote
			}
			if (bubble.x + bubble.radius > containerWidth) {
				bubble.x = containerWidth - bubble.radius;
				bubble.vx *= -0.7;
			}
			if (bubble.y - bubble.radius < 0) {
				bubble.y = bubble.radius;
				bubble.vy *= -0.7;
			}
			if (bubble.y + bubble.radius > containerHeight) {
				bubble.y = containerHeight - bubble.radius;
				bubble.vy *= -0.7;
			}
		});

		// Terceiro passo: colisão entre bolhas (algoritmo mais estável)
		const minDistance = 10; // Distância mínima entre bordas (aumentada de 5 para 10)
		for (let i = 0; i < this._bubbleData.length; i++) {
			const bubble = this._bubbleData[i];

			for (let j = i + 1; j < this._bubbleData.length; j++) {
				const other = this._bubbleData[j];
				const dx = other.x - bubble.x;
				const dy = other.y - bubble.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const minDist = bubble.radius + other.radius + minDistance;

				if (distance < minDist && distance > 0) {
					const angle = Math.atan2(dy, dx);
					const overlap = minDist - distance;

					// Separar posições imediatamente (100% do overlap para garantir separação completa)
					const separation = overlap; // Aumentado de 0.6 para 1.0 (100%)
					bubble.x -= Math.cos(angle) * separation * 0.5;
					bubble.y -= Math.sin(angle) * separation * 0.5;
					other.x += Math.cos(angle) * separation * 0.5;
					other.y += Math.sin(angle) * separation * 0.5;

					// Aplicar força de repulsão mais forte para evitar colisões
					const force = overlap * 0.25; // Aumentado de 0.15 para 0.25
					const fx = Math.cos(angle) * force;
					const fy = Math.sin(angle) * force;

					bubble.vx -= fx;
					bubble.vy -= fy;
					other.vx += fx;
					other.vy += fy;
				} else if (distance === 0) {
					// Caso extremo: mesma posição - separar imediatamente
					const angle = Math.random() * Math.PI * 2;
					const separation = minDist;
					bubble.x -= Math.cos(angle) * separation * 0.5;
					bubble.y -= Math.sin(angle) * separation * 0.5;
					other.x += Math.cos(angle) * separation * 0.5;
					other.y += Math.sin(angle) * separation * 0.5;
				}
			}
		}

		// Quarto passo: aplicar atrito (mais forte para estabilizar)
		this._bubbleData.forEach((bubble) => {
			bubble.vx *= 0.98; // Aumentado de 0.99 para 0.98 (mais atrito)
			bubble.vy *= 0.98;

			// Limitar velocidade máxima para evitar comportamento errático
			const maxVelocity = 3.0;
			if (Math.abs(bubble.vx) > maxVelocity) {
				bubble.vx = bubble.vx > 0 ? maxVelocity : -maxVelocity;
			}
			if (Math.abs(bubble.vy) > maxVelocity) {
				bubble.vy = bubble.vy > 0 ? maxVelocity : -maxVelocity;
			}
		});
	}

	_renderBubblesPhysics() {
		this._bubbleData.forEach(bubble => {
			bubble.element.style.left = `${bubble.x - bubble.radius}px`;
			bubble.element.style.top = `${bubble.y - bubble.radius}px`;
		});
	}



	_setupDragEvents(bubbleElement, bubblePhysics) {
		bubbleElement.addEventListener('mousedown', (e) => this._handleDragStart(e, bubblePhysics));
		// Touch events for mobile
		bubbleElement.addEventListener('touchstart', (e) => {
			if (e.touches && e.touches.length > 0) {
				// Prevent scrolling while dragging
				e.preventDefault();
				const touch = e.touches[0];
				// Mock mouse event for reuse
				this._handleDragStart({
					clientX: touch.clientX,
					clientY: touch.clientY,
					target: e.target,
					preventDefault: () => { }
				}, bubblePhysics);
			}
		}, { passive: false });
	}

	_handleDragStart(e, bubblePhysics) {
		// Only left click
		if (e.button !== undefined && e.button !== 0) return;

		this._isDragging = true;
		this._draggedBubble = bubblePhysics;

		// Calculate offset from bubble center to mouse/touch
		// We use bubble.x which is center coordinate in physics model
		// But event clientX is screen coordinate
		// Need to map screen coordinate to container coordinate
		const containerRect = this._container.getBoundingClientRect();
		const mouseX = e.clientX - containerRect.left;
		const mouseY = e.clientY - containerRect.top;

		this._dragOffsetX = mouseX - bubblePhysics.x;
		this._dragOffsetY = mouseY - bubblePhysics.y;

		// Stop velocity while dragging
		bubblePhysics.vx = 0;
		bubblePhysics.vy = 0;

		// Add global listeners for move/up since mouse can leave bubble
		document.addEventListener('mousemove', this._boundDragMove = (ev) => this._handleDragMove(ev));
		document.addEventListener('mouseup', this._boundDragEnd = () => this._handleDragEnd());

		// Touch variants
		document.addEventListener('touchmove', this._boundTouchMove = (ev) => {
			if (ev.touches && ev.touches.length > 0) {
				const touch = ev.touches[0];
				this._handleDragMove({
					clientX: touch.clientX,
					clientY: touch.clientY,
					preventDefault: () => ev.preventDefault() // Block scroll
				});
			}
		}, { passive: false });
		document.addEventListener('touchend', this._boundTouchEnd = () => this._handleDragEnd());

		// Add grabbing cursor style
		bubblePhysics.element.style.cursor = 'grabbing';
		document.body.style.cursor = 'grabbing';
	}

	_handleDragMove(e) {
		if (!this._isDragging || !this._draggedBubble || !this._container) return;

		// Prevent default behavior (selection, scrolling on touch)
		if (e.preventDefault) e.preventDefault();

		const containerRect = this._container.getBoundingClientRect();
		const mouseX = e.clientX - containerRect.left;
		const mouseY = e.clientY - containerRect.top;

		// Update bubble position respecting offset
		let newX = mouseX - this._dragOffsetX;
		let newY = mouseY - this._dragOffsetY;

		// Clamp to container bounds
		const radius = this._draggedBubble.radius;
		const width = this._currentContainerWidth || this._container.offsetWidth;
		const height = this._currentContainerHeight || this._container.offsetHeight;

		newX = Math.max(radius, Math.min(newX, width - radius));
		newY = Math.max(radius, Math.min(newY, height - radius));

		// Update physics model
		this._draggedBubble.x = newX;
		this._draggedBubble.y = newY;

		// Reset velocity to zero to prevent drift
		this._draggedBubble.vx = 0;
		this._draggedBubble.vy = 0;

		// Direct DOM update for responsiveness (physics loop will also update)
		this._draggedBubble.element.style.left = `${newX - radius}px`;
		this._draggedBubble.element.style.top = `${newY - radius}px`;
	}

	_handleDragEnd() {
		if (!this._isDragging) return;

		this._isDragging = false;

		if (this._draggedBubble && this._draggedBubble.element) {
			this._draggedBubble.element.style.cursor = 'pointer';
		}
		this._draggedBubble = null;
		document.body.style.cursor = '';

		// Remove global listeners
		document.removeEventListener('mousemove', this._boundDragMove);
		document.removeEventListener('mouseup', this._boundDragEnd);
		document.removeEventListener('touchmove', this._boundTouchMove);
		document.removeEventListener('touchend', this._boundTouchEnd);
	}

	_setupAdvancedTooltip(bubble, data) {
		// Verificar se tooltip está habilitado
		const showTooltip = this._fields_values?.show_tooltip !== undefined
			? (this._fields_values.show_tooltip == 1 || this._fields_values.show_tooltip === true)
			: true; // Padrão: mostrar tooltip se não especificado

		// Se tooltip estiver desabilitado, não adicionar eventos
		if (!showTooltip) {
			return;
		}

		// Armazenar referência aos dados na bolha para acesso fácil
		bubble._bubbleData = data;

		let tooltipTimeout;

		// Evento mouseenter - mostrar tooltip e carregar gráfico
		bubble.addEventListener('mouseenter', (e) => {
			// Use updated data from bubble property, fallback to initial data if missing
			const currentData = bubble._bubbleData || data;

			console.log('[BubbleStats] Mouse enter on bubble:', currentData.name, 'Data:', currentData);
			// Limpar timeout anterior se existir
			if (tooltipTimeout) {
				clearTimeout(tooltipTimeout);
			}

			// Mostrar tooltip imediatamente para teste (sem delay)
			console.log('[BubbleStats] Showing tooltip immediately');
			this._showAdvancedTooltip(bubble, currentData, e);
		});

		// Evento mouseleave - esconder tooltip
		bubble.addEventListener('mouseleave', () => {
			console.log('[BubbleStats] Mouse leave on bubble');
			if (tooltipTimeout) {
				clearTimeout(tooltipTimeout);
				tooltipTimeout = null;
			}
			this._hideAdvancedTooltip();
		});

		// Evento mousemove - atualizar posição do tooltip
		bubble.addEventListener('mousemove', (e) => {
			if (this._tooltip && this._tooltip.style.display !== 'none') {
				this._updateTooltipPosition(e);
			}
		});
	}

	_showAdvancedTooltip(bubble, data, event) {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;
		if (isDebug) {
			console.log('[BubbleStats] Showing advanced tooltip for:', data);
		}
		// Criar ou reutilizar tooltip
		if (!this._tooltip) {
			this._tooltip = document.createElement('div');
			this._tooltip.className = 'bubble-advanced-tooltip';
			this._tooltip.style.cssText = `
				position: fixed;
				background: rgba(0, 0, 0, 0.95);
				border: 1px solid #444;
				border-radius: 8px;
				padding: 12px;
				z-index: 10000;
				min-width: 300px;
				max-width: 500px;
				box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
				pointer-events: none;
				display: none;
			`;
			document.body.appendChild(this._tooltip);
		}

		// Verificar se o gráfico deve ser exibido no tooltip
		const showChart = this._fields_values?.show_chart_in_tooltip !== undefined
			? (this._fields_values.show_chart_in_tooltip == 1 || this._fields_values.show_chart_in_tooltip === true)
			: false; // Padrão: não mostrar gráfico se não especificado

		// Garantir que temos um ID para o container do gráfico (apenas se gráfico estiver habilitado)
		const chartContainerId = showChart ? `bubble-chart-container-${data.id || 'unknown-' + Date.now()}` : null;

		// Formatar valor para exibição
		let formattedValue = 'N/A';
		if (data.value !== undefined && data.value !== null) {
			if (typeof data.value === 'number') {
				// Formatar com decimais apropriados baseado no tamanho do valor
				if (Math.abs(data.value) < 0.0001) {
					formattedValue = "0";
				} else if (Number.isInteger(data.value)) {
					formattedValue = data.value.toString();
				} else {
					// Remove zeros à direita desnecessários
					formattedValue = parseFloat(data.value.toFixed(2)).toString();
				}
			} else {
				formattedValue = String(data.value);
			}
			if (data.units) {
				formattedValue += ' ' + data.units;
			}
		}

		// Informações básicas - mostrar apenas o valor formatado
		let html = `
			<div style="margin-bottom: ${showChart ? '8px' : '0px'};">
				<div style="font-weight: 700; font-size: 14px; color: #4a9eff; margin-bottom: 4px;">${this._escapeHtml(data.name || 'Unknown')}</div>
				${data.host ? `<div style="font-size: 11px; color: #999; margin-bottom: 2px;">Host: ${this._escapeHtml(data.host)}</div>` : ''}
				<div style="font-size: 12px; color: #fff; margin-top: 4px;">
					Value: <strong>${this._escapeHtml(formattedValue)}</strong>
				</div>
			</div>
		`;

		// Adicionar container do gráfico apenas se estiver habilitado
		if (showChart && chartContainerId) {
			html += `
				<div id="${chartContainerId}" style="width: 100%; height: 200px; margin-top: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
					<div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">${data.id ? 'Carregando gráfico...' : 'Gráfico disponível apenas para itens com ID'}</div>
				</div>
			`;
		}

		this._tooltip.innerHTML = html;
		this._tooltip.style.display = 'block';
		this._tooltip.style.visibility = 'visible';
		this._tooltip.style.opacity = '1';
		this._updateTooltipPosition(event);

		// Forçar atualização visual
		this._tooltip.offsetHeight; // Trigger reflow

		if (isDebug) {
			console.log('[BubbleStats] Tooltip displayed, showChart:', showChart);
			console.log('[BubbleStats] Loading history for item:', data.id);
			console.log('[BubbleStats] Tooltip position:', this._tooltip.style.left, this._tooltip.style.top);
			console.log('[BubbleStats] Tooltip visible:', this._tooltip.offsetParent !== null);
		}

		// Carregar histórico e renderizar gráfico apenas se estiver habilitado
		if (showChart && chartContainerId) {
			if (data.id && (data.type === 'metric' || !data.type)) {
				// Pass current value and timestamp to ensure chart is up-to-date
				const currentVal = typeof data.value === 'number' ? data.value : parseFloat(data.value);
				const currentClock = Math.floor(Date.now() / 1000);
				this._loadItemHistory(data.id, data.units || '', data.name || '', chartContainerId, currentVal, currentClock);
			} else if (data.id) {
				// Para problemas, não carregar gráfico
				const container = document.getElementById(chartContainerId);
				if (container) {
					container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">Gráfico disponível apenas para métricas</div>';
				}
			} else {
				// Sem ID, não carregar gráfico mas mostrar mensagem
				const container = document.getElementById(chartContainerId);
				if (container) {
					container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">Sem ID do item para carregar gráfico</div>';
				} else if (isDebug) {
					console.warn('[BubbleStats] Container not found:', chartContainerId);
				}
			}
		}
	}

	_hideAdvancedTooltip() {
		if (this._tooltip) {
			this._tooltip.style.display = 'none';
			this._tooltip.style.visibility = 'hidden';
		}
	}

	_updateTooltipPosition(event) {
		if (!this._tooltip) return;

		const tooltipRect = this._tooltip.getBoundingClientRect();
		const padding = 10;
		let x = event.clientX + padding;
		let y = event.clientY + padding;

		// Ajustar se sair da tela
		if (x + tooltipRect.width > window.innerWidth) {
			x = event.clientX - tooltipRect.width - padding;
		}
		if (y + tooltipRect.height > window.innerHeight) {
			y = event.clientY - tooltipRect.height - padding;
		}

		this._tooltip.style.left = `${x}px`;
		this._tooltip.style.top = `${y}px`;
	}

	async _loadItemHistory(itemid, units, itemName, containerId = null, currentValue = null, currentClock = null) {
		const isDebug = this._debug && Object.keys(this._debug).length > 0;


		// Usar containerId fornecido ou gerar um
		if (!containerId) {
			containerId = `bubble-chart-container-${itemid}`;
		}

		// Verificar cache (ignorar cache se tiver currentValue para garantir atualização visual)
		// Mas podemos usar o cache e apenas adicionar o ponto novo
		if (this._chartCache[itemid]) {
			const cachedData = [...this._chartCache[itemid].data];
			// Append current value if provided
			if (currentValue !== null && currentClock !== null) {
				cachedData.push({
					clock: currentClock,
					value: currentValue
				});
			}
			this._renderChart(containerId, cachedData, units, itemName);
			return;
		}

		if (isDebug) {
			console.log('[BubbleStats] Loading history for item:', itemid);
		}

		try {
			// Buscar histórico via controller PHP customizado
			const timeTo = Math.floor(Date.now() / 1000);
			const timeFrom = timeTo - 7200; // Últimas 2 horas (aumentado para capturar mais dados)

			// Usar o controller PHP que já temos configurado
			const result = await new Promise((resolve, reject) => {
				jQuery.ajax({
					url: 'zabbix.php',
					type: 'POST',
					data: {
						action: 'widget.bubblestats.history',
						itemid: itemid,
						time_from: timeFrom,
						time_to: timeTo,
						limit: 100
					},
					dataType: 'text', // Receber como texto primeiro para processar
					success: function (responseText, textStatus, xhr) {
						if (isDebug) {
							console.log('[BubbleStats] Raw response:', responseText?.substring(0, 200));
							console.log('[BubbleStats] Content-Type:', xhr.getResponseHeader('Content-Type'));
						}

						// Verificar se a resposta é HTML (indicando erro do servidor)
						if (responseText && responseText.trim().startsWith('<!DOCTYPE') ||
							responseText && responseText.trim().startsWith('<html')) {
							if (isDebug) {
								console.error('[BubbleStats] Received HTML instead of JSON. Controller may not be registered or accessible.');
								console.error('[BubbleStats] Response preview:', responseText?.substring(0, 500));
							}
							reject(new Error('O controller não está retornando JSON. Verifique se o módulo está instalado e ativado corretamente.'));
							return;
						}

						// Tentar parsear como JSON
						let jsonData = null;
						try {
							jsonData = JSON.parse(responseText);
						} catch (e) {
							if (isDebug) {
								console.error('[BubbleStats] Failed to parse response as JSON:', e);
								console.error('[BubbleStats] Response preview:', responseText?.substring(0, 500));
							}
							reject(new Error('Resposta inválida do servidor. O controller pode não estar configurado corretamente.'));
							return;
						}

						if (jsonData && jsonData.success !== undefined) {
							if (jsonData.success) {
								resolve(jsonData);
							} else {
								reject(new Error('Erro na API: ' + (jsonData.error || 'Erro desconhecido')));
							}
						} else {
							reject(new Error('Formato de resposta inválido do controller'));
						}
					},
					error: function (xhr, status, error) {
						if (isDebug) {
							console.error('[BubbleStats] AJAX error:', {
								status: xhr.status,
								statusText: xhr.statusText,
								responseText: xhr.responseText?.substring(0, 500),
								error: error,
								contentType: xhr.getResponseHeader('Content-Type')
							});
						}

						// Verificar se a resposta de erro é HTML
						const responseText = xhr.responseText || '';
						if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
							reject(new Error('O servidor retornou uma página HTML em vez de JSON. O controller pode não estar registrado corretamente. Status: ' + xhr.status));
							return;
						}

						// Tentar extrair JSON mesmo em caso de erro HTTP
						try {
							const jsonData = JSON.parse(responseText);
							if (jsonData.success !== undefined) {
								resolve(jsonData);
								return;
							}
						} catch (e) {
							// Ignorar erro de parse
						}

						reject(new Error('Falha ao carregar histórico: ' + error + ' (Status: ' + xhr.status + ')'));
					}
				});
			});

			if (isDebug) {
				console.log('[BubbleStats] History API result:', result);
				console.log('[BubbleStats] Result success:', result.success);
				console.log('[BubbleStats] Result data:', result.data);
				console.log('[BubbleStats] Result data length:', result.data ? result.data.length : 0);
				console.log('[BubbleStats] Result count:', result.count);
			}

			// Verificar se temos dados válidos
			const hasData = result.success &&
				result.data &&
				Array.isArray(result.data) &&
				result.data.length > 0;

			if (isDebug) {
				console.log('[BubbleStats] Has data:', hasData);
			}

			if (hasData) {
				// Cachear dados originais
				this._chartCache[itemid] = {
					data: result.data,
					timestamp: Date.now()
				};

				// Preparar dados para renderização (cópia)
				const chartData = [...result.data];

				// Append current value if provided and newer than last point
				if (currentValue !== null && currentClock !== null) {
					const lastPoint = chartData[chartData.length - 1];
					if (!lastPoint || currentClock > lastPoint.clock) {
						chartData.push({
							clock: currentClock,
							value: currentValue
						});
					}
				}

				// Renderizar gráfico
				this._renderChart(containerId, chartData, result.units || units, result.item_name || itemName);
			} else {
				// Sem dados históricos - mostrar mensagem mais informativa
				const container = document.getElementById(containerId);
				if (container) {
					let message = 'Sem dados históricos disponíveis';
					if (result.success === false) {
						message = 'Erro: ' + (result.error || 'Erro desconhecido');
					} else if (result.data && result.data.length === 0) {
						message = 'Nenhum dado histórico encontrado para este período';
					} else if (!result.data) {
						message = 'Resposta inválida do servidor (sem campo data)';
					}

					if (isDebug) {
						console.warn('[BubbleStats] No data to display:', {
							success: result.success,
							hasData: !!result.data,
							dataLength: result.data ? result.data.length : 0,
							count: result.count,
							error: result.error
						});
					}

					container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">' + this._escapeHtml(message) + '</div>';
				}
			}
		} catch (error) {
			console.error('[BubbleStats] Error loading history:', error);
			const container = document.getElementById(containerId);
			if (container) {
				container.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c; font-size: 12px;">Erro ao carregar gráfico: ' + this._escapeHtml(error.message || 'Erro desconhecido') + '</div>';
			}
		}
	}

	_renderChart(containerId, historyData, units, itemName) {
		const container = document.getElementById(containerId);
		if (!container) {
			console.warn('[BubbleStats] Chart container not found:', containerId);
			return;
		}

		try {
			// Criar canvas para o gráfico
			const canvas = document.createElement('canvas');
			canvas.width = container.offsetWidth || 300;
			canvas.height = 200;
			canvas.style.width = '100%';
			canvas.style.height = '200px';
			container.innerHTML = '';
			container.appendChild(canvas);

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new Error('Não foi possível obter o contexto 2D do canvas. O navegador pode não suportar canvas ou há problemas de permissão.');
			}

			const width = canvas.width;
			const height = canvas.height;
			const padding = 40;
			const chartWidth = width - padding * 2;
			const chartHeight = height - padding * 2;

			// Preparar dados
			if (historyData.length === 0) {
				ctx.fillStyle = '#999';
				ctx.font = '12px Arial';
				ctx.textAlign = 'center';
				ctx.fillText('Sem dados', width / 2, height / 2);
				return;
			}

			// Encontrar min/max para escala
			const values = historyData.map(d => d.value);
			const minValue = Math.min(...values);
			const maxValue = Math.max(...values);
			const valueRange = maxValue - minValue || 1;

			// Desenhar eixos
			ctx.strokeStyle = '#444';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(padding, padding);
			ctx.lineTo(padding, height - padding);
			ctx.lineTo(width - padding, height - padding);
			ctx.stroke();

			// Desenhar linha do gráfico
			ctx.strokeStyle = '#4a9eff';
			ctx.lineWidth = 2;
			ctx.beginPath();

			historyData.forEach((point, index) => {
				const x = padding + (index / (historyData.length - 1)) * chartWidth;
				const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();

			// Preencher área abaixo da linha
			ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
			ctx.lineTo(width - padding, height - padding);
			ctx.lineTo(padding, height - padding);
			ctx.closePath();
			ctx.fill();

			// Desenhar pontos
			ctx.fillStyle = '#4a9eff';
			historyData.forEach((point, index) => {
				const x = padding + (index / (historyData.length - 1)) * chartWidth;
				const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;
				ctx.beginPath();
				ctx.arc(x, y, 3, 0, Math.PI * 2);
				ctx.fill();
			});

			// Labels dos eixos
			ctx.fillStyle = '#999';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';

			// Valor mínimo
			ctx.fillText(minValue.toFixed(1) + (units ? ' ' + units : ''), padding - 30, height - padding);
			// Valor máximo
			ctx.fillText(maxValue.toFixed(1) + (units ? ' ' + units : ''), padding - 30, padding + 5);

			// Título
			ctx.fillStyle = '#fff';
			ctx.font = '11px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(itemName.substring(0, 30), width / 2, padding - 10);
		} catch (error) {
			console.error('[BubbleStats] Error rendering chart:', error);
			if (container) {
				container.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c; font-size: 12px;">Erro ao renderizar gráfico: ' + this._escapeHtml(error.message || 'Erro desconhecido') + '</div>';
			}
		}
	}

	_escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	_showNoData() {
		this._findOrCreateContainer();
		if (this._container) {
			let message = "No data available.";
			if (this._bubbles_data && Array.isArray(this._bubbles_data) && this._bubbles_data.length === 0) {
				message = "No items found. Please configure filters:<br>- Select hosts or host groups<br>- Enter item pattern";
			}
			this._container.innerHTML = "<div style=\"text-align: center; padding: 50px; color: #999; font-size: 14px;\">" + message + "</div>";
		}
	}

	_getColor(percentage) {
		if (percentage >= 80) return "#e74c3c";
		if (percentage >= 60) return "#f39c12";
		if (percentage >= 40) return "#3498db";
		if (percentage >= 20) return "#2ecc71";
		return "#95a5a6";
	}

}
