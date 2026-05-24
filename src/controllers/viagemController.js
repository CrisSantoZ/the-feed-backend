const Player = require('../models/Player');
const { converterMoeda, getMoedaPorPais } = require('../utils/moedas');

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
        
        // ========== NOVO: VERIFICAR SE A MOEDA VAI MUDAR ==========
        const paisOrigem = player.localizacao.paisAtual;
        const moedaOrigem = getMoedaPorPais(paisOrigem);
        const moedaDestino = getMoedaPorPais(paisDestino);
        const vaiMudarMoeda = moedaOrigem.codigo !== moedaDestino.codigo;
        
        // Calcular custo da viagem (sempre na moeda de origem)
        const passagem = player.localizacao.comprarPassagem(paisDestino, cidadeDestino, meioTransporte);
        
        // Verificar dinheiro (na moeda atual)
        if (player.economia.dinheiroVivo < passagem.custo) {
            return { 
                sucesso: false, 
                erro: `Dinheiro insuficiente. Viagem custa ${player.economia.simboloMoeda} ${passagem.custo}, você tem ${player.economia.simboloMoeda} ${player.economia.dinheiroVivo}` 
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
            moeda: player.economia.simboloMoeda,
            vaiMudarMoeda: vaiMudarMoeda,
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
        
        // ========== NOVO: SALVAR INFORMAÇÕES ANTES DA VIAGEM ==========
        const paisOrigem = player.localizacao.paisAtual;
        const destino = player.localizacao.viagemAtiva.destino;
        const dinheiroAntes = player.economia.dinheiroVivo;
        
        // Concluir a viagem (move o jogador)
        const resultado = await player.localizacao.concluirViagem();
        
        if (resultado.sucesso) {
            // ========== NOVO: CONVERTER MOEDA SE MUDOU DE PAÍS ==========
            if (paisOrigem !== destino.pais) {
                const dinheiroConvertido = converterMoeda(dinheiroAntes, paisOrigem, destino.pais);
                
                if (dinheiroConvertido !== dinheiroAntes) {
                    console.log(`[VIAGEM] Convertendo moeda: ${dinheiroAntes} -> ${dinheiroConvertido} (${paisOrigem} -> ${destino.pais})`);
                    player.economia.dinheiroVivo = dinheiroConvertido;
                    
                    // Registrar transação de conversão
                    await player.economia.adicionarTransacao(
                        'conversao',
                        dinheiroConvertido,
                        `Conversão de moeda ao viajar para ${destino.pais}`,
                        'transporte'
                    );
                }
                
                // Atualizar a moeda ativa do jogador
                await player.sincronizarMoeda();
            }
            
            await player.save();
        }
        
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
            return { sucesso: false, erro: `Dinheiro insuficiente. Custo: ${player.economia.simboloMoeda} ${custo}` };
        }
        
        // Pagar se houver custo
        if (custo > 0) {
            player.economia.dinheiroVivo -= custo;
        }
        
        // Salvar país antes da mudança
        const paisOrigem = player.localizacao.paisAtual;
        
        // Mover para a nova cidade
        const resultado = await player.localizacao.moverPara(pais, cidade);
        
        // ========== NOVO: CONVERTER MOEDA SE MUDOU DE PAÍS ==========
        if (resultado.paisMudou && paisOrigem !== pais) {
            const dinheiroConvertido = converterMoeda(player.economia.dinheiroVivo, paisOrigem, pais);
            if (dinheiroConvertido !== player.economia.dinheiroVivo) {
                console.log(`[VIAGEM] Convertendo moeda ao mudar de país: ${player.economia.dinheiroVivo} -> ${dinheiroConvertido}`);
                player.economia.dinheiroVivo = dinheiroConvertido;
            }
            await player.sincronizarMoeda();
        }
        
        await player.save();
        
        return {
            sucesso: true,
            pais: resultado.pais,
            cidade: resultado.cidade,
            paisMudou: resultado.paisMudou,
            moeda: player.economia.simboloMoeda,
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
                moeda: player.economia?.simboloMoeda || 'R$',
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