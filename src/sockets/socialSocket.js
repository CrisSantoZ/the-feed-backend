const Player = require('../models/Player');
const PlayerController = require('../controllers/playerController');

function configurarSocialSocket(io, socket) {
    
    // Enviar convite de amizade
    socket.on('convidarAmigo', async (data) => {
        const { playerId, destinoId, mensagem } = data;
        const resultado = await PlayerController.enviarConviteAmizade(playerId, destinoId, mensagem);
        
        if (resultado.sucesso) {
            io.to(`player_${destinoId}`).emit('conviteRecebido', {
                de: resultado.para,
                conviteId: resultado.convite?._id,
                mensagem: mensagem
            });
            
            socket.emit('conviteEnviado', {
                para: resultado.para,
                status: 'pendente'
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Aceitar convite
    socket.on('aceitarConvite', async (data) => {
        const { playerId, conviteId } = data;
        const resultado = await PlayerController.aceitarConvite(playerId, conviteId);
        
        if (resultado.sucesso) {
            socket.emit('conviteAceito', { novoAmigo: resultado.novoAmigo });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Enviar mensagem privada
    socket.on('mensagemPrivada', async (data) => {
        const { destinoId, mensagem } = data;
        
        const player = await Player.findById(socket.playerId);
        
        if (player) {
            io.to(`player_${destinoId}`).emit('mensagemPrivada', {
                de: `${player.nome} ${player.sobrenome}`,
                mensagem: mensagem,
                data: new Date()
            });
        }
    });
    
    // Enviar mensagem no chat local (mesma localização)
    socket.on('mensagemLocal', async (data) => {
        const { localId, mensagem } = data;
        
        const player = await Player.findById(socket.playerId);
        
        if (player) {
            socket.to(`local_${localId}`).emit('mensagemLocal', {
                de: `${player.nome} ${player.sobrenome}`,
                mensagem: mensagem,
                data: new Date()
            });
        }
    });
    
    // Listar amigos online
    socket.on('listarAmigosOnline', async (playerId) => {
        const player = await Player.findById(playerId).populate('social.amigos.playerId');
        
        if (player && player.social) {
            const amigosIds = player.social.getAmigosIds();
            const amigosOnline = await Player.find({
                _id: { $in: amigosIds },
                online: true
            }).select('nome sobrenome');
            
            socket.emit('amigosOnline', { amigos: amigosOnline });
        }
    });
}

module.exports = { configurarSocialSocket };