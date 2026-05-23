const Account = require('../models/Account');
const Player = require('../models/Player');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ==================== FUNÇÃO PARA BAIXAR E SALVAR IMAGEM ====================
async function baixarESalvarImagem(url, playerId) {
    const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
    
    // Cria o diretório se não existir
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filename = `${playerId}.jpg`;
    const filepath = path.join(uploadDir, filename);
    
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : require('http');
        
        client.get(url, (response) => {
            // Verifica se a resposta é uma imagem
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                console.error('[IMAGEM] URL não retornou imagem:', url);
                return resolve(null);
            }
            
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                try {
                    fs.writeFileSync(filepath, Buffer.concat(chunks));
                    console.log(`[IMAGEM] Avatar salvo: ${filename}`);
                    resolve(`/uploads/avatars/${filename}`);
                } catch (err) {
                    console.error('[IMAGEM] Erro ao salvar:', err);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('[IMAGEM] Erro ao baixar:', err.message);
            resolve(null);
        });
        
        // Timeout de 10 segundos
        setTimeout(() => {
            console.error('[IMAGEM] Timeout ao baixar:', url);
            resolve(null);
        }, 10000);
    });
}

/**
 * REGISTRO: Cria a Conta Mãe no banco de dados e aplica a trava de +18 anos
 */
async function registrarCidadao(dados) {
    const { username, email, senha, dataNascimento } = dados;

    // 1. Verificação de maioridade (+18)
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    if (idade < 18) {
        throw new Error("Acesso negado: Perímetro restrito para maiores de 18 anos.");
    }

    // 2. Verifica se a conta já existe
    const contaExistente = await Account.findOne({ 
        $or: [
            { email: email.toLowerCase() }, 
            { username: username.toLowerCase() }
        ] 
    });
    
    if (contaExistente) {
        throw new Error("Registro recusado: E-mail ou Nome de Usuário já em uso.");
    }

    // 3. Criptografia da senha
    const saltos = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, saltos);

    // 4. Criação da Conta Mãe
    const novaConta = await Account.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        senha: senhaHash
    });

    const contaResposta = novaConta.toObject();
    delete contaResposta.senha;

    return { conta: contaResposta };
}

/**
 * LOGIN: Valida as credenciais de acesso e traz os personagens populados
 */
async function autenticarCidadao(dadosLogin) {
    const { username, senha } = dadosLogin;

    const conta = await Account.findOne({ username: username.toLowerCase() }).populate('personagens');
    
    if (!conta) {
        throw new Error("Acesso negado: Identidade não encontrada.");
    }

    const senhaValida = await bcrypt.compare(senha, conta.senha);
    if (!senhaValida) {
        throw new Error("Acesso negado: Chave de acesso incorreta.");
    }

    const resposta = conta.toObject();
    delete resposta.senha;
    return resposta;
}

/**
 * NOVA IDENTIDADE: Grava o avatar no banco de dados e garante exclusividade do Faceclaim
 * Agora com suporte para país e cidade de origem!
 */
async function criarNovoPersonagem(dados) {
    const { 
        accountId, 
        nome, 
        sobrenome, 
        dataNascimento, 
        faceclaim, 
        avatarUrl,
        paisOrigem,
        cidadeOrigem
    } = dados;

    // 1. Validação básica
    if (!accountId || !nome || !sobrenome || !dataNascimento || !faceclaim || !avatarUrl) {
        throw new Error("Dados corrompidos ou incompletos enviados ao processador central.");
    }

    // 2. Valida país e cidade
    if (!paisOrigem) {
        throw new Error("Selecione o país de origem do personagem.");
    }
    if (!cidadeOrigem) {
        throw new Error("Selecione a cidade de origem do personagem.");
    }

    // 3. Higieniza o nome do famoso
    const famosoLimpo = faceclaim.toLowerCase().trim();

    // 4. Trava de segurança contra duplicação de identidade
    const faceclaimOcupado = await Player.findOne({ faceclaim: famosoLimpo });
    if (faceclaimOcupado) {
        throw new Error(`A identidade visual de '@${faceclaim}' já foi blindada por outro cidadão na rede.`);
    }

    // 5. Criação do personagem com localização (SALVANDO O AVATAR URL ORIGINAL)
    const novoPlayer = await Player.create({
        accountId,
        nome,
        sobrenome,
        dataNascimento,
        faceclaim: famosoLimpo,
        avatarUrl: avatarUrl, // URL original do TMDB (temporária)
        dinheiro: 150,
        energia: 100,
        emprego: 'Desempregado',
        localizacao: {
            paisAtual: paisOrigem,
            cidadeAtual: cidadeOrigem
        }
    });

    // 6. BAIXA E SALVA A IMAGEM LOCALMENTE
    console.log(`[THE FEED] Baixando avatar para ${nome}...`);
    const avatarLocal = await baixarESalvarImagem(avatarUrl, novoPlayer._id);
    
    if (avatarLocal) {
        // Atualiza o avatarUrl para a URL local
        novoPlayer.avatarUrl = avatarLocal;
        await novoPlayer.save();
        console.log(`[THE FEED] Avatar salvo localmente: ${avatarLocal}`);
    } else {
        console.warn(`[THE FEED] Não foi possível baixar o avatar, mantendo URL original do TMDB`);
        // Mantém a URL original do TMDB como fallback
    }

    // 7. Injeta o ID do novo personagem na Conta Mãe
    const contaAtualizada = await Account.findByIdAndUpdate(
        accountId,
        { $push: { personagens: novoPlayer._id } },
        { returnDocument: 'after' }
    ).populate('personagens');

    if (!contaAtualizada) {
        throw new Error("Erro de sincronização: Conta mãe não encontrada.");
    }

    const resposta = contaAtualizada.toObject();
    delete resposta.senha;
    
    console.log(`[THE FEED] Novo personagem criado: ${nome} ${sobrenome} em ${paisOrigem}/${cidadeOrigem} | Avatar: ${novoPlayer.avatarUrl}`);
    
    return resposta;
}

module.exports = {
    registrarCidadao,
    autenticarCidadao,
    criarNovoPersonagem
};