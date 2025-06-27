document.addEventListener('DOMContentLoaded', function() {

    const formNovoCliente = document.getElementById('form-novo-cliente');
    
    // Verifica se o formulário de novo cliente existe na página atual
    if (formNovoCliente) {
        
        // Adiciona o listener para o envio do formulário, agora com 'async' para esperar a resposta da API
        formNovoCliente.addEventListener('submit', async function(event) {
            
            // Impede o recarregamento padrão da página
            event.preventDefault(); 

            // Pega o botão de submit para desabilitá-lo durante o envio
            const submitButton = formNovoCliente.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            // 1. Pega os dados digitados nos campos do formulário
            const customerData = {
                name: document.getElementById('nome').value,
                cnpj: document.getElementById('cnpj').value,
                phone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                observations: document.getElementById('observacoes').value
            };

            // 2. Define a URL da sua API no Render
            const apiUrl = 'https://gpx-api-xwv1.onrender.com/api/customers';

            try {
                // 3. Faz a requisição para a API usando fetch
                const response = await fetch(apiUrl, {
                    method: 'POST', // Método para criar um novo recurso
                    headers: {
                        'Content-Type': 'application/json', // Informa que estamos enviando dados em formato JSON
                    },
                    body: JSON.stringify(customerData), // Converte o objeto JavaScript em texto JSON
                });

                // Pega a resposta da API
                const result = await response.json();

                // 4. Verifica se a API respondeu com sucesso
                if (!response.ok) {
                    // Se a API retornou um erro, lança uma exceção com a mensagem de erro
                    throw new Error(result.message || 'Falha ao cadastrar cliente.');
                }

                // 5. Se deu tudo certo
                alert('Cliente cadastrado com sucesso!');
                formNovoCliente.reset(); // Limpa o formulário
                window.location.href = 'index.html'; // Redireciona para a lista de clientes

            } catch (error) {
                // 6. Se ocorreu qualquer erro na comunicação ou na API
                console.error('Erro no cadastro:', error);
                alert(`Erro ao cadastrar cliente: ${error.message}`);
            
            } finally {
                // 7. Reabilita o botão, independentemente do resultado
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Cliente';
            }
        });
    }
});
