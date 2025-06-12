class ClinicaDetalhesController {
    constructor() {
        this.clinicaId = new URLSearchParams(window.location.search).get('id');
        this.avaliacaoUsuario = 0;
        this.init();
    }

    async init() {
        if (!this.clinicaId) {
            this.mostrarErro('ID da clínica não especificado');
            return;
        }

        await this.carregarClinica();
        this.setupEventListeners();
        this.setupTabs();
        
        // Se veio para agendar, abre o modal
        if (window.location.hash === '#agendar') {
            this.iniciarAgendamento();
        }
    }

    async carregarClinica() {
        try {
            this.mostrarLoading();
            
            const query = new Parse.Query('Clinica');
            const clinica = await query.get(this.clinicaId);
            
            if (!clinica) {
                throw new Error('Clínica não encontrada');
            }
            
            this.renderizarClinica(clinica);
            await this.carregarMedicos(clinica);
            await this.carregarAvaliacoes(clinica);
            await this.carregarGaleria(clinica);
            
        } catch (error) {
            console.error('Erro ao carregar clínica:', error);
            this.mostrarErro('Erro ao carregar dados da clínica');
        }
    }

    renderizarClinica(clinica) {
        // Informações básicas
        document.getElementById('clinica-nome').textContent = clinica.get('nome');
        document.getElementById('clinica-endereco').textContent = clinica.get('endereco');
        document.getElementById('clinica-bairro').textContent = clinica.get('bairro');
        document.getElementById('clinica-telefone').textContent = clinica.get('telefone');
        document.getElementById('clinica-email').textContent = clinica.get('email');
        
        // Imagem
        const imagemUrl = clinica.get('imagem')?.url() || 'https://via.placeholder.com/800x400?text=Clínica';
        document.getElementById('clinica-imagem').style.backgroundImage = `url('${imagemUrl}')`;
        
        // Especialidades
        const especialidadesContainer = document.getElementById('clinica-especialidades');
        especialidadesContainer.innerHTML = '';
        
        const especialidades = clinica.get('especialidades') || [];
        especialidades.forEach(especialidade => {
            const span = document.createElement('span');
            span.className = 'especialidade-tag';
            span.textContent = especialidade;
            especialidadesContainer.appendChild(span);
        });
        
        // Horários
        const horariosContainer = document.getElementById('clinica-horarios');
        horariosContainer.innerHTML = '';
        
        const horarios = clinica.get('horarios') || {};
        for (const [dia, horario] of Object.entries(horarios)) {
            const div = document.createElement('div');
            div.className = 'horario-item';
            div.innerHTML = `
                <span class="dia">${dia}:</span>
                <span class="horario">${horario || 'Fechado'}</span>
            `;
            horariosContainer.appendChild(div);
        }
        
        // Avaliação
        const mediaAvaliacao = clinica.get('mediaAvaliacao') || 0;
        document.getElementById('clinica-avaliacao').innerHTML = this.renderizarEstrelas(mediaAvaliacao);
        document.getElementById('clinica-avaliacao-texto').textContent = 
            `${mediaAvaliacao.toFixed(1)} (${clinica.get('totalAvaliacoes') || 0} avaliações)`;
        
        // Mapa (simplificado)
        const endereco = encodeURIComponent(`${clinica.get('endereco')}, ${clinica.get('bairro')}`);
        document.getElementById('clinica-mapa').innerHTML = `
            <iframe 
                width="100%" 
                height="300" 
                frameborder="0" 
                style="border:0" 
                src="https://www.google.com/maps/embed/v1/place?key=SUA_CHAVE_API&q=${endereco}" 
                allowfullscreen>
            </iframe>
        `;
    }

    async carregarMedicos(clinica) {
        try {
            const query = new Parse.Query('Medico');
            query.equalTo('clinica', clinica);
            query.include('user');
            const medicos = await query.find();
            
            const container = document.getElementById('medicos-list');
            container.innerHTML = '';
            
            if (medicos.length === 0) {
                container.innerHTML = '<p class="empty">Nenhum médico cadastrado nesta clínica</p>';
                return;
            }
            
            medicos.forEach(medico => {
                const card = document.createElement('div');
                card.className = 'medico-card';
                
                const user = medico.get('user');
                const nome = user?.get('nome') || 'Médico sem nome';
                const especialidade = medico.get('especialidade') || 'Geral';
                const imagem = user?.get('foto')?.url() || 'https://via.placeholder.com/100?text=Médico';
                
                card.innerHTML = `
                    <div class="medico-imagem" style="background-image: url('${imagem}')"></div>
                    <div class="medico-info">
                        <h4>${nome}</h4>
                        <p class="especialidade">${especialidade}</p>
                        <p class="crm">CRM ${medico.get('crm') || '0000'}</p>
                    </div>
                `;
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error('Erro ao carregar médicos:', error);
            document.getElementById('medicos-list').innerHTML = 
                '<p class="error">Erro ao carregar lista de médicos</p>';
        }
    }

    async carregarAvaliacoes(clinica) {
        try {
            const query = new Parse.Query('Avaliacao');
            query.equalTo('clinica', clinica);
            query.include('paciente.user');
            query.descending('createdAt');
            query.limit(50);
            const avaliacoes = await query.find();
            
            const container = document.getElementById('avaliacoes-list');
            container.innerHTML = '';
            
            if (avaliacoes.length === 0) {
                container.innerHTML = '<p class="empty">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>';
                return;
            }
            
            avaliacoes.forEach(avaliacao => {
                const paciente = avaliacao.get('paciente');
                const nome = paciente?.get('user')?.get('nome') || 'Anônimo';
                const data = avaliacao.createdAt.toLocaleDateString('pt-BR');
                const comentario = avaliacao.get('comentario') || '';
                const nota = avaliacao.get('nota') || 0;
                
                const div = document.createElement('div');
                div.className = 'avaliacao-item';
                div.innerHTML = `
                    <div class="avaliacao-header">
                        <div class="avaliacao-usuario">
                            <div class="avatar">${nome.charAt(0)}</div>
                            <div>
                                <h4>${nome}</h4>
                                <span class="data">${data}</span>
                            </div>
                        </div>
                        <div class="avaliacao-nota">
                            ${this.renderizarEstrelas(nota)}
                        </div>
                    </div>
                    ${comentario ? `<p class="avaliacao-comentario">${comentario}</p>` : ''}
                `;
                container.appendChild(div);
            });
            
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            document.getElementById('avaliacoes-list').innerHTML = 
                '<p class="error">Erro ao carregar avaliações</p>';
        }
    }

    async carregarGaleria(clinica) {
        try {
            const galeria = clinica.get('galeria') || [];
            const container = document.getElementById('galeria-container');
            container.innerHTML = '';
            
            if (galeria.length === 0) {
                container.innerHTML = '<p class="empty">Nenhuma foto disponível</p>';
                return;
            }
            
            galeria.forEach((foto, index) => {
                const img = document.createElement('div');
                img.className = 'galeria-item';
                img.style.backgroundImage = `url('${foto.url()}')`;
                img.onclick = () => this.abrirLightbox(index);
                container.appendChild(img);
            });
            
        } catch (error) {
            console.error('Erro ao carregar galeria:', error);
            document.getElementById('galeria-container').innerHTML = 
                '<p class="error">Erro ao carregar galeria de fotos</p>';
        }
    }

    renderizarEstrelas(nota) {
        const estrelasCheias = Math.floor(nota);
        const temMeiaEstrela = nota % 1 >= 0.5;
        let html = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= estrelasCheias) {
                html += '★';
            } else if (i === estrelasCheias + 1 && temMeiaEstrela) {
                html += '½';
            } else {
                html += '☆';
            }
        }
        
        return html;
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.clinica-tabs .tab-button');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover classe active de todas as tabs e contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Adicionar classe active à tab clicada e ao content correspondente
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Formulário de avaliação
        document.getElementById('form-avaliacao').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.enviarAvaliacao();
        });
        
        // Formulário de agendamento
        document.getElementById('form-agendamento-clinica').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.enviarAgendamento();
        });
        
        // Estrelas de avaliação
        document.querySelectorAll('.estrelas-avaliacao span').forEach((estrela, index) => {
            estrela.addEventListener('click', () => this.classificar(index + 1));
        });
    }

    classificar(nota) {
        this.avaliacaoUsuario = nota;
        const estrelas = document.querySelectorAll('.estrelas-avaliacao span');
        
        estrelas.forEach((estrela, index) => {
            if (index < nota) {
                estrela.textContent = '★';
                estrela.style.color = '#FFD700';
            } else {
                estrela.textContent = '☆';
                estrela.style.color = '#ccc';
            }
        });
        
        document.getElementById('avaliacao-nota').value = nota;
    }

    abrirModalAvaliacao() {
        // Verificar se usuário está logado
        if (!Parse.User.current()) {
            alert('Por favor, faça login para avaliar a clínica');
            return;
        }
        
        this.avaliacaoUsuario = 0;
        document.getElementById('avaliacao-comentario').value = '';
        document.getElementById('modal-avaliacao').classList.remove('hidden');
    }

    fecharModalAvaliacao() {
        document.getElementById('modal-avaliacao').classList.add('hidden');
    }

    async enviarAvaliacao() {
        const comentario = document.getElementById('avaliacao-comentario').value;
        const nota = this.avaliacaoUsuario;
        
        if (nota === 0) {
            alert('Por favor, classifique a clínica com 1 a 5 estrelas');
            return;
        }
        
        try {
            const Avaliacao = Parse.Object.extend('Avaliacao');
            const avaliacao = new Avaliacao();
            
            // Obter paciente atual
            const Paciente = Parse.Object.extend('Paciente');
            const queryPaciente = new Parse.Query(Paciente);
            queryPaciente.equalTo('user', Parse.User.current());
            const paciente = await queryPaciente.first();
            
            if (!paciente) {
                throw new Error('Paciente não encontrado');
            }
            
            // Obter clínica
            const queryClinica = new Parse.Query('Clinica');
            const clinica = await queryClinica.get(this.clinicaId);
            
            // Salvar avaliação
            avaliacao.set('nota', nota);
            avaliacao.set('comentario', comentario);
            avaliacao.set('paciente', paciente);
            avaliacao.set('clinica', clinica);
            
            await avaliacao.save();
            
            // Atualizar média da clínica
            await this.atualizarMediaClinica(clinica);
            
            // Fechar modal e recarregar avaliações
            this.fecharModalAvaliacao();
            await this.carregarAvaliacoes(clinica);
            
            alert('Avaliação enviada com sucesso!');
            
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            alert('Erro ao enviar avaliação. Tente novamente.');
        }
    }

    async atualizarMediaClinica(clinica) {
        try {
            const query = new Parse.Query('Avaliacao');
            query.equalTo('clinica', clinica);
            
            const resultados = await query.aggregate([
                { group: { objectId: null, avgNota: { $avg: '$nota' }, total: { $sum: 1 } } }
            ]);
            
            if (resultados && resultados[0]) {
                clinica.set('mediaAvaliacao', resultados[0].avgNota);
                clinica.set('totalAvaliacoes', resultados[0].total);
                await clinica.save();
            }
            
        } catch (error) {
            console.error('Erro ao atualizar média da clínica:', error);
        }
    }

    iniciarAgendamento() {
        // Verificar se usuário está logado
        if (!Parse.User.current()) {
            alert('Por favor, faça login para agendar uma consulta');
            return;
        }
        
        this.carregarOpcoesAgendamento();
        document.getElementById('modal-agendamento').classList.remove('hidden');
    }

    fecharModalAgendamento() {
        document.getElementById('modal-agendamento').classList.add('hidden');
    }

    async carregarOpcoesAgendamento() {
        try {
            // Carregar médicos
            const queryMedicos = new Parse.Query('Medico');
            queryMedicos.equalTo('clinica', { __type: 'Pointer', className: 'Clinica', objectId: this.clinicaId });
            const medicos = await queryMedicos.find();
            
            const selectMedico = document.getElementById('agendamento-medico');
            selectMedico.innerHTML = '<option value="">Selecione um médico</option>';
            
            medicos.forEach(medico => {
                const user = medico.get('user');
                const option = document.createElement('option');
                option.value = medico.id;
                option.textContent = `Dr. ${user?.get('nome')} - ${medico.get('especialidade')}`;
                selectMedico.appendChild(option);
            });
            
            // Carregar especialidades
            const queryClinica = new Parse.Query('Clinica');
            const clinica = await queryClinica.get(this.clinicaId);
            const especialidades = clinica.get('especialidades') || [];
            
            const selectEspecialidade = document.getElementById('agendamento-especialidade');
            selectEspecialidade.innerHTML = '<option value="">Selecione uma especialidade</option>';
            
            especialidades.forEach(especialidade => {
                const option = document.createElement('option');
                option.value = especialidade;
                option.textContent = especialidade;
                selectEspecialidade.appendChild(option);
            });
            
            // Configurar data mínima (amanhã)
            const dataInput = document.getElementById('agendamento-data');
            const amanha = new Date();
            amanha.setDate(amanha.getDate() + 1);
            dataInput.min = amanha.toISOString().split('T')[0];
            
            // Carregar horários disponíveis quando a data for selecionada
            dataInput.addEventListener('change', async () => {
                await this.carregarHorariosDisponiveis(dataInput.value);
            });
            
        } catch (error) {
            console.error('Erro ao carregar opções de agendamento:', error);
            alert('Erro ao carregar opções. Tente novamente.');
        }
    }

    async carregarHorariosDisponiveis(data) {
        try {
            const selectHorario = document.getElementById('agendamento-horario');
            selectHorario.innerHTML = '<option value="">Carregando horários...</option>';
            
            // Simulação - na prática, você buscaria os horários disponíveis no backend
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const horariosDisponiveis = [
                '08:00', '09:00', '10:00', '11:00', 
                '14:00', '15:00', '16:00', '17:00'
            ];
            
            selectHorario.innerHTML = '<option value="">Selecione um horário</option>';
            horariosDisponiveis.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario;
                option.textContent = horario;
                selectHorario.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
            selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
        }
    }

    async enviarAgendamento() {
        const medicoId = document.getElementById('agendamento-medico').value;
        const especialidade = document.getElementById('agendamento-especialidade').value;
        const data = document.getElementById('agendamento-data').value;
        const horario = document.getElementById('agendamento-horario').value;
        
        if (!medicoId || !especialidade || !data || !horario) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        try {
            // Obter paciente atual
            const Paciente = Parse.Object.extend('Paciente');
            const queryPaciente = new Parse.Query(Paciente);
            queryPaciente.equalTo('user', Parse.User.current());
            const paciente = await queryPaciente.first();
            
            if (!paciente) {
                throw new Error('Paciente não encontrado');
            }
            
            // Obter médico
            const queryMedico = new Parse.Query('Medico');
            const medico = await queryMedico.get(medicoId);
            
            // Obter clínica
            const queryClinica = new Parse.Query('Clinica');
            const clinica = await queryClinica.get(this.clinicaId);
            
            // Criar data/hora
            const dataHora = new Date(`${data}T${horario}:00`);
            
            // Salvar agendamento
            const Agendamento = Parse.Object.extend('AgendamentoClinica');
            const agendamento = new Agendamento();
            
            agendamento.set('paciente', paciente);
            agendamento.set('medico', medico);
            agendamento.set('clinica', clinica);
            agendamento.set('especialidade', especialidade);
            agendamento.set('data', dataHora);
            agendamento.set('status', 'confirmado');
            
            await agendamento.save();
            
            // Fechar modal e mostrar confirmação
            this.fecharModalAgendamento();
            
            alert(`Consulta agendada com sucesso para ${dataHora.toLocaleString('pt-BR')}`);
            
            // Opcional: redirecionar para agendamentos
            window.location.href = 'paciente.html';
            
        } catch (error) {
            console.error('Erro ao agendar consulta:', error);
            alert('Erro ao agendar consulta. Tente novamente.');
        }
    }

    abrirLightbox(index) {
        // Implementação simplificada - pode ser expandida com uma biblioteca como Lightbox2
        const galeria = document.querySelectorAll('.galeria-item');
        const imagemUrl = galeria[index].style.backgroundImage.slice(5, -2);
        
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <span class="close-lightbox" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <img src="${imagemUrl}" alt="Imagem da clínica">
            </div>
        `;
        
        document.body.appendChild(lightbox);
    }

    mostrarLoading() {
        document.querySelector('.clinica-detalhes-container').innerHTML = `
            <div class="loading-full">
                <div class="spinner"></div>
                <p>Carregando informações da clínica...</p>
            </div>
        `;
    }

    mostrarErro(mensagem) {
        document.querySelector('.clinica-detalhes-container').innerHTML = `
            <div class="error-full">
                <i class="icon">⚠️</i>
                <p>${mensagem}</p>
                <button onclick="window.history.back()" class="btn-voltar">
                    ← Voltar para lista de clínicas
                </button>
            </div>
        `;
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.controller = new ClinicaDetalhesController();
});

// Funções globais para chamadas a partir do HTML
function abrirModalAvaliacao() {
    window.controller.abrirModalAvaliacao();
}

function fecharModalAvaliacao() {
    window.controller.fecharModalAvaliacao();
}

function iniciarAgendamento() {
    window.controller.iniciarAgendamento();
}

function fecharModalAgendamento() {
    window.controller.fecharModalAgendamento();
}

function classificar(nota) {
    window.controller.classificar(nota);
}