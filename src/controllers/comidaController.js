const Player = require('../models/Player');

async function comerDireto(playerId, prato, preco, recuperacao) {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        // Busca o símbolo da moeda do jogador
        const simboloMoeda = player.economia?.simboloMoeda || 'R$';
        
        // Verifica dinheiro
        if (player.economia.dinheiroVivo < preco) {
            return { 
                sucesso: false, 
                erro: `Dinheiro insuficiente. Precisa de ${simboloMoeda} ${preco}, você tem ${simboloMoeda} ${player.economia.dinheiroVivo}`
            };
        }
        
        // Debita o dinheiro
        player.economia.dinheiroVivo -= preco;
        
        // Aplica os efeitos nas necessidades
        if (recuperacao.fome && player.necessidades) {
            player.necessidades.fome = Math.max(0, player.necessidades.fome - recuperacao.fome);
        }
        
        if (recuperacao.sede && player.necessidades) {
            player.necessidades.sede = Math.max(0, player.necessidades.sede - recuperacao.sede);
        }
        
        // ✅ ENERGIA LIMITADA PELO SONO (comida não recupera energia se estiver com sono)
        if (recuperacao.energia && player.necessidades) {
            const limiteEnergia = Math.max(0, 100 - player.necessidades.sono);
            const novaEnergia = Math.min(limiteEnergia, player.necessidades.energia + recuperacao.energia);
            player.necessidades.energia = novaEnergia;
        }
        
        if (recuperacao.felicidade && player.necessidades) {
            player.necessidades.lazer = Math.min(100, player.necessidades.lazer + recuperacao.felicidade);
        }
        
        // ✅ ADICIONAR ESTAS DUAS LINHAS
        player.necessidades.ultimaRefeicao = new Date();
        if (recuperacao.sede) {
            player.necessidades.ultimaAgua = new Date();
        }
        
        // Registra transação
        await player.economia.adicionarTransacao('compra', preco, `Refeição: ${prato}`, 'alimentacao');
        
        await player.save();
        
        console.log(`[COMIDA] ${player.nome} comeu ${prato} por ${simboloMoeda} ${preco}`);
        console.log(`[COMIDA] Saldo restante: ${simboloMoeda} ${player.economia.dinheiroVivo}`);
        console.log(`[COMIDA] Fome: ${player.necessidades?.fome}, Energia: ${player.necessidades?.energia}`);
        console.log(`[COMIDA] ultimaRefeicao: ${player.necessidades?.ultimaRefeicao}`);
        
        return {
            sucesso: true,
            novaFome: player.necessidades?.fome,
            novaSede: player.necessidades?.sede,
            novaEnergia: player.necessidades?.energia,
            novaFelicidade: player.necessidades?.lazer,
            saldoRestante: player.economia.dinheiroVivo,
            simboloMoeda: simboloMoeda
        };
        
    } catch (erro) {
        console.error('[COMIDA] Erro:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = { comerDireto };