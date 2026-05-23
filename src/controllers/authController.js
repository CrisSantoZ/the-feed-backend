const Account = require('../models/Account');
const Player = require('../models/Player');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

// ==================== CONFIGURAÇÃO CLOUDINARY ====================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== FUNÇÃO PARA UPLOAD PARA CLOUDINARY ====================
async function uploadParaCloudinary(url, playerId, nome, sobrenome) {
    try {
        console.log(`[CLOUDINARY] Enviando avatar para ${nome} ${sobrenome}...`);
        
        const resultado = await cloudinary.uploader.upload(url, {
            folder: 'the-feed/avatars',
            public_id: playerId.toString(),
            transformation: [
                { width: 200, height: 200, crop: 'fill' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        
        console.log(`[CLOUDINARY] Upload concluído: ${resultado.secure_url}`);
        return resultado.secure_url;
        
    } catch (erro) {
        console.error('[CLOUDINARY] Erro no upload:', erro.message);
        return null;
    }
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
 * NOVA IDENTIDADE: Grava o avatar no Cloudinary e garante exclusividade do Faceclaim
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

    // 5. Criação do personagem (avatarUrl temporário)
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

    // 6. UPLOAD PARA CLOUDINARY
    console.log(`[THE FEED] Enviando avatar para Cloudinary: ${nome} ${sobrenome}...`);
    const avatarCloudinary = await uploadParaCloudinary(avatarUrl, novoPlayer._id, nome, sobrenome);
    
    if (avatarCloudinary) {
        novoPlayer.avatarUrl = avatarCloudinary;
        await novoPlayer.save();
        console.log(`[THE FEED] Avatar salvo no Cloudinary: ${avatarCloudinary}`);
    } else {
        // Fallback: avatar com iniciais
        const iniciais = (nome.charAt(0) + sobrenome.charAt(0)).toUpperCase();
        const fallbackUrl = `https://ui-avatars.com/api/?background=00f3ff&color=fff&bold=true&size=200&name=${encodeURIComponent(iniciais)}`;
        novoPlayer.avatarUrl = fallbackUrl;
        await novoPlayer.save();
        console.warn(`[THE FEED] Usando fallback para avatar: ${fallbackUrl}`);
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
    
    console.log(`[THE FEED] Novo personagem criado: ${nome} ${sobrenome} em ${paisOrigem}/${cidadeOrigem}`);
    console.log(`[THE FEED] Avatar final: ${novoPlayer.avatarUrl}`);
    
    return resposta;
}

// Função para deletar avatar do Cloudinary (útil ao excluir personagem)
async function deletarAvatarCloudinary(playerId) {
    try {
        const publicId = `the-feed/avatars/${playerId}`;
        await cloudinary.uploader.destroy(publicId);
        console.log(`[CLOUDINARY] Avatar deletado: ${playerId}`);
        return true;
    } catch (erro) {
        console.error('[CLOUDINARY] Erro ao deletar:', erro.message);
        return false;
    }
}

module.exports = {
    registrarCidadao,
    autenticarCidadao,
    criarNovoPersonagem,
    deletarAvatarCloudinary
};