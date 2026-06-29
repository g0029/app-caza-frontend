const {
  useEffect,
  useMemo,
  useState
} = React;

// NUEVO: Función nativa para comprimir imágenes antes de enviarlas al servidor
function comprimirImagen(base64Str, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculamos las nuevas dimensiones manteniendo la proporción original
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Exportamos de nuevo a Base64 pero comprimido en formato JPEG (mucho más ligero que PNG)
      const resultadoBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(resultadoBase64);
    };
  });
}

// 1. CAMBIADO: Nuevos nombres de cotos
const COTOS = ["Coto Nuevo", "Coto Viejo"];

const STATUS_STYLE = {
  DISPONIBLE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ASIGNADO: "bg-amber-50 text-amber-800 ring-amber-200",
  USADO: "bg-slate-100 text-slate-700 ring-slate-200",
  BLOQUEADO: "bg-red-50 text-red-700 ring-red-200"
};

const initialDb = {
  usuarios: [{
    id: 1,
    nombre: "Ana Martín",
    usuario: "ana",
    password: "1234",
    rol: "cazador",
    bloqueado: false
  }, {
    id: 2,
    nombre: "Carlos Vega",
    usuario: "carlos",
    password: "1234",
    rol: "cazador",
    bloqueado: false
  }, {
    id: 3,
    nombre: "Admin Coto",
    usuario: "admin",
    password: "admin",
    rol: "admin",
    bloqueado: false
  }],
  precintos: Array.from({
    length: 18
  }, (_, index) => ({
    id: index + 1,
    numero_precinto: `PCD-${String(index + 1).padStart(5, "0")}`,
    estado: index < 2 ? "ASIGNADO" : index === 2 ? "USADO" : "DISPONIBLE",
    coto: index < 9 ? COTOS[0] : COTOS[1] 
  })),
  asignaciones: [{
    id: 1,
    usuario: 1,
    precinto: 1,
    coto: COTOS[0],
    paraje: "Barranco del Agua",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    estado: "ASIGNADO"
  }, {
    id: 2,
    usuario: 2,
    precinto: 2,
    coto: COTOS[1],
    paraje: "Umbría Alta",
    fecha: new Date(Date.now() - 43200000).toISOString(),
    estado: "ASIGNADO"
  }],
  capturas: [{
    id: 1,
    precinto: 3,
    usuario: 1,
    imagen: "",
    observaciones: "Registro de prueba",
    fecha: new Date(Date.now() - 172800000).toISOString(),
    coto: COTOS[0],
    paraje: "Las Lomas",
    estado: "USADO"
  }],
  logs: [{
    id: 1,
    accion: "Sistema inicializado",
    usuario: "admin",
    fecha: new Date(Date.now() - 172800000).toISOString()
  }],
  // MEJORA: Objeto global de configuración persistente para Supabase
  configuracion: {
    maximo_dias_mes: 10
  }
};

const ICON_PATHS = {
  "shield-check": ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z", "m9 12 2 2 4-5"],
  "log-out": ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  "fingerprint": ["M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10", "M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6", "M10 20c-1.7-2-2.5-4.4-2.5-7A4.5 4.5 0 0 1 12 8.5a4.5 4.5 0 0 1 4.5 4.5c0 2.6-.8 5-2.5 7", "M12 13v9"],
  "log-in": ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "m10 17 5-5-5-5", "M15 12H3"],
  "map-pin": ["M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z", "M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"],
  "map-pinned": ["M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z", "M9 3v15", "M15 6v15"],
  "badge-plus": ["M12 2 15 7l5 1-1 5 3 4-5 2-2 5-5-3-5 3-2-5-5-2 3-4-1-5 5-1 3-5Z", "M12 8v8", "M8 12h8"],
  "rotate-ccw": ["M3 12a9 9 0 1 0 3-6.7", "M3 4v6h6"],
  "camera": ["M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  "check-circle-2": ["M22 11.1V12a10 10 0 1 1-5.9-9.1", "m9 11 3 3L22 4"],
  send: ["m22 2-7 20-4-9-9-4 20-7Z", "M22 2 11 13"],
  "undo-2": ["M9 14 4 9l5-5", "M4 9h10a6 6 0 0 1 0 12h-1"],
  "image-plus": ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m21 9-3-3m0 0-3 3m3-3v8", "m21 15-3.1-3.1a2 2 0 0 0-2.8 0L7 20", "M9 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"],
  "file-check-2": ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6", "m9 15 2 2 4-4"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"],
  badge: ["M12 2 15 7l5 1-1 5 3 4-5 2-2 5-5-3-5 3-2-5-5-2 3-4-1-5 5-1 3-5Z"],
  database: ["M3 6c0-2 4-4 9-4s9 2 9 4-4 4-9 4-9-2-9-4Z", "M3 6v6c0 2 4 4 9 4s9-2 9-4V6", "M3 12v6c0 2 4 4 9 4s9-2 9-4v-6"],
  "bar-chart-3": ["M3 3v18h18", "M7 16v-5", "M12 16V7", "M17 16v-8"],
  download: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  archive: ["M21 8v13H3V8", "M1 3h22v5H1Z", "M10 12h4"]
};

function Icon({ name, className = "h-5 w-5" }) {
  const paths = ICON_PATHS[name] || ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"];
  return React.createElement("svg", {
    className: className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, paths.map((d, index) => React.createElement("path", { key: index, d: d })));
}

function Badge({ children, tone }) {
  return React.createElement("span", {
    className: `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLE[tone] || "bg-slate-100 text-slate-700 ring-slate-200"}`
  }, children);
}

function Shell({ user, onLogout, children }) {
  return React.createElement("main", { className: "min-h-screen" }, 
    React.createElement("header", { className: "sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur" }, 
      React.createElement("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" }, 
        React.createElement("div", { className: "flex items-center gap-3" }, 
          React.createElement("div", { className: "grid h-11 w-11 place-items-center rounded bg-forest-900 text-white" }, 
            React.createElement(Icon, { name: "shield-check", className: "h-6 w-6" })
          ), 
          React.createElement("div", null, 
            React.createElement("p", { className: "text-sm font-semibold text-forest-700" }, "Precinto Digital"), 
            React.createElement("h1", { className: "text-lg font-bold leading-tight" }, "Control cinegético")
          )
        ), 
        React.createElement("div", { className: "flex items-center gap-3" }, 
          React.createElement("div", { className: "hidden text-right sm:block" }, 
            React.createElement("p", { className: "text-sm font-semibold" }, user.nombre), 
            React.createElement("p", { className: "text-xs uppercase text-slate-500" }, user.rol)
          ), 
          React.createElement("button", {
            onClick: onLogout,
            className: "inline-flex h-10 items-center gap-2 rounded border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-50"
          }, React.createElement(Icon, { name: "log-out", className: "h-4 w-4" }), "Salir")
        )
      )
    ), 
    React.createElement("div", { className: "mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8" }, children)
  );
}

function Login({ db, onLogin }) {
  const [form, setForm] = useState({ usuario: "", password: "" });
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    
    const found = db.usuarios.find(u => u.usuario === form.usuario && u.password === form.password);
    
    if (!found) return setError("Credenciales incorrectas.");
    if (found.bloqueado) return setError("El acceso de este usuario está bloqueado.");
    
    localStorage.setItem("usuario-sesion", JSON.stringify(found));
    onLogin(found);
  }

  return React.createElement("main", { className: "grid min-h-screen bg-field lg:grid-cols-[1fr_480px]" }, 
    React.createElement("section", { className: "relative flex min-h-[42vh] items-end overflow-hidden bg-forest-900 p-6 text-white lg:min-h-screen lg:p-12" }, 
      React.createElement("img", {
        src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
        alt: "Bosque",
        className: "absolute inset-0 h-full w-full object-cover opacity-38"
      }), 
      React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/68 to-forest-900/20" }), 
      React.createElement("div", { className: "relative max-w-2xl pb-3" }, 
        React.createElement("p", { className: "mb-3 inline-flex items-center gap-2 rounded bg-white/12 px-3 py-1 text-sm font-semibold ring-1 ring-white/20" }, 
          React.createElement(Icon, { name: "map-pin", className: "h-4 w-4" }), "Uso en campo y administración"
        ), 
        React.createElement("h2", { className: "max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl" }, "Precinto Digital de Caza"), 
        React.createElement("p", { className: "mt-4 max-w-xl text-base text-white/82 sm:text-lg" }, "Asignación, devolución, captura y auditoría desde una interfaz rápida, trazable y preparada para móvil.")
      )
    ), 
    React.createElement("section", { className: "flex items-center justify-center px-4 py-8 sm:px-8" }, 
      React.createElement("form", { onSubmit: submit, className: "w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft" }, 
        React.createElement("div", { className: "mb-7" }, 
          React.createElement("div", { className: "mb-4 grid h-12 w-12 place-items-center rounded bg-forest-100 text-forest-700" }, 
            React.createElement(Icon, { name: "fingerprint", className: "h-7 w-7" })
          ), 
          React.createElement("h1", { className: "text-2xl font-bold" }, "Acceso seguro"), 
          React.createElement("p", { className: "mt-2 text-sm text-slate-600" }, "El rol se detecta automáticamente al iniciar sesión.")
        ), 
        React.createElement("label", { className: "mb-4 block" }, 
          React.createElement("span", { className: "text-sm font-semibold" }, "Usuario"), 
          React.createElement("input", {
            value: form.usuario,
            onChange: e => setForm({ ...form, usuario: e.target.value }),
            className: "mt-2 h-12 w-full rounded border border-slate-300 px-3 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100",
            autoComplete: "username"
          })
        ), 
        React.createElement("label", { className: "mb-3 block" }, 
          React.createElement("span", { className: "text-sm font-semibold" }, "Contraseña"), 
          React.createElement("input", {
            type: "password",
            value: form.password,
            onChange: e => setForm({ ...form, password: e.target.value }),
            className: "mt-2 h-12 w-full rounded border border-slate-300 px-3 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100",
            autoComplete: "current-password"
          })
        ), 
        error && React.createElement("p", { className: "mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" }, error), 
        React.createElement("div", { className: "mb-5 flex items-center justify-between text-sm" }, 
          React.createElement("button", { type: "button", className: "font-semibold text-forest-700 hover:underline" }, "Recuperar contraseña"), 
          React.createElement("span", { className: "text-slate-500" }, "ana/1234 · admin/admin")
        ), 
        React.createElement("button", { className: "inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-forest-700 px-4 font-bold text-white hover:bg-forest-900" }, 
          React.createElement(Icon, { name: "log-in" }), "Entrar"
        )
      )
    )
  );
}

function ActionCard({ icon, title, text, active, onClick }) {
  return React.createElement("button", {
    onClick: onClick,
    className: `min-h-[132px] rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${active ? "border-forest-600 bg-forest-50" : "border-slate-200 bg-white"}`
  }, 
    React.createElement("div", { className: "mb-4 flex items-center justify-between" }, 
      React.createElement("div", { className: `grid h-12 w-12 place-items-center rounded ${active ? "bg-forest-700 text-white" : "bg-slate-100 text-forest-700"}` }, 
        React.createElement(Icon, { name: icon, className: "h-6 w-6" })
      ), 
      active && React.createElement(Icon, { name: "check-circle-2", className: "h-5 w-5 text-forest-700" })
    ), 
    React.createElement("h3", { className: "text-lg font-bold" }, title), 
    React.createElement("p", { className: "mt-1 text-sm text-slate-600" }, text)
  );
}

function UserArea({ user, db, setDb }) {
  const [mode, setMode] = useState("recoger");
  const [message, setMessage] = useState(null);
  const [pickup, setPickup] = useState({ coto: COTOS[0], paraje: "" });
  const [returnNumber, setReturnNumber] = useState("");
  const [capture, setCapture] = useState({ numero: "", observaciones: "", imagen: "" });
  
  const myAssignments = db.asignaciones.filter(a => a.usuario === user.id && a.estado === "ASIGNADO");
  const latestAssignment = [...myAssignments].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
  const latestSeal = latestAssignment && db.precintos.find(p => p.id === latestAssignment.precinto);
  const occupiedParajes = db.asignaciones.filter(a => a.estado === "ASIGNADO" && a.usuario !== user.id && a.coto === pickup.coto).map(a => ({
    ...a,
    usuarioNombre: db.usuarios.find(u => u.id === a.usuario)?.nombre || "Otro cazador",
    precintoNumero: db.precintos.find(p => p.id === a.precinto)?.numero_precinto || ""
  }));

  // MEJORA: Calcular dinámicamente las salidas del cazador en el mes calendario actual
  const salidasEsteMes = useMemo(() => {
    const ahora = new Date();
    const mesActual = ahora.getMonth(); // 0 = Enero, 1 = Febrero...
    const anioActual = ahora.getFullYear();
    
    return db.asignaciones.filter(a => {
      if (a.usuario !== user.id) return false;
      const fechaAsignacion = new Date(a.fecha);
      return fechaAsignacion.getMonth() === mesActual && fechaAsignacion.getFullYear() === anioActual;
    }).length;
  }, [db.asignaciones, user.id]);

  const limiteMensual = db.configuracion?.maximo_dias_mes || 10;

  function salir() {
    localStorage.removeItem("usuario-sesion");
    window.location.reload();
  }

  function log(nextDb, accion) {
    return {
      ...nextDb,
      logs: [{
        id: Date.now(),
        accion,
        usuario: user.usuario,
        fecha: new Date().toISOString()
      }, ...nextDb.logs]
    };
  }

  function requestSeal(event) {
    event.preventDefault();
    if (!pickup.paraje.trim()) return setMessage({ type: "error", text: "El paraje es obligatorio por seguridad." });
    
    // CAMBIADO: Reemplazado el bloqueo de "1 activo" por la validación del cupo mensual dinámico de Supabase
    if (salidasEsteMes >= limiteMensual) {
      return setMessage({ 
        type: "error", 
        text: `No puedes solicitar más precintos. Has agotado tus ${limiteMensual} días/salidas de caza autorizadas para este mes calendario.` 
      });
    }
    
    const free = db.precintos.find(p => p.estado === "DISPONIBLE" && p.coto === pickup.coto);
    if (!free) return setMessage({ type: "error", text: `No quedan precintos disponibles para el ${pickup.coto}.` });
    
    const fecha = new Date().toISOString();
    const assignment = {
      id: Date.now(),
      usuario: user.id,
      precinto: free.id,
      coto: pickup.coto,
      paraje: pickup.paraje.trim(),
      fecha,
      estado: "ASIGNADO"
    };
    const next = {
      ...db,
      precintos: db.precintos.map(p => p.id === free.id ? { ...p, estado: "ASIGNADO" } : p),
      asignaciones: [assignment, ...db.asignaciones]
    };
    setDb(log(next, `Precinto ${free.numero_precinto} asignado a ${pickup.coto}`));
    setPickup({ coto: COTOS[0], paraje: "" });
    setReturnNumber(free.numero_precinto);
    setMessage({
      type: "success",
      text: `Precinto asignado: ${free.numero_precinto} (${free.coto})`,
      details: { ...assignment, numero: free.numero_precinto }
    });
  }

  function returnSeal(event) {
    event.preventDefault();
    const seal = db.precintos.find(p => p.numero_precinto.toUpperCase() === returnNumber.trim().toUpperCase());
    const assignment = seal && db.asignaciones.find(a => a.precinto === seal.id && a.usuario === user.id && a.estado === "ASIGNADO");
    if (!seal || !assignment) return setMessage({ type: "error", text: "Ese precinto no está asignado a tu usuario." });
    const next = {
      ...db,
      precintos: db.precintos.map(p => p.id === seal.id ? { ...p, estado: "DISPONIBLE" } : p),
      asignaciones: db.asignaciones.map(a => a.id === assignment.id ? { ...a, estado: "DEVUELTO" } : a)
    };
    setDb(log(next, `Precinto ${seal.numero_precinto} devuelto`));
    setReturnNumber("");
    setMessage({ type: "success", text: `Precinto ${seal.numero_precinto} disponible de nuevo.` });
  }

  async function handleImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const originalBase64 = reader.result;
      const base64Comprimida = await comprimirImagen(originalBase64, 1024, 0.7);
      setCapture(current => ({ ...current, imagen: base64Comprimida }));
    };
    reader.readAsDataURL(file);
  }

  function registerCapture(event) {
    event.preventDefault();
    const seal = db.precintos.find(p => p.numero_precinto.toUpperCase() === capture.numero.trim().toUpperCase());
    const assignment = seal && db.asignaciones.find(a => a.precinto === seal.id && a.usuario === user.id && a.estado === "ASIGNADO");
    if (!seal || !assignment) return setMessage({ type: "error", text: "Precinto no válido para registrar captura." });
    if (!capture.imagen) return setMessage({ type: "error", text: "La foto de la pieza es obligatoria." });
    const item = {
      id: Date.now(),
      precinto: seal.id,
      usuario: user.id,
      imagen: capture.imagen,
      observaciones: capture.observaciones,
      fecha: new Date().toISOString(),
      coto: assignment.coto,
      paraje: assignment.paraje,
      estado: "USADO"
    };
    const next = {
      ...db,
      precintos: db.precintos.map(p => p.id === seal.id ? { ...p, estado: "USADO" } : p),
      asignaciones: db.asignaciones.map(a => a.id === assignment.id ? { ...a, estado: "USADO" } : a),
      capturas: [item, ...db.capturas]
    };
    setDb(log(next, `Capture registrada con ${seal.numero_precinto}`));
    setCapture({ numero: "", observaciones: "", imagen: "" });
    setMessage({
      type: "success",
      text: `Justificante generado para ${seal.numero_precinto}.`,
      details: { ...item, numero: seal.numero_precinto }
    });
  }

  return React.createElement(Shell, { user: user, onLogout: salir }, 
    React.createElement("section", { className: "mb-6 flex flex-col justify-between gap-4 rounded-lg bg-forest-900 p-5 text-white sm:flex-row sm:items-center" }, 
      React.createElement("div", null, 
        React.createElement("p", { className: "text-sm font-semibold text-forest-100" }, "Área de Usuario"), 
        React.createElement("h2", { className: "text-2xl font-black" }, "Operativa en campo"),
        // MEJORA VISUAL: Texto informativo del estado del cupo mensual para el cazador
        React.createElement("p", { className: "text-xs font-semibold text-emerald-300 mt-1" }, 
          `Consumo de cupo: ${salidasEsteMes} de ${limiteMensual} días de caza utilizados este mes.`
        )
      ), 
      React.createElement("div", { className: "grid grid-cols-3 gap-2 text-center" }, 
        React.createElement(Metric, { label: "Disponibles", value: db.precintos.filter(p => p.estado === "DISPONIBLE").length, dark: true }), 
        React.createElement(Metric, { label: "Asignados", value: myAssignments.length, dark: true }), 
        React.createElement(Metric, { label: "Usados", value: db.capturas.filter(c => c.usuario === user.id).length, dark: true })
      )
    ), 
    React.createElement("div", { className: "grid gap-4 lg:grid-cols-3" }, 
      React.createElement(ActionCard, { icon: "badge-plus", title: "Recoger Precinto", text: "Asignación segura por coto y paraje.", active: mode === "recoger", onClick: () => setMode("recoger") }), 
      React.createElement(ActionCard, { icon: "rotate-ccw", title: "Devolver Precinto", text: "Recupera el stock si no se usa.", active: mode === "devolver", onClick: () => { setMode("devolver"); if (latestSeal) setReturnNumber(latestSeal.numero_precinto); } }), 
      React.createElement(ActionCard, { icon: "camera", title: "Registrar Captura", text: "Foto, observaciones y justificante.", active: mode === "captura", onClick: () => setMode("captura") })
    ), 
    message && React.createElement(Alert, { message: message, onClose: () => setMessage(null) }), 
    React.createElement("section", { className: "mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" }, 
      React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-sm" }, 
        mode === "recoger" && React.createElement("form", { onSubmit: requestSeal, className: "grid gap-4" }, 
          React.createElement("h3", { className: "text-xl font-bold" }, "Recoger precinto"), 
          React.createElement(Segmented, { options: COTOS, value: pickup.coto, onChange: coto => setPickup({ ...pickup, coto }) }), 
          React.createElement("label", null, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Paraje actual"), 
            React.createElement("input", {
              value: pickup.paraje,
              onChange: e => setPickup({ ...pickup, paraje: e.target.value }),
              placeholder: "Ej. Barranco del Agua",
              className: "mt-2 h-12 w-full rounded border border-slate-300 px-3 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
            })
          ), 
          React.createElement("div", { className: "rounded border border-slate-200 bg-slate-50 p-3" }, 
            React.createElement("div", { className: "mb-2 flex items-center gap-2 text-sm font-bold text-slate-700" }, 
              React.createElement(Icon, { name: "map-pinned", className: "h-4 w-4 text-forest-700" }), "Parajes ocupados en este coto"
            ), 
            occupiedParajes.length === 0 ? React.createElement("p", { className: "text-sm text-slate-500" }, "No hay parajes ocupados por otros cazadores.") : React.createElement("div", { className: "grid gap-2" }, 
              occupiedParajes.map(item => React.createElement("div", { key: item.id, className: "flex flex-col justify-between gap-1 rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 sm:flex-row sm:items-center" }, 
                React.createElement("span", { className: "font-semibold" }, item.paraje), 
                React.createElement("span", { className: "text-xs text-slate-500" }, item.usuarioNombre, " · ", item.precintoNumero)
              ))
            )
          ), 
          React.createElement("button", { className: "inline-flex h-12 items-center justify-center gap-2 rounded bg-forest-700 px-5 font-bold text-white hover:bg-forest-900" }, 
            React.createElement(Icon, { name: "send" }), " Solicitar Precinto"
          )
        ), 
        mode === "devolver" && React.createElement("form", { onSubmit: returnSeal, className: "grid gap-4" }, 
          React.createElement("h3", { className: "text-xl font-bold" }, "Devolver precinto"), 
          React.createElement("label", null, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Número de precinto"), 
            latestSeal && React.createElement("button", {
              type: "button",
              onClick: () => setReturnNumber(latestSeal.numero_precinto),
              className: "mt-2 flex w-full items-center justify-between rounded border border-forest-200 bg-forest-50 px-3 py-3 text-left text-sm hover:bg-forest-100"
            }, 
              React.createElement("span", null, React.createElement("strong", null, latestSeal.numero_precinto), React.createElement("span", { className: "mt-1 block text-slate-600" }, latestAssignment.coto, " · ", latestAssignment.paraje)), 
              React.createElement(Badge, { tone: latestSeal.estado }, latestSeal.estado)
            ), 
            React.createElement("input", {
              value: returnNumber,
              onChange: e => setReturnNumber(e.target.value),
              placeholder: "PCD-00001",
              className: "mt-2 h-12 w-full rounded border border-slate-300 px-3 uppercase outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
            })
          ), 
          React.createElement("button", { className: "inline-flex h-12 items-center justify-center gap-2 rounded bg-forest-700 px-5 font-bold text-white hover:bg-forest-900" }, 
            React.createElement(Icon, { name: "undo-2" }), " Devolver"
          )
        ), 
        mode === "captura" && React.createElement("form", { onSubmit: registerCapture, className: "grid gap-4" }, 
          React.createElement("h3", { className: "text-xl font-bold" }, "Registrar captura"), 
          React.createElement("label", null, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Número de precinto"), 
            React.createElement("input", {
              value: capture.numero,
              onChange: e => setCapture({ ...capture, numero: e.target.value }),
              placeholder: "PCD-00001",
              className: "mt-2 h-12 w-full rounded border border-slate-300 px-3 uppercase outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
            })
          ), 
          React.createElement("label", { className: "grid rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center" }, 
            React.createElement(Icon, { name: "image-plus", className: "mx-auto mb-2 h-7 w-7 text-forest-700" }), 
            React.createElement("span", { className: "text-sm font-semibold" }, "Subir foto de la pieza"), 
            React.createElement("input", { type: "file", accept: "image/*", onChange: e => handleImage(e.target.files[0]), className: "mt-3 text-sm" })
          ), 
          capture.imagen && React.createElement("img", { src: capture.imagen, alt: "Previsualización", className: "h-40 w-full rounded object-cover" }), 
          React.createElement("label", null, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Observaciones"), 
            React.createElement("textarea", {
              value: capture.observaciones,
              onChange: e => setCapture({ ...capture, observaciones: e.target.value }),
              rows: "3",
              className: "mt-2 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
            })
          ), 
          React.createElement("button", { className: "inline-flex h-12 items-center justify-center gap-2 rounded bg-forest-700 px-5 font-bold text-white hover:bg-forest-900" }, 
            React.createElement(Icon, { name: "file-check-2" }), " Generar justificante"
          )
        )
      ), 
      React.createElement("aside", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-sm" }, 
        React.createElement("h3", { className: "mb-4 text-lg font-bold" }, "Mis precintos activos"), 
        React.createElement("div", { className: "space-y-3" }, 
          myAssignments.length === 0 && React.createElement("p", { className: "text-sm text-slate-500" }, "No hay precintos asignados."), 
          myAssignments.map(a => {
            const seal = db.precintos.find(p => p.id === a.precinto);
            return React.createElement(SealRow, { key: a.id, seal: seal, assignment: a });
          })
        )
      )
    )
  );
}

function Alert({ message, onClose }) {
  return React.createElement("div", {
    className: `mt-5 rounded-lg border p-4 ${message.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`
  }, 
    React.createElement("div", { className: "flex items-start justify-between gap-4" }, 
      React.createElement("div", null, 
        React.createElement("p", { className: "font-bold" }, message.text), 
        message.details && React.createElement("dl", { className: "mt-3 grid gap-2 text-sm sm:grid-cols-2" }, 
          React.createElement(Info, { label: "Precinto", value: message.details.numero }), 
          React.createElement(Info, { label: "Fecha", value: formatDate(message.details.fecha) }), 
          React.createElement(Info, { label: "Coto", value: message.details.coto }), 
          React.createElement(Info, { label: "Paraje", value: message.details.paraje })
        )
      ), 
      React.createElement("button", {
        onClick: onClose,
        className: "grid h-8 w-8 place-items-center rounded hover:bg-white/70",
        "aria-label": "Cerrar"
      }, React.createElement(Icon, { name: "x", className: "h-4 w-4" }))
    )
  );
}

function AdminArea({ user, db, setDb }) {
  const [tab, setTab] = useState("usuarios");
  const [search, setSearch] = useState("");
  const [newSeal, setNewSeal] = useState("");
  const [newSealCoto, setNewSealCoto] = useState(COTOS[0]);
  const [newUser, setNewUser] = useState({ nombre: "", usuario: "", password: "", rol: "cazador" });
  
  const stats = useMemo(() => ({
    disponibles: db.precintos.filter(p => p.estado === "DISPONIBLE").length,
    asignados: db.precintos.filter(p => p.estado === "ASIGNADO").length,
    usados: db.precintos.filter(p => p.estado === "USADO").length,
    conectados: 4
  }), [db]);

  function salir() {
    localStorage.removeItem("usuario-sesion");
    window.location.reload();
  }

  function addLog(nextDb, accion) {
    return {
      ...nextDb,
      logs: [{
        id: Date.now(),
        accion,
        usuario: user.usuario,
        fecha: new Date().toISOString()
      }, ...nextDb.logs]
    };
  }

  // MEJORA: Modificar el valor del cupo mensual en la BD estructurada y empujarlo a Supabase mediante setDb
  function cambiarMaximoDiasMes(nuevoLimite) {
    const valorNumero = parseInt(nuevoLimite) || 1;
    const next = {
      ...db,
      configuracion: {
        ...db.configuracion,
        maximo_dias_mes: valorNumero
      }
    };
    setDb(addLog(next, `Límite de salidas/días mensuales actualizado a: ${valorNumero}`));
  }

  function createUser(event) {
    event.preventDefault();
    if (!newUser.nombre || !newUser.usuario || !newUser.password) return;
    const next = {
      ...db,
      usuarios: [{ id: Date.now(), ...newUser, bloqueado: false }, ...db.usuarios]
    };
    setDb(addLog(next, `Usuario ${newUser.usuario} creado`));
    setNewUser({ nombre: "", usuario: "", password: "", rol: "cazador" });
  }

  function toggleUser(id) {
    const target = db.usuarios.find(u => u.id === id);
    const next = {
      ...db,
      usuarios: db.usuarios.map(u => u.id === id ? { ...u, bloqueado: !u.bloqueado } : u)
    };
    setDb(addLog(next, `${target.bloqueado ? "Desbloqueado" : "Bloqueado"} ${target.usuario}`));
  }

 function createSeal(event) {
    event.preventDefault();
    if (!newSeal.trim()) return;
    
    // Validar si el número de precinto ya existe para evitar duplicados
    const existe = db.precintos.some(p => p.numero_precinto.toUpperCase() === newSeal.trim().toUpperCase());
    if (existe) {
      alert("Este número de precinto ya está registrado.");
      return;
    }

    const item = {
      id: Date.now(),
      numero_precinto: newSeal.trim().toUpperCase(),
      estado: "DISPONIBLE", 
      coto: newSealCoto
    };
    const next = { ...db, precintos: [item, ...db.precintos] };
    setDb(addLog(next, `Precinto ${item.numero_precinto} creado para ${item.coto}`));
    setNewSeal("");
  }

  function removeSeal(id) {
    const seal = db.precintos.find(p => p.id === id);
    if (!seal) return;

    // CONTROL DE SEGURIDAD: No permitir borrar precintos que ya se han usado o están asignados
    if (seal.estado !== "DISPONIBLE") {
      alert(`No se puede eliminar el precinto ${seal.numero_precinto} because su estado es ${seal.estado}.`);
      return;
    }

    const next = { ...db, precintos: db.precintos.filter(p => p.id !== id) };
    setDb(addLog(next, `Precinto ${seal.numero_precinto} eliminado`));
  }

  // FILTRADO SEGURO: Evita que la app se rompa si un precinto o usuario ha sido eliminado
  const filteredCaptures = db.capturas.filter(c => {
    const sealObj = db.precintos.find(p => p.id === c.precinto);
    const seal = sealObj ? sealObj.numero_precinto : "Precinto Eliminado";
    
    const ownerObj = db.usuarios.find(u => u.id === c.usuario);
    const owner = ownerObj ? ownerObj.nombre : "Usuario Eliminado";
    
    return `${seal} ${owner} ${c.coto} ${c.estado}`.toLowerCase().includes(search.toLowerCase());
  });

  return React.createElement(Shell, { user: user, onLogout: salir }, 
    React.createElement("section", { className: "mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" }, 
      React.createElement(Metric, { label: "Disponibles", value: stats.disponibles }), 
      React.createElement(Metric, { label: "Asignados", value: stats.asignados }), 
      React.createElement(Metric, { label: "Usados", value: stats.usados }), 
      React.createElement(Metric, { label: "Usuarios conectados", value: stats.conectados })
    ), 

    // MEJORA: Tarjeta/Panel de control global permanente para el Administrador para setear el cupo mensual
    React.createElement("div", { className: "mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-soft" },
      React.createElement("h3", { className: "text-sm font-bold text-amber-900" }, "⚙️ Configuración del Coto (Reglas de Temporada)"),
      React.createElement("div", { className: "mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center" },
        React.createElement("label", { className: "flex items-center gap-3 text-sm text-amber-950 font-semibold" },
          "Máximo de días / salidas permitidas por cazador al mes:",
          React.createElement("input", {
            type: "number",
            min: "1",
            value: db.configuracion?.maximo_dias_mes || 10,
            onChange: e => cambiarMaximoDiasMes(e.target.value),
            className: "h-9 w-24 rounded border border-amber-300 bg-white px-2 text-center font-bold text-slate-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100"
          })
        )
      )
    ),

    React.createElement("div", { className: "mb-5 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 scrollbar-thin" }, 
      [["usuarios", "users", "Usuarios"], ["precintos", "badge", "Precintos"], ["capturas", "camera", "Capturas"], ["datos", "database", "Base de datos"], ["estadisticas", "bar-chart-3", "Estadísticas"]].map(([key, icon, label]) => React.createElement("button", {
        key: key,
        onClick: () => setTab(key),
        className: `inline-flex h-10 shrink-0 items-center gap-2 rounded px-3 text-sm font-bold ${tab === key ? "bg-forest-700 text-white" : "text-slate-600 hover:bg-slate-100"}`
      }, React.createElement(Icon, { name: icon, className: "h-4 w-4" }), label))
    ), 
    tab === "usuarios" && React.createElement(Panel, { title: "Gestión de usuarios" }, 
      React.createElement("form", { onSubmit: createUser, className: "mb-5 grid gap-3 lg:grid-cols-[1fr_0.8fr_0.8fr_160px_140px]" }, 
        React.createElement(Input, { placeholder: "Nombre", value: newUser.nombre, onChange: v => setNewUser({ ...newUser, nombre: v }) }), 
        React.createElement(Input, { placeholder: "Usuario", value: newUser.usuario, onChange: v => setNewUser({ ...newUser, usuario: v }) }), 
        React.createElement(Input, { placeholder: "Contraseña", value: newUser.password, onChange: v => setNewUser({ ...newUser, password: v }) }), 
        React.createElement("select", {
          value: newUser.rol,
          onChange: e => setNewUser({ ...newUser, rol: e.target.value }),
          className: "h-11 rounded border border-slate-300 px-3"
        }, 
          React.createElement("option", { value: "cazador" }, "Cazador"), 
          React.createElement("option", { value: "admin" }, "Administrador")
        ), 
        React.createElement("button", { className: "rounded bg-forest-700 px-4 font-bold text-white" }, "Crear")
      ), 
      React.createElement(Table, { headers: ["Nombre", "Usuario", "Rol", "Estado", "Historial", "Acción"] }, 
        db.usuarios.map(u => React.createElement("tr", { key: u.id, className: "border-t border-slate-100" }, 
          React.createElement(Td, null, u.nombre), 
          React.createElement(Td, null, u.usuario), 
          React.createElement(Td, null, u.rol), 
          React.createElement(Td, null, React.createElement(Badge, { tone: u.bloqueado ? "BLOQUEADO" : "DISPONIBLE" }, u.bloqueado ? "BLOQUEADO" : "ACTIVO")), 
          React.createElement(Td, null, db.logs.filter(l => l.usuario === u.usuario).length, " eventos"), 
          React.createElement(Td, null, React.createElement("button", {
            onClick: () => toggleUser(u.id),
            className: "rounded border border-slate-200 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
          }, u.bloqueado ? "Desbloquear" : "Bloquear"))
        ))
      )
    ), 
    tab === "precintos" && React.createElement(Panel, { title: "Gestión de precintos" }, 
      React.createElement("form", { onSubmit: createSeal, className: "mb-5 flex flex-col gap-3 sm:flex-row" }, 
        React.createElement(Input, { placeholder: "Nuevo número de precinto", value: newSeal, onChange: setNewSeal }), 
        React.createElement("select", {
          value: newSealCoto,
          onChange: e => setNewSealCoto(e.target.value),
          className: "h-11 rounded border border-slate-300 px-3"
        }, COTOS.map(c => React.createElement("option", { key: c, value: c }, c))),
        React.createElement("button", { className: "h-11 rounded bg-forest-700 px-5 font-bold text-white" }, "Crear / reponer stock")
      ), 
      React.createElement(Table, { headers: ["Número", "Coto asignado", "Estado", "Asignación cazador", "Acción"] }, 
        db.precintos.map(p => {
          const assignment = db.asignaciones.find(a => a.precinto === p.id && a.estado === "ASIGNADO");
          return React.createElement("tr", { key: p.id, className: "border-t border-slate-100" }, 
            React.createElement(Td, null, p.numero_precinto), 
            React.createElement(Td, null, p.coto || "No especificado"), 
            React.createElement(Td, null, React.createElement(Badge, { tone: p.estado }, p.estado)), 
            React.createElement(Td, null, assignment ? `${assignment.coto} · ${assignment.paraje}` : "Sin asignación activa"), 
            React.createElement(Td, null, React.createElement("button", {
              onClick: () => removeSeal(p.id),
              className: "rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            }, "Eliminar"))
          );
        })
      )
    ), 
    tab === "capturas" && React.createElement(Panel, { title: "Gestión de capturas" }, 
      React.createElement("div", { className: "mb-4 max-w-md" }, 
        React.createElement(Input, { placeholder: "Buscar por usuario, precinto, coto o estado", value: search, onChange: setSearch })
      ), 
      React.createElement(Table, { headers: ["Usuario", "Precinto", "Foto", "Fecha", "Coto", "Estado"] }, 
        filteredCaptures.map(c => React.createElement("tr", { key: c.id, className: "border-t border-slate-100" }, 
          React.createElement(Td, null, db.usuarios.find(u => u.id === c.usuario)?.nombre), 
          React.createElement(Td, null, db.precintos.find(p => p.id === c.precinto)?.numero_precinto), 
          React.createElement(Td, null, c.imagen ? React.createElement("img", { src: c.imagen, className: "h-12 w-16 rounded object-cover" }) : React.createElement("span", { className: "text-slate-400" }, "Sin foto")), 
          React.createElement(Td, null, formatDate(c.fecha)), 
          React.createElement(Td, null, c.coto), 
          React.createElement(Td, null, React.createElement(Badge, { tone: c.estado }, c.estado))
        ))
      )
    ), 
    tab === "datos" && React.createElement(Panel, { title: "Base de datos" }, 
      React.createElement("div", { className: "mb-5 flex flex-wrap gap-2" }, 
        React.createElement(ExportButton, { label: "Exportar CSV", data: db }), 
        React.createElement("button", {
          onClick: () => alert("Copia automática programada cada 24 horas."),
          className: "inline-flex h-10 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"
        }, React.createElement(Icon, { name: "archive", className: "h-4 w-4" }), " Copias automáticas")
      ), 
      React.createElement("div", { className: "grid gap-4 lg:grid-cols-2" }, 
        ["usuarios", "precintos", "capturas", "logs", "configuracion"].map(key => React.createElement("div", { key: key, className: "rounded border border-slate-200 p-4" }, 
          React.createElement("h3", { className: "mb-2 font-bold capitalize" }, key), 
          React.createElement("pre", { className: "max-h-72 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100 scrollbar-thin" }, 
            JSON.stringify(db[key], null, 2)
          )
        ))
      )
    ), 
    tab === "estadisticas" && React.createElement(Panel, { title: "Estadísticas" }, 
      React.createElement("div", { className: "grid gap-5 lg:grid-cols-2" }, 
        React.createElement(Chart, {
          title: "Capturas por coto",
          rows: COTOS.map(coto => ({
            label: coto,
            value: db.capturas.filter(c => c.coto === coto).length
          }))
        }), 
        React.createElement(Chart, { title: "Uso diario", rows: dailyRows(db) }), 
        React.createElement(Chart, {
          title: "Precintos activos",
          rows: [{ label: "Asignados", value: stats.asignados }, { label: "Disponibles", value: stats.disponibles }, { label: "Usados", value: stats.usados }]
        }), 
        React.createElement("div", { className: "rounded border border-slate-200 p-4" }, 
          React.createElement("h3", { className: "mb-3 font-bold" }, "Últimas operaciones"), 
          React.createElement("div", { className: "space-y-2" }, 
            db.logs.slice(0, 6).map(l => React.createElement("p", { key: l.id, className: "rounded bg-slate-50 px-3 py-2 text-sm" }, 
              l.accion, " · ", formatDate(l.fecha)
            ))
          )
        )
      )
    )
  );
}

function Metric({ label, value, dark }) {
  return React.createElement("div", { className: `min-w-24 rounded p-3 ${dark ? "bg-white/10" : "border border-slate-200 bg-white shadow-sm"}` }, 
    React.createElement("p", { className: `text-xs font-semibold ${dark ? "text-white/70" : "text-slate-500"}` }, label), 
    React.createElement("p", { className: "text-2xl font-black" }, value)
  );
}

function Segmented({ options, value, onChange }) {
  return React.createElement("div", { className: "grid gap-2 sm:grid-cols-2" }, 
    options.map(option => React.createElement("button", {
      type: "button",
      key: option,
      onClick: () => onChange(option),
      className: `h-12 rounded border px-3 text-sm font-bold ${value === option ? "border-forest-700 bg-forest-700 text-white" : "border-slate-300 bg-white text-slate-700"}`
    }, option))
  );
}

function SealRow({ seal, assignment }) {
  return React.createElement("div", { className: "rounded border border-slate-200 p-3" }, 
    React.createElement("div", { className: "flex items-start justify-between gap-3" }, 
      React.createElement("div", null, 
        React.createElement("p", { className: "font-bold" }, seal.numero_precinto), 
        React.createElement("p", { className: "text-sm text-slate-500" }, assignment.coto)
      ), 
      React.createElement(Badge, { tone: seal.estado }, seal.estado)
    ), 
    React.createElement("p", { className: "mt-2 text-sm" }, assignment.paraje), 
    React.createElement("p", { className: "mt-1 text-xs text-slate-500" }, formatDate(assignment.fecha))
  );
}

function Panel({ title, children }) {
  return React.createElement("section", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-sm" }, 
    React.createElement("h2", { className: "mb-5 text-xl font-black" }, title), 
    children
  );
}

function Input({ value, onChange, placeholder }) {
  return React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    className: "h-11 w-full rounded border border-slate-300 px-3 outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100"
  });
}

function Table({ headers, children }) {
  return React.createElement("div", { className: "overflow-x-auto scrollbar-thin" }, 
    React.createElement("table", { className: "w-full min-w-[720px] text-left text-sm" }, 
      React.createElement("thead", null, 
        React.createElement("tr", { className: "bg-slate-50 text-xs uppercase text-slate-500" }, 
          headers.map(h => React.createElement("th", { key: h, className: "px-3 py-3 font-bold" }, h))
        )
      ), 
      React.createElement("tbody", null, children)
    )
  );
}

function Td({ children }) {
  return React.createElement("td", { className: "px-3 py-3 align-middle" }, children);
}

function Info({ label, value }) {
  return React.createElement("div", null, 
    React.createElement("dt", { className: "text-xs font-bold uppercase opacity-70" }, label), 
    React.createElement("dd", null, value || "—")
  );
}

function Chart({ title, rows }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return React.createElement("div", { className: "rounded border border-slate-200 p-4" }, 
    React.createElement("h3", { className: "mb-4 font-bold" }, title), 
    React.createElement("div", { className: "space-y-3" }, 
      rows.map(r => React.createElement("div", { key: r.label }, 
        React.createElement("div", { className: "mb-1 flex justify-between text-sm" }, 
          React.createElement("span", null, r.label), 
          React.createElement("strong", null, r.value)
        ), 
        React.createElement("div", { className: "h-3 rounded bg-slate-100" }, 
          React.createElement("div", {
            className: "h-3 rounded bg-forest-700",
            style: { width: `${(r.value / max) * 100}%` }
          })
        )
      ))
    )
  );
}

function ExportButton({ label, data }) {
  function exportCsv() {
    const rows = [["tabla", "id", "datos"]];
    Object.entries(data).forEach(([table, items]) => items.forEach(item => rows.push([table, item.id, JSON.stringify(item).replaceAll('"', '""')])));
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "precinto-digital.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return React.createElement("button", {
    onClick: exportCsv,
    className: "inline-flex h-10 items-center gap-2 rounded bg-forest-700 px-3 text-sm font-bold text-white"
  }, React.createElement(Icon, { name: "download", className: "h-4 w-4" }), " ", label);
}

function dailyRows(db) {
  const map = {};
  [...db.asignaciones, ...db.capturas].forEach(item => {
    const day = new Date(item.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    map[day] = (map[day] || 0) + 1;
  });
  return Object.entries(map).map(([label, value]) => ({ label, value })).slice(0, 5);
}

function formatDate(value) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function App() {
  const [db, setDbState] = useState(initialDb);
  
  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario-sesion");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Cargando la aplicación...");

  useEffect(() => {
    async function inicializarApp() {
      if (!navigator.onLine) {
        console.warn("📱 Iniciando en modo offline. Cargando copia local.");
        const local = localStorage.getItem("precinto-db");
        if (local) setDbState(JSON.parse(local));
        setLoading(false);
        return;
      }

      try {
        setLoadingMessage("Conectando con el servidor seguro de Render... 📡");
        
        const timerAviso = setTimeout(() => {
          setLoadingMessage("Despertando el servidor remoto... Esto puede tardar unos 40 segundos la primera vez ⏳");
        }, 3500);

        const respuesta = await fetch("https://sistema-caza-backend.onrender.com/api/db");
        clearTimeout(timerAviso);

        if (respuesta.ok) {
          const data = await respuesta.json();
          if (data && data.usuarios) {
            setDbState(data);
            console.log("✅ Conexión con el servidor completada con éxito.");
          }
        } else {
          throw new Error("Respuesta incorrecta del servidor");
        }
      } catch (error) {
        console.error("No se pudo conectar al servidor, usando respaldo local:", error);
        const local = localStorage.getItem("precinto-db");
        if (local) setDbState(JSON.parse(local));
      } finally {
        setLoading(false);
      }
    }

    inicializarApp();
  }, []);

  useEffect(() => {
    function comprobarYSubir() {
      console.log("🌐 ¡Conexión recuperada! Comprobando capturas pendientes...");
      const localData = localStorage.getItem("precinto-db");
      if (localData) {
        const parsedData = JSON.parse(localData);
        const tieneFotosPendientes = parsedData.capturas?.some(c => c.imagen && c.imagen.includes('data:image'));
        if (tieneFotosPendientes) {
          console.log("📤 Subiendo automáticamente las capturas acumuladas sin señal...");
          setDb(parsedData);
        }
      }
    }
    window.addEventListener('online', comprobarYSubir);
    return () => window.removeEventListener('online', comprobarYSubir);
  }, [db]);

  function setDb(next) {
    setDbState(next);

    if (!navigator.onLine) {
      console.warn("⚠️ Dispositivo offline. Conservando imagen en local hasta recuperar cobertura.");
      localStorage.setItem("precinto-db", JSON.stringify(next));
      return;
    }

    fetch("https://sistema-caza-backend.onrender.com/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(next)
    })
    .then(res => {
      if (!res.ok) {
        console.error("Error al guardar en el servidor remoto");
      } else {
        console.log("✅ Sincronizado con éxito en la base de datos");
        const dbOptimizada = { ...next };
        if (dbOptimizada.capturas && dbOptimizada.capturas.length > 0) {
          dbOptimizada.capturas = dbOptimizada.capturas.map(c => {
            if (c.imagen && c.imagen.includes('data:image')) {
              return { ...c, imagen: 'Guardada en Base de Datos 💾' };
            }
            return c;
          });
        }
        localStorage.setItem("precinto-db", JSON.stringify(dbOptimizada));
      }
    })
    .catch(err => {
      console.error("Fallo de red en el envío. Respaldando en el móvil:", err);
      localStorage.setItem("precinto-db", JSON.stringify(next));
    });
  }

  if (loading) {
    return React.createElement("main", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950 p-6 text-white text-center animate-fade-in" },
      React.createElement("div", { className: "mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/10 text-emerald-400" },
        React.createElement(Icon, { name: "shield-check", className: "h-12 w-12" })
      ),
      React.createElement("h2", { className: "text-2xl font-black tracking-tight" }, "Sistema Precinto Digital"),
      React.createElement("p", { className: "text-emerald-200/60 text-xs font-semibold uppercase tracking-wider mt-1" }, "Control Cinegético Profesional"),
      React.createElement("div", { className: "my-8 h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-white" }),
      React.createElement("p", { className: "max-w-xs text-sm font-medium text-emerald-100/90" }, loadingMessage)
    );
  }

  if (!user) return React.createElement(Login, { db: db, onLogin: setUser });
  
  return user.rol === "admin" 
    ? React.createElement(AdminArea, { user: user, db: db, setDb: setDb }) 
    : React.createElement(UserArea, { user: user, db: db, setDb: setDb });
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
