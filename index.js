/* ==========================================================================
   EIXO CENTRAL DA MATRIZ - index.js (INICIALIZADOR DO SERVIDOR)
   ========================================================================== */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const { conectarBanco } = require('./src/config/database');
const { configurarSockets } = require('./src/sockets/gameSocket');
const { iniciarTickService } = require('./src/services/tickService');
const { seedEmpresas } = require('./src/seed/empresasSeed');

const app = express();

// CORS para múltiplas origens
const origensPermitidas = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['https://the-feed-peach.vercel.app', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: origensPermitidas,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));

// ==================== SERVER ARQUIVOS ESTÁTICOS (AVATARS) ====================
app.use('/uploads', express.static('public/uploads'));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: origensPermitidas,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
});

async function iniciarServidor() {
    try {
        await conectarBanco();
        console.log('✅ Banco de dados conectado');

        configurarSockets(io);
        console.log('✅ Sockets configurados');

        iniciarTickService(io);
        console.log('✅ Tick Service iniciado');

        await seedEmpresas();

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