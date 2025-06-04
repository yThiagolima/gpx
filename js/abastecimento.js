// frontend/js/abastecimento.js
document.addEventListener('DOMContentLoaded', function () {
    const formRegistrarAbastecimento = document.getElementById('formRegistrarAbastecimento');
    const abastecimentoVeiculoSelect = document.getElementById('abastecimentoVeiculo');
    const messageElement = document.getElementById('messageAbastecimento');
    
    // Campos para cálculo automático do custo total
    const litrosInput = document.getElementById('abastecimentoLitros');
    const valorLitroInput = document.getElementById('abastecimentoValorLitro');
    const custoTotalInput = document.getElementById('abastecimentoCustoTotal');

    // Função auxiliar para exibir mensagens
    function showMessage(text, type) {
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = 'message-feedback'; // Reseta classes
            if (type) {
                messageElement.classList.add(type); // Adiciona 'success', 'error', ou 'info'
            }
        }
    }

    // Popula o select de veículos
    async function carregarVeiculos() {
        if (!abastecimentoVeiculoSelect) return;

        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) {
                throw new Error('Falha ao carregar veículos para o formulário.');
            }
            const veiculos = await response.json();

            abastecimentoVeiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>'; // Limpa e adiciona placeholder
            if (veiculos && veiculos.length > 0) {
                veiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v._id; // ID do veículo
                    option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                    option.dataset.kmAtual = v.quilometragemAtual || 0; // Armazena KM atual do veículo
                    abastecimentoVeiculoSelect.appendChild(option);
                });
            } else {
                abastecimentoVeiculoSelect.innerHTML = '<option value="">Nenhum veículo cadastrado</option>';
            }
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            showMessage(error.message || 'Não foi possível carregar a lista de veículos.', 'error');
            abastecimentoVeiculoSelect.innerHTML = '<option value="">Erro ao carregar veículos</option>';
        }
    }
    
    // Atualiza campo de quilometragem ao selecionar veículo
    if (abastecimentoVeiculoSelect && document.getElementById('abastecimentoKm')) {
        abastecimentoVeiculoSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const kmAtualVeiculo = selectedOption.dataset.kmAtual;
            document.getElementById('abastecimentoKm').value = kmAtualVeiculo || '';
            document.getElementById('abastecimentoKm').min = kmAtualVeiculo || 0; // Garante que a nova KM não seja menor
        });
    }

    // Cálculo automático do custo total
    function calcularCustoTotal() {
        const litros = parseFloat(litrosInput.value);
        const valorLitro = parseFloat(valorLitroInput.value);

        if (!isNaN(litros) && !isNaN(valorLitro) && litros > 0 && valorLitro > 0) {
            custoTotalInput.value = (litros * valorLitro).toFixed(2);
        } else if (litrosInput.value === '' || valorLitroInput.value === '') {
            // Se um dos campos estiver vazio, limpa o custo total para permitir entrada manual ou novo cálculo
            // custoTotalInput.value = ''; // Comentado para não apagar se o usuário estiver digitando
        }
    }

    if (litrosInput && valorLitroInput && custoTotalInput) {
        litrosInput.addEventListener('input', calcularCustoTotal);
        valorLitroInput.addEventListener('input', calcularCustoTotal);
    }


    // Submissão do formulário
    if (formRegistrarAbastecimento) {
        formRegistrarAbastecimento.addEventListener('submit', async function (event) {
            event.preventDefault();
            showMessage('Registrando abastecimento...', 'info');

            const formData = new FormData(formRegistrarAbastecimento);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Validação básica
            if (!data.veiculoId || !data.data || !data.quilometragemAtual || !data.litros || !data.valorPorLitro) {
                showMessage('Por favor, preencha todos os campos obrigatórios (*).', 'error');
                return;
            }
            
            const quilometragemAtualVeiculo = parseFloat(abastecimentoVeiculoSelect.options[abastecimentoVeiculoSelect.selectedIndex].dataset.kmAtual || 0);
            const quilometragemNova = parseFloat(data.quilometragemAtual);

            if (quilometragemNova < quilometragemAtualVeiculo) {
                showMessage(`A quilometragem atual informada (${quilometragemNova.toLocaleString('pt-BR')}km) não pode ser menor que a última registrada para o veículo (${quilometragemAtualVeiculo.toLocaleString('pt-BR')}km).`, 'error');
                return;
            }


            // Se custoTotal não foi preenchido, calcula
            if (!data.custoTotal || parseFloat(data.custoTotal) <= 0) {
                const litros = parseFloat(data.litros);
                const valorPorLitro = parseFloat(data.valorPorLitro);
                if (litros > 0 && valorPorLitro > 0) {
                    data.custoTotal = (litros * valorPorLitro).toFixed(2);
                } else {
                    showMessage('Custo total não pôde ser calculado. Verifique os litros e o valor por litro.', 'error');
                    return;
                }
            }
            
            // Adiciona a placa do veículo para conveniência no backend (opcional)
            const selectedVeiculoOption = abastecimentoVeiculoSelect.options[abastecimentoVeiculoSelect.selectedIndex];
            if (selectedVeiculoOption && selectedVeiculoOption.value) {
                data.veiculoPlaca = selectedVeiculoOption.textContent.split(' - ')[0];
            }


            try {
                // Endpoint da API para registrar abastecimento (será criado no backend)
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/abastecimentos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const responseData = await response.json();

                if (response.ok) {
                    showMessage(responseData.message || 'Abastecimento registrado com sucesso!', 'success');
                    formRegistrarAbastecimento.reset();
                    // Recarregar veículos para atualizar o km no dataset do select, se necessário, ou atualizar dinamicamente
                    // await carregarVeiculos(); // Pode ser pesado, idealmente o backend retorna o veículo atualizado.
                    
                    // Atualiza o KM no dataset do select para o veículo que acabou de ser abastecido
                    if (selectedVeiculoOption && selectedVeiculoOption.value === data.veiculoId) {
                        selectedVeiculoOption.dataset.kmAtual = data.quilometragemAtual;
                         // Limpa e resseleciona para forçar a atualização visual do KM se o usuário for registrar de novo
                        const veiculoIdSelecionado = abastecimentoVeiculoSelect.value;
                        await carregarVeiculos(); // Recarrega para garantir que tudo está atualizado
                        abastecimentoVeiculoSelect.value = veiculoIdSelecionado; // Restaura a seleção
                        if (document.getElementById('abastecimentoKm')) { // E atualiza o campo de KM
                             document.getElementById('abastecimentoKm').value = data.quilometragemAtual;
                             document.getElementById('abastecimentoKm').min = data.quilometragemAtual;
                        }

                    } else {
                        await carregarVeiculos(); // Se algo deu errado na lógica acima, recarrega tudo.
                    }


                    // Adicional: Se a resposta do backend indicar um alerta de óleo, exibir aqui ou redirecionar.
                    if(responseData.alertaOleo) {
                        showMessage(responseData.message + ' ATENÇÃO: ' + responseData.alertaOleo, 'success'); // Mostra alerta junto com sucesso
                    }

                } else {
                    showMessage(responseData.message || `Erro ${response.status}: Não foi possível registrar o abastecimento.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar abastecimento:', error);
                showMessage('Erro de conexão ao tentar registrar o abastecimento. Verifique sua internet ou tente novamente.', 'error');
            }
        });
    }

    // Carregar dados iniciais da página
    if (window.location.pathname.includes('abastecimento.html')) {
        carregarVeiculos();
    }

    // A lógica de logout e welcomeMessage já deve estar no dashboard.js,
    // que está incluído no abastecimento.html.
    // Se não estivesse, seria adicionada aqui:
    // const logoutButton = document.getElementById('logoutButton');
    // const welcomeMessageEl = document.getElementById('welcomeMessage');
    // ... (lógica do localStorage e event listener para logout) ...
});
