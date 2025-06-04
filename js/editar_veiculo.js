// frontend/js/detalhes_veiculo.js
document.addEventListener('DOMContentLoaded', function() {
    const detalhesVeiculoContent = document.getElementById('detalhesVeiculoContent');
    const messageElement = document.getElementById('messageDetalhes');
    const btnEditarVeiculo = document.getElementById('btnEditarVeiculo');

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

    async function carregarDetalhesVeiculo() {
        if (!veiculoId) {
            showMessage('ID do veículo não fornecido na URL.', 'error');
            if (detalhesVeiculoContent) detalhesVeiculoContent.innerHTML = '<p class="error-message" style="text-align:center; color:var(--error-red);">ID do veículo não especificado na URL.</p>';
            if (btnEditarVeiculo) btnEditarVeiculo.style.display = 'none'; // Esconde o botão se não há ID
            return;
        }
        if (!detalhesVeiculoContent) {
            console.error("Elemento 'detalhesVeiculoContent' não encontrado no DOM.");
            return;
        }

        detalhesVeiculoContent.innerHTML = '<p class="loading-message" style="text-align:center;">Carregando detalhes do veículo...</p>';
        showMessage('', 'info');

        try {
            const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
            // const token = localStorage.getItem('authToken');
            // const headers = { 'Authorization': `Bearer ${token}` };

            const response = await fetch(backendUrl /*, { headers } */);
            
            if (response.ok) {
                const veiculo = await response.json();
                if (!veiculo || Object.keys(veiculo).length === 0) {
                    showMessage('Dados do veículo não encontrados ou veículo inválido.', 'error');
                    detalhesVeiculoContent.innerHTML = `<p class="error-message" style="text-align:center; color:var(--error-red);">Veículo não encontrado.</p>`;
                    if (btnEditarVeiculo) btnEditarVeiculo.style.display = 'none'; // Esconde o botão se não encontrar veículo
                    return;
                }
                showMessage(''); 
                
                const formatDate = (dateString) => {
                    if (!dateString) return '--';
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return '--'; 
                    date.setUTCDate(date.getUTCDate()); // Ajusta para data local sem mudar o dia por fuso
                    return date.toLocaleDateString('pt-BR', { /* timeZone: 'UTC' */ }); // Removido timeZone UTC para exibir data local
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
                        <div class="detail-item"><strong>Km Atual:</strong> <span>${veiculo.quilometragemAtual !== null && veiculo.quilometragemAtual !== undefined ? veiculo.quilometragemAtual.toLocaleString('pt-BR') + ' km' : '--'}</span></div>
                        <div class="detail-item"><strong>Data de Cadastro:</strong> <span>${formatDate(veiculo.dataCadastro)}</span></div>
                    </div>
                    <h3>Informações de Manutenção</h3>
                    <div class="details-grid">
                        <div class="detail-item"><strong>Próx. Troca de Óleo (Km):</strong> <span>${veiculo.manutencaoInfo?.proxTrocaOleoKm ? veiculo.manutencaoInfo.proxTrocaOleoKm.toLocaleString('pt-BR') + ' km' : '--'}</span></div>
                        <div class="detail-item"><strong>Próx. Troca de Óleo (Data):</strong> <span>${formatDate(veiculo.manutencaoInfo?.proxTrocaOleoData)}</span></div>
                        <div class="detail-item"><strong>Frequência Checklist:</strong> <span>${veiculo.manutencaoInfo?.frequenciaChecklistDias ? veiculo.manutencaoInfo.frequenciaChecklistDias + ' dias' : '--'}</span></div>
                        <div class="detail-item"><strong>Próximo Checklist (Data):</strong> <span>${formatDate(veiculo.manutencaoInfo?.dataProxChecklist)}</span></div>
                    </div>
                `;

                // Configura o botão de editar APÓS carregar os dados do veículo
                if (btnEditarVeiculo) {
                    btnEditarVeiculo.style.display = 'inline-flex'; // Garante que o botão está visível
                    btnEditarVeiculo.onclick = () => {
                        if (veiculoId) {
                            console.log("Redirecionando da página de DETALHES para Editar Veículo ID:", veiculoId);
                            window.location.href = `editar_veiculo.html?id=${veiculoId}`;
                        } else {
                            console.error("ID do Veículo não disponível para edição a partir da página de detalhes.");
                            showMessage("Não foi possível determinar o veículo para edição.", "error");
                        }
                    };
                }

            } else {
                const errorData = await response.json().catch(() => ({ message: `Veículo não encontrado ou erro ${response.status} ao buscar dados.` }));
                showMessage(errorData.message || `Erro ${response.status}.`, 'error');
                detalhesVeiculoContent.innerHTML = `<p class="error-message" style="text-align:center; color:var(--error-red);">${errorData.message || 'Não foi possível carregar os detalhes do veículo.'}</p>`;
                if (btnEditarVeiculo) btnEditarVeiculo.style.display = 'none'; // Esconde o botão se houver erro
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do veículo:', error);
            showMessage('Falha na conexão ao buscar detalhes. Verifique sua internet ou tente novamente.', 'error');
            detalhesVeiculoContent.innerHTML = `<p class="error-message" style="text-align:center; color:var(--error-red);">Erro de conexão. Não foi possível carregar os detalhes.</p>`;
            if (btnEditarVeiculo) btnEditarVeiculo.style.display = 'none'; // Esconde o botão se houver erro de conexão
        }
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

    if (window.location.pathname.includes('detalhes_veiculo.html')) {
        if (btnEditarVeiculo) btnEditarVeiculo.style.display = 'none'; // Esconde inicialmente até os dados carregarem
        carregarDetalhesVeiculo();
    }
});
