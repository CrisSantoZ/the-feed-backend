/* ==========================================================================
   LOCALIZAÇÃO SOCKET - VIAGENS E MOVIMENTAÇÃO
   ========================================================================== */

const { viajarParaPais, concluirViagem, moverParaCidade, getLocalizacao } = require('../controllers/viagemController');

function configurarLocalizacaoSocket(io, socket) {
    
    // Iniciar viagem para outro país
    socket.on('viajar', async (data) => {
        const { playerId, paisDestino, cidadeDestino, meioTransporte } = data;
        
        console.log(`[LOCALIZACAO] Player ${playerId} quer viajar para ${paisDestino}/${cidadeDestino}`);
        
        const resultado = await viajarParaPais(playerId, paisDestino, cidadeDestino, meioTransporte || 'aviao');
        
        if (resultado.sucesso) {
            socket.emit('viagemIniciada', {
                sucesso: true,
                destino: resultado.viagem.destino,
                duracaoHoras: resultado.viagem.duracao,
                custo: resultado.custo,
                dinheiroRestante: resultado.dinheiroRestante
            });
            
            // Programar conclusão automática da viagem após a duração
            setTimeout(async () => {
                const conclusao = await concluirViagem(playerId);
                if (conclusao.sucesso) {
                    socket.emit('viagemConcluida', {
                        sucesso: true,
                        destino: conclusao.destino,
                        duracao: conclusao.duracao,
                        distancia: conclusao.distancia
                    });
                    
                    // Atualizar localização no HUD
                    const [pais, cidade] = conclusao.destino.split('/');
                    socket.emit('localizacaoAtualizada', {
                        pais: pais,
                        cidade: cidade
                    });
                }
            }, resultado.viagem.duracao * 60 * 60 * 1000);
            
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Mover para outra cidade (dentro do mesmo país)
    socket.on('moverParaCidade', async (data) => {
        const { playerId, pais, cidade, custo } = data;
        
        const resultado = await moverParaCidade(playerId, pais, cidade, custo || 0);
        
        if (resultado.sucesso) {
            socket.emit('movimentacaoConcluida', {
                sucesso: true,
                pais: resultado.pais,
                cidade: resultado.cidade,
                paisMudou: resultado.paisMudou,
                dinheiroRestante: resultado.dinheiroRestante
            });
            
            socket.emit('localizacaoAtualizada', {
                pais: resultado.pais,
                cidade: resultado.cidade
            });
            
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Obter localização atual
    socket.on('getLocalizacao', async (playerId) => {
        const resultado = await getLocalizacao(playerId);
        
        if (resultado.sucesso) {
            socket.emit('localizacaoAtual', resultado.localizacao);
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Concluir viagem manualmente (se necessário)
    socket.on('concluirViagem', async (playerId) => {
        const resultado = await concluirViagem(playerId);
        
        if (resultado.sucesso) {
            socket.emit('viagemConcluida', resultado);
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
}

module.exports = { configurarLocalizacaoSocket };