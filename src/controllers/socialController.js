const Player = require('../models/Player');

async function enviarConviteAmizade(playerId, destinoId, mensagem = '') {
    try {
        const player = await Player.findById(playerId);
        const destino = await Player.findById(destinoId);
        
        if (!player || !destino) {
            return { sucesso: false, erro: 'Jogador não encontrado' };
        }
        
        // Verifica se já são amigos
        const jaAmigo = player.social.amigos.find(a => a.playerId.toString() === destinoId);
        if (jaAmigo) {
            return { sucesso: false, erro: 'Vocês já são amigos' };
        }
        
        const resultado = await player.social.enviarConviteAmizade(destinoId, destino.nome, mensagem);
        await player.save();
        
        return {
            sucesso: resultado.sucesso,
            para: destino.nome,
            convite: resultado.convite
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function aceitarConvite(playerId, conviteId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.aceitarConvite(conviteId);
        
        if (resultado.sucesso) {
            await player.save();
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function recusarConvite(playerId, conviteId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.recusarConvite(conviteId);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function interagirComAmigo(playerId, amigoId, tipoInteracao) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.interagirComAmigo(amigoId, tipoInteracao);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function iniciarRelacionamento(playerId, outroId, nome, tipo = 'namoro') {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.iniciarRelacionamento(outroId, nome, tipo);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function terminarRelacionamento(playerId, motivo) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.terminarRelacionamento(motivo);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function entrarFaccao(playerId, faccaoNome, sigla, descricao, cargo = 'Membro') {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.entrarFaccao(faccaoNome, sigla, descricao, cargo);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function sairFaccao(playerId, motivo) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.sairFaccao(motivo);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getAmigosOnline(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const amigosIds = player.social.getAmigosIds();
        const amigosOnline = await Player.find({
            _id: { $in: amigosIds },
            online: true
        }).select('nome sobrenome');
        
        return {
            sucesso: true,
            amigos: amigosOnline
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getResumoSocial(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        return {
            sucesso: true,
            resumo: player.social.getResumoSocial()
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    enviarConviteAmizade,
    aceitarConvite,
    recusarConvite,
    interagirComAmigo,
    iniciarRelacionamento,
    terminarRelacionamento,
    entrarFaccao,
    sairFaccao,
    getAmigosOnline,
    getResumoSocial
};