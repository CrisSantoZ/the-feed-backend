const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const HabilidadeProgressoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    nivel: { type: Number, default: 0, min: 0, max: 100 },
    xp: { type: Number, default: 0 },
    xpNecessario: { type: Number, default: 100 },
    ultimoUso: Date,
    vezesUsada: { type: Number, default: 0 }
});

const CertificacaoSchema = new mongoose.Schema({
    nome: String,
    instituicao: String,
    data: { type: Date, default: Date.now },
    validade: Date,
    nivel: String
});

const HistoriaProgressoSchema = new mongoose.Schema({
    habilidade: String,
    data: Date,
    ganhoXP: Number,
    motivo: String
});

// ==================== SCHEMA PRINCIPAL ====================

const HabilidadesSchema = new mongoose.Schema({
    // ==================== HABILIDADES FÍSICAS ====================
    fisicas: {
        // Força e resistência
        forca: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 },
            ultimoUso: Date
        },
        resistencia: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 },
            ultimoUso: Date
        },
        agilidade: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 },
            ultimoUso: Date
        },
        velocidade: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        equilibrio: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        }
    },

    // ==================== HABILIDADES MENTAIS ====================
    mentais: {
        inteligencia: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        memoria: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        logica: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        criatividade: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        foco: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        }
    },

    // ==================== HABILIDADES SOCIAIS ====================
    sociais: {
        carisma: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        persuasao: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        negociacao: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        lideranca: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        empatia: {
            nivel: { type: Number, default: 10, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        }
    },

    // ==================== HABILIDADES PROFISSIONAIS ====================
    profissionais: {
        // Tecnologia
        programacao: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        design: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        marketing: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        
        // Negócios
        vendas: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        gestao: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        contabilidade: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        
        // Artes
        musica: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        pintura: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        escrita: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        
        // Trabalhos manuais
        culinaria: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        mecanica: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        construcao: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        
        // Saúde
        primeirosSocorros: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        }
    },

    // ==================== HABILIDADES DE SOBREVIVÊNCIA ====================
    sobrevivencia: {
        orientacao: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        pesca: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        caca: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        },
        acampamento: {
            nivel: { type: Number, default: 0, min: 0, max: 100 },
            xp: { type: Number, default: 0 },
            xpNecessario: { type: Number, default: 100 }
        }
    },

    // ==================== CERTIFICAÇÕES ====================
    certificacoes: [CertificacaoSchema],

    // ==================== HISTÓRICO ====================
    historicoProgresso: [HistoriaProgressoSchema],

    // ==================== ESTATÍSTICAS ====================
    estatisticas: {
        totalXP: { type: Number, default: 0 },
        nivelMedio: { type: Number, default: 0 },
        habilidadesMaximizadas: { type: Number, default: 0 },
        horasTreinando: { type: Number, default: 0 }
    },

    // Pontos de habilidade disponíveis para distribuir
    pontosHabilidade: { type: Number, default: 0 }
});

// ==================== MÉTODOS ====================

// Adiciona XP a uma habilidade específica
HabilidadesSchema.methods.adicionarXP = async function(categoria, nome, xpGanho, motivo = '') {
    const categoriaObj = this[categoria];
    if (!categoriaObj || !categoriaObj[nome]) {
        return { sucesso: false, motivo: `Habilidade ${nome} não encontrada` };
    }

    const habilidade = categoriaObj[nome];
    const nivelAntes = habilidade.nivel;
    
    // Adiciona XP
    habilidade.xp += xpGanho;
    habilidade.ultimoUso = new Date();
    habilidade.vezesUsada = (habilidade.vezesUsada || 0) + 1;
    
    let subiuNivel = false;
    let niveisSubidos = 0;
    
    // Sobe de nível enquanto tiver XP suficiente
    while (habilidade.xp >= habilidade.xpNecessario && habilidade.nivel < 100) {
        habilidade.xp -= habilidade.xpNecessario;
        habilidade.nivel += 1;
        subiuNivel = true;
        niveisSubidos++;
        
        // Aumenta dificuldade para próximo nível
        habilidade.xpNecessario = Math.min(500, Math.floor(habilidade.xpNecessario * 1.1));
    }
    
    // Atualiza estatísticas
    this.estatisticas.totalXP += xpGanho;
    this.estatisticas.horasTreinando += 0.5;
    
    // Registra histórico
    this.historicoProgresso.push({
        habilidade: nome,
        data: new Date(),
        ganhoXP: xpGanho,
        motivo: motivo
    });
    
    // Se subiu de nível, dar ponto de habilidade
    if (subiuNivel) {
        this.pontosHabilidade += niveisSubidos;
    }
    
    // Recalcula nível médio
    this.recalcularNivelMedio();
    
    // Verifica habilidade maximizada (100)
    if (habilidade.nivel === 100 && nivelAntes < 100) {
        this.estatisticas.habilidadesMaximizadas += 1;
    }
    
    return {
        sucesso: true,
        habilidade: nome,
        nivelAntes: nivelAntes,
        nivelAtual: habilidade.nivel,
        subiuNivel: subiuNivel,
        niveisSubidos: niveisSubidos
    };
};

// Recalcular nível médio de todas as habilidades
HabilidadesSchema.methods.recalcularNivelMedio = function() {
    let totalNivel = 0;
    let totalHabilidades = 0;
    
    const categorias = ['fisicas', 'mentais', 'sociais', 'profissionais', 'sobrevivencia'];
    
    for (const categoria of categorias) {
        const cat = this[categoria];
        for (const key in cat) {
            if (cat[key] && typeof cat[key] === 'object' && cat[key].nivel !== undefined) {
                totalNivel += cat[key].nivel;
                totalHabilidades++;
            }
        }
    }
    
    this.estatisticas.nivelMedio = totalHabilidades > 0 ? Math.floor(totalNivel / totalHabilidades) : 0;
    return this.estatisticas.nivelMedio;
};

// Distribuir pontos de habilidade
HabilidadesSchema.methods.distribuirPontos = function(categoria, nome, pontos) {
    const categoriaObj = this[categoria];
    if (!categoriaObj || !categoriaObj[nome]) {
        return { sucesso: false, motivo: `Habilidade ${nome} não encontrada` };
    }
    
    if (this.pontosHabilidade < pontos) {
        return { sucesso: false, motivo: `Pontos insuficientes. Você tem ${this.pontosHabilidade}` };
    }
    
    const habilidade = categoriaObj[nome];
    const novoNivel = Math.min(100, habilidade.nivel + pontos);
    const pontosUsados = novoNivel - habilidade.nivel;
    
    habilidade.nivel = novoNivel;
    this.pontosHabilidade -= pontosUsados;
    
    return {
        sucesso: true,
        habilidade: nome,
        novoNivel: habilidade.nivel,
        pontosUsados: pontosUsados,
        pontosRestantes: this.pontosHabilidade
    };
};

// Obter nível de uma habilidade
HabilidadesSchema.methods.getNivel = function(categoria, nome) {
    const categoriaObj = this[categoria];
    if (categoriaObj && categoriaObj[nome]) {
        return categoriaObj[nome].nivel;
    }
    return 0;
};

// Obter todas as habilidades com seus níveis
HabilidadesSchema.methods.listarTodas = function() {
    const resultado = {
        fisicas: {},
        mentais: {},
        sociais: {},
        profissionais: {},
        sobrevivencia: {}
    };
    
    const categorias = ['fisicas', 'mentais', 'sociais', 'profissionais', 'sobrevivencia'];
    
    for (const categoria of categorias) {
        const cat = this[categoria];
        for (const key in cat) {
            if (cat[key] && typeof cat[key] === 'object' && cat[key].nivel !== undefined) {
                resultado[categoria][key] = {
                    nivel: cat[key].nivel,
                    xp: cat[key].xp,
                    xpNecessario: cat[key].xpNecessario,
                    progresso: Math.floor((cat[key].xp / cat[key].xpNecessario) * 100)
                };
            }
        }
    }
    
    return resultado;
};

// Obter descrição do nível de uma habilidade
HabilidadesSchema.methods.getDescricaoNivel = function(categoria, nome) {
    const nivel = this.getNivel(categoria, nome);
    
    if (nivel === 0) return 'Iniciante - Sem conhecimento';
    if (nivel < 20) return 'Básico - Conhecimento fundamental';
    if (nivel < 40) return 'Intermediário - Prática regular';
    if (nivel < 60) return 'Avançado - Boa experiência';
    if (nivel < 80) return 'Especialista - Alto domínio';
    if (nivel < 95) return 'Mestre - Conhecimento profundo';
    return 'Lendário - Domínio absoluto';
};

// Verificar se atende requisito de habilidade
HabilidadesSchema.methods.atendeRequisito = function(categoria, nome, nivelNecessario) {
    return this.getNivel(categoria, nome) >= nivelNecessario;
};

// Adicionar certificação
HabilidadesSchema.methods.adicionarCertificacao = function(nome, instituicao, nivel, validadeAnos = 2) {
    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + validadeAnos);
    
    this.certificacoes.push({
        nome: nome,
        instituicao: instituicao,
        nivel: nivel,
        data: new Date(),
        validade: validade
    });
    
    return { sucesso: true, certificacao: nome };
};

// Verificar certificações válidas
HabilidadesSchema.methods.getCertificacoesValidas = function() {
    const agora = new Date();
    return this.certificacoes.filter(c => c.validade > agora);
};

// Aplicar bônus baseado em habilidades (para ações)
HabilidadesSchema.methods.getBonus = function(categoria, nome, acao) {
    const nivel = this.getNivel(categoria, nome);
    
    // Bônus base: nível/100 = multiplicador
    let bonus = nivel / 100;
    
    // Bônus adicional baseado em habilidades complementares
    if (categoria === 'profissionais') {
        if (nome === 'programacao' && this.getNivel('mentais', 'logica') > 50) {
            bonus += 0.1;
        }
        if (nome === 'vendas' && this.getNivel('sociais', 'persuasao') > 50) {
            bonus += 0.1;
        }
        if (nome === 'design' && this.getNivel('mentais', 'criatividade') > 50) {
            bonus += 0.1;
        }
    }
    
    if (categoria === 'fisicas') {
        if (nome === 'forca' && this.getNivel('fisicas', 'resistencia') > 50) {
            bonus += 0.1;
        }
    }
    
    if (categoria === 'sociais') {
        if (nome === 'persuasao' && this.getNivel('mentais', 'inteligencia') > 50) {
            bonus += 0.1;
        }
    }
    
    return Math.min(2, bonus); // Máximo de 100% de bônus (2x)
};

// Aplicar uso de habilidade (XP baseado na dificuldade)
HabilidadesSchema.methods.usarHabilidade = async function(categoria, nome, dificuldade = 1, motivo = '') {
    // Dificuldade: 1 (fácil), 2 (médio), 3 (difícil), 4 (muito difícil)
    const xpBase = [0, 5, 10, 20, 35];
    const xpGanho = xpBase[dificuldade] || 5;
    
    // Bônus por usar habilidade em alta dificuldade
    const nivelAtual = this.getNivel(categoria, nome);
    let multiplicador = 1;
    
    if (dificuldade > 2 && nivelAtual < 30) {
        multiplicador = 1.5; // Aprende mais quando é desafiador
    }
    
    const xpFinal = Math.floor(xpGanho * multiplicador);
    
    return await this.adicionarXP(categoria, nome, xpFinal, motivo);
};

// Treinar habilidade (ação direta)
HabilidadesSchema.methods.treinar = async function(categoria, nome, intensidade = 1, tempoMinutos = 60) {
    // Intensidade: 1 (leve), 2 (médio), 3 (pesado)
    const xpPorMinuto = [0, 0.5, 1, 2];
    const xpGanho = Math.floor(xpPorMinuto[intensidade] * tempoMinutos);
    
    // Efeito colateral: cansaço
    let efeitos = {};
    if (categoria === 'fisicas' && intensidade >= 2) {
        efeitos.cansaco = intensidade * 5;
    }
    
    const resultado = await this.adicionarXP(categoria, nome, xpGanho, `Treino de ${tempoMinutos} minutos`);
    
    return {
        ...resultado,
        xpGanho: xpGanho,
        tempo: tempoMinutos,
        efeitos: efeitos
    };
};

// Treino automático (loop diário)
HabilidadesSchema.methods.treinoDiario = async function() {
    const resultados = [];
    
    // Simula uso diário de habilidades básicas
    const rotina = [
        { cat: 'fisicas', hab: 'forca', xp: 3, motivo: 'Atividades diárias' },
        { cat: 'mentais', hab: 'memoria', xp: 2, motivo: 'Rotina diária' },
        { cat: 'sociais', hab: 'carisma', xp: 2, motivo: 'Interações básicas' }
    ];
    
    for (const item of rotina) {
        const result = await this.adicionarXP(item.cat, item.hab, item.xp, item.motivo);
        resultados.push(result);
    }
    
    return resultados;
};

module.exports = HabilidadesSchema;