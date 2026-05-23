/* ==========================================================================
   FACECLAIM SOCKET - BUSCA DE IMAGENS VIA TMDB + VALIDAÇÃO GROQ
   ========================================================================== */

const Player = require('../models/Player');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ==================== FUNÇÃO DE SIMILARIDADE ====================
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const custo = a[j-1] === b[i-1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i-1][j] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j-1] + custo
            );
        }
    }
    return matrix[b.length][a.length];
}

function nomesParecidos(nome1, nome2) {
    const limpo1 = nome1.toLowerCase().replace(/[^a-záéíóúãõç]/g, '');
    const limpo2 = nome2.toLowerCase().replace(/[^a-záéíóúãõç]/g, '');
    
    const distancia = levenshtein(limpo1, limpo2);
    const maxLen = Math.max(limpo1.length, limpo2.length);
    const similaridade = (maxLen - distancia) / maxLen;
    
    return similaridade > 0.80; // 85% de similaridade bloqueia erros de digitação
}

function configurarFaceclaimSocket(io, socket, { groq }) {
    
    socket.on('buscarFaceclaim', async (nomeFamoso) => {
        try {
            const nomeLimpo = nomeFamoso.toLowerCase().trim();

            // ========== 1. VERIFICAÇÃO POR SIMILARIDADE LOCAL ==========
            const todosFaceclaims = await Player.find({ faceclaim: { $ne: null } }).select('faceclaim');
            
// Dentro da verificação, antes do for
console.log(`[DEBUG] Verificando similaridade para: "${nomeLimpo}"`);
console.log(`[DEBUG] Total de faceclaims no banco: ${todosFaceclaims.length}`);

            for (const existente of todosFaceclaims) {
                if (nomesParecidos(nomeLimpo, existente.faceclaim)) {
                    return socket.emit('erroServidor', 
                        `⚠️ '@${nomeFamoso}' é muito parecido com '@${existente.faceclaim}' já blindado por outro cidadão.`);
                }
            }

            // ========== 2. VALIDAÇÃO DA GROQ IA ==========
            console.log(`[GROQ] Analisando nome: ${nomeLimpo}`);
            
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `Você é o computador central do simulador de vida "The Feed". 
                        Analise o nome enviado e determine se é uma pessoa REAL famosa (ator, atriz, modelo, cantor, influencer, jogador de futebol, etc).
                        Se for válido, retorne o nome oficial da pessoa em INGLÊS para busca na API de imagens.
                        Responda ESTRITAMENTE em JSON com este formato:
                        { "valido": true/false, "termoBusca": "Nome Oficial em Ingles", "motivoErro": "Mensagem curta se invalido" }`
                    },
                    { role: 'user', content: `Analisar: "${nomeLimpo}"` }
                ],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: "json_object" }
            });

            const analiseIA = JSON.parse(chatCompletion.choices[0].message.content);

            if (!analiseIA.valido) {
                return socket.emit('erroServidor', `🚨 ${analiseIA.motivoErro}`);
            }

            console.log(`[TMDB] Buscando imagens para: "${analiseIA.termoBusca}"`);

            // ========== 3. BUSCA NO TMDB E CAPTURA ID ==========
            let urlsImagens = await buscarImagensTMDB(analiseIA.termoBusca);
            
            // Pega o ID do primeiro resultado para validação futura
            let tmdbId = null;
            const urlBuscaId = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(analiseIA.termoBusca)}&language=pt-BR`;
            const respostaId = await fetch(urlBuscaId);
            const dadosId = await respostaId.json();
            
            if (dadosId.results && dadosId.results.length > 0) {
                tmdbId = dadosId.results[0].id;
            }
            
            // ========== 4. VERIFICA SE O ID DO TMDB JÁ ESTÁ EM USO ==========
            if (tmdbId) {
                const ocupadoPorId = await Player.findOne({ faceclaimId: tmdbId });
                if (ocupadoPorId) {
                    return socket.emit('erroServidor', 
                        `⚠️ '${dadosId.results[0].name}' já está blindado por outro cidadão (identificado pelo TMDB).`);
                }
            }
            
            // ========== 5. EMBARALHAR IMAGENS ==========
            urlsImagens = embaralharArray(urlsImagens);
            
            console.log(`[TMDB] Total de imagens: ${urlsImagens.length}`);
            
            // ========== 6. FALLBACK ==========
            const fallbacks = [
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
            ];

            let idx = 0;
            while (urlsImagens.length < 4) {
                urlsImagens.push(fallbacks[idx % fallbacks.length]);
                idx++;
            }

            socket.emit('faceclaimResultados', { 
                famoso: analiseIA.termoBusca,
                tmdbId: tmdbId,
                urls: urlsImagens 
            });

        } catch (erro) {
            console.error(`[THE FEED] Falha: ${erro.message}`);
            socket.emit('erroServidor', "Falha no sistema. Tente novamente.");
        }
    });
}

// ==================== BUSCA NO TMDB ====================

async function buscarImagensTMDB(termoBusca) {
    const todasImagens = [];
    
    try {
        const urlBusca = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(termoBusca)}&language=pt-BR`;
        const resposta = await fetch(urlBusca);
        const dados = await resposta.json();
        
        if (!dados.results || dados.results.length === 0) {
            return [];
        }
        
        const pessoas = dados.results.slice(0, 3);
        
        for (const pessoa of pessoas) {
            const urlFotos = `${TMDB_BASE_URL}/person/${pessoa.id}/images?api_key=${TMDB_API_KEY}`;
            const respFotos = await fetch(urlFotos);
            const dadosFotos = await respFotos.json();
            
            if (dadosFotos.profiles && dadosFotos.profiles.length > 0) {
                for (const foto of dadosFotos.profiles) {
                    const urlImagem = `https://image.tmdb.org/t/p/w342${foto.file_path}`;
                    if (!todasImagens.includes(urlImagem)) {
                        todasImagens.push(urlImagem);
                    }
                }
            }
        }
        
        console.log(`[TMDB] Total bruto: ${todasImagens.length} imagens`);
        
    } catch (erro) {
        console.error('[TMDB] Erro:', erro);
    }
    
    return todasImagens;
}

async function baixarESalvarImagem(url, playerId) {
    try {
        // Baixa a imagem
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        // Converte para Buffer
        const imageBuffer = Buffer.from(buffer);
        
        // Define o nome do arquivo (padrão: playerId.jpg)
        const filename = `${playerId}.jpg`;
        const filepath = path.join(__dirname, '../../public/uploads/avatars', filename);
        
        // Processa a imagem (redimensiona e otimiza)
        await sharp(imageBuffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(filepath);
        
        // Retorna a URL pública
        return `/uploads/avatars/${filename}`;
        
    } catch (erro) {
        console.error('[IMAGEM] Erro ao salvar:', erro);
        return null;
    }
}

function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = { configurarFaceclaimSocket };