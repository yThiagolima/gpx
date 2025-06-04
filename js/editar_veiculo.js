// frontend/js/editar_veiculo.js
document.addEventListener('DOMContentLoaded', function() {
    const formEditarVeiculo = document.getElementById('formEditarVeiculo');
    const messageElement = document.getElementById('message'); // O <p id="message"> no seu HTML
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

    // Elementos do formulário (para preenchimento e coleta)
    const placaInput = document.getElementById('placa');
    const marcaInput = document.getElementById('marca');
    const modeloInput = document.getElementById('modelo');
    const anoFabricacaoInput = document.getElementById('anoFabricacao');
    const anoModeloInput = document.getElementById('anoModelo');
    const corInput = document.getElementById('cor');
    const chassiInput = document.getElementById('chassi');
    const renavamInput = document.getElementById('renavam');
    const quilometragemAtualInput = document.getElementById('quilometragemAtual');
    const oleoKmInput = document.getElementById('oleoKm');
    const oleoDataInput = document.getElementById('oleoData');
    const frequenciaChecklistInput = document.getElementById('frequenciaChecklist');

    // Função auxiliar para exibir mensagens de feedback
    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type);
        }
    }

    // Pega o ID do veículo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const veiculoId = urlParams.get('id');

    // Função para formatar data YYYY-MM-DD para campos do tipo 'date'
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        // Adiciona 1 dia para corrigir potencial problema de fuso horário na conversão para input date
        // Isso acontece porque new Date('YYYY-MM-DD') pode ser interpretado como UTC meia-noite,
        // e ao converter para fuso local, pode voltar um dia.
        date.setUTCDate(date.getUTCDate() + 1); 
        return date.toISOString().split('T')[0];
    }


    // Carrega os dados do veículo para preencher o formulário
    async function carregarDadosParaEdicao() {
        if (!veiculoId) {
            showMessage('ID do veículo não fornecido para edição.', 'error');
            // Desabilitar formulário ou redirecionar
            if(formEditarVeiculo) formEditarVeiculo.style.display = 'none';
            return;
        }

        showMessage('Carregando dados do veículo...', 'info');

        try {
            const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
            // const token = localStorage.getItem('authToken');
            // const headers = { 'Authorization': `Bearer ${token}` };

            const response = await fetch(backendUrl /*, { headers } */);

            if (response.ok) {
                const veiculo = await response.json();
                showMessage(''); // Limpa mensagem

                // Preenche o formulário
                if(placaInput) placaInput.value = veiculo.placa || '';
                if(marcaInput) marcaInput.value = veiculo.marca || '';
                if(modeloInput) modeloInput.value = veiculo.modelo || '';
                if(anoFabricacaoInput) anoFabricacaoInput.value = veiculo.anoFabricacao || '';
                if(anoModeloInput) anoModeloInput.value = veiculo.anoModelo || '';
                if(corInput) corInput.value = veiculo.cor || '';
                if(chassiInput) chassiInput.value = veiculo.chassi || '';
                if(renavamInput) renavamInput.value = veiculo.renavam || '';
                if(quilometragemAtualInput) quilometragemAtualInput.value = veiculo.quilometragemAtual || '';
                
                if (veiculo.manutencaoInfo) {
                    if(oleoKmInput) oleoKmInput.value = veiculo.manutencaoInfo.proxTrocaOleoKm || '';
                    if(oleoDataInput) oleoDataInput.value = formatDateForInput(veiculo.manutencaoInfo.proxTrocaOleoData);
                    if(frequenciaChecklistInput) frequenciaChecklistInput.value = veiculo.manutencaoInfo.frequenciaChecklistDias || '';
                }

            } else {
                const errorData = await response.json().catch(() => ({ message: `Veículo não encontrado ou erro ${response.status}.` }));
                showMessage(errorData.message || 'Não foi possível carregar os dados do veículo para edição.', 'error');
                if(formEditarVeiculo) formEditarVeiculo.style.display = 'none'; // Esconde o formulário se não puder carregar
            }
        } catch (error) {
            console.error('Erro ao buscar dados do veículo para edição:', error);
            showMessage('Falha na conexão ao buscar dados para edição.', 'error');
            if(formEditarVeiculo) formEditarVeiculo.style.display = 'none';
        }
    }

    // Event listener para o envio do formulário de edição
    if (formEditarVeiculo) {
        formEditarVeiculo.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage('', 'info');

            const formData = new FormData(formEditarVeiculo);
            const dadosAtualizados = {};
            formData.forEach((value, key) => {
                // Converte campos numéricos para número, se não vazios
                if (key === 'anoFabricacao' || key === 'anoModelo' || key === 'quilometragemAtual' || key === 'oleoKm' || key === 'frequenciaChecklist') {
                    dadosAtualizados[key] = value ? parseInt(value, 10) : null;
                } else if (key === 'oleoData') { // Trata campo de data
                    dadosAtualizados[key] = value ? value : null; // Envia como string YYYY-MM-DD ou null
                }
                else {
                    dadosAtualizados[key] = value.trim() === '' ? null : value.trim();
                }
            });

            // Validação básica (similar à de cadastro)
            if (!dadosAtualizados.placa || !dadosAtualizados.marca || !dadosAtualizados.modelo || !dadosAtualizados.anoFabricacao || !dadosAtualizados.anoModelo || dadosAtualizados.quilometragemAtual === null) {
                showMessage('Por favor, preencha todos os campos obrigatórios (*).', 'error');
                return;
            }

            showMessage('Salvando alterações...', 'info');

            try {
                const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
                // const token = localStorage.getItem('authToken');
                // const headers = { 
                //     'Content-Type': 'application/json',
                //     'Authorization': `Bearer ${token}` 
                // };

                const response = await fetch(backendUrl, {
                    method: 'PUT', // Método HTTP para atualização
                    headers: {
                        'Content-Type': 'application/json',
                        // headers: headers // Adicionar quando tiver JWT
                    },
                    body: JSON.stringify(dadosAtualizados)
                });

                const responseData = await response.json();

                if (response.ok) {
                    showMessage(responseData.message || 'Veículo atualizado com sucesso!', 'success');
                    // Opcional: Redirecionar para a página de detalhes ou lista após um tempo
                    setTimeout(() => {
                        window.location.href = `detalhes_veiculo.html?id=${veiculoId}`; // Volta para os detalhes do veículo atualizado
                    }, 2000);
                } else {
                    showMessage(responseData.message || `Erro ${response.status}: Não foi possível atualizar o veículo.`, 'error');
                }

            } catch (error) {
                console.error('Erro ao tentar atualizar veículo:', error);
                showMessage('Erro de conexão ao tentar atualizar o veículo.', 'error');
            }
        });
    }

    // Event listener para o botão "Cancelar"
    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', function() {
            // Volta para a página de detalhes do veículo ou para a lista de veículos
            if (veiculoId) {
                window.location.href = `detalhes_veiculo.html?id=${veiculoId}`;
            } else {
                window.location.href = 'veiculos.html'; // Fallback se não houver ID (improvável aqui)
            }
        });
    }
    

    // Lógica do header (logout/welcome)
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username) {
                welcomeMessage.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) { console.error("Erro ao parsear usuário do localStorage:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            window.location.href = 'login.html';
        });
    }

    // Chama a função para carregar os dados do veículo quando a página carrega
    if (window.location.pathname.includes('editar_veiculo.html')) {
        carregarDadosParaEdicao();
    }
});
