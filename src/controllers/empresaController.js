const Empresa = require('../models/Empresa');
const Player = require('../models/Player');

async function criarEmpresa(playerId, dados) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };

        const nome = dados.nome?.trim();
        if (!nome) return { sucesso: false, erro: 'Nome da empresa é obrigatório' };

        const existente = await Empresa.findOne({ nome });
        if (existente) return { sucesso: false, erro: 'Já existe uma empresa com este nome' };

        const empresa = new Empresa({
            nome,
            nomeFantasia: dados.nomeFantasia || nome,
            descricao: dados.descricao || '',
            ramo: dados.ramo || 'outro',
            dono: playerId,
            capitalSocial: dados.capitalSocial || 0,
            unidades: [{
                nome: 'Matriz',
                pais: dados.pais || 'Brasil',
                estado: dados.estado || 'São Paulo',
                cidade: dados.cidade || 'São Paulo',
                endereco: dados.endereco || '',
                capacidadeMaxima: dados.capacidadeMaxima || 10,
                nivel: 1,
                faturamentoBase: dados.faturamentoBase || 1000
            }]
        });

        await empresa.save();

        player.economia.empresaId = empresa._id;
        await player.save();

        return { sucesso: true, empresa: empresa.getResumo() };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function listarEmpresasDoJogador(playerId) {
    try {
        const empresas = await Empresa.find({ $or: [{ dono: playerId }, { socios: playerId }] });
        return { sucesso: true, empresas: empresas.map(e => e.getResumo()) };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getEmpresa(empresaId) {
    try {
        const empresa = await Empresa.findById(empresaId)
            .populate('unidades.funcionarios.playerId', 'nome sobrenome avatarUrl')
            .populate('dono', 'nome sobrenome');
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };
        return { sucesso: true, empresa };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function abrirVaga(empresaId, playerId, dados) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };
        if (empresa.dono.toString() !== playerId) return { sucesso: false, erro: 'Apenas o dono pode abrir vagas' };

        empresa.vagasAbertas.push({
            cargo: dados.cargo,
            descricao: dados.descricao || '',
            salario: dados.salario,
            requisitos: {
                habilidades: dados.requisitos?.habilidades || [],
                nivelMinimo: dados.requisitos?.nivelMinimo || 1
            }
        });

        await empresa.save();
        return { sucesso: true, vaga: empresa.vagasAbertas[empresa.vagasAbertas.length - 1] };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function candidatarVaga(empresaId, vagaId, playerId) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };

        const vaga = empresa.vagasAbertas.id(vagaId);
        if (!vaga) return { sucesso: false, erro: 'Vaga não encontrada' };
        if (vaga.status !== 'aberta') return { sucesso: false, erro: 'Vaga não está mais aberta' };

        if (vaga.candidatos.includes(playerId)) {
            return { sucesso: false, erro: 'Você já se candidatou a esta vaga' };
        }

        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };

        const nivelPlayer = player.habilidades?.estatisticas?.nivelMedio || 1;
        if (nivelPlayer < vaga.requisitos.nivelMinimo) {
            return { sucesso: false, erro: `Requer nível mínimo ${vaga.requisitos.nivelMinimo}. Seu nível: ${nivelPlayer}` };
        }

        vaga.candidatos.push(playerId);
        await empresa.save();

        return { sucesso: true, mensagem: 'Candidatura enviada com sucesso!' };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function contratarFuncionario(empresaId, vagaId, playerId, unidadeIndex) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };

        const vaga = empresa.vagasAbertas.id(vagaId);
        if (!vaga) return { sucesso: false, erro: 'Vaga não encontrada' };

        const idx = unidadeIndex || 0;
        if (!empresa.unidades[idx]) return { sucesso: false, erro: 'Unidade não encontrada' };

        if (empresa.unidades[idx].funcionarios.length >= empresa.unidades[idx].capacidadeMaxima) {
            return { sucesso: false, erro: 'Unidade está com capacidade máxima' };
        }

        empresa.unidades[idx].funcionarios.push({
            playerId,
            cargo: vaga.cargo,
            salario: vaga.salario,
            dataContratacao: new Date(),
            status: 'ativo'
        });

        vaga.status = 'preenchida';
        empresa.totalFuncionariosContratados += 1;
        await empresa.save();

        const player = await Player.findById(playerId);
        if (player) {
            player.economia.empresaId = empresa._id;
            player.economia.cargo = vaga.cargo;
            player.economia.salario = vaga.salario;
            await player.save();
        }

        return { sucesso: true, mensagem: `Contratado como ${vaga.cargo}` };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function demitirFuncionario(empresaId, playerId, funcionarioId) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };
        if (empresa.dono.toString() !== playerId) return { sucesso: false, erro: 'Apenas o dono pode demitir' };

        for (const unidade of empresa.unidades) {
            const idx = unidade.funcionarios.findIndex(f => f._id.toString() === funcionarioId);
            if (idx !== -1) {
                unidade.funcionarios[idx].status = 'demitido';
                empresa.totalFuncionariosDemitidos += 1;
                await empresa.save();

                const demitido = await Player.findById(unidade.funcionarios[idx].playerId);
                if (demitido) {
                    demitido.economia.empresaId = null;
                    demitido.economia.cargo = null;
                    demitido.economia.salario = 0;
                    await demitido.save();
                }

                return { sucesso: true, mensagem: 'Funcionário demitido' };
            }
        }
        return { sucesso: false, erro: 'Funcionário não encontrado' };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function pedirDemissao(empresaId, playerId) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };

        for (const unidade of empresa.unidades) {
            const idx = unidade.funcionarios.findIndex(f =>
                f.playerId.toString() === playerId && f.status === 'ativo'
            );
            if (idx !== -1) {
                unidade.funcionarios[idx].status = 'demitido';
                await empresa.save();

                const player = await Player.findById(playerId);
                if (player) {
                    player.economia.empresaId = null;
                    player.economia.cargo = null;
                    player.economia.salario = 0;
                    await player.save();
                }

                return { sucesso: true, mensagem: 'Você se demitiu do cargo' };
            }
        }
        return { sucesso: false, erro: 'Você não trabalha nesta empresa' };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function processarSalarios() {
    try {
        const empresas = await Empresa.find({ ativa: true });
        let totalPago = 0;

        for (const empresa of empresas) {
            for (const unidade of empresa.unidades || []) {
                for (const func of unidade.funcionarios || []) {
                    if (func.status !== 'ativo') continue;

                    const player = await Player.findById(func.playerId);
                    if (!player) continue;

                    player.economia.dinheiroVivo += func.salario;
                    func.ultimoPagamento = new Date();
                    await player.save();
                    totalPago += func.salario;
                }
            }

            empresa.faturamentoMensal = empresa.calcularFaturamento();
            empresa.despesasFixas = empresa.calcularDespesas();
            empresa.lucroMensal = empresa.faturamentoMensal - empresa.despesasFixas;

            if (empresa.lucroMensal > 0 && empresa.dono) {
                const dono = await Player.findById(empresa.dono);
                if (dono) {
                    dono.economia.dinheiroVivo += Math.round(empresa.lucroMensal * 0.5);
                    empresa.saldoConta += Math.round(empresa.lucroMensal * 0.5);
                    await dono.save();
                }
            }

            if (empresa.faturamentoMensal > empresa.maiorFaturamentoMensal) {
                empresa.maiorFaturamentoMensal = empresa.faturamentoMensal;
            }

            empresa.experiencia += Math.round(empresa.faturamentoMensal / 100);
            empresa.nivel = Math.min(100, Math.floor(empresa.experiencia / 1000) + 1);

            await empresa.save();
        }

        return { sucesso: true, totalPago };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function listarVagasDisponiveis(pais, estado, cidade) {
    try {
        const filtro = { 'vagasAbertas.status': 'aberta' };
        if (cidade) filtro['unidades.cidade'] = cidade;
        if (estado) filtro['unidades.estado'] = estado;
        if (pais) filtro['unidades.pais'] = pais;

        const empresas = await Empresa.find(filtro).select('nome nomeFantasia ramo nivel reputacao vagasAbertas');
        
        const vagas = [];
        for (const empresa of empresas) {
            for (const vaga of empresa.vagasAbertas) {
                if (vaga.status === 'aberta') {
                    vagas.push({
                        id: vaga._id,
                        empresaId: empresa._id,
                        empresaNome: empresa.nomeFantasia || empresa.nome,
                        ramo: empresa.ramo,
                        nivelEmpresa: empresa.nivel,
                        cargo: vaga.cargo,
                        descricao: vaga.descricao,
                        salario: vaga.salario,
                        requisitos: vaga.requisitos,
                        totalCandidatos: vaga.candidatos?.length || 0
                    });
                }
            }
        }

        return { sucesso: true, vagas };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function expandirUnidade(empresaId, playerId, dados) {
    try {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) return { sucesso: false, erro: 'Empresa não encontrada' };
        if (empresa.dono.toString() !== playerId) return { sucesso: false, erro: 'Apenas o dono pode expandir' };

        const custo = 5000 * (empresa.unidades.length + 1);
        const dono = await Player.findById(playerId);
        if (!dono || (dono.economia.dinheiroVivo || 0) < custo) {
            return { sucesso: false, erro: `Saldo insuficiente. Custo: R$ ${custo}` };
        }

        dono.economia.dinheiroVivo -= custo;
        await dono.save();

        empresa.unidades.push({
            nome: dados.nome || `Unidade ${empresa.unidades.length + 1}`,
            pais: dados.pais || 'Brasil',
            estado: dados.estado || empresa.unidades[0]?.estado || 'São Paulo',
            cidade: dados.cidade || empresa.unidades[0]?.cidade || 'São Paulo',
            endereco: dados.endereco || '',
            capacidadeMaxima: dados.capacidadeMaxima || 10,
            nivel: 1,
            faturamentoBase: dados.faturamentoBase || 1000
        });

        await empresa.save();
        return { sucesso: true, mensagem: `Nova unidade criada em ${dados.cidade || empresa.unidades[0]?.cidade}` };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    criarEmpresa,
    listarEmpresasDoJogador,
    getEmpresa,
    abrirVaga,
    candidatarVaga,
    contratarFuncionario,
    demitirFuncionario,
    pedirDemissao,
    processarSalarios,
    listarVagasDisponiveis,
    expandirUnidade
};
