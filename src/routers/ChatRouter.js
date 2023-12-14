const express = require('express');
const router = express.Router();

module.exports = function (io, MessageDao) {
    router.get('/', async (req, res) => {
        try {
            const messages = await MessageDao.getMessages();
            res.render('chat', { messages });
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    io.on('connection', async (socket) => {
        console.log('Cliente conectado');

        socket.on('mensaje', async (datos) => {
            await MessageDao.addMessage(datos.emisor.correo, datos.mensaje);


            io.emit('nuevoMensaje', datos);
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado');
        });
    });

    return router;
};