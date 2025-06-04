document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const emailValue = emailInput.value;
        const passwordValue = passwordInput.value;

        messageElement.textContent = '';
        messageElement.style.color = '';

        if (emailValue === '' || passwordValue === '') {
            messageElement.textContent = 'Por favor, preencha todos os campos.';
            messageElement.style.color = 'red';
            return;
        }

        messageElement.textContent = 'Processando login...';
        messageElement.style.color = 'blue';

        try {
            // !!! SUBSTITUA PELA SUA URL DO RENDER !!!
            const backendUrl = 'https://SUA_URL_DO_BACKEND_NO_RENDER.onrender.com/login';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailValue, password: passwordValue }),
            });

            const data = await response.json();

            if (response.ok) {
                messageElement.textContent = data.message + (data.user ? ` Bem-vindo, ${data.user.name}!` : '');
                messageElement.style.color = 'green';
                console.log('Dados do usuário (simulado):', data.user);
                // Futuramente:
                // - Salvar o token (data.token) no localStorage
                // - Redirecionar para uma página de dashboard: window.location.href = '/dashboard.html';
            } else {
                messageElement.textContent = data.message || 'Falha no login. Verifique suas credenciais.';
                messageElement.style.color = 'red';
            }

        } catch (error) {
            console.error('Erro ao tentar fazer login:', error);
            messageElement.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
            messageElement.style.color = 'red';
        }
    });
});
