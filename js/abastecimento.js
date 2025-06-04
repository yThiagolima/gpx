// frontend/js/abastecimento.js
document.addEventListener('DOMContentLoaded', function() {
    const formRegistrarAbastecimento = document.getElementById('formRegistrarAbastecimento');
    const abastecimentoVeiculoSelect = document.getElementById('abastecimentoVeiculo');
    const abastecimentoHistoryBody = document.getElementById('abastecimentoHistoryBody');
    const messageAbastecimento = document.getElementById('messageAbastecimento');
    const messageAbastecimentoHistory = document.getElementById('messageAbastecimentoHistory');
    const searchAbastecimentoInput = document.getElementById('searchAbastecimentoInput');

    // Reutiliza a função showMessage, talvez de forma mais genérica
    function showMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = 'message-feedback';
        if (type) {
            element.classList.add(type);
        }
    }

    // Carrega veículos para o select no formulário de abastecimento
    async function carregarVeiculosParaSelect() {
        try {
            const response = await fetch('https://gpx-api-xwv1.onrender.com/api/veiculos');
            if (!response.ok) throw new Error('Falha ao carregar veículos.');
            const veiculos = await response.json();

            if (abastecimentoVeiculoSelect) {
                abastecimentoVeiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
                veiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v._id;
                    option.dataset.placa = v.placa;
                    option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
                    abastecimentoVeiculoSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar veículos para select de abastecimento:', error);
            showMessage(messageAbastecimento, 'Erro ao carregar lista de veículos.', 'error');
        }
    }

    // Carrega o histórico de abastecimentos
    async function loadAbastecimentoHistory(searchTerm = '') {
        if (!abastecimentoHistoryBody) return;
        abastecimentoHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando histórico de abastecimentos...</td></tr>';
        showMessage(messageAbastecimentoHistory, '', '');

        try {
            let url = 'https://gpx-api-xwv1.onrender.com/api/abastecimentos/historico';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar histórico.` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                abastecimentoHistoryBody.innerHTML = '';
                data.forEach(abastecimento => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="detalhes_veiculo.html?id=<span class="math-inline">\{abastecimento\.veiculoId\}"\></span>{abastecimento.veiculoPlaca || '--'}</a></td>
                        <td><span class="math-inline">\{abastecimento\.dataAbastecimento ? new Date\(abastecimento\.dataAbastecimento\)\.toLocaleDateString\('pt\-BR'\) \: '\-\-'\}</td\>
