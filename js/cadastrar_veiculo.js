// frontend/js/cadastrar_veiculo.js
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formCadastrarVeiculo');
    const messageElement = document.getElementById('message'); // O <p id="message"> no seu HTML

    // Função auxiliar para exibir mensagens de feedback
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = 'message-feedback'; // Reseta classes
        if (type) {
            messageElement.classList.add(type); // Adiciona 'success', 'error', ou 'info'
        }
    }

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Impede o envio padrão do formulário
            showMessage('', 'info'); // Limpa mensagem anterior e mostra 'processando'

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                // Converte campos numéricos para número, se não vazios
                if (key === 'anoFabricacao' || key === 'anoModelo' || key === 'quilometragemAtual' || key === 'oleoKm' || key === 'frequenciaChecklist') {
                    data[key] = value ? parseInt(value, 10) : null;
                } else {
                    data[key] = value.trim() === '' ? null : value.trim(); // Define como null se vazio, senão faz trim
                }
            });

            // Validação básica no frontend (pode ser mais extensa)
            if (!data.placa || !data.marca || !data.modelo || !data.anoFabricacao || !data.anoModelo || data.quilometragemAtual === null) {
                showMessage('Por favor, preencha todos os campos obrigatórios (*).', 'error');
                return;
            }
            if (data.quilometragemAtual < 0) {
                showMessage('Quilometragem atual não pode ser negativa.', 'error');
                return;
            }
            // Adicione mais validações se necessário

            showMessage('Salvando veículo...', 'info');

            try {
                // URL do seu backend no Render para o endpoint de cadastrar veículos
                const backendUrl = 'https://gpx-api-xwv1.onrender.com/api/veiculos';
                
                // Futuramente, quando tivermos JWT, pegaremos o token e adicionaremos ao header
                // const token = localStorage.getItem('authToken');
                // const headers = {
                //     'Content-Type': 'application/json',
                //     'Authorization': `Bearer ${token}`
                // };

                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Adicionar header de Authorization quando tivermos JWT
                    },
                    body: JSON.stringify(data),
                });

                const responseData = await response.json();

                if (response.ok) { // Status 201 Created ou similar
                    showMessage(responseData.message || 'Veículo cadastrado com sucesso!', 'success');
                    form.reset(); // Limpa o formulário
                    // Opcional: Redirecionar para a lista de veículos ou dashboard
                    // setTimeout(() => {
                    //    window.location.href = 'veiculos.html'; // Quando esta página existir
                    // }, 2000);
                } else {
                    // Erros de validação do backend (400, 409) ou outros (500)
                    showMessage(responseData.message || `Erro ${response.status}: Não foi possível cadastrar o veículo.`, 'error');
                }

            } catch (error) {
                console.error('Erro ao tentar cadastrar veículo:', error);
                showMessage('Erro de conexão ao tentar cadastrar o veículo. Verifique sua internet ou tente novamente.', 'error');
            }
        });
    }

    // Para que o logout e welcome message no header funcionem nesta página também
    // (Esta parte é do dashboard.js, mas replicada aqui para simplicidade,
    // idealmente, você teria um script de 'auth' ou 'header' compartilhado)
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const storedUser = localStorage.getItem('gpx7User');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.username) {
                welcomeMessage.textContent = `Olá, ${user.username}!`;
            }
        } catch (e) { console.error("Erro ao parsear usuário do localStorage:", e); }
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('gpx7User');
            // localStorage.removeItem('authToken'); 
            window.location.href = 'login.html'; // Volta para o login
        });
    }
});
