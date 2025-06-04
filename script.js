// Espera o HTML da página ser completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // Pega referências aos elementos do HTML que vamos usar
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageElement = document.getElementById('message');

    // Adiciona um "ouvinte" para o evento de 'submit' (envio) do formulário
    loginForm.addEventListener('submit', function(event) {
        // 1. Impede o comportamento padrão do formulário (que seria recarregar a página)
        event.preventDefault();

        // 2. Pega os valores digitados pelo usuário nos campos
        const emailValue = emailInput.value;
        const passwordValue = passwordInput.value;

        // Limpa mensagens anteriores
        messageElement.textContent = '';
        messageElement.style.color = ''; // Reseta a cor

        // 3. Validação simples (só para exemplo inicial)
        if (emailValue === '' || passwordValue === '') {
            messageElement.textContent = 'Por favor, preencha todos os campos.';
            messageElement.style.color = 'red';
            return; // Para a execução aqui se os campos estiverem vazios
        }

        // 4. Mostra os valores no console do navegador (para teste)
        // Para ver o console: no navegador, clique com o botão direito na página -> Inspecionar -> Console
        console.log('Email/Usuário:', emailValue);
        console.log('Senha:', passwordValue);

        // 5. Mostra uma mensagem simples na página
        messageElement.textContent = 'Tentando fazer login... (verifique o console)';
        messageElement.style.color = 'blue';

        // Futuramente, aqui é onde faremos a chamada (fetch) para o backend
        // Exemplo:
        // fetch('URL_DO_SEU_BACKEND/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: emailValue, password: passwordValue })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.success) { // Supondo que seu backend retorne { success: true, ... }
        //         messageElement.textContent = 'Login bem-sucedido!';
        //         messageElement.style.color = 'green';
        //         // Redirecionar ou salvar token, etc.
        //     } else {
        //         messageElement.textContent = data.message || 'Falha no login.';
        //         messageElement.style.color = 'red';
        //     }
        // })
        // .catch(error => {
        //     console.error('Erro no login:', error);
        //     messageElement.textContent = 'Erro ao conectar com o servidor.';
        //     messageElement.style.color = 'red';
        // });
    });

});
