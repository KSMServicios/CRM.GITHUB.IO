window.onload = function() {
    var estaciones = document.querySelectorAll('#playlist a');
    estaciones.forEach(function(estacion) {
      estacion.addEventListener('click', function(event) {
        event.preventDefault();
        var urlEstacion = this.getAttribute('href');
        var nombreEstacion = this.textContent;
        var player = document.getElementById('radioPlayer');
        player.src = urlEstacion;
        mostrarNombreEstacion(nombreEstacion);
        var imagenEstacion = document.getElementById('imagenEstacion');
        imagenEstacion.src = 'img/viva98.5.png' + nombreEstacion.toLowerCase() + '.jpg'; // Ajusta la ruta de la imagen según tu estructura de archivos
      }
      });
    });
  };
  
  function mostrarNombreEstacion(nombreEstacion) {
    var divNombreEstacion = document.getElementById('nombreEstacion');
    divNombreEstacion.textContent = 'Estás escuchando: ' + nombreEstacion;
  }
  
  function abrirFormulario() {
    // Reemplaza 'URL_DEL_FORMULARIO' con la URL real del formulario de contacto
    var urlFormulario = 'https://forms.gle/Aj4WTcZ7iMbJx6bo7';
    window.open(urlFormulario, '_blank');
  }
  