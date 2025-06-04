// frontend/js/register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');

    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type); // Adiciona 'success', 'error', ou 'info'
        }
    }

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        showMessage('', 'info'); // Limpa mensagem anterior

        const usernameValue = usernameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value; // Senha não faz trim

        if (!usernameValue || !emailValue || !passwordValue) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        if (usernameValue.length < 3) {
            showMessage('Nome de usuário deve ter pelo menos 3 caracteres.', 'error');
            return;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(usernameValue)) {
            showMessage('Nome de usuário inválido (use letras, números, _, ., -).', 'error');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(emailValue)) {
            showMessage('Formato de email inválido.', 'error');
            return;
        }
        if (passwordValue.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        showMessage('Registrando...', 'info');

        try {
            const backendRegisterUrl = 'https://gpx-api-xwv1.onrender.com/register'; 

            const response = await fetch(backendRegisterUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: usernameValue, 
                    email: emailValue, 
                    password: passwordValue 
                }),
            });

            const data = await response.json();

            if (response.ok) { 
                showMessage(data.message + " Você será redirecionado para o login.", 'success');
                registerForm.reset(); 
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else { 
                showMessage(data.message || `Erro ${response.status}: Não foi possível registrar.`, 'error');
            }

        } catch (error) {
            console.error('Erro ao tentar registrar:', error);
            showMessage('Erro de conexão ao tentar registrar. Tente novamente.', 'error');
        }
    });
});