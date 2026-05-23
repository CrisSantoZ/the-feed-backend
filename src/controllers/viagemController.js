const Player = require('../models/Player');

async function viajarParaPais(playerId, paisDestino, cidadeDestino, meioTransporte = 'aviao') {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        // Verificar se já está no destino
        if (player.localizacao.paisAtual === paisDestino && 
            player.localizacao.cidadeAtual === cidadeDestino) {
            return { sucesso: false, erro: 'Você já está neste local!' };
        }
        
        // Calcular custo da viagem
        const passagem = player.localizacao.comprarPassagem(paisDestino, cidadeDestino, meioTransporte);
        
        // Verificar dinheiro
        if (player.economia.dinheiroVivo < passagem.custo) {
            return { 
                sucesso: false, 
                erro: `Dinheiro insuficiente. Viagem custa C$${passagem.custo}, você tem C$${player.economia.dinheiroVivo}` 
            };
        }
        
        // Pagar viagem
        player.economia.dinheiroVivo -= passagem.custo;
        
        // Iniciar viagem
        const viagem = await player.localizacao.iniciarViagem(paisDestino, cidadeDestino, meioTransporte, passagem.custo);
        
        if (!viagem.sucesso) {
            // Reembolsar se não conseguiu iniciar
            player.economia.dinheiroVivo += passagem.custo;
            return { sucesso: false, erro: viagem.motivo };
        }
        
        await player.save();
        
        return {
            sucesso: true,
            viagem: viagem,
            custo: passagem.custo,
            dinheiroRestante: player.economia.dinheiroVivo
        };
        
    } catch (erro) {
        console.error('[VIAGEM] Erro:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

async function concluirViagem(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        if (!player.localizacao.viagemAtiva) {
            return { sucesso: false, erro: 'Nenhuma viagem em andamento' };
        }
        
        const resultado = await player.localizacao.concluirViagem();
        await player.save();
        
        return resultado;
        
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function moverParaCidade(playerId, pais, cidade, custo = 0) {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        // Verificar dinheiro
        if (custo > 0 && player.economia.dinheiroVivo < custo) {
            return { sucesso: false, erro: `Dinheiro insuficiente. Custo: C$${custo}` };
        }
        
        // Pagar se houver custo
        if (custo > 0) {
            player.economia.dinheiroVivo -= custo;
        }
        
        // Mover para a nova cidade
        const resultado = await player.localizacao.moverPara(pais, cidade);
        await player.save();
        
        return {
            sucesso: true,
            pais: resultado.pais,
            cidade: resultado.cidade,
            paisMudou: resultado.paisMudou,
            dinheiroRestante: player.economia.dinheiroVivo
        };
        
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getLocalizacao(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return { sucesso: false, erro: 'Personagem não encontrado' };
        }
        
        return {
            sucesso: true,
            localizacao: {
                pais: player.localizacao.paisAtual,
                cidade: player.localizacao.cidadeAtual,
                regiao: player.localizacao.regiaoAtual,
                viagemAtiva: player.localizacao.viagemAtiva,
                estatisticas: player.localizacao.estatisticas
            }
        };
        
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    viajarParaPais,
    concluirViagem,
    moverParaCidade,
    getLocalizacao
};