document.addEventListener('DOMContentLoaded', function() {

    const apiUrl = 'https://gpx-api-xwv1.onrender.com/api/customers';

    // --- LÓGICA PARA A PÁGINA DE CADASTRO (novo.html) ---
    const formNovoCliente = document.getElementById('form-novo-cliente');
    if (formNovoCliente) {
        formNovoCliente.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = formNovoCliente.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const customerData = {
                name: document.getElementById('nome').value,
                cnpj: document.getElementById('cnpj').value,
                phone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                observations: document.getElementById('observacoes').value
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData),
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Falha ao cadastrar cliente.');
                }
                alert('Cliente cadastrado com sucesso!');
                window.location.href = 'index.html'; // Redireciona para a lista
            } catch (error) {
                console.error('Erro no cadastro:', error);
                alert(`Erro ao cadastrar cliente: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Cliente';
            }
        });
    }

    // --- LÓGICA PARA A PÁGINA DE LISTAGEM (index.html) ---
    const customerListBody = document.getElementById('customer-list-body');
    if (customerListBody) {
        
        async function loadCustomers() {
            customerListBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando clientes...</td></tr>';
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('Não foi possível buscar os clientes da API.');
                }
                const result = await response.json();
                const customers = result.data.customers;

                customerListBody.innerHTML = '';

                if (customers.length === 0) {
                    customerListBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum cliente cadastrado ainda.</td></tr>';
                } else {
                    customers.forEach(customer => {
                        const row = `
                            <tr>
                                <td>${customer.name}</td>
                                <td>${customer.phone}</td>
                                <td>${customer.email || 'N/A'}</td>
                                <td>
                                    <button class="action-button" data-id="${customer._id}">Editar</button>
                                </td>
                            </tr>
                        `;
                        customerListBody.innerHTML += row;
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar clientes:', error);
                customerListBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">${error.message}</td></tr>`;
            }
        }
        
        loadCustomers();
    }
});
