// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // Elementos da dashboard para dados dinâmicos (IDs do seu dashboard.html)
    const totalVeiculosDataEl = document.getElementById('totalVeiculosData');
    const alertasAtivosDataEl = document.getElementById('alertasAtivosData');
    const manutencoesAgendadasDataEl = document.getElementById('manutencoesAgendadasData');
    const listaAtividadeRecenteEl = document.getElementById('listaAtividadeRecente');

    // Widgets clicáveis
    const widgetTotalVeiculos = totalVeiculosDataEl ? totalVeiculosDataEl.closest('.widget') : null;
    const widgetAlertasAtivos = alertasAtivosDataEl ? alertasAtivosDataEl.closest('.widget') : null;
    const widgetManutencoesAgendadas = manutencoesAgendadasDataEl ? manutencoesAgendadasDataEl.closest('.widget') : null;


    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api/dashboard'; 

    let currentUser = null;
    const storedUser = localStorage.getItem('gpx7User');

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser && currentUser.username) {
                if (welcomeMessage) welcomeMessage.textContent = `Olá, ${currentUser.username}!`;
            } else {
                if (welcomeMessage) welcomeMessage.textContent = `Olá!`;
            }
        } catch (e) {
            console.error("Erro ao parsear dados do usuário:", e);
            if (welcomeMessage) welcomeMessage.textContent = `Olá!`;
        }
    } else {
        // console.warn("Nenhum usuário no localStorage.");
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            window.location.href = 'login.html';
        });
    }

    async function carregarDadosDashboard() {
        try {
            // 1. Buscar estatísticas
            const responseStats = await fetch(`${API_BASE_URL}/stats`);
            if (responseStats.ok) {
                const stats = await responseStats.json();
                if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = stats.totalVeiculos !== undefined ? stats.totalVeiculos : '--';
                if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = stats.alertasAtivos !== undefined ? stats.alertasAtivos : '--';
                if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = stats.manutencoesAgendadas !== undefined ? stats.manutencoesAgendadas : '--';
            } else {
                console.error("Erro ao buscar estatísticas:", responseStats.status);
                if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = 'Erro';
                if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = 'Erro';
                if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = 'Erro';
            }

            // 2. Buscar atividade recente
            const responseActivity = await fetch(`${API_BASE_URL}/recent-activity`);
            if (responseActivity.ok) {
                const activities = await responseActivity.json();
                if (listaAtividadeRecenteEl) {
                    listaAtividadeRecenteEl.innerHTML = ''; 
                    if (activities && activities.length > 0) {
                        activities.forEach(item => {
                            const li = document.createElement('li');
                            let iconClass = 'fa-info-circle'; 
                            if (item.tipo === 'abastecimento') iconClass = 'fa-gas-pump';
                            else if (item.tipo === 'manutencao') iconClass = 'fa-tools';
                            else if (item.tipo === 'multa') iconClass = 'fa-file-invoice-dollar'; 
                            else if (item.tipo === 'checklist') iconClass = 'fa-clipboard-check';

                            const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                            });

                            li.innerHTML = `<i class="fas ${iconClass}" title="${item.tipo ? item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1) : ''}"></i> ${item.descricao} - <strong>${dataFormatada}</strong>`;
                            listaAtividadeRecenteEl.appendChild(li);
                        });
                    } else {
                        listaAtividadeRecenteEl.innerHTML = '<li>Nenhuma atividade recente para mostrar.</li>';
                    }
                }
            } else {
                console.error("Erro ao buscar atividades recentes:", responseActivity.status);
                if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Erro ao carregar atividades.</li>';
            }

        } catch (error) {
            console.error("Erro geral ao carregar dados da dashboard:", error);
            if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = 'Falha';
            if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = 'Falha';
            if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = 'Falha';
            if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Falha ao carregar atividades recentes.</li>';
        }
    }

    // Tornar widgets clicáveis
    if (widgetTotalVeiculos) {
        widgetTotalVeiculos.style.cursor = 'pointer';
        widgetTotalVeiculos.addEventListener('click', () => {
            window.location.href = 'veiculos.html';
        });
    }
    if (widgetAlertasAtivos) {
        widgetAlertasAtivos.style.cursor = 'pointer';
        widgetAlertasAtivos.addEventListener('click', () => {
            window.location.href = 'manutencao.html'; // Página onde os alertas são detalhados
        });
    }
    if (widgetManutencoesAgendadas) {
        widgetManutencoesAgendadas.style.cursor = 'pointer';
        widgetManutencoesAgendadas.addEventListener('click', () => {
            window.location.href = 'manutencao.html'; // Página onde as manutenções são detalhadas
        });
    }


    // Só executa o carregamento dos dados se estivermos na página da dashboard
    // e se houver um usuário "logado" (simulado pelo localStorage)
    if (document.getElementById('mainContent') && currentUser) { // Verifica se 'mainContent' (ID do main da dashboard) existe
        carregarDadosDashboard();
    } else if (document.getElementById('mainContent') && !currentUser) {
        // Se não tem usuário e tentou acessar a dashboard, pode ser bom limpar os placeholders
        if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = '--';
        if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = '--';
        if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = '--';
        if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Acesso não autorizado ou dados indisponíveis.</li>';
        // E aqui você poderia forçar o redirecionamento se desejado
        // window.location.href = 'login.html'; 
    }
});
