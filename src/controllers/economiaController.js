const Player = require('../models/Player');

async function transferirDinheiro(playerId, destinoPlayerId, valor) {
    try {
        const origem = await Player.findById(playerId);
        const destino = await Player.findById(destinoPlayerId);
        
        if (!origem || !destino) {
            return { sucesso: false, erro: 'Jogador não encontrado' };
        }
        
        if (origem.economia.dinheiroVivo < valor) {
            return { sucesso: false, erro: 'Saldo insuficiente' };
        }
        
        origem.economia.dinheiroVivo -= valor;
        destino.economia.dinheiroVivo += valor;
        
        await origem.economia.adicionarTransacao('transferencia', valor, `Transferência para ${destino.nome}`, 'transferencia');
        await destino.economia.adicionarTransacao('transferencia', valor, `Transferência recebida de ${origem.nome}`, 'transferencia');
        
        await origem.save();
        await destino.save();
        
        return {
            sucesso: true,
            valor: valor,
            de: origem.nome,
            para: destino.nome,
            saldoOrigem: origem.economia.dinheiroVivo
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function depositar(playerId, valor, contaId = null) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.economia.depositar(valor, contaId);
        await player.save();
        
        return {
            sucesso: true,
            novoSaldo: player.economia.getSaldoTotal(),
            mensagem: `Depósito de C$ ${valor} realizado com sucesso`
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function sacar(playerId, valor) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const saldoBancario = player.economia.getSaldoBancario();
        
        if (saldoBancario < valor) {
            return { sucesso: false, erro: 'Saldo bancário insuficiente' };
        }
        
        // Remove do banco, adiciona ao dinheiro vivo
        let valorRestante = valor;
        for (const conta of player.economia.contasBancarias) {
            if (valorRestante <= 0) break;
            const debito = Math.min(conta.saldo, valorRestante);
            conta.saldo -= debito;
            valorRestante -= debito;
        }
        
        player.economia.dinheiroVivo += valor;
        await player.save();
        
        return {
            sucesso: true,
            valorSacado: valor,
            dinheiroVivo: player.economia.dinheiroVivo
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function investir(playerId, tipo, nome, valor, rentabilidade, risco, liquidez) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        if (player.economia.getSaldoTotal() < valor) {
            return { sucesso: false, erro: 'Saldo insuficiente' };
        }
        
        const resultado = await player.economia.investir(tipo, nome, valor, rentabilidade, risco, liquidez);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function resgatarInvestimento(playerId, investimentoId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.economia.resgatarInvestimento(investimentoId);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function pegarEmprestimo(playerId, valor, parcelas, juros) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.economia.pegarEmprestimo(valor, parcelas, juros);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function pagarDivida(playerId, dividaId, valor = null) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const resultado = await player.economia.pagarDivida(dividaId, valor);
        await player.save();
        
        return resultado;
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function getRelatorioFinanceiro(playerId) {
    try {
        const player = await Player.findById(playerId);
        if (!player) return { sucesso: false, erro: 'Personagem não encontrado' };
        
        const relatorio = player.economia.gerarRelatorio();
        
        return {
            sucesso: true,
            relatorio: relatorio
        };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

module.exports = {
    transferirDinheiro,
    depositar,
    sacar,
    investir,
    resgatarInvestimento,
    pegarEmprestimo,
    pagarDivida,
    getRelatorioFinanceiro
};