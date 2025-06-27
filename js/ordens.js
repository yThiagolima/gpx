document.addEventListener('DOMContentLoaded', function() {
    // --- Mapeamento das máquinas ---
    const maquinasInfo = {
        epson: { nome: 'Epson S40', boca: 160 },
        mimaki: { nome: 'Mimaki 320', boca: 320 },
        bunnercut: { nome: 'BunnerCUT (Recorte)', boca: 120 }
    };

    // --- Elementos do Formulário ---
    const form = document.getElementById('form-nova-os');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const resultContent = document.getElementById('os-result-content');
    const resultCard = document.getElementById('os-result-card');

    // --- Elementos do Wizard ---
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-item');
    let currentStep = 1;

    // --- LÓGICA DO WIZARD (PASSO A PASSO) ---
    const updateWizard = () => {
        steps.forEach(step => step.classList.remove('active'));
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active');
            if (index + 1 === currentStep) {
                indicator.classList.add('active');
            }
        });

        prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep < steps.length ? 'inline-block' : 'none';
        submitBtn.style.display = currentStep === steps.length ? 'inline-block' : 'none';
    };

    nextBtn.addEventListener('click', () => {
        // Validação simples antes de avançar
        const cliente = document.getElementById('cliente').value;
        const largura = document.getElementById('largura').value;
        if (!cliente || !largura) {
            alert('Por favor, preencha todos os dados do serviço antes de avançar.');
            return;
        }
        if (currentStep < steps.length) {
            currentStep++;
            updateWizard();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizard();
        }
    });

    // --- LÓGICA DE UPLOAD E PREVIEW ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    async function handleFiles(files) {
        previewContainer.innerHTML = '<p class="loading-previews">Carregando pré-visualizações...</p>';
        let allPreviewsHTML = '';

        for (const file of files) {
            if (file.type === "application/pdf") {
                const fileReader = new FileReader();
                const promise = new Promise((resolve, reject) => {
                    fileReader.onload = async function() {
                        try {
                            const typedarray = new Uint8Array(this.result);
                            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                            let filePreviewsHTML = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const viewport = page.getViewport({ scale: 1 });
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                const scale = 150 / viewport.width; // Escala para largura fixa de 150px
                                const scaledViewport = page.getViewport({ scale: scale });
                                canvas.height = scaledViewport.height;
                                canvas.width = scaledViewport.width;
                                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
                                filePreviewsHTML += `
                                    <div class="preview-item">
                                        <img src="${canvas.toDataURL()}" alt="Página ${i} de ${file.name}">
                                        <div class="preview-info">Página ${i}</div>
                                        <button type="button" class="delete-preview-btn" title="Remover página">&times;</button>
                                    </div>
                                `;
                            }
                            resolve(filePreviewsHTML);
                        } catch (error) {
                            console.error("Erro ao ler PDF:", error);
                            reject(`<p>Erro ao ler o arquivo ${file.name}</p>`);
                        }
                    };
                    fileReader.readAsArrayBuffer(file);
                });
                allPreviewsHTML += await promise;
            }
        }
        previewContainer.innerHTML = allPreviewsHTML;
    }

    previewContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('delete-preview-btn')) {
            e.target.closest('.preview-item').remove();
        }
    });

    // --- LÓGICA DE SUBMISSÃO FINAL ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        // (Aqui entra a lógica de validação de máquina e bobina que fizemos antes)
        // ...
        resultCard.style.display = 'block';
        resultContent.innerHTML = `<ul><li><strong>OS Gerada com Sucesso!</strong> As informações e arquivos estão prontos para serem enviados.</li></ul>`;
    });

    updateWizard(); // Inicializa o wizard
});
