const Player = require('../models/Player');
const PlayerController = require('../controllers/playerController');

function configurarEconomiaSocket(io, socket) {
    
    // Comprar item
    socket.on('comprar', async (data) => {
        const { playerId, item, quantidade } = data;
        const resultado = await PlayerController.comprarItem(playerId, item, quantidade);
        
        if (resultado.sucesso) {
            socket.emit('compraRealizada', {
                item: resultado.item,
                quantidade: resultado.quantidade,
                custo: resultado.custo,
                saldo: resultado.saldoRestante
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Trabalhar / Receber salário
    socket.on('trabalhar', async (playerId) => {
        const resultado = await PlayerController.trabalhar(playerId);
        
        if (resultado.sucesso) {
            socket.emit('salarioRecebido', {
                valor: resultado.valor,
                proximoPagamento: resultado.proximoPagamento
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Transferir dinheiro para outro jogador
    socket.on('transferir', async (data) => {
        const { playerId, destinoPlayerId, valor } = data;
        const resultado = await PlayerController.transferirDinheiro(playerId, destinoPlayerId, valor);
        
        if (resultado.sucesso) {
            // Notifica o remetente
            socket.emit('transferenciaEnviada', {
                valor: resultado.valor,
                para: resultado.para,
                saldo: resultado.saldoOrigem
            });
            
            // Notifica o destinatário (se estiver online)
            io.to(`player_${destinoPlayerId}`).emit('transferenciaRecebida', {
                valor: resultado.valor,
                de: resultado.de
            });
        } else {
            socket.emit('erroServidor', resultado.erro);
        }
    });
    
    // Ver saldo
    socket.on('verSaldo', async (playerId) => {
        const player = await Player.findById(playerId);
        
        if (player && player.economia) {
            socket.emit('saldoAtual', {
                dinheiroVivo: player.economia.dinheiroVivo,
                saldoBancario: player.economia.getSaldoBancario(),
                saldoTotal: player.economia.getSaldoTotal(),
                patrimonioTotal: player.economia.calcularPatrimonioTotal()
            });
        }
    });
    
    // Ver extrato
    socket.on('verExtrato', async (playerId, limite = 20) => {
        const player = await Player.findById(playerId);
        
        if (player && player.economia) {
            const ultimasTransacoes = player.economia.historicoTransacoes
                .slice(-limite)
                .reverse();
            
            socket.emit('extrato', { transacoes: ultimasTransacoes });
        }
    });
}

module.exports = { configurarEconomiaSocket };