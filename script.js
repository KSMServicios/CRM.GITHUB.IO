document.addEventListener("DOMContentLoaded", function () {
  // --- REGISTRO DEL SERVICE WORKER ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado con éxito:", registration);
      })
      .catch((error) => {
        console.log("Error al registrar el Service Worker:", error);
      });
  }

  // --- VARIABLES GLOBALES DEL SCRIPT ---

  // Elementos del Reproductor de Radio
  const player = document.getElementById("radioPlayer");
  // ¡IMPORTANTE! Se elimina: const source = player.querySelector("source");
  const nombreEstacionDiv = document.getElementById("nombreEstacion");
  const logoEstacionImg = document.getElementById("logoEstacion");
  const playlist = document.getElementById("playlist");
  const addStationButton = document.getElementById("addStationBtn");
  const scrollLeftBtn = document.getElementById("scrollLeftBtn");
  const scrollRightBtn = document.getElementById("scrollRightBtn");
  let currentStationItem = null;

  function cambiarEstacion(url, nombre, listItem) {
    // 1. Asignar directamente la URL al reproductor
    // Esto es la forma más limpia y robusta para cambiar streams en JS.
    player.src = url;

    // 2. Intentar reproducir la nueva estación.
    // player.play() llama a load() automáticamente.
    player.play().catch((error) => {
      console.error(
        "La reproducción automática fue bloqueada por el navegador:",
        error
      );
      // Opcionalmente: Podrías mostrar un mensaje pidiendo al usuario que toque Play.
    });

    // Actualizar el nombre de la estación que se está escuchando
    nombreEstacionDiv.innerHTML = `<p>Estás escuchando: ${nombre}</p>`;

    // Actualizar el logo principal
    const stationLogo = listItem.querySelector("img");
    if (stationLogo) {
      logoEstacionImg.src = stationLogo.src;
      logoEstacionImg.alt = `Logo de ${nombre}`;
    } else {
      // Si la estación no tiene logo, mostrar el logo por defecto
      logoEstacionImg.src = "img/df.png";
      logoEstacionImg.alt = "Logo por defecto";
    }

    // Gestionar la clase 'active' para resaltar la estación actual
    if (currentStationItem) {
      currentStationItem.classList.remove("seleccionada");
    }
    listItem.classList.add("seleccionada");
    currentStationItem = listItem;
  }

  // Función para añadir los listeners a cada elemento de la lista
  function addEventListenersToItem(item) {
    item.addEventListener("click", function () {
      const url = this.dataset.url;
      const name = this.dataset.name;
      cambiarEstacion(url, name, this);
    });

    // Permitir "clic" con la tecla Enter para accesibilidad
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        this.click();
      }
    });
  }

  // Función para actualizar el estado (activado/desactivado) de las flechas
  function updateArrowState() {
    // Desactivar flecha izquierda si estamos al principio
    scrollLeftBtn.disabled = playlist.scrollLeft <= 0;

    // Para la flecha derecha, necesitamos comprobar si el final del scroll
    // ha alcanzado el ancho total del contenido.
    // Usamos un pequeño margen de 1px para evitar errores de redondeo.
    const maxScrollLeft = playlist.scrollWidth - playlist.clientWidth;
    scrollRightBtn.disabled = playlist.scrollLeft >= maxScrollLeft - 1;
  }

  // Añadir un listener al evento de scroll de la playlist
  playlist.addEventListener("scroll", updateArrowState);
  // También es buena idea actualizar al cambiar el tamaño de la ventana
  window.addEventListener("resize", updateArrowState);

  // Añadir listeners a las estaciones existentes en el HTML
  const playlistItems = document.querySelectorAll("#playlist li");
  playlistItems.forEach((item) => {
    addEventListenersToItem(item);
  });
  updateArrowState(); // Actualizar estado inicial de las flechas

  // Asignar evento al botón de agregar estación
  addStationButton.addEventListener("click", abrirFormulario);

  // Lógica para los botones del carrusel
  const scrollAmount = 300; // Píxeles a desplazar en cada clic

  scrollLeftBtn.addEventListener("click", () => {
    playlist.scrollLeft -= scrollAmount;
  });

  scrollRightBtn.addEventListener("click", () => {
    playlist.scrollLeft += scrollAmount;
  });

  // Función para abrir el formulario de contacto
  function abrirFormulario() {
    window.open("https://forms.gle/ygW3zJSpAdhyrupG9", "_blank");
  }

  // --- LÓGICA PARA INSTALACIÓN DE PWA ---
  let deferredPrompt;
  const installPromptContainer = document.getElementById("pwa-install-prompt");
  const installButton = document.getElementById("pwa-install-btn");
  const closeButton = document.getElementById("pwa-close-btn");

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevenir que el mini-infobar aparezca en Chrome
    e.preventDefault();
    // Guardar el evento para que pueda ser disparado más tarde.
    deferredPrompt = e;
    // Mostrar nuestro cartel de instalación personalizado
    installPromptContainer.style.display = "flex";
    setTimeout(() => installPromptContainer.classList.add("show"), 10); // Pequeño delay para la transición
  });

  installButton.addEventListener("click", async () => {
    // Ocultar nuestro cartel
    installPromptContainer.classList.remove("show");

    if (deferredPrompt) {
      // Mostrar el prompt de instalación del navegador
      deferredPrompt.prompt();
      // Esperar a que el usuario responda al prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // Ya no podemos usar el evento, así que lo descartamos
      deferredPrompt = null;
    }
  });

  closeButton.addEventListener("click", () => {
    installPromptContainer.classList.remove("show");
    // Ocultar el contenedor después de la transición
    setTimeout(() => (installPromptContainer.style.display = "none"), 300);
  });
});