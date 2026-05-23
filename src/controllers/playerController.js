const Player = require('../models/Player');

// ==================== CRIAÇÃO E GERENCIAMENTO ====================

async function criarPersonagem(accountId, dados) {
    try {
        const novoPlayer = new Player({
            accountId: accountId,
            nome: dados.nome,
            sobrenome: dados.sobrenome,
            dataNascimento: dados.dataNascimento,
            faceclaim: dados.faceclaim,
            avatarUrl: dados.avatarUrl,
            
            // Os Schemas já têm valores padrão, então não precisa definir tudo!
            // saude: já tem valores default
            // necessidades: já tem valores default
            // idiomas: vai ser configurado separadamente
            // etc...
        });
        
        // Define o idioma nativo baseado no país de origem
        const paisOrigem = dados.paisOrigem || 'brasil';
        const idiomaNativo = obterIdiomaPorPais(paisOrigem);
        
        novoPlayer.idiomas.idiomaNativo = idiomaNativo;
        novoPlayer.localizacao.paisAtual = paisOrigem;
        novoPlayer.localizacao.cidadeAtual = dados.cidadeOrigem || 'São Paulo';
        
        await novoPlayer.save();
        
        return { sucesso: true, player: novoPlayer };
    } catch (erro) {
        console.error('Erro ao criar personagem:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES DE NECESSIDADES ====================

async function comer(playerId, itemId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        // Usa o item do inventário
        const resultado = await player.inventario.usarItem(player, itemId);
        
        if (resultado.sucesso) {
            await player.save();
            
            // Notifica via socket (será implementado depois)
            return {
                sucesso: true,
                fome: player.necessidades.fome,
                efeitos: resultado.efeitos
            };
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function beber(playerId, itemId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.usarItem(player, itemId);
        
        if (resultado.sucesso) {
            await player.save();
            return {
                sucesso: true,
                sede: player.necessidades.sede,
                efeitos: resultado.efeitos
            };
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function dormir(playerId, horas) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = player.necessidades.dormir(horas, 70);
        
        await player.save();
        
        return {
            sucesso: true,
            sono: player.necessidades.sono,
            horasDormidas: horas
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function usarBanheiro(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.necessidades.usarBanheiro();
        await player.save();
        
        return { sucesso: true, banheiro: player.necessidades.banheiro };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function tomarBanho(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.necessidades.tomarBanho();
        await player.save();
        
        return { sucesso: true, higiene: player.necessidades.higiene };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES DE SAÚDE ====================

async function aplicarDano(playerId, local, tipo, gravidade) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = player.saude.aplicarDano(local, tipo, gravidade);
        
        await player.save();
        
        return {
            sucesso: true,
            saudeGeral: player.saude.geral,
            consciente: player.saude.consciente,
            morto: player.saude.morto,
            lesao: resultado
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function curar(playerId, quantidade, local = null) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        player.saude.curar(quantidade, local);
        await player.save();
        
        return {
            sucesso: true,
            saudeGeral: player.saude.geral
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function tomarRemedio(playerId, itemId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.usarItem(player, itemId);
        
        if (resultado.sucesso) {
            await player.save();
            return {
                sucesso: true,
                saude: player.saude.geral,
                efeitos: resultado.efeitos
            };
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES DE ESTUDO E IDIOMAS ====================

async function estudarIdioma(playerId, idioma, metodo, duracaoMinutos) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        // Verifica energia
        if (player.necessidades.energia < 20) {
            return { sucesso: false, erro: 'Muito cansado para estudar' };
        }
        
        const resultado = await player.idiomas.estudar(idioma, metodo, duracaoMinutos);
        
        // Gasta energia
        player.necessidades.energia = Math.max(0, player.necessidades.energia - (duracaoMinutos / 10));
        
        await player.save();
        
        return {
            sucesso: true,
            idioma: idioma,
            novoNivel: resultado.novoNivel,
            subiuNivel: resultado.subiuNivel,
            xpGanho: resultado.xpGanho
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function lerLivro(playerId, livroId, paginas) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.inventario.lerLivro(player, livroId, paginas);
        
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES DE VIAGEM ====================

async function viajar(playerId, paisDestino, cidadeDestino, meioTransporte) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        // Verifica se sabe o idioma do destino
        const idiomaDestino = obterIdiomaPorPais(paisDestino);
        const nivelIdioma = player.idiomas.getNivel(idiomaDestino);
        
        if (nivelIdioma < 30 && idiomaDestino !== player.idiomas.idiomaNativo) {
            return {
                sucesso: false,
                erro: `Você precisa saber ${idiomaDestino} para viajar para ${paisDestino}. Nível atual: ${nivelIdioma}% (mínimo 30%)`
            };
        }
        
        // Verifica dinheiro
        const passagem = player.localizacao.comprarPassagem(paisDestino, cidadeDestino, meioTransporte);
        
        if (player.economia.dinheiroVivo < passagem.custo) {
            return {
                sucesso: false,
                erro: `Dinheiro insuficiente. Custo: C$ ${passagem.custo}, você tem C$ ${player.economia.dinheiroVivo}`
            };
        }
        
        // Paga a passagem
        player.economia.dinheiroVivo -= passagem.custo;
        
        // Inicia a viagem
        const viagem = await player.localizacao.iniciarViagem(paisDestino, cidadeDestino, meioTransporte, passagem.custo);
        
        await player.save();
        
        return {
            sucesso: true,
            destino: `${paisDestino}/${cidadeDestino}`,
            duracaoHoras: viagem.duracao,
            custo: passagem.custo,
            distanciaKm: passagem.distancia
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function concluirViagem(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.localizacao.concluirViagem();
        
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES ECONÔMICAS ====================

async function comprarItem(playerId, item, quantidade = 1) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const custoTotal = (item.valorCompra || 10) * quantidade;
        
        if (player.economia.dinheiroVivo < custoTotal) {
            return {
                sucesso: false,
                erro: `Dinheiro insuficiente. Custo: C$ ${custoTotal}, você tem C$ ${player.economia.dinheiroVivo}`
            };
        }
        
        // Paga
        player.economia.dinheiroVivo -= custoTotal;
        
        // Adiciona ao inventário
        const resultado = await player.inventario.adicionarItem(item, quantidade);
        
        if (!resultado.sucesso) {
            // Reembolsa se não coube na mochila
            player.economia.dinheiroVivo += custoTotal;
            return resultado;
        }
        
        // Registra transação
        await player.economia.adicionarTransacao('compra', custoTotal, `Compra: ${item.nome}`, 'compras');
        
        await player.save();
        
        return {
            sucesso: true,
            item: item.nome,
            quantidade: quantidade,
            custo: custoTotal,
            saldoRestante: player.economia.dinheiroVivo
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function trabalhar(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.economia.receberSalario();
        
        if (resultado.sucesso) {
            await player.save();
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function transferirDinheiro(playerId, destinoPlayerId, valor) {
    try {
        const origem = await Player.findById(playerId);
        const destino = await Player.findById(destinoPlayerId);
        
        if (!origem || !destino) {
            return { sucesso: false, erro: 'Jogador não encontrado' };
        }
        
        if (origem.economia.dinheiroVivo < valor) {
            return { sucesso: false, erro: 'Saldo insuficiente' };
        }
        
        origem.economia.dinheiroVivo -= valor;
        destino.economia.dinheiroVivo += valor;
        
        await origem.economia.adicionarTransacao('transferencia', valor, `Transferência para ${destino.nome}`, 'transferencia');
        await destino.economia.adicionarTransacao('transferencia', valor, `Transferência recebida de ${origem.nome}`, 'transferencia');
        
        await origem.save();
        await destino.save();
        
        return {
            sucesso: true,
            valor: valor,
            de: origem.nome,
            para: destino.nome,
            saldoOrigem: origem.economia.dinheiroVivo
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== AÇÕES SOCIAIS ====================

async function enviarConviteAmizade(playerId, destinoId, mensagem = '') {
    try {
        const player = await Player.findById(playerId);
        const destino = await Player.findById(destinoId);
        
        if (!player || !destino) {
            return { sucesso: false, erro: 'Jogador não encontrado' };
        }
        
        const resultado = await player.social.enviarConviteAmizade(destinoId, destino.nome, mensagem);
        
        await player.save();
        
        return {
            sucesso: resultado.sucesso,
            para: destino.nome,
            ...resultado
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function aceitarConvite(playerId, conviteId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.social.aceitarConvite(conviteId);
        
        if (resultado.sucesso) {
            await player.save();
        }
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== TICK / ATUALIZAÇÃO ====================

async function tickPlayer(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        await player.tick();
        
        // Verifica se morreu
        if (player.saude.morto) {
            return {
                sucesso: true,
                morto: true,
                causaMorte: player.saude.causaMorte,
                alerta: `⚠️ ${player.nome} morreu! Causa: ${player.saude.causaMorte}`
            };
        }
        
        return {
            sucesso: true,
            morto: false,
            fome: player.necessidades?.fome,
            sede: player.necessidades?.sede,
            sono: player.necessidades?.sono,
            energia: player.necessidades?.energia,
            saude: player.saude?.geral
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== CONSULTAS ====================

async function getResumoPlayer(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        return {
            sucesso: true,
            resumo: player.getResumoCompleto()
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// ==================== UTILITÁRIOS ====================

function obterIdiomaPorPais(pais) {
    const idiomas = {
        'brasil': 'portugues',
        'portugal': 'portugues',
        'estados_unidos': 'ingles',
        'reino_unido': 'ingles',
        'japao': 'japones',
        'franca': 'frances',
        'alemanha': 'alemao',
        'italia': 'italiano',
        'espanha': 'espanhol',
        'china': 'mandarim',
        'coreia_do_sul': 'coreano',
        'russia': 'russo'
    };
    
    return idiomas[pais] || 'ingles';
}

// ==================== EXPORTS ====================

module.exports = {
    // Criação
    criarPersonagem,
    
    // Necessidades
    comer,
    beber,
    dormir,
    usarBanheiro,
    tomarBanho,
    
    // Saúde
    aplicarDano,
    curar,
    tomarRemedio,
    
    // Estudo
    estudarIdioma,
    lerLivro,
    
    // Viagem
    viajar,
    concluirViagem,
    
    // Economia
    comprarItem,
    trabalhar,
    transferirDinheiro,
    
    // Social
    enviarConviteAmizade,
    aceitarConvite,
    
    // Sistema
    tickPlayer,
    getResumoPlayer,
    
    // Utilitários
    obterIdiomaPorPais
};