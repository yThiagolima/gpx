// frontend/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginIdentifierInput = document.getElementById('loginIdentifier');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');

    // Função auxiliar para exibir mensagens de feedback na tela
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes anteriores
        if (type) {
            messageElement.classList.add(type); // Adiciona 'success', 'error', ou 'info'
        }
    }

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário
        showMessage('', 'info'); // Limpa mensagem anterior e define como 'info' (pode ser útil para 'carregando')

        const loginIdentifierValue = loginIdentifierInput.value.trim(); // Pega o valor e remove espaços extras
        const passwordValue = passwordInput.value; // Senha não precisa de trim

        // Validação básica no frontend
        if (!loginIdentifierValue || !passwordValue) {
            showMessage('Por favor, preencha usuário/email e senha.', 'error');
            return;
        }

        showMessage('Entrando...', 'info'); // Feedback para o usuário

        try {
            // URL do seu backend no Render para o endpoint de login
            const backendLoginUrl = 'https://gpx-api-xwv1.onrender.com/login';

            const response = await fetch(backendLoginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loginIdentifier: loginIdentifierValue,
                    password: passwordValue
                }),
            });

            const data = await response.json(); // Tenta parsear a resposta como JSON

            if (response.ok) { // Se o status HTTP for 2xx (ex: 200 OK)
                showMessage(data.message || 'Login bem-sucedido!', 'success');
                // console.log('Usuário logado:', data.user); 
                
                // Salva dados do usuário no localStorage para usar na dashboard (exemplo)
                if (data.user) {
                    localStorage.setItem('gpx7User', JSON.stringify(data.user));
                }
                
                // Redireciona para a dashboard após um curto intervalo
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; // Assume que dashboard.html está na mesma pasta html/
                }, 1500); // Aguarda 1.5 segundos antes de redirecionar

            } else { // Se o status HTTP for de erro (4xx, 5xx)
                showMessage(data.message || `Erro ${response.status}: Falha no login.`, 'error');
            }

        } catch (error) {
            // Erro de rede ou se o backend estiver offline, ou se a resposta não for JSON válido
            console.error('Erro ao tentar fazer login:', error);
            showMessage('Erro de conexão ao tentar fazer login. Verifique sua internet ou tente novamente mais tarde.', 'error');
        }
    });
});