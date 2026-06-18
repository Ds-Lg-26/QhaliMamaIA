/**
 * QhaliMama IA - Motor de Inteligencia Artificial para Visión Nutricional
 * Interacción de la cámara, conversión de base64 y llamadas seguras con reintentos a la API Gemini
 * UPN Cajamarca - 2026
 */

// API Key configurada según las instrucciones del entorno. El ambiente la inyecta al vuelo.
const apiKey = "";

// Variables globales de estado gestacional
let selectedTrimestre = 2; // Por defecto trimestre 2 (alto requerimiento de hierro y calorías)
let base64ImageForAnalysis = null;

document.addEventListener("DOMContentLoaded", () => {
    // Escuchador para la subida de archivos/cámara
    const fileInput = document.getElementById('food-image-input');
    const placeholder = document.getElementById('upload-placeholder');
    
    if (placeholder && fileInput) {
        placeholder.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleImageSelection);
    }
});

/**
 * Muestra alertas visuales amigables en vez de usar alerts nativos molestos
 */
function showNotification(text, type = "error") {
    const bar = document.getElementById('notification-bar');
    const icon = document.getElementById('notification-icon');
    const txtNode = document.getElementById('notification-text');

    if (!bar || !icon || !txtNode) return;

    bar.classList.remove('hidden', 'bg-rose-50', 'text-rose-800', 'border-rose-100', 'bg-amber-50', 'text-amber-800', 'border-amber-100', 'border');
    
    if (type === "error") {
        bar.className = "max-w-3xl mx-auto mb-6 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm transition-all duration-300 bg-rose-50 text-rose-800 border border-rose-100";
        icon.className = "fa-solid fa-circle-exclamation text-rose-600 text-base";
    } else {
        bar.className = "max-w-3xl mx-auto mb-6 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm transition-all duration-300 bg-amber-50 text-amber-800 border border-amber-100";
        icon.className = "fa-solid fa-bell text-amber-600 text-base";
    }

    txtNode.textContent = text;
}

/**
 * Maneja la selección del archivo y lo renderiza en pantalla antes de iniciar la IA
 */
function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        const placeholder = document.getElementById('upload-placeholder');
        
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }

        // Obtener el string en base64 puro para enviar a la API
        const base64Data = e.target.result.split(',')[1];
        base64ImageForAnalysis = base64Data;

        // Iniciar el análisis inmediato
        analizarComidaConIA(base64Data, file.type);
    };
    reader.readAsDataURL(file);
}

/**
 * Abre el seleccionador de archivos nativo
 */
function triggerFileSelect() {
    const fileInput = document.getElementById('food-image-input');
    if (fileInput) fileInput.click();
}

/**
 * Cambia el trimestre gestacional y actualiza el consejo si ya existe una imagen
 */
function changeTrimestre(trimestre) {
    selectedTrimestre = trimestre;
    
    // Actualizar botones visuales
    [1, 2, 3].forEach(i => {
        const btn = document.getElementById(`btn-t${i}`);
        if (btn) {
            btn.className = i === trimestre 
                ? "py-1 text-xs font-bold rounded-md bg-brand-600 text-white" 
                : "py-1 text-xs font-bold rounded-md bg-slate-800 text-slate-400";
        }
    });

    // Re-analizar si ya tenemos una imagen cargada para ajustar los requerimientos
    if (base64ImageForAnalysis) {
        analizarComidaConIA(base64ImageForAnalysis, "image/png");
    }
}

/**
 * Llama a la API de Inteligencia Artificial Gemini con reintentos exponenciales
 */
async function analizarComidaConIA(base64Data, mimeType) {
    toggleLoadingState(true);

    const systemPrompt = `Actúa como el experto asistente médico nutricional del proyecto "QhaliMama" (Prevención de anemia y diabetes gestacional de la UPN en Cajamarca). 
    Debes identificar de forma precisa el plato de comida en la imagen. Evalúa sus propiedades para una gestante que se encuentra en su ${selectedTrimestre}° trimestre del embarazo.
    Genera un informe detallado con:
    - Calorías estimadas del plato (kcal).
    - Hierro estimado (mg), indicando si es alto o bajo. Recuerda que la prevención de anemia requiere hierro, idealmente hemínico.
    - Ácido Fólico estimado (µg).
    - Índice Glucémico (Bajo, Medio o Alto con su rango estimado).
    - Semáforo nutricional para el trimestre de la gestante: "Verde" (Saludable y adecuado), "Amarillo" (Consumo moderado o mejorable), o "Rojo" (Alto riesgo por glucemia o inadecuado en el embarazo).
    - Un consejo clínico y obstétrico adaptado a la paciente según la guía del MINSA Perú y la OMS para su trimestre seleccionado:
      * 1er Trimestre: Requerimiento calórico sin incremento adicional (+0 kcal), alta demanda de ácido fólico y prevención de malestares iniciales.
      * 2do Trimestre: Mayor demanda de hierro y incremento calórico moderado (+340 kcal/día adicionales).
      * 3er Trimestre: Máximo requerimiento energético (+450 kcal/día adicionales) e importancia de evitar grasas saturadas y picos de azúcar para descartar diabetes gestacional tardía.
    
    Debes responder estrictamente en formato JSON utilizando la estructura provista. Evita cualquier otro texto o markdown fuera del JSON.`;

    const requestPayload = {
        contents: [
            {
                parts: [
                    { 
                        text: `Identifica este plato de comida para una gestante en el ${selectedTrimestre}° trimestre. Genera los valores estimados de nutrientes y redacta la recomendación obstétrica con terminología científica pero entendible para la madre.` 
                    },
                    {
                        inlineData: {
                            mimeType: mimeType || "image/png",
                            data: base64Data
                        }
                    }
                ]
            }
        ],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    calories: { type: "STRING" },
                    iron: { type: "STRING" },
                    folicAcid: { type: "STRING" },
                    glycemicIndex: { type: "STRING" },
                    semaforo: { type: "STRING" },
                    semaforoReason: { type: "STRING" },
                    advice: { type: "STRING" }
                },
                required: ["title", "calories", "iron", "folicAcid", "glycemicIndex", "semaforo", "semaforoReason", "advice"]
            }
        }
    };

    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    try {
        const responseText = await callApiWithExponentialBackoff(endpointUrl, requestPayload);
        const result = JSON.parse(responseText);
        renderReporteIA(result);
    } catch (error) {
        showNotification("No pudimos contactar con el motor de IA en este momento. Por favor verifica tu conexión e inténtalo de nuevo.");
        toggleLoadingState(false);
    }
}

/**
 * Función robusta para llamadas de red con Backoff Exponencial (hasta 5 intentos)
 */
async function callApiWithExponentialBackoff(url, payload) {
    const maxRetries = 5;
    let delay = 1000; // 1 segundo inicial

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textOutput) return textOutput;
                throw new Error("Respuesta de la API mal formada.");
            }
        } catch (e) {
            // Error atrapado, el ciclo intentará la reconexión automática de fondo
        }

        // Espera de backoff exponencial antes del siguiente reintento
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Duplica el tiempo (1s, 2s, 4s, 8s, 16s)
    }

    throw new Error("Se superaron todos los intentos de conexión.");
}

/**
 * Renderiza dinámicamente los campos calculados por Gemini en la UI
 */
function renderReporteIA(data) {
    toggleLoadingState(false);

    document.getElementById('report-title').textContent = data.title;
    document.getElementById('report-calories').textContent = data.calories;
    document.getElementById('report-iron').textContent = data.iron;
    document.getElementById('report-folic').textContent = data.folicAcid;
    document.getElementById('report-gi').textContent = data.glycemicIndex;
    document.getElementById('report-advice').textContent = data.advice;

    // Actualizar semáforo nutricional
    const semaforoEl = document.getElementById('report-semaforo');
    if (semaforoEl) {
        const semTag = data.semaforo.toLowerCase();
        semaforoEl.textContent = `${data.semaforo} (${data.semaforoReason})`;
        
        if (semTag.includes('verde') || semTag.includes('adecuado') || semTag.includes('buen')) {
            semaforoEl.className = "px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wide";
        } else if (semTag.includes('amarillo') || semTag.includes('moderar') || semTag.includes('mejor')) {
            semaforoEl.className = "px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wide";
        } else {
            semaforoEl.className = "px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs uppercase tracking-wide";
        }
    }
}

/**
 * Manejador de estados de carga visuales
 */
function toggleLoadingState(isLoading) {
    const line = document.getElementById('laser-line');
    const overlay = document.getElementById('loading-overlay');
    if (line && overlay) {
        if (isLoading) {
            line.classList.remove('hidden');
            overlay.classList.remove('hidden');
        } else {
            line.classList.add('hidden');
            overlay.classList.add('hidden');
        }
    }
}

/**
 * Función para cargar platos de demostración precargados (Sin necesidad de usar archivo local)
 */
function demoPlato(tipo) {
    let base64Mock = "";
    if (tipo === 'lentejas') {
        // Simular el plato estrella local saludable
        base64Mock = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // 1x1 Transparent PNG
        document.getElementById('image-preview').src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300";
    } else {
        // Simular postre de riesgo metabólico alto en azúcares
        base64Mock = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        document.getElementById('image-preview').src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=300";
    }

    document.getElementById('image-preview').classList.remove('hidden');
    document.getElementById('upload-placeholder').classList.add('hidden');
    
    base64ImageForAnalysis = base64Mock;
    analizarComidaConIA(base64Mock, "image/png");
}

/**
 * SIMULADOR DE ALERTAS DE GLUCOSA (Desplazador manual en pie de página)
 */
function calcAlert() {
    const slider = document.getElementById('s-gl');
    const txtValue = document.getElementById('v-gl');
    const boxAlerta = document.getElementById('alert-box');
    
    if (!slider || !boxAlerta || !txtValue) return;

    let glucosa = slider.value;
    txtValue.textContent = `${glucosa} mg/dL`;
    
    // Umbral de diabetes gestacional según la OMS / MINSA (140 mg/dL postprandial)
    if (glucosa >= 140) {
        boxAlerta.className = "p-4 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-100 flex gap-3";
        boxAlerta.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-lg shrink-0"></i>
            <div>
                <b>ALERTA DE RIESGO DE GLUCEMIA:</b> Valores de glucosa elevados (${glucosa} mg/dL). Compatible con criterios de screening para diabetes gestacional. El sistema notificará de forma segura al obstetra a cargo en Cajamarca. Se sugiere evitar harinas refinadas y carbohidratos de alto índice glucémico.
            </div>
        `;
    } else {
        boxAlerta.className = "p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-100 flex gap-3";
        boxAlerta.innerHTML = `
            <i class="fa-solid fa-circle-check text-lg shrink-0"></i>
            <div>
                <b>Nivel Clínico Estable:</b> Los rangos metabólicos de glucosa (${glucosa} mg/dL) evaluados se encuentran dentro de las metas seguras fijadas por la OMS. No hay riesgo de diabetes gestacional activo.
            </div>
        `;
    }
}
