const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        index: true // Busca ultra rápida para login
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    senha: { 
        type: String, 
        required: true 
    },
    dataCriacao: { type: Date, default: Date.now },
    personagens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }]
});

module.exports = mongoose.model('Account', AccountSchema);