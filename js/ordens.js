document.addEventListener('DOMContentLoaded', function() {

    // --- Mapeamento das máquinas ---
    const maquinasInfo = {
        epson: { nome: 'Epson S40', boca: 160 },
        mimaki: { nome: 'Mimaki 320', boca: 320 },
        bunnercut: { nome: 'BunnerCUT (Recorte)', boca: 120 }
    };

    // --- Elementos do HTML ---
    const form = document.getElementById('form-nova-os');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const resultCard = document.getElementById('os-result-card');
    const resultContent = document.getElementById('os-result-content');

    // --- Elementos do Caixa ---
    const larguraInput = document.getElementById('largura');
    const alturaInput = document.getElementById('altura');
    const custoM2Input = document.getElementById('custo-m2');
    const valorTotalInput = document.getElementById('valor-total');


    // --- LÓGICA DE UPLOAD E PREVIEW ---

    // Abre o seletor de arquivos ao clicar na drop-zone
    dropZone.addEventListener('click', () => fileInput.click());

    // Eventos para arrastar e soltar
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Evento para quando seleciona arquivos pelo clique
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    async function handleFiles(files) {
        previewContainer.innerHTML = '<p>Carregando pré-visualizações...</p>';
        let allPreviews = '';

        for (const file of files) {
            if (file.type === "application/pdf") {
                const fileReader = new FileReader();
                fileReader.onload = async function() {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 1 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = 200; // Altura fixa para o preview
                        canvas.width = (canvas.height / viewport.height) * viewport.width;
                        const renderContext = {
                            canvasContext: context,
                            viewport: page.getViewport({ scale: canvas.height / viewport.height })
                        };
                        await page.render(renderContext).promise;

                        // Cria o card de preview com o canvas e o botão de apagar
                        const previewItemHTML = `
                            <div class="preview-item" data-page-id="file${file.name}-page${i}">
                                <canvas id="canvas-${file.name}-${i}"></canvas>
                                <div class="preview-info">Página ${i} de ${pdf.numPages}</div>
                                <button type="button" class="delete-preview-btn">Apagar</button>
                            </div>
                        `;
                        allPreviews += previewItemHTML;

                        // Precisamos de um pequeno delay para reinserir o canvas no DOM
                        setTimeout(() => {
                           const newCanvas = document.getElementById(`canvas-${file.name}-${i}`);
                           if(newCanvas) newCanvas.getContext('2d').drawImage(canvas, 0, 0);
                        }, 0);
                    }
                    previewContainer.innerHTML = allPreviews; // Insere todos os previews de uma vez
                };
                fileReader.readAsArrayBuffer(file);
            }
        }
    }

    // Lógica para o botão de apagar preview
    previewContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('delete-preview-btn')) {
            const itemToRemove = e.target.closest('.preview-item');
            if (itemToRemove) {
                itemToRemove.remove();
            }
        }
    });

    // --- LÓGICA DO CAIXA (CÁLCULO DE VALOR) ---
    function calcularValor() {
        const larguraM = parseFloat(larguraInput.value) / 100;
        const alturaM = parseFloat(alturaInput.value) / 100;
        const custoM2 = parseFloat(custoM2Input.value);

        if (larguraM > 0 && alturaM > 0 && custoM2 >= 0) {
            const area = larguraM * alturaM;
            const valorTotal = area * custoM2;
            valorTotalInput.value = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
        } else {
            valorTotalInput.value = '';
        }
    }
    // Recalcula o valor sempre que um dos campos mudar
    larguraInput.addEventListener('input', calcularValor);
    alturaInput.addEventListener('input', calcularValor);
    custoM2Input.addEventListener('input', calcularValor);

    // --- LÓGICA DE SUBMISSÃO DO FORMULÁRIO (EXISTENTE) ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        resultCard.style.display = 'none';
        resultContent.innerHTML = '';
        
        // (Aqui entra toda a lógica de validação de máquina e bobina que fizemos antes)
        // ...
        
        // Exemplo de como exibir o resultado final
        const maquinaSelecionada = maquinasInfo[document.getElementById('maquina').value];
        const valorFinal = valorTotalInput.value;
        
        let resultadoHTML = `
            <ul>
                <li><strong>Máquina Selecionada:</strong> ${maquinaSelecionada.nome}</li>
                <li><strong>Valor Final do Serviço:</strong> ${valorFinal}</li>
            </ul>
        `;
        
        resultContent.innerHTML = resultadoHTML;
        resultCard.style.display = 'block';
    });
});
