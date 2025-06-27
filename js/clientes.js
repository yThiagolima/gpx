// Este código só vai rodar depois que todo o HTML da página for carregado.
document.addEventListener('DOMContentLoaded', function() {

    // Procuramos pelo formulário de novo cliente na página.
    // O 'if' garante que o código só tente rodar se o formulário existir na página atual.
    const formNovoCliente = document.getElementById('form-novo-cliente');
    
    if (formNovoCliente) {
        // Adicionamos um "escutador" para o evento de 'submit' (envio) do formulário.
        formNovoCliente.addEventListener('submit', function(event) {
            
            // 1. A LINHA MAIS IMPORTANTE: Impede o comportamento padrão de recarregar a página.
            event.preventDefault(); 

            // 2. Pega os dados digitados nos campos do formulário.
            const nome = document.getElementById('nome').value;
            const cnpj = document.getElementById('cnpj').value;
            const telefone = document.getElementById('telefone').value;
            const email = document.getElementById('email').value;
            const observacoes = document.getElementById('observacoes').value;

            // 3. Mostra um alerta para confirmar que o botão funcionou e não recarregou.
            alert('Cliente salvo (simulação)! O JavaScript impediu a página de recarregar.');

            // 4. (Futuro) Aqui é onde chamaríamos a API para salvar os dados de verdade.
            console.log('Dados prontos para enviar:', { nome, cnpj, telefone, email, observacoes });
        });
    }

});
