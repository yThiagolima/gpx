// frontend/js/manutencao.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais da página
    const upcomingMaintenanceSection = document.getElementById('upcomingMaintenance');
    const maintenanceHistoryBody = document.getElementById('maintenanceHistoryBody');
    const checklistHistoryBody = document.getElementById('checklistHistoryBody');
    const messageUpcoming = document.getElementById('messageUpcoming');
    const messageRegistro = document.getElementById('messageRegistro');
    const messageHistory = document.getElementById('messageHistory');
    const messageChecklistHistory = document.getElementById('messageChecklistHistory');

    // Botões para exibir/ocultar formulários
    const showMaintenanceFormBtn = document.getElementById('showMaintenanceFormBtn');
    const showChecklistFormBtn = document.getElementById('showChecklistFormBtn');

    // Formulários de registro
    const formRegistrarManutencao = document.getElementById('formRegistrarManutencao');
    const formRegistrarChecklist = document.getElementById('formRegistrarChecklist');

    // Selects de veículos nos formulários
    const manutencaoVeiculoSelect = document.getElementById('manutencaoVeiculo');
    const checklistVeiculoSelect = document.getElementById('checklistVeiculo');

    // Campos de busca
    const searchMaintenanceInput = document.getElementById('searchInput'); // Corrigido para 'searchInput'
    const searchChecklistInput = document.getElementById('searchChecklistInput');

    // --- Função auxiliar para exibir mensagens ---
    function showMessage(element, text, type) {
        if (!element) {
            console.warn("Elemento de mensagem não encontrado:", element);
            return;
        }
        element.textContent = text;
        element.className = 'message-feedback'; // Reseta as classes
        if (type) {
            element.classList.add(type);
        }
        // Opcional: esconder a mensagem após X segundos (descomente se desejar)
        // setTimeout(() => { element.textContent = ''; element.style.display = 'none'; }, 5000);
    }

    // --- Funções de Carregamento de Dados ---

    // Carrega a lista de veículos para os selects nos formulários
    async function carregarVeiculosParaSelects() {
        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();

            // Preenche o select do formulário de Manutenção
            if (manutencaoVeiculoSelect) {
                manutencaoVeiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
                veiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v._id; // O ID do veículo no banco de dados
                    option.dataset.placa = v.placa; // Armazena a placa como um data attribute
                    option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                    manutencaoVeiculoSelect.appendChild(option);
                });
            }
            // Preenche o select do formulário de Checklist
            if (checklistVeiculoSelect) {
                checklistVeiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
                veiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v._id;
                    option.dataset.placa = v.placa;
                    option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                    checklistVeiculoSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar veículos para selects:', error);
            showMessage(messageRegistro, 'Erro ao carregar lista de veículos para os formulários.', 'error');
        }
    }

    // Carrega e exibe as próximas manutenções e alertas (seção superior)
    async function loadUpcomingMaintenance() {
        if (!upcomingMaintenanceSection) return;
        upcomingMaintenanceSection.innerHTML = '<p class="loading-message text-center">Carregando próximas manutenções...</p>';
        showMessage(messageUpcoming, '', ''); // Limpa mensagem anterior

        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes/proximas');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar próximas manutenções.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Espera um array de objetos de manutenção/alerta

            if (data && data.length > 0) {
                upcomingMaintenanceSection.innerHTML = ''; // Limpa a mensagem de carregamento
                data.forEach(maint => {
                    const widget = document.createElement('div');
                    widget.className = 'widget'; // Reutiliza o estilo de widget do dashboard
                    let iconClass = 'fa-tools'; // Ícone padrão
                    let title = 'Manutenção Próxima';
                    let mainInfo = '';

                    // Lógica para determinar ícone e informações com base no tipo de alerta
                    if (maint.tipo === 'Troca de Óleo') {
                        iconClass = 'fa-gas-pump';
                        title = 'Próxima Troca de Óleo';
                        mainInfo = maint.kmPrevisto ? `${maint.kmPrevisto.toLocaleString('pt-BR')} km` : '';
                        if (maint.dataPrevista) {
                            mainInfo += `${mainInfo ? ' ou ' : ''}${new Date(maint.dataPrevista).toLocaleDateString('pt-BR')}`;
                        }
                    } else if (maint.tipo === 'Checklist') {
                        iconClass = 'fa-clipboard-check';
                        title = 'Próximo Checklist';
                        mainInfo = maint.dataPrevista ? new Date(maint.dataPrevista).toLocaleDateString('pt-BR') : '';
                    } else {
                        // Para outros tipos de manutenção que possam surgir
                        mainInfo = maint.dataPrevista ? new Date(maint.dataPrevista).toLocaleDateString('pt-BR') : '';
                    }

                    widget.innerHTML = `
                        <div class="widget-icon" style="background-color: var(--primary-blue); color: var(--neutral-white);">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="widget-content">
                            <h2>${title} - ${maint.veiculoPlaca || 'N/A'}</h2>
                            <span class="widget-data">${mainInfo || '--'}</span>
                            <p style="font-size:0.85em; color:var(--text-muted); margin-top:5px;">${maint.descricao || 'Verificar e agendar.'}</p>
                        </div>
                    `;
                    upcomingMaintenanceSection.appendChild(widget);
                });
            } else {
                upcomingMaintenanceSection.innerHTML = '<p class="text-center">Nenhuma manutenção futura ou alerta no momento.</p>';
            }

        } catch (error) {
            console.error('Erro ao carregar próximas manutenções:', error);
            showMessage(messageUpcoming, error.message || 'Falha ao carregar próximas manutenções.', 'error');
            upcomingMaintenanceSection.innerHTML = `<p class="error-message text-center">Erro ao carregar próximas manutenções.</p>`;
        }
    }

    // Carrega e exibe o histórico de manutenções gerais (tabela)
    async function loadMaintenanceHistory(searchTerm = '') {
        if (!maintenanceHistoryBody) return;
        maintenanceHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando histórico de manutenções...</td></tr>';
        showMessage(messageHistory, '', ''); // Limpa mensagem anterior

        try {
            let url = 'https://gpx-api-xwv1.onrender.com/api/manutencoes/historico';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar histórico.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Espera um array de objetos de histórico de manutenção

            if (data && data.length > 0) {
                maintenanceHistoryBody.innerHTML = ''; // Limpa a mensagem de carregamento
                data.forEach(maint => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="detalhes_veiculo.html?id=${maint.veiculoId}">${maint.veiculoPlaca || '--'}</a></td>
                        <td>${maint.tipoManutencao || '--'}</td>
                        <td>${maint.dataRealizacao ? new Date(maint.dataRealizacao).toLocaleDateString('pt-BR') : '--'}</td>
                        <td>${maint.custo ? 'R$ ' + maint.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}</td>
                        <td>${maint.quilometragem ? maint.quilometragem.toLocaleString('pt-BR') + ' km' : '--'}</td>
                        <td>${maint.descricao || '--'}</td>
                        <td class="action-buttons">
                            <button class="btn-action view" title="Ver Detalhes" data-id="${maint._id}"><i class="fas fa-eye"></i></button>
                            <button class="btn-action edit" title="Editar Manutenção" data-id="${maint._id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete-maintenance" title="Excluir Manutenção" data-id="${maint._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    maintenanceHistoryBody.appendChild(tr);
                });
            } else {
                maintenanceHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum histórico de manutenção encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de manutenções:', error);
            showMessage(messageHistory, error.message || 'Falha ao carregar histórico de manutenções.', 'error');
            maintenanceHistoryBody.innerHTML = `<p class="error-message text-center">Erro ao carregar histórico.</p>`;
        }
    }

    // Carrega e exibe o histórico de checklists (tabela separada)
    async function loadChecklistHistory(searchTerm = '') {
        if (!checklistHistoryBody) return;
        checklistHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando histórico de checklists...</td></tr>';
        showMessage(messageChecklistHistory, '', ''); // Limpa mensagem anterior

        try {
            let url = 'https://gpx-api-xwv1.onrender.com/api/checklists/historico';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar histórico de checklists.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Espera um array de objetos de histórico de checklist

            if (data && data.length > 0) {
                checklistHistoryBody.innerHTML = ''; // Limpa a mensagem de carregamento
                data.forEach(checklist => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="detalhes_veiculo.html?id=${checklist.veiculoId}">${checklist.veiculoPlaca || '--'}</a></td>
                        <td>${checklist.dataRealizacao ? new Date(checklist.dataRealizacao).toLocaleDateString('pt-BR') : '--'}</td>
                        <td>${checklist.quilometragem ? checklist.quilometragem.toLocaleString('pt-BR') + ' km' : '--'}</td>
                        <td>${checklist.realizadoPor || '--'}</td>
                        <td>${checklist.observacoes || '--'}</td>
                        <td class="action-buttons">
                            <button class="btn-action view" title="Ver Detalhes" data-id="${checklist._id}"><i class="fas fa-eye"></i></button>
                            <button class="btn-action delete-checklist" title="Excluir Checklist" data-id="${checklist._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    checklistHistoryBody.appendChild(tr);
                });
            } else {
                checklistHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum histórico de checklist encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de checklists:', error);
            showMessage(messageChecklistHistory, error.message || 'Falha ao carregar histórico de checklists.', 'error');
            checklistHistoryBody.innerHTML = `<p class="error-message text-center">Erro ao carregar histórico.</p>`;
        }
    }


    // --- Lógica de Exibição/Ocultação de Formulários ---

    function hideAllForms() {
        if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'none';
        if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'none';
    }

    if (showMaintenanceFormBtn) {
        showMaintenanceFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'block';
            showMessage(messageRegistro, '', ''); // Limpa mensagens anteriores
        });
    }

    if (showChecklistFormBtn) {
        showChecklistFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'block';
            showMessage(messageRegistro, '', ''); // Limpa mensagens anteriores
        });
    }

    // Botões de "Cancelar" nos formulários
    document.querySelectorAll('.cancel-form-btn').forEach(button => {
        button.addEventListener('click', () => {
            hideAllForms();
            showMessage(messageRegistro, '', ''); // Limpa mensagens
            // Opcional: resetar os formulários também
            if (formRegistrarManutencao) formRegistrarManutencao.reset();
            if (formRegistrarChecklist) formRegistrarChecklist.reset();
        });
    });

    // --- Lógica de Submissão de Formulários ---

    // Submissão do formulário de Registro de Manutenção
    if (formRegistrarManutencao) {
        formRegistrarManutencao.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage(messageRegistro, 'Registrando manutenção...', 'info');

            const selectedOption = manutencaoVeiculoSelect.options[manutencaoVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption.dataset.placa; // Pega a placa do data attribute

            const manutencaoData = {
                veiculoId: this.elements['veiculoId'].value, // 'this' refere-se ao formulário
                veiculoPlaca: veiculoPlaca,
                tipoManutencao: this.elements['tipoManutencao'].value,
                dataRealizacao: this.elements['dataRealizacao'].value,
                custo: this.elements['custo'].value,
                quilometragem: this.elements['quilometragem'].value,
                realizadaPor: this.elements['realizadaPor'].value,
                descricao: this.elements['descricao'].value,
            };

            // Validação básica (verificação de campos obrigatórios)
            if (!manutencaoData.veiculoId || !manutencaoData.tipoManutencao || !manutencaoData.dataRealizacao || manutencaoData.quilometragem === '') {
                showMessage(messageRegistro, 'Por favor, preencha todos os campos obrigatórios (*) da manutenção.', 'error');
                return;
            }

            try {
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(manutencaoData)
                });
                const responseData = await response.json();

                if (response.ok) {
                    showMessage(messageRegistro, responseData.message || 'Manutenção registrada com sucesso!', 'success');
                    this.reset(); // Reseta o formulário
                    hideAllForms(); // Esconde o formulário
                    loadMaintenanceHistory(); // Recarrega o histórico de manutenções
                    loadUpcomingMaintenance(); // Recarrega alertas (pode ter mudado a próxima troca de óleo)
                } else {
                    showMessage(messageRegistro, responseData.message || `Erro ${response.status}: Não foi possível registrar a manutenção.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar manutenção:', error);
                showMessage(messageRegistro, 'Erro de conexão ao registrar manutenção.', 'error');
            }
        });
    }

    // Submissão do formulário de Registro de Checklist
    if (formRegistrarChecklist) {
        formRegistrarChecklist.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage(messageRegistro, 'Registrando checklist...', 'info');

            const selectedOption = checklistVeiculoSelect.options[checklistVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption.dataset.placa;

            const checklistData = {
                veiculoId: this.elements['veiculoId'].value,
                veiculoPlaca: veiculoPlaca,
                dataRealizacao: this.elements['dataRealizacao'].value,
                quilometragem: this.elements['quilometragem'].value,
                realizadoPor: this.elements['realizadoPor'].value,
                observacoes: this.elements['observacoes'].value,
            };

            // Validação básica
            if (!checklistData.veiculoId || !checklistData.dataRealizacao || checklistData.quilometragem === '') {
                showMessage(messageRegistro, 'Por favor, preencha todos os campos obrigatórios (*) do checklist.', 'error');
                return;
            }

            try {
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/checklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checklistData)
                });
                const responseData = await response.json();

                if (response.ok) {
                    showMessage(messageRegistro, responseData.message || 'Checklist registrado com sucesso!', 'success');
                    this.reset(); // Reseta o formulário
                    hideAllForms(); // Esconde o formulário
                    loadChecklistHistory(); // Recarrega o histórico de checklists
                    loadUpcomingMaintenance(); // Recarrega alertas (pode ter mudado o próximo checklist)
                } else {
                    showMessage(messageRegistro, responseData.message || `Erro ${response.status}: Não foi possível registrar o checklist.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar checklist:', error);
                showMessage(messageRegistro, 'Erro de conexão ao registrar checklist.', 'error');
            }
        });
    }

    // --- Lógica de Busca nas Tabelas ---

    // Busca no histórico de Manutenções
    if (searchMaintenanceInput) {
        let searchTimeout;
        searchMaintenanceInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadMaintenanceHistory(this.value);
            }, 500); // Atraso para evitar muitas requisições
        });
    }

    // Busca no histórico de Checklists
    if (searchChecklistInput) {
        let searchTimeout;
        searchChecklistInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadChecklistHistory(this.value);
            }, 500);
        });
    }

    // --- Lógica de Ações nas Tabelas (Excluir, Visualizar, Editar) ---

    // Ações para o histórico de Manutenções
    if (maintenanceHistoryBody) {
        maintenanceHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;

            const maintenanceId = targetButton.dataset.id;

            if (targetButton.classList.contains('delete-maintenance')) { // Classe específica para excluir
                if (confirm('Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.')) {
                    showMessage(messageHistory, 'Excluindo manutenção...', 'info');
                    try {
                        const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/manutencoes/${maintenanceId}`, { method: 'DELETE' });
                        const responseData = await response.json();

                        if (response.ok) {
                            showMessage(messageHistory, responseData.message || 'Manutenção excluída com sucesso!', 'success');
                            loadMaintenanceHistory(); // Recarrega a tabela
                            loadUpcomingMaintenance(); // Alerta pode ter mudado
                        } else {
                            throw new Error(responseData.message || `Erro ${response.status} ao excluir manutenção.`);
                        }
                    } catch (error) {
                        console.error('Erro ao excluir manutenção:', error);
                        showMessage(messageHistory, error.message || 'Falha ao excluir manutenção.', 'error');
                    }
                }
            } else if (targetButton.classList.contains('view')) {
                console.log('Ver detalhes da manutenção (ID):', maintenanceId);
                // Redirecionar para uma página de detalhes de manutenção (se houver)
                // Ex: window.location.href = `detalhes_manutencao.html?id=${maintenanceId}`;
                showMessage(messageHistory, 'Funcionalidade de detalhes de manutenção em desenvolvimento.', 'info');
            } else if (targetButton.classList.contains('edit')) {
                console.log('Editar manutenção (ID):', maintenanceId);
                // Redirecionar para uma página de edição de manutenção (se houver)
                // Ex: window.location.href = `editar_manutencao.html?id=${maintenanceId}`;
                showMessage(messageHistory, 'Funcionalidade de edição de manutenção em desenvolvimento.', 'info');
            }
        });
    }

    // Ações para o histórico de Checklists
    if (checklistHistoryBody) {
        checklistHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;

            const checklistId = targetButton.dataset.id;

            if (targetButton.classList.contains('delete-checklist')) { // Classe específica para excluir
                if (confirm('Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.')) {
                    showMessage(messageChecklistHistory, 'Excluindo checklist...', 'info');
                    try {
                        const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/checklists/${checklistId}`, { method: 'DELETE' });
                        const responseData = await response.json();

                        if (response.ok) {
                            showMessage(messageChecklistHistory, responseData.message || 'Checklist excluído com sucesso!', 'success');
                            loadChecklistHistory(); // Recarrega a tabela
                            loadUpcomingMaintenance(); // Alerta pode ter mudado
                        } else {
                            throw new Error(responseData.message || `Erro ${response.status} ao excluir checklist.`);
                        }
                    } catch (error) {
                        console.error('Erro ao excluir checklist:', error);
                        showMessage(messageChecklistHistory, error.message || 'Falha ao excluir checklist.', 'error');
                    }
                }
            } else if (targetButton.classList.contains('view')) {
                console.log('Ver detalhes do checklist (ID):', checklistId);
                // Redirecionar para uma página de detalhes de checklist (se houver)
                // Ex: window.location.href = `detalhes_checklist.html?id=${checklistId}`;
                showMessage(messageChecklistHistory, 'Funcionalidade de detalhes de checklist em desenvolvimento.', 'info');
            }
            // Não há botão de 'edit' para checklist neste layout, mas se houvesse, a lógica seria similar.
        });
    }

    // --- Lógica do Header (Logout/Welcome Message) ---
    // Esta lógica é geralmente centralizada em um script como dashboard.js
    // Mantenho aqui por conveniência, mas reforce a ideia de não duplicar.
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

    // --- Inicialização da Página de Manutenção ---
    if (window.location.pathname.includes('manutencao.html')) {
        carregarVeiculosParaSelects(); // Popula os selects de veículo
        loadUpcomingMaintenance(); // Carrega alertas e próximas manutenções
        loadMaintenanceHistory(); // Carrega o histórico de manutenções
        loadChecklistHistory(); // Carrega o histórico de checklists
    }
});
