const Player = require('../models/Player');

async function listarInventario(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        return {
            sucesso: true,
            mochila: {
                pesoAtual: player.inventario.mochila.pesoAtual,
                capacidade: player.inventario.limiteMochila,
                items: player.inventario.mochila.items
            },
            equipados: player.inventario.equipados,
            estatisticas: player.inventario.estatisticas
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function usarItem(playerId, itemId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.usarItem(player, itemId);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function equiparItem(playerId, itemId, slot) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.equipar(itemId, slot);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function desequiparItem(playerId, slot) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = player.inventario.desequipar(slot);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function descartarItem(playerId, itemId, quantidade = 1) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.removerItem(itemId, quantidade);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function moverParaCasa(playerId, itemId, localizacao, quantidade = 1) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.moverParaCasa(itemId, localizacao, quantidade);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function adicionarItem(playerId, item, quantidade = 1) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.adicionarItem(item, quantidade);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getResumoInventario(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        return {
            sucesso: true,
            resumo: player.inventario.getResumo()
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    listarInventario,
    usarItem,
    equiparItem,
    desequiparItem,
    descartarItem,
    moverParaCasa,
    adicionarItem,
    getResumoInventario
};