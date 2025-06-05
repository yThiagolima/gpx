// frontend/js/multas.js
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api';

    // Formulário de Cadastro/Edição de Multa
    const formCadastrarMulta = document.getElementById('formCadastrarMulta');
    const multaVeiculoIdSelect = document.getElementById('multaVeiculoId');
    const multaStatusPagamentoSelect = document.getElementById('multaStatusPagamento');
    const dataPagamentoGroup = document.getElementById('dataPagamentoGroup');
    const multaDataPagamentoInput = document.getElementById('multaDataPagamento');
    const multaAutorInfracaoInput = document.getElementById('multaAutorInfracao'); // Novo campo
    const messageNovaMulta = document.getElementById('messageNovaMulta');
    let editandoMultaId = null; 

    // Filtros da Lista de Multas
    const searchMultasInput = document.getElementById('searchMultasInput');
    const filtroVeiculoMultaSelect = document.getElementById('filtroVeiculoMulta');
    const filtroStatusPagamentoMultaSelect = document.getElementById('filtroStatusPagamentoMulta');

    // Tabela e Mensagens da Lista
    const corpoTabelaMultas = document.getElementById('corpoTabelaMultas');
    const messageListaMultas = document.getElementById('messageListaMultas');

    // --- Funções Auxiliares ---
    function showUserMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = 'message-feedback';
        if (type) element.classList.add(type);
        setTimeout(() => { if (element.textContent === text) { element.textContent = ''; element.className = 'message-feedback';}}, 7000);
    }

    function formatDateToInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().split('T')[0];
        } catch (e) { return ''; }
    }

    function formatDateForDisplay(dateString) { 
        if (!dateString) return '---';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    function formatCurrency(value) { 
        if (value === null || value === undefined || isNaN(value)) return '---';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- Lógica do Formulário ---
    async function popularVeiculosNosSelects() {
        try {
            const response = await fetch(`${API_BASE_URL}/veiculos`);
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();
            
            const selects = [multaVeiculoIdSelect, filtroVeiculoMultaSelect];
            selects.forEach(selectElement => {
                if (selectElement) {
                    const firstOptionVal = selectElement.options[0].value;
                    const firstOptionText = selectElement.options[0].text;
                    selectElement.innerHTML = `<option value="${firstOptionVal}">${firstOptionText}</option>`; 
                    veiculos.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v._id;
                        option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                        selectElement.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error('Erro ao popular selects de veículos:', error);
            showUserMessage(messageNovaMulta, 'Erro ao carregar veículos para os formulários.', 'error');
        }
    }

    if (multaStatusPagamentoSelect && dataPagamentoGroup) {
        multaStatusPagamentoSelect.addEventListener('change', function() {
            dataPagamentoGroup.style.display = (this.value === 'paga') ? 'block' : 'none';
            if (this.value !== 'paga' && multaDataPagamentoInput) {
                multaDataPagamentoInput.value = ''; 
            } else if (this.value === 'paga' && multaDataPagamentoInput && !multaDataPagamentoInput.value) {
                 multaDataPagamentoInput.value = formatDateToInput(new Date()); 
            }
        });
    }

    function resetarFormularioMulta() {
        if (formCadastrarMulta) formCadastrarMulta.reset();
        editandoMultaId = null;
        if (formCadastrarMulta) formCadastrarMulta.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Salvar Multa';
        if (dataPagamentoGroup) dataPagamentoGroup.style.display = 'none';
        document.querySelector('#formCadastrarMulta h2').textContent = 'Cadastrar Nova Multa';
        if (multaVeiculoIdSelect) multaVeiculoIdSelect.disabled = false;
    }
    
    if(formCadastrarMulta){
        const resetButton = formCadastrarMulta.querySelector('button[type="reset"]');
        if(resetButton) resetButton.addEventListener('click', resetarFormularioMulta);
    }

    if (formCadastrarMulta) {
        formCadastrarMulta.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            if (data.statusPagamento !== 'paga') {
                data.dataPagamento = null;
            } else if (data.statusPagamento === 'paga' && !data.dataPagamento) {
                data.dataPagamento = new Date().toISOString().split('T')[0]; 
            }
            if (!data.autorInfracao) { // Trata campo opcional
                data.autorInfracao = null;
            }


            const url = editandoMultaId ? `${API_BASE_URL}/multas/${editandoMultaId}` : `${API_BASE_URL}/multas`;
            const method = editandoMultaId ? 'PUT' : 'POST';
            const acao = editandoMultaId ? 'atualizar' : 'cadastrar';

            showUserMessage(messageNovaMulta, `Salvando multa...`, 'info');

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const responseData = await response.json();
                if (response.ok) {
                    showUserMessage(messageNovaMulta, responseData.message || `Multa ${acao === 'atualizar' ? 'atualizada' : 'cadastrada'}!`, 'success');
                    resetarFormularioMulta();
                    aplicarFiltrosMultas(); 
                } else {
                    showUserMessage(messageNovaMulta, responseData.message || `Erro ao ${acao} multa.`, 'error');
                }
            } catch (error) {
                console.error(`Erro ao ${acao} multa:`, error);
                showUserMessage(messageNovaMulta, `Erro de conexão ao ${acao} multa.`, 'error');
            }
        });
    }

    async function carregarMultas(filtros = {}) {
        if (!corpoTabelaMultas) return;
        corpoTabelaMultas.innerHTML = `<tr><td colspan="9" class="text-center">Carregando multas...</td></tr>`; // Colspan atualizado
        
        const params = new URLSearchParams();
        if (filtros.veiculoId && filtros.veiculoId !== 'todos') params.append('veiculoId', filtros.veiculoId);
        if (filtros.statusPagamento && filtros.statusPagamento !== 'todos') params.append('statusPagamento', filtros.statusPagamento);
        if (filtros.search) params.append('search', filtros.search);

        try {
            const response = await fetch(`${API_BASE_URL}/multas?${params.toString()}`);
            if (!response.ok) { const err = await response.json(); throw new Error(err.message || `Erro ${response.status}`);}
            const multas = await response.json();
            corpoTabelaMultas.innerHTML = '';
            if (multas && multas.length > 0) {
                multas.forEach(multa => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${multa.veiculoPlaca || 'N/A'}</td>
                        <td>${multa.descricao}</td>
                        <td>${multa.autorInfracao || '---'}</td> {/* NOVO CAMPO NA TABELA */}
                        <td>${formatDateForDisplay(multa.dataInfracao)}</td>
                        <td style="text-align:right;">${formatCurrency(multa.valor)}</td>
                        <td>${formatDateForDisplay(multa.dataVencimento)}</td>
                        <td><span class="status-tag status-multa-${multa.statusPagamento}">${multa.statusPagamento.charAt(0).toUpperCase() + multa.statusPagamento.slice(1)}</span></td>
                        <td>${formatDateForDisplay(multa.dataPagamento)}</td>
                        <td class="action-buttons">
                            <button class="btn-action edit btn-editar-multa" data-id="${multa._id}" title="Editar Multa"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete btn-excluir-multa" data-id="${multa._id}" title="Excluir Multa"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `; // Colspan da tabela final foi ajustado para 9 no thead do HTML
                    corpoTabelaMultas.appendChild(tr);
                });
            } else {
                corpoTabelaMultas.innerHTML = `<tr><td colspan="9" class="text-center">Nenhuma multa encontrada.</td></tr>`;
            }
        } catch (error) {
            console.error("Erro ao carregar multas:", error);
            corpoTabelaMultas.innerHTML = `<tr><td colspan="9" class="text-center error-message">Erro: ${error.message}</td></tr>`;
            if(messageListaMultas) showUserMessage(messageListaMultas, `Erro ao listar: ${error.message}`, 'error');
        }
    }

    function aplicarFiltrosMultas() {
        carregarMultas({
            veiculoId: filtroVeiculoMultaSelect ? filtroVeiculoMultaSelect.value : 'todos',
            statusPagamento: filtroStatusPagamentoMultaSelect ? filtroStatusPagamentoMultaSelect.value : 'todos',
            search: searchMultasInput ? searchMultasInput.value.trim() : ''
        });
    }
    if (searchMultasInput) { let t; searchMultasInput.addEventListener('keyup', () => { clearTimeout(t); t = setTimeout(aplicarFiltrosMultas, 500); }); }
    if (filtroVeiculoMultaSelect) filtroVeiculoMultaSelect.addEventListener('change', aplicarFiltrosMultas);
    if (filtroStatusPagamentoMultaSelect) filtroStatusPagamentoMultaSelect.addEventListener('change', aplicarFiltrosMultas);

    if (corpoTabelaMultas) {
        corpoTabelaMultas.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-action');
            if (!targetButton) return;
            const multaId = targetButton.dataset.id;

            if (targetButton.classList.contains('btn-excluir-multa')) {
                if (confirm(`Tem certeza que deseja excluir esta multa (ID: ${multaId})?`)) {
                    showUserMessage(messageListaMultas, 'Excluindo multa...', 'info');
                    try {
                        const response = await fetch(`${API_BASE_URL}/multas/${multaId}`, { method: 'DELETE' });
                        const responseData = await response.json();
                        if (response.ok) {
                            showUserMessage(messageListaMultas, responseData.message || 'Multa excluída!', 'success');
                            aplicarFiltrosMultas(); 
                        } else { throw new Error(responseData.message || 'Erro ao excluir.'); }
                    } catch (error) { showUserMessage(messageListaMultas, error.message, 'error'); }
                }
            } else if (targetButton.classList.contains('btn-editar-multa')) {
                try {
                    showUserMessage(messageNovaMulta, 'Carregando dados da multa para edição...', 'info');
                    // Ajuste para buscar a multa específica, se a API suportar GET /api/multas/:id
                    // Por ora, vamos filtrar da lista já carregada ou recarregar se necessário
                    // O ideal é um endpoint GET /api/multas/:id
                    const response = await fetch(`${API_BASE_URL}/multas`); 
                    if(!response.ok) throw new Error("Falha ao buscar dados da multa para editar.");
                    const todasMultas = await response.json();
                    const multaParaEditar = todasMultas.find(m => m._id === multaId);

                    if (multaParaEditar) {
                        formCadastrarMulta.elements['veiculoId'].value = multaParaEditar.veiculoId;
                        formCadastrarMulta.elements['dataInfracao'].value = formatDateToInput(multaParaEditar.dataInfracao);
                        formCadastrarMulta.elements['descricao'].value = multaParaEditar.descricao;
                        formCadastrarMulta.elements['autorInfracao'].value = multaParaEditar.autorInfracao || ''; // Novo campo
                        formCadastrarMulta.elements['valor'].value = multaParaEditar.valor;
                        formCadastrarMulta.elements['dataVencimento'].value = formatDateToInput(multaParaEditar.dataVencimento);
                        formCadastrarMulta.elements['statusPagamento'].value = multaParaEditar.statusPagamento;
                        
                        dataPagamentoGroup.style.display = (multaParaEditar.statusPagamento === 'paga') ? 'block' : 'none';
                        if (multaParaEditar.statusPagamento === 'paga') {
                            formCadastrarMulta.elements['dataPagamento'].value = formatDateToInput(multaParaEditar.dataPagamento);
                        } else {
                            formCadastrarMulta.elements['dataPagamento'].value = '';
                        }
                        
                        editandoMultaId = multaId;
                        formCadastrarMulta.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Atualizar Multa';
                        document.querySelector('#formCadastrarMulta h2').textContent = 'Editar Multa';
                        multaVeiculoIdSelect.disabled = true; 
                        formCadastrarMulta.scrollIntoView({ behavior: 'smooth' });
                        showUserMessage(messageNovaMulta, 'Dados carregados. Edite e salve.', 'info');
                    } else {
                        showUserMessage(messageNovaMulta, 'Multa não encontrada para edição.', 'error');
                    }
                } catch (error) {
                     showUserMessage(messageNovaMulta, 'Erro ao carregar dados para edição.', 'error');
                }
            }
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) { try { const user = JSON.parse(storedUser); if (user && user.username && welcomeMessageEl) welcomeMessageEl.textContent = `Olá, ${user.username}!`; } catch (e) { console.error("Erro parse usuário:", e); } }
    if (logoutButton) { logoutButton.addEventListener('click', function() { localStorage.removeItem('gpx7User'); window.location.href = 'login.html'; }); }

    if (window.location.pathname.includes('multas.html')) {
        popularVeiculosNosSelects();
        aplicarFiltrosMultas(); 
        if (dataPagamentoGroup) dataPagamentoGroup.style.display = 'none'; 
    }
});
