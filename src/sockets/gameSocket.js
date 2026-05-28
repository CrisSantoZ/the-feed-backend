/* ==========================================================================
   GERENCIADOR DE REDE PRINCIPAL - gameSocket.js
   Coordena todos os módulos de socket do jogo
   ========================================================================== */

const authController = require('../controllers/authController');
const Player = require('../models/Player');
const Account = require('../models/Account');
const { Groq } = require('groq-sdk');

// Importa os módulos de socket
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
const { configurarEmpresaSocket } = require('./empresaSocket');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Armazena nome do jogador por socket
const socketNomes = new Map();

function configurarSockets(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Novo terminal de rede conectado: ${socket.id}`);
        
        let playerIdAtual = null;

        // ========== SALVAR NOME DO JOGADOR ==========
        socket.on('setPlayerName', (nome) => {
            socketNomes.set(socket.id, nome);
            console.log(`[CHAT] ${nome} conectado`);
        });

        // ========== ENTRAR EM UMA SALA (CHAT LOCAL) ==========
        socket.on('entrarSala', (salaId) => {
            socket.join(salaId);
            const nome = socketNomes.get(socket.id) || 'Anônimo';
            console.log(`[CHAT] ${nome} entrou na sala: ${salaId}`);
            
            // Atualiza contador de pessoas na sala
            const sala = io.sockets.adapter.rooms.get(salaId);
            const contador = sala ? sala.size : 0;
            io.to(salaId).emit('atualizarContadorSala', contador);
        });

        // ========== MENSAGEM LOCAL ==========
        socket.on('mensagemLocal', (data) => {
            const { sala, mensagem } = data;
            const nome = socketNomes.get(socket.id) || 'Anônimo';
            
            io.to(sala).emit('novaMensagemLocal', {
    nome: nome,
    mensagem: mensagem,
    hora: new Date().toLocaleTimeString()
});
        });

        // ========== SAIR DA SALA ==========
        socket.on('sairSala', (salaId) => {
            socket.leave(salaId);
            const nome = socketNomes.get(socket.id) || 'Anônimo';
            console.log(`[CHAT] ${nome} saiu da sala: ${salaId}`);
            
            const sala = io.sockets.adapter.rooms.get(salaId);
            const contador = sala ? sala.size : 0;
            io.to(salaId).emit('atualizarContadorSala', contador);
        });

        // ==================== MÓDULOS DE SOCKET EXISTENTES ====================
        configurarAuthSocket(io, socket, { playerIdAtual });
        configurarFaceclaimSocket(io, socket, { groq });
        configurarPlayerSocket(io, socket, { playerIdAtual });
        configurarNecessidadesSocket(io, socket);
        configurarSaudeSocket(io, socket);
        configurarIdiomasSocket(io, socket);
        configurarLocalizacaoSocket(io, socket);
        configurarEconomiaSocket(io, socket);
        configurarSocialSocket(io, socket);
        configurarInventarioSocket(io, socket);
        configurarEmpresaSocket(io, socket, { playerIdAtual, socketNomes });

        // ==================== DESCONEXÃO ====================
        socket.on('disconnect', async () => {
            console.log(`🔌 Conexão interrompida: ${socket.id}`);
            
            socketNomes.delete(socket.id);
            
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