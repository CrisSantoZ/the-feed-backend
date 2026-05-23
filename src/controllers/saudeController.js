const Player = require('../models/Player');

async function aplicarDano(playerId, local, tipo, gravidade) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = player.saude.aplicarDano(local, tipo, gravidade);
        await player.save();
        
        return {
            sucesso: true,
            saudeGeral: player.saude.geral,
            consciente: player.saude.consciente,
            morto: player.saude.morto,
            causaMorte: player.saude.causaMorte,
            lesao: resultado
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function curar(playerId, quantidade, local = null) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.saude.curar(quantidade, local);
        await player.save();
        
        return {
            sucesso: true,
            saudeGeral: player.saude.geral
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function tomarRemedio(playerId, remedioNome, dosagem) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.saude.aplicarMedicamento(remedioNome, dosagem, 6);
        player.saude.geral = Math.min(100, player.saude.geral + 10);
        
        await player.save();
        
        return {
            sucesso: true,
            saude: player.saude.geral,
            remedio: remedioNome
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function contrairDoenca(playerId, doencaNome, intensidade = 30) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const contraiu = player.saude.contrairDoenca(doencaNome, intensidade);
        
        if (contraiu) {
            await player.save();
            return {
                sucesso: true,
                doenca: doencaNome,
                intensidade: intensidade
            };
        }
        
        return {
            sucesso: false,
            motivo: 'Sistema imunológico resistiu à doença'
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getSinaisVitais(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.saude.atualizarSinaisVitais();
        await player.save();
        
        return {
            sucesso: true,
            sinais: player.saude.sinaisVitais
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    aplicarDano,
    curar,
    tomarRemedio,
    contrairDoenca,
    getSinaisVitais
};