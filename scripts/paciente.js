// paciente.js - Sistema de Agendamento Completo

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('tipo-consulta')) {
        await carregarEspecialidades();
        await carregarAgendamentos();
    }
});

/**
 * Carrega as especialidades disponíveis baseadas nos médicos
 */
async function carregarEspecialidades() {
    const selectEspecialidade = document.getElementById('tipo-consulta');
    selectEspecialidade.innerHTML = '<option value="">Carregando especialidades...</option>';

    try {
        const Medico = Parse.Object.extend('Medico');
        const query = new Parse.Query(Medico);
        query.select('especialidade');
        query.distinct('especialidade');
        query.equalTo('ativo', true);
        
        const especialidades = await query.find();
        
        selectEspecialidade.innerHTML = '<option value="">Selecione o tipo de consulta</option>';
        especialidades.forEach(especialidade => {
            const option = document.createElement('option');
            option.value = especialidade;
            option.textContent = especialidade;
            selectEspecialidade.appendChild(option);
        });

        // Atualiza médicos quando especialidade muda
        selectEspecialidade.addEventListener('change', async () => {
            await carregarMedicosDisponiveis(selectEspecialidade.value);
            await carregarHorariosDisponiveis();
        });

    } catch (error) {
        console.error('Erro ao carregar especialidades:', error);
        selectEspecialidade.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

/**
 * Filtra médicos por especialidade
 */
async function carregarMedicosDisponiveis(especialidade) {
    const selectMedico = document.getElementById('medico');
    selectMedico.innerHTML = '<option value="">Carregando médicos...</option>';

    try {
        const Medico = Parse.Object.extend('Medico');
        const query = new Parse.Query(Medico);
        query.include(['user']);
        query.equalTo('ativo', true);
        
        if (especialidade) {
            query.equalTo('especialidade', especialidade);
        }
        
        query.ascending('nome');
        const medicos = await query.find();
        
        selectMedico.innerHTML = medicos.length > 0 
            ? '<option value="">Selecione um médico</option>'
            : '<option value="">Nenhum médico disponível</option>';
        
        medicos.forEach(medico => {
            const user = medico.get('user');
            const option = document.createElement('option');
            option.value = medico.id;
            option.textContent = `Dr. ${user.get('nome')} - ${medico.get('especialidade')}`;
            option.dataset.especialidade = medico.get('especialidade');
            selectMedico.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
        selectMedico.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

/**
 * Carrega horários disponíveis para o médico selecionado
 */
async function carregarHorariosDisponiveis() {
    const selectMedico = document.getElementById('medico');
    const selectData = document.getElementById('data-consulta');
    const selectHorario = document.getElementById('horario-consulta');
    
    const medicoId = selectMedico.value;
    const dataSelecionada = selectData.value;
    
    if (!medicoId || !dataSelecionada) {
        selectHorario.innerHTML = '<option value="">Selecione médico e data primeiro</option>';
        return;
    }
    
    selectHorario.innerHTML = '<option value="">Carregando horários...</option>';
    
    try {
        // Converter data para objeto Date
        const dataObj = new Date(dataSelecionada);
        dataObj.setHours(0, 0, 0, 0);
        
        // Buscar consultas já agendadas para este médico nesta data
        const Consulta = Parse.Object.extend('Consulta');
        const query = new Parse.Query(Consulta);
        query.equalTo('medico', { __type: 'Pointer', className: 'Medico', objectId: medicoId });
        query.greaterThanOrEqualTo('data', new Date(dataObj));
        query.lessThan('data', new Date(dataObj.getTime() + 24 * 60 * 60 * 1000));
        
        const consultasAgendadas = await query.find();
        const horariosOcupados = consultasAgendadas.map(consulta => {
            const data = new Date(consulta.get('data'));
            return data.getHours() + ':' + (data.getMinutes() < 10 ? '0' : '') + data.getMinutes();
        });
        
        // Gerar horários disponíveis (8h às 18h, de 30 em 30 minutos)
        const horariosDisponiveis = [];
        for (let hora = 8; hora < 18; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horario = `${hora}:${minuto < 10 ? '0' + minuto : minuto}`;
                if (!horariosOcupados.includes(horario)) {
                    horariosDisponiveis.push(horario);
                }
            }
        }
        
        selectHorario.innerHTML = horariosDisponiveis.length > 0 
            ? '<option value="">Selecione um horário</option>'
            : '<option value="">Nenhum horário disponível</option>';
        
        horariosDisponiveis.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            selectHorario.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        selectHorario.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

/**
 * Atualiza a lista de agendamentos
 */
async function carregarAgendamentos() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    listaAgendamentos.innerHTML = '<p class="loading">Carregando agendamentos...</p>';

    try {
        const Paciente = Parse.Object.extend('Paciente');
        const paciente = await new Parse.Query(Paciente)
            .equalTo('user', Parse.User.current())
            .first();

        if (!paciente) throw new Error('Paciente não encontrado');

        const Consulta = Parse.Object.extend('Consulta');
        const query = new Parse.Query(Consulta);
        query.equalTo('paciente', paciente.get('user'));
        query.greaterThanOrEqualTo('data', new Date());
        query.ascending('data');
        query.include(['medico', 'paciente']);
        
        const consultas = await query.find();
        
        listaAgendamentos.innerHTML = consultas.length > 0 
            ? '' 
            : '<p class="empty">Nenhuma consulta agendada</p>';
        
        consultas.forEach(consulta => {
            const medico = consulta.get('medico');
            const data = new Date(consulta.get('data'));
            
            const item = document.createElement('div');
            item.className = 'agendamento-item';
            item.innerHTML = `
                <div class="agendamento-data">
                    ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div class="agendamento-info">
                    <h4>${consulta.get('tipo')}</h4>
                    <p>Com Dr. ${medico.get('nome')}</p>
                    <span class="status ${consulta.get('status')}">${consulta.get('status')}</span>
                </div>
                <button class="btn-cancel" onclick="cancelarAgendamento('${consulta.id}')">
                    Cancelar
                </button>
            `;
            listaAgendamentos.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        listaAgendamentos.innerHTML = '<p class="error">Erro ao carregar consultas</p>';
    }
}

/**
 * Cancela um agendamento
 */
async function cancelarAgendamento(consultaId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        const Consulta = Parse.Object.extend('Consulta');
        const consulta = await new Parse.Query(Consulta).get(consultaId);
        
        consulta.set('status', 'cancelado');
        await consulta.save();
        
        mostrarFeedback('Agendamento cancelado com sucesso', 'success');
        await carregarAgendamentos();
        
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        mostrarFeedback('Erro ao cancelar agendamento', 'error');
    }
}

/**
 * Agenda uma nova consulta
 */
async function agendarConsulta() {
    const tipo = document.getElementById('tipo-consulta').value;
    const medicoId = document.getElementById('medico').value;
    const dataInput = document.getElementById('data-consulta').value;
    const horario = document.getElementById('horario-consulta').value;
    
    if (!tipo || !medicoId || !dataInput || !horario) {
        mostrarFeedback('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        // Criar objeto de data combinando data e horário
        const [hora, minuto] = horario.split(':');
        const dataObj = new Date(dataInput);
        dataObj.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        
        // Verificar se a data é válida (não no passado)
        if (dataObj < new Date()) {
            mostrarFeedback('Não é possível agendar para datas passadas', 'error');
            return;
        }
        
        // Obter paciente atual
        const Paciente = Parse.Object.extend('Paciente');
        const paciente = await new Parse.Query(Paciente)
            .equalTo('user', Parse.User.current())
            .first();
        
        if (!paciente) throw new Error('Paciente não encontrado');
        
        // Criar consulta
        const Consulta = Parse.Object.extend('Consulta');
        const consulta = new Consulta();
        
        consulta.set('tipo', tipo);
        consulta.set('medico', { __type: 'Pointer', className: 'Medico', objectId: medicoId });
        consulta.set('paciente', Parse.User.current());
        consulta.set('data', dataObj);
        consulta.set('status', 'pendente');
        
        await consulta.save();
        
        mostrarFeedback('Consulta agendada com sucesso!', 'success');
        
        // Limpar formulário e recarregar agendamentos
        document.getElementById('form-agendamento').reset();
        await carregarAgendamentos();
        
    } catch (error) {
        console.error('Erro ao agendar consulta:', error);
        mostrarFeedback('Erro ao agendar consulta', 'error');
    }
}

/**
 * Mostra feedback ao usuário
 */
function mostrarFeedback(mensagem, tipo) {
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.textContent = mensagem;
    feedbackDiv.className = `feedback ${tipo}`;
    feedbackDiv.style.display = 'block';
    
    setTimeout(() => {
        feedbackDiv.style.display = 'none';
    }, 5000);
}

// Event listeners
if (document.getElementById('data-consulta')) {
    document.getElementById('data-consulta').addEventListener('change', async () => {
        await carregarHorariosDisponiveis();
    });
}

if (document.getElementById('btn-agendar')) {
    document.getElementById('btn-agendar').addEventListener('click', async (e) => {
        e.preventDefault();
        await agendarConsulta();
    });
}