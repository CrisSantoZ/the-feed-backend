const Player = require('../models/Player');

function configurarInventarioSocket(io, socket) {
    
    // Listar itens do inventário
    socket.on('listarInventario', async (playerId) => {
        const player = await Player.findById(playerId);
        
        if (player && player.inventario) {
            socket.emit('inventarioListado', {
                mochila: {
                    pesoAtual: player.inventario.mochila.pesoAtual,
                    capacidade: player.inventario.limiteMochila,
                    items: player.inventario.mochila.items
                },
                equipados: player.inventario.equipados
            });
        }
    });
    
    // Usar item
    socket.on('usarItem', async (data) => {
        const { playerId, itemId } = data;
        const player = await Player.findById(playerId);
        
        if (player) {
            const resultado = await player.inventario.usarItem(player, itemId);
            
            if (resultado.sucesso) {
                await player.save();
                socket.emit('itemUsado', {
                    efeitos: resultado.efeitos,
                    expirado: resultado.expirado
                });
                
                // Atualiza status
                socket.emit('statusAtualizado', {
                    fome: player.necessidades?.fome,
                    sede: player.necessidades?.sede,
                    saude: player.saude?.geral
                });
            } else {
                socket.emit('erroServidor', resultado.motivo);
            }
        }
    });
    
    // Equipar item (roupa, acessório)
    socket.on('equipar', async (data) => {
        const { playerId, itemId, slot } = data;
        const player = await Player.findById(playerId);
        
        if (player && player.inventario) {
            const resultado = await player.inventario.equipar(itemId, slot);
            await player.save();
            
            if (resultado.sucesso) {
                socket.emit('itemEquipado', {
                    item: resultado.item,
                    slot: resultado.slot
                });
            } else {
                socket.emit('erroServidor', resultado.motivo);
            }
        }
    });
    
    // Desequipar item
    socket.on('desequipar', async (data) => {
        const { playerId, slot } = data;
        const player = await Player.findById(playerId);
        
        if (player && player.inventario) {
            const resultado = player.inventario.desequipar(slot);
            await player.save();
            
            if (resultado.sucesso) {
                socket.emit('itemDesequipado', { slot: resultado.slot });
            } else {
                socket.emit('erroServidor', resultado.motivo);
            }
        }
    });
    
    // Jogar item fora
    socket.on('descartarItem', async (data) => {
        const { playerId, itemId, quantidade } = data;
        const player = await Player.findById(playerId);
        
        if (player && player.inventario) {
            const resultado = await player.inventario.removerItem(itemId, quantidade || 1);
            await player.save();
            
            if (resultado.sucesso) {
                socket.emit('itemDescartado', {
                    item: resultado.item,
                    quantidade: resultado.quantidadeRemovida
                });
            } else {
                socket.emit('erroServidor', resultado.motivo);
            }
        }
    });
}

module.exports = { configurarInventarioSocket };