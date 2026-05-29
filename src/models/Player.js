const mongoose = require('mongoose');

// Importa TODOS os sistemas modulares
const SaudeSchema = require('./Saude');
const NecessidadesSchema = require('./Necessidades');
const IdiomasSchema = require('./Idiomas');
const LocalizacaoSchema = require('./Localizacao');
const HabilidadesSchema = require('./Habilidades');
const EconomiaSchema = require('./Economia');
const SocialSchema = require('./Social');
const InventarioSchema = require('./Inventario');

const PlayerSchema = new mongoose.Schema({
    // ==================== IDENTIDADE BÁSICA ====================
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    nome: { type: String, required: true, trim: true },
    sobrenome: { type: String, required: true, trim: true },
    dataNascimento: { type: Date, required: true },
    faceclaim: { type: String, required: true, lowercase: true, trim: true },
    avatarUrl: { type: String, required: true },
    dataCriacao: { type: Date, default: Date.now },

    // ==================== SISTEMAS COMPLETOS ====================
    saude: { type: SaudeSchema, default: () => ({}) },
    necessidades: { type: NecessidadesSchema, default: () => ({}) },
    idiomas: { type: IdiomasSchema, default: () => ({}) },
    localizacao: { type: LocalizacaoSchema, default: () => ({}) },
    habilidades: { type: HabilidadesSchema, default: () => ({}) },
    economia: { type: EconomiaSchema, default: () => ({}) },
    social: { type: SocialSchema, default: () => ({}) },
    inventario: { type: InventarioSchema, default: () => ({}) },

    // ==================== ONLINE (Socket.io) ====================
    online: { type: Boolean, default: false },
    ultimoLogin: { type: Date, default: Date.now },
    ultimoLogout: Date,
    socketId: { type: String },
    ipUltimoAcesso: String
});

// ==================== ÍNDICES PARA BUSCAS RÁPIDAS ====================
PlayerSchema.index({ accountId: 1 });
PlayerSchema.index({ nome: 1 });
PlayerSchema.index({ online: 1 });
PlayerSchema.index({ 'localizacao.paisAtual': 1 });
PlayerSchema.index({ 'economia.dinheiroVivo': -1 });
PlayerSchema.index({ 'habilidades.estatisticas.nivelMedio': -1 });

// ==================== MÉTODO: Atualizar status online ====================
PlayerSchema.methods.setOnline = function (socketId, ip = null) {
    this.online = true;
    this.socketId = socketId;
    this.ultimoLogin = new Date();
    if (ip) this.ipUltimoAcesso = ip;
    return this;
};

PlayerSchema.methods.setOffline = function () {
    this.online = false;
    this.ultimoLogout = new Date();
    this.socketId = null;
    return this;
};

// ==================== MÉTODO: Sincronizar moeda com o país atual ====================
PlayerSchema.methods.sincronizarMoeda = async function () {
    try {
        const paisAtual = this.localizacao?.paisAtual;
        if (!paisAtual) return false;

        if (this.economia && this.economia.atualizarMoedaPorPais) {
            const mudou = await this.economia.atualizarMoedaPorPais(paisAtual);
            if (mudou) {
                console.log(`[PLAYER] Moeda sincronizada para ${this.nome}: ${this.economia.simboloMoeda}`);
                return true;
            }
        }
        return false;
    } catch (erro) {
        console.error(`[PLAYER] Erro ao sincronizar moeda:`, erro);
        return false;
    }
};

// ==================== MÉTODO: Tick de atualização (chamar a cada minuto/hora) ====================
PlayerSchema.methods.tick = async function () {
    // Salva o país atual antes de qualquer mudança
    const paisAntes = this.localizacao?.paisAtual;

    // Atualiza necessidades
    if (this.necessidades) {
        this.necessidades.atualizar();
    }

    // Atualiza sinais vitais
    if (this.saude) {
        this.saude.atualizarSinaisVitais();
        this.saude.processarMedicamentos();
    }

    // Efeito das necessidades na saúde
    if (this.saude && this.necessidades) {
        const dano = this.necessidades.getEfeitosNaSaude();
        if (dano > 0) {
            this.saude.geral = Math.max(0, this.saude.geral - dano);
        }
    }

    // Treino diário de habilidades básicas
    if (this.habilidades) {
        await this.habilidades.treinoDiario();
    }

    // Atualiza investimentos
    if (this.economia) {
        this.economia.atualizarInvestimentos();
        this.economia.calcularPatrimonioTotal();
    }

    // ========== Sincronizar moeda se o país mudou ==========
    const paisDepois = this.localizacao?.paisAtual;
    if (paisAntes !== paisDepois && paisDepois) {
        await this.sincronizarMoeda();
    }

    await this.save();
    return this;
};

// ==================== MÉTODO: Resumo completo do personagem ====================
PlayerSchema.methods.getResumoCompleto = function () {
    return {
        // Básico
        id: this._id,
        nome: `${this.nome} ${this.sobrenome}`,
        avatar: this.avatarUrl,

        // Saúde
        saude: {
            geral: this.saude?.geral,
            consciente: this.saude?.consciente,
            doencas: this.saude?.doencasAtivas?.length || 0
        },

        // Necessidades
        necessidades: {
            fome: this.necessidades?.fome,
            sede: this.necessidades?.sede,
            sono: this.necessidades?.sono,
            energia: this.necessidades?.energia,
            ultimaAgua: this.necessidades?.ultimaAgua,
            ultimaRefeicao: this.necessidades?.ultimaRefeicao,
            ultimoSono: this.necessidades?.ultimoSono
        },

        // Localização
        local: {
            pais: this.localizacao?.paisAtual,
            cidade: this.localizacao?.cidadeAtual
        },

        // Nível médio
        nivel: this.habilidades?.estatisticas?.nivelMedio || 1,
        xp: this.habilidades?.estatisticas?.totalXP || 0,

        // Financeiro
        patrimonio: this.economia?.patrimonioTotal || 0,

        // Social
        amigos: this.social?.estatisticas?.totalAmigos || 0,
        popularidade: this.social?.estatisticas?.popularidade || 0,

        // Emprego
        cargo: this.economia?.cargo || null,
        empresa: this.economia?.empresaNome || this.economia?.empresaId || null,
        empresaId: this.economia?.empresaId || null,
        salario: this.economia?.salario || 0,

        // Online
        online: this.online,
        ultimoLogin: this.ultimoLogin
    };
};

module.exports = mongoose.model('Player', PlayerSchema);