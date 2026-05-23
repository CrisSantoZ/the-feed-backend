const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const LesaoSchema = new mongoose.Schema({
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId() },
    tipo: { 
        type: String, 
        required: true,
        enum: ['corte', 'perfuracao', 'laceracao', 'fratura', 'contusao', 'queimadura', 'hemorragia']
    },
    local: { type: String, required: true },
    gravidade: { type: Number, required: true, min: 1, max: 10 },
    sangrando: { type: Boolean, default: true },
    infeccionado: { type: Boolean, default: false },
    data: { type: Date, default: Date.now },
    tratamentos: [{
        tipo: String,
        data: { type: Date, default: Date.now }
    }]
});

const DoencaSchema = new mongoose.Schema({
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId() },
    nome: { 
        type: String, 
        required: true,
        enum: ['resfriado', 'gripe', 'covid', 'pneumonia', 'dengue', 'infeccao']
    },
    intensidade: { type: Number, default: 30, min: 0, max: 100 },
    contagioso: { type: Boolean, default: true },
    inicio: { type: Date, default: Date.now },
    sintomas: [{
        tipo: String,
        intensidade: Number
    }]
});

const MedicamentoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    dosagem: String,
    inicio: { type: Date, default: Date.now },
    duracaoHoras: { type: Number, required: true },
    ativo: { type: Boolean, default: true }
});

// ==================== SCHEMA PRINCIPAL ====================

const SaudeSchema = new mongoose.Schema({
    // VITAIS
    geral: { type: Number, default: 100, min: 0, max: 100 },
    consciente: { type: Boolean, default: true },
    morto: { type: Boolean, default: false },
    causaMorte: String,
    dataMorte: Date,

    // SISTEMAS ORGÂNICOS
    sistemas: {
        cardiovascular: { type: Number, default: 100, min: 0, max: 100 },
        respiratorio: { type: Number, default: 100, min: 0, max: 100 },
        neurologico: { type: Number, default: 100, min: 0, max: 100 },
        digestivo: { type: Number, default: 100, min: 0, max: 100 },
        imunologico: { type: Number, default: 100, min: 0, max: 100 }
    },

    // MEMBROS
    membros: {
        cabeca: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        pescoco: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        torax: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        abdomen: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        bracoEsquerdo: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        bracoDireito: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        pernaEsquerda: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } },
        pernaDireita: { integridade: { type: Number, default: 100 }, funcional: { type: Boolean, default: true } }
    },

    // SINAIS VITAIS
    sinaisVitais: {
        batimentos: { type: Number, default: 72, min: 0, max: 250 },
        pressaoSistolica: { type: Number, default: 120, min: 0, max: 250 },
        pressaoDiastolica: { type: Number, default: 80, min: 0, max: 150 },
        temperatura: { type: Number, default: 36.5, min: 30, max: 42 },
        saturacaoOxigenio: { type: Number, default: 98, min: 0, max: 100 }
    },

    // SANGUE
    sangue: {
        tipo: { 
            type: String, 
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            default: 'O+'
        },
        volume: { type: Number, default: 5000, min: 0, max: 6000 } // ml
    },

    // DOENÇAS, LESÕES E MEDICAMENTOS
    doencasAtivas: [DoencaSchema],
    lesoes: [LesaoSchema],
    medicamentosAtivos: [MedicamentoSchema],

    // ESTATÍSTICAS FÍSICAS
    estatisticas: {
        peso: { type: Number, default: 70, min: 30, max: 200 },
        altura: { type: Number, default: 170, min: 120, max: 220 },
        imc: { type: Number, default: 24 },
        idadeBiologica: { type: Number, default: 25 }
    },

    // HOSPITALIZAÇÃO
    internado: {
        ativo: { type: Boolean, default: false },
        hospital: String,
        motivo: String,
        dataEntrada: Date,
        dataPrevisaoAlta: Date
    }
});

// ==================== MÉTODOS ====================

// Aplica dano a um membro
SaudeSchema.methods.aplicarDano = function(local, tipo, gravidade) {
    const membro = this.membros[local];
    if (!membro) return false;

    const dano = gravidade * 10;
    membro.integridade = Math.max(0, membro.integridade - dano);
    
    if (membro.integridade <= 0) {
        membro.funcional = false;
    }

    // Reduz saúde geral
    this.geral = Math.max(0, this.geral - (gravidade * 5));

    // Registra lesão
    this.lesoes.push({
        tipo: tipo,
        local: local,
        gravidade: gravidade,
        sangrando: tipo === 'corte' || tipo === 'perfuracao' || tipo === 'hemorragia',
        data: new Date()
    });

    // Perda de sangue
    if (tipo === 'corte' || tipo === 'perfuracao' || tipo === 'hemorragia') {
        this.sangue.volume = Math.max(0, this.sangue.volume - (gravidade * 100));
    }

    // Verifica se desmaia (dor intensa)
    if (gravidade >= 7 && this.consciente) {
        this.consciente = false;
    }

    // Verifica se morreu (dano crítico)
    if (membro.integridade <= 0 && ['cabeca', 'pescoco', 'torax'].includes(local)) {
        this.morto = true;
        this.causaMorte = `${tipo} crítico no ${local}`;
        this.dataMorte = new Date();
        this.geral = 0;
    }

    return true;
};

// Cura um membro ou geral
SaudeSchema.methods.curar = function(quantidade, local = null) {
    if (local && this.membros[local]) {
        this.membros[local].integridade = Math.min(100, this.membros[local].integridade + quantidade);
        if (this.membros[local].integridade > 0) {
            this.membros[local].funcional = true;
        }
    } else {
        this.geral = Math.min(100, this.geral + quantidade);
    }
    return this.geral;
};

// Estanca sangramento de uma lesão
SaudeSchema.methods.estancarSangramento = function(lesaoId) {
    const lesao = this.lesoes.id(lesaoId);
    if (lesao && lesao.sangrando) {
        lesao.sangrando = false;
        lesao.tratamentos.push({ tipo: 'curativo' });
        return true;
    }
    return false;
};

// Administra medicamento
SaudeSchema.methods.aplicarMedicamento = function(nome, dosagem, duracaoHoras) {
    this.medicamentosAtivos.push({
        nome: nome,
        dosagem: dosagem,
        duracaoHoras: duracaoHoras,
        inicio: new Date()
    });
    return true;
};

// Processa efeitos dos medicamentos (chamar a cada hora)
SaudeSchema.methods.processarMedicamentos = function() {
    const agora = new Date();
    this.medicamentosAtivos = this.medicamentosAtivos.filter(med => {
        const horasAtivo = (agora - med.inicio) / (1000 * 60 * 60);
        if (horasAtivo >= med.duracaoHoras) {
            return false; // Remove medicamento expirado
        }
        
        // Aplica efeitos baseado no remédio
        switch(med.nome.toLowerCase()) {
            case 'dipirona':
            case 'paracetamol':
                if (this.sinaisVitais.temperatura > 37) {
                    this.sinaisVitais.temperatura = Math.max(36.5, this.sinaisVitais.temperatura - 0.5);
                }
                break;
            case 'antibiotico':
                this.doencasAtivas.forEach(d => {
                    d.intensidade = Math.max(0, d.intensidade - 5);
                });
                break;
        }
        return true;
    });
};

// Contraí uma doença
SaudeSchema.methods.contrairDoenca = function(nome, intensidade = 30) {
    // Verifica sistema imunológico
    const chanceImune = Math.random() * (this.sistemas.imunologico / 100);
    if (chanceImune > 0.7) return false; // Imune
    
    this.doencasAtivas.push({
        nome: nome,
        intensidade: intensidade,
        inicio: new Date(),
        sintomas: gerarSintomas(nome, intensidade)
    });
    
    return true;
};

// Função auxiliar para gerar sintomas
function gerarSintomas(doenca, intensidade) {
    const sintomasBase = {
        'resfriado': ['coriza', 'tosse', 'espirro'],
        'gripe': ['febre', 'dor_corporal', 'tosse', 'dor_cabeca'],
        'covid': ['febre', 'tosse', 'falta_ar', 'cansaço'],
        'pneumonia': ['febre_alta', 'tosse', 'falta_ar', 'dor_peito'],
        'dengue': ['febre', 'dor_corporal', 'dor_atras_olhos', 'manchas_pele'],
        'infeccao': ['febre', 'dor_local', 'inchaço']
    };
    
    const sintomas = (sintomasBase[doenca] || ['mal estar']).map(s => ({
        tipo: s,
        intensidade: Math.min(100, intensidade + (Math.random() * 20))
    }));
    
    return sintomas;
}

// Atualiza sinais vitais baseado no estado atual
SaudeSchema.methods.atualizarSinaisVitais = function() {
    // Batimentos afetados por febre
    if (this.sinaisVitais.temperatura > 38) {
        this.sinaisVitais.batimentos = 72 + (this.sinaisVitais.temperatura - 38) * 10;
    } else {
        this.sinaisVitais.batimentos = 72;
    }
    
    // Pressão afetada por perda de sangue
    if (this.sangue.volume < 4000) {
        const perdaPercentual = 1 - (this.sangue.volume / 5000);
        this.sinaisVitais.pressaoSistolica = 120 * (1 - perdaPercentual * 0.5);
        this.sinaisVitais.pressaoDiastolica = 80 * (1 - perdaPercentual * 0.3);
    } else {
        this.sinaisVitais.pressaoSistolica = 120;
        this.sinaisVitais.pressaoDiastolica = 80;
    }
    
    // Oxigenação afetada por problemas respiratórios
    if (this.sistemas.respiratorio < 70) {
        this.sinaisVitais.saturacaoOxigenio = 70 + (this.sistemas.respiratorio * 0.3);
    } else {
        this.sinaisVitais.saturacaoOxigenio = 98;
    }
    
    return this.sinaisVitais;
};

// Calcula IMC
SaudeSchema.methods.calcularIMC = function() {
    const alturaM = this.estatisticas.altura / 100;
    this.estatisticas.imc = this.estatisticas.peso / (alturaM * alturaM);
    return this.estatisticas.imc;
};

// Verifica se personagem pode realizar ação
SaudeSchema.methods.podeRealizarAcao = function(acaoFisica = false) {
    if (this.morto) return false;
    if (!this.consciente) return false;
    if (this.geral < 30) return false;
    
    if (acaoFisica) {
        // Ações físicas exigem membros funcionais
        const membrosNecessarios = ['bracoDireito', 'pernaDireita', 'pernaEsquerda'];
        for (const membro of membrosNecessarios) {
            if (!this.membros[membro].funcional) return false;
        }
    }
    
    return true;
};

module.exports = SaudeSchema;