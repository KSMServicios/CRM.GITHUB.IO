document.addEventListener("DOMContentLoaded", function () {
    // --- VARIABLES GLOBALES DEL SCRIPT ---

    // Elementos del Reproductor de Radio
    const player = document.getElementById("radioPlayer");
    const source = player.querySelector("source");
    const nombreEstacionDiv = document.getElementById("nombreEstacion");
    const logoEstacionImg = document.getElementById("logoEstacion");
    const playlist = document.getElementById("playlist");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const addStationButton = document.getElementById("addStationBtn");
    const scrollLeftBtn = document.getElementById("scrollLeftBtn");
    const scrollRightBtn = document.getElementById("scrollRightBtn");
    let currentStationItem = null;

    // Elementos del Chatbot
    const chatWidget = document.getElementById("chat-widget");
    const chatToggleBtn = document.getElementById("chat-toggle-btn");
    const closeChatBtn = document.getElementById("close-chat");
    const chatBody = document.getElementById("chat-body");
    const emailChatBtn = document.getElementById("email-chat-btn");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");

    // Estado del Chatbot
    let userName = null;
    let isWaitingForName = false;

    // Función para cargar y mostrar las estaciones desde el JSON
    async function cargarEstaciones() {
        try {
            // Asegúrate que 'stations.json' esté en la raíz del repositorio y sea JSON válido.
            const response = await fetch("stations.json");
            
            if (!response.ok) {
                // Si hay error 404 (ruta o nombre incorrecto)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stations = await response.json();

            loadingIndicator.style.display = "none";
            stations.forEach((station) => {
                const listItem = document.createElement("li");
                
                // === CORRECCIÓN CLAVE 1: Validar URL de streaming ===
                // Reemplaza http:// por https:// o // para evitar el bloqueo por Contenido Mixto
                const safeUrl = station.url.startsWith("http:") 
                    ? station.url.replace("http://", "https://") 
                    : station.url;

                listItem.dataset.url = safeUrl;
                // ====================================================

                listItem.dataset.name = station.name;
                listItem.setAttribute("role", "button");
                listItem.setAttribute("tabindex", "0");

                const logoHtml = station.logo
                    ? `<img src="${station.logo}" alt="Logo de ${station.name}">`
                    : "";

                listItem.innerHTML = `
                    <a href="#">
                        ${logoHtml}
                        <span>${station.name}</span>
                    </a>
                `;

                addEventListenersToItem(listItem);
                playlist.appendChild(listItem);
            });
            updateArrowState(); // Actualizar estado de las flechas después de cargar
        } catch (error) {
            console.error("No se pudieron cargar las estaciones. Verifica el JSON:", error);
            loadingIndicator.style.display = "none";
            playlist.innerHTML =
                '<p style="color: red;">Error al cargar la lista. Verifica el archivo `stations.json` y el protocolo de las URLs de streaming (deben ser HTTPS).</p>';
        }
    }

    function cambiarEstacion(url, nombre, listItem) {
        // Cambiar la fuente del reproductor y cargarlo
        source.src = url;
        player.load();

        // Intentar reproducir la nueva estación
        // El navegador podría seguir bloqueando, pero es mejor que el autoplay forzado.
        player.play().catch((error) => {
            console.error(
                "La reproducción automática fue bloqueada. Pídele al usuario que haga clic en 'Play'."
            );
            // Mostrar un mensaje al usuario para que inicie la reproducción manualmente.
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
        const carouselContainer = playlist.parentElement;
        if (!carouselContainer) return; // Salir si el padre no existe

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

    // Iniciar la carga de estaciones cuando el DOM esté listo
    cargarEstaciones();

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

    // --- LÓGICA DEL CHATBOT ---

    // Función para abrir el formulario de contacto
    function abrirFormulario() {
        window.open("https://forms.gle/ygW3zJSpAdhyrupG9", "_blank");
    }

    // Abrir y cerrar el chat
    chatToggleBtn.addEventListener("click", () =>
        chatWidget.classList.toggle("hidden")
    );
    closeChatBtn.addEventListener("click", closeAndResetChat);

    // Enviar conversación por email
    emailChatBtn.addEventListener("click", sendConversationByEmail);

    // Cargar historial del chat al iniciar
    loadChatHistory();

    // Enviar mensaje
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === "") return;

        // Mostrar mensaje del usuario
        appendMessage({ text: userInput, from: "user" });
        chatInput.value = "";

        // Si el bot está esperando el nombre, el input es el nombre.
        if (isWaitingForName) {
            userName = userInput;
            localStorage.setItem("userName", userName); // Guardar nombre
            isWaitingForName = false;
            setTimeout(() => {
                const welcomeResponse = getBotResponse("hola"); // Simular un "hola" para obtener el saludo personalizado
                appendBotMessage(welcomeResponse);
            }, 500);
            return;
        }

        // Mostrar indicador de "escribiendo..."
        showTypingIndicator();

        // Generar y mostrar respuesta del bot
        setTimeout(() => {
            // Ocultar indicador de "escribiendo..."
            hideTypingIndicator();
            const botResponse = getBotResponse(userInput);
            appendBotMessage({
                text: botResponse.text,
                options: botResponse.options,
                from: "bot",
            });
        }, 1500);
    }

    function appendMessage(message) {
        const className = message.from === "user" ? "user-message" : "bot-message";
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(className);
        messageDiv.innerHTML = message.text; // Usamos innerHTML para permitir enlaces
        chatBody.appendChild(messageDiv);

        // Guardar en el historial
        saveMessageToHistory(message);

        // Hacer scroll hacia el último mensaje
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function getBotResponse(userInput) {
        // Desactivar botones de opciones anteriores
        const oldButtons = document.querySelectorAll(".options-container button:not(:disabled)");
        oldButtons.forEach((btn) => (btn.disabled = true));

        const input = userInput.toLowerCase();

        if (
            input.includes("hola") ||
            input.includes("buenos dias") ||
            input.includes("inicio")
        ) {
            const greeting = userName
                ? `¡Hola de nuevo, ${userName}! ¿En qué puedo ayudarte?`
                : "¡Hola! Gracias por contactar a KSM Servicios. ¿Cómo puedo ayudarte hoy?";
            return {
                text: greeting,
                options: ["Ver servicios", "Precios", "Contacto"],
            };
        } else if (input.includes("servicio") || input.includes("hacen")) {
            return {
                text: "Ofrecemos una variedad de servicios de desarrollo web, incluyendo diseño de páginas, creación de aplicaciones y consultoría técnica. ¿Te gustaría saber más sobre alguno en particular?",
                options: ["Contacto", "Volver al inicio"],
            };
        } else if (input.includes("precio") || input.includes("costo")) {
            return {
                text: `Claro, ${
                    userName || "amigo/a"
                }. Los precios varían según el proyecto. Para darte una cotización precisa, cuéntame un poco más sobre lo que necesitas.`,
                options: ["Contacto", "Volver al inicio"],
            };
        } else if (input.includes("contacto") || input.includes("email")) {
            // Número de WhatsApp en formato internacional (54 para Argentina + 9 para celular)
            const whatsappNumber = "5491166508379"; // Corregido
            return {
                text: `Puedes contactarnos por:<br>
                <b>Email:</b> ksmserviciosiliciones@gmail.com<br>
                <b>WhatsApp:</b> <a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener noreferrer" class="whatsapp-link"><img src="img/wa.png" alt="WhatsApp"> 11 6650-8379</a>`,
                options: ["Volver al inicio"],
            };
        } else if (input.includes("gracias")) {
            return {
                text: "¡De nada! Si tienes otra pregunta, no dudes en consultarme.",
            };
        } else if (input.includes("volver al inicio")) {
            return {
                text: "¿En qué más puedo ayudarte?",
                options: ["Ver servicios", "Precios", "Contacto"],
            };
        } else {
            return {
                text: "Lo siento, no he entendido tu pregunta. Intenta reformularla. Puedes preguntar sobre 'servicios', 'precios' o 'contacto'.",
                options: ["Ver servicios", "Precios", "Contacto"],
            };
        }
    }

    function appendBotMessage(response) {
        // Añadir el mensaje de texto del bot
        appendMessage(response);

        // Añadir los botones de opciones si existen
        if (response.options && response.options.length > 0) {
            const optionsContainer = document.createElement("div");
            optionsContainer.classList.add("options-container");
            response.options.forEach((optionText) => {
                const button = document.createElement("button");
                button.classList.add("option-btn");
                button.textContent = optionText;
                button.addEventListener("click", () => {
                    chatInput.value = optionText;
                    sendMessage();
                });
                optionsContainer.appendChild(button);
            });
            chatBody.appendChild(optionsContainer);
        }

        // Hacer scroll hacia el último mensaje
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function sendConversationByEmail() {
        const messages = chatBody.querySelectorAll(".bot-message, .user-message");
        let conversationText =
            "Historial de la conversación con el Asistente KSM:\n\n";

        messages.forEach((msg) => {
            const prefix = msg.classList.contains("bot-message")
                ? "Asistente:"
                : "Usuario:";
            conversationText += `${prefix} ${msg.textContent}\n`;
        });

        const subject = "Conversación con el Chatbot de KSM Servicios";
        const body = encodeURIComponent(conversationText);
        // Se pueden añadir múltiples emails separándolos por coma.
        const yourEmail =
            "saultula.st@gmail.com,contacto@ksmserviciosoliciones.com";

        // Abrir el cliente de correo del usuario
        window.location.href = `mailto:${yourEmail}?subject=${subject}&body=${body}`;
    }

    // --- Funciones para Historial y Animación "Escribiendo..." ---

    function saveMessageToHistory(message) {
        let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
        // Solo guardamos el texto, no las opciones de los mensajes del bot para evitar errores de renderizado.
        const simplifiedMessage = { text: message.text, from: message.from };
        history.push(simplifiedMessage);
        localStorage.setItem("chatHistory", JSON.stringify(history));
    }

    function loadChatHistory() {
        let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
        userName = localStorage.getItem("userName") || null;

        // Limpiar el contenido del chat
        chatBody.innerHTML = "";
        
        if (history.length > 0) {
            // Re-renderizar mensajes
            history.forEach((message) => {
                // Re-renderizar mensajes (usamos appendMessage para simplificar el historial)
                appendMessage(message); 
            });
             // Al final del historial, ofrecer opciones si el último mensaje no fue del bot con opciones
             if (history[history.length - 1].from === 'user' || history.length === 0) {
                 const welcomeResponse = getBotResponse("hola");
                 appendBotMessage(welcomeResponse);
             }


        } else if (!userName) {
            // Si no hay historial NI nombre, pedir el nombre.
            isWaitingForName = true;
            appendBotMessage({
                text: "¡Hola! Soy el asistente virtual de KSM Servicios. Para una atención más personalizada, ¿podrías decirme tu nombre?",
                from: "bot",
            });
        } else {
            // Si no hay historial PERO SÍ hay nombre, dar la bienvenida.
            const welcomeResponse = getBotResponse("hola");
            appendBotMessage(welcomeResponse);
        }
    }


    function showTypingIndicator() {
        const indicator = document.createElement("div");
        indicator.classList.add("typing-indicator", "bot-message"); // Agrega 'bot-message' para estilo
        indicator.id = "typing-indicator";
        indicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        chatBody.appendChild(indicator);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) {
            indicator.remove();
        }
    }

    function closeAndResetChat() {
        // 1. Ocultar la ventana del chat
        chatWidget.classList.add("hidden");

        // 2. Borrar el historial del almacenamiento local
        localStorage.removeItem("chatHistory");
        localStorage.removeItem("userName");

        // 3. Limpiar el contenido visual del chat
        chatBody.innerHTML = "";

        // 4. Reiniciar las variables de estado
        userName = null;
        isWaitingForName = true;

        // 5. Añadir el mensaje inicial para pedir el nombre la próxima vez que se abra
        appendBotMessage({
            text: "¡Hola! Soy el asistente virtual de KSM Servicios. Para una atención más personalizada, ¿podrías decirme tu nombre?",
            from: "bot",
        });
    }

    // === CORRECCIÓN CLAVE 2: Limpieza en HTML ===
    // Asegúrate de que en tu index.html el tag <audio> no tenga el atributo 'autoplay'
    // La reproducción debe ser iniciada por la interacción del usuario.
    // Ej: <audio id="radioPlayer" controls>
    // ===========================================
});
