import Sortable from "sortablejs";

(function() {
    // Definición de estilos personalizados para el widget
    const style = document.createElement('style');
    style.innerHTML = ` 
        /* Estilos generales del widget */
        .widget-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 16px;
            font-family: sans-serif;
        }
        .widget-title {
            font-size: 1.125rem;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        }
        .widget-inner {
            display: flex;
            gap: 16px;
            margin-top: 16px;
        }
        .widget-drop-area {
            width: 128px;
            height: 128px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px dashed #888;
            border-radius: 8px;
            background-color: #fff;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .widget-drop-area:hover {
            background-color: #f9f9f9;
        }
        .widget-file-input {
            display: none;
        }
        .widget-label {
            cursor: pointer;
            color: #007BFF;
        }
        .widget-image-preview {
            display: flex;
            gap: 16px;
            margin-top: 16px;
        }
        .widget-image-container {
            position: relative;
            width: 112px;
            height: 112px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .widget-image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .widget-remove-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            background-color: #fff;
            padding: 4px;
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            cursor: pointer;
            border: none;
        }
        .widget-select-cover {
            position: absolute;
            bottom: 4px;
            left: 4px;
            background-color: green;
            color: #fff;
            font-size: 0.75rem;
            padding: 2px 4px;
            border-radius: 4px;
            display: none;
        }
        .widget-error {
            color: red;
            font-size: 0.875rem;
            margin-top: 8px;
            display: none;
        }
        .widget-upload-btn {
            margin-top: 16px;
            background-color: blue;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            border: none;
            display: none;
        }
        .widget-upload-status {
            margin-top: 8px;
            color: green;
            font-size: 0.875rem;
            display: none;
        }
        /* Clase auxiliar para ocultar elementos */
        .hidden {
            display: none;
        }
        @media screen and (max-width: 1024px) {
            /* Puedes agregar ajustes para tablet */
        }
        @media screen and (max-width: 487px) {
            /* Puedes agregar ajustes para móvil */
        }
    `;
    document.head.appendChild(style);

    // Insertamos el widget en todos los contenedores con la clase "my-widget"
    const containers = document.querySelectorAll('.my-widget');
    containers.forEach(container => {
        container.innerHTML = `
            <div class="widget-container">
                <h2 class="widget-title">Fotos (requerido)</h2>
                <div class="widget-inner">
                    <!-- Área de subida -->
                    <div id="drop-area" class="widget-drop-area">
                        <input type="file" id="file-input" class="widget-file-input" accept="image/*" multiple>
                        <label for="file-input" class="widget-label">Seleccionar</label>
                    </div>
                    <!-- Contenedor de imágenes -->
                    <div id="image-preview" class="widget-image-preview"></div>
                </div>
                <p id="error-msg" class="widget-error"></p>
                <!-- Botón para subir imágenes -->
                <button id="upload-btn" class="widget-upload-btn">Subir imágenes</button>
                <p id="upload-status" class="widget-upload-status">Imágenes subidas correctamente</p>
            </div>
        `;
    });

    // Referencias a elementos del widget
    const fileInput = document.getElementById("file-input");
    const imagePreview = document.getElementById("image-preview");
    const errorMsg = document.getElementById("error-msg");
    const uploadBtn = document.getElementById("upload-btn");
    const uploadStatus = document.getElementById("upload-status");

    // Array para almacenar objetos { container, file } de cada imagen
    let images = [];

    // REGLAS DE VALIDACIÓN
    const MAX_IMAGES = 6;
    const MIN_WIDTH = 300; // Mínimo 300px de ancho
    const MIN_HEIGHT = 300; // Mínimo 300px de alto
    const MAX_SIZE_MB = 2;  // Máximo 2MB
    const ALLOWED_ASPECT_RATIOS = [1, 3 / 4]; // Permitidos: 1:1 y 3:4

    // Manejo de subida de imágenes
    fileInput.addEventListener("change", function(event) {
        const files = event.target.files;
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                validateAndAddImage(file, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    function validateAndAddImage(file, src) {
        const img = new Image();
        img.src = src;
        img.onload = function () {
            const width = img.width;
            const height = img.height;
            const sizeMB = file.size / (1024 * 1024);
            const aspectRatio = width / height;
            console.log("Dimensiones:", width, height, "Razón:", aspectRatio);

            if (width < MIN_WIDTH || height < MIN_HEIGHT) {
                showError(`Imagen demasiado pequeña (mínimo ${MIN_WIDTH}x${MIN_HEIGHT}px).`);
                return;
            }
            if (sizeMB > MAX_SIZE_MB) {
                showError(`Imagen demasiado pesada (máximo ${MAX_SIZE_MB}MB).`);
                return;
            }
            if (images.length >= MAX_IMAGES) {
                showError(`Solo se permiten ${MAX_IMAGES} imágenes.`);
                return;
            }

            // Aquí podrías agregar validación de relación de aspecto si lo requieres,
            // por ejemplo: if (!ALLOWED_ASPECT_RATIOS.includes(parseFloat(aspectRatio.toFixed(2)))) { ... }

            addImage(file, src);
        };
    }

    function addImage(file, src) {
        // Ocultamos cualquier mensaje de error previo
        errorMsg.classList.add("hidden");
        errorMsg.style.display = "none";

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("widget-image-container");

        imgContainer.innerHTML = `
            <img src="${src}" class="widget-img">
            <button class="widget-remove-btn">❌</button>
            <button class="widget-select-cover">PORTADA</button>
        `;

        imagePreview.appendChild(imgContainer);
        // Guardamos tanto el contenedor como el objeto file
        images.push({ container: imgContainer, file: file });

        updateCover();

        // Eliminar imagen
        imgContainer.querySelector(".widget-remove-btn").addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que se active la selección de portada
            imgContainer.remove();
            images = images.filter(img => img.container !== imgContainer);
            updateCover();
        });

        // Seleccionar imagen de portada
        imgContainer.addEventListener("click", () => {
            images.forEach(img => {
                img.container.querySelector(".widget-select-cover").style.display = "none";
            });
            imgContainer.querySelector(".widget-select-cover").style.display = "block";
        });
    }

    function updateCover() {
        if (images.length > 0) {
            // La primera imagen se marca como portada por defecto
            images[0].container.querySelector(".widget-select-cover").style.display = "block";
        }
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
        errorMsg.classList.remove("hidden");
    }

    // Inicializamos Sortable para permitir arrastrar y reordenar las imágenes
    new Sortable(imagePreview, {
        animation: 150,
        ghostClass: "opacity-50"
    });

    // Botón de subir imágenes: envío al servidor mediante fetch
    uploadBtn.addEventListener("click", async () => {
        const formData = new FormData();
        images.forEach((img, index) => {
            formData.append(`image_${index + 1}`, img.file);
        });

        try {
            uploadBtn.textContent = "Subiendo...";
            uploadBtn.disabled = true;

            const response = await fetch("https://tu-servidor.com/api/upload", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Error en la subida");

            uploadStatus.textContent = "Imágenes subidas correctamente";
            uploadStatus.style.display = "block";
            uploadBtn.textContent = "Subir imágenes";
            uploadBtn.disabled = false;
        } catch (error) {
            showError("Error al subir imágenes. Inténtalo de nuevo.");
            uploadBtn.textContent = "Subir imágenes";
            uploadBtn.disabled = false;
        }
    });

    // Hacemos visible el botón de subir imágenes cuando se agrega la primera imagen
    // (esto se puede ajustar según la lógica de tu aplicación)
    const observer = new MutationObserver(() => {
        if (images.length > 0) {
            uploadBtn.style.display = "block";
        } else {
            uploadBtn.style.display = "none";
        }
    });
    observer.observe(imagePreview, { childList: true });
})();

