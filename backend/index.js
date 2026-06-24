import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

// Sockets en tiempo real activos
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Base de datos simulada en memoria (Para saltar bloqueos de PostgreSQL)
let subastasMemoria = [
  { id: 1, titulo: "Proyecto Base de Prueba", descripcion: "Subasta inicial simulada", precio_maximo_inicial: 1000.00, precio_actual: 1000.00 }
];

// Endpoint HTTP GET: Enviar las subastas guardadas
app.get('/api/subastas', (req, res) => {
    res.json(subastasMemoria);
});

// Endpoint HTTP POST: Guardar una nueva subasta
app.post('/api/subastas', (req, res) => {
    const { titulo, descripcion, precio_maximo_inicial } = req.body;
    
    const nuevaSubasta = {
        id: Date.now(),
        titulo,
        descripcion,
        precio_maximo_inicial: parseFloat(precioMaximo || precio_maximo_inicial),
        precio_actual: parseFloat(precioMaximo || precio_maximo_inicial)
    };
    
    subastasMemoria.unshift(nuevaSubasta);
    io.emit('nueva_subasta_creada', [nuevaSubasta]);
    res.status(201).json([nuevaSubasta]);
});

// Canal de WebSockets para las pujas en tiempo real
io.on('connection', (socket) => {
    console.log(`👤 Usuario conectado al canal de subastas: ${socket.id}`);

    socket.on('enviar_puja', (data) => {
        const { subasta_id, monto_ofertado } = data;
        
        subastasMemoria = subastasMemoria.map(subasta => {
            if (subasta.id === parseInt(subasta_id) && parseFloat(monto_ofertado) < subasta.precio_actual) {
                // Emitir la puja ganadora a todos en vivo
                io.emit('puja_actualizada', { subasta_id, nuevo_precio: monto_ofertado });
                return { ...subasta, precio_actual: parseFloat(monto_ofertado) };
            }
            return subasta;
        });
    });
});

// Forzamos el encendido en el puerto 4050
const PORT = 4050;
server.listen(PORT, () => {
    console.log(`🚀 Servidor de contingencia corriendo en http://localhost:${PORT}`);
});
