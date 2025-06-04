// frontend/js/requisicoes.js
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api';

    // Formulário de Nova Requisição
    const formCadastrarRequisicao = document.getElementById('formCadastrarRequisicao');
    const messageNovaRequisicao = document.getElementById('messageNovaRequisicao');

    // Filtros da Lista de Requisições
    const searchRequisicoesInput = document.getElementById('searchRequisicoesInput');
    const filtroStatusRequisicaoSelect = document.getElementById('filtroStatusRequisicao');

    // Tabela e Mensagens da Lista
    const corpoTabelaRequisicoes = document.getElementById('corpoTabelaRequisicoes');
    const messageListaRequisicoes = document.getElementById('messageListaRequisicoes');

    // --- Funções Auxiliares ---
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
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute: '2-digit', timeZone: 'UTC' });
    }

    // --- Carregar e Exibir Requisições ---
    async function carregarRequisicoes(filtros = {}) {
        if (!corpoTabelaRequisicoes) return;
        corpoTabelaRequisicoes.innerHTML = `<tr><td colspan="6" class="text-center">Carregando requisições...</td></tr>`;
        
        const params = new URLSearchParams();
        if (filtros.status && filtros.status !== 'todas') {
            params.append('status', filtros.status);
        }
        if (filtros.search) {
            params.append('search', filtros.search);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/requisicoes?${params.toString()}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({message: `Erro ${response.status}`}));
                throw new Error(errData.message || 'Falha ao buscar requisições.');
            }
            const requisicoes = await response.json();

            corpoTabelaRequisicoes.innerHTML = ''; // Limpa a tabela
            if (requisicoes && requisicoes.length > 0) {
                requisicoes.forEach(req => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${req.idRequisicaoUsuario}</td>
                        <td>${req.entreguePara}</td>
                        <td>${formatDate(req.dataCriacao)}</td>
                        <td><span class="status-tag status-${req.status}">${req.status === 'disponivel' ? 'Disponível' : 'Utilizada'}</span></td>
                        <td>${req.abastecimentoIdAssociado ? `Abast. ID: ...${String(req.abastecimentoIdAssociado).slice(-6)}` : (req.status === 'utilizada' ? 'N/I' : '---')}</td>
                        <td class="action-buttons">
                            ${req.status === 'disponivel' ? 
                                `<button class="btn-action delete btn-excluir-requisicao" data-id="${req._id}" title="Excluir Requisição">
                                    <i class="fas fa-trash-alt"></i>
                                 </button>` : 
                                `<button class="btn-action view" title="Ver Detalhes (Em breve)" data-id="${req._id}" disabled><i class="fas fa-eye"></i></button>`
                            }
                        </td>
                    `;
                    corpoTabelaRequisicoes.appendChild(tr);
                });
            } else {
                corpoTabelaRequisicoes.innerHTML = `<tr><td colspan="6" class="text-center">Nenhuma requisição encontrada para os filtros aplicados.</td></tr>`;
            }
            if (messageListaRequisicoes) showUserMessage(messageListaRequisicoes, '', ''); // Limpa mensagem anterior

        } catch (error) {
            console.error("Erro ao carregar requisições:", error);
            corpoTabelaRequisicoes.innerHTML = `<tr><td colspan="6" class="text-center error-message">Erro ao carregar requisições: ${error.message}</td></tr>`;
            if (messageListaRequisicoes) showUserMessage(messageListaRequisicoes, `Erro: ${error.message}`, 'error');
        }
    }

    // --- Cadastro de Nova Requisição ---
    if (formCadastrarRequisicao) {
        formCadastrarRequisicao.addEventListener('submit', async function(event) {
            event.preventDefault();
            const idRequisicaoInput = document.getElementById('requisicaoIdInput');
            const entregueParaInput = document.getElementById('entregueParaInput');

            const requisicaoId = idRequisicaoInput.value.trim();
            const entreguePara = entregueParaInput.value.trim();

            if (!requisicaoId || !entreguePara) {
                showUserMessage(messageNovaRequisicao, "Por favor, preencha o ID da Requisição e para quem foi entregue.", 'error');
                return;
            }

            showUserMessage(messageNovaRequisicao, "Salvando requisição...", 'info');

            try {
                const response = await fetch(`${API_BASE_URL}/requisicoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requisicaoId, entreguePara }) // Envia o nome do campo como 'requisicaoId'
                });
                const responseData = await response.json();

                if (response.ok) {
                    showUserMessage(messageNovaRequisicao, responseData.message || "Requisição cadastrada com sucesso!", 'success');
                    this.reset(); // Limpa o formulário
                    carregarRequisicoes({ // Recarrega a lista com os filtros atuais
                        status: filtroStatusRequisicaoSelect.value,
                        search: searchRequisicoesInput.value
                    }); 
                } else {
                    showUserMessage(messageNovaRequisicao, responseData.message || `Erro ${response.status}: Não foi possível salvar.`, 'error');
                }
            } catch (error) {
                console.error("Erro ao cadastrar requisição:", error);
                showUserMessage(messageNovaRequisicao, "Erro de conexão ao tentar salvar a requisição.", 'error');
            }
        });
    }

    // --- Filtros da Lista de Requisições ---
    function aplicarFiltrosRequisicoes() {
        const status = filtroStatusRequisicaoSelect ? filtroStatusRequisicaoSelect.value : 'todas';
        const searchTerm = searchRequisicoesInput ? searchRequisicoesInput.value.trim() : '';
        carregarRequisicoes({ status: status, search: searchTerm });
    }

    if (searchRequisicoesInput) {
        let searchTimeout;
        searchRequisicoesInput.addEventListener('keyup', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(aplicarFiltrosRequisicoes, 500);
        });
    }
    if (filtroStatusRequisicaoSelect) {
        filtroStatusRequisicaoSelect.addEventListener('change', aplicarFiltrosRequisicoes);
    }

    // --- Excluir Requisição ---
    if (corpoTabelaRequisicoes) {
        corpoTabelaRequisicoes.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('button.btn-excluir-requisicao');
            if (!targetButton) return;

            const requisicaoMongoId = targetButton.dataset.id;
            const idUsuarioRequisicao = targetButton.closest('tr').querySelector('td:first-child').textContent;

            if (confirm(`Tem certeza que deseja excluir a Requisição ID "${idUsuarioRequisicao}"? Esta ação não pode ser desfeita se ela não foi utilizada.`)) {
                showUserMessage(messageListaRequisicoes, "Excluindo requisição...", 'info');
                try {
                    const response = await fetch(`${API_BASE_URL}/requisicoes/${requisicaoMongoId}`, {
                        method: 'DELETE'
                    });
                    const responseData = await response.json();
                    if (response.ok) {
                        showUserMessage(messageListaRequisicoes, responseData.message || "Requisição excluída com sucesso!", 'success');
                        aplicarFiltrosRequisicoes(); // Recarrega a lista
                    } else {
                        throw new Error(responseData.message || `Erro ${response.status} ao excluir.`);
                    }
                } catch (error) {
                    console.error("Erro ao excluir requisição:", error);
                    showUserMessage(messageListaRequisicoes, error.message || "Falha ao excluir requisição.", 'error');
                }
            }
        });
    }
    

    // --- Lógica de Logout e Welcome Message (Reutilizada) ---
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username && welcomeMessageEl) {
                welcomeMessageEl.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) { console.error("Erro ao parsear usuário do localStorage:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            window.location.href = 'login.html'; 
        });
    }

    // --- Inicialização da Página ---
    if (window.location.pathname.includes('requisicoes.html')) {
        carregarRequisicoes({ status: 'todas' }); // Carrega todas as requisições inicialmente
    }
});
