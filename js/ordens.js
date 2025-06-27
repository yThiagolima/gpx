// Aguarda o HTML carregar completamente
document.addEventListener('DOMContentLoaded', function() {

    // --- Seleção de Elementos do HTML ---
    const form = document.getElementById('form-nova-os');
    const tipoServicoSelect = document.getElementById('tipo-servico');
    const camposImpressaoDiv = document.getElementById('campos-impressao');
    const resultCard = document.getElementById('os-result-card');
    const resultContent = document.getElementById('os-result-content');

    // --- Lógica para Mostrar/Esconder Campos ---
    // Quando o "Tipo de Serviço" muda, decidimos quais campos mostrar.
    tipoServicoSelect.addEventListener('change', function() {
        if (this.value === 'impressao') {
            camposImpressaoDiv.style.display = 'block';
        } else {
            // Se for 'recorte', esconde os campos de impressão
            camposImpressaoDiv.style.display = 'none';
        }
    });

    // --- Lógica Principal ao Enviar o Formulário ---
    form.addEventListener('submit', function(event) {
        // Impede que a página recarregue
        event.preventDefault(); 

        const tipoServico = tipoServicoSelect.value;
        let resultadoHTML = ''; // Variável para guardar o resultado

        // --- SE O SERVIÇO FOR IMPRESSÃO DIGITAL ---
        if (tipoServico === 'impressao') {
            const largura = parseFloat(document.getElementById('largura').value);
            const material = document.getElementById('material').value;

            // Validação: verifica se a largura foi preenchida
            if (isNaN(largura) || largura <= 0) {
                alert('Por favor, insira uma largura válida para o serviço de impressão.');
                return;
            }

            // 1. Lógica de Seleção da Máquina de IMPRESSÃO
            let maquina = '';
            if (largura <= 160) {
                maquina = 'Epson S40';
            } else if (largura <= 320) {
                maquina = 'Mimaki 320';
            } else {
                // Se a largura for muito grande, mostra um erro e para
                resultadoHTML = '<p style="color: red; font-weight: bold;">ERRO: A arte precisa ser dividida. A largura excede 320 cm.</p>';
                resultContent.innerHTML = resultadoHTML;
                resultCard.style.display = 'block'; // Mostra o card de resultado
                return;
            }

            // 2. Lógica de Sugestão de Bobina
            let bobinaSugerida = 'Não encontrada';
            const bobinasAdesivo = [106, 122, 127, 152];
            const bobinasLona = [90, 100, 140, 250, 320];
            const bobinasDisponiveis = (material === 'adesivo') ? bobinasAdesivo : bobinasLona;

            for (const bobina of bobinasDisponiveis) {
                if (largura <= bobina) {
                    bobinaSugerida = `${bobina} cm`;
                    break; // Para o loop na primeira bobina que couber
                }
            }
            
            // Monta o HTML com o resultado da análise de IMPRESSÃO
            resultadoHTML = `
                <ul>
                    <li><strong>Máquina Designada:</strong> ${maquina}</li>
                    <li><strong>Bobina Sugerida:</strong> ${bobinaSugerida}</li>
                </ul>
            `;
        
        // --- SE O SERVIÇO FOR RECORTE ELETRÔNICO ---
        } else if (tipoServico === 'recorte') {
            // Monta o HTML com o resultado da análise de RECORTE
            resultadoHTML = `
                <ul>
                    <li><strong>Máquina Designada:</strong> BunnerCUT (Recorte)</li>
                    <li><strong>Observação:</strong> Verifique as especificações do material a ser recortado.</li>
                </ul>
            `;
        }

        // --- Exibe o resultado final ---
        resultContent.innerHTML = resultadoHTML; // Coloca o resultado no card
        resultCard.style.display = 'block'; // Mostra o card de resultado
    });
});
