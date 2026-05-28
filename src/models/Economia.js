const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const TransacaoSchema = new mongoose.Schema({
    id: { type: String, required: true, default: () => new mongoose.Types.ObjectId() },
    tipo: { 
        type: String, 
        enum: ['salario', 'compra', 'venda', 'transferencia', 'investimento', 
               'imposto', 'aluguel', 'presente', 'aposta', 'reembolso'],
        required: true 
    },
    valor: { type: Number, required: true },
    moeda: { type: String, default: 'BRL' },
    descricao: String,
    categoria: { type: String, enum: ['moradia', 'alimentacao', 'transporte', 'lazer', 'saude', 'educacao', 'outros'] },
    origem: String, // de quem veio
    destino: String, // para quem foi
    data: { type: Date, default: Date.now },
    comprovante: String,
    status: { type: String, enum: ['pendente', 'concluida', 'cancelada'], default: 'concluida' }
});

const ContaBancariaSchema = new mongoose.Schema({
    banco: { type: String, required: true },
    agencia: String,
    conta: String,
    tipo: { type: String, enum: ['corrente', 'poupanca', 'salario'], default: 'corrente' },
    saldo: { type: Number, default: 0 },
    limite: { type: Number, default: 0 },
    cartaoCredito: {
        numero: String,
        validade: Date,
        limite: Number,
        faturaAtual: { type: Number, default: 0 },
        diaVencimento: Number
    },
    transferenciasRecebidas: [TransacaoSchema],
    transferenciasEnviadas: [TransacaoSchema]
});

const InvestimentoSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['poupanca', 'cdb', 'lci', 'acoes', 'fii', 'tesouro', 'cripto'] },
    nome: String,
    valorAplicado: Number,
    valorAtual: Number,
    dataAplicacao: { type: Date, default: Date.now },
    dataVencimento: Date,
    rentabilidade: Number, // percentual
    risco: { type: String, enum: ['baixo', 'medio', 'alto'] },
    liquidez: { type: String, enum: ['imediata', 'd+1', 'd+30', 'longo'] },
    resgatado: { type: Boolean, default: false },
    resgateData: Date
});

const DividaSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['emprestimo', 'financiamento', 'cartao', 'pessoal'] },
    credor: String,
    valorTotal: Number,
    valorPago: { type: Number, default: 0 },
    valorRestante: Number,
    juros: Number,
    parcelas: Number,
    parcelasPagas: { type: Number, default: 0 },
    proximoVencimento: Date,
    status: { type: String, enum: ['ativa', 'paga', 'atrasada'], default: 'ativa' }
});

const PropriedadeFinanceiraSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['imovel', 'veiculo', 'empresa', 'terreno'] },
    nome: String,
    valorCompra: Number,
    valorAtual: Number,
    dataCompra: Date,
    localizacao: String,
    aluguel: { type: Number, default: 0 },
    vendido: { type: Boolean, default: false }
});

const SalarioSchema = new mongoose.Schema({
    valor: Number,
    dataProximo: Date,
    periodicidade: { type: String, enum: ['semanal', 'quinzenal', 'mensal'] },
    ultimoPagamento: Date,
    bonus: { type: Number, default: 0 }
});

// ==================== SCHEMA PRINCIPAL ====================

const EconomiaSchema = new mongoose.Schema({
    // ==================== DINHEIRO ====================
    dinheiroVivo: { type: Number, default: 150, min: 0 },
    
    // ==================== MOEDA ATUAL ====================
    moedaAtual: { type: String, default: 'BRL' },      // Código da moeda (BRL, USD, EUR, etc.)
    simboloMoeda: { type: String, default: 'R$' },     // Símbolo para exibição
    
    contasBancarias: [ContaBancariaSchema],
    contaPrincipal: { type: mongoose.Schema.Types.ObjectId },
    
    // ==================== INVESTIMENTOS ====================
    investimentos: [InvestimentoSchema],
    
    // ==================== DÍVIDAS ====================
    dividas: [DividaSchema],
    scoreCredito: { type: Number, default: 500, min: 0, max: 1000 },
    
    // ==================== PATRIMÔNIO ====================
    patrimonio: [PropriedadeFinanceiraSchema],
    patrimonioTotal: { type: Number, default: 0 },
    
    // ==================== EMPREGO / EMPRESA ====================
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', default: null },
    empresaNome: { type: String, default: null },
    cargo: { type: String, default: null },
    salario: { type: Number, default: 0 },
    ultimoPagamentoSalario: { type: Date, default: null },

    // ==================== RENDA ====================
    salarioDetalhes: SalarioSchema,
    rendaPassiva: { type: Number, default: 0 },
    fontesRenda: [{
        nome: String,
        valor: Number,
        periodicidade: String,
        ultimoRecebimento: Date
    }],
    
    // ==================== GASTOS FIXOS ====================
    gastosFixos: [{
        nome: String,
        valor: Number,
        periodicidade: String,
        diaVencimento: Number,
        proximoVencimento: Date,
        categoria: String
    }],
    
    // ==================== IMPOSTOS ====================
    impostoRenda: {
        aliquota: { type: Number, default: 15 },
        anoBase: Number,
        declarado: { type: Boolean, default: false },
        restituicao: { type: Number, default: 0 }
    },
    impostosPagos: [{
        nome: String,
        valor: Number,
        data: Date,
        competencia: String
    }],
    
    // ==================== HISTÓRICO ====================
    historicoTransacoes: [TransacaoSchema],
    
    // ==================== ESTATÍSTICAS ====================
    estatisticas: {
        totalGanho: { type: Number, default: 0 },
        totalGasto: { type: Number, default: 0 },
        economias: { type: Number, default: 0 },
        mesesConsecutivosPositivo: { type: Number, default: 0 },
        maiorSaldo: { type: Number, default: 0 },
        maiorDivida: { type: Number, default: 0 }
    },
    
    // ==================== CONTROLE ====================
    ultimaAtualizacao: { type: Date, default: Date.now },
    orcamentoMensal: {
        limite: Number,
        gastoAtual: { type: Number, default: 0 },
        categoriaLimites: Map
    }
});

// ==================== MÉTODOS ====================

// Saldo total (dinheiro vivo + contas bancárias)
EconomiaSchema.methods.getSaldoTotal = function() {
    let saldoBancario = 0;
    this.contasBancarias.forEach(conta => {
        saldoBancario += conta.saldo;
    });
    return this.dinheiroVivo + saldoBancario;
};

// Saldo apenas bancário
EconomiaSchema.methods.getSaldoBancario = function() {
    let saldo = 0;
    this.contasBancarias.forEach(conta => {
        saldo += conta.saldo;
    });
    return saldo;
};

// Adicionar transação
EconomiaSchema.methods.adicionarTransacao = async function(tipo, valor, descricao, categoria = 'outros', origem = null, destino = null) {
    const transacao = {
        tipo,
        valor,
        descricao,
        categoria,
        origem,
        destino,
        data: new Date(),
        status: 'concluida'
    };
    
    this.historicoTransacoes.push(transacao);
    
    // Atualiza estatísticas
    if (tipo === 'salario' || tipo === 'venda' || tipo === 'reembolso' || tipo === 'transferencia_recebida') {
        this.estatisticas.totalGanho += valor;
    } else {
        this.estatisticas.totalGasto += valor;
    }
    
    this.estatisticas.economias = this.getSaldoTotal();
    if (this.getSaldoTotal() > this.estatisticas.maiorSaldo) {
        this.estatisticas.maiorSaldo = this.getSaldoTotal();
    }
    
    return transacao;
};

// Receber salário
EconomiaSchema.methods.receberSalario = async function() {
    if (!this.salario) return { sucesso: false, motivo: 'Sem emprego' };
    
    const agora = new Date();
    if (this.salario.dataProximo && agora < this.salario.dataProximo) {
        return { sucesso: false, motivo: 'Ainda não é dia de receber' };
    }
    
    const valorLiquido = this.calcularSalarioLiquido(this.salario.valor);
    
    // Deposita na conta principal
    if (this.contaPrincipal) {
        const conta = this.contasBancarias.id(this.contaPrincipal);
        if (conta) {
            conta.saldo += valorLiquido;
        }
    } else {
        this.dinheiroVivo += valorLiquido;
    }
    
    // Registra transação
    await this.adicionarTransacao('salario', valorLiquido, 'Salário mensal', 'renda');
    
    // Atualiza próximo pagamento
    const novoSalario = { ...this.salario.toObject() };
    switch(novoSalario.periodicidade) {
        case 'semanal':
            novoSalario.dataProximo.setDate(agora.getDate() + 7);
            break;
        case 'quinzenal':
            novoSalario.dataProximo.setDate(agora.getDate() + 15);
            break;
        case 'mensal':
            novoSalario.dataProximo.setMonth(agora.getMonth() + 1);
            break;
    }
    novoSalario.ultimoPagamento = agora;
    this.salario = novoSalario;
    
    // Processa gastos fixos automaticamente
    await this.processarGastosFixos();
    
    return {
        sucesso: true,
        valor: valorLiquido,
        valorBruto: this.salario.valor,
        proximoPagamento: this.salario.dataProximo
    };
};

// Calcular salário líquido (após impostos)
EconomiaSchema.methods.calcularSalarioLiquido = function(valorBruto) {
    const imposto = valorBruto * (this.impostoRenda.aliquota / 100);
    return valorBruto - imposto;
};

// Gastar dinheiro
EconomiaSchema.methods.gastar = async function(valor, descricao, categoria = 'outros', usarCartao = false) {
    if (!usarCartao && this.dinheiroVivo < valor) {
        // Tenta usar conta bancária
        const saldoBancario = this.getSaldoBancario();
        if (saldoBancario < valor) {
            return { sucesso: false, motivo: 'Saldo insuficiente', saldo: this.getSaldoTotal() };
        }
        
        // Usa conta bancária
        let valorRestante = valor;
        for (const conta of this.contasBancarias) {
            if (valorRestante <= 0) break;
            const debito = Math.min(conta.saldo, valorRestante);
            conta.saldo -= debito;
            valorRestante -= debito;
        }
    } else if (usarCartao) {
        // Usa cartão de crédito
        const conta = this.contasBancarias.id(this.contaPrincipal);
        if (conta && conta.cartaoCredito) {
            const novoLimite = conta.cartaoCredito.limite - conta.cartaoCredito.faturaAtual;
            if (novoLimite < valor) {
                return { sucesso: false, motivo: 'Limite do cartão excedido' };
            }
            conta.cartaoCredito.faturaAtual += valor;
        }
    } else {
        this.dinheiroVivo -= valor;
    }
    
    await this.adicionarTransacao('compra', valor, descricao, categoria);
    
    // Atualiza orçamento mensal
    if (this.orcamentoMensal) {
        this.orcamentoMensal.gastoAtual += valor;
    }
    
    return { sucesso: true, saldoRestante: this.getSaldoTotal() };
};

// Depositar dinheiro
EconomiaSchema.methods.depositar = async function(valor, contaId = null) {
    let contaDeposito = null;
    
    if (contaId) {
        contaDeposito = this.contasBancarias.id(contaId);
    } else if (this.contaPrincipal) {
        contaDeposito = this.contasBancarias.id(this.contaPrincipal);
    }
    
    if (contaDeposito) {
        contaDeposito.saldo += valor;
    } else {
        this.dinheiroVivo += valor;
    }
    
    await this.adicionarTransacao('deposito', valor, 'Depósito bancário', 'renda');
    
    return { sucesso: true, novoSaldo: this.getSaldoTotal() };
};

// Transferir entre contas
EconomiaSchema.methods.transferir = async function(valor, contaOrigemId, contaDestinoId) {
    const contaOrigem = this.contasBancarias.id(contaOrigemId);
    const contaDestino = this.contasBancarias.id(contaDestinoId);
    
    if (!contaOrigem || !contaDestino) {
        return { sucesso: false, motivo: 'Conta não encontrada' };
    }
    
    if (contaOrigem.saldo < valor) {
        return { sucesso: false, motivo: 'Saldo insuficiente' };
    }
    
    contaOrigem.saldo -= valor;
    contaDestino.saldo += valor;
    
    await this.adicionarTransacao('transferencia', valor, 'Transferência entre contas', 'movimentacao');
    
    return { sucesso: true, saldoOrigem: contaOrigem.saldo, saldoDestino: contaDestino.saldo };
};

// Investir
EconomiaSchema.methods.investir = async function(tipo, nome, valor, rentabilidade, risco, liquidez, duracaoMeses = null) {
    if (this.getSaldoTotal() < valor) {
        return { sucesso: false, motivo: 'Saldo insuficiente' };
    }
    
    // Debita o valor
    await this.gastar(valor, `Investimento em ${nome}`, 'investimento');
    
    const dataVencimento = duracaoMeses ? new Date(Date.now() + duracaoMeses * 30 * 24 * 60 * 60 * 1000) : null;
    
    this.investimentos.push({
        tipo,
        nome,
        valorAplicado: valor,
        valorAtual: valor,
        dataAplicacao: new Date(),
        dataVencimento,
        rentabilidade,
        risco,
        liquidez,
        resgatado: false
    });
    
    return { sucesso: true, investimento: this.investimentos[this.investimentos.length - 1] };
};

// Resgatar investimento
EconomiaSchema.methods.resgatarInvestimento = async function(investimentoId) {
    const invest = this.investimentos.id(investimentoId);
    if (!invest) return { sucesso: false, motivo: 'Investimento não encontrado' };
    if (invest.resgatado) return { sucesso: false, motivo: 'Já foi resgatado' };
    
    const agora = new Date();
    const tempoDecorridoMeses = (agora - invest.dataAplicacao) / (30 * 24 * 60 * 60 * 1000);
    
    // Calcula rendimento
    let rendimento = invest.valorAplicado;
    if (invest.liquidez === 'imediata') {
        rendimento = invest.valorAplicado * (1 + (invest.rentabilidade / 100));
    } else {
        rendimento = invest.valorAplicado * Math.pow(1 + (invest.rentabilidade / 100), tempoDecorridoMeses);
    }
    
    const lucro = rendimento - invest.valorAplicado;
    
    // Deposita o valor
    await this.depositar(Math.floor(rendimento));
    
    invest.valorAtual = Math.floor(rendimento);
    invest.resgatado = true;
    invest.resgateData = agora;
    
    await this.adicionarTransacao('investimento', Math.floor(rendimento), `Resgate de ${invest.nome}`, 'renda');
    
    return {
        sucesso: true,
        valorResgatado: Math.floor(rendimento),
        lucro: Math.floor(lucro),
        rentabilidadeReal: ((rendimento / invest.valorAplicado) - 1) * 100
    };
};

// Pegar empréstimo
EconomiaSchema.methods.pegarEmprestimo = async function(valor, parcelas, juros) {
    // Verifica score de crédito
    let scoreBonus = 1;
    if (this.scoreCredito > 700) scoreBonus = 1.5;
    if (this.scoreCredito < 300) scoreBonus = 0.5;
    
    const valorComJuros = valor * (1 + (juros / 100)) * scoreBonus;
    const valorParcela = valorComJuros / parcelas;
    
    // Credita o valor
    await this.depositar(valor);
    
    this.dividas.push({
        tipo: 'emprestimo',
        credor: 'Banco Central',
        valorTotal: Math.floor(valorComJuros),
        valorRestante: Math.floor(valorComJuros),
        juros: juros,
        parcelas: parcelas,
        proximoVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    return {
        sucesso: true,
        valorRecebido: valor,
        totalPagar: Math.floor(valorComJuros),
        valorParcela: Math.floor(valorParcela),
        parcelas: parcelas
    };
};

// Pagar dívida
EconomiaSchema.methods.pagarDivida = async function(dividaId, valor = null) {
    const divida = this.dividas.id(dividaId);
    if (!divida) return { sucesso: false, motivo: 'Dívida não encontrada' };
    
    const valorPagar = valor || divida.valorRestante;
    
    if (this.getSaldoTotal() < valorPagar) {
        return { sucesso: false, motivo: 'Saldo insuficiente' };
    }
    
    await this.gastar(valorPagar, `Pagamento de dívida - ${divida.credor}`, 'divida');
    
    divida.valorPago += valorPagar;
    divida.valorRestante -= valorPagar;
    divida.parcelasPagas += 1;
    
    if (divida.valorRestante <= 0) {
        divida.status = 'paga';
    }
    
    // Aumenta score de crédito
    this.scoreCredito = Math.min(1000, this.scoreCredito + 10);
    
    return { sucesso: true, restante: divida.valorRestante };
};

// Processar gastos fixos
EconomiaSchema.methods.processarGastosFixos = async function() {
    const agora = new Date();
    const gastosProcessados = [];
    
    for (const gasto of this.gastosFixos) {
        if (gasto.proximoVencimento && agora >= gasto.proximoVencimento) {
            const result = await this.gastar(gasto.valor, gasto.nome, gasto.categoria);
            
            if (result.sucesso) {
                // Atualiza próximo vencimento
                switch(gasto.periodicidade) {
                    case 'mensal':
                        gasto.proximoVencimento.setMonth(agora.getMonth() + 1);
                        break;
                    case 'semanal':
                        gasto.proximoVencimento.setDate(agora.getDate() + 7);
                        break;
                }
                gastosProcessados.push(gasto.nome);
            } else {
                // Dívida atrasada
                this.scoreCredito = Math.max(0, this.scoreCredito - 5);
            }
        }
    }
    
    return gastosProcessados;
};

// Atualizar rentabilidade dos investimentos
EconomiaSchema.methods.atualizarInvestimentos = function() {
    for (const invest of this.investimentos) {
        if (!invest.resgatado) {
            const tempoMeses = (Date.now() - invest.dataAplicacao) / (30 * 24 * 60 * 60 * 1000);
            invest.valorAtual = Math.floor(invest.valorAplicado * Math.pow(1 + (invest.rentabilidade / 100), tempoMeses));
        }
    }
};

// Calcular patrimônio total
EconomiaSchema.methods.calcularPatrimonioTotal = function() {
    let total = this.getSaldoTotal();
    
    // Soma investimentos
    for (const invest of this.investimentos) {
        if (!invest.resgatado) total += invest.valorAtual;
    }
    
    // Soma propriedades
    for (const prop of this.patrimonio) {
        if (!prop.vendido) total += prop.valorAtual;
    }
    
    this.patrimonioTotal = total;
    return total;
};

// Adicionar gasto fixo
EconomiaSchema.methods.adicionarGastoFixo = function(nome, valor, periodicidade, diaVencimento, categoria) {
    const agora = new Date();
    const proximoVencimento = new Date(agora.getFullYear(), agora.getMonth(), diaVencimento);
    if (proximoVencimento < agora) {
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    }
    
    this.gastosFixos.push({
        nome, valor, periodicidade, diaVencimento, categoria,
        proximoVencimento
    });
    
    return { sucesso: true, gasto: nome };
};

// Relatório financeiro
EconomiaSchema.methods.gerarRelatorio = function() {
    const ultimoMes = new Date();
    ultimoMes.setMonth(ultimoMes.getMonth() - 1);
    
    const transacoesMes = this.historicoTransacoes.filter(t => t.data > ultimoMes);
    
    const ganhosMes = transacoesMes.filter(t => 
        ['salario', 'venda', 'reembolso', 'deposito'].includes(t.tipo)
    ).reduce((sum, t) => sum + t.valor, 0);
    
    const gastosMes = transacoesMes.filter(t => 
        ['compra', 'transferencia', 'imposto', 'aluguel'].includes(t.tipo)
    ).reduce((sum, t) => sum + t.valor, 0);
    
    const porCategoria = {};
    transacoesMes.forEach(t => {
        if (!porCategoria[t.categoria]) porCategoria[t.categoria] = 0;
        porCategoria[t.categoria] += t.valor;
    });
    
    return {
        saldoTotal: this.getSaldoTotal(),
        patrimonioTotal: this.calcularPatrimonioTotal(),
        ganhosMes,
        gastosMes,
        saldoMes: ganhosMes - gastosMes,
        porCategoria,
        scoreCredito: this.scoreCredito,
        dividasAtivas: this.dividas.filter(d => d.status === 'ativa').length,
        investimentosAtivos: this.investimentos.filter(i => !i.resgatado).length
    };
};

EconomiaSchema.methods.limitarTransacoes = function() {
    const MAX_TRANSACOES = 50;
    
    if (this.historicoTransacoes.length > MAX_TRANSACOES) {
        this.historicoTransacoes = this.historicoTransacoes.slice(-MAX_TRANSACOES);
    }
};

// ==================== MÉTODO PARA ATUALIZAR MOEDA POR PAÍS ====================
EconomiaSchema.methods.atualizarMoedaPorPais = function(paisId) {
    try {
        const { getMoedaPorPais } = require('../utils/moedas');
        const moeda = getMoedaPorPais(paisId);
        
        if (moeda && this.moedaAtual !== moeda.codigo) {
            console.log(`[ECONOMIA] Atualizando moeda: ${this.moedaAtual} -> ${moeda.codigo} (${moeda.simbolo})`);
            this.moedaAtual = moeda.codigo;
            this.simboloMoeda = moeda.simbolo;
        }
        return true;
    } catch (erro) {
        console.error('[ECONOMIA] Erro ao atualizar moeda:', erro);
        return false;
    }
};

module.exports = EconomiaSchema;