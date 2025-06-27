document.addEventListener('DOMContentLoaded', function() {
    // --- Mapeamento das máquinas ---
    const maquinasInfo = { epson: { nome: 'Epson S40', boca: 160 }, mimaki: { nome: 'Mimaki 320', boca: 320 }, bunnercut: { nome: 'BunnerCUT (Recorte)', boca: 120 } };

    // --- Elementos do Formulário ---
    const form = document.getElementById('form-nova-os');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const larguraInput = document.getElementById('largura');
    const alturaInput = document.getElementById('altura');
    const custoM2Input = document.getElementById('custo-m2');
    const valorTotalInput = document.getElementById('valor-total');
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

    // --- LÓGICA DE UPLOAD E PREVIEW (EXISTENTE) ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    
    // Função para gerar os previews (sem alterações)
    async function handleFiles(files) { /* ...código da função handleFiles da resposta anterior... */ }
    previewContainer.addEventListener('click', function(e) { /* ...código do listener de apagar preview... */ });


    // --- LÓGICA DO CAIXA (EXISTENTE) ---
    const calcularValor = () => {
        const larguraM = parseFloat(larguraInput.value) / 100;
        const alturaM = parseFloat(alturaInput.value) / 100;
        const custoM2 = parseFloat(custoM2Input.value);
        if (larguraM > 0 && alturaM > 0 && custoM2 >= 0) {
            valorTotalInput.value = `R$ ${(larguraM * alturaM * custoM2).toFixed(2).replace('.', ',')}`;
        } else {
            valorTotalInput.value = '';
        }
    };
    larguraInput.addEventListener('input', calcularValor);
    alturaInput.addEventListener('input', calcularValor);
    custoM2Input.addEventListener('input', calcularValor);

    // --- LÓGICA DE SUBMISSÃO FINAL ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        // (Aqui entra a lógica de validação de máquina e bobina que fizemos antes)
        // ...
        resultCard.style.display = 'block';
        resultContent.innerHTML = `<ul><li><strong>OS Gerada com Sucesso!</strong></li></ul>`; // Exemplo
    });

    updateWizard(); // Inicializa o wizard
});
