// frontend/js/manutencao.js
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api';

    // Elementos de Ações Principais
    const showNewMaintenanceFormBtn = document.getElementById('showNewMaintenanceFormBtn');
    const btnIniciarNovoChecklist = document.getElementById('btnIniciarNovoChecklist');
    
    // Modais e Formulários principais
    const formRegistrarManutencao = document.getElementById('formRegistrarManutencao');
    const modalSelecionarVeiculoChecklist = document.getElementById('modalSelecionarVeiculoChecklist');
    const formRegistrarResultadosChecklist = document.getElementById('formRegistrarResultadosChecklist');
    const modalRegistrarTrocaOleoEl = document.getElementById('modalRegistrarTrocaOleo');
    const formModalTrocaOleoEl = document.getElementById('formModalTrocaOleo');

    // Selects nos formulários/modais
    const manutencaoVeiculoSelect = document.getElementById('manutencaoVeiculoId');
    const checklistNovoVeiculoSelect = document.getElementById('checklistNovoVeiculoId');
    
    // Botões dentro de modais/formulários
    const btnGerarFormularioChecklistModal = document.getElementById('btnGerarFormularioChecklist');
    const btnCancelChecklistResults = formRegistrarResultadosChecklist ? formRegistrarResultadosChecklist.querySelector('.cancel-checklist-results-btn') : null;

    // Seções de Exibição Dinâmica
    const checklistsPendentesContainer = document.getElementById('checklistsPendentesContainer');
    const upcomingChecklistsStatusContainer = document.getElementById('upcomingChecklistsStatus');
    const programmedMaintenanceAlertsContainer = document.getElementById('programmedMaintenanceAlerts');
    
    // Containers e mensagens de Histórico
    const maintenanceHistoryBody = document.getElementById('maintenanceHistoryBody');
    const checklistHistoryBody = document.getElementById('checklistHistoryBody');
    const messageRegistro = document.getElementById('messageRegistro');
    const messageChecklistsPendentes = document.getElementById('messageChecklistsPendentes');
    const messageChecklistStatus = document.getElementById('messageChecklistStatus');
    const messageProgrammedAlerts = document.getElementById('messageProgrammedAlerts');
    const messageHistory = document.getElementById('messageHistory');
    const messageChecklistHistory = document.getElementById('messageChecklistHistory');

    // Filtros para Histórico de Manutenções e Checklists (já definidos no HTML)
    const filtroManutVeiculoSelect = document.getElementById('filtroManutVeiculo');
    const filtroManutMesSelect = document.getElementById('filtroManutMes');
    const filtroManutAnoSelect = document.getElementById('filtroManutAno');
    const btnFiltrarManutencoes = document.getElementById('btnFiltrarManutencoes');
    const filtroCheckVeiculoSelect = document.getElementById('filtroCheckVeiculo');
    const filtroCheckMesSelect = document.getElementById('filtroCheckMes');
    const filtroCheckAnoSelect = document.getElementById('filtroCheckAno');
    const btnFiltrarChecklists = document.getElementById('btnFiltrarChecklists');

    const ITENS_CHECKLIST_PADRAO = [
        "Nível do Óleo do Motor", "Nível do Líquido de Arrefecimento", "Nível do Fluido de Freio",
        "Nível do Fluido da Direção Hidráulica", "Calibragem e Estado dos Pneus (incluindo estepe)",
        "Faróis (baixo, alto, setas, freio, ré, neblina)", "Lanternas Internas",
        "Palhetas do Limpador de Para-brisa", "Esguicho de Água do Para-brisa",
        "Vazamentos (motor, câmbio, radiador)", "Cintos de Segurança", "Buzina",
        "Extintor de Incêndio (presença e validade)", "Triângulo, Macaco, Chave de Roda",
        "Bateria (estado visual, terminais)", "Freio de Estacionamento", "Amortecedores (inspeção visual)",
        "Documentação do Veículo (CRLV)", "Limpeza Interna e Externa"
    ];

    function showModal(modalElement) { if (modalElement) modalElement.style.display = 'flex'; }
    function hideModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }
    function showForm(formElement) { if (formElement) formElement.style.display = 'block'; }
    function hideForm(formElement) { if (formElement) formElement.style.display = 'none'; }
    
    function hideAllDynamicForms() {
        hideForm(formRegistrarManutencao);
        hideForm(formRegistrarResultadosChecklist);
        hideModal(modalSelecionarVeiculoChecklist);
        if (modalRegistrarTrocaOleoEl) hideModal(modalRegistrarTrocaOleoEl);
        if (messageRegistro) showUserMessage(messageRegistro, '', '');
    }

    function showUserMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = 'message-feedback';
        if (type) element.classList.add(type);
        setTimeout(() => { if (element.textContent === text) { element.textContent = ''; element.className = 'message-feedback';}}, 7000);
    }

    function formatDate(dateString) { 
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    function formatCurrency(value) { 
        if (value === null || value === undefined || isNaN(value)) return '--';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    function formatKm(value) { 
        if (value === null || value === undefined || isNaN(value)) return '--';
        return value.toLocaleString('pt-BR') + ' km';
    }

    async function carregarVeiculosParaMultiplosSelects() {
        try {
            const response = await fetch(`${API_BASE_URL}/veiculos`);
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();
            const selects = [
                manutencaoVeiculoSelect, checklistNovoVeiculoSelect, 
                filtroManutVeiculoSelect, filtroCheckVeiculoSelect
            ];
            selects.forEach(selectElement => {
                if (selectElement) {
                    const currentValue = selectElement.value; 
                    const firstOptionText = selectElement.options[0] ? selectElement.options[0].textContent : "Selecione...";
                    const firstOptionValue = selectElement.options[0] ? selectElement.options[0].value : "";
                    selectElement.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`;
                    veiculos.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v._id;
                        option.dataset.placa = v.placa;
                        option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                        selectElement.appendChild(option);
                    });
                    if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
                         selectElement.value = currentValue;
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar veículos para selects:', error);
            showUserMessage(messageRegistro, 'Erro ao carregar lista de veículos.', 'error');
        }
    }

    function popularFiltrosDeData(selectMes, selectAno) {
        if (selectMes) {
            const currentValMes = selectMes.value;
            while (selectMes.options.length > 1) selectMes.remove(1);
            const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            meses.forEach((nome, index) => {
                const option = document.createElement('option'); option.value = index + 1; option.textContent = nome; selectMes.appendChild(option);
            });
            if(currentValMes) selectMes.value = currentValMes;
        }
        if (selectAno) {
            const currentValAno = selectAno.value;
            while (selectAno.options.length > 1) selectAno.remove(1);
            const anoAtual = new Date().getFullYear();
            for (let i = 0; i < 5; i++) { const ano = anoAtual - i; const option = document.createElement('option'); option.value = ano; option.textContent = ano; selectAno.appendChild(option); }
            if(currentValAno) selectAno.value = currentValAno; else selectAno.value = anoAtual;
        }
    }

    if (showNewMaintenanceFormBtn) {
        showNewMaintenanceFormBtn.addEventListener('click', () => {
            hideAllDynamicForms();
            if (formRegistrarManutencao) {
                 formRegistrarManutencao.reset(); 
                 const nextOilSectionLocal = formRegistrarManutencao.querySelector('#nextOilChangeSection');
                 if(nextOilSectionLocal) nextOilSectionLocal.style.display = 'none'; 
            }
            showForm(formRegistrarManutencao);
        });
    }
    document.querySelectorAll('.cancel-form-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); hideAllDynamicForms();
            const form = e.target.closest('form'); if (form) form.reset();
             const nextOilSectionLocal = formRegistrarManutencao.querySelector('#nextOilChangeSection');
             if(nextOilSectionLocal && formRegistrarManutencao && formRegistrarManutencao.contains(nextOilSectionLocal)) nextOilSectionLocal.style.display = 'none';
        });
    });

    const tipoManutencaoInputEl = document.getElementById('manutencaoTipo');
    const nextOilChangeSectionEl = document.getElementById('nextOilChangeSection');
    if (tipoManutencaoInputEl && nextOilChangeSectionEl) {
        tipoManutencaoInputEl.addEventListener('input', function() {
            if (this.value.toLowerCase().includes('oleo') || this.value.toLowerCase().includes('óleo')) {
                nextOilChangeSectionEl.style.display = 'block';
            } else {
                nextOilChangeSectionEl.style.display = 'none';
            }
        });
    }
    
    if (formRegistrarManutencao) {
        formRegistrarManutencao.addEventListener('submit', async function(event) {
            event.preventDefault();
            showUserMessage(messageRegistro, 'Registrando manutenção...', 'info');
            const formData = new FormData(this);
            const manutencaoData = Object.fromEntries(formData.entries());
            const selectedOption = manutencaoVeiculoSelect.options[manutencaoVeiculoSelect.selectedIndex];
            if (selectedOption && selectedOption.dataset.placa) manutencaoData.veiculoPlaca = selectedOption.dataset.placa;

            const tipoManutencaoAtual = this.elements['tipoManutencao'].value;
            if (!(tipoManutencaoAtual.toLowerCase().includes('oleo') || tipoManutencaoAtual.toLowerCase().includes('óleo'))) {
                manutencaoData.proxTrocaOleoKm = ''; manutencaoData.proxTrocaOleoData = '';
            }

            if (!manutencaoData.veiculoId || !manutencaoData.tipoManutencao || !manutencaoData.dataRealizacao || !manutencaoData.quilometragem) {
                showUserMessage(messageRegistro, 'Preencha os campos obrigatórios da manutenção.', 'error'); return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/manutencoes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manutencaoData)
                });
                const responseData = await response.json();
                if (response.ok) {
                    showUserMessage(messageRegistro, responseData.message || 'Manutenção registrada!', 'success');
                    this.reset(); if(nextOilChangeSectionEl) nextOilChangeSectionEl.style.display = 'none'; hideAllDynamicForms();
                    loadMaintenanceHistory({ veiculoId: filtroManutVeiculoSelect.value, mes: filtroManutMesSelect.value, ano: filtroManutAnoSelect.value}); 
                    carregarAlertasProgramadosEStatusChecklist(); 
                } else { showUserMessage(messageRegistro, responseData.message || `Erro ${response.status}.`, 'error'); }
            } catch (error) { console.error('Erro:', error); showUserMessage(messageRegistro, 'Erro de conexão.', 'error'); }
        });
    }

    if (btnIniciarNovoChecklist) {
        btnIniciarNovoChecklist.addEventListener('click', () => {
            hideAllDynamicForms();
            if (checklistNovoVeiculoSelect && checklistNovoVeiculoSelect.options.length <= 1) {
                 carregarVeiculosParaMultiplosSelects(); 
            }
            showModal(modalSelecionarVeiculoChecklist);
        });
    }
    
    document.querySelectorAll('.close-modal-btn, .modal .button-secondary[data-modal-id]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modalId || this.closest('.modal').id;
            if (modalId) {
                const modalToClose = document.getElementById(modalId);
                if (modalToClose) hideModal(modalToClose);
            }
        });
    });
    if(modalSelecionarVeiculoChecklist) {
        modalSelecionarVeiculoChecklist.addEventListener('click', (event) => {
            if(event.target === modalSelecionarVeiculoChecklist) {
                hideModal(modalSelecionarVeiculoChecklist);
            }
        });
    }
    if (modalRegistrarTrocaOleoEl) { // Adicionado listener para o modal de troca de óleo
        modalRegistrarTrocaOleoEl.addEventListener('click', (event) => {
            if (event.target === modalRegistrarTrocaOleoEl) {
                hideModal(modalRegistrarTrocaOleoEl);
            }
        });
    }


    if (btnGerarFormularioChecklistModal) {
        btnGerarFormularioChecklistModal.addEventListener('click', async () => {
            const veiculoId = checklistNovoVeiculoSelect.value;
            const selectedOption = checklistNovoVeiculoSelect.options[checklistNovoVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption ? selectedOption.dataset.placa : 'N/A';
            if (!veiculoId) { showUserMessage(messageRegistro, 'Selecione um veículo.', 'error'); return; }
            showUserMessage(messageRegistro, 'Iniciando checklist...', 'info');
            try {
                // A API `/api/checklists/iniciar` precisa retornar o objeto do checklist criado, incluindo o _id
                const response = await fetch(`${API_BASE_URL}/checklists/iniciar`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ veiculoId })
                });
                const responseData = await response.json();
                if (response.ok && responseData.checklist && responseData.checklist._id) {
                    hideModal(modalSelecionarVeiculoChecklist);
                    gerarFormularioChecklist(veiculoId, veiculoPlaca, responseData.checklist.dataIniciado);
                    showUserMessage(messageRegistro, responseData.message || 'Checklist iniciado e pendente!', 'success');
                    carregarChecklistsPendentes(); 
                    carregarAlertasProgramadosEStatusChecklist(); // Para que o agendado original suma
                } else { showUserMessage(messageRegistro, responseData.message || 'Erro ao iniciar.', 'error'); }
            } catch (error) { console.error('Erro:', error); showUserMessage(messageRegistro, 'Erro de conexão.', 'error'); }
        });
    }
    
    async function carregarChecklistsPendentes() {
        if (!checklistsPendentesContainer) return;
        checklistsPendentesContainer.innerHTML = '<p class="loading-message">Carregando checklists pendentes...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/checklists/pendentes`);
            if (!response.ok) throw new Error('Falha ao buscar checklists pendentes.');
            const pendentes = await response.json();
            checklistsPendentesContainer.innerHTML = '';
            if (pendentes && pendentes.length > 0) {
                pendentes.forEach(item => {
                    const card = document.createElement('div'); card.className = 'widget widget-aviso';
                    card.innerHTML = `
                        <div class="widget-icon"><i class="fas fa-hourglass-start"></i></div>
                        <div class="widget-content">
                            <h3 class="widget-title">Checklist Pendente - ${item.veiculoPlaca}</h3>
                            <p class="widget-info">Iniciado em: ${formatDate(item.dataIniciado)}</p>
                            <div class="widget-actions" style="margin-top:10px; display:flex; gap:8px;">
                                <button class="button-secondary button-small btn-reimprimir-checklist" 
                                        data-veiculo-id="${item.veiculoId}" 
                                        data-veiculo-placa="${item.veiculoPlaca}" 
                                        data-data-iniciado="${item.dataIniciado}">
                                    <i class="fas fa-print"></i> Imprimir Novamente
                                </button>
                                <button class="button-primary btn-registrar-resultados-checklist" 
                                        data-id="${item._id}" 
                                        data-veiculo-placa="${item.veiculoPlaca}">
                                    <i class="fas fa-edit"></i> Registrar Resultados
                                </button>
                            </div>
                        </div>`;
                    checklistsPendentesContainer.appendChild(card);
                });
            } else { checklistsPendentesContainer.innerHTML = '<p class="text-center" style="padding:15px;">Nenhum checklist pendente de registro.</p>'; }
        } catch (error) { checklistsPendentesContainer.innerHTML = '<p class="error-message">Erro ao carregar pendentes.</p>'; if(messageChecklistsPendentes) showUserMessage(messageChecklistsPendentes, 'Erro ao carregar checklists pendentes.', 'error');}
    }

    if (checklistsPendentesContainer) {
        checklistsPendentesContainer.addEventListener('click', function(event) { // Delegação de evento
            const targetRegistrar = event.target.closest('.btn-registrar-resultados-checklist');
            const targetReimprimir = event.target.closest('.btn-reimprimir-checklist');

            if (targetRegistrar) { 
                abrirFormularioResultadosChecklist(targetRegistrar.dataset.id, targetRegistrar.dataset.veiculoPlaca); 
            } else if (targetReimprimir) {
                gerarFormularioChecklist(
                    targetReimprimir.dataset.veiculoId, 
                    targetReimprimir.dataset.veiculoPlaca, 
                    targetReimprimir.dataset.dataIniciado
                );
            }
        });
    }

    function abrirFormularioResultadosChecklist(checklistId, veiculoPlaca) { // Removido isFromScheduled
        hideAllDynamicForms();
        if(formRegistrarResultadosChecklist) formRegistrarResultadosChecklist.reset();
        document.getElementById('checklistPendenteId').value = checklistId; 
        document.getElementById('checklistVeiculoInfo').textContent = veiculoPlaca;
        document.getElementById('checklistResultadoData').valueAsDate = new Date();
        
        const container = document.getElementById('checklistItensContainer'); container.innerHTML = '';
        ITENS_CHECKLIST_PADRAO.forEach((itemNome, index) => {
            const itemId = `item_${index}`; const itemRow = document.createElement('div'); itemRow.className = 'checklist-item-row';
            itemRow.innerHTML = `<label for="${itemId}_obs" class="checklist-item-label">${itemNome}</label><span class="checklist-item-status"><input type="radio" id="${itemId}_ok" name="status_${itemId}" value="OK" checked><label for="${itemId}_ok">OK</label></span><span class="checklist-item-status"><input type="radio" id="${itemId}_defeito" name="status_${itemId}" value="DEFEITO"><label for="${itemId}_defeito">Defeito</label></span><span class="checklist-item-obs"><input type="text" id="${itemId}_obs" name="obs_${itemId}" placeholder="Obs (se defeito)"></span>`;
            container.appendChild(itemRow);
        });
        showForm(formRegistrarResultadosChecklist);
    }
    
    if(btnCancelChecklistResults) { btnCancelChecklistResults.addEventListener('click', () => { hideAllDynamicForms(); if(formRegistrarResultadosChecklist) formRegistrarResultadosChecklist.reset(); }); }

    if (formRegistrarResultadosChecklist) {
        formRegistrarResultadosChecklist.addEventListener('submit', async function(event) {
            event.preventDefault();
            let checklistId = document.getElementById('checklistPendenteId').value;
            showUserMessage(messageRegistro, 'Registrando resultados...', 'info');
            
            const formData = new FormData(this); 
            const data = { itensVerificados: [] };
            formData.forEach((value, key) => { if(!key.startsWith('status_') && !key.startsWith('obs_') && key !== 'checklistPendenteId') data[key] = value; });
            ITENS_CHECKLIST_PADRAO.forEach((nomeItem, index) => {
                const itemId = `item_${index}`; data.itensVerificados.push({ nomeItem, statusItem: formData.get(`status_${itemId}`), obsItem: formData.get(`obs_${itemId}`) || null });
            });

            if (!data.dataRealizacao || !data.quilometragem || !data.realizadoPor) { showUserMessage(messageRegistro, 'Preencha Data, KM e Responsável.', 'error'); return; }
            
            try {
                const endpoint = `${API_BASE_URL}/checklists/${checklistId}/registrar-resultado`;
                const response = await fetch(endpoint, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
                });
                const responseData = await response.json();
                if (response.ok) {
                    showUserMessage(messageRegistro, responseData.message || 'Resultados registrados!', 'success');
                    this.reset(); hideAllDynamicForms(); 
                    carregarChecklistsPendentes(); 
                    loadChecklistHistory({ veiculoId: filtroCheckVeiculoSelect.value, mes: filtroCheckMesSelect.value, ano: filtroCheckAnoSelect.value}); 
                    carregarAlertasProgramadosEStatusChecklist();
                } else { showUserMessage(messageRegistro, responseData.message || 'Erro ao registrar.', 'error'); }
            } catch (error) { console.error('Erro:', error); showUserMessage(messageRegistro, 'Erro de conexão.', 'error'); }
        });
    }
    
    // Função para abrir o modal de troca de óleo (precisa ser definida antes do listener que a usa)
    function abrirModalTrocaOleo(veiculoId, veiculoPlaca, kmAtualVeiculo) {
        hideAllDynamicForms();
        if (formModalTrocaOleoEl) formModalTrocaOleoEl.reset();
        document.getElementById('modalTrocaOleoVeiculoInfo').textContent = veiculoPlaca;
        document.getElementById('modalTrocaOleoVeiculoId').value = veiculoId;
        document.getElementById('modalTrocaOleoVeiculoPlaca').value = veiculoPlaca;
        document.getElementById('modalTrocaOleoData').valueAsDate = new Date();
        const kmInput = document.getElementById('modalTrocaOleoKm');
        kmInput.value = kmAtualVeiculo || '';
        kmInput.min = kmAtualVeiculo || 0;
        showModal(modalRegistrarTrocaOleoEl);
    }


    async function carregarAlertasProgramadosEStatusChecklist() {
        const containerTargetMapping = {
            OLEO: programmedMaintenanceAlertsContainer,
            CHECKLIST: upcomingChecklistsStatusContainer
        };
        Object.values(containerTargetMapping).forEach(container => {
            if (container) container.innerHTML = '<p class="loading-message text-center">Carregando...</p>';
        });

        try {
            const response = await fetch(`${API_BASE_URL}/manutencoes/proximas`);
            if (!response.ok) { const err = await response.json().catch(()=>({message: `Erro ${response.status}`})); throw new Error(err.message); }
            const eventos = await response.json();

            Object.values(containerTargetMapping).forEach(container => { if (container) container.innerHTML = ''; }); // Limpa containers
            let counters = { OLEO: 0, CHECKLIST: 0 };

            if (eventos && eventos.length > 0) {
                eventos.forEach(item => {
                    const targetContainer = containerTargetMapping[item.tipoEvento];
                    if (!targetContainer) return;

                    const widget = document.createElement('div'); widget.className = 'widget';
                    let icon = 'fa-bell', title = item.tipoEvento || 'Evento', details = `<p class="widget-description">${item.descricao||''}</p><div class="widget-info">${item.detalhes||''}</div>`, actions = '', statusCls = 'widget-ok', statusTxt = 'Programado';
                    if (item.statusAlerta) { 
                        switch (item.statusAlerta.toUpperCase()) {
                            case "VENCIDO_DATA": statusCls = 'widget-vencido widget-vencido-data'; statusTxt = "ATRASADO (DATA)!"; icon = 'fa-calendar-times'; break;
                            case "VENCIDO_KM": statusCls = 'widget-vencido widget-vencido-km'; statusTxt = "ATENÇÃO (KM)!"; icon = 'fa-tachometer-alt-fast'; break;
                            case "VENCIDO_DATA_KM": statusCls = 'widget-vencido widget-vencido-data-km'; statusTxt = "URGENTE (DATA E KM)!"; icon = 'fa-exclamation-triangle'; break;
                            case "AVISO_CHECKLIST": statusCls = 'widget-aviso'; statusTxt = "PRÓXIMO (AVISO)!"; icon = 'fa-calendar-alt'; break;
                            case "OK": default: statusCls = 'widget-ok'; statusTxt = "Programado"; break;
                        }
                    }
                    widget.classList.add(...statusCls.split(' '));
                    
                    if (item.tipoEvento === 'OLEO') { 
                        if (item.statusAlerta && item.statusAlerta.toUpperCase().startsWith("VENCIDO")) icon = 'fa-oil-can-drip'; else icon = 'fa-tint'; 
                        title = 'Troca de Óleo';
                        actions = `<button class="button-primary button-small btn-troca-oleo-realizada" data-veiculo-id="${item.veiculoId}" data-veiculo-placa="${item.veiculoPlaca}" data-km-atual-veiculo="${item.kmAtual || ''}"><i class="fas fa-check"></i> Troca Realizada</button>`;
                    } else if (item.tipoEvento === 'CHECKLIST') { 
                        if (item.statusAlerta === "VENCIDO_DATA") icon = 'fa-file-excel'; 
                        else if (item.statusAlerta === "AVISO_CHECKLIST") icon = 'fa-calendar-alt'; 
                        else icon = 'fa-clipboard-check'; 
                        title = 'Checklist Agendado'; 
                        actions = `<button class="button-secondary button-small btn-print-checklist" data-veiculo-id="${item.veiculoId}" data-veiculo-placa="${item.veiculoPlaca}" data-data-prevista="${item.dataPrevista}"><i class="fas fa-print"></i> Imprimir</button> <button class="button-primary button-small btn-concluir-checklist-agendado" data-veiculo-id="${item.veiculoId}" data-veiculo-placa="${item.veiculoPlaca}"><i class="fas fa-check-circle"></i> Concluir</button>`;
                    }
                    widget.innerHTML = `<div class="widget-icon"><i class="fas ${icon}"></i></div><div class="widget-content"><h3 class="widget-title">${title} - ${item.veiculoPlaca||'N/A'}</h3><p class="widget-status">${statusTxt}</p><div class="widget-info-details">${details}</div><div class="widget-actions" style="margin-top:10px; display:flex; gap:8px;">${actions}</div></div>`;
                    
                    targetContainer.appendChild(widget);
                    counters[item.tipoEvento]++;
                });
            }
            if(programmedMaintenanceAlertsContainer && counters.OLEO === 0) programmedMaintenanceAlertsContainer.innerHTML = '<p class="text-center" style="padding:20px;">Nenhum alerta de óleo programado.</p>';
            if(upcomingChecklistsStatusContainer && counters.CHECKLIST === 0) upcomingChecklistsStatusContainer.innerHTML = '<p class="text-center" style="padding:20px;">Nenhum checklist agendado.</p>';
        
        } catch (error) {
            console.error("Erro ao carregar alertas/status:", error);
            if(programmedMaintenanceAlertsContainer) programmedMaintenanceAlertsContainer.innerHTML = `<p class="error-message text-center" style="padding:20px;">Erro ao carregar alertas.</p>`;
            if(upcomingChecklistsStatusContainer) upcomingChecklistsStatusContainer.innerHTML = `<p class="error-message text-center" style="padding:20px;">Erro ao carregar status dos checklists.</p>`;
        }
    }

    // Delegação de eventos para botões dinâmicos nos widgets de alertas/status
    const alertasEStatusContainers = [programmedMaintenanceAlertsContainer, upcomingChecklistsStatusContainer];
    alertasEStatusContainers.forEach(container => {
        if (container) {
            container.addEventListener('click', async function(event) {
                const printButton = event.target.closest('.btn-print-checklist');
                const concluirChecklistButton = event.target.closest('.btn-concluir-checklist-agendado');
                const trocaOleoRealizadaButton = event.target.closest('.btn-troca-oleo-realizada');

                if (printButton) {
                    gerarFormularioChecklist(printButton.dataset.veiculoId, printButton.dataset.veiculoPlaca, printButton.dataset.dataPrevista);
                } else if (concluirChecklistButton) {
                    const veiculoId = concluirChecklistButton.dataset.veiculoId;
                    const veiculoPlaca = concluirChecklistButton.dataset.veiculoPlaca;
                    showUserMessage(messageChecklistStatus, 'Preparando checklist para conclusão...', 'info');
                    try {
                        const response = await fetch(`${API_BASE_URL}/checklists/iniciar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ veiculoId }) });
                        const responseData = await response.json();
                        if (response.ok && responseData.checklist && responseData.checklist._id) {
                            showUserMessage(messageChecklistStatus, 'Checklist movido para pendentes. Preencha os resultados.', 'success');
                            carregarChecklistsPendentes(); // Atualiza a lista de pendentes
                            carregarAlertasProgramadosEStatusChecklist(); // Atualiza a lista de agendados
                            // Não abre o formulário de resultados aqui, conforme novo fluxo
                        } else { 
                            showUserMessage(messageChecklistStatus, responseData.message || 'Erro ao mover checklist para pendentes.', 'error'); 
                        }
                    } catch (error) { 
                        showUserMessage(messageChecklistStatus, 'Erro de conexão ao mover checklist.', 'error'); 
                    }
                } else if (trocaOleoRealizadaButton) {
                    abrirModalTrocaOleo(trocaOleoRealizadaButton.dataset.veiculoId, trocaOleoRealizadaButton.dataset.veiculoPlaca, trocaOleoRealizadaButton.dataset.kmAtualVeiculo);
                }
            });
        }
    });
    
    function gerarFormularioChecklist(veiculoId, veiculoPlaca, dataPrevistaISO) {
        const dataFormatada = dataPrevistaISO ? new Date(dataPrevistaISO).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '____/____/______';
        const hojeFormatado = new Date().toLocaleDateString('pt-BR');
        let itensHtml = '';
        ITENS_CHECKLIST_PADRAO.forEach(item => { itensHtml += `<tr><td style="padding: 4px; border: 1px solid #ccc; font-size: 9pt;">${item}</td><td style="text-align: center; padding: 4px; border: 1px solid #ccc;"><input type="checkbox" aria-label="OK para ${item}"></td><td style="text-align: center; padding: 4px; border: 1px solid #ccc;"><input type="checkbox" aria-label="Atenção para ${item}"></td><td style="padding: 4px; border: 1px solid #ccc;"><input type="text" style="width: 98%; border: 1px solid #ccc; padding: 3px; font-size: 9pt;" aria-label="Observações para ${item}"></td></tr>`; });
        const printWindow = window.open('', '_blank', 'height=800,width=800');
        printWindow.document.write(
            `<html>
             <head>
                <title>Formulário de Checklist Veicular - ${veiculoPlaca}</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm; } 
                    body { font-family: Arial, sans-serif; margin: 0; color: #333; font-size: 9pt; }
                    h1 { font-size: 14pt; text-align: center; margin-bottom: 8px; margin-top:0; } 
                    h2 { font-size: 11pt; text-align: center; margin-bottom: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th,td { border: 1px solid #777; padding: 4px; text-align: left; vertical-align: top; }
                    th { background-color: #e8e8e8; font-weight: bold; font-size: 9.5pt; }
                    .info-section { padding: 6px; border: 1px solid #ccc; margin-bottom: 8px; background: #fdfdfd; }
                    .info-section p { margin: 3px 0; font-size: 0.9em; }
                    .info-section label { font-weight: bold; }
                    input[type=text],input[type=number],textarea { border: 1px solid #bbb; padding: 3px; width: calc(100% - 8px); box-sizing: border-box; margin-top: 1px; margin-bottom: 1px; background:#fff; font-size: 9pt;}
                    input[type=checkbox]{vertical-align:middle;}
                    textarea { height: 40px; resize: vertical; font-size: 9pt; }
                    hr { border: 0; border-top: 1px solid #ccc; margin: 6px 0; }
                    .signature-section { margin-top: 20px; text-align: center; }
                    .signature-line { display: inline-block; width: 220px; border-bottom: 1px solid #000; margin-top: 25px; }
                    .no-print { display: none; } 
                    @media screen { .no-print {display: block; text-align:center; margin-top:15px;} .no-print button { padding: 8px 15px;} }
                </style>
             </head>
             <body>
                <h1>Formulário de Checklist Veicular</h1>
                <div class="info-section"><p><label>Veículo (Placa):</label> ${veiculoPlaca}</p><p><label>Data Programada do Checklist:</label> ${dataFormatada}</p><hr><p><label>Data da Inspeção:</label> <input type="text" value="${hojeFormatado}" style="width:90px;"></p><p><label>Realizado Por:</label> <input type="text" style="width:200px;"></p><p><label>Quilometragem Atual:</label> <input type="number" style="width:90px;"> km</p></div>
                <h2>Itens de Verificação</h2>
                <table><thead><tr><th>Item</th><th style="width:35px;text-align:center;">OK</th><th style="width:55px;text-align:center;">Atenção</th><th>Observações</th></tr></thead><tbody>${itensHtml}</tbody></table>
                <div class="observations-section" style="margin-top:8px"><h2>Observações Gerais:</h2><textarea aria-label="Observações Gerais"></textarea></div>
                <div class="signature-section"><p class="signature-line"></p><p>Assinatura do Responsável</p></div>
                <div class="no-print"><button onclick="window.print()">Imprimir</button> <button onclick="window.close()" style="margin-left:10px;">Fechar</button></div>
             </body>
             </html>`);
        printWindow.document.close();
    }
    
    if (formModalTrocaOleoEl) {
        formModalTrocaOleoEl.addEventListener('submit', async function(event) {
            event.preventDefault();
            showUserMessage(messageProgrammedAlerts, 'Registrando troca de óleo...', 'info');
            const formData = new FormData(this);
            const dadosTrocaOleo = Object.fromEntries(formData.entries());
            dadosTrocaOleo.tipoManutencao = "Troca de Óleo"; 
            if (!dadosTrocaOleo.dataRealizacao || !dadosTrocaOleo.quilometragem) {
                showUserMessage(messageProgrammedAlerts, 'Data da troca e KM atual são obrigatórios.', 'error'); return;
            }
            if (dadosTrocaOleo.proxTrocaOleoKm === '') delete dadosTrocaOleo.proxTrocaOleoKm;
            if (dadosTrocaOleo.proxTrocaOleoData === '') delete dadosTrocaOleo.proxTrocaOleoData;
            try {
                const response = await fetch(`${API_BASE_URL}/manutencoes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosTrocaOleo)
                });
                const responseData = await response.json();
                if (response.ok) {
                    showUserMessage(messageProgrammedAlerts, responseData.message || 'Troca de óleo registrada!', 'success');
                    this.reset(); hideModal(modalRegistrarTrocaOleoEl);
                    loadMaintenanceHistory({ veiculoId: filtroManutVeiculoSelect.value, mes: filtroManutMesSelect.value, ano: filtroManutAnoSelect.value}); 
                    carregarAlertasProgramadosEStatusChecklist();
                } else { showUserMessage(messageProgrammedAlerts, responseData.message || 'Erro ao registrar troca de óleo.', 'error'); }
            } catch (error) { console.error('Erro troca de óleo:', error); showUserMessage(messageProgrammedAlerts, 'Erro de conexão ao registrar troca.', 'error'); }
        });
    }
    
    async function loadMaintenanceHistory(filtros = {}) {
        if (!maintenanceHistoryBody) return;
        maintenanceHistoryBody.innerHTML = '<tr><td colspan="8" class="text-center">Carregando...</td></tr>';
        if (messageHistory) showUserMessage(messageHistory, '', '');
        const params = new URLSearchParams();
        if (filtros.veiculoId && filtros.veiculoId !== 'todos') params.append('veiculoId', filtros.veiculoId);
        if (filtros.mes && filtros.mes !== 'todos') params.append('mes', filtros.mes);
        if (filtros.ano && filtros.ano !== 'todos') params.append('ano', filtros.ano);
        try {
            const response = await fetch(`${API_BASE_URL}/manutencoes/historico?${params.toString()}`);
            if (!response.ok) { const err = await response.json().catch(()=>({message: `Erro ${response.status}`})); throw new Error(err.message); }
            const data = await response.json();
            if (data && data.length > 0) {
                maintenanceHistoryBody.innerHTML = '';
                data.forEach(m => { 
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td><a href="detalhes_veiculo.html?id=${m.veiculoId}">${m.veiculoPlaca||'--'}</a></td><td>${m.tipoManutencao||'--'}</td><td>${formatDate(m.dataRealizacao)}</td><td>${formatCurrency(m.custo)}</td><td>${formatKm(m.quilometragem)}</td><td>${m.realizadaPor||'--'}</td><td>${m.descricao||'--'}</td><td class="action-buttons"><button class="btn-action delete-maintenance" title="Excluir" data-id="${m._id}"><i class="fas fa-trash-alt"></i></button></td>`;
                    maintenanceHistoryBody.appendChild(tr);
                });
            } else { maintenanceHistoryBody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhum histórico para os filtros.</td></tr>`; }
        } catch (error) { if(messageHistory) showUserMessage(messageHistory, error.message || 'Falha ao carregar histórico.', 'error'); maintenanceHistoryBody.innerHTML = `<tr><td colspan="8" class="error-message text-center">Erro ao carregar.</td></tr>`;}
    }

    async function loadChecklistHistory(filtros = {}) {
        if (!checklistHistoryBody) return;
        checklistHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
        if (messageChecklistHistory) showUserMessage(messageChecklistHistory, '', '');
        const params = new URLSearchParams();
        if (filtros.veiculoId && filtros.veiculoId !== 'todos') params.append('veiculoId', filtros.veiculoId);
        if (filtros.mes && filtros.mes !== 'todos') params.append('mes', filtros.mes);
        if (filtros.ano && filtros.ano !== 'todos') params.append('ano', filtros.ano);
        try {
            const response = await fetch(`${API_BASE_URL}/checklists/historico?${params.toString()}`);
            if (!response.ok) { const err = await response.json().catch(()=>({message: `Erro ${response.status}`})); throw new Error(err.message); }
            const data = await response.json();
            if (data && data.length > 0) {
                checklistHistoryBody.innerHTML = '';
                data.forEach(c => { 
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td><a href="detalhes_veiculo.html?id=${c.veiculoId}">${c.veiculoPlaca||'--'}</a></td><td>${formatDate(c.dataRealizacao)}</td><td>${formatKm(c.quilometragem)}</td><td>${c.realizadoPor||'--'}</td><td>${c.observacoes||'--'}</td><td class="action-buttons"><button class="btn-action delete-checklist" title="Excluir" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button></td>`;
                    checklistHistoryBody.appendChild(tr);
                });
            } else { checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum histórico para os filtros.</td></tr>`; }
        } catch (error) { if(messageChecklistHistory) showUserMessage(messageChecklistHistory, error.message || 'Falha ao carregar histórico.', 'error'); checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="error-message text-center">Erro ao carregar.</td></tr>`;}
    }

    if(btnFiltrarManutencoes) {
        btnFiltrarManutencoes.addEventListener('click', () => {
            loadMaintenanceHistory({ veiculoId: filtroManutVeiculoSelect.value, mes: filtroManutMesSelect.value, ano: filtroManutAnoSelect.value });
        });
    }
    if(btnFiltrarChecklists) {
        btnFiltrarChecklists.addEventListener('click', () => {
            loadChecklistHistory({ veiculoId: filtroCheckVeiculoSelect.value, mes: filtroCheckMesSelect.value, ano: filtroCheckAnoSelect.value });
        });
    }

    if (maintenanceHistoryBody) { 
        maintenanceHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action.delete-maintenance'); 
            if (!targetButton) return;
            const maintenanceId = targetButton.dataset.id;
            if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                if(messageHistory) showUserMessage(messageHistory, 'Excluindo manutenção...', 'info');
                try {
                    const response = await fetch(`${API_BASE_URL}/manutencoes/${maintenanceId}`, { method: 'DELETE' });
                    const responseData = await response.json();
                    if (response.ok) { 
                        if(messageHistory) showUserMessage(messageHistory, responseData.message || 'Manutenção excluída!', 'success');
                        loadMaintenanceHistory({ 
                            veiculoId: filtroManutVeiculoSelect.value,
                            mes: filtroManutMesSelect.value,
                            ano: filtroManutAnoSelect.value
                        }); 
                        carregarAlertasProgramadosEStatusChecklist(); 
                    } else { 
                        throw new Error(responseData.message || `Erro ${response.status} ao excluir.`);
                    }
                } catch (error) { 
                    if(messageHistory) showUserMessage(messageHistory, error.message || 'Falha ao excluir manutenção.', 'error');
                }
            }
        }); 
    }
    if (checklistHistoryBody) { 
        checklistHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action.delete-checklist'); 
            if (!targetButton) return;
            const checklistId = targetButton.dataset.id;
            if (confirm('Tem certeza que deseja excluir este checklist?')) {
                if(messageChecklistHistory) showUserMessage(messageChecklistHistory, 'Excluindo checklist...', 'info');
                try {
                    const response = await fetch(`${API_BASE_URL}/checklists/${checklistId}`, { method: 'DELETE' });
                    const responseData = await response.json();
                    if (response.ok) { 
                        if(messageChecklistHistory) showUserMessage(messageChecklistHistory, responseData.message || 'Checklist excluído!', 'success');
                        loadChecklistHistory({ 
                            veiculoId: filtroCheckVeiculoSelect.value,
                            mes: filtroCheckMesSelect.value,
                            ano: filtroCheckAnoSelect.value
                        }); 
                        carregarAlertasProgramadosEStatusChecklist();
                        carregarChecklistsPendentes();
                    } else { 
                        throw new Error(responseData.message || `Erro ${response.status} ao excluir.`);
                    }
                } catch (error) { 
                    if(messageChecklistHistory) showUserMessage(messageChecklistHistory, error.message || 'Falha ao excluir checklist.', 'error');
                }
            }
        });
    }
    
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) { try { const user = JSON.parse(storedUser); if (user && user.username && welcomeMessageEl) welcomeMessageEl.textContent = `Olá, ${user.username}!`; } catch (e) { console.error("Erro parse usuário:", e); } }
    if (logoutButton) { logoutButton.addEventListener('click', function() { localStorage.removeItem('gpx7User'); window.location.href = 'login.html'; }); }

    if (window.location.pathname.includes('manutencao.html')) {
        hideAllDynamicForms(); 
        carregarVeiculosParaMultiplosSelects();
        popularFiltrosDeData(filtroManutMesSelect, filtroManutAnoSelect);
        popularFiltrosDeData(filtroCheckMesSelect, filtroCheckAnoSelect);
        carregarAlertasProgramadosEStatusChecklist();
        carregarChecklistsPendentes();
        loadMaintenanceHistory(); 
        loadChecklistHistory();
    }
});
