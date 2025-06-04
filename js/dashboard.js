// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // Elementos da dashboard para dados dinâmicos (IDs do seu dashboard.html)
    const totalVeiculosDataEl = document.getElementById('totalVeiculosData');
    const alertasAtivosDataEl = document.getElementById('alertasAtivosData');
    const manutencoesAgendadasDataEl = document.getElementById('manutencoesAgendadasData');
    const listaAtividadeRecenteEl = document.getElementById('listaAtividadeRecente');

    // URL base da sua API no Render (ajuste se o nome do serviço for diferente)
    const API_BASE_URL = 'https://gpx-api-xwv1.onrender.com/api/dashboard';

    let currentUser = null;
    const storedUser = localStorage.getItem('gpx7User'); // Chave usada no login.js

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser && currentUser.username) {
                welcomeMessage.textContent = `Olá, ${currentUser.username}!`;
            } else {
                 welcomeMessage.textContent = `Olá!`; // Fallback
            }
        } catch (e) {
            console.error("Erro ao parsear dados do usuário do localStorage:", e);
            welcomeMessage.textContent = `Olá!`; // Fallback em caso de erro
        }
    } else {
        // Se não há usuário no localStorage, idealmente redirecionar para login.
        // A proteção real virá com tokens JWT verificados no backend e um check mais robusto aqui.
        console.warn("Nenhum usuário no localStorage. Acesso à dashboard não autenticado (simulação).");
        // Para forçar o redirecionamento em um ambiente de produção real sem token:
        // if (window.location.pathname.includes('dashboard.html')) { // Evita loop se já estiver no login
        //     window.location.href = 'login.html';
        // }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User'); // Remove os dados do usuário
            // localStorage.removeItem('authToken'); // Quando implementarmos JWT, removeremos o token
            window.location.href = 'login.html'; // Redireciona para a página de login
        });
    }

    // Função para buscar e preencher dados da dashboard
    async function carregarDadosDashboard() {
        // Futuramente, com JWT, enviaríamos o token no header:
        // const token = localStorage.getItem('authToken');
        // if (!token) {
        //     console.log("Token não encontrado, redirecionando para login.");
        //     if (window.location.pathname.includes('dashboard.html')) window.location.href = 'login.html';
        //     return;
        // }
        // const headers = { 
        //     'Authorization': `Bearer ${token}`, 
        //     'Content-Type': 'application/json' 
        // };
        
        // Como nosso backend por enquanto tem um simpleAuthCheck que não valida token,
        // não precisamos enviar o header de Authorization ainda.

        try {
            // 1. Buscar estatísticas
            const responseStats = await fetch(`${API_BASE_URL}/stats` /*, { headers } */); // Adicionar headers quando tiver token
            if (responseStats.ok) {
                const stats = await responseStats.json();
                if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = stats.totalVeiculos !== undefined ? stats.totalVeiculos : '--';
                if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = stats.alertasAtivos !== undefined ? stats.alertasAtivos : '--';
                if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = stats.manutencoesAgendadas !== undefined ? stats.manutencoesAgendadas : '--';
            } else {
                console.error("Erro ao buscar estatísticas da dashboard:", responseStats.status, await responseStats.text());
                throw new Error(`Falha ao buscar estatísticas (${responseStats.status})`);
            }

            // 2. Buscar atividade recente
            const responseActivity = await fetch(`${API_BASE_URL}/recent-activity` /*, { headers } */); // Adicionar headers quando tiver token
            if (responseActivity.ok) {
                const activities = await responseActivity.json();
                if (listaAtividadeRecenteEl) {
                    listaAtividadeRecenteEl.innerHTML = ''; // Limpa o placeholder "Nenhuma atividade..."
                    if (activities && activities.length > 0) {
                        activities.forEach(item => {
                            const li = document.createElement('li');
                            let iconClass = 'fa-info-circle'; // Ícone padrão
                            if (item.tipo === 'abastecimento') iconClass = 'fa-gas-pump';
                            else if (item.tipo === 'manutencao') iconClass = 'fa-tools';
                            else if (item.tipo === 'multa') iconClass = 'fa-file-invoice-dollar';
                            else if (item.tipo === 'checklist') iconClass = 'fa-clipboard-check';

                            // Formata a data para dd/MMM/yyyy
                            const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });

                            li.innerHTML = `<i class="fas ${iconClass}"></i> ${item.descricao} - <strong>${dataFormatada}</strong>`;
                            listaAtividadeRecenteEl.appendChild(li);
                        });
                    } else {
                        listaAtividadeRecenteEl.innerHTML = '<li>Nenhuma atividade recente para mostrar.</li>';
                    }
                }
            } else {
                console.error("Erro ao buscar atividades recentes:", responseActivity.status, await responseActivity.text());
                throw new Error(`Falha ao buscar atividades (${responseActivity.status})`);
            }

        } catch (error) {
            console.error("Erro geral ao carregar dados da dashboard:", error);
            // Define um estado de erro para os elementos da UI se a API falhar
            if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = 'Erro';
            if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = 'Erro';
            if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = 'Erro';
            if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Erro ao carregar atividades recentes.</li>';
        }
    }

    // Só executa o carregamento dos dados se estivermos na página da dashboard
    // e se houver um usuário "logado" (simulado pelo localStorage)
    if (window.location.pathname.includes('dashboard.html') && currentUser) {
        carregarDadosDashboard();
    } else if (window.location.pathname.includes('dashboard.html') && !currentUser) {
        // Se não tem usuário e tentou acessar a dashboard, pode ser bom limpar os placeholders
        if(totalVeiculosDataEl) totalVeiculosDataEl.textContent = '--';
        if(alertasAtivosDataEl) alertasAtivosDataEl.textContent = '--';
        if(manutencoesAgendadasDataEl) manutencoesAgendadasDataEl.textContent = '--';
        if(listaAtividadeRecenteEl) listaAtividadeRecenteEl.innerHTML = '<li>Acesso não autorizado ou dados indisponíveis.</li>';
        // E aqui você poderia forçar o redirecionamento se desejado (descomentando a linha acima)
    }
});
