// frontend/js/editar_veiculo.js
document.addEventListener('DOMContentLoaded', function() {
    const formEditarVeiculo = document.getElementById('formEditarVeiculo');
    const messageElement = document.getElementById('message');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

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

    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback';
        if (type) {
            messageElement.classList.add(type);
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const veiculoId = urlParams.get('id');

    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    }

    async function carregarDadosParaEdicao() {
        if (!veiculoId) {
            showMessage('ID do veículo não fornecido para edição.', 'error');
            if(formEditarVeiculo) formEditarVeiculo.style.display = 'none';
            return;
        }
        showMessage('Carregando dados do veículo...', 'info');
        try {
            const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
            const response = await fetch(backendUrl);

            if (response.ok) {
                const veiculo = await response.json();
                showMessage('');

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
                if(formEditarVeiculo) formEditarVeiculo.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao buscar dados do veículo para edição:', error);
            showMessage('Falha na conexão ao buscar dados para edição.', 'error');
            if(formEditarVeiculo) formEditarVeiculo.style.display = 'none';
        }
    }

    if (formEditarVeiculo) {
        formEditarVeiculo.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage('', 'info');

            const formData = new FormData(formEditarVeiculo);
            const dadosAtualizados = {};
            formData.forEach((value, key) => {
                if (key === 'anoFabricacao' || key === 'anoModelo' || key === 'quilometragemAtual' || key === 'oleoKm' || key === 'frequenciaChecklist') {
                    dadosAtualizados[key] = value ? parseInt(value, 10) : null;
                } else if (key === 'oleoData') {
                    dadosAtualizados[key] = value ? value : null; 
                } else {
                    dadosAtualizados[key] = value.trim() === '' ? null : value.trim();
                }
            });

            if (!dadosAtualizados.placa || !dadosAtualizados.marca || !dadosAtualizados.modelo || !dadosAtualizados.anoFabricacao || !dadosAtualizados.anoModelo || dadosAtualizados.quilometragemAtual === null) {
                showMessage('Por favor, preencha todos os campos obrigatórios (*).', 'error');
                return;
            }

            showMessage('Salvando alterações...', 'info');

            try {
                const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
                const response = await fetch(backendUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });

                const responseData = await response.json();

                if (response.ok) {
                    showMessage(responseData.message || 'Veículo atualizado com sucesso!', 'success');
                    setTimeout(() => {
                        window.location.href = `detalhes_veiculo.html?id=${veiculoId}`;
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

    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', function() {
            if (veiculoId) {
                window.location.href = `detalhes_veiculo.html?id=${veiculoId}`;
            } else {
                window.location.href = 'veiculos.html'; 
            }
        });
    }
    
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

    if (window.location.pathname.includes('editar_veiculo.html')) {
        carregarDadosParaEdicao();
    }
});
