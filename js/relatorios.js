// frontend/js/relatorios.js
document.addEventListener('DOMContentLoaded', function () {
    // Elementos de Filtro
    const filtroVeiculoSelect = document.getElementById('filtroVeiculo');
    const filtroMesSelect = document.getElementById('filtroMes');
    const filtroAnoSelect = document.getElementById('filtroAno');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');

    // Containers de Relatório (para mensagens de carregamento ou dados)
    const gastosTableContainer = document.getElementById('gastosTableContainer');
    const graficoGastosContainer = document.getElementById('graficoGastosContainer');
    const combustivelTableContainer = document.getElementById('combustivelTableContainer');

    // Elementos de Sumário
    const sumarioTotalGastosEl = document.getElementById('sumarioTotalGastos');
    const sumarioTotalCombustivelEl = document.getElementById('sumarioTotalCombustivel');
    const sumarioConsumoMedioEl = document.getElementById('sumarioConsumoMedio');
    const sumarioCustoKmEl = document.getElementById('sumarioCustoKm');
    
    const messageRelatorios = document.getElementById('messageRelatorios');

    // Instância do gráfico (será criada depois)
    let gastosChart = null;

    // Função auxiliar para exibir mensagens
    function showMessage(text, type) {
        if (messageRelatorios) {
            messageRelatorios.textContent = text;
            messageRelatorios.className = 'message-feedback';
            if (type) {
                messageRelatorios.classList.add(type);
            }
        }
    }

    // --- Funções de População de Filtros ---
    async function popularFiltroVeiculos() {
        if (!filtroVeiculoSelect) return;
        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) throw new Error('Falha ao carregar veículos para filtro.');
            const veiculos = await response.json();

            // Mantém a opção "Todos os Veículos"
            // filtroVeiculoSelect.innerHTML = '<option value="todos">Todos os Veículos</option>'; 
            veiculos.forEach(v => {
                const option = document.createElement('option');
                option.value = v._id;
                option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                filtroVeiculoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao popular filtro de veículos:', error);
            filtroVeiculoSelect.innerHTML = '<option value="todos">Erro ao carregar</option>';
            showMessage('Erro ao carregar lista de veículos para os filtros.', 'error');
        }
    }

    function popularFiltroMeses() {
        if (!filtroMesSelect) return;
        // Mantém "Todos os Meses"
        // filtroMesSelect.innerHTML = '<option value="todos">Todos os Meses</option>';
        const meses = [
            { valor: 1, nome: "Janeiro" }, { valor: 2, nome: "Fevereiro" },
            { valor: 3, nome: "Março" }, { valor: 4, nome: "Abril" },
            { valor: 5, nome: "Maio" }, { valor: 6, nome: "Junho" },
            { valor: 7, nome: "Julho" }, { valor: 8, nome: "Agosto" },
            { valor: 9, nome: "Setembro" }, { valor: 10, nome: "Outubro" },
            { valor: 11, nome: "Novembro" }, { valor: 12, nome: "Dezembro" }
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
        // Mantém "Todos os Anos"
        // filtroAnoSelect.innerHTML = '<option value="todos">Todos os Anos</option>';
        const anoAtual = new Date().getFullYear();
        for (let i = 0; i < 5; i++) { // Exibe o ano atual e os 4 anteriores
            const ano = anoAtual - i;
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAnoSelect.appendChild(option);
        }
        // Adiciona o ano atual como selecionado por padrão, se não for "todos"
        // filtroAnoSelect.value = anoAtual; 
    }

    // --- Funções de Carregamento de Dados dos Relatórios (Placeholders) ---
    async function carregarRelatorioGastos(veiculoId, mes, ano) {
        if (!gastosTableContainer || !sumarioTotalGastosEl) return;
        gastosTableContainer.innerHTML = '<p class="loading-message">Carregando dados de gastos...</p>';
        sumarioTotalGastosEl.textContent = 'Calculando...';
        showMessage('Buscando dados de gastos...', 'info');

        // TODO: Construir URL com query params para a API
        // Ex: /api/relatorios/gastos?veiculoId=${veiculoId}&mes=${mes}&ano=${ano}
        console.log(`Buscaria gastos para: Veículo=${veiculoId}, Mês=${mes}, Ano=${ano}`);

        // Simulação de dados (substituir com chamada de API real)
        setTimeout(() => {
            // Exemplo de como preencher a tabela e o sumário
            // const dadosExemplo = {
            //     detalhes: [ /* { data, tipo, descricao, valor } */ ],
            //     total: 1234.56
            // };
            // gastosTableContainer.innerHTML = '';
            // sumarioTotalGastosEl.textContent = `R$ ${dadosExemplo.total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            gastosTableContainer.innerHTML = '<p>Dados de gastos ainda não implementados. API necessária.</p>';
            sumarioTotalGastosEl.textContent = 'R$ 0,00';
            showMessage('Funcionalidade de relatório de gastos em desenvolvimento.', 'info');
        }, 1000);
    }

    async function carregarGraficoGastos(veiculoId, mes, ano) {
        if (!graficoGastosContainer) return;
        graficoGastosContainer.innerHTML = '<p class="loading-message">Gerando gráfico de gastos...</p>';
        showMessage('Buscando dados para gráfico de gastos...', 'info');
        
        console.log(`Buscaria dados para gráfico: Veículo=${veiculoId}, Mês=${mes}, Ano=${ano}`);

        // Simulação (substituir com chamada de API e lógica do Chart.js)
        setTimeout(() => {
            // if (gastosChart) {
            //     gastosChart.destroy(); // Destruir gráfico anterior se existir
            // }
            // graficoGastosContainer.innerHTML = '<canvas id="graficoGastosCanvas"></canvas>';
            // const ctx = document.getElementById('graficoGastosCanvas').getContext('2d');
            // gastosChart = new Chart(ctx, { /* Configuração do gráfico com dados da API */ });
            graficoGastosContainer.innerHTML = '<p>Gráfico de gastos ainda não implementado. API e Chart.js necessários.</p>';
            showMessage('Funcionalidade de gráfico de gastos em desenvolvimento.', 'info');
        }, 1000);
    }

    async function carregarRelatorioCombustivel(veiculoId, mes, ano) {
        if (!combustivelTableContainer || !sumarioTotalCombustivelEl || !sumarioConsumoMedioEl || !sumarioCustoKmEl) return;
        
        combustivelTableContainer.innerHTML = '<p class="loading-message">Carregando dados de combustível...</p>';
        sumarioTotalCombustivelEl.textContent = 'Calculando...';
        sumarioConsumoMedioEl.textContent = 'Calculando...';
        sumarioCustoKmEl.textContent = 'Calculando...';
        showMessage('Buscando dados de combustível...', 'info');

        console.log(`Buscaria dados de combustível para: Veículo=${veiculoId}, Mês=${mes}, Ano=${ano}`);
        
        // Simulação (substituir com chamada de API)
        setTimeout(() => {
            // Exemplo de como preencher
            // const dadosCombustivelExemplo = {
            //     detalhes: [ /* { data, litros, valorLitro, custoTotal, kmAnterior, kmAtual, kmRodados, consumo } */],
            //     totalGasto: 500.00,
            //     consumoMedio: 10.5, // km/L
            //     custoMedioKm: 0.55 // R$/km
            // };
            // combustivelTableContainer.innerHTML = '';
            // sumarioTotalCombustivelEl.textContent = `R$ ${dadosCombustivelExemplo.totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            // sumarioConsumoMedioEl.textContent = `${dadosCombustivelExemplo.consumoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} Km/L`;
            // sumarioCustoKmEl.textContent = `R$ ${dadosCombustivelExemplo.custoMedioKm.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} /Km`;
            combustivelTableContainer.innerHTML = '<p>Relatório de combustível ainda não implementado. API necessária.</p>';
            sumarioTotalCombustivelEl.textContent = 'R$ 0,00';
            sumarioConsumoMedioEl.textContent = '-- Km/L';
            sumarioCustoKmEl.textContent = 'R$ -- /Km';
            showMessage('Funcionalidade de relatório de combustível em desenvolvimento.', 'info');
        }, 1000);
    }

    // --- Event Listener para Aplicar Filtros ---
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', function () {
            const veiculoId = filtroVeiculoSelect.value;
            const mes = filtroMesSelect.value;
            const ano = filtroAnoSelect.value;

            showMessage('Aplicando filtros e carregando relatórios...', 'info');

            // Chamar as funções para carregar cada seção do relatório
            carregarRelatorioGastos(veiculoId, mes, ano);
            carregarGraficoGastos(veiculoId, mes, ano);
            carregarRelatorioCombustivel(veiculoId, mes, ano);
        });
    }

    // --- Inicialização da Página ---
    function initRelatoriosPage() {
        if (window.location.pathname.includes('relatorios.html')) {
            popularFiltroVeiculos();
            popularFiltroMeses();
            popularFiltroAnos();
            // Poderia carregar com "todos" por padrão ou esperar o clique no botão
            // Por enquanto, espera o clique.
            showMessage('Selecione os filtros desejados e clique em "Aplicar Filtros".', 'info');
        }
    }

    // Lógica de usuário e logout (geralmente do dashboard.js, mas garantindo aqui se necessário)
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username && welcomeMessageEl) {
                welcomeMessageEl.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) {
            console.error("Erro ao parsear usuário do localStorage:", e);
        }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            // localStorage.removeItem('authToken'); // Futuro
            window.location.href = 'login.html';
        });
    }

    initRelatoriosPage();
});
