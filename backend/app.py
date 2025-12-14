from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE CARPETA DE IMÁGENES ---
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# --- CONFIGURACIÓN MYSQL ---
usuario = 'root'
clave = 'leomeflo09' # Tu clave está correcta aquí
servidor = 'localhost'
base_datos = 'restaurante_db'

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{usuario}:{clave}@{servidor}/{base_datos}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELO ---
class Plato(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    precio = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(50))
    descripcion = db.Column(db.Text, nullable=True)
    imagen = db.Column(db.String(500), nullable=True)
    disponible = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "precio": self.precio,
            "categoria": self.categoria,
            "descripcion": self.descripcion,
            "imagen": self.imagen,
            "disponible": self.disponible
        }

with app.app_context():
    db.create_all()

# --- RUTAS ---

# 1. MOSTRAR FOTOS
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 2. LEER PLATOS (GET)
@app.route('/platos', methods=['GET'])
def get_platos():
    platos = Plato.query.all()
    return jsonify([p.to_dict() for p in platos])

# 3. CREAR PLATO (POST)
@app.route('/platos', methods=['POST'])
def create_plato():
    nombre = request.form['nombre']
    precio = request.form['precio']
    categoria = request.form.get('categoria', 'General')
    descripcion = request.form.get('descripcion', '')
    disponible = request.form.get('disponible') == 'true'

    url_imagen = ""
    if 'imagen' in request.files:
        file = request.files['imagen']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            url_imagen = f"http://127.0.0.1:5000/uploads/{filename}"

    nuevo_plato = Plato(
        nombre=nombre,
        precio=precio,
        categoria=categoria,
        descripcion=descripcion,
        imagen=url_imagen,
        disponible=disponible
    )
    
    db.session.add(nuevo_plato)
    db.session.commit()
    return jsonify(nuevo_plato.to_dict())

# 4. ACTUALIZAR PLATO (PUT) - ¡ESTO DEBE IR ANTES DE APP.RUN!
@app.route('/platos/<int:id>', methods=['PUT'])
def update_plato(id):
    plato = Plato.query.get(id)
    if not plato:
        return jsonify({"error": "No encontrado"}), 404

    # Actualizar textos
    plato.nombre = request.form.get('nombre', plato.nombre)
    plato.precio = request.form.get('precio', plato.precio)
    plato.categoria = request.form.get('categoria', plato.categoria)
    plato.descripcion = request.form.get('descripcion', plato.descripcion)
    
    # Actualizar booleano
    disponible = request.form.get('disponible')
    if disponible:
        plato.disponible = disponible == 'true'

    # Actualizar imagen solo si viene una nueva
    if 'imagen' in request.files:
        file = request.files['imagen']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            plato.imagen = f"http://127.0.0.1:5000/uploads/{filename}"

    db.session.commit()
    return jsonify(plato.to_dict())

# 5. ELIMINAR (DELETE)
@app.route('/platos/<int:id>', methods=['DELETE'])
def delete_plato(id):
    plato = Plato.query.get(id)
    if plato:
        db.session.delete(plato)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"})
    return jsonify({"error": "No encontrado"}), 404

# --- EL INICIO DE LA APP DEBE IR SIEMPRE AL FINAL ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)