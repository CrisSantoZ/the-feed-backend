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

    // Login (agora suporta reconexão por playerId)
    socket.on('entrarNoJogo', async (dadosLogin) => {
    try {
        let conta;
        
        // Reconexão por playerId
        if (dadosLogin.playerId) {
            console.log(`[AUTH] Reconexão para playerId: ${dadosLogin.playerId}`);
            
            const player = await Player.findById(dadosLogin.playerId).populate('accountId');
            
            if (!player) {
                return socket.emit('erroServidor', "Personagem não encontrado.");
            }
            
            const account = await Account.findById(player.accountId).populate('personagens');
            
            if (!account) {
                return socket.emit('erroServidor', "Conta não encontrada.");
            }
            
            // Marca como online
            player.setOnline(socket.id);
            await player.save();
            
            // ========== PULA A TELA DE SELEÇÃO ==========
            // Inicia a sessão do jogo diretamente
            socket.join(`player_${player._id}`);
            
            socket.emit('jogoIniciadoSucesso', {
                id: player._id,
                nome: player.nome,
                sobrenome: player.sobrenome,
                avatarUrl: player.avatarUrl,
                simboloMoeda: player.economia?.simboloMoeda || 'R$',
                moeda: player.economia?.moedaAtual || 'BRL',
                dinheiro: player.economia?.dinheiroVivo || 150,
                energia: player.necessidades?.energia || 100,
                pais: player.localizacao?.paisAtual || 'Brasil',
                estado: player.localizacao?.estadoAtual || 'São Paulo',
                cidade: player.localizacao?.cidadeAtual || 'São Paulo',
                status: 'online'
            });
            
            socket.broadcast.emit('jogadorOnline', {
                playerId: player._id,
                nome: `${player.nome} ${player.sobrenome}`
            });
            
            console.log(`[AUTH] Reconexão bem-sucedida: ${player.nome}`);
            return;
        }
        
        // Login normal (usuário/senha)
        conta = await authController.autenticarCidadao(dadosLogin);
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
        await iniciarSessaoPersonagem(socket, null, context, personagemId);
    });
    
    // Função auxiliar para iniciar sessão do personagem
    async function iniciarSessaoPersonagem(socket, personagem = null, context, personagemId = null) {
        let personagemFinal = personagem;
        
        if (!personagemFinal && personagemId) {
            personagemFinal = await Player.findById(personagemId);
        }
        
        if (!personagemFinal) {
            return socket.emit('erroServidor', "Identidade não encontrada.");
        }
        
        console.log(`[DEBUG] Iniciando sessão para: ${personagemFinal.nome}`);
        
        // Armazena o playerId na sessão do socket
        context.playerIdAtual = personagemFinal._id;
        personagemFinal.setOnline(socket.id);
console.log(`[AUTH] socketId salvo: ${socket.id} para ${personagemFinal.nome}`);
await personagemFinal.save();
        await personagemFinal.save();

        socket.join(`player_${personagemFinal._id}`);
        
        // ========== ENVIA TODOS OS DADOS DO PERSONAGEM ==========
        socket.emit('jogoIniciadoSucesso', {
            id: personagemFinal._id,
            nome: personagemFinal.nome,
            sobrenome: personagemFinal.sobrenome,
            avatarUrl: personagemFinal.avatarUrl,
            simboloMoeda: personagemFinal.economia?.simboloMoeda || 'R$',
            moeda: personagemFinal.economia?.moedaAtual || 'BRL',
            dinheiro: personagemFinal.economia?.dinheiroVivo || 150,
            energia: personagemFinal.necessidades?.energia || 100,
            status: 'online'
        });
        
        console.log(`[THE FEED] Sessão iniciada: ${personagemFinal.nome} ${personagemFinal.sobrenome}`);
        console.log(`[THE FEED] Moeda: ${personagemFinal.economia?.simboloMoeda} (${personagemFinal.economia?.moedaAtual})`);
        
        // Avisa outros jogadores
        socket.broadcast.emit('jogadorOnline', {
            playerId: personagemFinal._id,
            nome: `${personagemFinal.nome} ${personagemFinal.sobrenome}`
        });
    }
}

module.exports = { configurarAuthSocket };