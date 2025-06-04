// frontend/js/veiculos.js
document.addEventListener('DOMContentLoaded', function () {
    const corpoTabelaVeiculos = document.getElementById('corpoTabelaVeiculos');
    const messageElement = document.getElementById('messageVeiculos'); // Elemento de mensagem específico desta página

    // Função auxiliar para exibir mensagens de feedback
    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type);
        }
    }

    async function carregarVeiculos() {
        if (!corpoTabelaVeiculos) return; // Sai se a tabela não existir na página
        
        corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Carregando veículos...</td></tr>';
        showMessage('', 'info'); // Limpa mensagens anteriores

        try {
            const backendUrl = 'https://gpx-api-xwv1.onrender.com/api/veiculos';
            // const token = localStorage.getItem('authToken'); // Para quando tivermos JWT
            // const headers = {
            //     'Content-Type': 'application/json',
            //     'Authorization': `Bearer ${token}`
            // };

            const response = await fetch(backendUrl /*, { headers } */); // Adicionar headers com token futuramente
            const veiculos = await response.json();

            if (response.ok) {
                if (veiculos && veiculos.length > 0) {
                    corpoTabelaVeiculos.innerHTML = ''; // Limpa a mensagem "Carregando..."
                    veiculos.forEach(veiculo => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${veiculo.placa || '--'}</td>
                            <td>${veiculo.marca || '--'}</td>
                            <td>${veiculo.modelo || '--'}</td>
                            <td>${veiculo.anoFabricacao || '--'}/${veiculo.anoModelo || '--'}</td>
                            <td>${veiculo.cor || '--'}</td>
                            <td>${veiculo.quilometragemAtual !== null && veiculo.quilometragemAtual !== undefined ? veiculo.quilometragemAtual.toLocaleString('pt-BR') + ' km' : '--'}</td>
                            <td class="action-buttons">
                                <button class="btn-action view" title="Detalhes" data-id="${veiculo._id}"><i class="fas fa-eye"></i></button>
                                <button class="btn-action edit" title="Editar" data-id="${veiculo._id}"><i class="fas fa-edit"></i></button>
                                <button class="btn-action delete" title="Excluir" data-id="${veiculo._id}"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        corpoTabelaVeiculos.appendChild(tr);
                    });
                    // Adicionar event listeners para os botões de ação aqui depois
                } else {
                    corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum veículo cadastrado ainda.</td></tr>';
                }
            } else {
                // Se a API retornar um erro JSON com uma mensagem
                const errorData = veiculos; // response.json() pode ter retornado o corpo do erro
                showMessage(errorData.message || `Erro ${response.status}: Não foi possível buscar os veículos.`, 'error');
                corpoTabelaVeiculos.innerHTML = `<tr><td colspan="7" class="text-center">Erro ao carregar veículos.</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            showMessage('Falha na conexão ao tentar buscar veículos. Verifique sua internet ou tente novamente.', 'error');
            corpoTabelaVeiculos.innerHTML = `<tr><td colspan="7" class="text-center">Erro de conexão ao carregar veículos.</td></tr>`;
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

    // Só carrega os dados se estivermos na página de veículos
    if (window.location.pathname.includes('veiculos.html')) {
        carregarVeiculos();
    }
});
