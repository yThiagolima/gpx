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
    const searchMaintenanceInput = document.getElementById('searchInputMaintenance');
    const searchChecklistInput = document.getElementById('searchChecklistInput');

    // --- Funções Auxiliares ---
    function showMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = 'message-feedback';
        if (type) element.classList.add(type);
    }

    function formatDate(dateString, includeTime = false) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        // Para datas que vêm da API como string ISO (ex: YYYY-MM-DDTHH:mm:ss.sssZ),
        // o new Date() já interpreta corretamente como UTC.
        // Se a data vier sem fuso (ex: YYYY-MM-DD) pode haver interpretação como local.
        // A API deve idealmente retornar datas em formato ISO 8601 com Z ou offset.
        // Se a data for apenas YYYY-MM-DD, o timeZone: 'UTC' na formatação ajuda a evitar shifts indesejados.
        return date.toLocaleDateString('pt-BR', options);
    }


    function formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) return '--';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatKm(value) {
        if (value === null || value === undefined || isNaN(value)) return '--';
        return value.toLocaleString('pt-BR') + ' km';
    }

    // --- Funções de Carregamento de Dados ---
    async function carregarVeiculosParaSelects() {
        if (!manutencaoVeiculoSelect && !checklistVeiculoSelect) return;
        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) throw new Error('Falha ao carregar veículos para os formulários.');
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
            if (manutencaoVeiculoSelect) popularSelect(manutencaoVeiculoSelect, veiculos);
            if (checklistVeiculoSelect) popularSelect(checklistVeiculoSelect, veiculos);

        } catch (error) {
            console.error('Erro ao carregar veículos para selects:', error);
            if(messageRegistro) showMessage(messageRegistro, error.message || 'Erro ao carregar lista de veículos.', 'error');
        }
    }

    async function loadUpcomingMaintenance() {
        if (!upcomingMaintenanceSection) return;
        upcomingMaintenanceSection.innerHTML = '<p class="loading-message text-center">Carregando próximas manutenções e alertas...</p>';
        if (messageUpcoming) showMessage(messageUpcoming, '', '');

        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes/proximas');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                upcomingMaintenanceSection.innerHTML = ''; // Limpa loading
                data.forEach(maint => {
                    const widget = document.createElement('div');
                    widget.className = 'widget'; // Classe base

                    let iconClass = 'fa-bell'; 
                    let title = maint.tipo || 'Alerta';
                    let detailsHtml = `<p class="widget-description">${maint.descricao || 'Verificar detalhes.'}</p>`;
                    let actionsHtml = '';
                    let statusClass = 'widget-ok'; 
                    let statusText = 'Programado';

                    if (maint.statusAlerta) {
                        switch (maint.statusAlerta.toUpperCase()) {
                            case "VENCIDO_DATA":
                                statusClass = 'widget-vencido widget-vencido-data';
                                statusText = "ATRASADO (DATA)!";
                                iconClass = 'fa-calendar-times';
                                break;
                            case "VENCIDO_KM":
                                statusClass = 'widget-vencido widget-vencido-km';
                                statusText = "ATENÇÃO (KM ATINGIDA)!";
                                iconClass = 'fa-tachometer-alt-fast';
                                break;
                            case "VENCIDO_DATA_KM":
                                statusClass = 'widget-vencido widget-vencido-data-km';
                                statusText = "URGENTE (DATA E KM)!";
                                iconClass = 'fa-exclamation-triangle';
                                break;
                            case "OK":
                            default:
                                statusClass = 'widget-ok'; // Mantém ou define se não houver status específico
                                statusText = "Programado";
                                // Define ícone base para tipo se OK
                                if (maint.tipo === 'Troca de Óleo') iconClass = 'fa-tint';
                                else if (maint.tipo === 'Checklist') iconClass = 'fa-clipboard-check';
                                else iconClass = 'fa-tools'; // Genérico para manutenção
                                break;
                        }
                    }
                    widget.classList.add(...statusClass.split(' '));

                    // Sobrescreve o ícone se for Troca de Óleo e estiver vencido, para dar mais ênfase
                    if (maint.tipo === 'Troca de Óleo') {
                        if (maint.statusAlerta && maint.statusAlerta.toUpperCase().startsWith("VENCIDO")) {
                            iconClass = 'fa-oil-can-drip'; // Ícone de óleo pingando para urgência
                        } else {
                            iconClass = 'fa-tint'; // Ícone normal de óleo
                        }
                        title = 'Troca de Óleo';
                        detailsHtml = `
                            <p><strong>Data Prevista:</strong> ${maint.dataPrevista ? formatDate(maint.dataPrevista) : 'N/A'}</p>
                            <p><strong>KM Previsto:</strong> ${maint.kmPrevisto ? formatKm(maint.kmPrevisto) : 'N/A'}</p>
                            <p><strong>KM Atual do Veículo:</strong> ${formatKm(maint.kmAtual)}</p>
                        `;
                    } else if (maint.tipo === 'Checklist') {
                        if (maint.statusAlerta && maint.statusAlerta.toUpperCase().startsWith("VENCIDO")) {
                             iconClass = 'fa-file-excel'; // Ou outro ícone de alerta para checklist
                        } else {
                            iconClass = 'fa-clipboard-check';
                        }
                        title = 'Checklist Periódico';
                        detailsHtml = `
                            <p><strong>Data Prevista:</strong> ${maint.dataPrevista ? formatDate(maint.dataPrevista) : 'N/A'}</p>
                            <p>${maint.descricao || ''}</p>
                        `;
                        actionsHtml = `<button class="button-secondary button-small btn-print-checklist" data-veiculo-id="${maint.veiculoId}" data-veiculo-placa="${maint.veiculoPlaca}" data-data-prevista="${maint.dataPrevista}"><i class="fas fa-print"></i> Imprimir Formulário</button>`;
                    } else if (maint.tipo) { // Para outros tipos de manutenção futuros
                         title = maint.tipo;
                         detailsHtml = `<p><strong>Data Prevista:</strong> ${maint.dataPrevista ? formatDate(maint.dataPrevista) : 'N/A'}</p><p>${maint.descricao || ''}</p>`;
                    }
                    
                    widget.innerHTML = `
                        <div class="widget-icon">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="widget-content">
                            <h3 class="widget-title">${title} - ${maint.veiculoPlaca || 'N/A'}</h3>
                            <p class="widget-status">${statusText}</p>
                            <div class="widget-info">${detailsHtml}</div>
                            <div class="widget-actions" style="margin-top: 10px;">
                                ${actionsHtml}
                            </div>
                        </div>
                    `;
                    upcomingMaintenanceSection.appendChild(widget);
                });

                document.querySelectorAll('.btn-print-checklist').forEach(button => {
                    button.addEventListener('click', function() {
                        const veiculoId = this.dataset.veiculoId;
                        const veiculoPlaca = this.dataset.veiculoPlaca;
                        const dataPrevista = this.dataset.dataPrevista;
                        gerarFormularioChecklist(veiculoId, veiculoPlaca, dataPrevista);
                    });
                });

            } else {
                upcomingMaintenanceSection.innerHTML = '<p class="text-center" style="padding: 20px;">Nenhuma manutenção futura ou alerta no momento.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar próximas manutenções/alertas:', error);
            if(messageUpcoming) showMessage(messageUpcoming, error.message || 'Falha ao carregar alertas.', 'error');
            upcomingMaintenanceSection.innerHTML = `<p class="error-message text-center">Erro ao carregar alertas.</p>`;
        }
    }

    function gerarFormularioChecklist(veiculoId, veiculoPlaca, dataPrevistaISO) {
        const dataFormatada = dataPrevistaISO ? new Date(dataPrevistaISO).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '____/____/______';
        const hojeFormatado = new Date().toLocaleDateString('pt-BR');
        const checklistItens = [
            "Nível do Óleo do Motor", "Nível do Líquido de Arrefecimento", "Nível do Fluido de Freio",
            "Nível do Fluido da Direção Hidráulica", "Calibragem e Estado dos Pneus (incluindo estepe)",
            "Faróis (baixo, alto, setas, freio, ré, neblina)", "Lanternas Internas",
            "Palhetas do Limpador de Para-brisa", "Esguicho de Água do Para-brisa",
            "Vazamentos (motor, câmbio, radiador)", "Cintos de Segurança", "Buzina",
            "Extintor de Incêndio (presença e validade)", "Triângulo, Macaco, Chave de Roda",
            "Bateria (estado visual, terminais)", "Freio de Estacionamento", "Amortecedores (inspeção visual)",
            "Documentação do Veículo (CRLV)", "Limpeza Interna e Externa"
        ];
        let itensHtml = '';
        checklistItens.forEach(item => { itensHtml += `<tr><td style="padding: 6px; border: 1px solid #ddd;">${item}</td><td style="text-align: center; padding: 6px; border: 1px solid #ddd;"><input type="checkbox" aria-label="OK para ${item}"></td><td style="text-align: center; padding: 6px; border: 1px solid #ddd;"><input type="checkbox" aria-label="Atenção para ${item}"></td><td style="padding: 6px; border: 1px solid #ddd;"><input type="text" style="width: 98%; border: 1px solid #ccc; padding: 4px;" aria-label="Observações para ${item}"></td></tr>`; });
        const printWindow = window.open('', '_blank', 'height=800,width=800');
        printWindow.document.write(`<html><head><title>Formulário de Checklist Veicular - ${veiculoPlaca}</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:15px;font-size:0.9em}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background-color:#f0f0f0}.info-section{padding:10px;border:1px solid #eee;margin-bottom:15px;background:#f9f9f9}.info-section p{margin:5px 0;font-size:0.95em}.info-section label{font-weight:bold}input[type=text],input[type=number],textarea{border:1px solid #ccc;padding:5px;width:calc(100% - 12px);box-sizing:border-box;margin-top:2px;margin-bottom:2px}textarea{height:60px}hr{border:0;border-top:1px solid #eee;margin:10px 0}.signature-section{margin-top:30px;text-align:center}.signature-line{display:inline-block;width:280px;border-bottom:1px solid #000;margin-top:35px}@media print{body{margin:0;font-size:10pt;color:#000}.no-print{display:none}table{font-size:8.5pt}input[type=text],input[type=number],textarea{border:1px solid #999} h1{font-size:14pt} h2{font-size:12pt}}</style></head><body><h1>Formulário de Checklist Veicular</h1><div class="info-section"><p><label>Veículo (Placa):</label> ${veiculoPlaca}</p><p><label>Data Programada do Checklist:</label> ${dataFormatada}</p><hr><p><label>Data da Inspeção:</label> <input type="text" value="${hojeFormatado}"></p><p><label>Realizado Por:</label> <input type="text"></p><p><label>Quilometragem Atual:</label> <input type="number"> km</p></div><h2>Itens de Verificação</h2><table><thead><tr><th>Item</th><th style="width:45px;text-align:center;">OK</th><th style="width:65px;text-align:center;">Atenção</th><th>Observações</th></tr></thead><tbody>${itensHtml}</tbody></table><div class="observations-section" style="margin-top:15px"><h2>Observações Gerais:</h2><textarea aria-label="Observações Gerais"></textarea></div><div class="signature-section"><p class="signature-line"></p><p>Assinatura do Responsável</p></div><div style="text-align:center; margin-top:20px;" class="no-print"><button onclick="window.print()" style="padding:10px 20px; background-color:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">Imprimir</button> <button onclick="window.close()" style="padding:10px 20px;margin-left:10px;background-color:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;">Fechar</button></div></body></html>`);
        printWindow.document.close();
    }

    async function loadMaintenanceHistory(searchTerm = '') {
        if (!maintenanceHistoryBody) return;
        maintenanceHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando histórico de manutenções...</td></tr>';
        if (messageHistory) showMessage(messageHistory, '', '');
        try {
            let url = `https://gpx-api-xwv1.onrender.com/api/manutencoes/historico${searchTerm ? '?search='+encodeURIComponent(searchTerm) : ''}`;
            const response = await fetch(url);
            if (!response.ok) { const errData = await response.json().catch(()=>({message:`Erro ${response.status}`})); throw new Error(errData.message); }
            const data = await response.json();
            if (data && data.length > 0) {
                maintenanceHistoryBody.innerHTML = '';
                data.forEach(maint => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="detalhes_veiculo.html?id=${maint.veiculoId}">${maint.veiculoPlaca || '--'}</a></td>
                        <td>${maint.tipoManutencao || '--'}</td>
                        <td>${formatDate(maint.dataRealizacao)}</td>
                        <td>${formatCurrency(maint.custo)}</td>
                        <td>${formatKm(maint.quilometragem)}</td>
                        <td>${maint.descricao || '--'}</td>
                        <td class="action-buttons">
                            <button class="btn-action view" title="Ver Detalhes (Em breve)" data-id="${maint._id}" disabled><i class="fas fa-eye"></i></button>
                            <button class="btn-action edit" title="Editar Manutenção (Em breve)" data-id="${maint._id}" disabled><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete-maintenance" title="Excluir Manutenção" data-id="${maint._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>`;
                    maintenanceHistoryBody.appendChild(tr);
                });
            } else { 
                maintenanceHistoryBody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum histórico de manutenção ${searchTerm ? 'encontrado para "' + searchTerm + '"' : 'registrado'}.</td></tr>`; 
            }
        } catch (error) { 
            console.error('Erro ao carregar histórico de manutenções:', error); 
            if(messageHistory) showMessage(messageHistory, error.message || 'Falha ao carregar histórico.', 'error');
            maintenanceHistoryBody.innerHTML = `<tr><td colspan="7" class="error-message text-center">Erro ao carregar histórico.</td></tr>`;
        }
    }

    async function loadChecklistHistory(searchTerm = '') {
        if (!checklistHistoryBody) return;
        checklistHistoryBody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando histórico de checklists...</td></tr>';
        if (messageChecklistHistory) showMessage(messageChecklistHistory, '', '');
        try {
            let url = `https://gpx-api-xwv1.onrender.com/api/checklists/historico${searchTerm ? '?search='+encodeURIComponent(searchTerm) : ''}`;
            const response = await fetch(url);
            if (!response.ok) { const errData = await response.json().catch(()=>({message:`Erro ${response.status}`})); throw new Error(errData.message); }
            const data = await response.json();
            if (data && data.length > 0) {
                checklistHistoryBody.innerHTML = '';
                data.forEach(checklist => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="detalhes_veiculo.html?id=${checklist.veiculoId}">${checklist.veiculoPlaca || '--'}</a></td>
                        <td>${formatDate(checklist.dataRealizacao)}</td>
                        <td>${formatKm(checklist.quilometragem)}</td>
                        <td>${checklist.realizadoPor || '--'}</td>
                        <td>${checklist.observacoes || '--'}</td>
                        <td class="action-buttons">
                            <button class="btn-action view" title="Ver Detalhes (Em breve)" data-id="${checklist._id}" disabled><i class="fas fa-eye"></i></button>
                            <button class="btn-action delete-checklist" title="Excluir Checklist" data-id="${checklist._id}"><i class="fas fa-trash-alt"></i></button>
                        </td>`;
                    checklistHistoryBody.appendChild(tr);
                });
            } else { 
                checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum histórico de checklist ${searchTerm ? 'encontrado para "' + searchTerm + '"' : 'registrado'}.</td></tr>`; 
            }
        } catch (error) { 
            console.error('Erro ao carregar histórico de checklists:', error); 
            if(messageChecklistHistory) showMessage(messageChecklistHistory, error.message || 'Falha ao carregar histórico.', 'error');
            checklistHistoryBody.innerHTML = `<tr><td colspan="6" class="error-message text-center">Erro ao carregar histórico.</td></tr>`;
        }
    }

    function hideAllForms() {
        if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'none';
        if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'none';
        if (messageRegistro) showMessage(messageRegistro, '', '');
    }

    if (showMaintenanceFormBtn) {
        showMaintenanceFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarManutencao) formRegistrarManutencao.style.display = 'block';
        });
    }

    if (showChecklistFormBtn) {
        showChecklistFormBtn.addEventListener('click', () => {
            hideAllForms();
            if (formRegistrarChecklist) formRegistrarChecklist.style.display = 'block';
        });
    }

    document.querySelectorAll('.cancel-form-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            const form = e.target.closest('form');
            if (form) form.reset();
            hideAllForms();
        });
    });
    
    if (formRegistrarManutencao) {
        formRegistrarManutencao.addEventListener('submit', async function(event) {
            event.preventDefault();
            if(messageRegistro) showMessage(messageRegistro, 'Registrando manutenção...', 'info');
            const selectedOption = manutencaoVeiculoSelect.options[manutencaoVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption ? selectedOption.dataset.placa : null;
            const manutencaoData = {
                veiculoId: this.elements['manutencaoVeiculoId'].value, veiculoPlaca: veiculoPlaca,
                tipoManutencao: this.elements['manutencaoTipo'].value, dataRealizacao: this.elements['manutencaoData'].value,
                custo: this.elements['manutencaoCusto'].value, quilometragem: this.elements['manutencaoKm'].value,
                realizadaPor: this.elements['manutencaoRealizadaPor'].value, descricao: this.elements['manutencaoDescricao'].value,
            };
            if (!manutencaoData.veiculoId || !manutencaoData.tipoManutencao || !manutencaoData.dataRealizacao || manutencaoData.quilometragem === '') {
                if(messageRegistro) showMessage(messageRegistro, 'Preencha: Veículo, Tipo, Data e Quilometragem da manutenção.', 'error'); return;
            }
            try {
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/manutencoes', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manutencaoData)
                });
                const responseData = await response.json();
                if (response.ok) {
                    if(messageRegistro) showMessage(messageRegistro, responseData.message || 'Manutenção registrada!', 'success');
                    this.reset(); hideAllForms(); loadMaintenanceHistory(); loadUpcomingMaintenance();
                } else { if(messageRegistro) showMessage(messageRegistro, responseData.message || `Erro ${response.status}.`, 'error'); }
            } catch (error) { console.error('Erro ao registrar manutenção:', error); if(messageRegistro) showMessage(messageRegistro, 'Erro de conexão.', 'error'); }
        });
    }

    if (formRegistrarChecklist) {
        formRegistrarChecklist.addEventListener('submit', async function(event) {
            event.preventDefault();
            if(messageRegistro) showMessage(messageRegistro, 'Registrando checklist...', 'info');
            const selectedOption = checklistVeiculoSelect.options[checklistVeiculoSelect.selectedIndex];
            const veiculoPlaca = selectedOption ? selectedOption.dataset.placa : null;
            const checklistData = {
                veiculoId: this.elements['checklistVeiculoId'].value, veiculoPlaca: veiculoPlaca,
                dataRealizacao: this.elements['checklistData'].value, quilometragem: this.elements['checklistKm'].value,
                realizadoPor: this.elements['checklistRealizadoPor'].value, observacoes: this.elements['checklistObservacoes'].value,
            };
            if (!checklistData.veiculoId || !checklistData.dataRealizacao || checklistData.quilometragem === '') {
                if(messageRegistro) showMessage(messageRegistro, 'Preencha: Veículo, Data e Quilometragem do checklist.', 'error'); return;
            }
            try {
                const response = await fetch('https://gpx-api-xwv1.onrender.com/api/checklists', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checklistData)
                });
                const responseData = await response.json();
                if (response.ok) {
                    if(messageRegistro) showMessage(messageRegistro, responseData.message || 'Checklist registrado!', 'success');
                    this.reset(); hideAllForms(); loadChecklistHistory(); loadUpcomingMaintenance();
                } else { if(messageRegistro) showMessage(messageRegistro, responseData.message || `Erro ${response.status}.`, 'error'); }
            } catch (error) { console.error('Erro ao registrar checklist:', error); if(messageRegistro) showMessage(messageRegistro, 'Erro de conexão.', 'error'); }
        });
    }

    if (searchMaintenanceInput) {
        let searchTimeout;
        searchMaintenanceInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => { loadMaintenanceHistory(this.value); }, 500);
        });
    }

    if (searchChecklistInput) {
        let searchTimeout;
        searchChecklistInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => { loadChecklistHistory(this.value); }, 500);
        });
    }

    if (maintenanceHistoryBody) {
        maintenanceHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action.delete-maintenance');
            if (!targetButton) return;
            const maintenanceId = targetButton.dataset.id;
            if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                if(messageHistory) showMessage(messageHistory, 'Excluindo...', 'info');
                try {
                    const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/manutencoes/${maintenanceId}`, { method: 'DELETE' });
                    const responseData = await response.json();
                    if (response.ok) { if(messageHistory) showMessage(messageHistory, responseData.message || 'Excluída!', 'success'); loadMaintenanceHistory(); loadUpcomingMaintenance(); } 
                    else { throw new Error(responseData.message || `Erro ${response.status}`); }
                } catch (error) { if(messageHistory) showMessage(messageHistory, error.message || 'Falha.', 'error'); }
            }
        });
    }

    if (checklistHistoryBody) {
        checklistHistoryBody.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action.delete-checklist');
            if (!targetButton) return;
            const checklistId = targetButton.dataset.id;
            if (confirm('Tem certeza que deseja excluir este checklist?')) {
                if(messageChecklistHistory) showMessage(messageChecklistHistory, 'Excluindo...', 'info');
                try {
                    const response = await fetch(`https://gpx-api-xwv1.onrender.com/api/checklists/${checklistId}`, { method: 'DELETE' });
                    const responseData = await response.json();
                    if (response.ok) { if(messageChecklistHistory) showMessage(messageChecklistHistory, responseData.message || 'Excluído!', 'success'); loadChecklistHistory(); loadUpcomingMaintenance(); } 
                    else { throw new Error(responseData.message || `Erro ${response.status}`); }
                } catch (error) { if(messageChecklistHistory) showMessage(messageChecklistHistory, error.message || 'Falha.', 'error'); }
            }
        });
    }
    
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username && welcomeMessageEl) { welcomeMessageEl.textContent = `Olá, ${user.username}!`; }
        } catch (e) { console.error("Erro ao parsear usuário:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User'); window.location.href = 'login.html';
        });
    }

    if (window.location.pathname.includes('manutencao.html')) {
        hideAllForms(); 
        carregarVeiculosParaSelects();
        loadUpcomingMaintenance();
        loadMaintenanceHistory();
        loadChecklistHistory();
    }
});
