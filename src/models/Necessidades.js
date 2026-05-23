const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const HistoricoRefeicaoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['cafe', 'almoco', 'janta', 'lanche'] },
    alimentos: [String],
    calorias: Number,
    data: { type: Date, default: Date.now }
});

const SonaRepousoSchema = new mongoose.Schema({
    inicio: Date,
    fim: Date,
    duracaoHoras: Number,
    qualidade: { type: Number, min: 0, max: 100 },
    pesadelo: { type: Boolean, default: false },
    local: String
});

const HigieneRepentinaSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['banho', 'escovar_dentes', 'cabelo', 'barba'] },
    data: { type: Date, default: Date.now }
});

// ==================== SCHEMA PRINCIPAL ====================

const NecessidadesSchema = new mongoose.Schema({
    // ==================== NECESSIDADES BÁSICAS ====================
    // FOME (0 = cheio, 100 = faminto)
    fome: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        description: "0=cheio, 50=com fome, 80=faminto, 100=passando fome"
    },
    
    // SEDE (0 = hidratado, 100 = desidratado)
    sede: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        description: "0=hidratado, 50=com sede, 80=desidratado, 100=desidratação severa"
    },
    
    // SONO (0 = descansado, 100 = exausto)
    sono: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        description: "0=descansado, 50=cansado, 80=exausto, 100=colapso"
    },
    
    // ==================== NECESSIDADES SOCIAIS ====================
    // SOCIAL (0 = solitário, 100 = feliz interagindo)
    social: { 
        type: Number, 
        default: 70, 
        min: 0, 
        max: 100,
        description: "0=solitário/depressivo, 70=normal, 100=feliz rodeado"
    },
    
    // LAZER/DIVERSÃO (0 = entediado, 100 = muito divertido)
    lazer: { 
        type: Number, 
        default: 70, 
        min: 0, 
        max: 100,
        description: "0=entediado/depressivo, 70=normal, 100=muito feliz"
    },
    
    // ==================== NECESSIDADES BIOLÓGICAS ====================
    // BANHEIRO (0 = vazio, 100 = urgente)
    banheiro: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100,
        description: "0=vazio, 50=quer ir, 80=urgente, 100=acidente"
    },
    
    // HIGIENE (0 = imundo, 100 = limpo)
    higiene: { 
        type: Number, 
        default: 100, 
        min: 0, 
        max: 100,
        description: "0=imundo/cheiro ruim, 50=precisa de banho, 100=limpo"
    },
    
    // ==================== NECESSIDADES SECUNDÁRIAS ====================
    // INTIMIDADE/Sexual (0 = normal, 100 = necessidade extrema)
    intimidade: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: "0=normal, 50=desejo, 100=necessidade extrema"
    },
    
    // SEGURANÇA (0 = seguro, 100 = extremamente inseguro)
    seguranca: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
        description: "0=tranquilo, 50=normal, 100=paranoico/inseguro"
    },
    
    // ==================== HISTÓRICO ====================
    ultimaRefeicao: { type: Date, default: Date.now },
    ultimaAgua: { type: Date, default: Date.now },
    ultimoSono: { type: Date, default: Date.now },
    ultimoBanho: { type: Date, default: Date.now },
    ultimoSocial: { type: Date, default: Date.now },
    ultimoLazer: { type: Date, default: Date.now },
    ultimoBanheiro: { type: Date, default: Date.now },
    
    // Histórico detalhado
    historicoRefeicoes: [HistoricoRefeicaoSchema],
    historicoSono: [SonaRepousoSchema],
    historicoHigiene: [HigieneRepentinaSchema],
    
    // Estatísticas diárias
    caloriasConsumidasHoje: { type: Number, default: 0 },
    aguaConsumidaHoje: { type: Number, default: 0 }, // ml
    passosDia: { type: Number, default: 0 },
    
    // Estado atual
    estado: {
        desmaiadoPorExaustao: { type: Boolean, default: false },
        vomitou: { type: Boolean, default: false },
        intoxicado: { type: Boolean, default: false },
        intoxicacaoGravidade: { type: Number, default: 0 }
    },
    
    // Preferências e restrições
    preferencias: {
        comidaFavorita: String,
        comidaOdiada: String,
        bebidaFavorita: String,
        vegetariano: { type: Boolean, default: false },
        vegano: { type: Boolean, default: false },
        alergias: [String]
    },
    
    // Data para reset diário
    ultimoResetDiario: { type: Date, default: Date.now }
});

// ==================== MÉTODOS ====================

// COMER - Alimenta o personagem
NecessidadesSchema.methods.comer = function(comida, calorias, qualidade = 50) {
    // Reduz a fome proporcionalmente às calorias
    const reducao = Math.min(100, calorias / 20);
    this.fome = Math.max(0, this.fome - reducao);
    
    // Se estava com muita fome, pode passar mal
    if (this.fome > 80 && calorias > 500) {
        this.estado.vomitou = true;
    }
    
    // Adiciona ao histórico
    this.historicoRefeicoes.push({
        tipo: this.definirTipoRefeicao(),
        alimentos: [comida],
        calorias: calorias,
        data: new Date()
    });
    
    this.caloriasConsumidasHoje += calorias;
    this.ultimaRefeicao = new Date();
    
    // Verifica restrições alimentares
    if (this.preferencias.vegetariano && comida.includes('carne')) {
        this.estado.vomitou = true;
        this.fome = Math.min(100, this.fome + 20);
        return { sucesso: false, motivo: "Você é vegetariano!" };
    }
    
    return { sucesso: true, fomeRestante: this.fome };
};

// BEBER - Hidrata o personagem
NecessidadesSchema.methods.beber = function(quantidadeML, bebida = 'agua') {
    const reducao = quantidadeML / 50;
    this.sede = Math.max(0, this.sede - reducao);
    this.aguaConsumidaHoje += quantidadeML;
    this.ultimaAgua = new Date();
    
    // Álcool tem efeitos colaterais
    if (bebida !== 'agua') {
        this.estado.intoxicado = true;
        this.estado.intoxicacaoGravidade += quantidadeML / 100;
    }
    
    return { sucesso: true, sedeRestante: this.sede };
};

// DORMIR - Recupera o sono
NecessidadesSchema.methods.dormir = function(horas, qualidade = 70) {
    const reducao = horas * 8; // 8% por hora de sono
    this.sono = Math.max(0, this.sono - reducao);
    
    this.historicoSono.push({
        inicio: new Date(Date.now() - (horas * 60 * 60 * 1000)),
        fim: new Date(),
        duracaoHoras: horas,
        qualidade: qualidade,
        pesadelo: qualidade < 30,
        local: this.localAtual || 'desconhecido'
    });
    
    this.ultimoSono = new Date();
    
    // Recupera um pouco de social e lazer (sonho)
    this.social = Math.min(100, this.social + (horas * 2));
    this.lazer = Math.min(100, this.lazer + (horas * 1));
    
    // Reset de banheiro ao acordar
    this.banheiro = Math.min(100, this.banheiro + 30);
    
    return { sucesso: true, sonoRestante: this.sono };
};

// USAR BANHEIRO
NecessidadesSchema.methods.usarBanheiro = function() {
    this.banheiro = 0;
    this.ultimoBanheiro = new Date();
    return true;
};

// TOMAR BANHO
NecessidadesSchema.methods.tomarBanho = function() {
    this.higiene = 100;
    this.ultimoBanho = new Date();
    
    this.historicoHigiene.push({
        tipo: 'banho',
        data: new Date()
    });
    
    // Banho dá uma leve recuperada no social
    this.social = Math.min(100, this.social + 5);
    
    return true;
};

// INTERAGIR SOCIALMENTE
NecessidadesSchema.methods.interagirSocial = function(tipo, duracaoMinutos) {
    let ganho = duracaoMinutos / 5; // 1 ponto a cada 5 minutos
    
    switch(tipo) {
        case 'conversa': ganho *= 0.8; break;
        case 'festa': ganho *= 1.5; break;
        case 'encontro': ganho *= 2; break;
        case 'trabalho': ganho *= 0.3; break;
        default: ganho *= 1;
    }
    
    this.social = Math.min(100, this.social + ganho);
    this.ultimoSocial = new Date();
    
    return { sucesso: true, socialAtual: this.social };
};

// LAZER/DIVERSÃO
NecessidadesSchema.methods.seDivertir = function(atividade, duracaoMinutos) {
    let ganho = duracaoMinutos / 4;
    
    const multiplicadores = {
        'jogar': 1,
        'netflix': 0.8,
        'academia': 0.5,
        'clube': 1.2,
        'natureza': 1.5,
        'leitura': 0.6
    };
    
    ganho *= (multiplicadores[atividade] || 1);
    this.lazer = Math.min(100, this.lazer + ganho);
    this.ultimoLazer = new Date();
    
    return { sucesso: true, lazerAtual: this.lazer };
};

// INTIMIDADE
NecessidadesSchema.methods.satisfazerIntimidade = function() {
    this.intimidade = 0;
    this.social = Math.min(100, this.social + 20);
    this.lazer = Math.min(100, this.lazer + 15);
    return true;
};

// ==================== ATUALIZAÇÃO PASSIVA ====================
// Deve ser chamada a cada HORA do jogo (ou minuto, dependendo da escala)
NecessidadesSchema.methods.atualizar = function() {
    const agora = new Date();
    const horasDesdeUltimaRefeicao = (agora - this.ultimaRefeicao) / (1000 * 60 * 60);
    const horasDesdeUltimaAgua = (agora - this.ultimaAgua) / (1000 * 60 * 60);
    const horasDesdeUltimoSono = (agora - this.ultimoSono) / (1000 * 60 * 60);
    const horasDesdeUltimoBanheiro = (agora - this.ultimoBanheiro) / (1000 * 60 * 60);
    const horasDesdeUltimoBanho = (agora - this.ultimoBanho) / (1000 * 60 * 60);
    const horasDesdeUltimoSocial = (agora - this.ultimoSocial) / (1000 * 60 * 60);
    const horasDesdeUltimoLazer = (agora - this.ultimoLazer) / (1000 * 60 * 60);
    
    // ===== FOME =====
    if (horasDesdeUltimaRefeicao > 0) {
        this.fome = Math.min(100, this.fome + (horasDesdeUltimaRefeicao * 2));
    }
    
    // ===== SEDE ===== (mais rápida que fome)
    if (horasDesdeUltimaAgua > 0) {
        this.sede = Math.min(100, this.sede + (horasDesdeUltimaAgua * 3));
    }
    
    // ===== SONO ===== (acumula quando acordado)
    if (horasDesdeUltimoSono > 0 && !this.estado.desmaiadoPorExaustao) {
        this.sono = Math.min(100, this.sono + (horasDesdeUltimoSono * 4));
    }
    
    // ===== BANHEIRO =====
    if (horasDesdeUltimoBanheiro > 0) {
        this.banheiro = Math.min(100, this.banheiro + (horasDesdeUltimoBanheiro * 15));
    }
    
    // ===== HIGIENE =====
    if (horasDesdeUltimoBanho > 0) {
        this.higiene = Math.max(0, this.higiene - (horasDesdeUltimoBanho * 3));
    }
    
    // ===== SOCIAL =====
    if (horasDesdeUltimoSocial > 0 && !this.estado.desmaiadoPorExaustao) {
        this.social = Math.max(0, this.social - (horasDesdeUltimoSocial * 2));
    }
    
    // ===== LAZER =====
    if (horasDesdeUltimoLazer > 0 && !this.estado.desmaiadoPorExaustao) {
        this.lazer = Math.max(0, this.lazer - (horasDesdeUltimoLazer * 2));
    }
    
    // ===== INTIMIDADE ===== (sobe naturalmente)
    this.intimidade = Math.min(100, this.intimidade + 0.5);
    
    // ===== VERIFICAÇÕES DE EMERGÊNCIA =====
    
    // Fome extrema (acima de 90)
    if (this.fome >= 90) {
        this.estado.desmaiadoPorExaustao = true;
    }
    
    // Sede extrema (acima de 90)
    if (this.sede >= 90) {
        this.estado.desmaiadoPorExaustao = true;
    }
    
    // Sono extremo (acima de 95)
    if (this.sono >= 95 && !this.estado.desmaiadoPorExaustao) {
        this.estado.desmaiadoPorExaustao = true;
    }
    
    // Banheiro urgente (acima de 95)
    if (this.banheiro >= 95) {
        // Acidente!
        this.higiene = Math.max(0, this.higiene - 50);
        this.social = Math.max(0, this.social - 20);
        this.banheiro = 50; // aliviou parcialmente
    }
    
    // Baixa social/lazer afeta felicidade geral
    if (this.social < 20 || this.lazer < 20) {
        // Isso afetará saúde no sistema de saúde
        this.estado.deprimido = true;
    }
    
    // Intoxicação
    if (this.estado.intoxicado && this.estado.intoxicacaoGravidade > 10) {
        this.estado.vomitou = true;
        this.estado.intoxicacaoGravidade -= 2;
        
        // Perde fluidos
        this.sede += 10;
        this.fome += 5;
    }
    
    // Reset diário
    this.verificarResetDiario();
    
    return this;
};

// Reset diário de estatísticas
NecessidadesSchema.methods.verificarResetDiario = function() {
    const agora = new Date();
    const ultimoReset = this.ultimoResetDiario;
    
    if (agora.getDate() !== ultimoReset.getDate() || 
        agora.getMonth() !== ultimoReset.getMonth() ||
        agora.getFullYear() !== ultimoReset.getFullYear()) {
        
        // Novo dia!
        this.caloriasConsumidasHoje = 0;
        this.aguaConsumidaHoje = 0;
        this.passosDia = 0;
        this.ultimoResetDiario = agora;
        
        // Pequena recuperação de algumas necessidades
        this.social = Math.min(100, this.social + 10);
        this.lazer = Math.min(100, this.lazer + 5);
    }
};

// Função auxiliar para definir tipo de refeição
function definirTipoRefeicao() {
    const hora = new Date().getHours();
    if (hora < 11) return 'cafe';
    if (hora < 15) return 'almoco';
    if (hora < 19) return 'lanche';
    return 'janta';
}

// Efeito no sistema de saúde (para ser usado externamente)
NecessidadesSchema.methods.getEfeitosNaSaude = function() {
    let dano = 0;
    
    if (this.fome > 80) dano += 2;
    if (this.sede > 80) dano += 3;
    if (this.sono > 80) dano += 2;
    if (this.higiene < 20) dano += 1;
    if (this.social < 20) dano += 1;
    if (this.lazer < 20) dano += 1;
    
    return dano;
};

module.exports = NecessidadesSchema;