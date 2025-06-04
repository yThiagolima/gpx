// frontend/js/manutencao.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais da página
    const upcomingMaintenanceSection = document.getElementById('upcomingMaintenance');
    const maintenanceHistoryBody = document.getElementById('maintenanceHistoryBody');
    const checklistHistoryBody = document.getElementById('checklistHistoryBody'); // Adicionado
    const messageUpcoming = document.getElementById('messageUpcoming');
    const messageRegistro = document.getElementById('messageRegistro');
    const messageHistory = document.getElementById('messageHistory');
    const messageChecklistHistory = document.getElementById('messageChecklistHistory'); // Adicionado

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
    const searchMaintenanceInput = document.getElementById('searchInputMaintenance'); // Corrigido para ser específico
    const searchChecklistInput = document.getElementById('searchChecklistInput');

    // --- Função auxiliar para exibir mensagens ---
    function showMessage(element, text, type) {
        if (!element) {
            // console.warn("Elemento de mensagem não encontrado:", element); // Comentado para reduzir logs
            return;
        }
        element.textContent = text;
        element.className = 'message-feedback'; // Reseta as classes
        if (type) {
            element.classList.add(type);
        }
    }

    // --- Funções de Carregamento de Dados ---

    async function carregarVeiculosParaSelects() {
        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();

            const popularSelect = (selectElement, veiculosLista) => {
                if (selectElement) {
                    selectElement.innerHTML = '<option value="">Selecione um veículo</option>';
                    veiculosLista.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v._id;
                        option.dataset.placa = v.placa;
                        option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                        selectElement.appendChild(option);
                    });
                }
            };

            popularSelect(manutencaoVeiculoSelect, veiculos);
            popularSelect(checklistVeiculoSelect, veiculos);

        } catch (error) {
            console.error('Erro ao carregar veículos para selects:', error);
            showMessage(messageRegistro, 'Erro ao carregar lista de veículos para os formulários.', 'error');
        }
    }

    async function loadUpcomingMaintenance() {
        if (!upcomingMaintenanceSection) return;
        upcomingMaintenanceSection.innerHTML = '<p class="loading-message text-center">Carregando próximas manutenções...</p>';
        showMessage(messageUpcoming, '', '');

        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes/proximas');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar próximas manutenções.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                upcomingMaintenanceSection.innerHTML = '';
                data.forEach(maint => {
                    const widget = document.createElement('div');
                    widget.className = 'widget';
                    let iconClass = 'fa-tools';
                    let title = 'Manutenção Próxima';
                    let mainInfo = '';
                    let actionsHtml = ''; // Para adicionar botões de ação

                    if (maint.tipo === 'Troca de Óleo') {
                        iconClass = 'fa-tint'; // Ícone de gota de óleo
                        title = 'Próxima Troca de Óleo';
                        mainInfo = maint.kmPrevisto ? `${maint.kmPrevisto.toLocaleString('pt-BR')} km` : '';
                        if (maint.dataPrevista) {
                            mainInfo += `${mainInfo ? ' ou ' : ''}${new Date(maint.dataPrevista).toLocaleDateString('pt-BR')}`;
                        }
                    } else if (maint.tipo === 'Checklist') {
                        iconClass = 'fa-clipboard-check';
                        title = 'Próximo Checklist';
                        mainInfo = maint.dataPrevista ? new Date(maint.dataPrevista).toLocaleDateString('pt-BR') : '';
                        // Adiciona o botão "Imprimir Checklist"
                        actionsHtml = `<button class="button-secondary button-small btn-print-checklist" data-veiculo-id="${maint.veiculoId}" data-veiculo-placa="${maint.veiculoPlaca}" data-data-prevista="${maint.dataPrevista}"><i class="fas fa-print"></i> Imprimir Checklist</button>`;
                    } else {
                        mainInfo = maint.dataPrevista ? new Date(maint.dataPrevista).toLocaleDateString('pt-BR') : '';
                    }

                    widget.innerHTML = `
                        <div class="widget-icon" style="background-color: var(--primary-blue-dark); color: var(--neutral-white);">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="widget-content">
                            <h2>${title} - ${maint.veiculoPlaca || 'N/A'}</h2>
                            <span class="widget-data">${mainInfo || '--'}</span>
                            <p style="font-size:0.85em; color:var(--text-muted); margin-top:5px;">${maint.descricao || 'Verificar e agendar.'}</p>
                            <div class="widget-actions" style="margin-top: 10px;">
                                ${actionsHtml}
                            </div>
                        </div>
                    `;
                    upcomingMaintenanceSection.appendChild(widget);
                });

                // Adiciona event listeners para os botões de imprimir checklist
                document.querySelectorAll('.btn-print-checklist').forEach(button => {
                    button.addEventListener('click', function() {
                        const veiculoId = this.dataset.veiculoId;
                        const veiculoPlaca = this.dataset.veiculoPlaca;
                        const dataPrevista = this.dataset.dataPrevista;
                        gerarFormularioChecklist(veiculoId, veiculoPlaca, dataPrevista);
                    });
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

    // Função placeholder para gerar formulário de checklist
    function gerarFormularioChecklist(veiculoId, veiculoPlaca, dataPrevista) {
        console.log(`Gerar formulário de checklist para: Veículo ID ${veiculoId}, Placa ${veiculoPlaca}, Data ${new Date(dataPrevista).toLocaleDateString('pt-BR')}`);
        // Aqui virá a lógica para abrir uma nova janela/modal com o formulário para impressão
        alert(`Funcionalidade "Imprimir Checklist" para ${veiculoPlaca} em ${new Date(dataPrevista).toLocaleDateString('pt-BR')} ainda não implementada.\nOs dados para impressão seriam para o Veículo ID: ${veiculoId}.`);
    }


    async function loadMaintenanceHistory(searchTerm = '') {
        if (!maintenanceHistoryBody) return;
        maintenanceHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando histórico de manutenções...</td></tr>';
        showMessage(messageHistory, '', '');

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
            const data = await response.json();

            if (data && data.length > 0) {
                maintenanceHistoryBody.innerHTML = '';
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
                            <button class="btn-action edit" title="Editar Manutenção" data-id="${maint._id}" disabled><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete-maintenance" title="Excluir Manutenção" data-id="${maint._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    maintenanceHistoryBody.appendChild(tr);
                });
            } else {
                maintenanceHistoryBody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum histórico de manutenção ${searchTerm ? 'encontrado para "' + searchTerm + '"' : 'registrado'}.</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de manutenções:', error);
            showMessage(messageHistory, error.message || 'Falha ao carregar histórico de manutenções.', 'error');
            maintenanceHistoryBody.innerHTML = `<tr><td colspan="7" class="error-message text-center">Erro ao carregar histórico.</td></tr>`;
        }
    }

    async function loadChecklistHistory(searchTerm = '') {
        if (!checklistHistoryBody) return;
        checklistHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando histórico de checklists...</td></tr>';
        showMessage(messageChecklistHistory, '', '');

        try {
            let url = 'https://gpx-api-xwv1.onrender.com/api/checklists/historico'; // Supondo que este endpoint exista ou será criado
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar histórico de checklists.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                checklistHistoryBody.innerHTML = '';
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
                checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum histórico de checklist ${searchTerm ? 'encontrado para "' + searchTerm + '"' : 'registrado'}.</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de checklists:', error);
            showMessage(messageChecklistHistory, error.message || 'Falha ao carregar histórico de checklists.', 'error');
            checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="error-message text-center">Erro ao carregar histórico de checklists.</td></tr>`;
        }
    }

    function hideAllForms() {
        if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'none';
        if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'none';
    }

    if (showMaintenanceFormBtn) {
        showMaintenanceFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'block';
            showMessage(messageRegistro, '', '');
        });
    }

    if (showChecklistFormBtn) {
        showChecklistFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'block';
            showMessage(messageRegistro, '', '');
        });
    }

    document.querySelectorAll('.cancel-form-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Previne submit se o botão estiver dentro de um form
            const form = e.target.closest('form');
            if (form) {
                form.reset();
                hideAllForms();
            }
            showMessage(messageRegistro, '', '');
        });
    });
    
    if (formRegistrarManutencao) {
        formRegistrarManutencao.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage(messageRegistro, 'Registrando manutenção...', 'info');

            const selectedOption = manutencaoVeiculoSelect.options[manutencaoVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption ? selectedOption.dataset.placa : null;

            const manutencaoData = {
                veiculoId: this.elements['manutencaoVeiculoId'].value,
                veiculoPlaca: veiculoPlaca,
                tipoManutencao: this.elements['manutencaoTipo'].value,
                dataRealizacao: this.elements['manutencaoData'].value,
                custo: this.elements['manutencaoCusto'].value,
                quilometragem: this.elements['manutencaoKm'].value,
                realizadaPor: this.elements['manutencaoRealizadaPor'].value,
                descricao: this.elements['manutencaoDescricao'].value,
            };

            if (!manutencaoData.veiculoId || !manutencaoData.veiculoPlaca || !manutencaoData.tipoManutencao || !manutencaoData.dataRealizacao || manutencaoData.quilometragem === '') {
                showMessage(messageRegistro, 'Preencha: Veículo, Placa, Tipo, Data e Quilometragem da manutenção.', 'error');
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
                    this.reset();
                    hideAllForms();
                    loadMaintenanceHistory();
                    loadUpcomingMaintenance();
                } else {
                    showMessage(messageRegistro, responseData.message || `Erro ${response.status}: Não foi possível registrar.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar manutenção:', error);
                showMessage(messageRegistro, 'Erro de conexão ao registrar manutenção.', 'error');
            }
        });
    }

    if (formRegistrarChecklist) {
        formRegistrarChecklist.addEventListener('submit', async function(event) {
            event.preventDefault();
            showMessage(messageRegistro, 'Registrando checklist...', 'info');

            const selectedOption = checklistVeiculoSelect.options[checklistVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption ? selectedOption.dataset.placa : null;

            const checklistData = {
                veiculoId: this.elements['checklistVeiculoId'].value,
                veiculoPlaca: veiculoPlaca,
                dataRealizacao: this.elements['checklistData'].value,
                quilometragem: this.elements['checklistKm'].value,
                realizadoPor: this.elements['checklistRealizadoPor'].value,
                observacoes: this.elements['checklistObservacoes'].value,
            };

            if (!checklistData.veiculoId || !checklistData.veiculoPlaca || !checklistData.dataRealizacao || checklistData.quilometragem === '') {
                showMessage(messageRegistro, 'Preencha: Veículo, Placa, Data e Quilometragem do checklist.', 'error');
                return;
            }

            try {
                // Supondo que o endpoint para checklists é /api/checklists
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/checklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checklistData)
                });
                const responseData = await response.json();

                if (response.ok) {
                    showMessage(messageRegistro, responseData.message || 'Checklist registrado com sucesso!', 'success');
                    this.reset();
                    hideAllForms();
                    loadChecklistHistory();
                    loadUpcomingMaintenance();
                } else {
                    showMessage(messageRegistro, responseData.message || `Erro ${response.status}: Não foi possível registrar.`, 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar checklist:', error);
                showMessage(messageRegistro, 'Erro de conexão ao registrar checklist.', 'error');
            }
        });
    }

    if (searchMaintenanceInput) {
        let searchTimeout;
        searchMaintenanceInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadMaintenanceHistory(this.value);
            }, 500);
        });
    }

    if (searchChecklistInput) {
        let searchTimeout;
        searchChecklistInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadChecklistHistory(this.value);
            }, 500);
        });
    }

    if (maintenanceHistoryBody) {
        maintenanceHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;
            const maintenanceId = targetButton.dataset.id;

            if (targetButton.classList.contains('delete-maintenance')) {
                if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                    showMessage(messageHistory, 'Excluindo manutenção...', 'info');
                    try {
                        const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/manutencoes/${maintenanceId}`, { method: 'DELETE' });
                        const responseData = await response.json();
                        if (response.ok) {
                            showMessage(messageHistory, responseData.message || 'Excluída!', 'success');
                            loadMaintenanceHistory();
                            loadUpcomingMaintenance();
                        } else { throw new Error(responseData.message || `Erro ${response.status}`); }
                    } catch (error) { showMessage(messageHistory, error.message || 'Falha.', 'error'); }
                }
            } else if (targetButton.classList.contains('view')) {
                showMessage(messageHistory, 'Visualizar detalhes de manutenção (em desenvolvimento).', 'info');
            } else if (targetButton.classList.contains('edit')) {
                showMessage(messageHistory, 'Editar manutenção (em desenvolvimento).', 'info');
            }
        });
    }

    if (checklistHistoryBody) {
        checklistHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;
            const checklistId = targetButton.dataset.id;

            if (targetButton.classList.contains('delete-checklist')) {
                if (confirm('Tem certeza que deseja excluir este checklist?')) {
                    showMessage(messageChecklistHistory, 'Excluindo checklist...', 'info');
                    try {
                        // Supondo endpoint /api/checklists/:id para DELETE
                        const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/checklists/${checklistId}`, { method: 'DELETE' });
                        const responseData = await response.json();
                        if (response.ok) {
                            showMessage(messageChecklistHistory, responseData.message || 'Excluído!', 'success');
                            loadChecklistHistory();
                            loadUpcomingMaintenance();
                        } else { throw new Error(responseData.message || `Erro ${response.status}`); }
                    } catch (error) { showMessage(messageChecklistHistory, error.message || 'Falha.', 'error'); }
                }
            } else if (targetButton.classList.contains('view')) {
                showMessage(messageChecklistHistory, 'Visualizar detalhes de checklist (em desenvolvimento).', 'info');
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
        } catch (e) { console.error("Erro ao parsear usuário:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            window.location.href = 'login.html';
        });
    }

    if (window.location.pathname.includes('manutencao.html')) {
        hideAllForms(); // Garante que formulários comecem escondidos
        carregarVeiculosParaSelects();
        loadUpcomingMaintenance();
        loadMaintenanceHistory();
        loadChecklistHistory(); // Carrega histórico de checklists
    }
});
