/* ==========================================================================
   TICK SERVICE - CORAÇÃO DO JOGO
   Atualiza todos os jogadores online a cada intervalo de tempo
   ========================================================================== */

const Player = require('../models/Player');

let tickInterval = null;
let jogadoresAtivos = new Map(); // playerId -> ultimoTick

// Configurações
const TICK_INTERVAL_MS = 60000; // 1 minuto (60 segundos)
const TICK_INTERVAL_SEGUNDOS = TICK_INTERVAL_MS / 1000;

// Iniciar o loop do jogo
function iniciarTickService(io) {
    if (tickInterval) {
        console.log('[TICK] Serviço já está rodando');
        return;
    }
    
    console.log(`[TICK] Iniciando serviço de atualização - Tick a cada ${TICK_INTERVAL_SEGUNDOS} segundos`);
    
    tickInterval = setInterval(async () => {
        await processarTick(io);
    }, TICK_INTERVAL_MS);
}

// Parar o loop do jogo
function pararTickService() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
        console.log('[TICK] Serviço de atualização parado');
    }
}

// Processar um tick (atualizar todos os jogadores online)
async function processarTick(io) {
    const inicio = Date.now();
    
    try {
        // Busca todos os jogadores online
        const jogadoresOnline = await Player.find({ online: true });
        
        if (jogadoresOnline.length === 0) {
            return;
        }
        
        console.log(`[TICK] Processando ${jogadoresOnline.length} jogadores online...`);
        
        // Processa cada jogador
        for (const player of jogadoresOnline) {
            await processarJogador(player, io);
        }
        
        const duracao = Date.now() - inicio;
        console.log(`[TICK] Processado em ${duracao}ms`);
        
    } catch (erro) {
        console.error('[TICK] Erro no processamento:', erro);
    }
}

// Processar um jogador individual
async function processarJogador(player, io) {
    try {
        let houveMudanca = false;
        let alertas = [];
        
        // ==================== 1. ATUALIZA NECESSIDADES ====================
        if (player.necessidades) {
            const necessidadesAntes = {
                fome: player.necessidades.fome,
                sede: player.necessidades.sede,
                sono: player.necessidades.sono,
                energia: player.necessidades.energia
            };
            
            player.necessidades.atualizar();
            
            // Verifica mudanças significativas
            if (necessidadesAntes.fome !== player.necessidades.fome) houveMudanca = true;
            if (necessidadesAntes.sede !== player.necessidades.sede) houveMudanca = true;
            if (necessidadesAntes.sono !== player.necessidades.sono) houveMudanca = true;
            
            // Alertas de necessidade
            if (player.necessidades.fome >= 80 && necessidadesAntes.fome < 80) {
                alertas.push({ tipo: 'fome', mensagem: '⚠️ Você está com muita fome!', nivel: player.necessidades.fome });
            }
            if (player.necessidades.sede >= 80 && necessidadesAntes.sede < 80) {
                alertas.push({ tipo: 'sede', mensagem: '💧 Você está com muita sede!', nivel: player.necessidades.sede });
            }
            if (player.necessidades.sono >= 80 && necessidadesAntes.sono < 80) {
                alertas.push({ tipo: 'sono', mensagem: '😴 Você está muito cansado!', nivel: player.necessidades.sono });
            }
            if (player.necessidades.banheiro >= 90) {
                alertas.push({ tipo: 'banheiro', mensagem: '🚽 Você precisa ir ao banheiro URGENTE!', nivel: player.necessidades.banheiro });
            }
            if (player.necessidades.higiene <= 20) {
                alertas.push({ tipo: 'higiene', mensagem: '🧼 Você está com a higiene baixa!', nivel: player.necessidades.higiene });
            }
        }
        
        // ==================== 2. ATUALIZA SAÚDE ====================
        if (player.saude) {
            // Processa medicamentos
            player.saude.processarMedicamentos();
            
            // Atualiza sinais vitais
            player.saude.atualizarSinaisVitais();
            
            // Aplica dano por necessidades negligenciadas
            if (player.necessidades) {
                const dano = player.necessidades.getEfeitosNaSaude();
                if (dano > 0) {
                    player.saude.aplicarDano('geral', 'degradacao', dano);
                    houveMudanca = true;
                    
                    if (dano >= 5) {
                        alertas.push({ tipo: 'saude', mensagem: `❤️ Sua saúde caiu devido à negligência!`, nivel: player.saude.geral });
                    }
                }
            }
            
            // Verifica se morreu
            if (player.saude.morto && !player.saude.dataMorte) {
                player.saude.dataMorte = new Date();
                alertas.push({ tipo: 'morte', mensagem: `💀 VOCÊ MORREU! Causa: ${player.saude.causaMorte || 'Negligência'}` });
                houveMudanca = true;
                
                // Notifica todos os amigos
                await notificarMorte(player, io);
            }
        }
        
        // ==================== 3. ATUALIZA ECONOMIA ====================
        if (player.economia) {
            // Atualiza investimentos
            player.economia.atualizarInvestimentos();
            
            // Processa gastos fixos (aluguel, contas)
            const gastosProcessados = await player.economia.processarGastosFixos();
            if (gastosProcessados.length > 0) {
                alertas.push({ tipo: 'economia', mensagem: `💰 Gastos automáticos: ${gastosProcessados.join(', ')}`, nivel: player.economia.dinheiroVivo });
                houveMudanca = true;
            }
        }
        
        // ==================== 4. ATUALIZA HABILIDADES ====================
        if (player.habilidades) {
    // Treino diário automático
    const treinoResultado = await player.habilidades.treinoDiario();
    if (treinoResultado && treinoResultado.length > 0) {
        houveMudanca = true;
    }
    
    // ← ADICIONE ESTA LINHA PARA MANTER O HISTÓRICO CONTROLADO
    if (player.habilidades.historicoProgresso.length > 50) {
        player.habilidades.historicoProgresso = player.habilidades.historicoProgresso.slice(-50);
    }
}
        
               // ==================== 5. LIMITAR HISTÓRICOS (antes de salvar) ====================
        
        // Limitar histórico de habilidades
        if (player.habilidades && player.habilidades.historicoProgresso && player.habilidades.historicoProgresso.length > 50) {
            player.habilidades.historicoProgresso = player.habilidades.historicoProgresso.slice(-50);
            houveMudanca = true;
        }
        
        // Limitar históricos de necessidades
        if (player.necessidades && player.necessidades.limitarHistoricos) {
            player.necessidades.limitarHistoricos();
            houveMudanca = true;
        }
        
        // Limitar transações da economia
        if (player.economia && player.economia.limitarTransacoes) {
            player.economia.limitarTransacoes();
            houveMudanca = true;
        }
        
        // ==================== 6. SALVA E NOTIFICA ====================
        if (houveMudanca) {
            await player.save();
            
            // Envia atualização para o jogador
            if (player.socketId && io.sockets.sockets.get(player.socketId)) {
                io.to(player.socketId).emit('tickAtualizacao', {
                    necessidades: player.necessidades ? {
                        fome: player.necessidades.fome,
                        sede: player.necessidades.sede,
                        sono: player.necessidades.sono,
                        energia: player.necessidades.energia,
                        banheiro: player.necessidades.banheiro,
                        higiene: player.necessidades.higiene,
                        social: player.necessidades.social,
                        lazer: player.necessidades.lazer
                    } : null,
                    saude: player.saude ? {
                        geral: player.saude.geral,
                        consciente: player.saude.consciente,
                        sinais: player.saude.sinaisVitais
                    } : null,
                    economia: player.economia ? {
                        dinheiro: player.economia.dinheiroVivo,
                        patrimonio: player.economia.patrimonioTotal
                    } : null,
                    alertas: alertas
                });
            }
        }
        
        // Envia alertas mesmo sem mudanças
        if (alertas.length > 0 && player.socketId) {
            io.to(player.socketId).emit('alertas', { alertas: alertas });
        }
        
        // Se morreu, desconecta
        if (player.saude && player.saude.morto) {
            if (player.socketId) {
                io.to(player.socketId).emit('gameOver', {
                    causa: player.saude.causaMorte,
                    data: player.saude.dataMorte
                });
                
                // Desconecta após 5 segundos
                setTimeout(() => {
                    const socket = io.sockets.sockets.get(player.socketId);
                    if (socket) {
                        socket.disconnect();
                    }
                }, 5000);
            }
        }
        
    } catch (erro) {
        console.error(`[TICK] Erro ao processar jogador ${player._id}:`, erro);
    }
}

// Notificar amigos sobre a morte
async function notificarMorte(player, io) {
    try {
        if (!player.social || !player.social.amigos) return;
        
        for (const amigo of player.social.amigos) {
            const amigoPlayer = await Player.findById(amigo.playerId);
            if (amigoPlayer && amigoPlayer.online && amigoPlayer.socketId) {
                io.to(amigoPlayer.socketId).emit('notificacaoAmigo', {
                    tipo: 'morte',
                    amigo: `${player.nome} ${player.sobrenome}`,
                    mensagem: `💀 Seu amigo ${player.nome} faleceu!`
                });
            }
        }
    } catch (erro) {
        console.error('[TICK] Erro ao notificar morte:', erro);
    }
}

// Tick manual para um jogador específico (para testes)
async function tickManual(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Jogador não encontrado' };
        
        await processarJogador(player, null);
        await player.save();
        
        return { sucesso: true, jogador: player.nome };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// Status do tick service
function getTickStatus() {
    return {
        ativo: tickInterval !== null,
        intervalo: TICK_INTERVAL_SEGUNDOS,
        unidade: 'segundos'
    };
}

module.exports = {
    iniciarTickService,
    pararTickService,
    tickManual,
    getTickStatus
};