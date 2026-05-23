const PlayerController = require('../controllers/playerController');

function configurarIdiomasSocket(io, socket) {
    
    // Estudar um idioma
    socket.on('estudarIdioma', async (data) => {
        const { playerId, idioma, metodo, duracaoMinutos } = data;
        const resultado = await PlayerController.estudarIdioma(playerId, idioma, metodo, duracaoMinutos);
        
        if (resultado.sucesso) {
            socket.emit('idiomaEstudado', {
                idioma: resultado.idioma,
                novoNivel: resultado.novoNivel,
                subiuNivel: resultado.subiuNivel,
                xpGanho: resultado.xpGanho
            });
            
            if (resultado.subiuNivel) {
                socket.emit('notificacao', `🎉 Seu nível em ${idioma} aumentou para ${resultado.novoNivel}%!`);
            }
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Verificar nível de um idioma
    socket.on('verificarNivelIdioma', async (data) => {
        const { playerId, idioma } = data;
        const player = await Player.findById(playerId);
        
        if (player) {
            const nivel = player.idiomas.getNivel(idioma);
            socket.emit('nivelIdioma', {
                idioma: idioma,
                nivel: nivel,
                descricao: player.idiomas.getDescricaoNivel(idioma)
            });
        }
    });
    
    // Listar todos os idiomas do jogador
    socket.on('listarIdiomas', async (playerId) => {
        const player = await Player.findById(playerId);
        
        if (player) {
            const idiomas = player.idiomas.listarIdiomas();
            socket.emit('listaIdiomas', { idiomas: idiomas });
        }
    });
    
    // Ler livro (aprender idioma ou habilidade)
    socket.on('lerLivro', async (data) => {
        const { playerId, livroId, paginas } = data;
        const resultado = await PlayerController.lerLivro(playerId, livroId, paginas);
        
        if (resultado.sucesso) {
            socket.emit('leituraProgresso', {
                livro: resultado.livro,
                concluido: resultado.concluido,
                progresso: resultado.progresso,
                xpGanho: resultado.xpGanho
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
}

module.exports = { configurarIdiomasSocket };