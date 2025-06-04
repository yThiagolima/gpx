// frontend/js/veiculos.js
document.addEventListener('DOMContentLoaded', function () {
    const corpoTabelaVeiculos = document.getElementById('corpoTabelaVeiculos');
    const messageElement = document.getElementById('messageVeiculos');

    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback';
        if (type) {
            messageElement.classList.add(type);
        }
    }

    async function carregarVeiculos() {
        if (!corpoTabelaVeiculos) return;
        
        corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Carregando veículos...</td></tr>';
        showMessage('', 'info');

        try {
            const backendUrl = 'https://gpx-api-xwv1.onrender.com/api/veiculos';
            // const token = localStorage.getItem('authToken');
            // const headers = { 'Authorization': `Bearer ${token}` }; // Futuramente

            const response = await fetch(backendUrl /*, { headers }*/);
            const veiculos = await response.json();

            if (response.ok) {
                if (veiculos && veiculos.length > 0) {
                    corpoTabelaVeiculos.innerHTML = '';
                    veiculos.forEach(veiculo => {
                        const tr = document.createElement('tr');
                        tr.setAttribute('data-id', veiculo._id); // Adiciona o ID à linha da tabela também
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
            } else {
                const errorData = veiculos; 
                showMessage(errorData.message || `Erro ${response.status}: Não foi possível buscar os veículos.`, 'error');
                corpoTabelaVeiculos.innerHTML = `<tr><td colspan="7" class="text-center">Erro ao carregar veículos.</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            showMessage('Falha na conexão ao tentar buscar veículos.', 'error');
            corpoTabelaVeiculos.innerHTML = `<tr><td colspan="7" class="text-center">Erro de conexão ao carregar veículos.</td></tr>`;
        }
    }

    // --- LÓGICA PARA OS BOTÕES DE AÇÃO (EXCLUIR) ---
    if (corpoTabelaVeiculos) {
        corpoTabelaVeiculos.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action.delete'); // Procura o botão de excluir mais próximo

            if (targetButton) {
                const veiculoId = targetButton.dataset.id;
                const veiculoRow = targetButton.closest('tr'); // Pega a linha da tabela (tr)
                const placaVeiculo = veiculoRow.querySelector('td:first-child').textContent; // Pega a placa para a mensagem

                if (confirm(`Tem certeza que deseja excluir o veículo com placa ${placaVeiculo} (ID: ${veiculoId})? Esta ação não pode ser desfeita.`)) {
                    showMessage('Excluindo veículo...', 'info');
                    try {
                        const backendUrl = `https://gpx-api-xwv1.onrender.com/api/veiculos/${veiculoId}`;
                        // const token = localStorage.getItem('authToken');
                        // const headers = { 'Authorization': `Bearer ${token}` };

                        const response = await fetch(backendUrl, {
                            method: 'DELETE',
                            // headers: headers // Adicionar quando tiver JWT
                        });

                        const data = await response.json();

                        if (response.ok) { // Status 200 ou 204
                            showMessage(data.message || 'Veículo excluído com sucesso!', 'success');
                            if (veiculoRow) {
                                veiculoRow.remove(); // Remove a linha da tabela no frontend
                            }
                            // Opcional: Recarregar a lista inteira se preferir: carregarVeiculos();
                            // Verificar se a tabela ficou vazia após a exclusão
                            if (corpoTabelaVeiculos.children.length === 0) {
                                corpoTabelaVeiculos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum veículo cadastrado ainda.</td></tr>';
                            }
                        } else {
                            showMessage(data.message || `Erro ${response.status}: Não foi possível excluir o veículo.`, 'error');
                        }
                    } catch (error) {
                        console.error('Erro ao excluir veículo:', error);
                        showMessage('Erro de conexão ao tentar excluir o veículo.', 'error');
                    }
                }
            }
            
            // Aqui você pode adicionar a lógica para os botões 'view' e 'edit' de forma similar
            const viewButton = event.target.closest('button.btn-action.view');
            if (viewButton) {
                const veiculoId = viewButton.dataset.id;
                console.log("Clicou em Detalhes para o ID:", veiculoId);
                // window.location.href = `detalhes_veiculo.html?id=${veiculoId}`; // Exemplo para futura página
                alert(`Funcionalidade "Detalhes" para ID ${veiculoId} ainda não implementada.`);
            }

            const editButton = event.target.closest('button.btn-action.edit');
            if (editButton) {
                const veiculoId = editButton.dataset.id;
                console.log("Clicou em Editar para o ID:", veiculoId);
                // window.location.href = `editar_veiculo.html?id=${veiculoId}`; // Exemplo para futura página
                alert(`Funcionalidade "Editar" para ID ${veiculoId} ainda não implementada.`);
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

    if (window.location.pathname.includes('veiculos.html')) {
        carregarVeiculos();
    }
});
