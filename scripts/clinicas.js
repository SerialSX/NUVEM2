// clinicas.js - Sistema de Clínicas Completo

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('lista-clinicas')) {
        await carregarClinicas();
    }
    
    if (document.getElementById('filtro-especialidade')) {
        await carregarFiltrosEspecialidades();
    }
});

/**
 * Carrega a lista de clínicas
 */
async function carregarClinicas(filtros = {}) {
    const container = document.getElementById('lista-clinicas');
    container.innerHTML = '<div class="loading">Carregando clínicas...</div>';
    
    try {
        const clinicas = await buscarClinicas(filtros);
        renderizarClinicas(clinicas);
    } catch (error) {
        console.error('Erro ao carregar clínicas:', error);
        container.innerHTML = '<div class="error">Erro ao carregar clínicas</div>';
    }
}

/**
 * Carrega as especialidades para o filtro
 */
async function carregarFiltrosEspecialidades() {
    const select = document.getElementById('filtro-especialidade');
    
    try {
        const Clinica = Parse.Object.extend('Clinica');
        const query = new Parse.Query(Clinica);
        query.select('especialidades');
        query.distinct('especialidades');
        
        const especialidades = await query.find();
        const todasEspecialidades = [...new Set(especialidades.flat())].sort();
        
        select.innerHTML = '<option value="">Todas especialidades</option>';
        todasEspecialidades.forEach(especialidade => {
            const option = document.createElement('option');
            option.value = especialidade;
            option.textContent = especialidade;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar especialidades:', error);
        select.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

/**
 * Busca clínicas com filtros
 */
async function buscarClinicas(filtros = {}) {
    try {
        const Clinica = Parse.Object.extend('Clinica');
        const query = new Parse.Query(Clinica);
        
        // Aplica filtros
        if (filtros.especialidade) {
            query.equalTo('especialidades', filtros.especialidade);
        }
        
        if (filtros.bairro) {
            query.equalTo('bairro', filtros.bairro);
        }
        
        if (filtros.nome) {
            query.contains('nome', filtros.nome);
        }
        
        // Ordenação
        if (filtros.ordenacao === 'avaliacao') {
            query.descending('mediaAvaliacao');
        } else {
            query.ascending('nome');
        }
        
        return await query.find();
        
    } catch (error) {
        console.error('Erro ao buscar clínicas:', error);
        throw error;
    }
}

/**
 * Renderiza a lista de clínicas
 */
function renderizarClinicas(clinicas, containerId = 'lista-clinicas') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (clinicas.length === 0) {
        container.innerHTML = '<p class="empty">Nenhuma clínica encontrada</p>';
        return;
    }
    
    clinicas.forEach(clinica => {
        const card = document.createElement('div');
        card.className = 'clinica-card';
        card.innerHTML = `
            <div class="clinica-imagem" style="background-image: url('${clinica.get('imagem')?.url() || 'https://via.placeholder.com/300x160?text=Clinica'}')">
                ${clinica.get('destaque') ? '<span class="clinica-tag">Destaque</span>' : ''}
            </div>
            <div class="clinica-info">
                <h3>${clinica.get('nome')}</h3>
                <p class="clinica-especialidade">
                    ${clinica.get('especialidades')?.join(', ') || 'Geral'}
                </p>
                <p class="clinica-endereco">
                    <i class="icon">📍</i> ${clinica.get('endereco')}
                </p>
                <div class="clinica-actions">
                    <button class="btn-detalhes" onclick="verDetalhesClinica('${clinica.id}')">
                        Detalhes
                    </button>
                    <button class="btn-agendar" onclick="agendarNaClinica('${clinica.id}')">
                        Agendar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Mostra os detalhes de uma clínica específica
 */
async function verDetalhesClinica(clinicaId) {
    try {
        const clinica = await carregarDetalhesClinica(clinicaId);
        
        // Criar modal com os detalhes
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="fecharModal()">&times;</span>
                <div class="clinica-detalhes">
                    <div class="clinica-imagem-grande" style="background-image: url('${clinica.imagem || 'https://via.placeholder.com/600x300?text=Clinica'}')"></div>
                    <h2>${clinica.nome}</h2>
                    <div class="clinica-meta">
                        <p><i class="icon">📍</i> ${clinica.endereco}</p>
                        <p><i class="icon">📞</i> ${clinica.telefone}</p>
                    </div>
                    
                    <div class="clinica-section">
                        <h3>Especialidades</h3>
                        <div class="especialidades-list">
                            ${clinica.especialidades.map(esp => `<span class="especialidade-tag">${esp}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="clinica-section">
                        <h3>Horários de Funcionamento</h3>
                        <table class="horarios-table">
                            <tr>
                                <th>Dia</th>
                                <th>Horário</th>
                            </tr>
                            ${Object.entries(clinica.horarios).map(([dia, horario]) => `
                                <tr>
                                    <td>${dia}</td>
                                    <td>${horario || 'Fechado'}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    
                    <div class="clinica-section">
                        <h3>Médicos</h3>
                        <div class="medicos-list">
                            ${clinica.medicos.length > 0 
                                ? clinica.medicos.map(medico => `
                                    <div class="medico-item">
                                        <p><strong>Dr. ${medico.get('nome')}</strong></p>
                                        <p>${medico.get('especialidade')}</p>
                                    </div>
                                `).join('') 
                                : '<p>Nenhum médico cadastrado nesta clínica</p>'}
                        </div>
                    </div>
                    
                    <button class="btn-agendar" onclick="agendarNaClinica('${clinica.id}')">
                        Agendar Consulta
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Erro ao carregar detalhes da clínica:', error);
        mostrarFeedback('Erro ao carregar detalhes da clínica', 'error');
    }
}

/**
 * Carrega os detalhes completos de uma clínica
 */
async function carregarDetalhesClinica(clinicaId) {
    try {
        const Clinica = Parse.Object.extend('Clinica');
        const query = new Parse.Query(Clinica);
        query.include(['medicos']);
        
        const clinica = await query.get(clinicaId);
        
        return {
            id: clinica.id,
            nome: clinica.get('nome'),
            endereco: clinica.get('endereco'),
            telefone: clinica.get('telefone'),
            especialidades: clinica.get('especialidades') || [],
            horarios: clinica.get('horarios') || {},
            imagem: clinica.get('imagem')?.url(),
            medicos: clinica.get('medicos') || []
        };
        
    } catch (error) {
        console.error('Erro ao carregar detalhes da clínica:', error);
        throw error;
    }
}

/**
 * Redireciona para agendamento com a clínica pré-selecionada
 */
function agendarNaClinica(clinicaId) {
    // Armazena a clínica selecionada para usar no agendamento
    sessionStorage.setItem('clinicaSelecionada', clinicaId);
    window.location.href = 'agendamento.html';
}

/**
 * Fecha o modal de detalhes
 */
function fecharModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    }
}

/**
 * Aplica os filtros da busca
 */
async function aplicarFiltros() {
    const especialidade = document.getElementById('filtro-especialidade').value;
    const bairro = document.getElementById('filtro-bairro').value;
    const nome = document.getElementById('filtro-nome').value;
    const ordenacao = document.getElementById('filtro-ordenacao').value;
    
    await carregarClinicas({
        especialidade,
        bairro,
        nome,
        ordenacao
    });
}

// Event listeners
if (document.getElementById('btn-filtrar')) {
    document.getElementById('btn-filtrar').addEventListener('click', async (e) => {
        e.preventDefault();
        await aplicarFiltros();
    });
}