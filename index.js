/* ==========================================================================
   EIXO CENTRAL DA MATRIZ - index.js (INICIALIZADOR DO SERVIDOR)
   ========================================================================== */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// CORREÇÃO: Arquivos estão dentro da pasta SRC!
const { conectarBanco } = require('./src/config/database');
const { configurarSockets } = require('./src/sockets/gameSocket');  // ou ./src/config/gamesocket?
const { iniciarTickService, getTickStatus } = require('./src/services/tickService');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

async function iniciarServidor() {
    try {
        await conectarBanco();
        console.log('✅ Banco de dados conectado');

        configurarSockets(io);
        console.log('✅ Sockets configurados');

        iniciarTickService(io);
        console.log('✅ Tick Service iniciado');

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });
        
    } catch (erro) {
        console.error("🚨 FALHA CRÍTICA:", erro.message);
        process.exit(1);
    }
}

iniciarServidor();

process.on('SIGINT', async () => {
    console.log('\n🛑 Desligando servidor...');
    await mongoose.disconnect();
    process.exit(0);
});