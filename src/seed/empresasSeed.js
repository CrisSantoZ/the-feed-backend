const Empresa = require('../models/Empresa');

const empresasData = [
    // ==================== SÃO PAULO ====================
    {
        nome: 'TechSolutions Brasil',
        nomeFantasia: 'TechSolutions',
        descricao: 'Empresa de tecnologia especializada em desenvolvimento de software e soluções em cloud computing.',
        ramo: 'tecnologia',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 15,
        faturamentoBase: 5000,
        vagas: [
            { cargo: 'Desenvolvedor Pleno', descricao: 'Desenvolvimento web full-stack com React e Node.js.', salario: 5500, nivelMinimo: 3 },
            { cargo: 'Analista de Dados Jr.', descricao: 'Análise de dados com Python e SQL.', salario: 3500, nivelMinimo: 1 },
            { cargo: 'Estagiário de TI', descricao: 'Suporte e manutenção de sistemas internos.', salario: 1200, nivelMinimo: 1 }
        ]
    },
    {
        nome: 'MercadoDigital Ltda',
        nomeFantasia: 'Mercado Digital',
        descricao: 'Plataforma de e-commerce com atuação em todo o Brasil. Escritório na Av. Paulista.',
        ramo: 'comercio',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 10,
        faturamentoBase: 4000,
        vagas: [
            { cargo: 'Vendedor Online', descricao: 'Atendimento e vendas pela plataforma.', salario: 2200, nivelMinimo: 1 },
            { cargo: 'Analista de Marketing', descricao: 'Gestão de tráfego e campanhas digitais.', salario: 3800, nivelMinimo: 2 },
            { cargo: 'Logística', descricao: 'Coordenação de entregas e estoque.', salario: 1800, nivelMinimo: 1 }
        ]
    },
    {
        nome: 'SaúdeTotal Serviços Médicos',
        nomeFantasia: 'SaúdeTotal',
        descricao: 'Rede de clínicas particulares com unidades em toda a zona sul de SP.',
        ramo: 'saude',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 8,
        faturamentoBase: 6000,
        vagas: [
            { cargo: 'Recepcionista', descricao: 'Atendimento ao público e agendamento.', salario: 1800, nivelMinimo: 1 },
            { cargo: 'Técnico de Enfermagem', descricao: 'Auxílio em procedimentos médicos.', salario: 2800, nivelMinimo: 2 }
        ]
    },
    {
        nome: 'Construtora NovaVista',
        nomeFantasia: 'NovaVista',
        descricao: 'Construtora com mais de 20 anos no mercado imobiliário de SP.',
        ramo: 'construcao',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 20,
        faturamentoBase: 10000,
        vagas: [
            { cargo: 'Engenheiro Civil', descricao: 'Coordenação de obras residenciais.', salario: 7000, nivelMinimo: 5 },
            { cargo: 'Pedreiro', descricao: 'Obras e reformas.', salario: 2500, nivelMinimo: 1 },
            { cargo: 'Arquiteto Jr.', descricao: 'Projetos residenciais e comerciais.', salario: 4000, nivelMinimo: 3 }
        ]
    },
    {
        nome: 'Transportes Rápidos Ltda',
        nomeFantasia: 'Transportes Rápidos',
        descricao: 'Empresa de logística e transporte intermunicipal.',
        ramo: 'transporte',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 12,
        faturamentoBase: 4500,
        vagas: [
            { cargo: 'Motorista de Caminhão', descricao: 'Entregas regionais.', salario: 3200, nivelMinimo: 2 },
            { cargo: 'Auxiliar de Logística', descricao: 'Separação e carregamento.', salario: 1800, nivelMinimo: 1 }
        ]
    },
    {
        nome: 'Banco Central do Brasil - Agência SP',
        nomeFantasia: 'Banco Central SP',
        descricao: 'Agência bancária com serviços financeiros completos.',
        ramo: 'financeiro',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        nivel: 25,
        faturamentoBase: 12000,
        vagas: [
            { cargo: 'Gerente de Contas', descricao: 'Gestão de carteira de clientes premium.', salario: 8000, nivelMinimo: 6 },
            { cargo: 'Caixa', descricao: 'Atendimento ao público.', salario: 2200, nivelMinimo: 1 },
            { cargo: 'Analista Financeiro', descricao: 'Análise de crédito e investimentos.', salario: 5000, nivelMinimo: 3 }
        ]
    },

    // ==================== CAMPINAS ====================
    {
        nome: 'Universidade Estadual de Campinas - Administrativo',
        nomeFantasia: 'UNICAMP',
        descricao: 'Setor administrativo da universidade. Vagas para funcionários técnicos.',
        ramo: 'educacao',
        cidade: 'Campinas',
        estado: 'São Paulo',
        nivel: 30,
        faturamentoBase: 8000,
        vagas: [
            { cargo: 'Assistente Administrativo', descricao: 'Suporte administrativo aos departamentos.', salario: 2800, nivelMinimo: 2 },
            { cargo: 'Técnico de Laboratório', descricao: 'Suporte a laboratórios de pesquisa.', salario: 3500, nivelMinimo: 3 }
        ]
    },
    {
        nome: 'Bosch do Brasil - Campinas',
        nomeFantasia: 'Bosch Campinas',
        descricao: 'Unidade industrial da Bosch com foco em automação e componentes automotivos.',
        ramo: 'industria',
        cidade: 'Campinas',
        estado: 'São Paulo',
        nivel: 35,
        faturamentoBase: 15000,
        vagas: [
            { cargo: 'Operador de Produção', descricao: 'Linha de montagem automatizada.', salario: 3200, nivelMinimo: 1 },
            { cargo: 'Engenheiro de Automação', descricao: 'Desenvolvimento de sistemas automatizados.', salario: 8500, nivelMinimo: 5 },
            { cargo: 'Técnico Mecânico', descricao: 'Manutenção de equipamentos industriais.', salario: 3800, nivelMinimo: 2 }
        ]
    },
    {
        nome: 'Restaurante e Lanchonete Campineira',
        nomeFantasia: 'Lanchonete Campineira',
        descricao: 'Rede de lanchonetes com 3 unidades em Campinas.',
        ramo: 'alimenticio',
        cidade: 'Campinas',
        estado: 'São Paulo',
        nivel: 5,
        faturamentoBase: 2000,
        vagas: [
            { cargo: 'Atendente', descricao: 'Atendimento ao cliente.', salario: 1400, nivelMinimo: 1 },
            { cargo: 'Cozinheiro', descricao: 'Preparo de lanches e refeições.', salario: 1800, nivelMinimo: 1 }
        ]
    },

    // ==================== RIO DE JANEIRO ====================
    {
        nome: 'Petrobras - Sede Rio',
        nomeFantasia: 'Petrobras',
        descricao: 'Sede administrativa da Petrobras no Rio de Janeiro.',
        ramo: 'industria',
        cidade: 'Rio de Janeiro',
        estado: 'Rio de Janeiro',
        nivel: 50,
        faturamentoBase: 25000,
        vagas: [
            { cargo: 'Engenheiro de Petróleo', descricao: 'Exploração e produção.', salario: 12000, nivelMinimo: 8 },
            { cargo: 'Técnico de Segurança', descricao: 'Segurança do trabalho industrial.', salario: 4500, nivelMinimo: 3 },
            { cargo: 'Analista Administrativo', descricao: 'Gestão de contratos e licitações.', salario: 6000, nivelMinimo: 4 }
        ]
    },
    {
        nome: 'Rede Globo de Televisão',
        nomeFantasia: 'TV Globo',
        descricao: 'Emissora de televisão com sede no Jardim Botânico.',
        ramo: 'entretenimento',
        cidade: 'Rio de Janeiro',
        estado: 'Rio de Janeiro',
        nivel: 40,
        faturamentoBase: 20000,
        vagas: [
            { cargo: 'Produtor de Conteúdo', descricao: 'Produção de programas e séries.', salario: 5500, nivelMinimo: 4 },
            { cargo: 'Editor de Vídeo', descricao: 'Edição e pós-produção.', salario: 3800, nivelMinimo: 3 },
            { cargo: 'Assistente de Palco', descricao: 'Suporte a gravações ao vivo.', salario: 2200, nivelMinimo: 1 }
        ]
    },
    {
        nome: 'Hotel Copacabana Palace',
        nomeFantasia: 'Copacabana Palace',
        descricao: 'Hotel 5 estrelas histórico na orla de Copacabana.',
        ramo: 'servicos',
        cidade: 'Rio de Janeiro',
        estado: 'Rio de Janeiro',
        nivel: 20,
        faturamentoBase: 8000,
        vagas: [
            { cargo: 'Recepcionista Bilíngue', descricao: 'Check-in e atendimento a hóspedes.', salario: 2800, nivelMinimo: 2 },
            { cargo: 'Camareira', descricao: 'Limpeza e arrumação dos quartos.', salario: 1800, nivelMinimo: 1 },
            { cargo: 'Chef de Cozinha', descricao: 'Coordenação da cozinha do hotel.', salario: 6500, nivelMinimo: 5 }
        ]
    },
    {
        nome: 'Porto do Rio de Janeiro',
        nomeFantasia: 'Porto do Rio',
        descricao: 'Administração do porto e operações logísticas.',
        ramo: 'transporte',
        cidade: 'Rio de Janeiro',
        estado: 'Rio de Janeiro',
        nivel: 15,
        faturamentoBase: 7000,
        vagas: [
            { cargo: 'Operador Portuário', descricao: 'Operação de carga e descarga.', salario: 3500, nivelMinimo: 2 },
            { cargo: 'Analista de Importação', descricao: 'Processos de importação e exportação.', salario: 4500, nivelMinimo: 3 }
        ]
    },

    // ==================== SANTOS ====================
    {
        nome: 'Porto de Santos Autoridade Portuária',
        nomeFantasia: 'Porto de Santos',
        descricao: 'Maior porto da América Latina. Administração e operações.',
        ramo: 'transporte',
        cidade: 'Santos',
        estado: 'São Paulo',
        nivel: 30,
        faturamentoBase: 12000,
        vagas: [
            { cargo: 'Operador de Equipamentos', descricao: 'Operação de guindastes e empilhadeiras.', salario: 3800, nivelMinimo: 2 },
            { cargo: 'Analista Portuário', descricao: 'Gestão de documentação e cargas.', salario: 5000, nivelMinimo: 3 },
            { cargo: 'Vigia Portuário', descricao: 'Segurança patrimonial.', salario: 1800, nivelMinimo: 1 }
        ]
    }
];

async function seedEmpresas() {
    console.log('[SEED] Iniciando população de empresas...');
    let contador = 0;

    for (const data of empresasData) {
        const existente = await Empresa.findOne({ nome: data.nome });
        if (existente) {
            console.log(`[SEED] Empresa já existe: ${data.nome}`);
            continue;
        }

        const vagas = data.vagas.map(v => ({
            cargo: v.cargo,
            descricao: v.descricao,
            salario: v.salario,
            requisitos: { nivelMinimo: v.nivelMinimo },
            status: 'aberta',
            candidatos: []
        }));

        const empresa = new Empresa({
            nome: data.nome,
            nomeFantasia: data.nomeFantasia,
            descricao: data.descricao,
            ramo: data.ramo,
            dono: null,
            nivel: data.nivel,
            experiencia: (data.nivel - 1) * 1000,
            faturamentoMensal: data.faturamentoBase * (1 + (data.nivel - 1) * 0.1),
            reputacao: 70,
            unidades: [{
                nome: 'Sede',
                pais: 'Brasil',
                estado: data.estado,
                cidade: data.cidade,
                endereco: '',
                capacidadeMaxima: 20,
                nivel: Math.ceil(data.nivel / 5),
                faturamentoBase: data.faturamentoBase
            }],
            vagasAbertas: vagas
        });

        await empresa.save();
        contador++;
        console.log(`[SEED] Empresa criada: ${data.nome} (${data.cidade})`);
    }

    console.log(`[SEED] ${contador} empresas criadas. Total: ${empresasData.length}`);
    return contador;
}

module.exports = { seedEmpresas, empresasData };
