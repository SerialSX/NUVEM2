// parseConfig.js - Código completo atualizado

(function() {
    // Configuração do Parse/Back4App
    Parse.initialize(
        "W5KyIvANU5dq4TqZb1mXZGTCyrl9C5M3tQblZiU2",
        "BKg8IMdJ33RLOJq8NEJQw2OXL8vPJoxVdZCG29ui"
    );
    Parse.serverURL = 'https://parseapi.back4app.com/';
    
    // Registro de subclasses personalizadas
    Parse.Object.registerSubclass('Paciente', class Paciente extends Parse.Object {
        constructor() {
            super('Paciente');
        }
        
        get cpf() { return this.get('cpf'); }
        set cpf(value) { this.set('cpf', value); }
        
        get nome() { return this.get('nome'); }
        set nome(value) { this.set('nome', value); }
        
        get telefone() { return this.get('telefone'); }
        set telefone(value) { this.set('telefone', value); }
        
        get plano() { return this.get('plano'); }
        set plano(value) { this.set('plano', value); }
        
        get user() { return this.get('user'); }
        set user(value) { this.set('user', value); }
    });

    Parse.Object.registerSubclass('Medico', class Medico extends Parse.Object {
        constructor() {
            super('Medico');
        }
        
        get crm() { return this.get('crm'); }
        set crm(value) { this.set('crm', value); }
        
        get nome() { return this.get('nome'); }
        set nome(value) { this.set('nome', value); }
        
        get especialidade() { return this.get('especialidade'); }
        set especialidade(value) { this.set('especialidade', value); }
        
        get ativo() { return this.get('ativo'); }
        set ativo(value) { this.set('ativo', value); }
        
        get user() { return this.get('user'); }
        set user(value) { this.set('user', value); }
        
        get clinica() { return this.get('clinica'); }
        set clinica(value) { this.set('clinica', value); }
    });

    Parse.Object.registerSubclass('Consulta', class Consulta extends Parse.Object {
        constructor() {
            super('Consulta');
        }
        
        get medico() { return this.get('medico'); }
        set medico(value) { this.set('medico', value); }
        
        get paciente() { return this.get('paciente'); }
        set paciente(value) { this.set('paciente', value); }
        
        get tipo() { return this.get('tipo'); }
        set tipo(value) { this.set('tipo', value); }
        
        get data() { return this.get('data'); }
        set data(value) { this.set('data', value); }
        
        get status() { return this.get('status'); }
        set status(value) { this.set('status', value); }
    });

    Parse.Object.registerSubclass('Clinica', class Clinica extends Parse.Object {
        constructor() {
            super('Clinica');
        }
        
        get nome() { return this.get('nome'); }
        set nome(value) { this.set('nome', value); }
        
        get endereco() { return this.get('endereco'); }
        set endereco(value) { this.set('endereco', value); }
        
        get bairro() { return this.get('bairro'); }
        set bairro(value) { this.set('bairro', value); }
        
        get telefone() { return this.get('telefone'); }
        set telefone(value) { this.set('telefone', value); }
        
        get email() { return this.get('email'); }
        set email(value) { this.set('email', value); }
        
        get especialidades() { return this.get('especialidades'); }
        set especialidades(value) { this.set('especialidades', value); }
        
        get horarios() { return this.get('horarios'); }
        set horarios(value) { this.set('horarios', value); }
        
        get imagem() { return this.get('imagem'); }
        set imagem(value) { this.set('imagem', value); }
        
        get galeria() { return this.get('galeria'); }
        set galeria(value) { this.set('galeria', value); }
        
        get mediaAvaliacao() { return this.get('mediaAvaliacao'); }
        set mediaAvaliacao(value) { this.set('mediaAvaliacao', value); }
        
        get totalAvaliacoes() { return this.get('totalAvaliacoes'); }
        set totalAvaliacoes(value) { this.set('totalAvaliacoes', value); }
        
        get destaque() { return this.get('destaque'); }
        set destaque(value) { this.set('destaque', value); }
    });

    Parse.Object.registerSubclass('Avaliacao', class Avaliacao extends Parse.Object {
        constructor() {
            super('Avaliacao');
        }
        
        get nota() { return this.get('nota'); }
        set nota(value) { this.set('nota', value); }
        
        get comentario() { return this.get('comentario'); }
        set comentario(value) { this.set('comentario', value); }
        
        get paciente() { return this.get('paciente'); }
        set paciente(value) { this.set('paciente', value); }
        
        get clinica() { return this.get('clinica'); }
        set clinica(value) { this.set('clinica', value); }
    });

    Parse.Object.registerSubclass('AgendamentoClinica', class AgendamentoClinica extends Parse.Object {
        constructor() {
            super('AgendamentoClinica');
        }
        
        get paciente() { return this.get('paciente'); }
        set paciente(value) { this.set('paciente', value); }
        
        get medico() { return this.get('medico'); }
        set medico(value) { this.set('medico', value); }
        
        get clinica() { return this.get('clinica'); }
        set clinica(value) { this.set('clinica', value); }
        
        get especialidade() { return this.get('especialidade'); }
        set especialidade(value) { this.set('especialidade', value); }
        
        get data() { return this.get('data'); }
        set data(value) { this.set('data', value); }
        
        get status() { return this.get('status'); }
        set status(value) { this.set('status', value); }
    });

    console.log('Parse configurado com sucesso');
})();