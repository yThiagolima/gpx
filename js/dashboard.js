// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // Elementos da dashboard para dados dinâmicos (IDs do seu dashboard.html)
    const totalVeiculosDataEl = document.getElementById('totalVeiculosData');
    const alertasAtivosDataEl = document.getElementById('alertasAtivosData');
    const manutencoesAgendadasDataEl = document.getElementById('manutencoesAgendadasData');
    const listaAtividadeRecenteEl = document.getElementById('listaAtividadeRecente');

    // Widgets clicáveis - Seleciona o elemento .widget pai
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
        // Em um app real, poderia redirecionar para login aqui se !currentUser e estiver numa página protegida
        // if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        //     window.location.href = 'login.html';
        // }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            // localStorage.removeItem('authToken'); // Futuramente para JWT
            window.location.href = 'login.html';
        });
    }

    async function carregarDadosDashboard() {
        // Headers para autenticação (exemplo futuro com JWT)
        // const token = localStorage.getItem('authToken');
        // const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Buscar estatísticas
            const responseStats = await fetch(`${API_BASE_URL}/stats` /*, { headers } */);
            if (responseStats.ok) {
                const stats = await responseStats.json();
                if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = stats.totalVeiculos !== undefined ? stats.totalVeiculos : '--';
                if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = stats.alertasAtivos !== undefined ? stats.alertasAtivos : '--';
                if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = stats.manutencoesAgendadas !== undefined ? stats.manutencoesAgendadas : '--';
            } else {
                console.error("Erro ao buscar estatísticas:", responseStats.status, await responseStats.text());
                if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = 'Erro';
                if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = 'Erro';
                if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = 'Erro';
            }

            // 2. Buscar atividade recente
            const responseActivity = await fetch(`${API_BASE_URL}/recent-activity` /*, { headers } */);
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
                                day: '2-digit', month: 'short', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit', 
                                timeZone: 'UTC' // Para consistência na exibição da data/hora armazenada
                            });

                            li.innerHTML = `<i class="fas ${iconClass}" title="${item.tipo ? item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1) : ''}"></i> ${item.descricao} - <strong>${dataFormatada}</strong>`;
                            listaAtividadeRecenteEl.appendChild(li);
                        });
                    } else {
                        listaAtividadeRecenteEl.innerHTML = '<li>Nenhuma atividade recente para mostrar.</li>';
                    }
                }
            } else {
                console.error("Erro ao buscar atividades recentes:", responseActivity.status, await responseActivity.text());
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
        widgetTotalVeiculos.setAttribute('title', 'Clique para ver todos os veículos');
        widgetTotalVeiculos.addEventListener('click', () => {
            window.location.href = 'veiculos.html';
        });
    }
    if (widgetAlertasAtivos) {
        widgetAlertasAtivos.style.cursor = 'pointer';
        widgetAlertasAtivos.setAttribute('title', 'Clique para ver detalhes dos alertas e manutenções');
        widgetAlertasAtivos.addEventListener('click', () => {
            window.location.href = 'manutencao.html'; 
        });
    }
    if (widgetManutencoesAgendadas) {
        widgetManutencoesAgendadas.style.cursor = 'pointer';
        widgetManutencoesAgendadas.setAttribute('title', 'Clique para ver detalhes das manutenções agendadas');
        widgetManutencoesAgendadas.addEventListener('click', () => {
            window.location.href = 'manutencao.html'; 
        });
    }

    // Verifica se estamos na página do dashboard antes de carregar os dados específicos dela
    // O ID 'mainContent' é específico do main da dashboard.html
    const mainContentDashboard = document.getElementById('mainContent'); 

    if (mainContentDashboard) { // Só executa se estiver na dashboard.html
        if (currentUser) {
            carregarDadosDashboard();
        } else {
            // Se não tem usuário e tentou acessar a dashboard, limpa placeholders ou redireciona
            if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = '--';
            if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = '--';
            if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = '--';
            if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Acesso não autorizado ou dados indisponíveis. Faça o login.</li>';
            // Idealmente, um sistema de rotas protegidas faria o redirecionamento antes mesmo de carregar a página.
            // window.location.href = 'login.html'; 
        }
    }
});
