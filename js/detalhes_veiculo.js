// frontend/js/detalhes_veiculo.js
document.addEventListener('DOMContentLoaded', function() {
    const detalhesVeiculoContent = document.getElementById('detalhesVeiculoContent');
    const messageElement = document.getElementById('messageDetalhes');
    const btnEditarVeiculo = document.getElementById('btnEditarVeiculo');

    // Função auxiliar para exibir mensagens de feedback
    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type);
        }
    }

    // Pega o ID do veículo da URL (ex: detalhes_veiculo.html?id=12345)
    const urlParams = new URLSearchParams(window.location.search);
    const veiculoId = urlParams.get('id');

    async function carregarDetalhesVeiculo() {
        if (!veiculoId) {
            showMessage('ID do veículo não fornecido na URL.', 'error');
            if (detalhesVeiculoContent) detalhesVeiculoContent.innerHTML = '<p class="error-message">ID do veículo não especificado.</p>';
            return;
        }
        if (!detalhesVeiculoContent) return;

        showMessage('Carregando...', 'info');

        try {
            const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
            // const token = localStorage.getItem('authToken'); // Para quando tivermos JWT
            // const headers = { 'Authorization': `Bearer ${token}` };

            const response = await fetch(backendUrl /*, { headers } */); // Adicionar headers com token futuramente
            
            if (response.ok) {
                const veiculo = await response.json();
                showMessage(''); // Limpa mensagem de carregando/erro
                
                // Formata as datas para exibição (dd/mm/yyyy)
                const formatDate = (dateString) => {
                    if (!dateString) return '--';
                    const date = new Date(dateString);
                    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // UTC para evitar problemas de fuso
                };

                detalhesVeiculoContent.innerHTML = `
                    <div class="details-grid">
                        <div class="detail-item"><strong>Placa:</strong> <span>${veiculo.placa || '--'}</span></div>
                        <div class="detail-item"><strong>Marca:</strong> <span>${veiculo.marca || '--'}</span></div>
                        <div class="detail-item"><strong>Modelo:</strong> <span>${veiculo.modelo || '--'}</span></div>
                        <div class="detail-item"><strong>Ano Fabricação:</strong> <span>${veiculo.anoFabricacao || '--'}</span></div>
                        <div class="detail-item"><strong>Ano Modelo:</strong> <span>${veiculo.anoModelo || '--'}</span></div>
                        <div class="detail-item"><strong>Cor:</strong> <span>${veiculo.cor || '--'}</span></div>
                        <div class="detail-item"><strong>Chassi (VIN):</strong> <span>${veiculo.chassi || '--'}</span></div>
                        <div class="detail-item"><strong>Renavam:</strong> <span>${veiculo.renavam || '--'}</span></div>
                        <div class="detail-item"><strong>Km Atual:</strong> <span>${veiculo.quilometragemAtual !== null ? veiculo.quilometragemAtual.toLocaleString('pt-BR') + ' km' : '--'}</span></div>
                        <div class="detail-item"><strong>Data de Cadastro:</strong> <span>${formatDate(veiculo.dataCadastro)}</span></div>
                    </div>
                    <h3>Informações de Manutenção</h3>
                    <div class="details-grid">
                        <div class="detail-item"><strong>Próx. Troca de Óleo (Km):</strong> <span>${veiculo.manutencaoInfo?.proxTrocaOleoKm || '--'} km</span></div>
                        <div class="detail-item"><strong>Próx. Troca de Óleo (Data):</strong> <span>${formatDate(veiculo.manutencaoInfo?.proxTrocaOleoData)}</span></div>
                        <div class="detail-item"><strong>Frequência Checklist:</strong> <span>${veiculo.manutencaoInfo?.frequenciaChecklistDias ? veiculo.manutencaoInfo.frequenciaChecklistDias + ' dias' : '--'}</span></div>
                        <div class="detail-item"><strong>Próximo Checklist (Data):</strong> <span>${formatDate(veiculo.manutencaoInfo?.dataProxChecklist)}</span></div>
                    </div>
                `;

                if (btnEditarVeiculo) {
                    btnEditarVeiculo.onclick = () => {
                        // window.location.href = `editar_veiculo.html?id=${veiculoId}`; // Futuramente
                        alert(`Funcionalidade "Editar" para ID ${veiculoId} ainda não implementada.`);
                    };
                }

            } else {
                const errorData = await response.json().catch(() => ({ message: `Veículo não encontrado ou erro ${response.status}.` }));
                showMessage(errorData.message || `Erro ${response.status}: Não foi possível buscar os detalhes do veículo.`, 'error');
                detalhesVeiculoContent.innerHTML = `<p class="error-message">${errorData.message || 'Veículo não encontrado.'}</p>`;
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do veículo:', error);
            showMessage('Falha na conexão ao buscar detalhes. Verifique sua internet ou tente novamente.', 'error');
            detalhesVeiculoContent.innerHTML = `<p class="error-message">Erro de conexão ao carregar detalhes.</p>`;
        }
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

    if (window.location.pathname.includes('detalhes_veiculo.html')) {
        carregarDetalhesVeiculo();
    }
});
