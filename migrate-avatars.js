// migrate-avatars.js
// Script para migrar avatares do TMDB para o Cloudinary

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Player = require('./src/models/Player');

// ==================== CONFIGURAÇÃO CLOUDINARY ====================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== FUNÇÃO DE UPLOAD ====================
async function uploadParaCloudinary(url, playerId, nome) {
    try {
        console.log(`[${nome}] Enviando para Cloudinary...`);
        
        const resultado = await cloudinary.uploader.upload(url, {
            folder: 'the-feed/avatars',
            public_id: playerId.toString(),
            transformation: [
                { width: 200, height: 200, crop: 'fill' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        
        console.log(`✅ [${nome}] Upload concluído: ${resultado.secure_url.substring(0, 60)}...`);
        return resultado.secure_url;
        
    } catch (erro) {
        console.error(`❌ [${nome}] Erro no upload:`, erro.message);
        return null;
    }
}

// ==================== FUNÇÃO PRINCIPAL ====================
async function migrarAvatares() {
    try {
        // Conectar ao MongoDB
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado!\n');

        // Buscar personagens com avatar do TMDB
        const players = await Player.find({
            avatarUrl: { $regex: /tmdb\.org|image\.tmdb/ }
        });

        console.log(`📸 Encontrados ${players.length} personagens com avatar do TMDB\n`);

        if (players.length === 0) {
            console.log('🎉 Nenhum personagem precisa ser migrado!');
            await mongoose.disconnect();
            return;
        }

        let sucesso = 0;
        let falha = 0;

        // Migrar um por um
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const nomeCompleto = `${player.nome} ${player.sobrenome}`;
            
            console.log(`\n[${i + 1}/${players.length}] Processando: ${nomeCompleto}`);
            console.log(`   URL atual: ${player.avatarUrl.substring(0, 80)}...`);
            
            const novaUrl = await uploadParaCloudinary(player.avatarUrl, player._id, nomeCompleto);
            
            if (novaUrl) {
                player.avatarUrl = novaUrl;
                await player.save();
                sucesso++;
                console.log(`   ✅ Nova URL salva!`);
            } else {
                // Fallback: avatar com iniciais
                const iniciais = (player.nome.charAt(0) + player.sobrenome.charAt(0)).toUpperCase();
                const fallbackUrl = `https://ui-avatars.com/api/?background=00f3ff&color=fff&bold=true&size=200&name=${encodeURIComponent(iniciais)}`;
                player.avatarUrl = fallbackUrl;
                await player.save();
                falha++;
                console.log(`   ⚠️ Usando fallback com iniciais: ${fallbackUrl}`);
            }
            
            // Pequena pausa para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Resumo final
        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRAÇÃO CONCLUÍDA!');
        console.log('='.repeat(50));
        console.log(`✅ Sucesso: ${sucesso} personagens`);
        console.log(`⚠️  Fallback: ${falha} personagens`);
        console.log(`📊 Total: ${players.length} personagens processados`);
        console.log('='.repeat(50));

        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');

    } catch (erro) {
        console.error('🚨 ERRO FATAL:', erro);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Executar a migração
console.log('🚀 INICIANDO MIGRAÇÃO DE AVATARES\n');
migrarAvatares();