// frontend/js/manutencao.js
document.addEventListener('DOMContentLoaded', function() {
    const upcomingMaintenanceSection = document.getElementById('upcomingMaintenance');
    const maintenanceHistoryBody = document.getElementById('maintenanceHistoryBody');
    const messageElement = document.getElementById('messageMaintenance');
    const searchInput = document.getElementById('searchMaintenanceInput');

    function showMessage(text, type) {
        if (!messageElement) return;
        messageElement.textContent = text;
        messageElement.className = 'message-feedback';
        if (type) {
            messageElement.classList.add(type);
        }
    }

    // Função para carregar e exibir próximas manutenções (ex: widgets)
    async function loadUpcomingMaintenance() {
        if (!upcomingMaintenanceSection) return;
        upcomingMaintenanceSection.innerHTML = '<p class="loading-message text-center">Carregando próximas manutenções...</p>';

        try {
            // **IMPORTANTE:** Este endpoint precisa ser criado na sua API (ver próximo passo)
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes/proximas');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar próximas manutenções.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Espera um array de objetos de manutenção

            if (data && data.length > 0) {
                upcomingMaintenanceSection.innerHTML = ''; // Limpa a mensagem de carregamento
                // Exemplo: Criar cards para cada manutenção próxima, usando a classe dashboard-widgets para layout em grid
                data.forEach(maint => {
                    const widget = document.createElement('div');
                    widget.className = 'widget'; // Reutilizando o estilo de widget do dashboard
                    const iconClass = maint.tipo === 'oleo' ? 'fa-gas-pump' : maint.tipo === 'checklist' ? 'fa-clipboard-check' : 'fa-tools';
                    const mainData = maint.tipo === 'oleo' ? `${maint.kmPrevisto} km` : maint.dataPrevista ? new Date(maint.dataPrevista).toLocaleDateString('pt-BR') : '--';

                    widget.innerHTML = `
                        <div class="widget-icon" style="background-color: var(--primary-blue); color: var(--neutral-white);">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="widget-content">
                            <h2>${maint.tipo === 'oleo' ? 'Próx. Óleo' : maint.tipo === 'checklist' ? 'Próx. Checklist' : 'Manutenção'} - ${maint.veiculoPlaca}</h2>
                            <span class="widget-data">${mainData}</span>
                            <p style="font-size:0.85em; color:var(--text-muted); margin-top:5px;">${maint.descricao || ''}</p>
                        </div>
                    `;
                    upcomingMaintenanceSection.appendChild(widget);
                });
            } else {
                upcomingMaintenanceSection.innerHTML = '<p class="text-center">Nenhuma manutenção futura ou alerta no momento.</p>';
            }

        } catch (error) {
            console.error('Erro ao carregar próximas manutenções:', error);
            showMessage(error.message || 'Falha ao carregar próximas manutenções.', 'error');
            upcomingMaintenanceSection.innerHTML = `<p class="error-message text-center">Erro ao carregar próximas manutenções.</p>`;
        }
    }

    // Função para carregar e exibir histórico de manutenções (tabela)
    async function loadMaintenanceHistory(searchTerm = '') {
        if (!maintenanceHistoryBody) return;
        maintenanceHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando histórico de manutenções...</td></tr>';

        try {
            // **IMPORTANTE:** Este endpoint precisa ser criado na sua API
            let url = 'https://gpx-api-xwv1.onrender.com/api/manutencoes/historico';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar histórico de manutenções.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Espera um array de objetos de histórico

            if (data && data.length > 0) {
                maintenanceHistoryBody.innerHTML = ''; // Limpa a mensagem de carregamento
                data.forEach(maint => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${maint.veiculoPlaca || '--'}</td>
                        <td>${maint.tipoManutencao || '--'}</td>
                        <td>${maint.dataRealizacao ? new Date(maint.dataRealizacao).toLocaleDateString('pt-BR') : '--'}</td>
                        <td>${maint.custo ? 'R$ ' + maint.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}</td>
                        <td>${maint.descricao || '--'}</td>
                        <td class="action-buttons">
                            <button class="btn-action view" title="Ver Detalhes" data-id="${maint._id}"><i class="fas fa-eye"></i></button>
                            <button class="btn-action edit" title="Editar Manutenção" data-id="${maint._id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete" title="Excluir Manutenção" data-id="${maint._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    maintenanceHistoryBody.appendChild(tr);
                });
            } else {
                maintenanceHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum histórico de manutenção encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de manutenções:', error);
            showMessage(error.message || 'Falha ao carregar histórico de manutenções.', 'error');
            maintenanceHistoryBody.innerHTML = `<p class="error-message text-center">Erro ao carregar histórico.</p>`;
        }
    }

    // Event listener para o campo de busca
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadMaintenanceHistory(this.value);
            }, 500); // Atraso de 500ms para buscar após o usuário parar de digitar
        });
    }

    // Event listener para os botões de ação na tabela de histórico
    if (maintenanceHistoryBody) {
        maintenanceHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;

            const maintenanceId = targetButton.dataset.id;

            if (targetButton.classList.contains('view')) {
                // Redirecionar para uma página de detalhes de manutenção (se houver)
                console.log('Ver detalhes da manutenção:', maintenanceId);
                // window.location.href = `detalhes_manutencao.html?id=${maintenanceId}`;
                showMessage('Funcionalidade de detalhes de manutenção em desenvolvimento.', 'info');
            } else if (targetButton.classList.contains('edit')) {
                // Redirecionar para uma página de edição de manutenção (se houver)
                console.log('Editar manutenção:', maintenanceId);
                // window.location.href = `editar_manutencao.html?id=${maintenanceId}`;
                showMessage('Funcionalidade de edição de manutenção em desenvolvimento.', 'info');
            } else if (targetButton.classList.contains('delete')) {
                if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                    showMessage('Excluindo manutenção...', 'info');
                    try {
                        // **IMPORTANTE:** Este endpoint precisa ser criado na sua API
                        const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/manutencoes/${maintenanceId}`, { method: 'DELETE' });
                        const responseData = await response.json();

                        if (response.ok) {
                            showMessage(responseData.message || 'Manutenção excluída com sucesso!', 'success');
                            loadMaintenanceHistory(); // Recarrega a tabela após exclusão
                        } else {
                            throw new Error(responseData.message || `Erro ${response.status} ao excluir manutenção.`);
                        }
                    } catch (error) {
                        console.error('Erro ao excluir manutenção:', error);
                        showMessage(error.message || 'Falha ao excluir manutenção.', 'error');
                    }
                }
            }
        });
    }

    // Lógica do header (logout/welcome) - idealmente centralizada ou em dashboard.js
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

    // Carregar dados quando a página for carregada
    if (window.location.pathname.includes('manutencao.html')) {
        loadUpcomingMaintenance();
        loadMaintenanceHistory();
    }
});
