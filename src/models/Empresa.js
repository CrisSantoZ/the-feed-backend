const mongoose = require('mongoose');

const FuncionarioSchema = new mongoose.Schema({
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    cargo: { type: String, required: true },
    salario: { type: Number, required: true },
    dataContratacao: { type: Date, default: Date.now },
    status: { type: String, enum: ['ativo', 'ferias', 'suspenso', 'demitido'], default: 'ativo' },
    desempenho: { type: Number, min: 0, max: 100, default: 50 },
    ultimoPagamento: { type: Date, default: null },
    faltasConsecutivas: { type: Number, default: 0 }
});

const VagaSchema = new mongoose.Schema({
    cargo: { type: String, required: true },
    descricao: String,
    salario: { type: Number, required: true },
    requisitos: {
        habilidades: [{
            nome: String,
            nivelMinimo: { type: Number, default: 0 }
        }],
        nivelMinimo: { type: Number, default: 1 }
    },
    status: { type: String, enum: ['aberta', 'fechada', 'preenchida'], default: 'aberta' },
    candidatos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    dataAbertura: { type: Date, default: Date.now }
});

const UnidadeSchema = new mongoose.Schema({
    nome: String,
    pais: { type: String, default: 'Brasil' },
    estado: String,
    cidade: String,
    endereco: String,
    funcionarios: [FuncionarioSchema],
    capacidadeMaxima: { type: Number, default: 10 },
    nivel: { type: Number, min: 1, max: 10, default: 1 },
    faturamentoBase: { type: Number, default: 1000 }
});

const EmpresaSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    nomeFantasia: String,
    cnpj: { type: String, unique: true, sparse: true },
    descricao: String,
    ramo: { 
        type: String, 
        enum: ['tecnologia', 'comercio', 'servicos', 'industria', 'alimenticio', 'financeiro', 'saude', 'educacao', 'imobiliario', 'transporte', 'construcao', 'entretenimento', 'outro'],
        default: 'outro'
    },
    dono: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    socios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    unidades: [UnidadeSchema],
    vagasAbertas: [VagaSchema],
    
    // Financeiro
    capitalSocial: { type: Number, default: 0 },
    faturamentoMensal: { type: Number, default: 0 },
    lucroMensal: { type: Number, default: 0 },
    despesasFixas: { type: Number, default: 0 },
    saldoConta: { type: Number, default: 0 },
    
    // Reputação
    reputacao: { type: Number, min: 0, max: 100, default: 50 },
    nivel: { type: Number, min: 1, max: 100, default: 1 },
    experiencia: { type: Number, default: 0 },
    
    // Status
    ativa: { type: Boolean, default: true },
    dataFundacao: { type: Date, default: Date.now },
    
    // Estatísticas
    totalFuncionariosContratados: { type: Number, default: 0 },
    totalFuncionariosDemitidos: { type: Number, default: 0 },
    maiorFaturamentoMensal: { type: Number, default: 0 }
}, {
    timestamps: true
});

EmpresaSchema.index({ dono: 1 });
EmpresaSchema.index({ 'unidades.cidade': 1 });
EmpresaSchema.index({ ramo: 1 });

EmpresaSchema.methods.getResumo = function() {
    const totalFuncionarios = this.unidades.reduce((acc, u) => acc + (u.funcionarios?.length || 0), 0);
    const totalVagas = this.vagasAbertas?.filter(v => v.status === 'aberta')?.length || 0;
    
    return {
        id: this._id,
        nome: this.nome,
        nomeFantasia: this.nomeFantasia,
        ramo: this.ramo,
        dono: this.dono,
        nivel: this.nivel,
        reputacao: this.reputacao,
        faturamentoMensal: this.faturamentoMensal,
        lucroMensal: this.lucroMensal,
        totalFuncionarios,
        totalUnidades: this.unidades?.length || 0,
        totalVagasAbertas: totalVagas,
        ativa: this.ativa
    };
};

EmpresaSchema.methods.calcularFaturamento = function() {
    let total = 0;
    for (const unidade of this.unidades || []) {
        const nivelBonus = 1 + (unidade.nivel - 1) * 0.2;
        const funcBonus = 1 + ((unidade.funcionarios?.length || 0) / unidade.capacidadeMaxima) * 0.5;
        total += unidade.faturamentoBase * nivelBonus * funcBonus;
    }
    return Math.round(total);
};

EmpresaSchema.methods.calcularDespesas = function() {
    let total = 0;
    for (const unidade of this.unidades || []) {
        for (const func of unidade.funcionarios || []) {
            if (func.status === 'ativo') {
                total += func.salario;
            }
        }
    }
    return total + (this.despesasFixas || 0);
};

module.exports = mongoose.model('Empresa', EmpresaSchema);
