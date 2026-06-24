import { useState, useEffect } from 'react'

// Conectar con el servidor usando el script global de Sockets inyectado en index.html
const socket = window.io ? window.io('http://localhost:4050') : null;

function App() {
  const [subastas, setSubastas] = useState([])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioMaximo, setPrecioMaximo] = useState('')
  
  // Datos simulados de negocio (Roles del ecosistema de subastas)
  const VENDEDOR_ID = 2 
  const COMPRADOR_ID = 1

  useEffect(() => {
    // 1. Obtener solicitudes de subasta iniciales guardadas en PostgreSQL
    fetch('http://localhost:4050/api/subastas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubastas(data)
        }
      })
      .catch(err => console.error("Error en HTTP GET:", err))

    // Validar si el socket global se inicializó correctamente
    if (socket) {
      // 2. Escuchar en tiempo real cuando otro usuario publica una nueva solicitud
      socket.on('nueva_subasta_creada', (nuevasSubastas) => {
        // Evitar duplicados si ya la agregamos localmente
        setSubastas(prev => {
          const idsExistentes = prev.map(s => s.id);
          const filtradas = nuevasSubastas.filter(n => !idsExistentes.includes(n.id));
          return [...filtradas, ...prev];
        })
      })

      // 3. Escuchar actualizaciones inmediatas cuando un vendedor ofrece menor precio
      socket.on('puja_actualizada', (data) => {
        setSubastas(prev => 
          prev.map(subasta => 
            subasta.id === parseInt(data.subasta_id) 
              ? { ...subasta, precio_actual: data.nuevo_precio } 
              : subasta
          )
        )
      })
    }

    // Desmontar escuchadores de eventos para evitar fugas de memoria
    return () => {
      if (socket) {
        socket.off('nueva_subasta_creada')
        socket.off('puja_actualizada')
      }
    }
  }, [])

  // Enviar el formulario del comprador a la API del Backend (PostgreSQL)
  const handleCrearSubasta = async (e) => {
    e.preventDefault()
    if (!titulo || !precioMaximo) return

    // CREACIÓN OPTIMISTA: Armamos la tarjeta local de inmediato para la pantalla
    const nuevaSubastaLocal = {
      id: Date.now(), // ID temporal basado en milisegundos
      titulo: titulo,
      descripcion: descripcion,
      precio_maximo_inicial: parseFloat(precioMaximo),
      precio_actual: parseFloat(precioMaximo)
    }

    // 1. Forzamos a React a pintar la tarjeta abajo al instante
    setSubastas(prev => [nuevaSubastaLocal, ...prev])

    // Limpiamos los campos del formulario de inmediato para dar fluidez visual
    setTitulo('')
    setDescripcion('')
    setPrecioMaximo('')

    // 2. Mandamos la petición real al Backend de fondo
    try {
      await fetch('http://localhost:4050/api/subastas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: nuevaSubastaLocal.titulo,
          descripcion: nuevaSubastaLocal.descripcion,
          precio_maximo_inicial: nuevaSubastaLocal.precio_maximo_inicial,
          comprador_id: COMPRADOR_ID
        })
      })
    } catch (err) {
      console.warn("Backend procesando datos, visualización local activa:", err)
    }
  }

  // Enviar oferta económica a la baja mediante canales Websockets (Tiempo Real)
  const handleOfertarMasBajo = (subastaId, precioActual) => {
    const ofertaStr = prompt(`El precio mínimo actual es $${precioActual}. Ingrese su oferta menor para competir:`)
    if (!ofertaStr) return

    const monto_ofertado = parseFloat(ofertaStr)
    
    // Validar regla de negocio de la subasta inversa
    if (monto_ofertado >= parseFloat(precioActual)) {
      alert("❌ En una subasta inversa tu oferta debe ser menor al precio actual.")
      return
    }

    // Actualización optimista local de la puja si el socket tarda en responder
    setSubastas(prev => 
      prev.map(subasta => 
        subasta.id === subastaId ? { ...subasta, precio_actual: monto_ofertado } : subasta
      )
    )

    if (socket) {
      socket.emit('enviar_puja', {
        subasta_id: subastaId,
        vendedor_id: VENDEDOR_ID,
        monto_ofertado: monto_ofertado
      })
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Plataforma de Subastas Inversas en Vivo 📉</h1>
      <p style={{ color: '#8d8d99' }}>Portafolio Técnico Full-Stack - SENATI</p>

      {/* Sección del Comprador (Ingreso de Datos HTTP POST) */}
      <div className="card">
        <h3>Crear Solicitud de Compra (Comprador)</h3>
        <form onSubmit={handleCrearSubasta} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="¿Qué deseas adquirir? (Ej: Servicio Web corporativo)" value={titulo} onChange={e => setTitulo(e.target.value)} />
          <textarea placeholder="Especificaciones y requerimientos técnicos" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          <input type="number" placeholder="Presupuesto Máximo Ajustado ($)" value={precioMaximo} onChange={e => setPrecioMaximo(e.target.value)} />
          <button type="submit">Publicar Subasta Inversa</button>
        </form>
      </div>

      {/* Sección del Vendedor (Ecosistema WebSockets interactivo) */}
      <h2>Subastas en Curso Efectuándose en Vivo</h2>
      {subastas.length === 0 ? <p>No hay subastas activas en este momento.</p> : (
        subastas.map(subasta => (
          <div key={subasta.id} className="card" style={{ borderLeft: '5px solid #00875f' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{subasta.titulo}</h3>
            <p style={{ color: '#c4c4cc', margin: '5px 0' }}>{subasta.descripcion}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <div>
                <span style={{ color: '#8d8d99' }}>Precio Tope Inicial: ${subasta.precio_maximo_inicial}</span>
                <br />
                <strong style={{ fontSize: '20px', color: '#00b37e' }}>Oferta Ganadora Actual: ${subasta.precio_actual}</strong>
              </div>
              <button onClick={() => handleOfertarMasBajo(subasta.id, subasta.precio_actual)} style={{ background: '#1a1a1e', border: '1px solid #00875f', color: '#00b37e' }}>
                👇 Pujar Más Bajo
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default App
