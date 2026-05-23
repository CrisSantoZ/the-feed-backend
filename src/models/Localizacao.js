const mongoose = require('mongoose');

// ==================== SUBSCHEMAS ====================

const ViagemSchema = new mongoose.Schema({
    origem: {
        pais: String,
        cidade: String,
        local: String
    },
    destino: {
        pais: String,
        cidade: String,
        local: String
    },
    meioTransporte: { 
        type: String, 
        enum: ['pe', 'carro', 'onibus', 'metro', 'trem', 'aviao', 'navio', 'taxi', 'bicicleta', 'moto']
    },
    distanciaKm: Number,
    duracaoHoras: Number,
    custo: Number,
    dataPartida: { type: Date, default: Date.now },
    dataChegada: Date,
    status: { 
        type: String, 
        enum: ['planejada', 'em_andamento', 'concluida', 'cancelada'],
        default: 'planejada'
    },
    companhia: { type: String }, // nome da companhia aérea, ônibus, etc
    assento: String,
    bagagem: { type: Number, default: 0 } // kg
});

const VisitaSchema = new mongoose.Schema({
    local: {
        pais: String,
        cidade: String,
        estabelecimento: String
    },
    tipo: { type: String, enum: ['turismo', 'negocios', 'moradia', 'evento'] },
    dataInicio: Date,
    dataFim: Date,
    avaliacao: { type: Number, min: 0, max: 5 },
    comentario: String
});

const TransportePessoalSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['carro', 'moto', 'bicicleta', 'patinete'] },
    modelo: String,
    placa: String,
    ano: Number,
    cor: String,
    condicao: { type: Number, default: 100, min: 0, max: 100 },
    combustivel: { type: Number, default: 100, min: 0, max: 100 },
    quilometragem: { type: Number, default: 0 },
    documentacao: {
        licenciado: { type: Boolean, default: true },
        seguroVencimento: Date,
        ipvaPago: { type: Boolean, default: true }
    },
    estacionadoEm: {
        pais: String,
        cidade: String,
        endereco: String
    }
});

// ==================== SCHEMA PRINCIPAL ====================

const LocalizacaoSchema = new mongoose.Schema({
    // ==================== LOCAL ATUAL ====================
    paisAtual: { 
        type: String, 
        required: true, 
        default: 'brasil',
        lowercase: true
    },
    estadoAtual: { 
    type: String, 
    default: 'São Paulo'
},
    cidadeAtual: { 
        type: String, 
        required: true, 
        default: 'São Paulo'
    },
    regiaoAtual: { type: String }, // estado/província/região
    bairroAtual: { type: String },
    enderecoAtual: {
        rua: String,
        numero: String,
        complemento: String,
        cep: String
    },
    localEspecifico: { type: String }, // casa, trabalho, escola, etc
    
    // ==================== MORADIA ====================
    residencia: {
        tipo: { type: String, enum: ['casa', 'apartamento', 'quarto', 'mansao', 'cobertura', 'terreno'] },
        endereco: {
            pais: String,
            cidade: String,
            regiao: String,
            rua: String,
            numero: String,
            cep: String
        },
        aluguel: { type: Boolean, default: true },
        valorAluguel: Number,
        valorCompra: Number,
        proprietario: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        metragem: Number,
        quartos: { type: Number, default: 1 },
        banheiros: { type: Number, default: 1 },
        vagasGaragem: { type: Number, default: 0 },
        moveis: [String],
        condominio: { type: Number, default: 0 },
        iptu: { type: Number, default: 0 },
        dataAquisicao: Date,
        dataUltimoPagamento: Date,
        ipvaPago: { type: Boolean, default: true }
    },
    
    // ==================== HISTÓRICO DE ONDE JÁ ESTEVE ====================
    historicoCidades: [{
        pais: String,
        cidade: String,
        primeiraVisita: Date,
        ultimaVisita: Date,
        totalVisitas: { type: Number, default: 1 },
        diasTotais: { type: Number, default: 0 }
    }],
    
    visitasRealizadas: [VisitaSchema],
    
    // ==================== VIAGENS ====================
    viagemAtiva: ViagemSchema,
    historicoViagens: [ViagemSchema],
    
    // ==================== TRANSPORTE ====================
    transportes: [TransportePessoalSchema],
    transporteAtivo: { type: mongoose.Schema.Types.ObjectId },
    
    // ==================== LOCALIZAÇÃO EM TEMPO REAL ====================
    ultimaAtualizacaoGPS: { type: Date, default: Date.now },
    coordenadas: {
        latitude: Number,
        longitude: Number,
        precisao: Number
    },
    
    // ==================== ESTATÍSTICAS ====================
    estatisticas: {
        paisesVisitados: { type: Number, default: 1 },
        cidadesVisitadas: { type: Number, default: 1 },
        kmPercorridos: { type: Number, default: 0 },
        viagensRealizadas: { type: Number, default: 0 },
        horasViajando: { type: Number, default: 0 },
        mudancasEndereco: { type: Number, default: 0 }
    },
    
    // ==================== PREFERÊNCIAS ====================
    preferencias: {
        climaPreferido: { type: String, enum: ['frio', 'temperado', 'quente', 'tropical'] },
        cidadeDosSonhos: String,
        paisDosSonhos: String,
        evitarViagensLongas: { type: Boolean, default: false }
    }
});

// ==================== MÉTODOS ====================

// Move o personagem para um novo local
LocalizacaoSchema.methods.moverPara = async function(pais, cidade, endereco = null) {
    const paisAnterior = this.paisAtual;
    const cidadeAnterior = this.cidadeAtual;
    
    // Atualiza local atual
    this.paisAtual = pais;
    this.cidadeAtual = cidade;
    if (endereco) this.enderecoAtual = endereco;
    this.ultimaAtualizacaoGPS = new Date();
    
    // Atualiza histórico de cidades
    const cidadeExistente = this.historicoCidades.find(
        c => c.pais === pais && c.cidade === cidade
    );
    
    if (cidadeExistente) {
        cidadeExistente.ultimaVisita = new Date();
        cidadeExistente.totalVisitas += 1;
    } else {
        this.historicoCidades.push({
            pais: pais,
            cidade: cidade,
            primeiraVisita: new Date(),
            ultimaVisita: new Date(),
            totalVisitas: 1
        });
        this.estatisticas.cidadesVisitadas += 1;
    }
    
    // Se mudou de país
    if (paisAnterior !== pais) {
        this.estatisticas.paisesVisitados += 1;
    }
    
    return {
        sucesso: true,
        pais: pais,
        cidade: cidade,
        paisMudou: paisAnterior !== pais
    };
};

// Iniciar uma viagem
LocalizacaoSchema.methods.iniciarViagem = async function(destinoPais, destinoCidade, meioTransporte, custo = 0) {
    // Verifica se tem viagem ativa
    if (this.viagemAtiva && this.viagemAtiva.status === 'em_andamento') {
        return { sucesso: false, motivo: 'Já existe uma viagem em andamento' };
    }
    
    // Calcula distância aproximada (simplificado)
    const distancia = this.calcularDistanciaEstimada(this.paisAtual, destinoPais);
    const duracao = this.calcularDuracaoViagem(distancia, meioTransporte);
    
    this.viagemAtiva = {
        origem: {
            pais: this.paisAtual,
            cidade: this.cidadeAtual,
            local: this.localEspecifico
        },
        destino: {
            pais: destinoPais,
            cidade: destinoCidade
        },
        meioTransporte: meioTransporte,
        distanciaKm: distancia,
        duracaoHoras: duracao,
        custo: custo,
        dataPartida: new Date(),
        status: 'em_andamento'
    };
    
    return {
        sucesso: true,
        destino: `${destinoPais}/${destinoCidade}`,
        duracao: duracao,
        custo: custo
    };
};

// Concluir viagem
LocalizacaoSchema.methods.concluirViagem = async function() {
    if (!this.viagemAtiva || this.viagemAtiva.status !== 'em_andamento') {
        return { sucesso: false, motivo: 'Nenhuma viagem ativa' };
    }
    
    // Move para o destino
    await this.moverPara(
        this.viagemAtiva.destino.pais,
        this.viagemAtiva.destino.cidade
    );
    
    // Finaliza viagem
    this.viagemAtiva.dataChegada = new Date();
    this.viagemAtiva.status = 'concluida';
    
    // Adiciona ao histórico
    this.historicoViagens.push(this.viagemAtiva);
    
    // Atualiza estatísticas
    this.estatisticas.viagensRealizadas += 1;
    this.estatisticas.kmPercorridos += this.viagemAtiva.distanciaKm;
    this.estatisticas.horasViajando += this.viagemAtiva.duracaoHoras;
    
    const viagemConcluida = this.viagemAtiva;
    this.viagemAtiva = null;
    
    return {
        sucesso: true,
        destino: `${viagemConcluida.destino.pais}/${viagemConcluida.destino.cidade}`,
        duracao: viagemConcluida.duracaoHoras,
        distancia: viagemConcluida.distanciaKm
    };
};

// Calcular distância entre países (estimativa simples)
LocalizacaoSchema.methods.calcularDistanciaEstimada = function(paisOrigem, paisDestino) {
    // Mapa de coordenadas aproximadas
    const coordenadas = {
        brasil: { lat: -15.8, lon: -47.9 },
        estados_unidos: { lat: 38.9, lon: -77.0 },
        japao: { lat: 35.7, lon: 139.7 },
        franca: { lat: 48.9, lon: 2.3 },
        alemanha: { lat: 52.5, lon: 13.4 },
        italia: { lat: 41.9, lon: 12.5 },
        reino_unido: { lat: 51.5, lon: -0.1 },
        china: { lat: 39.9, lon: 116.4 },
        india: { lat: 28.6, lon: 77.2 },
        australia: { lat: -35.3, lon: 149.1 },
        canada: { lat: 45.4, lon: -75.7 },
        mexico: { lat: 19.4, lon: -99.1 },
        argentina: { lat: -34.6, lon: -58.4 },
        espanha: { lat: 40.4, lon: -3.7 },
        portugal: { lat: 38.7, lon: -9.1 }
    };
    
    const orig = coordenadas[paisOrigem] || coordenadas.brasil;
    const dest = coordenadas[paisDestino] || coordenadas.brasil;
    
    // Fórmula de Haversine simplificada
    const R = 6371; // Raio da Terra em km
    const dLat = (dest.lat - orig.lat) * Math.PI / 180;
    const dLon = (dest.lon - orig.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(orig.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
};

// Calcular duração da viagem baseado no meio de transporte
LocalizacaoSchema.methods.calcularDuracaoViagem = function(distanciaKm, meioTransporte) {
    const velocidades = {
        'pe': 5,        // km/h
        'bicicleta': 15,
        'carro': 80,
        'onibus': 70,
        'trem': 90,
        'aviao': 800,
        'navio': 50,
        'moto': 70,
        'metro': 40,
        'taxi': 60
    };
    
    const velocidade = velocidades[meioTransporte] || 50;
    let horas = distanciaKm / velocidade;
    
    // Adiciona tempo de embarque/desembarque
    if (meioTransporte === 'aviao') horas += 3;
    if (meioTransporte === 'navio') horas += 2;
    if (meioTransporte === 'trem') horas += 1;
    
    return Math.round(horas * 10) / 10;
};

// Registrar visita a um estabelecimento
LocalizacaoSchema.methods.registrarVisita = function(estabelecimento, tipo) {
    this.visitasRealizadas.push({
        local: {
            pais: this.paisAtual,
            cidade: this.cidadeAtual,
            estabelecimento: estabelecimento
        },
        tipo: tipo,
        dataInicio: new Date()
    });
    
    return { sucesso: true, visita: this.visitasRealizadas[this.visitasRealizadas.length - 1] };
};

// Finalizar visita atual
LocalizacaoSchema.methods.finalizarVisita = function(avaliacao, comentario = '') {
    const visitaAtual = this.visitasRealizadas[this.visitasRealizadas.length - 1];
    if (visitaAtual && !visitaAtual.dataFim) {
        visitaAtual.dataFim = new Date();
        visitaAtual.avaliacao = avaliacao;
        visitaAtual.comentario = comentario;
        
        // Calcula dias totais na cidade
        const cidade = this.historicoCidades.find(
            c => c.pais === this.paisAtual && c.cidade === this.cidadeAtual
        );
        if (cidade) {
            const dias = Math.ceil((new Date() - cidade.primeiraVisita) / (1000 * 60 * 60 * 24));
            cidade.diasTotais = dias;
        }
        
        return { sucesso: true, visita: visitaAtual };
    }
    
    return { sucesso: false, motivo: 'Nenhuma visita ativa' };
};

// Obter transporte pessoal
LocalizacaoSchema.methods.getTransporteAtivo = function() {
    if (!this.transporteAtivo) return null;
    return this.transportes.id(this.transporteAtivo);
};

// Usar transporte pessoal
LocalizacaoSchema.methods.usarTransporte = function(transporteId) {
    const transporte = this.transportes.id(transporteId);
    if (!transporte) return { sucesso: false, motivo: 'Transporte não encontrado' };
    
    if (transporte.condicao < 30) {
        return { sucesso: false, motivo: 'Transporte quebrado, precisa de manutenção' };
    }
    
    if (transporte.combustivel < 10 && transporte.tipo !== 'bicicleta') {
        return { sucesso: false, motivo: 'Sem combustível' };
    }
    
    this.transporteAtivo = transporteId;
    return { sucesso: true, transporte: transporte.modelo };
};

// Comprar passagem
LocalizacaoSchema.methods.comprarPassagem = function(destinoPais, destinoCidade, meioTransporte) {
    const distancia = this.calcularDistanciaEstimada(this.paisAtual, destinoPais);
    const precoBase = {
        'pe': 0,
        'bicicleta': 0,
        'carro': distancia * 0.5,
        'onibus': distancia * 0.3,
        'trem': distancia * 0.4,
        'aviao': distancia * 0.8,
        'navio': distancia * 0.6,
        'moto': distancia * 0.4,
        'taxi': distancia * 1.2
    };
    
    const custo = Math.round(precoBase[meioTransporte] || distancia * 0.5);
    
    return {
        destino: `${destinoPais}/${destinoCidade}`,
        meioTransporte: meioTransporte,
        distancia: distancia,
        duracao: this.calcularDuracaoViagem(distancia, meioTransporte),
        custo: custo
    };
};

// Mudar de casa
LocalizacaoSchema.methods.mudarResidencia = function(novaResidencia) {
    this.residencia = {
        ...novaResidencia,
        dataAquisicao: new Date()
    };
    
    this.estatisticas.mudancasEndereco += 1;
    
    return { sucesso: true, endereco: novaResidencia.endereco };
};

module.exports = LocalizacaoSchema;