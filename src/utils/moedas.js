// server/src/utils/moedas.js

// ==================== MAPA DE MOEDAS POR PAÍS ====================
// Baseado no countries.js
const moedasPorPais = {
    // Américas
    'brasil': { codigo: 'BRL', simbolo: 'R$', nome: 'Real Brasileiro' },
    'estados_unidos': { codigo: 'USD', simbolo: 'US$', nome: 'Dólar Americano' },
    'canada': { codigo: 'CAD', simbolo: 'CA$', nome: 'Dólar Canadense' },
    'mexico': { codigo: 'MXN', simbolo: 'MX$', nome: 'Peso Mexicano' },
    'argentina': { codigo: 'ARS', simbolo: 'AR$', nome: 'Peso Argentino' },
    'chile': { codigo: 'CLP', simbolo: 'CL$', nome: 'Peso Chileno' },
    'colombia': { codigo: 'COP', simbolo: 'CO$', nome: 'Peso Colombiano' },
    'cuba': { codigo: 'CUP', simbolo: 'CUP', nome: 'Peso Cubano' },
    'peru': { codigo: 'PEN', simbolo: 'S/', nome: 'Sol' },
    
    // Europa
    'franca': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'italia': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'espanha': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'alemanha': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'grecia': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'austria': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'portugal': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'paises_baixos': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'irlanda': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'belgica': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'croacia': { codigo: 'EUR', simbolo: '€', nome: 'Euro' },
    'reino_unido': { codigo: 'GBP', simbolo: '£', nome: 'Libra Esterlina' },
    'suica': { codigo: 'CHF', simbolo: 'CHF', nome: 'Franco Suíço' },
    'russia': { codigo: 'RUB', simbolo: '₽', nome: 'Rublo Russo' },
    'polonia': { codigo: 'PLN', simbolo: 'zł', nome: 'Zloty Polonês' },
    'republica_checa': { codigo: 'CZK', simbolo: 'Kč', nome: 'Coroa Tcheca' },
    'hungria': { codigo: 'HUF', simbolo: 'Ft', nome: 'Forint Húngaro' },
    'suecia': { codigo: 'SEK', simbolo: 'kr', nome: 'Coroa Sueca' },
    'noruega': { codigo: 'NOK', simbolo: 'kr', nome: 'Coroa Norueguesa' },
    'dinamarca': { codigo: 'DKK', simbolo: 'kr', nome: 'Coroa Dinamarquesa' },
    
    // Ásia
    'japao': { codigo: 'JPY', simbolo: '¥', nome: 'Iene Japonês' },
    'china': { codigo: 'CNY', simbolo: '¥', nome: 'Yuan Chinês' },
    'coreia_do_sul': { codigo: 'KRW', simbolo: '₩', nome: 'Won Sul-Coreano' },
    'india': { codigo: 'INR', simbolo: '₹', nome: 'Rúpia Indiana' },
    'turquia': { codigo: 'TRY', simbolo: '₺', nome: 'Lira Turca' },
    'tailandia': { codigo: 'THB', simbolo: '฿', nome: 'Baht Tailandês' },
    'indonesia': { codigo: 'IDR', simbolo: 'Rp', nome: 'Rupia Indonésia' },
    'malasia': { codigo: 'MYR', simbolo: 'RM', nome: 'Ringgit Malaio' },
    'filipinas': { codigo: 'PHP', simbolo: '₱', nome: 'Peso Filipino' },
    'vietna': { codigo: 'VND', simbolo: '₫', nome: 'Dong Vietnamita' },
    'singapura': { codigo: 'SGD', simbolo: 'S$', nome: 'Dólar de Singapura' },
    'israel': { codigo: 'ILS', simbolo: '₪', nome: 'Shekel Israelense' },
    'emirados_arabes': { codigo: 'AED', simbolo: 'AED', nome: 'Dirham dos Emirados' },
    
    // Oceania
    'australia': { codigo: 'AUD', simbolo: 'A$', nome: 'Dólar Australiano' },
    'nova_zelandia': { codigo: 'NZD', simbolo: 'NZ$', nome: 'Dólar Neo-Zelandês' },
    
    // África
    'egito': { codigo: 'EGP', simbolo: 'E£', nome: 'Libra Egípcia' },
    'africa_do_sul': { codigo: 'ZAR', simbolo: 'R', nome: 'Rand Sul-Africano' },
    'marrocos': { codigo: 'MAD', simbolo: 'MAD', nome: 'Dirham Marroquino' },
    'nigeria': { codigo: 'NGN', simbolo: '₦', nome: 'Naira Nigeriana' },
    'quenia': { codigo: 'KES', simbolo: 'KSh', nome: 'Shilling Queniano' },
    
    // Caribe
    'jamaica': { codigo: 'JMD', simbolo: 'J$', nome: 'Dólar Jamaicano' },
};

// ==================== TAXAS DE CÂMBIO (BASE USD) ====================
// Valores aproximados do mundo real
const taxasParaUSD = {
    'BRL': 0.20,    // 1 USD = 5.00 BRL
    'USD': 1.00,    // 1 USD = 1.00 USD
    'EUR': 1.09,    // 1 USD = 0.92 EUR (invertido: 1 EUR = 1.09 USD)
    'GBP': 1.27,    // 1 USD = 0.79 GBP
    'JPY': 150.0,   // 1 USD = 150.00 JPY
    'CNY': 7.20,    // 1 USD = 7.20 CNY
    'INR': 83.0,    // 1 USD = 83.00 INR
    'CAD': 1.37,    // 1 USD = 1.37 CAD
    'MXN': 17.0,    // 1 USD = 17.00 MXN
    'AUD': 1.52,    // 1 USD = 1.52 AUD
    'TRY': 32.0,    // 1 USD = 32.00 TRY
    'CHF': 0.91,    // 1 USD = 0.91 CHF
    'THB': 36.5,    // 1 USD = 36.50 THB
    'ZAR': 18.5,    // 1 USD = 18.50 ZAR
    'ARS': 870,     // 1 USD = 870.00 ARS
    'MYR': 4.75,    // 1 USD = 4.75 MYR
    'KRW': 1370,    // 1 USD = 1370.00 KRW
    'RUB': 92,      // 1 USD = 92.00 RUB
    'AED': 3.67,    // 1 USD = 3.67 AED
    'ILS': 3.70,    // 1 USD = 3.70 ILS
    'MAD': 10.0,    // 1 USD = 10.00 MAD
    'PEN': 3.75,    // 1 USD = 3.75 PEN
    'CLP': 950,     // 1 USD = 950.00 CLP
    'COP': 3900,    // 1 USD = 3900.00 COP
    'IDR': 16000,   // 1 USD = 16000.00 IDR
    'PHP': 57.5,    // 1 USD = 57.50 PHP
    'VND': 25400,   // 1 USD = 25400.00 VND
    'SGD': 1.35,    // 1 USD = 1.35 SGD
    'NZD': 1.65,    // 1 USD = 1.65 NZD
    'SEK': 10.8,    // 1 USD = 10.80 SEK
    'NOK': 10.5,    // 1 USD = 10.50 NOK
    'DKK': 6.9,     // 1 USD = 6.90 DKK
    'PLN': 4.05,    // 1 USD = 4.05 PLN
    'CZK': 23.5,    // 1 USD = 23.50 CZK
    'HUF': 365,     // 1 USD = 365.00 HUF
    'EGP': 48,      // 1 USD = 48.00 EGP
    'CUP': 24.0,    // 1 USD = 24.00 CUP
    'JMD': 155,     // 1 USD = 155.00 JMD
    'NGN': 1500,    // 1 USD = 1500.00 NGN
    'KES': 130,     // 1 USD = 130.00 KES
};

// ==================== FUNÇÕES ====================

/**
 * Obtém a moeda de um país pelo seu ID
 * @param {string} paisId - ID do país (ex: 'brasil', 'estados_unidos')
 * @returns {object} Moeda com codigo, simbolo e nome
 */
function getMoedaPorPais(paisId) {
    const moeda = moedasPorPais[paisId?.toLowerCase()];
    if (!moeda) {
        console.warn(`[MOEDAS] País não encontrado: ${paisId}, usando BRL como fallback`);
        return moedasPorPais['brasil'];
    }
    return moeda;
}

/**
 * Obtém o símbolo da moeda de um país
 * @param {string} paisId - ID do país
 * @returns {string} Símbolo da moeda (ex: 'R$', 'US$', '€')
 */
function getSimboloMoeda(paisId) {
    return getMoedaPorPais(paisId).simbolo;
}

/**
 * Converte um valor de uma moeda para outra
 * @param {number} valor - Valor a ser convertido
 * @param {string} dePaisId - País de origem
 * @param {string} paraPaisId - País de destino
 * @returns {number} Valor convertido (arredondado para inteiro)
 */
function converterMoeda(valor, dePaisId, paraPaisId) {
    if (valor === 0) return 0;
    
    const moedaDe = getMoedaPorPais(dePaisId);
    const moedaPara = getMoedaPorPais(paraPaisId);
    
    // Se for a mesma moeda, retorna o valor original
    if (moedaDe.codigo === moedaPara.codigo) {
        return Math.floor(valor);
    }
    
    // Pega as taxas
    const taxaDe = taxasParaUSD[moedaDe.codigo];
    const taxaPara = taxasParaUSD[moedaPara.codigo];
    
    if (!taxaDe || !taxaPara) {
        console.warn(`[MOEDAS] Taxa não encontrada: ${moedaDe.codigo} -> ${moedaPara.codigo}`);
        return Math.floor(valor);
    }
    
    // Converte: valor -> USD -> moeda destino
    const valorUSD = valor / taxaDe;
    const valorConvertido = valorUSD * taxaPara;
    
    return Math.floor(valorConvertido);
}

/**
 * Formata um valor com o símbolo da moeda
 * @param {number} valor - Valor a ser formatado
 * @param {string} paisId - País para obter o símbolo
 * @returns {string} Valor formatado (ex: "R$ 150")
 */
function formatarMoeda(valor, paisId) {
    const simbolo = getSimboloMoeda(paisId);
    return `${simbolo} ${valor}`;
}

module.exports = {
    getMoedaPorPais,
    getSimboloMoeda,
    converterMoeda,
    formatarMoeda,
    moedasPorPais,
    taxasParaUSD
};