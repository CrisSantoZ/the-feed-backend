const authController = require('../controllers/authController');
const Player = require('../models/Player');
const Account = require('../models/Account');

function configurarAuthSocket(io, socket, context) {
    
    // Cadastro
    socket.on('cadastrarCidadao', async (dadosCadastro) => {
        try {
            const resultado = await authController.registrarCidadao(dadosCadastro);
            socket.emit('cadastroSucesso', resultado);
            console.log(`[THE FEED] Nova conta registrada: @${resultado.conta.username}`);
        } catch (erro) {
            console.error(`[THE FEED] Falha no cadastro: ${erro.message}`);
            socket.emit('erroServidor', erro.message);
        }
    });

    // Login
    socket.on('entrarNoJogo', async (dadosLogin) => {
        try {
            const conta = await authController.autenticarCidadao(dadosLogin);
            socket.emit('loginSucesso', conta);
            console.log(`[THE FEED] Conta @${conta.username} acessou. Personagens: ${conta.personagens.length}`);
        } catch (erro) {
            console.error(`[THE FEED] Falha na conexão: ${erro.message}`);
            socket.emit('erroServidor', erro.message);
        }
    });

    // Finalizar criação de personagem
    socket.on('finalizarCriacaoPersonagem', async (dadosNovoPersonagem) => {
        try {
            const contaAtualizada = await authController.criarNovoPersonagem(dadosNovoPersonagem);
            const novoAvatar = contaAtualizada.personagens[contaAtualizada.personagens.length - 1];

            socket.emit('personagemCriadoSucesso', contaAtualizada);
            io.emit('notificacaoGlobal', `📢 ${novoAvatar.nome} ${novoAvatar.sobrenome} entrou na matriz!`);
            console.log(`[THE FEED] Nova identidade: ${novoAvatar.nome} (@${novoAvatar.faceclaim})`);
        } catch (erro) {
            console.error(`[THE FEED] Falha ao finalizar: ${erro.message}`);
            socket.emit('erroServidor', erro.message);
        }
    });

    // Excluir personagem (Purga)
    socket.on('excluirPersonagem', async (dadosExclusao) => {
        try {
            const { accountId, playerId } = dadosExclusao;

            if (!accountId || !playerId) {
                throw new Error("Parâmetros insuficientes.");
            }

            const playerDeletado = await Player.findByIdAndDelete(playerId);
            if (!playerDeletado) {
                throw new Error("Identidade não localizada.");
            }

            const contaAtualizada = await Account.findByIdAndUpdate(
                accountId,
                { $pull: { personagens: playerId } },
                { returnDocument: 'after' }
            ).populate('personagens');

            if (!contaAtualizada) {
                throw new Error("Conta mãe não localizada.");
            }

            const resposta = contaAtualizada.toObject();
            delete resposta.senha;

            socket.emit('personagemExcluidoSucesso', resposta);
            console.log(`[THE FEED] Identidade eliminada: @${playerDeletado.faceclaim}`);
        } catch (erro) {
            console.error(`[THE FEED] Falha na purga: ${erro.message}`);
            socket.emit('erroServidor', erro.message);
        }
    });

    // Solicitar dados da conta
    socket.on('solicitarDadosConta', async (accountId) => {
        try {
            const conta = await Account.findById(accountId).populate('personagens');
            if (conta) {
                if (conta.personagens && conta.personagens.length > 0) {
                    socket.emit('loginSucesso', conta);
                } else {
                    socket.emit('listaVazia', conta);
                }
            }
        } catch (erro) {
            console.error("Erro ao sincronizar dados:", erro);
        }
    });

    // Selecionar personagem e iniciar sessão
    socket.on('iniciarSessaoJogo', async (personagemId) => {
        console.log(`[DEBUG] Iniciando sessão para ID: ${personagemId}`);
        try {
            const personagem = await Player.findById(personagemId);
            
            if (!personagem) {
                return socket.emit('erroServidor', "Identidade não encontrada.");
            }

            // Armazena o playerId na sessão do socket
            context.playerIdAtual = personagemId;
            personagem.setOnline(socket.id);
            await personagem.save();

            socket.join(`player_${personagemId}`);
            
            // ========== ENVIA TODOS OS DADOS DO PERSONAGEM ==========
            socket.emit('jogoIniciadoSucesso', {
                id: personagem._id,
                nome: personagem.nome,
                sobrenome: personagem.sobrenome,
                avatarUrl: personagem.avatarUrl,     // ← LINHA ADICIONADA!
                dinheiro: personagem.economia?.dinheiroVivo || 150,
                energia: personagem.necessidades?.energia || 100,
                status: 'online'
            });
            
            console.log(`[THE FEED] Sessão iniciada: ${personagem.nome} ${personagem.sobrenome}`);
            console.log(`[THE FEED] Avatar URL: ${personagem.avatarUrl}`);
            
            // Avisa outros jogadores
            socket.broadcast.emit('jogadorOnline', {
                playerId: personagemId,
                nome: `${personagem.nome} ${personagem.sobrenome}`
            });
            
        } catch (erro) {
            console.error(`[DEBUG] Erro fatal:`, erro);
            socket.emit('erroServidor', "Falha interna no servidor.");
        }
    });
}

module.exports = { configurarAuthSocket };