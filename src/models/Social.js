const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const AmizadeSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    nome: String, // cache do nome para não precisar buscar
    nivelAmizade: { type: Number, default: 10, min: 0, max: 100 },
    xpAmizade: { type: Number, default: 0 },
    ultimaInteracao: { type: Date, default: Date.now },
    dataInicio: { type: Date, default: Date.now },
    presentesTrocados: [{
        item: String,
        data: Date,
        enviadoPor: String
    }],
    conversas: [{
        mensagem: String,
        data: Date,
        lida: { type: Boolean, default: false }
    }],
    status: { type: String, enum: ['amigos', 'melhores_amigos', 'conhecidos', 'afastados', 'bloqueado'], default: 'conhecidos' }
});

const RelacionamentoSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    nome: String,
    tipo: { type: String, enum: ['namoro', 'casado', 'ficante', 'ex', 'interesse'] },
    nivelIntimidade: { type: Number, default: 0, min: 0, max: 100 },
    inicioRelacionamento: { type: Date, default: Date.now },
    dataTermino: Date,
    fotosJuntos: [String],
    lugaresVisitados: [{
        lugar: String,
        data: Date
    }],
    aliança: { type: Boolean, default: false }
});

const InimizadeSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    nome: String,
    motivo: String,
    nivelHostilidade: { type: Number, default: 50, min: 0, max: 100 },
    dataInicio: { type: Date, default: Date.now },
    confrontos: [{
        motivo: String,
        data: Date,
        resultado: String
    }]
});

const FaccaoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sigla: String,
    descricao: String,
    cargo: { type: String, default: 'Membro' },
    nivelHierarquia: { type: Number, default: 1, min: 1, max: 10 },
    dataEntrada: { type: Date, default: Date.now },
    contribuicoes: { type: Number, default: 0 },
    missoesCompletadas: { type: Number, default: 0 }
});

const ConviteSchema = new mongoose.Schema({
    de: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    deNome: String,
    tipo: { type: String, enum: ['amizade', 'faccao', 'evento', 'negocio'] },
    mensagem: String,
    data: { type: Date, default: Date.now },
    status: { type: String, enum: ['pendente', 'aceito', 'recusado'], default: 'pendente' }
});

const ReputacaoSchema = new mongoose.Schema({
    categoria: { type: String, enum: ['geral', 'profissional', 'social', 'criminal'] },
    valor: { type: Number, default: 0, min: -100, max: 100 },
    historico: [{
                motivo: String,
                mudanca: Number,
                data: Date,
                de: String
    }]
});

const EventoSocialSchema = new mongoose.Schema({
    nome: String,
    tipo: { type: String, enum: ['festa', 'encontro', 'reuniao', 'show', 'viagem'] },
    localizacao: String,
    data: Date,
    participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    criador: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    convidados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    status: { type: String, enum: ['planejado', 'acontecendo', 'finalizado', 'cancelado'] }
});

// ==================== SCHEMA PRINCIPAL ====================

const SocialSchema = new mongoose.Schema({
    // ==================== AMIZADES ====================
    amigos: [AmizadeSchema],
    melhoresAmigos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    pedidosPendentes: [ConviteSchema],
    convitesRecebidos: [ConviteSchema],
    
    // ==================== RELACIONAMENTOS ====================
    relacionamentos: [RelacionamentoSchema],
    relacionamentoAtivo: { type: mongoose.Schema.Types.ObjectId },
    
    // ==================== INIMIGOS ====================
    inimigos: [InimizadeSchema],
    blockedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    
    // ==================== FACÇÕES ====================
    faccoes: [FaccaoSchema],
    faccaoAtiva: { type: mongoose.Schema.Types.ObjectId },
    
    // ==================== REPUTAÇÃO ====================
    reputacao: [ReputacaoSchema],
    
    // ==================== EVENTOS ====================
    eventosCriados: [EventoSocialSchema],
    eventosParticipando: [{ type: mongoose.Schema.Types.ObjectId }],
    
    // ==================== NETWORKING ====================
    contatosProfissionais: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        area: String,
        ultimoContato: Date,
        oportunidades: [String]
    }],
    
    // ==================== ESTATÍSTICAS SOCIAIS ====================
    estatisticas: {
        totalAmigos: { type: Number, default: 0 },
        totalInimigos: { type: Number, default: 0 },
        relacionamentosSerios: { type: Number, default: 0 },
        faccoesParticipadas: { type: Number, default: 0 },
        eventosParticipados: { type: Number, default: 0 },
        convitesEnviados: { type: Number, default: 0 },
        convitesRecebidos: { type: Number, default: 0 },
        popularidade: { type: Number, default: 0, min: 0, max: 100 }, // baseado em amigos + reputação
        nivelSocial: { type: Number, default: 1, min: 1, max: 10 }
    },
    
    // ==================== PREFERÊNCIAS ====================
    preferencias: {
        privacy: { type: String, enum: ['publico', 'amigos', 'privado'], default: 'publico' },
        aceitarConvitesAutomaticamente: { type: Boolean, default: false },
        mostrarOnline: { type: Boolean, default: true },
        bio: { type: String, maxLength: 500 },
        interesses: [String]
    },
    
    ultimaAtualizacao: { type: Date, default: Date.now }
});

// ==================== MÉTODOS ====================

// Enviar convite de amizade
SocialSchema.methods.enviarConviteAmizade = async function(playerIdDestino, nomeDestino, mensagem = '') {
    // Verifica se já são amigos
    const jaAmigo = this.amigos.find(a => a.playerId.toString() === playerIdDestino);
    if (jaAmigo) return { sucesso: false, motivo: 'Já são amigos' };
    
    // Verifica se já tem convite pendente
    const conviteExistente = this.convitesEnviados?.find(c => 
        c.de.toString() === playerIdDestino && c.status === 'pendente'
    );
    if (conviteExistente) return { sucesso: false, motivo: 'Convite já enviado' };
    
    this.convitesEnviados?.push({
        de: playerIdDestino,
        deNome: nomeDestino,
        tipo: 'amizade',
        mensagem: mensagem,
        data: new Date()
    });
    
    this.estatisticas.convitesEnviados += 1;
    
    return { sucesso: true, convite: conviteExistente };
};

// Aceitar convite de amizade
SocialSchema.methods.aceitarConvite = async function(conviteId) {
    const convite = this.convitesRecebidos.id(conviteId);
    if (!convite) return { sucesso: false, motivo: 'Convite não encontrado' };
    
    // Adiciona aos amigos
    this.amigos.push({
        playerId: convite.de,
        nome: convite.deNome,
        dataInicio: new Date(),
        status: 'amigos'
    });
    
    convite.status = 'aceito';
    this.estatisticas.totalAmigos += 1;
    
    // Aumenta popularidade
    this.estatisticas.popularidade = Math.min(100, this.estatisticas.popularidade + 2);
    
    return { sucesso: true, novoAmigo: convite.deNome };
};

// Recusar convite
SocialSchema.methods.recusarConvite = async function(conviteId) {
    const convite = this.convitesRecebidos.id(conviteId);
    if (!convite) return { sucesso: false, motivo: 'Convite não encontrado' };
    
    convite.status = 'recusado';
    return { sucesso: true };
};

// Interagir com amigo
SocialSchema.methods.interagirComAmigo = async function(playerId, tipoInteracao) {
    const amigo = this.amigos.find(a => a.playerId.toString() === playerId);
    if (!amigo) return { sucesso: false, motivo: 'Não é amigo' };
    
    // Ganha XP de amizade baseado na interação
    let xpGanho = 0;
    switch(tipoInteracao) {
        case 'conversa': xpGanho = 5; break;
        case 'presente': xpGanho = 20; break;
        case 'ajuda': xpGanho = 15; break;
        case 'saida': xpGanho = 10; break;
        default: xpGanho = 3;
    }
    
    amigo.xpAmizade += xpGanho;
    amigo.ultimaInteracao = new Date();
    
    // Sobe nível de amizade a cada 100 XP
    let subiuNivel = false;
    while (amigo.xpAmizade >= 100 && amigo.nivelAmizade < 100) {
        amigo.xpAmizade -= 100;
        amigo.nivelAmizade += 10;
        subiuNivel = true;
        
        // Atualiza status baseado no nível
        if (amigo.nivelAmizade >= 80) {
            amigo.status = 'melhores_amigos';
            if (!this.melhoresAmigos.includes(playerId)) {
                this.melhoresAmigos.push(playerId);
            }
        } else if (amigo.nivelAmizade >= 40) {
            amigo.status = 'amigos';
        }
    }
    
    // Aumenta reputação social
    this.aumentarReputacao('social', 2, 'Interação positiva');
    
    return {
        sucesso: true,
        novoNivel: amigo.nivelAmizade,
        subiuNivel: subiuNivel,
        status: amigo.status
    };
};

// Iniciar relacionamento romântico
SocialSchema.methods.iniciarRelacionamento = async function(playerId, nome, tipo = 'namoro') {
    // Verifica se já tem relacionamento ativo
    if (this.relacionamentoAtivo) {
        const relAtivo = this.relacionamentos.id(this.relacionamentoAtivo);
        if (relAtivo && !relAtivo.dataTermino) {
            return { sucesso: false, motivo: 'Você já está em um relacionamento' };
        }
    }
    
    const novoRelacionamento = {
        playerId: playerId,
        nome: nome,
        tipo: tipo,
        inicioRelacionamento: new Date(),
        nivelIntimidade: 10
    };
    
    this.relacionamentos.push(novoRelacionamento);
    this.relacionamentoAtivo = novoRelacionamento._id;
    this.estatisticas.relacionamentosSerios += 1;
    
    // Aumenta reputação social
    this.aumentarReputacao('social', 5, `Iniciou um ${tipo}`);
    
    return { sucesso: true, relacionamento: novoRelacionamento };
};

// Terminar relacionamento
SocialSchema.methods.terminarRelacionamento = async function(motivo) {
    if (!this.relacionamentoAtivo) {
        return { sucesso: false, motivo: 'Não está em um relacionamento' };
    }
    
    const relacionamento = this.relacionamentos.id(this.relacionamentoAtivo);
    if (relacionamento) {
        relacionamento.dataTermino = new Date();
        relacionamento.tipo = 'ex';
    }
    
    this.relacionamentoAtivo = null;
    
    // Pode afetar reputação dependendo do motivo
    if (motivo === 'traicao') {
        this.aumentarReputacao('social', -15, 'Terminou relacionamento por infidelidade');
    } else {
        this.aumentarReputacao('social', -5, 'Relacionamento terminado');
    }
    
    return { sucesso: true };
};

// Aumentar intimidade (namoro/casamento)
SocialSchema.methods.aumentarIntimidade = async function(quantidade) {
    if (!this.relacionamentoAtivo) {
        return { sucesso: false, motivo: 'Sem relacionamento ativo' };
    }
    
    const relacionamento = this.relacionamentos.id(this.relacionamentoAtivo);
    if (relacionamento) {
        relacionamento.nivelIntimidade = Math.min(100, relacionamento.nivelIntimidade + quantidade);
        
        if (relacionamento.nivelIntimidade >= 80 && relacionamento.tipo === 'namoro') {
            relacionamento.tipo = 'casado';
        }
        
        return {
            sucesso: true,
            novoNivel: relacionamento.nivelIntimidade,
            status: relacionamento.tipo
        };
    }
    
    return { sucesso: false };
};

// Adicionar inimigo
SocialSchema.methods.adicionarInimigo = async function(playerId, nome, motivo) {
    // Verifica se já é inimigo
    const inimigoExistente = this.inimigos.find(i => i.playerId.toString() === playerId);
    if (inimigoExistente) {
        inimigoExistente.nivelHostilidade = Math.min(100, inimigoExistente.nivelHostilidade + 20);
        return { sucesso: true, nivelHostilidade: inimigoExistente.nivelHostilidade };
    }
    
    this.inimigos.push({
        playerId: playerId,
        nome: nome,
        motivo: motivo,
        dataInicio: new Date()
    });
    
    this.estatisticas.totalInimigos += 1;
    
    // Remove dos amigos se existir
    const indexAmigo = this.amigos.findIndex(a => a.playerId.toString() === playerId);
    if (indexAmigo !== -1) {
        this.amigos.splice(indexAmigo, 1);
        this.estatisticas.totalAmigos -= 1;
    }
    
    // Diminui reputação
    this.aumentarReputacao('social', -10, `Inimizade com ${nome}`);
    
    return { sucesso: true };
};

// Entrar em facção
SocialSchema.methods.entrarFaccao = async function(nome, sigla, descricao, cargo = 'Membro') {
    // Verifica se já está em uma facção
    if (this.faccaoAtiva) {
        return { sucesso: false, motivo: 'Você já está em uma facção' };
    }
    
    this.faccoes.push({
        nome: nome,
        sigla: sigla,
        descricao: descricao,
        cargo: cargo,
        dataEntrada: new Date()
    });
    
    this.faccaoAtiva = this.faccoes[this.faccoes.length - 1]._id;
    this.estatisticas.faccoesParticipadas += 1;
    
    // Aumenta reputação (dependendo da facção)
    this.aumentarReputacao('social', 10, `Entrou na facção ${nome}`);
    
    return { sucesso: true, faccao: nome };
};

// Sair da facção
SocialSchema.methods.sairFaccao = async function(motivo) {
    if (!this.faccaoAtiva) {
        return { sucesso: false, motivo: 'Não está em uma facção' };
    }
    
    const faccao = this.faccoes.id(this.faccaoAtiva);
    if (faccao) {
        // Mantém no histórico mas marca como inativa
        // (pode implementar campo 'ativo' se quiser)
    }
    
    this.faccaoAtiva = null;
    
    this.aumentarReputacao('social', -5, `Saiu da facção ${faccao?.nome}`);
    
    return { sucesso: true };
};

// Aumentar reputação
SocialSchema.methods.aumentarReputacao = function(categoria, valor, motivo) {
    let rep = this.reputacao.find(r => r.categoria === categoria);
    if (!rep) {
        this.reputacao.push({
            categoria: categoria,
            valor: 0,
            historico: []
        });
        rep = this.reputacao.find(r => r.categoria === categoria);
    }
    
    const valorAntigo = rep.valor;
    rep.valor = Math.min(100, Math.max(-100, rep.valor + valor));
    rep.historico.push({
        motivo: motivo,
        mudanca: valor,
        data: new Date(),
        de: `De ${valorAntigo} para ${rep.valor}`
    });
    
    // Recalcula popularidade
    this.recalcularPopularidade();
    
    return { sucesso: true, novoValor: rep.valor };
};

// Recalcular popularidade
SocialSchema.methods.recalcularPopularidade = function() {
    let total = 0;
    let peso = 0;
    
    // Baseado em amigos
    total += this.estatisticas.totalAmigos * 2;
    peso += 2;
    
    // Baseado em reputação geral
    const repGeral = this.reputacao.find(r => r.categoria === 'geral');
    if (repGeral) {
        total += repGeral.valor;
        peso += 1;
    }
    
    // Baseado em relacionamentos
    if (this.relacionamentos.length > 0) {
        total += 10;
        peso += 1;
    }
    
    this.estatisticas.popularidade = Math.min(100, Math.max(0, total / peso));
    
    // Calcula nível social (1-10)
    this.estatisticas.nivelSocial = Math.max(1, Math.min(10, Math.floor(this.estatisticas.popularidade / 10) + 1));
};

// Criar evento social
SocialSchema.methods.criarEvento = async function(nome, tipo, localizacao, data, convidados = []) {
    const evento = {
        nome: nome,
        tipo: tipo,
        localizacao: localizacao,
        data: data,
        criador: this._id,
        convidados: convidados,
        status: 'planejado'
    };
    
    this.eventosCriados.push(evento);
    this.estatisticas.eventosParticipados += 1;
    
    return { sucesso: true, evento: evento };
};

// Participar de evento
SocialSchema.methods.participarEvento = async function(eventoId) {
    if (!this.eventosParticipando.includes(eventoId)) {
        this.eventosParticipando.push(eventoId);
        this.estatisticas.eventosParticipados += 1;
        
        // Ganha reputação social
        this.aumentarReputacao('social', 3, 'Participou de um evento');
    }
    
    return { sucesso: true };
};

// Bloquear jogador
SocialSchema.methods.bloquearJogador = async function(playerId) {
    if (!this.blockedPlayers.includes(playerId)) {
        this.blockedPlayers.push(playerId);
        
        // Remove dos amigos se existir
        const indexAmigo = this.amigos.findIndex(a => a.playerId.toString() === playerId);
        if (indexAmigo !== -1) {
            this.amigos.splice(indexAmigo, 1);
            this.estatisticas.totalAmigos -= 1;
        }
        
        // Remove dos inimigos se existir
        const indexInimigo = this.inimigos.findIndex(i => i.playerId.toString() === playerId);
        if (indexInimigo !== -1) {
            this.inimigos.splice(indexInimigo, 1);
            this.estatisticas.totalInimigos -= 1;
        }
    }
    
    return { sucesso: true };
};

// Listar amigos online (para uso com socket.io)
SocialSchema.methods.getAmigosIds = function() {
    return this.amigos.map(a => a.playerId.toString());
};

// Resumo social do personagem
SocialSchema.methods.getResumoSocial = function() {
    return {
        totalAmigos: this.estatisticas.totalAmigos,
        totalInimigos: this.estatisticas.totalInimigos,
        melhoresAmigos: this.melhoresAmigos.length,
        emRelacionamento: !!this.relacionamentoAtivo,
        faccaoAtiva: this.faccoes.find(f => f._id.toString() === this.faccaoAtiva?.toString())?.nome || null,
        popularidade: this.estatisticas.popularidade,
        nivelSocial: this.estatisticas.nivelSocial,
        reputacaoGeral: this.reputacao.find(r => r.categoria === 'geral')?.valor || 0
    };
};

module.exports = SocialSchema;