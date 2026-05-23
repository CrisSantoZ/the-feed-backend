const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const ItemSchema = new mongoose.Schema({
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId() },
    nome: { type: String, required: true },
    tipo: { 
        type: String, 
        enum: [
            'comida', 'bebida', 'remédio', 'livro', 'curso', 'roupa', 
            'acessório', 'arma', 'ferramenta', 'material', 'eletrônico', 
            'móvel', 'veículo', 'imóvel', 'presente', 'documento', 'outro'
        ],
        required: true 
    },
    subtipo: String,
    descricao: String,
    quantidade: { type: Number, default: 1, min: 1 },
    peso: { type: Number, default: 0.1 }, // kg por unidade
    valorCompra: Number,
    valorVenda: Number,
    raridade: { type: String, enum: ['comum', 'incomum', 'raro', 'épico', 'lendário'], default: 'comum' },
    
    // Atributos do item (efeitos)
    atributos: {
        energia: { type: Number, default: 0 },
        saude: { type: Number, default: 0 },
        fome: { type: Number, default: 0 },
        sede: { type: Number, default: 0 },
        felicidade: { type: Number, default: 0 },
        xpHabilidade: { type: Map, of: Number }, // { "forca": 10, "inteligencia": 5 }
        
        // Para livros/cursos
        idioma: { type: String, lowercase: true },
        xpIdioma: { type: Number, default: 0 },
        
        // Durabilidade (para itens que se desgastam)
        durabilidade: { type: Number, default: 100, min: 0, max: 100 },
        durabilidadeMax: { type: Number, default: 100 }
    },
    
    // Requisitos para usar
    requisitos: {
        habilidade: { type: Map, of: Number }, // { "forca": 20 }
        nivelMinimo: { type: Number, default: 0 },
        idadeMinima: { type: Number, default: 0 }
    },
    
    dataAquisicao: { type: Date, default: Date.now },
    expiraEm: Date, // para itens perecíveis
    origem: String, // como conseguiu
    usado: { type: Boolean, default: false } // para livros/cursos já usados
});

const EquipamentoSchema = new mongoose.Schema({
    nome: String,
    tipo: { type: String, enum: ['roupa', 'acessório', 'arma', 'veículo', 'documento'] },
    slot: { type: String, enum: ['cabeca', 'torso', 'pernas', 'pes', 'acessorio', 'maos', 'veiculo'] },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    durabilidadeAtual: Number,
    equipadoDesde: { type: Date, default: Date.now }
});

const MochilaSchema = new mongoose.Schema({
    capacidade: { type: Number, default: 20 }, // kg
    pesoAtual: { type: Number, default: 0 },
    items: [ItemSchema],
    tipo: { type: String, enum: ['padrão', 'grande', 'mochileiro', 'militar'], default: 'padrão' }
});

const CasaItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId },
    nome: String,
    tipo: String,
    localizacao: { type: String, enum: ['sala', 'quarto', 'cozinha', 'banheiro', 'garagem', 'armario'] },
    quantidade: Number
});

// ==================== SCHEMA PRINCIPAL ====================

const InventarioSchema = new mongoose.Schema({
    // ==================== INVENTÁRIO PESSOAL (mochila) ====================
    mochila: MochilaSchema,
    
    // ==================== EQUIPAMENTOS VESTIDOS ====================
    equipados: [EquipamentoSchema],
    
    // ==================== CASA / PROPRIEDADE ====================
    casaItens: [CasaItemSchema],
    capacidadeArmazenamento: { type: Number, default: 100 }, // kg em casa
    
    // ==================== LIVROS E CURSOS ====================
    biblioteca: [{
        livroId: { type: mongoose.Schema.Types.ObjectId },
        titulo: String,
        autor: String,
        genero: String,
        lido: { type: Boolean, default: false },
        paginas: Number,
        paginasLidas: { type: Number, default: 0 },
        xpPorPagina: Number,
        dataInicio: Date,
        dataConclusao: Date
    }],
    
    cursosComprados: [{
        cursoId: { type: mongoose.Schema.Types.ObjectId },
        nome: String,
        instituicao: String,
        dataCompra: Date,
        dataConclusao: Date,
        certificado: { type: Boolean, default: false }
    }],
    
    // ==================== RECEITAS ====================
    receitasConhecidas: [{
        nome: String,
        tipo: String,
        ingredientes: [String],
        resultado: String
    }],
    
    // ==================== ESTATÍSTICAS ====================
    estatisticas: {
        totalItems: { type: Number, default: 0 },
        itemsRaros: { type: Number, default: 0 },
        itemsEpicos: { type: Number, default: 0 },
        itemsLendarios: { type: Number, default: 0 },
        livrosLidos: { type: Number, default: 0 },
        cursosCompletados: { type: Number, default: 0 },
        valorTotalInventario: { type: Number, default: 0 }
    },
    
    // ==================== LIMITES ====================
    limiteMochila: { type: Number, default: 20 }, // kg
    limiteCasa: { type: Number, default: 100 }, // kg
    
    ultimaAtualizacao: { type: Date, default: Date.now }
});

// ==================== MÉTODOS ====================

// Adicionar item ao inventário
InventarioSchema.methods.adicionarItem = async function(item, quantidade = 1) {
    const itemExistente = this.mochila.items.find(i => 
        i.nome === item.nome && 
        i.tipo === item.tipo &&
        !i.usado &&
        (!item.atributos.durabilidade || i.atributos.durabilidade === item.atributos.durabilidade)
    );
    
    const pesoAdicional = (item.peso || 0.1) * quantidade;
    
    if (this.mochila.pesoAtual + pesoAdicional > this.limiteMochila) {
        return { sucesso: false, motivo: 'Mochila cheia', pesoAtual: this.mochila.pesoAtual, limite: this.limiteMochila };
    }
    
    if (itemExistente && item.tipo !== 'livro' && item.tipo !== 'curso') {
        itemExistente.quantidade += quantidade;
    } else {
        for (let i = 0; i < quantidade; i++) {
            const novoItem = { ...item.toObject ? item.toObject() : item };
            this.mochila.items.push(novoItem);
        }
    }
    
    this.mochila.pesoAtual += pesoAdicional;
    this.estatisticas.totalItems += quantidade;
    
    // Atualiza contagem de raridade
    if (item.raridade === 'raro') this.estatisticas.itemsRaros += quantidade;
    if (item.raridade === 'épico') this.estatisticas.itemsEpicos += quantidade;
    if (item.raridade === 'lendário') this.estatisticas.itemsLendarios += quantidade;
    
    // Recalcula valor total
    await this.recalcularValorTotal();
    
    return { sucesso: true, item: item.nome, quantidade: quantidade };
};

// Remover item do inventário
InventarioSchema.methods.removerItem = async function(itemId, quantidade = 1) {
    const itemIndex = this.mochila.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
        return { sucesso: false, motivo: 'Item não encontrado' };
    }
    
    const item = this.mochila.items[itemIndex];
    const pesoRemovido = (item.peso || 0.1) * quantidade;
    
    if (item.quantidade > quantidade) {
        item.quantidade -= quantidade;
    } else {
        this.mochila.items.splice(itemIndex, 1);
    }
    
    this.mochila.pesoAtual = Math.max(0, this.mochila.pesoAtual - pesoRemovido);
    this.estatisticas.totalItems -= quantidade;
    
    if (item.raridade === 'raro') this.estatisticas.itemsRaros -= quantidade;
    if (item.raridade === 'épico') this.estatisticas.itemsEpicos -= quantidade;
    if (item.raridade === 'lendário') this.estatisticas.itemsLendarios -= quantidade;
    
    await this.recalcularValorTotal();
    
    return { sucesso: true, item: item.nome, quantidadeRemovida: quantidade };
};

// Usar item (comida, bebida, remédio, livro)
InventarioSchema.methods.usarItem = async function(player, itemId) {
    const itemIndex = this.mochila.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
        return { sucesso: false, motivo: 'Item não encontrado' };
    }
    
    const item = this.mochila.items[itemIndex];
    const resultados = { efeitos: [], expirado: false };
    
    // Verifica se expirou
    if (item.expiraEm && new Date() > item.expiraEm) {
        this.mochila.items.splice(itemIndex, 1);
        return { sucesso: false, motivo: 'Item expirado' };
    }
    
    // Verifica requisitos
    if (item.requisitos && item.requisitos.nivelMinimo > player.habilidades?.estatisticas?.nivelMedio) {
        return { sucesso: false, motivo: 'Nível insuficiente para usar este item' };
    }
    
    // Aplica efeitos baseado no tipo
    switch(item.tipo) {
        case 'comida':
            if (player.necessidades) {
                const fomeAntes = player.necessidades.fome;
                player.necessidades.fome = Math.max(0, player.necessidades.fome - (item.atributos.fome || 20));
                resultados.efeitos.push(`Fome: ${fomeAntes} → ${player.necessidades.fome}`);
                
                if (item.atributos.energia) {
                    player.necessidades.energia = Math.min(100, player.necessidades.energia + item.atributos.energia);
                    resultados.efeitos.push(`Energia +${item.atributos.energia}`);
                }
                if (item.atributos.felicidade) {
                    player.necessidades.felicidade = Math.min(100, player.necessidades.felicidade + item.atributos.felicidade);
                    resultados.efeitos.push(`Felicidade +${item.atributos.felicidade}`);
                }
            }
            break;
            
        case 'bebida':
            if (player.necessidades) {
                const sedeAntes = player.necessidades.sede;
                player.necessidades.sede = Math.max(0, player.necessidades.sede - (item.atributos.sede || 30));
                resultados.efeitos.push(`Sede: ${sedeAntes} → ${player.necessidades.sede}`);
            }
            break;
            
        case 'remédio':
            if (player.saude) {
                player.saude.geral = Math.min(100, player.saude.geral + (item.atributos.saude || 20));
                resultados.efeitos.push(`Saúde +${item.atributos.saude || 20}`);
                
                // Remove doenças ativas
                if (item.subtipo === 'antibiótico' && player.saude.doencasAtivas.length > 0) {
                    player.saude.doencasAtivas = player.saude.doencasAtivas.filter(d => 
                        d.intensidade <= 0 || (Date.now() - d.inicio) > 24 * 60 * 60 * 1000
                    );
                    resultados.efeitos.push('Efeito antibiótico: combatendo infecções');
                }
            }
            break;
            
        case 'livro':
            if (!item.usado) {
                this.iniciarLeitura(item);
                resultados.efeitos.push(`Você começou a ler "${item.nome}"`);
            } else {
                resultados.efeitos.push(`Você já leu este livro`);
            }
            // Livros não são consumidos ao começar
            return { sucesso: true, efeitos: resultados.efeitos };
            
        case 'curso':
            if (!item.usado) {
                this.iniciarCurso(item);
                resultados.efeitos.push(`Você iniciou o curso "${item.nome}"`);
            }
            return { sucesso: true, efeitos: resultados.efeitos };
    }
    
    // Consome o item (exceto livros/cursos que são consumidos só quando concluídos)
    if (item.tipo !== 'livro' && item.tipo !== 'curso') {
        if (item.quantidade > 1) {
            item.quantidade -= 1;
        } else {
            this.mochila.items.splice(itemIndex, 1);
        }
        
        this.mochila.pesoAtual -= (item.peso || 0.1);
        this.estatisticas.totalItems -= 1;
    }
    
    // Reduz durabilidade se aplicável
    if (item.atributos.durabilidade) {
        item.atributos.durabilidade -= (item.atributos.durabilidadeMax / 100) * 5;
        if (item.atributos.durabilidade <= 0) {
            this.mochila.items.splice(itemIndex, 1);
            resultados.expirado = true;
            resultados.efeitos.push('O item se desgastou completamente');
        }
    }
    
    await player.save();
    await this.save();
    
    return { sucesso: true, efeitos: resultados.efeitos, expirado: resultados.expirado };
};

// Equipar item (roupa, acessório, etc)
InventarioSchema.methods.equipar = async function(itemId, slot) {
    const item = this.mochila.items.find(i => i.id === itemId);
    if (!item) return { sucesso: false, motivo: 'Item não encontrado' };
    
    if (item.tipo !== 'roupa' && item.tipo !== 'acessório' && item.tipo !== 'arma') {
        return { sucesso: false, motivo: 'Este item não pode ser equipado' };
    }
    
    // Remove item equipado no mesmo slot
    const equipadoExistente = this.equipados.find(e => e.slot === slot);
    if (equipadoExistente) {
        this.desequipar(slot);
    }
    
    this.equipados.push({
        nome: item.nome,
        tipo: item.tipo,
        slot: slot,
        itemId: item.id,
        durabilidadeAtual: item.atributos.durabilidade || 100,
        equipadoDesde: new Date()
    });
    
    // Aplica bônus do item (através de habilidades ou atributos)
    if (item.atributos && item.atributos.xpHabilidade) {
        // Os bônus serão aplicados no sistema de habilidades separadamente
    }
    
    return { sucesso: true, item: item.nome, slot: slot };
};

// Desequipar item
InventarioSchema.methods.desequipar = function(slot) {
    const index = this.equipados.findIndex(e => e.slot === slot);
    if (index !== -1) {
        this.equipados.splice(index, 1);
        return { sucesso: true, slot: slot };
    }
    return { sucesso: false, motivo: 'Nada equipado neste slot' };
};

// Ler livro (progresso)
InventarioSchema.methods.lerLivro = async function(player, livroId, paginas) {
    const livro = this.biblioteca.find(l => l.livroId.toString() === livroId);
    if (!livro) return { sucesso: false, motivo: 'Livro não encontrado' };
    
    if (livro.lido) return { sucesso: false, motivo: 'Você já leu este livro' };
    
    const paginasLidas = Math.min(livro.paginas, livro.paginasLidas + paginas);
    livro.paginasLidas = paginasLidas;
    
    const ganhoXP = paginas * (livro.xpPorPagina || 1);
    
    // Aplica ganho de XP em habilidades
    if (player.habilidades && livro.genero) {
        const categoria = this.getCategoriaPorGenero(livro.genero);
        if (categoria) {
            await player.habilidades.adicionarXP(categoria.cat, categoria.hab, ganhoXP, `Leitura de ${livro.titulo}`);
        }
    }
    
    if (paginasLidas >= livro.paginas) {
        livro.lido = true;
        livro.dataConclusao = new Date();
        this.estatisticas.livrosLidos += 1;
        
        return { sucesso: true, concluido: true, xpGanho: ganhoXP, livro: livro.titulo };
    }
    
    return { sucesso: true, concluido: false, progresso: Math.floor((paginasLidas / livro.paginas) * 100), xpGanho: ganhoXP };
};

// Iniciar leitura de livro
InventarioSchema.methods.iniciarLeitura = function(item) {
    this.biblioteca.push({
        livroId: item.id,
        titulo: item.nome,
        autor: item.autor || 'Desconhecido',
        genero: item.genero || 'geral',
        paginas: item.paginas || 100,
        xpPorPagina: item.atributos?.xpHabilidade?.get('geral') || 2,
        dataInicio: new Date()
    });
    
    // Marca como usado (não pode ser vendido/dado até terminar)
    item.usado = true;
};

// Iniciar curso
InventarioSchema.methods.iniciarCurso = function(item) {
    this.cursosComprados.push({
        cursoId: item.id,
        nome: item.nome,
        instituicao: item.instituicao || 'Online',
        dataCompra: new Date()
    });
    
    item.usado = true;
};

// Concluir curso
InventarioSchema.methods.concluirCurso = async function(player, cursoId) {
    const curso = this.cursosComprados.find(c => c.cursoId.toString() === cursoId);
    if (!curso) return { sucesso: false, motivo: 'Curso não encontrado' };
    
    if (curso.dataConclusao) return { sucesso: false, motivo: 'Curso já concluído' };
    
    curso.dataConclusao = new Date();
    curso.certificado = true;
    this.estatisticas.cursosCompletados += 1;
    
    // Bônus de XP para habilidades
    const bonusHabilidades = {
        'programacao': 'profissionais.programacao',
        'marketing': 'profissionais.marketing',
        'design': 'profissionais.design',
        'vendas': 'profissionais.vendas',
        'culinaria': 'profissionais.culinaria'
    };
    
    if (bonusHabilidades[curso.nome.toLowerCase()] && player.habilidades) {
        await player.habilidades.adicionarXP(
            bonusHabilidades[curso.nome.toLowerCase()].split('.')[0],
            bonusHabilidades[curso.nome.toLowerCase()].split('.')[1],
            50,
            `Curso concluído: ${curso.nome}`
        );
    }
    
    return { sucesso: true, curso: curso.nome, certificado: true };
};

// Mover item para casa
InventarioSchema.methods.moverParaCasa = async function(itemId, localizacao, quantidade = 1) {
    const itemIndex = this.mochila.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return { sucesso: false, motivo: 'Item não encontrado' };
    
    const item = this.mochila.items[itemIndex];
    const quantidadeReal = Math.min(quantidade, item.quantidade);
    
    const pesoRemovido = (item.peso || 0.1) * quantidadeReal;
    
    // Verifica espaço na casa
    const pesoCasa = this.casaItens.reduce((sum, i) => sum + (i.peso || 0.1) * i.quantidade, 0);
    if (pesoCasa + pesoRemovido > this.capacidadeArmazenamento) {
        return { sucesso: false, motivo: 'Casa sem espaço' };
    }
    
    // Remove da mochila
    if (item.quantidade === quantidadeReal) {
        this.mochila.items.splice(itemIndex, 1);
    } else {
        item.quantidade -= quantidadeReal;
    }
    this.mochila.pesoAtual -= pesoRemovido;
    
    // Adiciona na casa
    const itemCasa = this.casaItens.find(i => i.itemId?.toString() === itemId);
    if (itemCasa) {
        itemCasa.quantidade += quantidadeReal;
    } else {
        this.casaItens.push({
            itemId: item.id,
            nome: item.nome,
            tipo: item.tipo,
            localizacao: localizacao,
            quantidade: quantidadeReal,
            peso: item.peso,
            ...(item.atributos && { atributos: item.atributos })
        });
    }
    
    await this.save();
    return { sucesso: true, item: item.nome, quantidade: quantidadeReal, destino: 'casa' };
};

// Vender item
InventarioSchema.methods.venderItem = async function(player, itemId, quantidade = 1) {
    const itemIndex = this.mochila.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return { sucesso: false, motivo: 'Item não encontrado' };
    
    const item = this.mochila.items[itemIndex];
    const quantidadeReal = Math.min(quantidade, item.quantidade);
    const valorVenda = (item.valorVenda || Math.floor(item.valorCompra * 0.7)) * quantidadeReal;
    
    // Adiciona dinheiro ao jogador
    if (player.economia) {
        await player.economia.depositar(valorVenda);
    }
    
    // Remove o item
    await this.removerItem(itemId, quantidadeReal);
    
    await player.save();
    await this.save();
    
    return { sucesso: true, item: item.nome, quantidade: quantidadeReal, valorRecebido: valorVenda };
};

// Crafting (fabricar item a partir de receita)
InventarioSchema.methods.craftar = async function(receitaNome, quantidade = 1) {
    const receita = this.receitasConhecidas.find(r => r.nome === receitaNome);
    if (!receita) return { sucesso: false, motivo: 'Receita desconhecida' };
    
    // Verifica se tem ingredientes
    const ingredientesNecessarios = {};
    for (const ing of receita.ingredientes) {
        const [nome, qtd] = ing.split(':');
        ingredientesNecessarios[nome] = parseInt(qtd) || 1;
    }
    
    for (const [nomeIng, qtdNecessaria] of Object.entries(ingredientesNecessarios)) {
        const item = this.mochila.items.find(i => i.nome === nomeIng);
        if (!item || item.quantidade < qtdNecessaria * quantidade) {
            return { sucesso: false, motivo: `Ingrediente insuficiente: ${nomeIng}` };
        }
    }
    
    // Consome ingredientes
    for (const [nomeIng, qtdNecessaria] of Object.entries(ingredientesNecessarios)) {
        const item = this.mochila.items.find(i => i.nome === nomeIng);
        await this.removerItem(item.id, qtdNecessaria * quantidade);
    }
    
    // Adiciona resultado
    const novoItem = {
        nome: receita.resultado,
        tipo: this.determinarTipoPorReceita(receita.resultado),
        quantidade: quantidade,
        peso: 0.1,
        valorCompra: 0,
        valorVenda: 0
    };
    
    await this.adicionarItem(novoItem, quantidade);
    
    return { sucesso: true, item: receita.resultado, quantidade: quantidade };
};

// Recalcular valor total do inventário
InventarioSchema.methods.recalcularValorTotal = async function() {
    let total = 0;
    
    for (const item of this.mochila.items) {
        total += (item.valorVenda || item.valorCompra || 0) * item.quantidade;
    }
    
    for (const item of this.casaItens) {
        total += (item.valorVenda || item.valorCompra || 0) * item.quantidade;
    }
    
    this.estatisticas.valorTotalInventario = total;
    return total;
};

// Helper: determinar categoria por gênero de livro
InventarioSchema.methods.getCategoriaPorGenero = function(genero) {
    const mapa = {
        'programacao': { cat: 'profissionais', hab: 'programacao' },
        'tecnologia': { cat: 'profissionais', hab: 'programacao' },
        'negocios': { cat: 'profissionais', hab: 'gestao' },
        'marketing': { cat: 'profissionais', hab: 'marketing' },
        'design': { cat: 'profissionais', hab: 'design' },
        'culinaria': { cat: 'profissionais', hab: 'culinaria' },
        'fitness': { cat: 'fisicas', hab: 'forca' },
        'psicologia': { cat: 'sociais', hab: 'empatia' }
    };
    return mapa[genero] || null;
};

// Helper: determinar tipo por nome da receita
InventarioSchema.methods.determinarTipoPorReceita = function(nome) {
    if (nome.includes('camisa') || nome.includes('calça') || nome.includes('vestido')) return 'roupa';
    if (nome.includes('pizza') || nome.includes('sanduíche') || nome.includes('sopa')) return 'comida';
    if (nome.includes('suco') || nome.includes('refrigerante')) return 'bebida';
    if (nome.includes('poção') || nome.includes('remédio')) return 'remédio';
    return 'outro';
};

// Verificar espaço na mochila antes de adicionar
InventarioSchema.methods.verificarEspaco = function(pesoItem) {
    return this.mochila.pesoAtual + pesoItem <= this.limiteMochila;
};

// Obter resumo do inventário
InventarioSchema.methods.getResumo = function() {
    return {
        pesoAtual: this.mochila.pesoAtual,
        capacidadeMax: this.limiteMochila,
        espacoRestante: this.limiteMochila - this.mochila.pesoAtual,
        totalItems: this.estatisticas.totalItems,
        itemsRaros: this.estatisticas.itemsRaros,
        valorTotal: this.estatisticas.valorTotalInventario,
        itensPrincipais: this.mochila.items.slice(0, 5).map(i => ({
            nome: i.nome,
            quantidade: i.quantidade,
            tipo: i.tipo
        }))
    };
};

module.exports = InventarioSchema;