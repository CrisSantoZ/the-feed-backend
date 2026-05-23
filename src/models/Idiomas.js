const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const CursoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    instituicao: String,
    cargaHoraria: Number,
    horasConcluidas: { type: Number, default: 0 },
    iniciadoEm: { type: Date, default: Date.now },
    concluido: { type: Boolean, default: false },
    certificado: { type: Boolean, default: false },
    custo: Number,
    nivelAlcancado: { type: Number, default: 0 } // 0-100
});

const InteracaoIdiomaSchema = new mongoose.Schema({
    idioma: String,
    tipo: { type: String, enum: ['conversa', 'leitura', 'escuta', 'escrita'] },
    duracaoMinutos: Number,
    data: { type: Date, default: Date.now }
});

// ==================== SCHEMA PRINCIPAL ====================

const IdiomasSchema = new mongoose.Schema({
    // Idioma nativo (nasceu com ele, 100% fluente)
    idiomaNativo: { 
        type: String, 
        required: true, 
        default: 'portugues',
        lowercase: true
    },
    
    // Lista de idiomas que o personagem conhece/aprende
    idiomas: [{
        nome: { 
            type: String, 
            required: true,
            lowercase: true,
            enum: [
                'portugues', 'ingles', 'espanhol', 'frances', 'italiano', 
                'alemao', 'japones', 'coreano', 'mandarim', 'russo', 
                'arabe', 'holandes', 'sueco', 'grego', 'turco', 'hebraico'
            ]
        },
        nivel: { type: Number, default: 0, min: 0, max: 100 }, // 0-100% fluência
        pontosXP: { type: Number, default: 0 }, // XP acumulado para próximo nível
        horasEstudo: { type: Number, default: 0 }, // total de horas estudadas
        
        // Níveis de compreensão
        compreensaoOral: { type: Number, default: 0, min: 0, max: 100 },
        compreensaoEscrita: { type: Number, default: 0, min: 0, max: 100 },
        expressaoOral: { type: Number, default: 0, min: 0, max: 100 },
        expressaoEscrita: { type: Number, default: 0, min: 0, max: 100 },
        
        // Progresso
        certificacoes: [{
            nome: String, // TOEFL, DELF, JLPT, etc
            nivel: String,
            data: Date,
            pontuacao: Number
        }],
        
        // Cursos realizados
        cursos: [CursoSchema],
        
        // Histórico de interações neste idioma
        interacoes: [InteracaoIdiomaSchema],
        
        // Data da última prática
        ultimaPratica: Date
    }],
    
    // Estatísticas gerais
    estatisticas: {
        totalHorasEstudo: { type: Number, default: 0 },
        idiomasEstudados: { type: Number, default: 0 },
        idiomasFluentes: { type: Number, default: 0 }, // nivel >= 80
        certificadosObtidos: { type: Number, default: 0 }
    },
    
    // Método de aprendizado preferido
    estiloAprendizado: { 
        type: String, 
        enum: ['visual', 'auditivo', 'leitura', 'pratica', 'imersao'],
        default: 'leitura'
    }
});

// ==================== MÉTODOS ====================

// Verifica nível de um idioma
IdiomasSchema.methods.getNivel = function(idioma) {
    const lang = this.idiomas.find(i => i.nome === idioma);
    return lang ? lang.nivel : 0;
};

// Obtém o idioma completo
IdiomasSchema.methods.getIdioma = function(idioma) {
    return this.idiomas.find(i => i.nome === idioma);
};

// Adiciona XP a um idioma
IdiomasSchema.methods.adicionarXP = async function(idioma, xp, tipo = 'estudo') {
    let lang = this.idiomas.find(i => i.nome === idioma);
    
    // Se não existe, criar novo idioma
    if (!lang) {
        this.idiomas.push({
            nome: idioma,
            nivel: 0,
            pontosXP: Math.min(99, xp),
            horasEstudo: 0
        });
        lang = this.idiomas[this.idiomas.length - 1];
        this.estatisticas.idiomasEstudados += 1;
    }
    
    // Adiciona XP
    lang.pontosXP += xp;
    lang.horasEstudo += tipo === 'estudo' ? 1 : 0.5;
    
    // Adiciona ao tipo específico de compreensão
    switch(tipo) {
        case 'leitura':
            lang.compreensaoEscrita = Math.min(100, lang.compreensaoEscrita + (xp / 10));
            break;
        case 'escuta':
            lang.compreensaoOral = Math.min(100, lang.compreensaoOral + (xp / 10));
            break;
        case 'conversa':
            lang.expressaoOral = Math.min(100, lang.expressaoOral + (xp / 10));
            break;
        case 'escrita':
            lang.expressaoEscrita = Math.min(100, lang.expressaoEscrita + (xp / 10));
            break;
        default:
            // Distribui igualmente
            const ganho = xp / 40;
            lang.compreensaoOral = Math.min(100, lang.compreensaoOral + ganho);
            lang.compreensaoEscrita = Math.min(100, lang.compreensaoEscrita + ganho);
            lang.expressaoOral = Math.min(100, lang.expressaoOral + ganho);
            lang.expressaoEscrita = Math.min(100, lang.expressaoEscrita + ganho);
    }
    
    // Sobe de nível a cada 100 XP
    let subiuNivel = false;
    while (lang.pontosXP >= 100 && lang.nivel < 100) {
        lang.pontosXP -= 100;
        lang.nivel += 1;
        subiuNivel = true;
        
        // Atingiu fluência (80%+)
        if (lang.nivel >= 80 && !this.estatisticas.idiomasFluentes.toString().includes(idioma)) {
            this.estatisticas.idiomasFluentes += 1;
        }
    }
    
    lang.ultimaPratica = new Date();
    this.estatisticas.totalHorasEstudo += 1;
    
    return { 
        sucesso: true, 
        novoNivel: lang.nivel, 
        subiuNivel: subiuNivel 
    };
};

// Estudar um idioma (método principal)
IdiomasSchema.methods.estudar = async function(idioma, metodo, duracaoMinutos) {
    // Base XP por minuto de estudo
    let xpPorMinuto = 1;
    
    // Bônus por método de estudo
    const bonus = {
        'livro': 1.0,
        'aula': 1.5,
        'curso_online': 1.3,
        'aula_particular': 2.0,
        'imersao': 2.5,
        'app': 0.8,
        'conversacao': 1.8
    };
    
    xpPorMinuto *= (bonus[metodo] || 1);
    
    // Bônus por estilo de aprendizado preferido
    if (metodo === 'livro' && this.estiloAprendizado === 'leitura') xpPorMinuto *= 1.3;
    if (metodo === 'aula' && this.estiloAprendizado === 'auditivo') xpPorMinuto *= 1.3;
    if (metodo === 'conversacao' && this.estiloAprendizado === 'pratica') xpPorMinuto *= 1.3;
    if (metodo === 'imersao' && this.estiloAprendizado === 'imersao') xpPorMinuto *= 1.5;
    
    const xpGanho = Math.floor(xpPorMinuto * duracaoMinutos);
    
    // Registra interação
    const lang = this.getIdioma(idioma);
    if (lang) {
        lang.interacoes.push({
            idioma: idioma,
            tipo: metodo === 'conversacao' ? 'conversa' : 
                  metodo === 'livro' ? 'leitura' : 'estudo',
            duracaoMinutos: duracaoMinutos,
            data: new Date()
        });
    }
    
    const resultado = await this.adicionarXP(idioma, xpGanho, 'estudo');
    
    return {
        ...resultado,
        xpGanho: xpGanho,
        metodo: metodo,
        duracao: duracaoMinutos
    };
};

// Viajar/Conversar - verifica se entende o suficiente
IdiomasSchema.methods.podeComunicar = function(idioma, nivelNecessario = 30) {
    const nivel = this.getNivel(idioma);
    
    if (nivel >= nivelNecessario) {
        return { pode: true, nivel: nivel, qualidade: 'bom' };
    } else if (nivel >= 15) {
        return { pode: true, nivel: nivel, qualidade: 'limitado' };
    }
    
    return { pode: false, nivel: nivel, motivo: 'Não entende o idioma' };
};

// Traduzir mensagem baseado no nível de compreensão
IdiomasSchema.methods.traduzirMensagem = function(idiomaOrigem, mensagem) {
    const nivel = this.getNivel(idiomaOrigem);
    
    if (nivel >= 80) {
        return mensagem; // Compreende tudo
    }
    
    if (nivel >= 50) {
        // Entende 70% das palavras
        const palavras = mensagem.split(' ');
        const palavrasEntendidas = palavras.filter(() => Math.random() < 0.7);
        return palavrasEntendidas.join(' ') + ' (tradução parcial)';
    }
    
    if (nivel >= 20) {
        // Entende palavras soltas
        return '[???] Você entendeu poucas palavras: ' + 
               mensagem.split(' ').filter(() => Math.random() < 0.3).join(' ');
    }
    
    return '[Idioma Incompreensível] Você não entende nada do que está sendo dito.';
};

// Iniciar curso de idioma
IdiomasSchema.methods.iniciarCurso = function(idioma, nomeCurso, custo, cargaHoraria) {
    let lang = this.getIdioma(idioma);
    
    if (!lang) {
        this.idiomas.push({
            nome: idioma,
            nivel: 0,
            pontosXP: 0,
            cursos: []
        });
        lang = this.getIdioma(idioma);
    }
    
    lang.cursos.push({
        nome: nomeCurso,
        custo: custo,
        cargaHoraria: cargaHoraria,
        iniciadoEm: new Date(),
        nivelAlcancado: lang.nivel
    });
    
    return { sucesso: true, curso: nomeCurso, idioma: idioma };
};

// Completar horas de curso
IdiomasSchema.methods.progredirCurso = function(idioma, horasEstudadas) {
    const lang = this.getIdioma(idioma);
    if (!lang) return { sucesso: false, motivo: 'Idioma não encontrado' };
    
    const cursoAtivo = lang.cursos.find(c => !c.concluido);
    if (!cursoAtivo) return { sucesso: false, motivo: 'Nenhum curso ativo' };
    
    cursoAtivo.horasConcluidas += horasEstudadas;
    
    if (cursoAtivo.horasConcluidas >= cursoAtivo.cargaHoraria) {
        cursoAtivo.concluido = true;
        cursoAtivo.certificado = true;
        cursoAtivo.nivelAlcancado = lang.nivel;
        
        // Bônus de XP por completar curso
        this.adicionarXP(idioma, 50, 'estudo');
        
        return { sucesso: true, concluido: true, nivel: lang.nivel };
    }
    
    return { sucesso: true, concluido: false, progresso: cursoAtivo.horasConcluidas / cursoAtivo.cargaHoraria };
};

// Obter descrição do nível de fluência
IdiomasSchema.methods.getDescricaoNivel = function(idioma) {
    const nivel = this.getNivel(idioma);
    
    if (nivel === 0) return 'Nenhum conhecimento';
    if (nivel < 20) return 'Iniciante - algumas palavras';
    if (nivel < 40) return 'Básico - frases simples';
    if (nivel < 60) return 'Intermediário - conversas simples';
    if (nivel < 80) return 'Avançado - conversa fluente';
    return 'Fluente - nativo';
};

// Lista todos os idiomas com seus níveis
IdiomasSchema.methods.listarIdiomas = function() {
    const lista = this.idiomas.map(i => ({
        nome: i.nome,
        nivel: i.nivel,
        descricao: this.getDescricaoNivel(i.nome)
    }));
    
    // Adiciona idioma nativo se não estiver na lista
    if (!lista.find(i => i.nome === this.idiomaNativo)) {
        lista.unshift({
            nome: this.idiomaNativo,
            nivel: 100,
            descricao: 'Nativo (fluente)'
        });
    }
    
    return lista.sort((a, b) => b.nivel - a.nivel);
};

// Verificar se pode viajar para um país
IdiomasSchema.methods.podeViajarParaPais = function(idiomaOficial, nivelMinimo = 30) {
    return this.podeComunicar(idiomaOficial, nivelMinimo);
};

module.exports = IdiomasSchema;