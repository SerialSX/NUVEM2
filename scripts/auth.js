// auth.js - Código completo atualizado

async function checkAuth(requiredType) {
    try {
        const currentUser = Parse.User.current();
        
        // Verifica se há usuário logado
        if (!currentUser) {
            await logout(); // Limpeza completa
            throw new Error('Nenhum usuário logado');
        }
        
        // Verifica sessão no servidor
        await currentUser.fetch({ useMasterKey: true });
        
        // Verifica se o usuário foi deslogado no servidor
        if (!currentUser.authenticated()) {
            await logout();
            throw new Error('Sessão inválida');
        }
        
        // Busca dados específicos do tipo requerido
        if (requiredType === 'medico') {
            const Medico = Parse.Object.extend('Medico');
            const query = new Parse.Query(Medico);
            query.equalTo('user', currentUser);
            const medico = await query.first();
            
            if (!medico) {
                await logout();
                throw new Error('Acesso restrito a médicos');
            }
            
            return {
                user: currentUser,
                tipo: 'medico',
                dados: medico
            };
        } 
        
        if (requiredType === 'paciente') {
            const Paciente = Parse.Object.extend('Paciente');
            const query = new Parse.Query(Paciente);
            query.equalTo('user', currentUser);
            const paciente = await query.first();
            
            if (!paciente) {
                await logout();
                throw new Error('Acesso restrito a pacientes');
            }
            
            return {
                user: currentUser,
                tipo: 'paciente',
                dados: paciente
            };
        }
        
        throw new Error('Tipo de usuário não especificado');
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        await logout();
        throw error;
    }
}

async function logout() {
    try {
        // Limpa todos os dados de sessão
        await Parse.User.logOut();
        sessionStorage.clear();
        localStorage.clear();
        
        // Redireciona para login
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Verificação periódica da sessão
function startSessionCheck() {
    setInterval(async () => {
        const user = Parse.User.current();
        if (user) {
            try {
                await user.fetch({ useMasterKey: true });
                if (!user.authenticated()) {
                    await logout();
                }
            } catch (e) {
                await logout();
            }
        }
    }, 5 * 60 * 1000); // 5 minutos
}

// Inicia a verificação quando o script carrega
startSessionCheck();

// Exporta para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, logout };
}