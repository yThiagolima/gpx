// frontend/js/relatorios.js
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api'; 

    // Elementos de Filtro CORRIGIDOS para os IDs atuais do HTML
    const filtroVeiculoSelect = document.getElementById('filtroVeiculo');
    const filtroDataInicioInput = document.getElementById('filtroDataInicio'); // Corrigido
    const filtroDataFimInput = document.getElementById('filtroDataFim');       // Corrigido
    const filtroTipoGastoSelect = document.getElementById('filtroTipoGasto');   // Corrigido
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');

    // Containers de Relatório
    const gastosTableContainer = document.getElementById('gastosTableContainer');
    const graficoGastosContainer = document.getElementById('graficoGastosContainer');
    const combustivelTableContainer = document.getElementById('combustivelTableContainer');

    // Elementos de Sumário
    const sumarioTotalGastosEl = document.getElementById('sumarioTotalGastos');
    const sumarioTotalCombustivelEl = document.getElementById('sumarioTotalCombustivel');
    const sumarioConsumoMedioEl = document.getElementById('sumarioConsumoMedio');
    const sumarioCustoKmEl = document.getElementById('sumarioCustoKm');
    const sumarioPrecoMedioLitroEl = document.getElementById('sumarioPrecoMedioLitro'); // Adicionado se existir no HTML
    
    const messageRelatorios = document.getElementById('messageRelatorios');
    let gastosChart = null;

    function showUserMessage(text, type) { // Renomeado para evitar conflito se houver outra showMessage global
        if (messageRelatorios) {
            messageRelatorios.textContent = text;
            messageRelatorios.className = 'message-feedback';
            if (type) messageRelatorios.classList.add(type);
            setTimeout(() => { if (messageRelatorios.textContent === text) { messageRelatorios.textContent = ''; messageRelatorios.className = 'message-feedback';}}, 7000);
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

    async function popularFiltroVeiculos() {
        if (!filtroVeiculoSelect) return;
        try {
            const response = await fetch(`${API_BASE_URL}/veiculos`); 
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();
            while (filtroVeiculoSelect.options.length > 1) filtroVeiculoSelect.remove(1);
            veiculos.forEach(v => {
                const option = document.createElement('option'); option.value = v._id;
                option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                filtroVeiculoSelect.appendChild(option);
            });
        } catch (error) { console.error('Erro filtro veículos:', error); showUserMessage('Erro ao carregar veículos.', 'error');}
    }
    
    // Os filtros de Mês e Ano fixos foram removidos em favor de Data Início/Fim.
    // A lógica para popularFiltroMeses e popularFiltroAnos não é mais necessária aqui.

    async function carregarRelatorioGastos(veiculoId, dataInicio, dataFim, tipoGasto) {
        if (!gastosTableContainer || !sumarioTotalGastosEl) return;
        gastosTableContainer.innerHTML = '<p class="loading-message">Carregando gastos...</p>';
        sumarioTotalGastosEl.textContent = 'Calculando...';
        
        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        if (dataInicio) params.append('dataInicio', dataInicio); // Envia dataInicio
        if (dataFim) params.append('dataFim', dataFim);       // Envia dataFim
        if (tipoGasto && tipoGasto !== 'todos') params.append('tipoGasto', tipoGasto); // Envia tipoGasto

        try {
            const response = await fetch(`${API_BASE_URL}/relatorios/gastos-detalhados?${params.toString()}`);
            if (!response.ok) { const err = await response.json(); throw new Error(err.message || `Erro ${response.status}`);}
            const data = await response.json();
            if (data.detalhes && data.detalhes.length > 0) {
                let tableHtml = `<table class="data-table"><thead><tr><th>Data</th><th>Veículo</th><th>Tipo</th><th>Descrição</th><th style="text-align:right;">Valor</th></tr></thead><tbody>`;
                data.detalhes.forEach(g => { tableHtml += `<tr><td>${formatDate(g.data)}</td><td><a href="detalhes_veiculo.html?id=${g.veiculoId}">${g.veiculoPlaca||'N/A'}</a></td><td>${g.tipoGasto||'N/A'}</td><td>${g.descricaoGasto||'N/A'}</td><td style="text-align:right;">${formatCurrency(g.valorGasto)}</td></tr>`;});
                tableHtml += `</tbody></table>`;
                gastosTableContainer.innerHTML = tableHtml;
            } else { gastosTableContainer.innerHTML = '<p>Nenhum gasto para os filtros.</p>'; }
            sumarioTotalGastosEl.textContent = formatCurrency(data.sumario.totalGastos);
            showUserMessage('Relatório de gastos carregado.', 'success');
        } catch (error) { gastosTableContainer.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`; sumarioTotalGastosEl.textContent = formatCurrency(0); showUserMessage(`Erro gastos: ${error.message}`, 'error');}
    }

    async function carregarGraficoGastos(veiculoId, dataFimVal) { // dataFimVal para extrair o ano
        if (!graficoGastosContainer) return;
        graficoGastosContainer.innerHTML = '<p class="loading-message">Gerando gráfico...</p>';
        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        
        let anoParaAPI = new Date().getFullYear().toString(); // Ano atual como padrão
        if (dataFimVal) { // Se uma data final foi fornecida, usa o ano dela
            const anoExtraido = new Date(dataFimVal + 'T00:00:00').getFullYear(); // Adiciona T00:00:00 para parse mais robusto
            if (!isNaN(anoExtraido)) {
                anoParaAPI = anoExtraido.toString();
            }
        }
        params.append('ano', anoParaAPI);

        try {
            const response = await fetch(`${API_BASE_URL}/relatorios/gastos-mensais?${params.toString()}`);
            if (!response.ok) { const err = await response.json(); throw new Error(err.message || `Erro ${response.status}`);}
            const chartData = await response.json();
            if (gastosChart) gastosChart.destroy(); 
            graficoGastosContainer.innerHTML = '<canvas id="graficoGastosCanvas"></canvas>'; 
            const ctx = document.getElementById('graficoGastosCanvas').getContext('2d');
            gastosChart = new Chart(ctx, { type: 'bar', data: { labels: chartData.labels, datasets: chartData.datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label||''}: ${formatCurrency(c.parsed.y)}`}}, legend: {position:'top'}, title: {display:true, text:`Gastos Mensais em ${anoParaAPI}${(veiculoId&&veiculoId!=='todos')?' - Veículo Específico':''}`}}}});
            showUserMessage('Gráfico de gastos carregado.', 'success');
        } catch (error) { graficoGastosContainer.innerHTML = `<p class="error-message">Erro gráfico: ${error.message}</p>`; showUserMessage(`Erro gráfico: ${error.message}`, 'error');}
    }

    async function carregarRelatorioCombustivel(veiculoId, dataInicio, dataFim) {
        if (!combustivelTableContainer || !sumarioTotalCombustivelEl || !sumarioConsumoMedioEl || !sumarioCustoKmEl) return;
        combustivelTableContainer.innerHTML = '<p class="loading-message">Carregando combustível...</p>';
        sumarioTotalCombustivelEl.textContent = 'Calculando...'; sumarioConsumoMedioEl.textContent = 'Calculando...'; sumarioCustoKmEl.textContent = 'Calculando...'; if(sumarioPrecoMedioLitroEl) sumarioPrecoMedioLitroEl.textContent = 'Calculando...';
        
        const params = new URLSearchParams();
        if (veiculoId && veiculoId !== 'todos') params.append('veiculoId', veiculoId);
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        
        try {
            const response = await fetch(`${API_BASE_URL}/relatorios/analise-combustivel?${params.toString()}`);
            if (!response.ok) { const err = await response.json(); throw new Error(err.message || `Erro ${response.status}`);}
            const data = await response.json();
            if (data.detalhes && data.detalhes.length > 0) {
                let tableHtml = `<table class="data-table"><thead><tr><th>Data</th><th>Veículo</th><th style="text-align:right;">Litros</th><th style="text-align:right;">Valor/L</th><th style="text-align:right;">Custo Total</th><th style="text-align:right;">KM Atual</th><th style="text-align:right;">KM Rodados</th><th style="text-align:right;">Consumo (Km/L)</th></tr></thead><tbody>`;
                data.detalhes.forEach(abast => { tableHtml += `<tr><td>${formatDate(abast.data)}</td><td><a href="detalhes_veiculo.html?id=${abast.veiculoId}">${abast.veiculoPlaca||'N/A'}</a></td><td style="text-align:right;">${formatNumber(abast.litros,2,2)}</td><td style="text-align:right;">${formatCurrency(abast.valorPorLitro).replace('R$','')}</td><td style="text-align:right;">${formatCurrency(abast.custoTotal)}</td><td style="text-align:right;">${formatNumber(abast.quilometragemAtual,0,0)}</td><td style="text-align:right;">${abast.kmRodados!==null?formatNumber(abast.kmRodados,0,0):'N/A'}</td><td style="text-align:right;">${abast.consumoNoTrecho!==null?formatNumber(abast.consumoNoTrecho,1,2):'N/A'}</td></tr>`;});
                tableHtml += `</tbody></table>`;
                combustivelTableContainer.innerHTML = tableHtml;
            } else { combustivelTableContainer.innerHTML = '<p>Nenhum dado de combustível para os filtros.</p>'; }
            sumarioTotalCombustivelEl.textContent = formatCurrency(data.sumario.totalGastoCombustivel);
            sumarioConsumoMedioEl.textContent = `${formatNumber(data.sumario.consumoMedioGeral, 1, 2)} Km/L`;
            sumarioCustoKmEl.textContent = `${formatCurrency(data.sumario.custoMedioPorKm)} /Km`;
            if(sumarioPrecoMedioLitroEl) sumarioPrecoMedioLitroEl.textContent = formatCurrency(data.sumario.precoMedioLitro) + " /L";
            showUserMessage('Relatório de combustível carregado.', 'success');
        } catch (error) { 
            combustivelTableContainer.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`; 
            sumarioTotalCombustivelEl.textContent = formatCurrency(0); sumarioConsumoMedioEl.textContent = '-- Km/L'; sumarioCustoKmEl.textContent = 'R$ -- /Km'; if(sumarioPrecoMedioLitroEl) sumarioPrecoMedioLitroEl.textContent = 'R$ -- /L';
            showUserMessage(`Erro combustível: ${error.message}`, 'error');
        }
    }

    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', function () {
            // CORRIGIDO para usar os IDs corretos dos inputs de data e do select de tipo de gasto
            const veiculoId = filtroVeiculoSelect ? filtroVeiculoSelect.value : 'todos';
            const dataInicio = filtroDataInicioInput ? filtroDataInicioInput.value : '';
            const dataFim = filtroDataFimInput ? filtroDataFimInput.value : '';
            const tipoGasto = filtroTipoGastoSelect ? filtroTipoGastoSelect.value : 'todos';

            showUserMessage('Aplicando filtros e carregando relatórios...', 'info');
            carregarRelatorioGastos(veiculoId, dataInicio, dataFim, tipoGasto);
            carregarGraficoGastos(veiculoId, dataFim); // Usa dataFim para extrair o ano para o gráfico
            carregarRelatorioCombustivel(veiculoId, dataInicio, dataFim);
        });
    }

    if(btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', function() {
            if(filtroVeiculoSelect) filtroVeiculoSelect.value = 'todos';
            if(filtroDataInicioInput) filtroDataInicioInput.value = '';
            if(filtroDataFimInput) filtroDataFimInput.value = '';
            if(filtroTipoGastoSelect) filtroTipoGastoSelect.value = 'todos';
            
            // Limpa os containers de resultado
            if(gastosTableContainer) gastosTableContainer.innerHTML = '<p class="loading-message">Aplique os filtros para carregar os dados de gastos.</p>';
            if(sumarioTotalGastosEl) sumarioTotalGastosEl.textContent = formatCurrency(0);
            
            if(graficoGastosContainer) {
                if (gastosChart) gastosChart.destroy();
                gastosChart = null;
                graficoGastosContainer.innerHTML = '<p class="loading-message">Aplique os filtros para gerar o gráfico de gastos.</p>';
            }
            
            if(combustivelTableContainer) combustivelTableContainer.innerHTML = '<p class="loading-message">Aplique os filtros para carregar os dados de combustível.</p>';
            if(sumarioTotalCombustivelEl) sumarioTotalCombustivelEl.textContent = formatCurrency(0);
            if(sumarioConsumoMedioEl) sumarioConsumoMedioEl.textContent = '-- Km/L';
            if(sumarioCustoKmEl) sumarioCustoKmEl.textContent = 'R$ -- /Km';
            if(sumarioPrecoMedioLitroEl) sumarioPrecoMedioLitroEl.textContent = 'R$ -- /L';

            showUserMessage('Filtros limpos. Selecione novos filtros para gerar relatórios.', 'info');
        });
    }

    function initRelatoriosPage() {
        if (document.getElementById('relatorioGastosPorCarro')) {
            popularFiltroVeiculos();
            // Não populamos mais mês/ano fixos, usamos date pickers
            // Setar valores iniciais para os sumários e mensagens
            showUserMessage('Selecione os filtros e clique em "Gerar Relatórios".', 'info');
            if(sumarioTotalGastosEl) sumarioTotalGastosEl.textContent = formatCurrency(0);
            if(sumarioTotalCombustivelEl) sumarioTotalCombustivelEl.textContent = formatCurrency(0);
            if(sumarioConsumoMedioEl) sumarioConsumoMedioEl.textContent = '-- Km/L';
            if(sumarioCustoKmEl) sumarioCustoKmEl.textContent = 'R$ -- /Km';
            if(sumarioPrecoMedioLitroEl) sumarioPrecoMedioLitroEl.textContent = 'R$ -- /L';
        }
    }

    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) { try { const user = JSON.parse(storedUser); if (user && user.username && welcomeMessageEl) welcomeMessageEl.textContent = `Olá, ${user.username}!`; } catch (e) { console.error("Erro parse usuário:", e); } }
    if (logoutButton) { logoutButton.addEventListener('click', function() { localStorage.removeItem('gpx7User'); window.location.href = 'login.html'; }); }

    initRelatoriosPage();
});
