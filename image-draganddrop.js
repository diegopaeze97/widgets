(function() {
    // Definición de estilos personalizados para el widget
    const style = document.createElement('style');
    style.innerHTML =  
        /* Estilos generales del widget */
        `
        body {
            font-family: "Azeret Mono", monospace;
        }
        .widget-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 0;
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
            flex-direction: column;
        }
            
        .widget-drop-area {
            width: 100%;
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #999;
            font-size: 18px;
            cursor: pointer;
            background-color: transparent;
            transition: background 0.3s;
            border: 1px solid #000;
        }

        widget-drop-area.dragover {
            background: rgba(0, 0, 0, 0.1);
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
            width: 16.66%;
            height: 180px;
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
            font-family: "Azeret Mono", monospace;
            width: 40%;
            margin: 16px auto;
            background-color: #749576;
            color: white;
            padding: 12px 16px;
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
        .hidden {
            display: none;
        }
        @media screen and (max-width: 1024px) {
            /* Ajustes para tablet */
        }
        @media screen and (max-width: 487px) {
            /* Ajustes para móvil */
        }`;
    document.head.appendChild(style);

    // Insertamos el widget en todos los contenedores con la clase "my-widget"
    const containers = document.querySelectorAll('.my-widget');
    containers.forEach(container => {
        container.innerHTML = 
            `<div class="widget-container" id=myWixGalleryWidgetIframe">
                <div class="widget-inner">
                    <!-- Área de subida -->
                    <div id="drop-area" class="widget-drop-area">
                        Drag or Drop Images here
                        <input type="file" id="file-input" class="widget-file-input" accept="image/*" multiple style="display: none;">
                    </div>
                    <!-- Contenedor de imágenes -->
                    <div id="image-preview" class="widget-image-preview"></div>
                </div>
                <p id="error-msg" class="widget-error"></p>
                <!-- Botón para subir imágenes -->
                <button id="upload-btn" class="widget-upload-btn">Upload Images</button>
                <p id="upload-status" class="widget-upload-status">Imágenes subidas correctamente</p>
            </div>`;
    });

    // Referencias a elementos del widget
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");
    const imagePreview = document.getElementById("image-preview");
    const errorMsg = document.getElementById("error-msg");
    const uploadBtn = document.getElementById("upload-btn");
    const uploadStatus = document.getElementById("upload-status");

    dropArea.addEventListener("click", () => fileInput.click());

    // Manejar el evento de arrastrar sobre el área
    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Array para almacenar objetos { container, file } de cada imagen
    let images = [];

    async function fetchImages() {
        try {
            const response = await fetch('https://salazar.es-guay.com/user/preview_user_gallery', { method: 'GET' });
            
            // Verifica si la respuesta HTTP fue exitosa (código 2xx)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.images && data.images.length > 0) { // Verifica si hay imágenes y la longitud > 0
                data.images.forEach(imgUrl => addImageFromBackend(imgUrl));
                // Log para depuración
                console.log('Imágenes cargadas y añadidas al DOM.');
                
                // *** AVISO A LA VENTANA PADRE: WIDGET LISTO CON IMÁGENES ***
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'WIDGET_GALLERY_READY', // Tipo de mensaje más específico
                        status: 'success',
                        hasImages: true,
                        widgetId: 'myWixGalleryWidget' // ID único para tu widget
                    }, '*'); // Reemplaza '*' con el dominio de Wix Studio si lo conoces para más seguridad
                }

            } else {
                // Caso donde no hay imágenes o solo un mensaje
                console.log(data.message || 'No se encontraron imágenes.');
                
                // *** AVISO A LA VENTANA PADRE: WIDGET LISTO PERO SIN IMÁGENES ***
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'WIDGET_GALLERY_READY', // Mismo tipo, diferente estado
                        status: 'success',
                        hasImages: false,
                        message: data.message || 'No images to display.',
                        widgetId: 'myWixGalleryWidget'
                    }, '*');
                }
            }
        } catch (error) {
            console.error('Error al obtener imágenes:', error);
            
            // *** AVISO A LA VENTANA PADRE: WIDGET EN ESTADO DE ERROR ***
            if (window.parent) {
                window.parent.postMessage({
                    type: 'WIDGET_GALLERY_ERROR', // Un tipo de mensaje para errores
                    status: 'error',
                    message: error.message,
                    widgetId: 'myWixGalleryWidget'
                }, '*');
            }
        }
    }


    function handleFiles(files) {
        console.log("Procesando archivos:", files);
    
        if (files.length + document.querySelectorAll(".widget-image-container").length > 6) {
            alert("Solo se permiten hasta 6 imágenes.");
            return;
        }
    
        for (const file of files) {
            // Verificar si el archivo es una imagen
            if (!file.type.startsWith("image/")) {
                alert(`"${file.name}" no es una imagen válida.`);
                continue; // Saltar este archivo y continuar con el siguiente
            }
    
            console.log("Leyendo archivo:", file.name);
    
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log("Imagen leída correctamente:", file.name);
                const imgUrl = e.target.result;
                validateAndAddImage(file, imgUrl);
            };
            reader.readAsDataURL(file);
        }
    }
    

    function addImageFromBackend(src) {
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("widget-image-container");
        imgContainer.innerHTML = 
            `<img src="${src}" class="widget-img">
             <button class="widget-remove-btn">❌</button>
             <button class="widget-select-cover">PORTADA</button>`;
        document.getElementById("image-preview").appendChild(imgContainer);
        images.push({ container: imgContainer, file: src });

        // Eliminar imagen
        imgContainer.querySelector(".widget-remove-btn").addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que se active la selección de portada
            imgContainer.remove();
            images = images.filter(img => img.container !== imgContainer);
            updateCover();
        });
    }

    document.addEventListener("DOMContentLoaded", fetchImages);

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

            // Aquí podrías agregar validación de relación de aspecto si lo requieres
            addImage(file, src);
        };
    }

    function addImage(file, src) {
        // Ocultamos cualquier mensaje de error previo
        errorMsg.classList.add("hidden");
        errorMsg.style.display = "none";

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("widget-image-container");

        imgContainer.innerHTML = 
            `<img src="${src}" class="widget-img">
             <button class="widget-remove-btn">❌</button>
             <button class="widget-select-cover">PORTADA</button>`;

        imagePreview.appendChild(imgContainer);
        // Guardamos tanto el contenedor como el objeto file
        images.push({ container: imgContainer, file: file });

        // Actualizamos la portada según el orden visual (DOM)
        updateCover();

        // Eliminar imagen
        imgContainer.querySelector(".widget-remove-btn").addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que se active la selección de portada
            imgContainer.remove();
            images = images.filter(img => img.container !== imgContainer);
            updateCover();
        });
    }

    // Actualiza la imagen de portada: la primera del contenedor será la portada
    function updateCover() {
        const containers = imagePreview.querySelectorAll('.widget-image-container');
        containers.forEach((container, index) => {
            const coverBtn = container.querySelector(".widget-select-cover");
            // La primera imagen (orden DOM) se marca como portada
            if (index === 0) {
                coverBtn.style.display = "block";
            } else {
                coverBtn.style.display = "none";
            }
        });
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
        errorMsg.classList.remove("hidden");
    }

    // Inicializamos Sortable para permitir arrastrar y reordenar las imágenes
    new Sortable(imagePreview, {
        animation: 150,
        ghostClass: "opacity-50",
        onEnd: function () {
            // Actualizamos la portada después de un reordenamiento
            updateCover();
        }
    });

    // Botón de subir imágenes: envío al servidor mediante fetch
    uploadBtn.addEventListener("click", async () => {
        const formData = new FormData();
        // Se recorre el contenedor en el orden actual (de izquierda a derecha)
        const containers = imagePreview.querySelectorAll('.widget-image-container');
        containers.forEach((container, index) => {
            
            const imageObj = images.find(img => img.container === container);
            if (imageObj) {
                // Se usa el orden visual para asignar nombres: image_1, image_2, etc.
                formData.append(`image_${index + 1}`, imageObj.file);
            } 
        });

        try {
            uploadBtn.textContent = "Uploading...";
            uploadBtn.disabled = true;

            const response = await fetch("https://salazar.es-guay.com/user/update_user_gallery", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Error en la subida");

            uploadStatus.textContent = "Images uploaded successfully!";
            uploadStatus.style.display = "block";
            uploadBtn.textContent = "Upload Images";
            uploadBtn.disabled = false;
        } catch (error) {
            showError("Error al subir imágenes. Inténtalo de nuevo.");
            uploadBtn.textContent = "Upload Images";
            uploadBtn.disabled = false;
        }
    });

    // Hacemos visible el botón de subir imágenes cuando se agrega la primera imagen
    const observer = new MutationObserver(() => {
        if (images.length > 0) {
            uploadBtn.style.display = "block";
        } else {
            uploadBtn.style.display = "none";
        }
    });
    observer.observe(imagePreview, { childList: true });
})();


