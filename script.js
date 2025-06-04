document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    // Substitua 'URL_DO_SEU_BACKEND_NO_RENDER' pela URL real da sua API no Render
    const backendUrl = 'URL_DO_SEU_BACKEND_NO_RENDER/login'; // Ex: https://seu-app.onrender.com/login

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = 'Login bem-sucedido! Redirecionando...';
            messageElement.style.color = 'green';
            // Exemplo: Salvar token e redirecionar
            // localStorage.setItem('authToken', data.token);
            // window.location.href = '/dashboard.html'; // Ou outra página
        } else {
            messageElement.textContent = data.message || 'Erro no login.';
            messageElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Erro ao tentar fazer login:', error);
        messageElement.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
        messageElement.style.color = 'red';
    }
});