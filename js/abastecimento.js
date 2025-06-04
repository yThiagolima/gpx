// frontend/js/abastecimento.js
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api'; // Sua URL base da API

    const formRegistrarAbastecimento = document.getElementById('formRegistrarAbastecimento');
    const abastecimentoVeiculoSelect = document.getElementById('abastecimentoVeiculo');
    const abastecimentoRequisicaoSelect = document.getElementById('abastecimentoRequisicaoId'); // Novo select
    const messageElement = document.getElementById('messageAbastecimento');
    
    const litrosInput = document.getElementById('abastecimentoLitros');
    const valorLitroInput = document.getElementById('abastecimentoValorLitro');
    const custoTotalInput = document.getElementById('abastecimentoCustoTotal');
    const kmAtualInput = document.getElementById('abastecimentoKm');


    function showUserMessage(text, type) { // Renomeado para evitar conflito
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = 'message-feedback';
            if (type) messageElement.classList.add(type);
            setTimeout(() => { if (messageElement.textContent === text) { messageElement.textContent = ''; messageElement.className = 'message-feedback';}}, 7000);
        }
    }

    async function carregarVeiculos() {
        if (!abastecimentoVeiculoSelect) return;
        try {
            const response = await fetch(`${API_BASE_URL}/veiculos`);
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();
            abastecimentoVeiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
            if (veiculos && veiculos.length > 0) {
                veiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v._id;
                    option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                    option.dataset.kmAtual = v.quilometragemAtual || 0;
                    abastecimentoVeiculoSelect.appendChild(option);
                });
            } else { abastecimentoVeiculoSelect.innerHTML = '<option value="">Nenhum veículo cadastrado</option>'; }
        } catch (error) {
            showUserMessage(error.message || 'Não foi possível carregar veículos.', 'error');
            if (abastecimentoVeiculoSelect) abastecimentoVeiculoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // NOVA FUNÇÃO para carregar requisições disponíveis
    async function carregarRequisicoesDisponiveis() {
        if (!abastecimentoRequisicaoSelect) return;
        abastecimentoRequisicaoSelect.innerHTML = '<option value="">Carregando requisições...</option>';
        try {
            const response = await fetch(`${API_BASE_URL}/requisicoes/disponiveis`);
            if (!response.ok) {
                const errData = await response.json().catch(()=>({message: 'Falha ao buscar requisições disponíveis.'}));
                throw new Error(errData.message);
            }
            const requisicoes = await response.json();
            abastecimentoRequisicaoSelect.innerHTML = '<option value="">Selecione uma requisição</option>';
            if (requisicoes && requisicoes.length > 0) {
                requisicoes.forEach(req => {
                    const option = document.createElement('option');
                    option.value = req._id; // Usaremos o _id do MongoDB da requisição
                    option.textContent = `${req.idRequisicaoUsuario} (Para: ${req.entreguePara})`;
                    abastecimentoRequisicaoSelect.appendChild(option);
                });
            } else {
                abastecimentoRequisicaoSelect.innerHTML = '<option value="">Nenhuma requisição disponível</option>';
            }
        } catch (error) {
            console.error("Erro ao carregar requisições disponíveis:", error);
            showUserMessage(error.message || 'Não foi possível carregar requisições.', 'error');
            if (abastecimentoRequisicaoSelect) abastecimentoRequisicaoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    if (abastecimentoVeiculoSelect && kmAtualInput) {
        abastecimentoVeiculoSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const kmAtualVeiculo = selectedOption.dataset.kmAtual;
            kmAtualInput.value = kmAtualVeiculo || '';
            kmAtualInput.min = kmAtualVeiculo || 0;
        });
    }

    function calcularCustoTotal() {
        const litros = parseFloat(litrosInput.value);
        const valorLitro = parseFloat(valorLitroInput.value);
        if (!isNaN(litros) && !isNaN(valorLitro) && litros > 0 && valorLitro > 0) {
            custoTotalInput.value = (litros * valorLitro).toFixed(2);
        }
    }
    if (litrosInput && valorLitroInput && custoTotalInput) {
        litrosInput.addEventListener('input', calcularCustoTotal);
        valorLitroInput.addEventListener('input', calcularCustoTotal);
    }

    if (formRegistrarAbastecimento) {
        formRegistrarAbastecimento.addEventListener('submit', async function (event) {
            event.preventDefault();
            showUserMessage('Registrando abastecimento...', 'info');

            const formData = new FormData(formRegistrarAbastecimento);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });

            // Validação básica, incluindo o novo campo de requisição
            if (!data.veiculoId || !data.requisicaoObjId || !data.data || !data.quilometragemAtual || !data.litros || !data.valorPorLitro) {
                showUserMessage('Por favor, preencha todos os campos obrigatórios (*), incluindo a Requisição.', 'error');
                return;
            }
            
            const quilometragemAtualVeiculo = parseFloat(abastecimentoVeiculoSelect.options[abastecimentoVeiculoSelect.selectedIndex].dataset.kmAtual || 0);
            const quilometragemNova = parseFloat(data.quilometragemAtual);
            if (quilometragemNova < quilometragemAtualVeiculo) {
                showUserMessage(`A KM informada (${quilometragemNova.toLocaleString('pt-BR')}km) não pode ser menor que a última registrada para o veículo (${quilometragemAtualVeiculo.toLocaleString('pt-BR')}km).`, 'error');
                return;
            }

            if (!data.custoTotal || parseFloat(data.custoTotal) <= 0) {
                const litros = parseFloat(data.litros);
                const valorPorLitro = parseFloat(data.valorPorLitro);
                if (litros > 0 && valorPorLitro > 0) data.custoTotal = (litros * valorPorLitro).toFixed(2);
                else { showUserMessage('Custo total inválido. Verifique litros e valor/litro.', 'error'); return; }
            }
            
            const selectedVeiculoOption = abastecimentoVeiculoSelect.options[abastecimentoVeiculoSelect.selectedIndex];
            if (selectedVeiculoOption && selectedVeiculoOption.value) data.veiculoPlaca = selectedVeiculoOption.textContent.split(' - ')[0];

            try {
                const response = await fetch(`${API_BASE_URL}/abastecimentos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const responseData = await response.json();

                if (response.ok) {
                    showUserMessage(responseData.message || 'Abastecimento registrado com sucesso!', 'success');
                    formRegistrarAbastecimento.reset();
                    
                    // Atualiza KM no dataset do select do veículo
                    if (selectedVeiculoOption && selectedVeiculoOption.value === data.veiculoId) {
                        selectedVeiculoOption.dataset.kmAtual = data.quilometragemAtual;
                        if (kmAtualInput) {
                             kmAtualInput.value = data.quilometragemAtual;
                             kmAtualInput.min = data.quilometragemAtual;
                        }
                    }
                    // Recarrega a lista de requisições disponíveis, pois uma foi usada
                    await carregarRequisicoesDisponiveis(); 
                    
                    if(responseData.alertaOleo) {
                        showUserMessage(responseData.message + ' ATENÇÃO: ' + responseData.alertaOleo, 'success');
                    }
                } else {
                    showUserMessage(responseData.message || `Erro ${response.status}: Não foi possível registrar.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar abastecimento:', error);
                showUserMessage('Erro de conexão ao tentar registrar o abastecimento.', 'error');
            }
        });
    }

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

    if (window.location.pathname.includes('abastecimento.html')) {
        carregarVeiculos();
        carregarRequisicoesDisponiveis(); // Chama a nova função ao carregar a página
    }
});
