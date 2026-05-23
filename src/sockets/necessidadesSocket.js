const PlayerController = require('../controllers/playerController');

function configurarNecessidadesSocket(io, socket) {
    
    socket.on('comer', async (data) => {
        const { playerId, itemId } = data;
        const resultado = await PlayerController.comer(playerId, itemId);
        
        if (resultado.sucesso) {
            socket.emit('statusAtualizado', {
                fome: resultado.fome,
                efeitos: resultado.efeitos
            });
            socket.emit('mensagemLocal', { acao: `você comeu e saciou sua fome` });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    socket.on('beber', async (data) => {
        const { playerId, itemId } = data;
        const resultado = await PlayerController.beber(playerId, itemId);
        
        if (resultado.sucesso) {
            socket.emit('statusAtualizado', { sede: resultado.sede });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    socket.on('dormir', async (data) => {
        const { playerId, horas } = data;
        const resultado = await PlayerController.dormir(playerId, horas);
        
        if (resultado.sucesso) {
            socket.emit('statusAtualizado', { sono: resultado.sono });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    socket.on('usarBanheiro', async (playerId) => {
        const resultado = await PlayerController.usarBanheiro(playerId);
        socket.emit('statusAtualizado', { banheiro: resultado.banheiro });
    });
    
    socket.on('tomarBanho', async (playerId) => {
        const resultado = await PlayerController.tomarBanho(playerId);
        socket.emit('statusAtualizado', { higiene: resultado.higiene });
    });
}

module.exports = { configurarNecessidadesSocket };