/* ==========================================================================
   TIME SERVICE - SISTEMA DE TEMPO OFFLINE
   Calcula o que aconteceu com o jogador enquanto esteve offline
   ========================================================================== */

const Player = require('../models/Player');

// Processa tempo offline de um jogador (chamar no login)
async function processarTempoOffline(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Jogador não encontrado' };
        
        const agora = new Date();
        const ultimoLogin = player.ultimoLogin || player.dataCriacao;
        
        // Calcula horas offline
        const horasOffline = Math.floor((agora - ultimoLogin) / (1000 * 60 * 60));
        
        if (horasOffline <= 0) {
            return { sucesso: true, horasOffline: 0, mensagem: 'Sem tempo offline' };
        }
        
        console.log(`[TIME] Jogador ${player.nome} ficou ${horasOffline} horas offline`);
        
        const eventos = [];
        
        // ==================== 1. ATUALIZA NECESSIDADES ====================
        if (player.necessidades) {
            const fomeAntes = player.necessidades.fome;
            const sedeAntes = player.necessidades.sede;
            const sonoAntes = player.necessidades.sono;
            
            // Fome aumenta 2% por hora
            player.necessidades.fome = Math.min(100, player.necessidades.fome + (horasOffline * 2));
            
            // Sede aumenta 3% por hora
            player.necessidades.sede = Math.min(100, player.necessidades.sede + (horasOffline * 3));
            
            // Sono aumenta 4% por hora
            player.necessidades.sono = Math.min(100, player.necessidades.sono + (horasOffline * 4));
            
            // Higiene diminui 2% por hora
            player.necessidades.higiene = Math.max(0, player.necessidades.higiene - (horasOffline * 2));
            
            // Social diminui 1% por hora
            player.necessidades.social = Math.max(0, player.necessidades.social - (horasOffline * 1));
            
            // Lazer diminui 1% por hora
            player.necessidades.lazer = Math.max(0, player.necessidades.lazer - (horasOffline * 1));
            
            // Banheiro aumenta 10% por hora
            player.necessidades.banheiro = Math.min(100, player.necessidades.banheiro + (horasOffline * 10));
            
            eventos.push(`⏰ ${horasOffline}h offline: Fome +${player.necessidades.fome - fomeAntes}%, Sede +${player.necessidades.sede - sedeAntes}%, Sono +${player.necessidades.sono - sonoAntes}%`);
        }
        
        // ==================== 2. RECUPERA ENERGIA (se estiver em casa) ====================
        if (player.localizacao && player.localizacao.residencia && player.localizacao.residencia.endereco) {
            // Em casa, recupera energia 10% por hora
            if (player.necessidades) {
                const energiaAntes = player.necessidades.energia;
                player.necessidades.energia = Math.min(100, player.necessidades.energia + (horasOffline * 10));
                eventos.push(`🛌 Descanso em casa: Energia +${player.necessidades.energia - energiaAntes}%`);
            }
        } else {
            // Fora de casa, recupera menos
            if (player.necessidades) {
                const energiaAntes = player.necessidades.energia;
                player.necessidades.energia = Math.min(100, player.necessidades.energia + (horasOffline * 3));
                eventos.push(`💤 Descanso básico: Energia +${player.necessidades.energia - energiaAntes}%`);
            }
        }
        
        // ==================== 3. EFETOS NA SAÚDE ====================
        if (player.saude && player.necessidades) {
            const saudeAntes = player.saude.geral;
            
            // Dano por necessidades negligenciadas
            const danoPorHora = player.necessidades.getEfeitosNaSaude();
            const danoTotal = danoPorHora * horasOffline;
            
            if (danoTotal > 0) {
                player.saude.geral = Math.max(0, player.saude.geral - danoTotal);
                eventos.push(`❤️ Saúde diminuiu ${saudeAntes - player.saude.geral}% devido à negligência`);
            }
            
            // Verifica morte
            if (player.saude.geral <= 0) {
                player.saude.morto = true;
                player.saude.causaMorte = 'Negligência durante período offline';
                player.saude.dataMorte = agora;
                eventos.push(`💀 VOCÊ MORREU enquanto estava offline!`);
            }
        }
        
        // ==================== 4. ECONOMIA OFFLINE ====================
        if (player.economia && !player.saude.morto) {
            // Salário automático (se tiver emprego)
            if (player.economia.salario && player.economia.salario.valor > 0) {
                const diasOffline = horasOffline / 24;
                if (diasOffline >= 1) {
                    const salariosDevidos = Math.floor(diasOffline);
                    const valorTotal = player.economia.salario.valor * salariosDevidos;
                    
                    player.economia.dinheiroVivo += valorTotal;
                    eventos.push(`💰 Recebeu ${salariosDevidos} salário(s) automático(s): C$ ${valorTotal}`);
                }
            }
            
            // Atualiza investimentos
            player.economia.atualizarInvestimentos();
            
            // Gastos automáticos (aluguel, contas)
            for (let i = 0; i < Math.floor(horasOffline / 24); i++) {
                await player.economia.processarGastosFixos();
            }
        }
        
        // ==================== 5. ATUALIZA TIMESTAMP ====================
        player.ultimoLogin = agora;
        
        await player.save();
        
        return {
            sucesso: true,
            horasOffline: horasOffline,
            eventos: eventos,
            morto: player.saude?.morto || false
        };
        
    } catch (erro) {
        console.error('[TIME] Erro ao processar tempo offline:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

// Calcular tempo desde última ação (para verificações de cooldown)
function calcularTempoDecorrido(dataAnterior) {
    if (!dataAnterior) return 0;
    const agora = new Date();
    return Math.floor((agora - dataAnterior) / (1000 * 60)); // minutos
}

// Verificar se ação pode ser realizada (cooldown)
function verificarCooldown(dataAnterior, cooldownMinutos) {
    const minutosDecorridos = calcularTempoDecorrido(dataAnterior);
    return minutosDecorridos >= cooldownMinutos;
}

// Formatar tempo para exibição
function formatarTempo(horas) {
    if (horas < 1) {
        const minutos = Math.floor(horas * 60);
        return `${minutos} minuto(s)`;
    }
    if (horas < 24) {
        return `${Math.floor(horas)} hora(s)`;
    }
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    if (horasRestantes === 0) {
        return `${dias} dia(s)`;
    }
    return `${dias} dia(s) e ${Math.floor(horasRestantes)} hora(s)`;
}

module.exports = {
    processarTempoOffline,
    calcularTempoDecorrido,
    verificarCooldown,
    formatarTempo
};