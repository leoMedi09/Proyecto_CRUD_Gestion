import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [platos, setPlatos] = useState([])
  
  // Estados del formulario
  const [form, setForm] = useState({ 
    nombre: "", precio: "", categoria: "Comida", descripcion: "", disponible: true
  })
  const [archivo, setArchivo] = useState(null)
  
  // Estados para Edición
  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEditar, setIdEditar] = useState(null)

  // 1. CARGAR PLATOS AL INICIO
  useEffect(() => {
    fetch('http://127.0.0.1:5000/platos')
      .then(res => res.json())
      .then(data => setPlatos(data))
  }, [])

  // 2. FUNCIÓN ÚNICA PARA GUARDAR (CREAR O EDITAR)
  const guardarPlato = async (e) => {
    e.preventDefault()
    if(!form.nombre || !form.precio) return alert("Por favor llena nombre y precio")
      

    // Usamos FormData para poder enviar archivos + texto
    const datos = new FormData()
    datos.append('nombre', form.nombre)
    datos.append('precio', form.precio)
    datos.append('categoria', form.categoria)
    datos.append('descripcion', form.descripcion)
    datos.append('disponible', form.disponible)
    
    // Solo agregamos la imagen si el usuario seleccionó una nueva
    if (archivo) {
      datos.append('imagen', archivo)
    }

    try {
      if (modoEdicion) {
        // --- MODO EDITAR (PUT) ---
        const res = await fetch(`http://127.0.0.1:5000/platos/${idEditar}`, {
          method: 'PUT',
          body: datos
        })
        const platoActualizado = await res.json()
        
        // Actualizamos la lista visualmente sin recargar
        setPlatos(platos.map(p => p.id === idEditar ? platoActualizado : p))
        alert("¡Plato actualizado con éxito!")
        cancelarEdicion()

      } else {
        // --- MODO CREAR (POST) ---
        const res = await fetch('http://127.0.0.1:5000/platos', {
          method: 'POST',
          body: datos 
        })
        const nuevo = await res.json()
        setPlatos([...platos, nuevo]) 
        limpiarFormulario()
      }
    } catch (error) {
      console.error("Error al guardar:", error)
      alert("Ocurrió un error al conectar con el servidor")
    }
  }

  // 3. FUNCIONES AUXILIARES
  const llenarFormularioEditar = (plato) => {
    setModoEdicion(true)
    setIdEditar(plato.id)
    setForm({
      nombre: plato.nombre,
      precio: plato.precio,
      categoria: plato.categoria,
      descripcion: plato.descripcion || "",
      disponible: plato.disponible
    })
    setArchivo(null) // Reseteamos archivo (el backend mantiene el viejo si no enviamos nada)
    
    // Scroll suave hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setModoEdicion(false)
    setIdEditar(null)
    limpiarFormulario()
  }

  const limpiarFormulario = () => {
    setForm({ nombre: "", precio: "", categoria: "Comida", descripcion: "", disponible: true })
    setArchivo(null)
    // Limpiamos el input de archivo visualmente
    const fileInput = document.getElementById('fileInput')
    if(fileInput) fileInput.value = ""
  }

  const eliminar = async (id) => {
    if(!window.confirm("¿Seguro que quieres eliminar este plato?")) return
    try {
        await fetch(`http://127.0.0.1:5000/platos/${id}`, { method: 'DELETE' })
        setPlatos(platos.filter(p => p.id !== id))
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <div className="container">
      <h1>👨‍🍳 Gestor de Restaurante Pro</h1>
      
      {/* --- FORMULARIO --- */}
      <form onSubmit={guardarPlato} className="card">
        <h2>
          {modoEdicion ? "✏️ Editando Plato" : "✨ Nuevo Plato"}
        </h2>

        <input 
            type="text" 
            placeholder="Nombre del plato" 
            value={form.nombre}
            onChange={e => {
              const valor = e.target.value
              
              if (valor === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(valor)) {
                setForm({...form, nombre: valor})
              }
             
            }}  
        />
        
        <input 
            type="number" 
            placeholder="Precio (S/.)" 
            value={form.precio}
            onChange={e => setForm({...form, precio: e.target.value})} 
        />

        <div style={{gridColumn: '1 / -1'}}>
            <label style={{display:'block', marginBottom:'10px', color:'#94a3b8'}}>
              {modoEdicion ? "Cambiar Foto (Opcional):" : "Foto del Plato:"}
            </label>
            <input 
                id="fileInput" 
                type="file" 
                accept="image/*"
                onChange={e => setArchivo(e.target.files[0])} 
            />
        </div>

        <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
            <option>Comida</option>
            <option>Bebida</option>
            <option>Postre</option>
        </select>

        <textarea 
            className="full-width" 
            placeholder="Descripción e ingredientes..." 
            value={form.descripcion}
            onChange={e => setForm({...form, descripcion: e.target.value})} 
        />

        <div className="form-footer">
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={form.disponible}
                    onChange={e => setForm({...form, disponible: e.target.checked})} 
                />
                ¿Disponible?
            </label>
            
            <div style={{display:'flex', gap:'15px'}}>
              {modoEdicion && (
                <button type="button" onClick={cancelarEdicion} className="btn-cancel">
                  Cancelar
                </button>
              )}
              <button type="submit">
                {modoEdicion ? "Actualizar Plato" : "Guardar Plato"}
              </button>
            </div>
        </div>
      </form>

      {/* --- LISTA DE PLATOS (DISEÑO WIDE) --- */}
      <div className="lista">
        {platos.map(plato => (
          <div key={plato.id} className="plato-card" style={{opacity: plato.disponible ? 1 : 0.6}}>
            
            {/* 1. IMAGEN */}
            {plato.imagen ? (
                <img src={plato.imagen} alt={plato.nombre} className="plato-img" />
            ) : (
                <div className="no-img">Sin Foto</div>
            )}

            {/* 2. INFORMACIÓN CENTRAL */}
            <div className="plato-info">
                <div className="plato-header">
                    <h3>{plato.nombre}</h3>
                    <span className="precio">S/. {plato.precio}</span>
                </div>
                
                <p className="desc">{plato.descripcion}</p>
                
                <div className="tags">
                    <span className="badge">{plato.categoria}</span>
                    {!plato.disponible && <span className="agotado">🚫 Agotado</span>}
                </div>
            </div>

            {/* 3. BOTONES A LA DERECHA */}
            <div className="acciones">
                <button onClick={() => llenarFormularioEditar(plato)} className="btn-edit">
                    ✏️ Modificar
                </button>
                <button onClick={() => eliminar(plato.id)} className="btn-delete">
                    🗑️ Eliminar
                </button>
            </div>
          </div>
        ))}
        
        {platos.length === 0 && (
            <p style={{textAlign:'center', marginTop:'30px', color: '#666', fontSize: '1.2rem'}}>
                No hay platos registrados aún. ¡Agrega el primero!
            </p>
        )}
      </div>
    </div>
  )
}

export default App