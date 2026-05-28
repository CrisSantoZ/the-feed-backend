/* ==========================================================================
   TICK SERVICE - CORAÇÃO DO JOGO
   Atualiza todos os jogadores online a cada intervalo de tempo
   ========================================================================== */

const Player = require('../models/Player');
const EmpresaController = require('../controllers/empresaController');

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
        const jogadoresOnline = await Player.find({ online: true });
        
        if (jogadoresOnline.length === 0) {
            return;
        }
        
        console.log(`[TICK] Processando ${jogadoresOnline.length} jogadores online...`);
        
        for (const player of jogadoresOnline) {
            await processarJogador(player, io);
        }
        
        // Processa salários de empresas (a cada 10 ticks = 10 min)
        if (Math.floor(Date.now() / 60000) % 10 === 0) {
            await EmpresaController.processarSalarios();
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
        // ✅ BUSCA O PLAYER ATUALIZADO (com socketId mais recente)
        const playerAtualizado = await Player.findById(player._id);
        
        console.log(`[TICK] Player: ${playerAtualizado.nome}`);
        console.log(`[TICK] socketId salvo: ${playerAtualizado.socketId}`);
        console.log(`[TICK] Socket existe? ${io.sockets.sockets.get(playerAtualizado.socketId) ? 'SIM' : 'NÃO'}`);

        let houveMudanca = false;
        let alertas = [];
        
        // ✅ VERIFICA SE O JOGADOR FEZ ALGUMA AÇÃO RECENTEMENTE
        const agora = Date.now();
        
        // ✅ NOVO: VERIFICA SE JOGADOR ACABOU DE LOGAR
        const tempoDesdeUltimoLogin = playerAtualizado.ultimoLogin ? (agora - new Date(playerAtualizado.ultimoLogin)) / 1000 : 999;
        const isRecemLogado = tempoDesdeUltimoLogin < 30; // 30 segundos de tolerância
        
        const ultimaAcao = Math.max(
            playerAtualizado.necessidades?.ultimaRefeicao || 0,
            playerAtualizado.necessidades?.ultimaAgua || 0,
            playerAtualizado.necessidades?.ultimoSono || 0
        );
        
        const tempoDesdeUltimaAcao = ultimaAcao ? (agora - new Date(ultimaAcao)) / 1000 : 999;
        const ignorarDegradacao = (tempoDesdeUltimaAcao < 10) || isRecemLogado;
        
        if (ignorarDegradacao) {
            const motivo = isRecemLogado ? `recém logado (${tempoDesdeUltimoLogin}s)` : `ação recente (${tempoDesdeUltimaAcao}s)`;
            console.log(`[TICK] Ignorando degradação para ${playerAtualizado.nome} (${motivo})`);
        }
        
        // ==================== 1. ATUALIZA NECESSIDADES ====================
        if (playerAtualizado.necessidades) {
            const necessidadesAntes = {
                fome: playerAtualizado.necessidades.fome,
                sede: playerAtualizado.necessidades.sede,
                sono: playerAtualizado.necessidades.sono,
                energia: playerAtualizado.necessidades.energia
            };
            
            // ✅ SÓ APLICA DEGRADAÇÃO SE NÃO TIVER AÇÃO RECENTE E NÃO FOR RECÉM LOGADO
            if (!ignorarDegradacao) {
                playerAtualizado.necessidades.atualizar();
            } else {
                console.log(`[TICK] Pulando degradação de necessidades para ${playerAtualizado.nome}`);
            }
            
            if (necessidadesAntes.fome !== playerAtualizado.necessidades.fome) houveMudanca = true;
            if (necessidadesAntes.sede !== playerAtualizado.necessidades.sede) houveMudanca = true;
            if (necessidadesAntes.sono !== playerAtualizado.necessidades.sono) houveMudanca = true;
            
            // Alertas de necessidade (só se não ignorou)
            if (!ignorarDegradacao) {
                if (playerAtualizado.necessidades.fome >= 80 && necessidadesAntes.fome < 80) {
                    alertas.push({ tipo: 'fome', mensagem: '⚠️ Você está com muita fome!', nivel: playerAtualizado.necessidades.fome });
                }
                if (playerAtualizado.necessidades.sede >= 80 && necessidadesAntes.sede < 80) {
                    alertas.push({ tipo: 'sede', mensagem: '💧 Você está com muita sede!', nivel: playerAtualizado.necessidades.sede });
                }
                if (playerAtualizado.necessidades.sono >= 80 && necessidadesAntes.sono < 80) {
                    alertas.push({ tipo: 'sono', mensagem: '😴 Você está muito cansado!', nivel: playerAtualizado.necessidades.sono });
                }
            }
            
            if (playerAtualizado.necessidades.banheiro >= 90) {
                alertas.push({ tipo: 'banheiro', mensagem: '🚽 Você precisa ir ao banheiro URGENTE!', nivel: playerAtualizado.necessidades.banheiro });
            }
            if (playerAtualizado.necessidades.higiene <= 20) {
                alertas.push({ tipo: 'higiene', mensagem: '🧼 Você está com a higiene baixa!', nivel: playerAtualizado.necessidades.higiene });
            }
        }
        
        // ==================== 2. ATUALIZA SAÚDE ====================
        if (playerAtualizado.saude) {
            playerAtualizado.saude.processarMedicamentos();
            playerAtualizado.saude.atualizarSinaisVitais();
            
            if (playerAtualizado.necessidades && !ignorarDegradacao) {
                const dano = playerAtualizado.necessidades.getEfeitosNaSaude();
                if (dano > 0) {
                    playerAtualizado.saude.geral = Math.max(0, playerAtualizado.saude.geral - dano);
                    houveMudanca = true;
                    
                    if (dano >= 5) {
                        alertas.push({ tipo: 'saude', mensagem: `❤️ Sua saúde caiu devido à negligência!`, nivel: playerAtualizado.saude.geral });
                    }
                }
            }
            
            if (playerAtualizado.saude.morto && !playerAtualizado.saude.dataMorte) {
                playerAtualizado.saude.dataMorte = new Date();
                alertas.push({ tipo: 'morte', mensagem: `💀 VOCÊ MORREU! Causa: ${playerAtualizado.saude.causaMorte || 'Negligência'}` });
                houveMudanca = true;
                await notificarMorte(playerAtualizado, io);
            }
        }
        
        // ==================== 3. ATUALIZA ECONOMIA ====================
        if (playerAtualizado.economia && !ignorarDegradacao) {
            playerAtualizado.economia.atualizarInvestimentos();
            
            const gastosProcessados = await playerAtualizado.economia.processarGastosFixos();
            if (gastosProcessados.length > 0) {
                alertas.push({ tipo: 'economia', mensagem: `💰 Gastos automáticos: ${gastosProcessados.join(', ')}`, nivel: playerAtualizado.economia.dinheiroVivo });
                houveMudanca = true;
            }
        }
        
        // ==================== 4. ATUALIZA HABILIDADES ====================
        if (playerAtualizado.habilidades && !ignorarDegradacao) {
            const treinoResultado = await playerAtualizado.habilidades.treinoDiario();
            if (treinoResultado && treinoResultado.length > 0) {
                houveMudanca = true;
            }
            
            if (playerAtualizado.habilidades.historicoProgresso.length > 50) {
                playerAtualizado.habilidades.historicoProgresso = playerAtualizado.habilidades.historicoProgresso.slice(-50);
            }
        }
        
        // ==================== 5. LIMITAR HISTÓRICOS ====================
        if (playerAtualizado.habilidades && playerAtualizado.habilidades.historicoProgresso && playerAtualizado.habilidades.historicoProgresso.length > 50) {
            playerAtualizado.habilidades.historicoProgresso = playerAtualizado.habilidades.historicoProgresso.slice(-50);
            houveMudanca = true;
        }
        
        if (playerAtualizado.necessidades && playerAtualizado.necessidades.limitarHistoricos) {
            playerAtualizado.necessidades.limitarHistoricos();
            houveMudanca = true;
        }
        
        if (playerAtualizado.economia && playerAtualizado.economia.limitarTransacoes) {
            playerAtualizado.economia.limitarTransacoes();
            houveMudanca = true;
        }
        
        // ==================== 6. SALVA E NOTIFICA ====================
        if (houveMudanca) {
            await playerAtualizado.save();
            
            if (playerAtualizado.socketId && io.sockets.sockets.get(playerAtualizado.socketId)) {
                io.to(playerAtualizado.socketId).emit('tickAtualizacao', {
                    necessidades: playerAtualizado.necessidades ? {
                        fome: playerAtualizado.necessidades.fome,
                        sede: playerAtualizado.necessidades.sede,
                        sono: playerAtualizado.necessidades.sono,
                        energia: playerAtualizado.necessidades.energia,
                        banheiro: playerAtualizado.necessidades.banheiro,
                        higiene: playerAtualizado.necessidades.higiene,
                        social: playerAtualizado.necessidades.social,
                        lazer: playerAtualizado.necessidades.lazer
                    } : null,
                    saude: playerAtualizado.saude ? playerAtualizado.saude.geral : 100,
                    nivel: playerAtualizado.habilidades?.estatisticas?.nivelMedio || 1,
                    xp: playerAtualizado.habilidades?.estatisticas?.totalXP || 0,
                    economia: playerAtualizado.economia ? {
                        dinheiro: playerAtualizado.economia.dinheiroVivo,
                        patrimonio: playerAtualizado.economia.patrimonioTotal
                    } : null,
                    alertas: alertas
                });
                console.log(`[TICK] Evento enviado para ${playerAtualizado.nome}`);
            } else {
                console.log(`[TICK] Socket NÃO encontrado para ${playerAtualizado.nome}`);
            }
        }
        
        if (alertas.length > 0 && playerAtualizado.socketId) {
            io.to(playerAtualizado.socketId).emit('alertas', { alertas: alertas });
        }
        
        if (playerAtualizado.saude && playerAtualizado.saude.morto) {
            if (playerAtualizado.socketId) {
                io.to(playerAtualizado.socketId).emit('gameOver', {
                    causa: playerAtualizado.saude.causaMorte,
                    data: playerAtualizado.saude.dataMorte
                });
                
                setTimeout(() => {
                    const socket = io.sockets.sockets.get(playerAtualizado.socketId);
                    if (socket) {
                        socket.disconnect();
                    }
                }, 5000);
            }
        }
        
    } catch (erro) {
        console.error(`[TICK] Erro ao processar jogador:`, erro);
    }
}

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