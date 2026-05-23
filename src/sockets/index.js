const { configurarAuthSocket } = require('./authSocket');
const { configurarPlayerSocket } = require('./playerSocket');
const { configurarNecessidadesSocket } = require('./necessidadesSocket');
const { configurarSaudeSocket } = require('./saudeSocket');
const { configurarIdiomasSocket } = require('./idiomasSocket');
const { configurarLocalizacaoSocket } = require('./localizacaoSocket');
const { configurarEconomiaSocket } = require('./economiaSocket');
const { configurarSocialSocket } = require('./socialSocket');
const { configurarInventarioSocket } = require('./inventarioSocket');
const { configurarFaceclaimSocket } = require('./faceclaimSocket');

function configurarTodosSockets(io, socket, context) {
    configurarAuthSocket(io, socket, context);
    configurarPlayerSocket(io, socket, context);
    configurarNecessidadesSocket(io, socket);
    configurarSaudeSocket(io, socket);
    configurarIdiomasSocket(io, socket);
    configurarLocalizacaoSocket(io, socket);
    configurarEconomiaSocket(io, socket);
    configurarSocialSocket(io, socket);
    configurarInventarioSocket(io, socket);
    configurarFaceclaimSocket(io, socket, context);
}

module.exports = { configurarTodosSockets };