// frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // --- ATENÇÃO: ESTA PARTE DE PEGAR O USUÁRIO É SIMULADA ---
    // Em um sistema real, você pegaria o nome do usuário de um token JWT salvo, por exemplo.
    // Por enquanto, vamos deixar uma mensagem genérica ou tentar pegar do localStorage se o login.js salvar lá.
    
    // Exemplo SIMPLES de como o login.js poderia salvar (ADICIONE ISSO NO SUCESSO DO LOGIN EM login.js):
    // if (response.ok) {
    //     ...
    //     localStorage.setItem('gpx7User', JSON.stringify(data.user)); // Salva dados do usuário
    //     window.location.href = 'dashboard.html';
    // }

    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username) {
                welcomeMessage.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) {
            console.error("Erro ao parsear dados do usuário:", e);
            // Mantém "Olá, Usuário!" se houver erro
        }
    }
    // Se não houver storedUser, a mensagem padrão "Olá, Usuário!" do HTML será usada.


    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Limpar qualquer informação de login salva (ex: token JWT ou dados do usuário)
            localStorage.removeItem('gpx7User'); // Exemplo de limpeza
            // localStorage.removeItem('authToken'); // Se você usar token

            // Redirecionar para a página de login
            window.location.href = 'login.html';
            // Poderia também chamar um endpoint de logout no backend se necessário
        });
    }

    // --- FIM DA SIMULAÇÃO ---

    // Lógica para proteger a página (MUITO BÁSICO - será melhorado com JWT)
    // Se não tiver um usuário salvo (simulando não estar logado), redireciona para login
    // Isso é uma proteção fraca, pois pode ser contornada no lado do cliente.
    // A proteção real virá com verificação de token no carregamento da página e no backend.
    // if (!localStorage.getItem('gpx7User')) { // Se usar token, seria !localStorage.getItem('authToken')
    //     console.log("Nenhum usuário logado (simulado), redirecionando para login...");
    //     // window.location.href = 'login.html';
    // }
});