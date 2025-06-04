// frontend/js/relatorios.js
document.addEventListener('DOMContentLoaded', function () {
    // CONSTANTE PARA A URL BASE DA API
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api'; // Sua URL base da API no Render

    // Elementos de Filtro
    const filtroVeiculoSelect = document.getElementById('filtroVeiculo');
    const filtroMesSelect = document.getElementById('filtroMes');
    const filtroAnoSelect = document.getElementById('filtroAno');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');

    // Containers de Relatório
    const gastosTableContainer = document.getElementById('gastosTableContainer');
    const graficoGastosContainer = document.getElementById('graficoGastosContainer');
    const combustivelTableContainer = document.getElementById('combustivelTableContainer');

    // Elementos de Sumário
    const sumarioTotalGastosEl = document.getElementById('sumarioTotalGastos');
    const sumarioTotalCombustivelEl = document.getElementById('sumarioTotalCombustivel');
    const sumarioConsumoMedioEl = document.getElementById('sumarioConsumoMedio');
    const sumarioCustoKmEl = document.getElementById('sumarioCustoKm');
    
    const messageRelatorios = document.getElementById('messageRelatorios');

    // Instância do gráfico
    let gastosChart = null;

    // --- Funções Auxiliares ---
    function showMessage(text, type) {
        if (messageRelatorios) {
            messageRelatorios.textContent = text;
            messageRelatorios.className = 'message-feedback';
            if (type) messageRelatorios.classList.add(type);
            setTimeout(() => {
                if (messageRelatorios.textContent === text) {
                    messageRelatorios.textContent = '';
                    messageRelatorios.className = 'message-feedback';
                }
            }, 7000);
        }
    }

    function formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    function formatNumber(value, minDigits = 0, maxDigits = 2) {
        if (value === null || value === undefined || isNaN(parseFloat(value))) return '--';
        return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
    }

    // --- Funções de População de Filtros ---
    async function popularFiltroVeiculos() {
        if (!filtroVeiculoSelect) return;
        try {
            // USA A CONSTANTE API_BASE_URL para veículos
            const response = await fetch(`${API_BASE_URL}/veiculos`); 
            if (!response.ok) throw new Error('Falha ao carregar veículos para filtro.');
            const veiculos = await response.json();
            while (filtroVeiculoSelect.options.length > 1) filtroVeiculoSelect.remove(1);
            veiculos.forEach(v => {
                const option = document.createElement('option');
                option.value = v._id;
                option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                filtroVeiculoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao popular filtro de veículos:', error);
            showMessage('Erro ao carregar lista de veículos.', 'error');
        }
    }

    function popularFiltroMeses() {
        if (!filtroMesSelect) return;
        while (filtroMesSelect.options.length > 1) filtroMesSelect.remove(1);
        const meses = [
            { valor: 1, nome: "Janeiro" }, { valor: 2, nome: "Fevereiro" }, { valor: 3, nome: "Março" },
            { valor: 4, nome: "Abril" }, { valor: 5, nome: "Maio" }, { valor: 6, nome: "Junho" },
            { valor: 7, nome: "Julho" }, { valor: 8, nome: "Agosto" }, { valor: 9, nome: "Setembro" },
            { valor: 10, nome: "Outubro" }, { valor: 11, nome: "Novembro" }, { valor: 12, nome: "Dezembro" }
        ];
        meses.forEach(mes => {
            const option = document.createElement('option');
            option.value = mes.valor;
            option.textContent = mes.nome;
            filtroMesSelect.appendChild(option);
        });
    }

    function popularFiltroAnos() {
        if (!filtroAnoSelect) return;
        while (filtroAnoSelect.options.length > 1) filtroAnoSelect.remove(1);
        const anoAtual = new Date().getFullYear();
        for (let i = 0; i < 5; i++) { 
            const ano = anoAtual - i;
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAnoSelect.appendChild(option);
        }
        filtroAnoSelect.value = anoAtual;
    }

    // --- Funções de Carregamento de Dados dos Relatórios ---
    async function carregarRelatorioGastos(veiculoId, mes, ano) {
        if (!gastosTableContainer || !sumarioTotalGastosEl) return;
        gastosTableContainer.innerHTML = '<p class="loading-message">Carregando dados de gastos...</p>';
        sumarioTotalGastosEl.textContent = 'Calculando...';
        
        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        if (mes && mes !== 'todos') params.append('mes', mes);
        if (ano && ano !== 'todos') params.append('ano', ano);

        try {
            // USA A CONSTANTE API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/relatorios/gastos-detalhados?${params.toString()}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({message: "Erro ao buscar dados."}));
                throw new Error(errData.message || `Erro ${response.status}`);
            }
            const data = await response.json();

            if (data.detalhes && data.detalhes.length > 0) {
                let tableHtml = `<table class="data-table"><thead><tr><th>Data</th><th>Veículo (Placa)</th><th>Tipo de Gasto</th><th>Descrição</th><th style="text-align:right;">Valor</th></tr></thead><tbody>`;
                data.detalhes.forEach(gasto => {
                    tableHtml += `<tr><td>${formatDate(gasto.data)}</td><td><a href="detalhes_veiculo.html?id=${gasto.veiculoId}" title="Ver detalhes do veículo">${gasto.veiculoPlaca || 'N/A'}</a></td><td>${gasto.tipoGasto || 'N/A'}</td><td>${gasto.descricaoGasto || 'N/A'}</td><td style="text-align:right;">${formatCurrency(gasto.valorGasto)}</td></tr>`;
                });
                tableHtml += `</tbody></table>`;
                gastosTableContainer.innerHTML = tableHtml;
            } else {
                gastosTableContainer.innerHTML = '<p>Nenhum gasto encontrado para os filtros selecionados.</p>';
            }
            sumarioTotalGastosEl.textContent = formatCurrency(data.sumario.totalGastos);
            showMessage('Relatório de gastos carregado.', 'success');
        } catch (error) {
            console.error('Erro ao carregar relatório de gastos:', error);
            gastosTableContainer.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
            sumarioTotalGastosEl.textContent = formatCurrency(0);
            showMessage(`Erro ao carregar gastos: ${error.message}`, 'error');
        }
    }

    async function carregarGraficoGastos(veiculoId, anoParam) {
        if (!graficoGastosContainer) return;
        graficoGastosContainer.innerHTML = '<p class="loading-message">Gerando gráfico de gastos...</p>';
        
        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        const anoParaAPI = (anoParam && anoParam !== 'todos') ? anoParam : new Date().getFullYear().toString();
        params.append('ano', anoParaAPI);

        try {
            // USA A CONSTANTE API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/relatorios/gastos-mensais?${params.toString()}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({message: "Erro ao buscar dados."}));
                throw new Error(errData.message || `Erro ${response.status}`);
            }
            const chartData = await response.json();

            if (gastosChart) gastosChart.destroy(); 
            graficoGastosContainer.innerHTML = '<canvas id="graficoGastosCanvas"></canvas>'; 
            const ctx = document.getElementById('graficoGastosCanvas').getContext('2d');
            
            gastosChart = new Chart(ctx, {
                type: 'bar', data: { labels: chartData.labels, datasets: chartData.datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return formatCurrency(value); } } } },
                    plugins: {
                        tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) label += formatCurrency(context.parsed.y); return label; } } },
                        legend: { position: 'top' },
                        title: { display: true, text: `Gastos Mensais em ${anoParaAPI}${ (veiculoId && veiculoId !== 'todos') ? ' - Veículo Específico' : ''}` }
                    }
                }
            });
            showMessage('Gráfico de gastos carregado.', 'success');
        } catch (error) {
            console.error('Erro ao carregar gráfico de gastos:', error);
            graficoGastosContainer.innerHTML = `<p class="error-message">Erro ao gerar gráfico: ${error.message}</p>`;
            showMessage(`Erro ao gerar gráfico: ${error.message}`, 'error');
        }
    }

    async function carregarRelatorioCombustivel(veiculoId, mes, ano) {
        if (!combustivelTableContainer || !sumarioTotalCombustivelEl || !sumarioConsumoMedioEl || !sumarioCustoKmEl) return;
        combustivelTableContainer.innerHTML = '<p class="loading-message">Carregando dados de combustível...</p>';
        sumarioTotalCombustivelEl.textContent = 'Calculando...'; sumarioConsumoMedioEl.textContent = 'Calculando...'; sumarioCustoKmEl.textContent = 'Calculando...';

        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        if (mes && mes !== 'todos') params.append('mes', mes);
        if (ano && ano !== 'todos') params.append('ano', ano);
        
        try {
            // USA A CONSTANTE API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/relatorios/analise-combustivel?${params.toString()}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({message: "Erro ao buscar dados."}));
                throw new Error(errData.message || `Erro ${response.status}`);
            }
            const data = await response.json();

            if (data.detalhes && data.detalhes.length > 0) {
                let tableHtml = `<table class="data-table"><thead><tr><th>Data</th><th>Veículo (Placa)</th><th style="text-align:right;">Litros</th><th style="text-align:right;">Valor/L</th><th style="text-align:right;">Custo Total</th><th style="text-align:right;">KM Atual</th><th style="text-align:right;">KM Rodados</th><th style="text-align:right;">Consumo (Km/L)</th></tr></thead><tbody>`;
                data.detalhes.forEach(abast => {
                    tableHtml += `<tr><td>${formatDate(abast.data)}</td><td><a href="detalhes_veiculo.html?id=${abast.veiculoId}" title="Ver detalhes do veículo">${abast.veiculoPlaca || 'N/A'}</a></td><td style="text-align:right;">${formatNumber(abast.litros, 2, 2)}</td><td style="text-align:right;">${formatCurrency(abast.valorPorLitro).replace('R$', '')}</td> <td style="text-align:right;">${formatCurrency(abast.custoTotal)}</td><td style="text-align:right;">${formatNumber(abast.quilometragemAtual, 0, 0)}</td><td style="text-align:right;">${abast.kmRodados !== null ? formatNumber(abast.kmRodados, 0, 0) : 'N/A'}</td><td style="text-align:right;">${abast.consumoNoTrecho !== null ? formatNumber(abast.consumoNoTrecho, 1, 2) : 'N/A'}</td></tr>`;
                });
                tableHtml += `</tbody></table>`;
                combustivelTableContainer.innerHTML = tableHtml;
            } else {
                combustivelTableContainer.innerHTML = '<p>Nenhum dado de combustível encontrado para os filtros selecionados.</p>';
            }
            sumarioTotalCombustivelEl.textContent = formatCurrency(data.sumario.totalGastoCombustivel);
            sumarioConsumoMedioEl.textContent = `${formatNumber(data.sumario.consumoMedioGeral, 1, 2)} Km/L`;
            sumarioCustoKmEl.textContent = `${formatCurrency(data.sumario.custoMedioPorKm)} /Km`;
            showMessage('Relatório de combustível carregado.', 'success');
        } catch (error) {
            console.error('Erro ao carregar relatório de combustível:', error);
            combustivelTableContainer.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
            sumarioTotalCombustivelEl.textContent = formatCurrency(0);
            sumarioConsumoMedioEl.textContent = '-- Km/L';
            sumarioCustoKmEl.textContent = 'R$ -- /Km';
            showMessage(`Erro ao carregar dados de combustível: ${error.message}`, 'error');
        }
    }

    // --- Event Listener para Aplicar Filtros ---
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', function () {
            const veiculoId = filtroVeiculoSelect.value;
            const mes = filtroMesSelect.value;
            const ano = filtroAnoSelect.value;
            showMessage('Aplicando filtros e carregando relatórios...', 'info');
            carregarRelatorioGastos(veiculoId, mes, ano);
            carregarGraficoGastos(veiculoId, ano);
            carregarRelatorioCombustivel(veiculoId, mes, ano);
        });
    }

    // --- Inicialização da Página ---
    function initRelatoriosPage() {
        if (document.getElementById('relatorioGastosPorCarro')) {
            popularFiltroVeiculos();
            popularFiltroMeses();
            popularFiltroAnos();
            showMessage('Selecione os filtros e clique em "Aplicar Filtros" para gerar os relatórios.', 'info');
            if(sumarioTotalGastosEl) sumarioTotalGastosEl.textContent = formatCurrency(0);
            if(sumarioTotalCombustivelEl) sumarioTotalCombustivelEl.textContent = formatCurrency(0);
            if(sumarioConsumoMedioEl) sumarioConsumoMedioEl.textContent = '-- Km/L';
            if(sumarioCustoKmEl) sumarioCustoKmEl.textContent = 'R$ -- /Km';
            // Disparar filtros com ano atual por padrão ao carregar a página
            // btnAplicarFiltros.click(); // Descomente se quiser carregar com filtros padrão
        }
    }

    // Lógica de usuário e logout
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username && welcomeMessageEl) {
                welcomeMessageEl.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) { console.error("Erro ao parsear usuário:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            window.location.href = 'login.html';
        });
    }

    initRelatoriosPage();
});
