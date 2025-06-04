// frontend/js/veiculos.js
document.addEventListener('DOMContentLoaded', function () {
    const corpoTabelaVeiculos = document.getElementById('corpoTabelaVeiculos');
    const messageElement = document.getElementById('messageVeiculos'); // Elemento de mensagem específico desta página

    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type);
        }
    }

    async function carregarVeiculos() {
        if (!corpoTabelaVeiculos) return; 
        
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
            
            if (!response.ok) { // Verifica se a resposta HTTP não foi bem-sucedida
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar veículos.` }));
                throw new Error(errorData.message);
            }

            const veiculos = await response.json();

            if (veiculos && veiculos.length > 0) {
                corpoTabelaVeiculos.innerHTML = ''; // Limpa a mensagem "Carregando..."
                veiculos.forEach(veiculo => {
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-vehicle-id', veiculo._id); // Adiciona ID à linha para referência futura
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
            } else {
                corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum veículo cadastrado ainda.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            showMessage(error.message || 'Falha na conexão ao tentar buscar veículos.', 'error');
            corpoTabelaVeiculos.innerHTML = `<tr><td colspan="7" class="text-center">Erro ao carregar veículos.</td></tr>`;
        }
    }

    // Delegação de eventos para os botões de ação na tabela
    if (corpoTabelaVeiculos) {
        corpoTabelaVeiculos.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action'); // Pega o botão de ação mais próximo

            if (!targetButton) return; // Sai se não foi um botão de ação

            const veiculoId = targetButton.dataset.id;

            if (!veiculoId) {
                console.error("ID do veículo não encontrado no botão.");
                showMessage("Não foi possível obter o ID do veículo.", "error");
                return;
            }

            if (targetButton.classList.contains('view')) {
                console.log("Botão Detalhes clicado para ID:", veiculoId);
                window.location.href = `detalhes_veiculo.html?id=${veiculoId}`; // Redireciona para a página de detalhes
            
            } else if (targetButton.classList.contains('edit')) {
                console.log("Botão Editar clicado para ID:", veiculoId);
                // window.location.href = `editar_veiculo.html?id=${veiculoId}`; // Será implementado
                alert(`Funcionalidade "Editar" para ID ${veiculoId} ainda não implementada.`);
            
            } else if (targetButton.classList.contains('delete')) {
                const veiculoRow = targetButton.closest('tr');
                const placaVeiculo = veiculoRow ? veiculoRow.querySelector('td:first-child').textContent : 'este veículo';

                if (confirm(`Tem certeza que deseja excluir ${placaVeiculo} (ID: ${veiculoId})? Esta ação não pode ser desfeita.`)) {
                    showMessage('Excluindo veículo...', 'info');
                    try {
                        const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
                        // const token = localStorage.getItem('authToken');
                        // const headers = { 'Authorization': `Bearer ${token}` };

                        const response = await fetch(backendUrl, {
                            method: 'DELETE',
                            // headers: headers // Adicionar quando tiver JWT
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao excluir o veículo.` }));
                            throw new Error(errorData.message);
                        }
                        
                        const data = await response.json();

                        showMessage(data.message || 'Veículo excluído com sucesso!', 'success');
                        if (veiculoRow) {
                            veiculoRow.remove(); // Remove a linha da tabela no frontend
                        }
                        // Verificar se a tabela ficou vazia após a exclusão
                        if (corpoTabelaVeiculos.children.length === 0) {
                            corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum veículo cadastrado ainda.</td></tr>';
                        }
                    } catch (error) {
                        console.error('Erro ao excluir veículo:', error);
                        showMessage(error.message || 'Erro de conexão ao tentar excluir o veículo.', 'error');
                    }
                }
            }
        });
    }

    // Lógica do header (logout/welcome) - Copiada do dashboard.js para consistência
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User'); // Deve ser a mesma chave usada no login.js
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
            // localStorage.removeItem('authToken'); // Remover token JWT futuramente
            window.location.href = 'login.html'; // Redireciona para a página de login
        });
    }

    // Só carrega os dados se estivermos na página de veículos
    if (window.location.pathname.includes('veiculos.html')) {
        carregarVeiculos();
    }
});
