const EmpresaController = require('../controllers/empresaController');

function configurarEmpresaSocket(io, socket, context) {
    const { playerId } = context;

    socket.on('criarEmpresa', async (dados) => {
        try {
            const resultado = await EmpresaController.criarEmpresa(playerId, dados);
            socket.emit(resultado.sucesso ? 'empresaCriada' : 'erroServidor', resultado);

            if (resultado.sucesso) {
                const notificacao = {
                    tipo: 'empresa',
                    mensagem: `🏢 Empresa ${resultado.empresa.nome} fundada com sucesso!`
                };
                socket.emit('notificacao', notificacao);
            }
        } catch (erro) {
            socket.emit('erroServidor', { erro: erro.message });
        }
    });

    socket.on('listarEmpresas', async () => {
        const resultado = await EmpresaController.listarEmpresasDoJogador(playerId);
        socket.emit('empresasListadas', resultado);
    });

    socket.on('getEmpresa', async (empresaId) => {
        const resultado = await EmpresaController.getEmpresa(empresaId);
        socket.emit('empresaDetalhes', resultado);
    });

    socket.on('abrirVaga', async (dados) => {
        const resultado = await EmpresaController.abrirVaga(dados.empresaId, playerId, dados);
        socket.emit(resultado.sucesso ? 'vagaAberta' : 'erroServidor', resultado);
    });

    socket.on('candidatarVaga', async (dados) => {
        const resultado = await EmpresaController.candidatarVaga(dados.empresaId, dados.vagaId, playerId);
        socket.emit(resultado.sucesso ? 'candidaturaEnviada' : 'erroServidor', resultado);
    });

    socket.on('contratarFuncionario', async (dados) => {
        const resultado = await EmpresaController.contratarFuncionario(
            dados.empresaId, dados.vagaId, dados.playerId, dados.unidadeIndex
        );
        socket.emit(resultado.sucesso ? 'funcionarioContratado' : 'erroServidor', resultado);

        if (resultado.sucesso) {
            const playerSocket = context.playerSockets?.get(dados.playerId);
            if (playerSocket) {
                io.to(playerSocket).emit('notificacao', {
                    tipo: 'emprego',
                    mensagem: `🎉 Você foi contratado como ${dados.cargo || 'funcionário'}!`
                });
            }
        }
    });

    socket.on('demitirFuncionario', async (funcionarioId) => {
        const resultado = await EmpresaController.demitirFuncionario(null, playerId, funcionarioId);
        socket.emit(resultado.sucesso ? 'funcionarioDemitido' : 'erroServidor', resultado);
    });

    socket.on('pedirDemissao', async (empresaId) => {
        const resultado = await EmpresaController.pedirDemissao(empresaId, playerId);
        socket.emit(resultado.sucesso ? 'demissaoEfetuada' : 'erroServidor', resultado);
    });

    socket.on('listarVagas', async (dados) => {
        const resultado = await EmpresaController.listarVagasDisponiveis(
            dados?.pais, dados?.estado, dados?.cidade
        );
        socket.emit('vagasListadas', resultado);
    });

    socket.on('expandirUnidade', async (dados) => {
        const resultado = await EmpresaController.expandirUnidade(dados.empresaId, playerId, dados);
        socket.emit(resultado.sucesso ? 'unidadeExpandida' : 'erroServidor', resultado);
    });
}

module.exports = { configurarEmpresaSocket };
