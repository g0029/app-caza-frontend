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

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const resultadoBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(resultadoBase64);
    };
  });
}

const COTOS = ["Coto Nuevo", "Coto Viejo"];

const STATUS_STYLE = {
  DISPONIBLE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ASIGNADO: "bg-amber-50 text-amber-800 ring-amber-200",
  USADO: "bg-slate-50 text-slate-800 ring-slate-200"
};

const initialDb = {
  usuarios: [
    { usuario: "ana", password: "123", rol: "admin", bloqueado: false },
    { usuario: "juan", password: "123", rol: "cazador", bloqueado: false },
    { usuario: "admin", password: "admin", rol: "admin", bloqueado: false }
  ],
  precintos: [
    { numero: "P-2025-001", especie: "Corzo", tipo: "Macho", estado: "DISPONIBLE", coto: "Coto Nuevo" },
    { numero: "P-2025-002", especie: "Corzo", tipo: "Macho", estado: "DISPONIBLE", coto: "Coto Nuevo" },
    { numero: "P-2025-003", especie: "Jabalí", tipo: "Hembra", estado: "DISPONIBLE", coto: "Coto Viejo" }
  ],
  asignaciones: [],
  capturas: []
};

function Icon({ name, className = "h-5 w-5" }) {
  return React.createElement("i", { "data-lucide": name, className: className });
}

function ActionCard({ title, desc, icon, onClick, variant = "primary" }) {
  const bg = variant === "primary" ? "bg-forest-50 text-forest-700" : "bg-slate-100 text-slate-700";
  return React.createElement("button", {
    onClick: onClick,
    className: "flex w-full items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-soft"
  }, React.createElement("div", { className: `grid h-10 w-10 shrink-0 place-items-center rounded ${bg}` }, React.createElement(Icon, { name: icon })), React.createElement("div", null, React.createElement("h3", { className: "font-bold text-slate-900" }, title), React.createElement("p", { className: "mt-1 text-sm text-slate-500" }, desc)));
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

function UserArea({ user, db, setDb }) {
  const [view, setView] = useState("menu");
  const [selectedNum, setSelectedNum] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imagen, setImagen] = useState("");

  const misAsignaciones = useMemo(() => {
    return db.asignaciones.filter(a => a.usuario === user.usuario);
  }, [db.asignaciones, user.usuario]);

  const precintosDisponiblesParaCaptura = useMemo(() => {
    return misAsignaciones.filter(a => {
      const p = db.precintos.find(pr => pr.numero === a.numero);
      return p && p.estado === "ASIGNADO";
    });
  }, [misAsignaciones, db.precintos]);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fotoComprimida = await comprimirImagen(reader.result, 1024, 0.7);
      setImagen(fotoComprimida);
    };
    reader.readAsDataURL(file);
  }

  function registrarCaptura(e) {
    e.preventDefault();
    if (!selectedNum) return alert("Selecciona un precinto");

    const proximaCaptura = {
      numero: selectedNum,
      usuario: user.usuario,
      fecha: new Date().toLocaleString(),
      observaciones,
      imagen
    };

    const nextPrecintos = db.precintos.map(p => p.numero === selectedNum ? { ...p, estado: "USADO" } : p);
    const nextCapturas = [...db.capturas, proximaCaptura];

    setDb({ ...db, precintos: nextPrecintos, capturas: nextCapturas });
    alert("Captura registrada con éxito.");
    setView("menu");
    setSelectedNum("");
    setObservaciones("");
    setImagen("");
  }

  function salir() {
    localStorage.removeItem("usuario-sesion");
    window.location.reload();
  }

  return React.createElement("div", { className: "min-h-screen bg-slate-50 pb-12" }, 
    React.createElement("header", { className: "sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6" }, 
      React.createElement("div", { className: "mx-auto flex max-w-5xl items-center justify-between" }, 
        React.createElement("div", { className: "flex items-center gap-2 font-bold text-forest-900" }, 
          React.createElement(Icon, { name: "shield" }), "Portal Cazador"
        ), 
        React.createElement("div", { className: "flex items-center gap-3 text-sm font-semibold" }, 
          React.createElement("span", { className: "text-slate-700" }, "Hola, ", user.usuario), 
          React.createElement("button", { onClick: salir, className: "rounded bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" }, 
            React.createElement(Icon, { name: "log-out", className: "h-4 w-4" })
          )
        )
      )
    ), 
    React.createElement("main", { className: "mx-auto mt-6 max-w-md px-4" }, 
      view === "menu" && React.createElement("div", { className: "space-y-4" }, 
        React.createElement("h2", { className: "text-xl font-black text-slate-900" }, "Operaciones de campo"), 
        React.createElement(ActionCard, { title: "Registrar Captura", desc: "Declara una pieza abatida y vincula su foto", icon: "camera", onClick: () => setView("captura") }), 
        React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-soft" }, 
          React.createElement("h3", { className: "mb-3 font-bold text-slate-900" }, "Mis precintos asignados (", misAsignaciones.length, ")"), 
          misAsignaciones.length === 0 ? React.createElement("p", { className: "text-sm text-slate-500" }, "No tienes precintos asignados actualmente.") : React.createElement("div", { className: "divide-y divide-slate-100" }, misAsignaciones.map(a => {
            const p = db.precintos.find(pr => pr.numero === a.numero);
            return React.createElement("div", { key: a.numero, className: "flex items-center justify-between py-2.5 text-sm" }, React.createElement("div", null, React.createElement("p", { className: "font-bold text-slate-800" }, a.numero), React.createElement("p", { className: "text-xs text-slate-500" }, p?.especie, " · ", p?.tipo, " (", p?.coto, ")")), React.createElement("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[p?.estado || "DISPONIBLE"]}` }, p?.estado));
          }))
        )
      ), 
      view === "captura" && React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-soft" }, 
        React.createElement("div", { className: "mb-4 flex items-center justify-between" }, 
          React.createElement("h2", { className: "text-lg font-bold" }, "Nueva captura"), 
          React.createElement("button", { onClick: () => setView("menu"), className: "text-sm font-semibold text-forest-700 hover:underline" }, "Volver")
        ), 
        React.createElement("form", { onSubmit: registrarCaptura, className: "space-y-4" }, 
          React.createElement("label", { className: "block" }, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Selecciona el Precinto"), 
            React.createElement("select", {
              value: selectedNum,
              onChange: e => setSelectedNum(e.target.value),
              className: "mt-2 h-11 w-full rounded border border-slate-300 px-3 outline-none"
            }, 
              React.createElement("option", { value: "" }, "-- Seleccionar --"), 
              precintosDisponiblesParaCaptura.map(a => React.createElement("option", { key: a.numero, value: a.numero }, a.numero))
            )
          ), 
          React.createElement("label", { className: "block" }, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Fotografía de la pieza"), 
            React.createElement("input", { type: "file", accept: "image/*", onChange: handleImage, className: "mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded file:border-0 file:bg-forest-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-forest-700 hover:file:bg-forest-100" })
          ), 
          imagen && React.createElement("div", { className: "overflow-hidden rounded border" }, 
            React.createElement("img", { src: imagen, alt: "Previsualización", className: "max-h-48 w-full object-cover" })
          ), 
          React.createElement("label", { className: "block" }, 
            React.createElement("span", { className: "text-sm font-semibold" }, "Observaciones / Localización"), 
            React.createElement("textarea", {
              rows: 3,
              value: observaciones,
              onChange: e => setObservaciones(e.target.value),
              className: "mt-2 w-full rounded border border-slate-300 p-3 outline-none",
              placeholder: "Paraje, condiciones, etc."
            })
          ), 
          React.createElement("button", { className: "inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-forest-700 font-bold text-white hover:bg-forest-900" }, 
            React.createElement(Icon, { name: "check" }), "Confirmar y precintar"
          )
        )
      )
    )
  );
}

function AdminArea({ user, db, setDb }) {
  const [view, setView] = useState("dashboard");
  const [filterCoto, setFilterCoto] = useState("Todos");

  const [pNum, setPNum] = useState("");
  const [pEspecie, setPEspecie] = useState("Corzo");
  const [pTipo, setPTipo] = useState("Macho");
  const [pCoto, setPCoto] = useState(COTOS[0]);

  const [asigNum, setAsigNum] = useState("");
  const [asigUser, setAsigUser] = useState("");

  const precintosFiltrados = useMemo(() => {
    if (filterCoto === "Todos") return db.precintos;
    return db.precintos.filter(p => p.coto === filterCoto);
  }, [db.precintos, filterCoto]);

  function crearPrecinto(e) {
    e.preventDefault();
    if (!pNum) return alert("Indica número");
    if (db.precintos.some(p => p.numero === pNum)) return alert("El número ya existe");

    const nuevo = { numero: pNum, especie: pEspecie, tipo: pTipo, estado: "DISPONIBLE", coto: pCoto };
    setDb({ ...db, precintos: [...db.precintos, nuevo] });
    setPNum("");
    alert("Precinto creado.");
  }

  function asignarPrecinto(e) {
    e.preventDefault();
    if (!asigNum || !asigUser) return alert("Completa los datos");

    const nuevaAsig = { numero: asigNum, usuario: asigUser, fecha: new Date().toLocaleDateString() };
    const nextPrecintos = db.precintos.map(p => p.numero === asigNum ? { ...p, estado: "ASIGNADO" } : p);

    setDb({ ...db, precintos: nextPrecintos, asignaciones: [...db.asignaciones, nuevaAsig] });
    setAsigNum("");
    setAsigUser("");
    alert("Asignación completada.");
  }

  function conmutarBloqueo(username) {
    const nextUsuarios = db.usuarios.map(u => u.usuario === username ? { ...u, bloqueado: !u.bloqueado } : u);
    setDb({ ...db, usuarios: nextUsuarios });
  }

  function salir() {
    localStorage.removeItem("usuario-sesion");
    window.location.reload();
  }

  return React.createElement("div", { className: "min-h-screen bg-slate-50 pb-12" }, 
    React.createElement("header", { className: "sticky top-0 z-40 border-b border-slate-200 bg-forest-900 px-4 py-3 text-white shadow-sm sm:px-6" }, 
      React.createElement("div", { className: "mx-auto flex max-w-6xl items-center justify-between" }, 
        React.createElement("div", { className: "flex items-center gap-2 font-bold" }, 
          React.createElement(Icon, { name: "shield-alert" }), "Panel de Control Administrativo"
        ), 
        React.createElement("div", { className: "flex items-center gap-4 text-sm font-semibold" }, 
          React.createElement("nav", { className: "hidden gap-3 md:flex" }, 
            React.createElement("button", { onClick: () => setView("dashboard"), className: `rounded px-3 py-1.5 ${view === "dashboard" ? "bg-white/15" : "hover:bg-white/10"}` }, "Inventario"), 
            React.createElement("button", { onClick: () => setView("gestion"), className: `rounded px-3 py-1.5 ${view === "gestion" ? "bg-white/15" : "hover:bg-white/10"}` }, "Acciones"), 
            React.createElement("button", { onClick: () => setView("usuarios"), className: `rounded px-3 py-1.5 ${view === "usuarios" ? "bg-white/15" : "hover:bg-white/10"}` }, "Cazadores")
          ), 
          React.createElement("button", { onClick: salir, className: "rounded bg-white/10 p-2 hover:bg-white/20" }, 
            React.createElement(Icon, { name: "log-out", className: "h-4 w-4" })
          )
        )
      )
    ), 
    React.createElement("div", { className: "bg-white border-b border-slate-200 px-4 py-2 flex gap-2 md:hidden overflow-x-auto text-xs font-bold" }, 
      React.createElement("button", { onClick: () => setView("dashboard"), className: `px-3 py-2 rounded ${view === "dashboard" ? "bg-forest-100 text-forest-800" : "text-slate-600"}` }, "Inventario"), 
      React.createElement("button", { onClick: () => setView("gestion"), className: `px-3 py-2 rounded ${view === "gestion" ? "bg-forest-100 text-forest-800" : "text-slate-600"}` }, "Acciones"), 
      React.createElement("button", { onClick: () => setView("usuarios"), className: `px-3 py-2 rounded ${view === "usuarios" ? "bg-forest-100 text-forest-800" : "text-slate-600"}` }, "Cazadores")
    ), 
    React.createElement("main", { className: "mx-auto mt-6 max-w-6xl px-4" }, 
      view === "dashboard" && React.createElement("div", { className: "grid gap-6 lg:grid-cols-3" }, 
        React.createElement("section", { className: "lg:col-span-2 space-y-4" }, 
          React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2" }, 
            React.createElement("h2", { className: "text-xl font-black text-slate-900" }, "Precintos Registrados"), 
            React.createElement("select", {
              value: filterCoto,
              onChange: e => setFilterCoto(e.target.value),
              className: "h-9 rounded border border-slate-300 px-2 text-xs font-bold bg-white"
            }, 
              React.createElement("option", { value: "Todos" }, "Filtrar: Todos los cotos"), 
              COTOS.map(c => React.createElement("option", { key: c, value: c }, c))
            )
          ), 
          React.createElement("div", { className: "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft" }, 
            React.createElement("table", { className: "w-full border-collapse text-left text-sm" }, 
              React.createElement("thead", { className: "bg-slate-50 font-semibold text-slate-700 border-b border-slate-200" }, 
                React.createElement("tr", null, 
                  React.createElement("th", { className: "p-3" }, "Número"), 
                  React.createElement("th", { className: "p-3" }, "Detalles"), 
                  React.createElement("th", { className: "p-3" }, "Coto"), 
                  React.createElement("th", { className: "p-3" }, "Estado")
                )
              ), 
              React.createElement("tbody", { className: "divide-y divide-slate-100 font-medium text-slate-600" }, precintosFiltrados.map(p => React.createElement("tr", { key: p.numero, className: "hover:bg-slate-50/80" }, React.createElement("td", { className: "p-3 font-bold text-slate-900" }, p.numero), React.createElement("td", { className: "p-3 text-xs" }, p.especie, " · ", p.tipo), React.createElement("td", { className: "p-3 text-xs" }, p.coto), React.createElement("td", { className: "p-3" }, React.createElement("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[p.estado]}` }, p.estado)))))
            )
          )
        ), 
        React.createElement("section", { className: "space-y-4" }, 
          React.createElement("h2", { className: "text-xl font-black text-slate-900" }, "Capturas Recientes"), 
          db.capturas.length === 0 ? React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-soft" }, "Ninguna pieza registrada todavía.") : React.createElement("div", { className: "space-y-3" }, db.capturas.map((c, i) => React.createElement("div", { key: i, className: "rounded-lg border border-slate-200 bg-white p-4 shadow-soft text-sm" }, React.createElement("div", { className: "flex justify-between font-bold" }, React.createElement("span", { className: "text-forest-800" }, c.numero), React.createElement("span", { className: "text-slate-400 text-xs font-normal" }, c.fecha)), React.createElement("p", { className: "mt-1 font-semibold text-slate-700" }, "Abatido por: ", c.usuario), c.observaciones && React.createElement("p", { className: "mt-1.5 text-xs bg-slate-50 rounded p-2 text-slate-500 italic" }, c.observaciones), c.imagen && React.createElement("div", { className: "mt-3 overflow-hidden rounded border" }, c.imagen.startsWith('data:image') ? React.createElement("img", { src: c.imagen, className: "max-h-32 w-full object-cover" }) : React.createElement("div", { className: "bg-slate-100 p-3 text-center text-xs text-slate-500 font-semibold" }, c.imagen)))))
        )
      ), 
      view === "gestion" && React.createElement("div", { className: "grid gap-6 md:grid-cols-2" }, 
        React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-soft" }, 
          React.createElement("h2", { className: "mb-4 text-lg font-bold flex items-center gap-2 text-slate-900" }, 
            React.createElement(Icon, { name: "plus-circle", className: "text-forest-600" }), "Dar de alta precinto"
          ), 
          React.createElement("form", { onSubmit: crearPrecinto, className: "space-y-4" }, 
            React.createElement("label", { className: "block" }, React.createElement("span", { className: "text-sm font-semibold" }, "Número identificativo"), React.createElement("input", { value: pNum, onChange: e => setPNum(e.target.value), placeholder: "Ej: P-2025-XXX", className: "mt-2 h-10 w-full rounded border border-slate-300 px-3 outline-none" })), 
            React.createElement("div", { className: "grid grid-cols-2 gap-3" }, 
              React.createElement("label", { className: "block" }, React.createElement("span", { className: "text-sm font-semibold" }, "Especie"), React.createElement("select", { value: pEspecie, onChange: e => setPEspecie(e.target.value), className: "mt-2 h-10 w-full rounded border border-slate-300 px-2 outline-none" }, React.createElement("option", { value: "Corzo" }, "Corzo"), React.createElement("option", { value: "Jabalí" }, "Jabalí"), React.createElement("option", { value: "Ciervo" }, "Ciervo"))), 
              React.createElement("label", { className: "block" }, React.createElement("span", { className: "text-sm font-semibold" }, "Modalidad"), React.createElement("select", { value: pTipo, onChange: e => setPTipo(e.target.value), className: "mt-2 h-10 w-full rounded border border-slate-300 px-2 outline-none" }, React.createElement("option", { value: "Macho" }, "Macho"), React.createElement("option", { value: "Hembra" }, "Hembra"), React.createElement("option", { value: "Selectivo" }, "Selectivo")))
            ), 
            React.createElement("label", { className: "block" }, React.createElement("span", { className: "text-sm font-semibold" }, "Asignar a Coto"), React.createElement("select", { value: pCoto, onChange: e => setPCoto(e.target.value), className: "mt-2 h-10 w-full rounded border border-slate-300 px-3 outline-none" }, COTOS.map(c => React.createElement("option", { key: c, value: c }, c)))), 
            React.createElement("button", { className: "inline-flex h-11 w-full items-center justify-center rounded bg-forest-700 font-bold text-white hover:bg-forest-900" }, "Guardar en inventario")
          )
        ), 
        React.createElement("div", { className: "rounded-lg border border-slate-200 bg-white p-5 shadow-soft" }, 
          React.createElement("h2", { className: "mb-4 text-lg font-bold flex items-center gap-2 text-slate-900" }, 
            React.createElement(Icon, { name: "user-plus", className: "text-forest-600" }), "Asignar precinto a cazador"
          ), 
          React.createElement("form", { onSubmit: asignarPrecinto, className: "space-y-4" }, 
            React.createElement("label", { className: "block" }, 
              React.createElement("span", { className: "text-sm font-semibold" }, "Selecciona Precinto Disponible"), 
              React.createElement("select", { value: asigNum, onChange: e => setAsigNum(e.target.value), className: "mt-2 h-10 w-full rounded border border-slate-300 px-3 outline-none" }, 
                React.createElement("option", { value: "" }, "-- Elegir precinto --"), 
                db.precintos.filter(p => p.estado === "DISPNIBLE" || p.estado === "DISPONIBLE").map(p => React.createElement("option", { key: p.numero, value: p.numero }, p.numero, " (", p.especie, ")"))
              )
            ), 
            React.createElement("label", { className: "block" }, 
              React.createElement("span", { className: "text-sm font-semibold" }, "Selecciona Cazador"), 
              React.createElement("select", { value: asigUser, onChange: e => setAsigUser(e.target.value), className: "mt-2 h-10 w-full rounded border border-slate-300 px-3 outline-none" }, 
                React.createElement("option", { value: "" }, "-- Elegir usuario --"), 
                db.usuarios.filter(u => u.rol === "cazador").map(u => React.createElement("option", { key: u.usuario, value: u.usuario }, u.usuario))
              )
            ), 
            React.createElement("button", { className: "inline-flex h-11 w-full items-center justify-center rounded bg-forest-700 font-bold text-white hover:bg-forest-900" }, "Asignar tarjeta digital")
          )
        )
      ), 
      view === "usuarios" && React.createElement("div", { className: "space-y-4 max-w-2xl" }, 
        React.createElement("h2", { className: "text-xl font-black text-slate-900" }, "Cuentas autorizadas"), 
        React.createElement("div", { className: "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft" }, 
          React.createElement("div", { className: "divide-y divide-slate-100 font-medium text-sm text-slate-700" }, db.usuarios.map(u => React.createElement("div", { key: u.usuario, className: "flex items-center justify-between p-4 hover:bg-slate-50/50" }, React.createElement("div", null, React.createElement("p", { className: "font-bold text-slate-900" }, u.usuario), React.createElement("p", { className: "text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5" }, "Perfil: ", u.rol)), u.rol !== "admin" && React.createElement("button", {
            onClick: () => conmutarBloqueo(u.usuario),
            className: `inline-flex h-8 items-center rounded px-3 text-xs font-bold transition ${u.bloqueado ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
          }, u.bloqueado ? "Bloqueado" : "Activo"))))
        )
      )
    )
  );
}

function App() {
  const [db, setDbState] = useState(initialDb); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [loadingMessage, setLoadingMessage] = useState("Cargando la aplicación..."); 

  useEffect(() => {
    async function inicializarApp() {
      const usuarioGuardado = localStorage.getItem("usuario-sesion");
      if (usuarioGuardado) {
        setUser(JSON.parse(usuarioGuardado));
      }

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
    return React.createElement("main", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950 p-6 text-white text-center" },
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
