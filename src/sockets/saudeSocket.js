const PlayerController = require('../controllers/playerController');

function configurarSaudeSocket(io, socket) {
    
    // Aplicar dano (combate, acidentes)
    socket.on('aplicarDano', async (data) => {
        const { playerId, local, tipo, gravidade } = data;
        const resultado = await PlayerController.aplicarDano(playerId, local, tipo, gravidade);
        
        if (resultado.sucesso) {
            socket.emit('danoAplicado', {
                saudeGeral: resultado.saudeGeral,
                consciente: resultado.consciente,
                morto: resultado.morto
            });
            
            if (resultado.morto) {
                io.emit('notificacaoGlobal', `💀 Um cidadão faleceu nas ruas da cidade.`);
                socket.emit('gameOver', { causa: `Você morreu devido a um ${tipo} grave` });
            } else if (!resultado.consciente) {
                socket.emit('desmaiou', { motivo: `Você desmaiou devido à gravidade do ferimento` });
            }
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Curar (hospitais, primeiros socorros)
    socket.on('curar', async (data) => {
        const { playerId, quantidade, local } = data;
        const resultado = await PlayerController.curar(playerId, quantidade, local);
        
        if (resultado.sucesso) {
            socket.emit('curado', { saudeGeral: resultado.saudeGeral });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Tomar remédio
    socket.on('tomarRemedio', async (data) => {
        const { playerId, itemId } = data;
        const resultado = await PlayerController.tomarRemedio(playerId, itemId);
        
        if (resultado.sucesso) {
            socket.emit('remedioTomado', {
                saude: resultado.saude,
                efeitos: resultado.efeitos
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Verificar sinais vitais
    socket.on('verificarSinaisVitais', async (playerId) => {
        const player = await Player.findById(playerId);
        if (player && player.saude) {
            socket.emit('sinaisVitais', {
                batimentos: player.saude.sinaisVitais.batimentos,
                pressao: {
                    sistolica: player.saude.sinaisVitais.pressaoSistolica,
                    diastolica: player.saude.sinaisVitais.pressaoDiastolica
                },
                temperatura: player.saude.sinaisVitais.temperatura,
                saturacao: player.saude.sinaisVitais.saturacaoOxigenio
            });
        }
    });
}

module.exports = { configurarSaudeSocket };