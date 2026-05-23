const mongoose = require('mongoose');
require('dotenv').config();

async function conectarBanco() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔋 Conexão via satélite estabelecida!");
    } catch (erro) {
        console.error("❌ Falha crítica:", erro);
        process.exit(1);
    }
}

module.exports = { conectarBanco };
