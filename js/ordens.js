document.addEventListener('DOMContentLoaded', function() {

    // --- Mapeamento das máquinas e suas capacidades ---
    const maquinasInfo = {
        epson: { nome: 'Epson S40', boca: 160 },
        mimaki: { nome: 'Mimaki 320', boca: 320 },
        bunnercut: { nome: 'BunnerCUT (Recorte)', boca: 120 } // Exemplo de boca para a cutter
    };

    // --- Elementos do HTML ---
    const form = document.getElementById('form-nova-os');
    const resultCard = document.getElementById('os-result-card');
    const resultContent = document.getElementById('os-result-content');

    // --- Lógica Principal ao Enviar o Formulário ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Esconde o resultado anterior para uma nova análise
        resultCard.style.display = 'none';
        resultContent.innerHTML = '';

        // --- Pega os valores do formulário ---
        const material = document.getElementById('material').value;
        const maquinaKey = document.getElementById('maquina').value;
        const largura = parseFloat(document.getElementById('largura').value);
        const maquinaSelecionada = maquinasInfo[maquinaKey];

        // Validação básica
        if (isNaN(largura) || largura <= 0) {
            alert('Por favor, insira uma largura válida.');
            return;
        }

        // --- LÓGICA DE VALIDAÇÃO E CONFIRMAÇÃO ---

        // CASO 1: Lona maior que a maior máquina (320cm), precisa de EMENDA.
        if (material === 'lona' && largura > 320) {
            const ok = confirm("AVISO: A lona excede 320cm e precisará de EMENDA para atingir a largura desejada. Deseja continuar e gerar a OS mesmo assim?");
            if (!ok) return; // Se o usuário clicar em "Cancelar", para a execução.
        }

        // CASO 2: A arte é maior que a boca da máquina selecionada.
        else if (largura > maquinaSelecionada.boca) {
            // CASO 2.1: Se for adesivo, podemos dividir em "folhas".
            if (material === 'adesivo') {
                const ok = confirm(`AVISO: A arte (${largura}cm) é maior que a boca da ${maquinaSelecionada.nome} (${maquinaSelecionada.boca}cm).\n\nO adesivo será dividido em folhas. Deseja continuar?`);
                if (!ok) return;
            } else {
            // CASO 2.2: Se for qualquer outra coisa (lona), é um erro.
                alert(`ERRO: A lona (${largura}cm) não cabe na ${maquinaSelecionada.nome} (${maquinaSelecionada.boca}cm) e não pode ser dividida.\n\nPor favor, escolha uma máquina maior ou ajuste a arte.`);
                return;
            }
        }
        
        // Se todas as validações e confirmações passaram, continuamos...

        // --- Lógica de Sugestão de Bobina ---
        let bobinaSugerida = 'N/A';
        if (maquinaKey !== 'bunnercut') { // Bobinas não se aplicam à cutter
            const bobinasAdesivo = [106, 122, 127, 152];
            const bobinasLona = [90, 100, 140, 250, 320];
            const bobinasDisponiveis = (material === 'adesivo') ? bobinasAdesivo : bobinasLona;

            for (const bobina of bobinasDisponiveis) {
                if (largura <= bobina) {
                    bobinaSugerida = `${bobina} cm`;
                    break;
                }
            }
        }
        
        // --- Monta e Exibe o Resultado ---
        let resultadoHTML = `
            <ul>
                <li><strong>Máquina Selecionada:</strong> ${maquinaSelecionada.nome}</li>
                <li><strong>Bobina Sugerida:</strong> ${bobinaSugerida}</li>
            </ul>
        `;

        // Adiciona um aviso no resultado se houver emenda ou divisão
        if (material === 'lona' && largura > 320) {
            resultadoHTML += '<p style="color: red; font-weight: bold;">LEMBRETE: Esta OS requer EMENDA na lona.</p>';
        } else if (material === 'adesivo' && largura > maquinaSelecionada.boca) {
            resultadoHTML += '<p style="color: red; font-weight: bold;">LEMBRETE: Esta OS requer DIVISÃO do adesivo em folhas.</p>';
        }

        resultContent.innerHTML = resultadoHTML;
        resultCard.style.display = 'block';
    });
});
