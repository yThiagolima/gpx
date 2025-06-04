document.addEventListener('DOMContentLoaded', function() {

    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const emailValue = emailInput.value;
        const passwordValue = passwordInput.value;

        messageElement.textContent = '';
        messageElement.style.color = '';

        if (emailValue === '' || passwordValue === '') {
            messageElement.textContent = 'Por favor, preencha email e senha.';
            messageElement.style.color = 'red';
            return;
        }
        if (passwordValue.length < 6) {
            messageElement.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            messageElement.style.color = 'red';
            return;
        }

        messageElement.textContent = 'Registrando...';
        messageElement.style.color = 'blue';

        try {
            // !!! COLOQUE A URL CORRETA DO SEU BACKEND NO RENDER AQUI !!!
            const backendRegisterUrl = 'https://gpx-api-xwv1.onrender.com/register'; 

            const response = await fetch(backendRegisterUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailValue, password: passwordValue }),
            });

            const data = await response.json();

            if (response.ok) { 
                messageElement.textContent = data.message + " Você já pode fazer login.";
                messageElement.style.color = 'green';
                registerForm.reset(); 
            } else { 
                messageElement.textContent = data.message || `Erro ${response.status}: Não foi possível registrar.`;
                messageElement.style.color = 'red';
            }

        } catch (error) {
            console.error('Erro ao tentar registrar:', error);
            messageElement.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
            messageElement.style.color = 'red';
        }
    });
});
