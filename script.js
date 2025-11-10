document.addEventListener("DOMContentLoaded", function () {
  // --- VARIABLES GLOBALES DEL SCRIPT ---

  // Elementos del Reproductor de Radio
  const player = document.getElementById("radioPlayer");
  const source = player.querySelector("source");
  const nombreEstacionDiv = document.getElementById("nombreEstacion");
  const logoEstacionImg = document.getElementById("logoEstacion");
  const playlist = document.getElementById("playlist");
  const addStationButton = document.getElementById("addStationBtn");
  const scrollLeftBtn = document.getElementById("scrollLeftBtn");
  const scrollRightBtn = document.getElementById("scrollRightBtn");
  let currentStationItem = null;

  function cambiarEstacion(url, nombre, listItem) {
    // Cambiar la fuente del reproductor y cargarlo
    source.src = url;
    player.load();

    // Intentar reproducir la nueva estación
    player.play().catch((error) => {
      console.error(
        "La reproducción automática fue bloqueada por el navegador:",
        error
      );
      // Podrías mostrar un mensaje al usuario para que inicie la reproducción manualmente.
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
});
