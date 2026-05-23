// server/src/controllers/comidaController.js
const Player = require('../models/Player');

async function comerDireto(playerId, prato, preco, recuperacao) {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        // Verifica dinheiro
        if (player.economia.dinheiroVivo < preco) {
            return { 
                sucesso: false, 
                erro: `Dinheiro insuficiente. Precisa de C$${preco}, você tem C$${player.economia.dinheiroVivo}`
            };
        }
        
        // Debita o dinheiro
        player.economia.dinheiroVivo -= preco;
        
        // Aplica os efeitos nas necessidades
        if (recuperacao.fome && player.necessidades) {
            // Recupera fome (diminui o valor)
            player.necessidades.fome = Math.max(0, player.necessidades.fome - recuperacao.fome);
        }
        
        if (recuperacao.sede && player.necessidades) {
            player.necessidades.sede = Math.max(0, player.necessidades.sede - recuperacao.sede);
        }
        
        if (recuperacao.energia && player.necessidades) {
            player.necessidades.energia = Math.min(100, player.necessidades.energia + recuperacao.energia);
        }
        
        if (recuperacao.felicidade && player.necessidades) {
            player.necessidades.lazer = Math.min(100, player.necessidades.lazer + recuperacao.felicidade);
        }
        
        // Registra transação
        await player.economia.adicionarTransacao('compra', preco, `Refeição: ${prato}`, 'alimentacao');
        
        await player.save();
        
        return {
            sucesso: true,
            novaFome: player.necessidades?.fome,
            novaSede: player.necessidades?.sede,
            novaEnergia: player.necessidades?.energia,
            novaFelicidade: player.necessidades?.lazer,
            saldoRestante: player.economia.dinheiroVivo
        };
        
    } catch (erro) {
        console.error('[COMIDA] Erro:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = { comerDireto };