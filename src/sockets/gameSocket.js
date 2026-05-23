/* ==========================================================================
   GERENCIADOR DE REDE PRINCIPAL - gameSocket.js
   Coordena todos os módulos de socket do jogo
   ========================================================================== */

const authController = require('../controllers/authController');
const Player = require('../models/Player');
const Account = require('../models/Account');
const { Groq } = require('groq-sdk');

// Importa os módulos de socket (que vamos criar)
const { configurarAuthSocket } = require('./authSocket');
const { configurarPlayerSocket } = require('./playerSocket');
const { configurarNecessidadesSocket } = require('./necessidadesSocket');
const { configurarSaudeSocket } = require('./saudeSocket');
const { configurarIdiomasSocket } = require('./idiomasSocket');
const { configurarLocalizacaoSocket } = require('./localizacaoSocket');
const { configurarEconomiaSocket } = require('./economiaSocket');
const { configurarSocialSocket } = require('./socialSocket');
const { configurarInventarioSocket } = require('./inventarioSocket');
const { configurarFaceclaimSocket } = require('./faceclaimSocket');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function configurarSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Novo terminal de rede conectado: ${socket.id}`);
        
        // Armazena o playerId na sessão do socket (para uso nos módulos)
        let playerIdAtual = null;

        // ==================== MÓDULOS DE SOCKET ====================
        
        // Autenticação (cadastro, login, seleção de personagem)
        configurarAuthSocket(io, socket, { playerIdAtual });
        
        // Faceclaim (busca de imagens com IA)
        configurarFaceclaimSocket(io, socket, { groq });
        
        // Player (informações, tick, resumo)
        configurarPlayerSocket(io, socket, { playerIdAtual });
        
        // Necessidades (comer, beber, dormir, banheiro)
        configurarNecessidadesSocket(io, socket);
        
        // Saúde (dano, cura, remédios)
        configurarSaudeSocket(io, socket);
        
        // Idiomas (estudar, livros)
        configurarIdiomasSocket(io, socket);
        
        // Localização (viajar, mover)
        configurarLocalizacaoSocket(io, socket);
        
        // Economia (comprar, vender, trabalhar, transferir)
        configurarEconomiaSocket(io, socket);
        
        // Social (amizades, convites, mensagens)
        configurarSocialSocket(io, socket);
        
        // Inventário (itens, equipar, craft)
        configurarInventarioSocket(io, socket);

        // ==================== DESCONEXÃO ====================
        socket.on('disconnect', async () => {
            console.log(`🔌 Conexão interrompida com o terminal: ${socket.id}`);
            
            // Atualiza status offline do jogador
            if (playerIdAtual) {
                const player = await Player.findById(playerIdAtual);
                if (player) {
                    player.setOffline();
                    await player.save();
                    io.emit('jogadorOffline', { playerId: playerIdAtual, nome: player.nome });
                }
            }
        });
    });
}

module.exports = { configurarSockets };