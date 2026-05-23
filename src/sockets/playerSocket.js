const PlayerController = require('../controllers/playerController');

function configurarPlayerSocket(io, socket, context) {
    
    // Atualização automática (tick)
    socket.on('tick', async (playerId) => {
        const resultado = await PlayerController.tickPlayer(playerId);
        
        if (resultado.sucesso) {
            socket.emit('statusTick', {
                fome: resultado.fome,
                sede: resultado.sede,
                sono: resultado.sono,
                energia: resultado.energia,
                saude: resultado.saude
            });
            
            if (resultado.morto) {
                socket.emit('personagemMorreu', { causa: resultado.causaMorte });
            }
        }
    });
    
    // Resumo do personagem
    socket.on('getResumo', async (playerId) => {
        const resultado = await PlayerController.getResumoPlayer(playerId);
        socket.emit('resumoPlayer', resultado.resumo);
    });
}

module.exports = { configurarPlayerSocket };