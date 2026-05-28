const Empresa = require('../models/Empresa');

/*
 * TABELA SALARIAL DO JOGO:
 * O salário SEMANAL no jogo equivale ao salário MENSAL real do Brasil.
 * Exemplo: Médico ganha R$12.000/mês na vida real → R$12.000/semana no jogo.
 *
 * Salário mínimo nacional 2026: R$1.621/mês ≈ R$1.621/semana no jogo
 *
 * Categoria     | Entry (Nv1-2)      | Júnior (Nv3-4)     | Pleno (Nv5-6)      | Sênior (Nv7+)
 * --------------|:------------------:|:------------------:|:------------------:|:------------------:
 * Entry         | R$1.500-2.500      | —                  | —                  | —
 *               | (estágio, office)  |                    |                    |
 * Físicas       | R$1.600-2.500      | R$2.500-3.500      | R$3.500-5.000      | R$5.000-8.000
 *               | (servente, vigia)  | (pedreiro, motor.) | (op. especializado)| (técnico sênior)
 * Mentais       | R$2.000-3.000      | R$3.000-5.000      | R$5.000-8.000      | R$8.000-15.000
 *               | (auxiliar)         | (assistente)       | (analista)         | (médico, prof.)
 * Profissionais | R$2.000-3.000      | R$3.500-6.000      | R$7.000-12.000     | R$12.000-25.000
 *               | (técnico jr)       | (dev jr, tec.)     | (dev pl, eng.)     | (eng. sênior)
 * Sociais       | R$1.500-2.500      | R$2.500-3.500      | R$3.500-6.000      | R$6.000-10.000
 *               | (vendedor)         | (recepcionista)    | (repórter)         | (rel. públicas)
 * Gerência      | —                  | R$5.000-8.000      | R$8.000-15.000     | R$15.000-50.000
 *                                    | (supervisor jr)    | (coordenador)      | (gerente, diretor)
 */

const empresasData = [
    // ==================== SÃO PAULO ====================
    {
        nome: 'TechSolutions Brasil', nomeFantasia: 'TechSolutions', descricao: 'Empresa de tecnologia especializada em desenvolvimento de software.', ramo: 'tecnologia', cidade: 'São Paulo', estado: 'São Paulo', nivel: 15, faturamentoBase: 5000,
        vagas: [
            { cargo: 'Estagiário de TI', descricao: 'Suporte interno e aprendizado em desenvolvimento.', salarioSemanal: 2000, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 5, logica: 5 } } },
            { cargo: 'Desenvolvedor Jr.', descricao: 'Desenvolvimento web com React e Node.js.', salarioSemanal: 5000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { programacao: 10, logica: 15 } } },
            { cargo: 'Desenvolvedor Pleno', descricao: 'Arquitetura de software e code review.', salarioSemanal: 10000, categoria: 'profissionais', requisitos: { nivelMinimo: 5, atributos: { programacao: 25, logica: 20, inteligencia: 15 } } },
            { cargo: 'Analista de Dados', descricao: 'Análise de dados com Python e SQL.', salarioSemanal: 8000, categoria: 'profissionais', requisitos: { nivelMinimo: 4, atributos: { programacao: 15, logica: 20, inteligencia: 25 } } }
        ]
    },
    {
        nome: 'Construtora NovaVista', nomeFantasia: 'NovaVista', descricao: 'Construtora com mais de 20 anos no mercado imobiliário.', ramo: 'construcao', cidade: 'São Paulo', estado: 'São Paulo', nivel: 20, faturamentoBase: 10000,
        vagas: [
            { cargo: 'Servente de Obra', descricao: 'Auxiliar em canteiro de obras.', salarioSemanal: 1800, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { forca: 8 } } },
            { cargo: 'Pedreiro', descricao: 'Assentamento de tijolos e reboco.', salarioSemanal: 3500, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, resistencia: 10 } } },
            { cargo: 'Engenheiro Civil', descricao: 'Coordenação de obras e projetos.', salarioSemanal: 12000, categoria: 'profissionais', requisitos: { nivelMinimo: 6, atributos: { inteligencia: 25, construcao: 20, logica: 20, gestao: 10 } } }
        ]
    },
    {
        nome: 'MercadoDigital Ltda', nomeFantasia: 'Mercado Digital', descricao: 'Plataforma de e-commerce com atuação nacional.', ramo: 'comercio', cidade: 'São Paulo', estado: 'São Paulo', nivel: 10, faturamentoBase: 4000,
        vagas: [
            { cargo: 'Atendente', descricao: 'Atendimento ao cliente online.', salarioSemanal: 1800, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 5 } } },
            { cargo: 'Vendedor Online', descricao: 'Vendas por chat e telefone.', salarioSemanal: 2800, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 15, persuasao: 10 } } },
            { cargo: 'Analista de Marketing', descricao: 'Gestão de tráfego e campanhas.', salarioSemanal: 6000, categoria: 'profissionais', requisitos: { nivelMinimo: 4, atributos: { marketing: 15, criatividade: 15, inteligencia: 10 } } }
        ]
    },
    {
        nome: 'Hospital São Paulo', nomeFantasia: 'Hospital SP', descricao: 'Rede hospitalar particular na zona sul.', ramo: 'saude', cidade: 'São Paulo', estado: 'São Paulo', nivel: 18, faturamentoBase: 8000,
        vagas: [
            { cargo: 'Recepcionista', descricao: 'Agendamento e atendimento ao público.', salarioSemanal: 2000, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 8, memoria: 5 } } },
            { cargo: 'Técnico de Enfermagem', descricao: 'Auxílio em procedimentos.', salarioSemanal: 3500, categoria: 'profissionais', requisitos: { nivelMinimo: 2, atributos: { primeirosSocorros: 15, foco: 15, resistencia: 10 } } },
            { cargo: 'Médico Residente', descricao: 'Plantão no pronto-socorro.', salarioSemanal: 12000, categoria: 'profissionais', requisitos: { nivelMinimo: 5, atributos: { inteligencia: 30, primeirosSocorros: 25, foco: 25, memoria: 20 } } }
        ]
    },
    {
        nome: 'Banco do Brasil - Agência Paulista', nomeFantasia: 'Banco do Brasil', descricao: 'Agência bancária com serviços financeiros.', ramo: 'financeiro', cidade: 'São Paulo', estado: 'São Paulo', nivel: 25, faturamentoBase: 12000,
        vagas: [
            { cargo: 'Escriturário', descricao: 'Serviços bancários internos.', salarioSemanal: 2500, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 8, memoria: 5 } } },
            { cargo: 'Caixa', descricao: 'Atendimento ao público.', salarioSemanal: 2300, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 12, foco: 10 } } },
            { cargo: 'Gerente de Contas', descricao: 'Gestão de carteira de clientes.', salarioSemanal: 15000, categoria: 'gerencia', requisitos: { nivelMinimo: 7, atributos: { gestao: 20, negociacao: 15, carisma: 20, inteligencia: 15 } } },
            { cargo: 'Analista Financeiro', descricao: 'Análise de crédito e investimentos.', salarioSemanal: 9000, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, inteligencia: 20, contabilidade: 10 } } }
        ]
    },
    {
        nome: 'Transportes Rápidos Ltda', nomeFantasia: 'Transportes Rápidos', descricao: 'Logística e transporte intermunicipal.', ramo: 'transporte', cidade: 'São Paulo', estado: 'São Paulo', nivel: 12, faturamentoBase: 4500,
        vagas: [
            { cargo: 'Auxiliar de Logística', descricao: 'Separação e carregamento.', salarioSemanal: 1800, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { forca: 8 } } },
            { cargo: 'Motorista de Caminhão', descricao: 'Entregas regionais.', salarioSemanal: 3500, categoria: 'fisicas', requisitos: { nivelMinimo: 3, atributos: { forca: 12, resistencia: 15, foco: 10 } } },
            { cargo: 'Coordenador de Frota', descricao: 'Gestão de motoristas e rotas.', salarioSemanal: 8000, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { gestao: 15, lideranca: 10, logica: 15 } } }
        ]
    },
    {
        nome: 'Restaurante e Lanchonete Metrópole', nomeFantasia: 'Metrópole', descricao: 'Rede de restaurantes populares.', ramo: 'alimenticio', cidade: 'São Paulo', estado: 'São Paulo', nivel: 8, faturamentoBase: 2500,
        vagas: [
            { cargo: 'Atendente de Lanchonete', descricao: 'Anotar pedidos e servir.', salarioSemanal: 1600, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 5, resistencia: 5 } } },
            { cargo: 'Cozinheiro', descricao: 'Preparo de refeições.', salarioSemanal: 2800, categoria: 'profissionais', requisitos: { nivelMinimo: 2, atributos: { culinaria: 10, foco: 10 } } },
            { cargo: 'Chef de Cozinha', descricao: 'Coordenação da cozinha e cardápio.', salarioSemanal: 7000, categoria: 'gerencia', requisitos: { nivelMinimo: 4, atributos: { culinaria: 20, gestao: 10, criatividade: 15 } } }
        ]
    },

    // ==================== RIO DE JANEIRO ====================
    {
        nome: 'Rede Globo de Televisão', nomeFantasia: 'TV Globo', descricao: 'Maior emissora de TV do Brasil.', ramo: 'entretenimento', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 40, faturamentoBase: 20000,
        vagas: [
            { cargo: 'Office Boy', descricao: 'Serviços internos de entregas.', salarioSemanal: 1700, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { velocidade: 8 } } },
            { cargo: 'Editor de Vídeo', descricao: 'Edição e pós-produção.', salarioSemanal: 4500, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { design: 15, criatividade: 15, foco: 10 } } },
            { cargo: 'Produtor de Conteúdo', descricao: 'Produção de programas e séries.', salarioSemanal: 9000, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { gestao: 15, criatividade: 20, lideranca: 10 } } },
            { cargo: 'Repórter', descricao: 'Apuração e apresentação de notícias.', salarioSemanal: 6000, categoria: 'sociais', requisitos: { nivelMinimo: 4, atributos: { carisma: 20, persuasao: 15, escrita: 15 } } }
        ]
    },
    {
        nome: 'Hotel Copacabana Palace', nomeFantasia: 'Copacabana Palace', descricao: 'Hotel 5 estrelas em Copacabana.', ramo: 'servicos', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 20, faturamentoBase: 8000,
        vagas: [
            { cargo: 'Camareira', descricao: 'Limpeza e arrumação dos quartos.', salarioSemanal: 1800, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { resistencia: 8 } } },
            { cargo: 'Recepcionista Bilíngue', descricao: 'Check-in e atendimento a hóspedes.', salarioSemanal: 3000, categoria: 'sociais', requisitos: { nivelMinimo: 2, atributos: { carisma: 18, memoria: 10 } } },
            { cargo: 'Chef de Cozinha', descricao: 'Comando da cozinha do hotel.', salarioSemanal: 10000, categoria: 'gerencia', requisitos: { nivelMinimo: 6, atributos: { culinaria: 30, gestao: 20, lideranca: 15 } } },
            { cargo: 'Segurança', descricao: 'Vigilância e segurança patrimonial.', salarioSemanal: 2500, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, resistencia: 15, agilidade: 10 } } }
        ]
    },
    {
        nome: 'Petrobras - Sede Rio', nomeFantasia: 'Petrobras', descricao: 'Sede administrativa da Petrobras.', ramo: 'industria', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', nivel: 50, faturamentoBase: 25000,
        vagas: [
            { cargo: 'Auxiliar Administrativo', descricao: 'Suporte administrativo.', salarioSemanal: 2500, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { inteligencia: 8, foco: 5 } } },
            { cargo: 'Técnico de Segurança do Trabalho', descricao: 'Inspeções e normas de segurança.', salarioSemanal: 5000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { foco: 18, memoria: 15, construcao: 10 } } },
            { cargo: 'Engenheiro de Petróleo', descricao: 'Exploração e produção.', salarioSemanal: 20000, categoria: 'profissionais', requisitos: { nivelMinimo: 8, atributos: { inteligencia: 35, logica: 30, programacao: 10 } } }
        ]
    },

    // ==================== CAMPINAS ====================
    {
        nome: 'Bosch do Brasil - Campinas', nomeFantasia: 'Bosch Campinas', descricao: 'Unidade industrial de automação.', ramo: 'industria', cidade: 'Campinas', estado: 'São Paulo', nivel: 35, faturamentoBase: 15000,
        vagas: [
            { cargo: 'Operador de Produção', descricao: 'Linha de montagem.', salarioSemanal: 3000, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 12, resistencia: 10, foco: 10 } } },
            { cargo: 'Técnico Mecânico', descricao: 'Manutenção de equipamentos.', salarioSemanal: 4500, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { mecanica: 15, logica: 15, inteligencia: 12 } } },
            { cargo: 'Engenheiro de Automação', descricao: 'Sistemas automatizados.', salarioSemanal: 13000, categoria: 'profissionais', requisitos: { nivelMinimo: 6, atributos: { programacao: 20, logica: 25, inteligencia: 20 } } }
        ]
    },
    {
        nome: 'UNICAMP - Departamento Administrativo', nomeFantasia: 'UNICAMP', descricao: 'Setor administrativo da universidade.', ramo: 'educacao', cidade: 'Campinas', estado: 'São Paulo', nivel: 30, faturamentoBase: 7000,
        vagas: [
            { cargo: 'Assistente Administrativo', descricao: 'Suporte aos departamentos.', salarioSemanal: 3000, categoria: 'mentais', requisitos: { nivelMinimo: 2, atributos: { inteligencia: 10, memoria: 12, foco: 10 } } },
            { cargo: 'Professor Substituto', descricao: 'Aulas de nível superior.', salarioSemanal: 6500, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { inteligencia: 25, carisma: 15, persuasao: 15 } } },
            { cargo: 'Técnico de Laboratório', descricao: 'Suporte a laboratórios.', salarioSemanal: 4000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { logica: 15, foco: 15 } } }
        ]
    },

    // ==================== SANTOS ====================
    {
        nome: 'Porto de Santos Autoridade Portuária', nomeFantasia: 'Porto de Santos', descricao: 'Maior porto da América Latina.', ramo: 'transporte', cidade: 'Santos', estado: 'São Paulo', nivel: 30, faturamentoBase: 12000,
        vagas: [
            { cargo: 'Vigia Portuário', descricao: 'Segurança patrimonial.', salarioSemanal: 2000, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { resistencia: 8, foco: 5 } } },
            { cargo: 'Operador de Empilhadeira', descricao: 'Movimentação de cargas.', salarioSemanal: 3200, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 15, foco: 12 } } },
            { cargo: 'Analista Portuário', descricao: 'Gestão de documentação.', salarioSemanal: 7000, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, inteligencia: 15, memoria: 15 } } }
        ]
    },
    {
        nome: 'Companhia Docas de Santos', nomeFantasia: 'Docas Santos', descricao: 'Administração do porto organizado.', ramo: 'servicos', cidade: 'Santos', estado: 'São Paulo', nivel: 22, faturamentoBase: 9000,
        vagas: [
            { cargo: 'Office Boy', descricao: 'Serviços internos.', salarioSemanal: 1700, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { velocidade: 6 } } },
            { cargo: 'Almoxarife', descricao: 'Controle de estoque e materiais.', salarioSemanal: 2600, categoria: 'mentais', requisitos: { nivelMinimo: 2, atributos: { memoria: 12, foco: 10 } } },
            { cargo: 'Supervisor de Turno', descricao: 'Coordenação de equipe portuária.', salarioSemanal: 8000, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { lideranca: 18, gestao: 15, resistencia: 12 } } }
        ]
    },

    // ==================== BELO HORIZONTE ====================
    {
        nome: 'Vale do Rio Doce - BH', nomeFantasia: 'Vale', descricao: 'Uma das maiores mineradoras do mundo.', ramo: 'industria', cidade: 'Belo Horizonte', estado: 'Minas Gerais', nivel: 45, faturamentoBase: 20000,
        vagas: [
            { cargo: 'Auxiliar de Almoxarifado', descricao: 'Controle de estoque e materiais.', salarioSemanal: 2000, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { forca: 6, memoria: 5 } } },
            { cargo: 'Técnico de Mineração', descricao: 'Operação e manutenção de equipamentos de mina.', salarioSemanal: 5500, categoria: 'fisicas', requisitos: { nivelMinimo: 3, atributos: { forca: 20, resistencia: 18, construcao: 15, foco: 15 } } },
            { cargo: 'Analista de Geologia', descricao: 'Análise de solo e prospecção mineral.', salarioSemanal: 10000, categoria: 'mentais', requisitos: { nivelMinimo: 5, atributos: { inteligencia: 25, logica: 20, memoria: 15 } } },
            { cargo: 'Engenheiro de Minas', descricao: 'Coordenação de operações de lavra.', salarioSemanal: 18000, categoria: 'profissionais', requisitos: { nivelMinimo: 7, atributos: { inteligencia: 30, construcao: 20, gestao: 15, logica: 25 } } }
        ]
    },
    {
        nome: 'Hospital Mater Dei', nomeFantasia: 'Mater Dei', descricao: 'Rede de hospitais particular de Belo Horizonte.', ramo: 'saude', cidade: 'Belo Horizonte', estado: 'Minas Gerais', nivel: 25, faturamentoBase: 10000,
        vagas: [
            { cargo: 'Maqueiro', descricao: 'Transporte de pacientes.', salarioSemanal: 1900, categoria: 'fisicas', requisitos: { nivelMinimo: 1, atributos: { forca: 12, resistencia: 10 } } },
            { cargo: 'Enfermeiro Plantonista', descricao: 'Assistência em enfermaria.', salarioSemanal: 5000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { primeirosSocorros: 20, foco: 20, resistencia: 15, empatia: 15 } } },
            { cargo: 'Recepcionista Hospitalar', descricao: 'Atendimento ao público e agendamento.', salarioSemanal: 2000, categoria: 'sociais', requisitos: { nivelMinimo: 1, atributos: { carisma: 12, memoria: 8 } } }
        ]
    },

    // ==================== SALVADOR ====================
    {
        nome: 'Rede Bahia de Comunicação', nomeFantasia: 'Rede Bahia', descricao: 'Maior grupo de comunicação do Nordeste.', ramo: 'entretenimento', cidade: 'Salvador', estado: 'Bahia', nivel: 20, faturamentoBase: 7000,
        vagas: [
            { cargo: 'Office Boy', descricao: 'Serviços internos.', salarioSemanal: 1600, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { velocidade: 6 } } },
            { cargo: 'Repórter de TV', descricao: 'Apuração e reportagem ao vivo.', salarioSemanal: 6000, categoria: 'sociais', requisitos: { nivelMinimo: 4, atributos: { carisma: 22, persuasao: 15, escrita: 18 } } },
            { cargo: 'Editor de Conteúdo Digital', descricao: 'Produção para redes sociais e site.', salarioSemanal: 4000, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { design: 15, criatividade: 18 } } },
            { cargo: 'Coordenador de Jornalismo', descricao: 'Gestão da equipe de reportagem.', salarioSemanal: 10000, categoria: 'gerencia', requisitos: { nivelMinimo: 6, atributos: { gestao: 20, lideranca: 18, carisma: 15 } } }
        ]
    },
    {
        nome: 'Shoptime Salvador', nomeFantasia: 'Shoptime BA', descricao: 'Rede de lojas de departamento no Shopping Barra.', ramo: 'comercio', cidade: 'Salvador', estado: 'Bahia', nivel: 12, faturamentoBase: 3500,
        vagas: [
            { cargo: 'Vendedor de Loja', descricao: 'Atendimento ao cliente em loja física.', salarioSemanal: 1800, categoria: 'sociais', requisitos: { nivelMinimo: 1, atributos: { carisma: 10, persuasao: 8 } } },
            { cargo: 'Repositor de Estoque', descricao: 'Organização de mercadorias.', salarioSemanal: 1800, categoria: 'fisicas', requisitos: { nivelMinimo: 1, atributos: { forca: 10, resistencia: 8 } } },
            { cargo: 'Caixa de Loja', descricao: 'Operação de caixa e atendimento.', salarioSemanal: 1700, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { memoria: 5, foco: 5 } } },
            { cargo: 'Gerente de Loja', descricao: 'Gestão da unidade e equipe.', salarioSemanal: 8000, categoria: 'gerencia', requisitos: { nivelMinimo: 5, atributos: { gestao: 18, lideranca: 15, negociacao: 12 } } }
        ]
    },

    // ==================== CURITIBA ====================
    {
        nome: 'Volvo do Brasil - Curitiba', nomeFantasia: 'Volvo Curitiba', descricao: 'Fábrica de caminhões e ônibus da Volvo na CIC.', ramo: 'industria', cidade: 'Curitiba', estado: 'Paraná', nivel: 35, faturamentoBase: 18000,
        vagas: [
            { cargo: 'Montador de Linha de Produção', descricao: 'Montagem de componentes automotivos.', salarioSemanal: 3200, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 14, resistencia: 12, foco: 10 } } },
            { cargo: 'Técnico em Soldagem', descricao: 'Soldagem de chassis e estruturas.', salarioSemanal: 4500, categoria: 'profissionais', requisitos: { nivelMinimo: 3, atributos: { construcao: 15, foco: 15, resistencia: 12 } } },
            { cargo: 'Analista de Qualidade', descricao: 'Inspeção e controle de qualidade.', salarioSemanal: 7000, categoria: 'mentais', requisitos: { nivelMinimo: 4, atributos: { logica: 20, foco: 18, memoria: 12 } } },
            { cargo: 'Supervisor de Produção', descricao: 'Coordenação de turno fabril.', salarioSemanal: 12000, categoria: 'gerencia', requisitos: { nivelMinimo: 6, atributos: { gestao: 20, lideranca: 18, resistencia: 15 } } }
        ]
    },
    {
        nome: 'Mercado Municipal de Curitiba', nomeFantasia: 'Mercado Municipal', descricao: 'Tradicional mercado de Curitiba com diversos setores.', ramo: 'alimenticio', cidade: 'Curitiba', estado: 'Paraná', nivel: 15, faturamentoBase: 4500,
        vagas: [
            { cargo: 'Atendente de Mercado', descricao: 'Atendimento aos clientes e reposição.', salarioSemanal: 1700, categoria: 'entry', requisitos: { nivelMinimo: 1, atributos: { carisma: 6, resistencia: 5 } } },
            { cargo: 'Açougueiro', descricao: 'Corte e preparo de carnes.', salarioSemanal: 2800, categoria: 'fisicas', requisitos: { nivelMinimo: 2, atributos: { forca: 14, resistencia: 10 } } },
            { cargo: 'Promotor de Vendas', descricao: 'Divulgação de produtos e degustação.', salarioSemanal: 2000, categoria: 'sociais', requisitos: { nivelMinimo: 1, atributos: { carisma: 14, persuasao: 10 } } },
            { cargo: 'Confeiteiro', descricao: 'Preparo de doces e sobremesas.', salarioSemanal: 3500, categoria: 'profissionais', requisitos: { nivelMinimo: 2, atributos: { culinaria: 15, criatividade: 12 } } }
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
            // Substitui vagas existentes pelas novas (para adicionar novas categorias e expandir)
            const vagasAntigas = existente.vagasAbertas;
            const candidatosPreservados = {};
            for (const vaga of vagasAntigas) {
                if (vaga.candidatos?.length > 0) {
                    candidatosPreservados[vaga.cargo] = vaga.candidatos;
                }
            }
            existente.vagasAbertas = vagas.map(v => ({
                ...v,
                candidatos: candidatosPreservados[v.cargo] || []
            }));
            await existente.save();
            console.log(`[SEED] Empresa atualizada: ${data.nome} (${existente.vagasAbertas.length} vagas)`);
            contador++;
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
