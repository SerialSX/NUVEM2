// chat.js - Sistema de Chat Completo

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('chat-mensagens')) {
        await carregarMensagens();
        
        // Configura evento de enviar mensagem
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensagem();
            }
        });
        
        document.getElementById('btn-enviar').addEventListener('click', enviarMensagem);
    }
});

/**
 * Carrega o histórico de mensagens
 */
async function carregarMensagens() {
    const chatMensagens = document.getElementById('chat-mensagens');
    chatMensagens.innerHTML = '<div class="loading">Carregando mensagens...</div>';
    
    try {
        // Obter paciente atual
        const Paciente = Parse.Object.extend('Paciente');
        const paciente = await new Parse.Query(Paciente)
            .equalTo('user', Parse.User.current())
            .first();
        
        if (!paciente) throw new Error('Paciente não encontrado');
        
        // Buscar mensagens
        const Mensagem = Parse.Object.extend('Mensagem');
        const query = new Parse.Query(Mensagem);
        query.equalTo('paciente', paciente);
        query.limit(50);
        query.ascending('createdAt');
        
        const mensagens = await query.find();
        
        chatMensagens.innerHTML = '';
        
        if (mensagens.length === 0) {
            chatMensagens.innerHTML = '<div class="empty">Nenhuma mensagem ainda. Inicie a conversa!</div>';
            return;
        }
        
        mensagens.forEach(msg => {
            adicionarMensagemAoChat({
                texto: msg.get('texto'),
                tipo: msg.get('remetente') === 'paciente' ? 'usuario' : 'atendente',
                hora: msg.createdAt
            });
        });
        
        // Rolagem automática para a última mensagem
        chatMensagens.scrollTop = chatMensagens.scrollHeight;
        
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        chatMensagens.innerHTML = '<div class="error">Erro ao carregar mensagens</div>';
    }
}

/**
 * Envia uma mensagem no chat
 */
async function enviarMensagem() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    
    if (!texto) {
        mostrarFeedback('Por favor, digite uma mensagem', 'error');
        return;
    }
    
    try {
        // Obter paciente atual
        const Paciente = Parse.Object.extend('Paciente');
        const paciente = await new Parse.Query(Paciente)
            .equalTo('user', Parse.User.current())
            .first();
        
        if (!paciente) throw new Error('Paciente não encontrado');
        
        // Criar mensagem
        const Mensagem = Parse.Object.extend('Mensagem');
        const mensagem = new Mensagem();
        
        mensagem.set('texto', texto);
        mensagem.set('remetente', 'paciente');
        mensagem.set('paciente', paciente);
        mensagem.set('lida', false);
        
        await mensagem.save();
        
        // Adiciona ao chat
        adicionarMensagemAoChat({
            texto,
            tipo: 'usuario',
            hora: new Date()
        });
        
        input.value = '';
        
        // Simula resposta do atendente
        setTimeout(async () => {
            const resposta = await gerarRespostaAtendente(texto);
            adicionarMensagemAoChat({
                texto: resposta,
                tipo: 'atendente',
                hora: new Date()
            });
            
            // Salva a resposta do atendente
            const respostaMsg = new Mensagem();
            respostaMsg.set('texto', resposta);
            respostaMsg.set('remetente', 'atendente');
            respostaMsg.set('paciente', paciente);
            respostaMsg.set('lida', true);
            await respostaMsg.save();
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        mostrarFeedback('Erro ao enviar mensagem', 'error');
    }
}

/**
 * Gera uma resposta automática do atendente
 */
async function gerarRespostaAtendente(mensagem) {
    // Aqui você pode implementar lógica mais sofisticada
    // ou integrar com um serviço de chatbot
    
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('ola') || mensagemLower.includes('oi') || mensagemLower.includes('olá')) {
        return 'Olá! Como posso ajudar você hoje?';
    }
    
    if (mensagemLower.includes('consulta') || mensagemLower.includes('marcar')) {
        return 'Para marcar uma consulta, por favor acesse a seção "Agendamentos" ou clique em "Agendar Consulta" no menu.';
    }
    
    if (mensagemLower.includes('horario') || mensagemLower.includes('funcionamento')) {
        return 'Nossas clínicas funcionam de segunda a sexta, das 8h às 18h. Aos sábados, das 8h às 12h.';
    }
    
    if (mensagemLower.includes('exame') || mensagemLower.includes('resultado')) {
        return 'Para acessar seus exames, vá até a seção "Meus Exames" no menu principal. Caso não encontre, entre em contato com o laboratório.';
    }
    
    if (mensagemLower.includes('receita') || mensagemLower.includes('medicamento')) {
        return 'Receitas médicas podem ser encontradas na seção "Minhas Receitas". Caso não localize, verifique com seu médico.';
    }
    
    if (mensagemLower.includes('obrigado') || mensagemLower.includes('agradeço')) {
        return 'De nada! Estamos aqui para ajudar. Se precisar de mais alguma coisa, é só chamar.';
    }
    
    return 'Obrigado pela sua mensagem. Um de nossos atendentes responderá em breve. Enquanto isso, posso ajudar com:\n\n- Agendamentos\n- Horários de funcionamento\n- Resultados de exames\n- Receitas médicas';
}

/**
 * Adiciona uma mensagem ao chat
 */
function adicionarMensagemAoChat({ texto, tipo, hora }) {
    const chatMensagens = document.getElementById('chat-mensagens');
    
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `mensagem ${tipo}`;
    
    const horaFormatada = hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    mensagemDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <p>${texto}</p>
            <span class="hora-mensagem">${horaFormatada}</span>
        </div>
    `;
    
    chatMensagens.appendChild(mensagemDiv);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

/**
 * Mostra feedback ao usuário
 */
function mostrarFeedback(mensagem, tipo) {
    const feedbackDiv = document.getElementById('feedback');
    if (!feedbackDiv) return;
    
    feedbackDiv.textContent = mensagem;
    feedbackDiv.className = `feedback ${tipo}`;
    feedbackDiv.style.display = 'block';
    
    setTimeout(() => {
        feedbackDiv.style.display = 'none';
    }, 5000);
}