const Empresa = require('../models/Empresa');

const categorias = {
    entry: { nome: '📋 ENTRY LEVEL', nivelMin: 1, nivelMax: 2 },
    fisicas: { nome: '💪 FÍSICAS', nivelMin: 2, nivelMax: 5 },
    mentais: { nome: '🧠 MENTAIS', nivelMin: 2, nivelMax: 6 },
    profissionais: { nome: '⚙️ PROFISSIONAIS', nivelMin: 3, nivelMax: 8 },
    sociais: { nome: '🗣️ SOCIAIS', nivelMin: 2, nivelMax: 5 },
    gerencia: { nome: '👑 GERÊNCIA', nivelMin: 5, nivelMax: 10 }
};

const empresasData = [
    // ==================== SÃO PAULO ====================
    {
        nome: 'TechSolutions Brasil', nomeFantasia: 'TechSolutions', descricao: 'Empresa de tecnologia especializada em desenvolvimento de software.', ramo: 'tecnologia', cidade: 'São Paulo', estado: 'São Paulo', nivel: 15, faturamentoBase: 5000,
        vagas: [
            { cargo: 'Estagiário de TI', descricao: 'Suporte interno e aprendizado em desenvolvimento.', salarioSemanal: 350, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 5, logica: 5 } } },
            { cargo: 'Desenvolvedor Jr.', descricao: 'Desenvolvimento web com React e Node.js.', salarioSemanal: 900, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { programacao: 10, logica: 15 } } },
            { cargo: 'Desenvolvedor Pleno', descricao: 'Arquitetura de software e code review.', salarioSemanal: 1800, categoria: 'profissionais', requisitos: { nivelMinimo: 5, atributos: { programacao: 25, logica: 20, inteligencia: 15 } } },
            { cargo: 'Analista de Dados', descricao: 'Análise de dados com Python e SQL.', salarioSemanal: 1400, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, inteligencia: 25 } } }
        ]
    },
    {
        nome: 'Construtora NovaVista', nomeFantasia: 'NovaVista', descricao: 'Construtora com mais de 20 anos no mercado imobiliário.', ramo: 'construcao', cidade: 'São Paulo', estado: 'São Paulo', nivel: 20, faturamentoBase: 10000,
        vagas: [
            { cargo: 'Servente de Obra', descricao: 'Auxiliar em canteiro de obras.', salarioSemanal: 500, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { forca: 8 } } },
            { cargo: 'Pedreiro', descricao: 'Assentamento de tijolos e reboco.', salarioSemanal: 900, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, resistencia: 10 } } },
            { cargo: 'Engenheiro Civil', descricao: 'Coordenação de obras e projetos.', salarioSemanal: 2200, categoria: 'profissionais', requisitos: { nivelMinimo: 6, atributos: { inteligencia: 25, logica: 20, gestao: 10 } } }
        ]
    },
    {
        nome: 'MercadoDigital Ltda', nomeFantasia: 'Mercado Digital', descricao: 'Plataforma de e-commerce com atuação nacional.', ramo: 'comercio', cidade: 'São Paulo', estado: 'São Paulo', nivel: 10, faturamentoBase: 4000,
        vagas: [
            { cargo: 'Atendente', descricao: 'Atendimento ao cliente online.', salarioSemanal: 400, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 5 } } },
            { cargo: 'Vendedor Online', descricao: 'Vendas por chat e telefone.', salarioSemanal: 700, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 15, persuasao: 10 } } },
            { cargo: 'Analista de Marketing', descricao: 'Gestão de tráfego e campanhas.', salarioSemanal: 1300, categoria: 'profissionais', requisitos: { nivelMinimo: 4, atributos: { marketing: 15, criatividade: 15, inteligencia: 10 } } }
        ]
    },
    {
        nome: 'Hospital São Paulo', nomeFantasia: 'Hospital SP', descricao: 'Rede hospitalar particular na zona sul.', ramo: 'saude', cidade: 'São Paulo', estado: 'São Paulo', nivel: 18, faturamentoBase: 8000,
        vagas: [
            { cargo: 'Recepcionista', descricao: 'Agendamento e atendimento ao público.', salarioSemanal: 500, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 8, memoria: 5 } } },
            { cargo: 'Técnico de Enfermagem', descricao: 'Auxílio em procedimentos.', salarioSemanal: 800, categoria: 'profissionais', requisitos: { nivelMinimo: 2, atributos: { foco: 15, resistencia: 10 } } },
            { cargo: 'Médico Residente', descricao: 'Plantão no pronto-socorro.', salarioSemanal: 2000, categoria: 'mentais', requisitos: { nivelMinimo: 5, atributos: { inteligencia: 30, foco: 25, memoria: 20 } } }
        ]
    },
    {
        nome: 'Banco do Brasil - Agência Paulista', nomeFantasia: 'Banco do Brasil', descricao: 'Agência bancária com serviços financeiros.', ramo: 'financeiro', cidade: 'São Paulo', estado: 'São Paulo', nivel: 25, faturamentoBase: 12000,
        vagas: [
            { cargo: 'Escriturário', descricao: 'Serviços bancários internos.', salarioSemanal: 600, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 8, memoria: 5 } } },
            { cargo: 'Caixa', descricao: 'Atendimento ao público.', salarioSemanal: 550, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 12, foco: 10 } } },
            { cargo: 'Gerente de Contas', descricao: 'Gestão de carteira de clientes.', salarioSemanal: 2500, categoria: 'gerencia', requisitos: { nivelMinimo: 7, atributos: { gestao: 20, negociacao: 15, carisma: 20, inteligencia: 15 } } },
            { cargo: 'Analista Financeiro', descricao: 'Análise de crédito e investimentos.', salarioSemanal: 1600, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, inteligencia: 20, contabilidade: 10 } } }
        ]
    },
    {
        nome: 'Transportes Rápidos Ltda', nomeFantasia: 'Transportes Rápidos', descricao: 'Logística e transporte intermunicipal.', ramo: 'transporte', cidade: 'São Paulo', estado: 'São Paulo', nivel: 12, faturamentoBase: 4500,
        vagas: [
            { cargo: 'Auxiliar de Logística', descricao: 'Separação e carregamento.', salarioSemanal: 450, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { forca: 8 } } },
            { cargo: 'Motorista de Caminhão', descricao: 'Entregas regionais.', salarioSemanal: 1000, categoria: 'fisicas', requisitos: { nivelMinimo: 3, atributos: { forca: 12, resistencia: 15, foco: 10 } } },
            { cargo: 'Coordenador de Frota', descricao: 'Gestão de motoristas e rotas.', salarioSemanal: 1700, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { gestao: 15, lideranca: 10, logica: 15 } } }
        ]
    },
    {
        nome: 'Restaurante e Lanchonete Metrópole', nomeFantasia: 'Metrópole', descricao: 'Rede de restaurantes populares.', ramo: 'alimenticio', cidade: 'São Paulo', estado: 'São Paulo', nivel: 8, faturamentoBase: 2500,
        vagas: [
            { cargo: 'Atendente de Lanchonete', descricao: 'Anotar pedidos e servir.', salarioSemanal: 380, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 5, resistencia: 5 } } },
            { cargo: 'Cozinheiro', descricao: 'Preparo de refeições.', salarioSemanal: 600, categoria: 'profissionais', requisitos: { nivelMinimo: 2, atributos: { culinaria: 10, foco: 10 } } },
            { cargo: 'Chef de Cozinha', descricao: 'Coordenação da cozinha e cardápio.', salarioSemanal: 1400, categoria: 'gerencia', requisitos: { nivelMinimo: 4, atributos: { culinaria: 20, gestao: 10, criatividade: 15 } } }
        ]
    },

    // ==================== RIO DE JANEIRO ====================
    {
        nome: 'Rede Globo de Televisão', nomeFantasia: 'TV Globo', descricao: 'Maior emissora de TV do Brasil.', ramo: 'entretenimento', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 40, faturamentoBase: 20000,
        vagas: [
            { cargo: 'Office Boy', descricao: 'Serviços internos de entregas.', salarioSemanal: 350, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { velocidade: 8 } } },
            { cargo: 'Editor de Vídeo', descricao: 'Edição e pós-produção.', salarioSemanal: 1000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { design: 15, criatividade: 15, foco: 10 } } },
            { cargo: 'Produtor de Conteúdo', descricao: 'Produção de programas e séries.', salarioSemanal: 1700, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { gestao: 15, criatividade: 20, lideranca: 10 } } },
            { cargo: 'Repórter', descricao: 'Apuração e apresentação de notícias.', salarioSemanal: 1400, categoria: 'sociais', requisitos: { nivelMinimo: 4, atributos: { carisma: 20, persuasao: 15, escrita: 15 } } }
        ]
    },
    {
        nome: 'Hotel Copacabana Palace', nomeFantasia: 'Copacabana Palace', descricao: 'Hotel 5 estrelas em Copacabana.', ramo: 'servicos', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 20, faturamentoBase: 8000,
        vagas: [
            { cargo: 'Camareira', descricao: 'Limpeza e arrumação dos quartos.', salarioSemanal: 450, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { resistencia: 8 } } },
            { cargo: 'Recepcionista Bilíngue', descricao: 'Check-in e atendimento a hóspedes.', salarioSemanal: 700, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 18, memoria: 10 } } },
            { cargo: 'Chef de Cozinha', descricao: 'Comando da cozinha do hotel.', salarioSemanal: 2000, categoria: 'gerencia', requisitos: { nivelMinimo: 6, atributos: { culinaria: 30, gestao: 20, lideranca: 15 } } },
            { cargo: 'Segurança', descricao: 'Vigilância e segurança patrimonial.', salarioSemanal: 600, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, resistencia: 15, agilidade: 10 } } }
        ]
    },
    {
        nome: 'Petrobras - Sede Rio', nomeFantasia: 'Petrobras', descricao: 'Sede administrativa da Petrobras.', ramo: 'industria', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 50, faturamentoBase: 25000,
        vagas: [
            { cargo: 'Auxiliar Administrativo', descricao: 'Suporte administrativo.', salarioSemanal: 600, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 8, foco: 5 } } },
            { cargo: 'Técnico de Segurança do Trabalho', descricao: 'Inspeções e normas de segurança.', salarioSemanal: 1100, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { foco: 18, memoria: 15 } } },
            { cargo: 'Engenheiro de Petróleo', descricao: 'Exploração e produção.', salarioSemanal: 3800, categoria: 'profissionais', requisitos: { nivelMinimo: 8, atributos: { inteligencia: 35, logica: 30, programacao: 10 } } }
        ]
    },

    // ==================== CAMPINAS ====================
    {
        nome: 'Bosch do Brasil - Campinas', nomeFantasia: 'Bosch Campinas', descricao: 'Unidade industrial de automação.', ramo: 'industria', cidade: 'Campinas', estado: 'São Paulo', nivel: 35, faturamentoBase: 15000,
        vagas: [
            { cargo: 'Operador de Produção', descricao: 'Linha de montagem.', salarioSemanal: 700, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 12, resistencia: 10, foco: 10 } } },
            { cargo: 'Técnico Mecânico', descricao: 'Manutenção de equipamentos.', salarioSemanal: 1100, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { logica: 15, inteligencia: 12 } } },
            { cargo: 'Engenheiro de Automação', descricao: 'Sistemas automatizados.', salarioSemanal: 2600, categoria: 'profissionais', requisitos: { nivelMinimo: 6, atributos: { programacao: 20, logica: 25, inteligencia: 20 } } }
        ]
    },
    {
        nome: 'UNICAMP - Departamento Administrativo', nomeFantasia: 'UNICAMP', descricao: 'Setor administrativo da universidade.', ramo: 'educacao', cidade: 'Campinas', estado: 'São Paulo', nivel: 30, faturamentoBase: 7000,
        vagas: [
            { cargo: 'Assistente Administrativo', descricao: 'Suporte aos departamentos.', salarioSemanal: 700, categoria: 'mentais', requisitos: { nivelMinimo: 2, atributos: { inteligencia: 10, memoria: 12, foco: 10 } } },
            { cargo: 'Professor Substituto', descricao: 'Aulas de nível superior.', salarioSemanal: 1400, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { inteligencia: 25, carisma: 15, persuasao: 15 } } },
            { cargo: 'Técnico de Laboratório', descricao: 'Suporte a laboratórios.', salarioSemanal: 900, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { logica: 15, foco: 15 } } }
        ]
    },

    // ==================== SANTOS ====================
    {
        nome: 'Porto de Santos Autoridade Portuária', nomeFantasia: 'Porto de Santos', descricao: 'Maior porto da América Latina.', ramo: 'transporte', cidade: 'Santos', estado: 'São Paulo', nivel: 30, faturamentoBase: 12000,
        vagas: [
            { cargo: 'Vigia Portuário', descricao: 'Segurança patrimonial.', salarioSemanal: 450, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { resistencia: 8, foco: 5 } } },
            { cargo: 'Operador de Empilhadeira', descricao: 'Movimentação de cargas.', salarioSemanal: 800, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, foco: 12 } } },
            { cargo: 'Analista Portuário', descricao: 'Gestão de documentação.', salarioSemanal: 1500, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, inteligencia: 15, memoria: 15 } } }
        ]
    },
    {
        nome: 'Companhia Docas de Santos', nomeFantasia: 'Docas Santos', descricao: 'Administração do porto organizado.', ramo: 'servicos', cidade: 'Santos', estado: 'São Paulo', nivel: 22, faturamentoBase: 9000,
        vagas: [
            { cargo: 'Office Boy', descricao: 'Serviços internos.', salarioSemanal: 380, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { velocidade: 6 } } },
            { cargo: 'Almoxarife', descricao: 'Controle de estoque e materiais.', salarioSemanal: 600, categoria: 'mentais', requisitos: { nivelMinimo: 2, atributos: { memoria: 12, foco: 10 } } },
            { cargo: 'Supervisor de Turno', descricao: 'Coordenação de equipe portuária.', salarioSemanal: 1800, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { lideranca: 18, gestao: 15, resistencia: 12 } } }
        ]
    }
];

async function seedEmpresas() {
    console.log('[SEED] Iniciando população de empresas...');
    let contador = 0;

    for (const data of empresasData) {
        const existente = await Empresa.findOne({ nome: data.nome });

        const vagas = data.vagas.map(v => ({
            cargo: v.cargo,
            descricao: v.descricao,
            salario: v.salarioSemanal,
            categoria: v.categoria,
            requisitos: {
                nivelMinimo: v.requisitos.nivelMinimo,
                atributos: v.requisitos.atributos || {}
            },
            status: 'aberta',
            candidatos: []
        }));

        if (existente) {
            // Atualiza vagas existentes com nova estrutura
            let precisaAtualizar = false;
            for (const vaga of existente.vagasAbertas) {
                if (!vaga.categoria) {
                    vaga.categoria = 'entry';
                    precisaAtualizar = true;
                }
                if (!vaga.requisitos?.atributos) {
                    vaga.requisitos = vaga.requisitos || {};
                    vaga.requisitos.atributos = {};
                    precisaAtualizar = true;
                }
            }
            if (precisaAtualizar) {
                await existente.save();
                console.log(`[SEED] Empresa atualizada: ${data.nome}`);
                contador++;
            } else {
                console.log(`[SEED] Empresa já atualizada: ${data.nome}`);
            }
            continue;
        }

        const empresa = new Empresa({
            nome: data.nome,
            nomeFantasia: data.nomeFantasia,
            descricao: data.descricao,
            ramo: data.ramo,
            dono: null,
            nivel: data.nivel,
            experiencia: (data.nivel - 1) * 1000,
            reputacao: 70,
            unidades: [{
                nome: 'Sede',
                pais: 'Brasil',
                estado: data.estado,
                cidade: data.cidade,
                capacidadeMaxima: 30,
                nivel: Math.ceil(data.nivel / 5),
                faturamentoBase: data.faturamentoBase
            }],
            vagasAbertas: vagas
        });

        await empresa.save();
        contador++;
        console.log(`[SEED] Empresa criada: ${data.nome} (${data.cidade})`);
    }

    console.log(`[SEED] ${contador} empresas criadas de ${empresasData.length}`);
    return contador;
}

module.exports = { seedEmpresas };
