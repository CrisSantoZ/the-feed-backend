const EmpresaController = require('../controllers/empresaController');

function configurarEmpresaSocket(io, socket, context) {
    const getPlayerId = () => {
        const pid = context.session?.playerId;
        console.log(`[VAGAS] getPlayerId = ${pid}`);
        return pid || null;
    };

    socket.on('criarEmpresa', async (dados) => {
        try {
            const playerId = getPlayerId();
            if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
            const resultado = await EmpresaController.criarEmpresa(playerId, dados);
            socket.emit(resultado.sucesso ? 'empresaCriada' : 'erroServidor', resultado);
            if (resultado.sucesso) {
                socket.emit('notificacao', { tipo: 'empresa', mensagem: `🏢 ${resultado.empresa.nome} fundada com sucesso!` });
            }
        } catch (erro) {
            socket.emit('erroServidor', { erro: erro.message });
        }
    });

    socket.on('listarEmpresas', async () => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('empresasListadas', { sucesso: true, empresas: [] });
        const resultado = await EmpresaController.listarEmpresasDoJogador(playerId);
        socket.emit('empresasListadas', resultado);
    });

    socket.on('getEmpresa', async (empresaId) => {
        const resultado = await EmpresaController.getEmpresa(empresaId);
        socket.emit('empresaDetalhes', resultado);
    });

    socket.on('abrirVaga', async (dados) => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
        const resultado = await EmpresaController.abrirVaga(dados.empresaId, playerId, dados);
        socket.emit(resultado.sucesso ? 'vagaAberta' : 'erroServidor', resultado);
    });

    socket.on('candidatarVaga', async (dados) => {
        const playerId = getPlayerId();
        console.log(`[VAGAS] candidatarVaga: playerId=${playerId}, vagaId=${dados.vagaId}, empresaId=${dados.empresaId}`);
        if (!playerId) return socket.emit('candidaturaEnviada', { sucesso: false, erro: 'Jogador não identificado. Faça login novamente.' });
        const resultado = await EmpresaController.candidatarVaga(dados.empresaId, dados.vagaId, playerId);
        console.log(`[VAGAS] resultado candidatura:`, resultado);
        socket.emit('candidaturaEnviada', resultado);
    });

    socket.on('contratarFuncionario', async (dados) => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
        const resultado = await EmpresaController.contratarFuncionario(dados.empresaId, dados.vagaId, dados.playerId, dados.unidadeIndex);
        socket.emit(resultado.sucesso ? 'funcionarioContratado' : 'erroServidor', resultado);
        if (resultado.sucesso) {
            const targetSocketId = context.socketNomes ? [...context.socketNomes.entries()].find(([, v]) => v === dados.playerId)?.[0] : null;
            if (targetSocketId) {
                io.to(targetSocketId).emit('notificacao', { tipo: 'emprego', mensagem: `🎉 Você foi contratado como ${dados.cargo || 'funcionário'}!` });
            }
        }
    });

    socket.on('demitirFuncionario', async (funcionarioId) => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
        const resultado = await EmpresaController.demitirFuncionario(null, playerId, funcionarioId);
        socket.emit(resultado.sucesso ? 'funcionarioDemitido' : 'erroServidor', resultado);
    });

    socket.on('pedirDemissao', async (empresaId) => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
        const resultado = await EmpresaController.pedirDemissao(empresaId, playerId);
        socket.emit(resultado.sucesso ? 'demissaoEfetuada' : 'erroServidor', resultado);
    });

    socket.on('listarVagas', async (dados) => {
        const resultado = await EmpresaController.listarVagasDisponiveis(dados?.pais, dados?.estado, dados?.cidade);
        socket.emit('vagasListadas', resultado);
    });

    socket.on('expandirUnidade', async (dados) => {
        const playerId = getPlayerId();
        if (!playerId) return socket.emit('erroServidor', { erro: 'Jogador não identificado' });
        const resultado = await EmpresaController.expandirUnidade(dados.empresaId, playerId, dados);
        socket.emit(resultado.sucesso ? 'unidadeExpandida' : 'erroServidor', resultado);
    });
}

module.exports = { configurarEmpresaSocket };
