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
        player.economia.empresaNome = empresa.nomeFantasia || empresa.nome;
        player.economia.cargo = 'CEO';
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

        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };

        const hab = player.habilidades;
        const nivelPlayer = hab?.estatisticas?.nivelMedio || 1;

        if (nivelPlayer < vaga.requisitos.nivelMinimo) {
            return { sucesso: false, erro: `Requer nível mínimo ${vaga.requisitos.nivelMinimo}. Seu nível: ${nivelPlayer}` };
        }

        const reqAtributos = vaga.requisitos?.atributos || {};
        const atributosFaltando = [];

        for (const [attr, nivelNeeded] of Object.entries(reqAtributos)) {
            let nivelAtual = 0;
            const caminhos = attr.split('.');
            if (caminhos.length === 2) {
                nivelAtual = hab?.[caminhos[0]]?.[caminhos[1]]?.nivel || 0;
            } else if (caminhos.length === 1) {
                nivelAtual = hab?.fisicas?.[attr]?.nivel || hab?.mentais?.[attr]?.nivel || hab?.sociais?.[attr]?.nivel || hab?.profissionais?.[attr]?.nivel || 0;
            }
            if (nivelAtual < nivelNeeded) {
                atributosFaltando.push(`${attr} (${nivelAtual}/${nivelNeeded})`);
            }
        }

        if (atributosFaltando.length > 0) {
            return { sucesso: false, erro: `Atributos insuficientes: ${atributosFaltando.join(', ')}` };
        }

        // Se empresa é NPC (sem dono), contrata automaticamente
        if (!empresa.dono) {
            const idxUnidade = empresa.unidades.findIndex(u => u.funcionarios.length < u.capacidadeMaxima);
            if (idxUnidade === -1) {
                return { sucesso: false, erro: 'Todas as unidades estão com capacidade máxima' };
            }

            empresa.unidades[idxUnidade].funcionarios.push({
                playerId,
                cargo: vaga.cargo,
                salario: vaga.salario,
                dataContratacao: new Date(),
                status: 'ativo'
            });

            vaga.status = 'preenchida';
            empresa.totalFuncionariosContratados += 1;
            await empresa.save();

            player.economia.empresaId = empresa._id;
            player.economia.empresaNome = empresa.nomeFantasia || empresa.nome;
            player.economia.cargo = vaga.cargo;
            player.economia.salario = vaga.salario;
            player.economia.ultimoPagamentoSalario = null;
            await player.save();

            return {
                sucesso: true,
                contratado: true,
                mensagem: `🎉 Contratado como ${vaga.cargo} na ${empresa.nomeFantasia || empresa.nome}! Salário: R$ ${vaga.salario}/semana`,
                cargo: vaga.cargo,
                empresa: empresa.nomeFantasia || empresa.nome,
                empresaId: empresa._id,
                salario: vaga.salario
            };
        }

        if (vaga.candidatos.includes(playerId)) {
            return { sucesso: false, erro: 'Você já se candidatou a esta vaga' };
        }

        vaga.candidatos.push(playerId);
        await empresa.save();

        return { sucesso: true, mensagem: 'Candidatura enviada! Aguarde o dono analisar.' };
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
            player.economia.empresaNome = empresa.nomeFantasia || empresa.nome;
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
                    demitido.economia.empresaNome = null;
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
                    player.economia.empresaNome = null;
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
        const agora = new Date();
        const UMA_SEMANA_MS = 7 * 60 * 1000; // 7 minutos (1 tick = 1 min, 1 semana = 7 ticks)

        for (const empresa of empresas) {
            for (const unidade of empresa.unidades || []) {
                for (const func of unidade.funcionarios || []) {
                    if (func.status !== 'ativo') continue;

                    const player = await Player.findById(func.playerId);
                    if (!player) continue;

                    const ultimoPagamento = player.economia?.ultimoPagamentoSalario;
                    const podePagar = !ultimoPagamento || (agora.getTime() - new Date(ultimoPagamento).getTime()) >= UMA_SEMANA_MS;

                    if (!podePagar) continue;

                    player.economia.dinheiroVivo += func.salario;
                    player.economia.ultimoPagamentoSalario = agora;
                    func.ultimoPagamento = agora;
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
                        categoria: vaga.categoria || 'entry',
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
