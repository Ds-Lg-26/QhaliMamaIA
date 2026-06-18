/**
 * QhaliMama IA - Lógica de Interacción Centralizada
 * Proyecto de Prevención de Riesgos Metabólicos en Gestantes
 * UPN Cajamarca - 2026
 */

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Detectar en qué página nos encontramos para inicializar los módulos correctos
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === "servicios.html") {
        initServiciosModulo();
    } else if (page === "contactos.html") {
        initContactosModulo();
    }
});

/* ==========================================================================
   MÓDULO DE SERVICIOS (Escáner Nutricional IA y Alertas)
   ========================================================================== */

// Base de datos local simulada para el modelo de Visión Artificial (MobileNetV3)
const alimentosDB = {
    lentejas: {
        title: 'Lentejas con Pescado Frito',
        icon: '🍛',
        iron: '8.9 mg',
        cal: '540 kcal',
        gi: 'Bajo (35)',
        sem: 'Adecuado',
        adv: 'Excelente fuente de hierro hemínico y proteínas, ideal para prevenir anemia.'
    },
    torta: {
        title: 'Tarta Dulce con Azúcar',
        icon: '🍰',
        iron: '0.4 mg',
        cal: '490 kcal',
        gi: 'Alto (85)',
        sem: 'Inadecuado',
        adv: 'Alerta: Elevado índice glucémico. Incrementa sustancialmente el riesgo de picos de glucemia gestacional.'
    }
};

// Variables de estado del simulador
let trimestreActual = 2;
let alimentoActual = 'lentejas';

function initServiciosModulo() {
    // Hacer las funciones accesibles globalmente desde los atributos onclick del HTML
    window.simFood = simFood;
    window.changeTrim = changeTrim;
    window.calcAlert = calcAlert;

    // Inicializar el escuchador del slider de glucosa
    const sliderGlucosa = document.getElementById('s-gl');
    if (sliderGlucosa) {
        sliderGlucosa.addEventListener('input', calcAlert);
    }
    
    // Render inicial
    updateUI();
}

// Cambiar el plato simulado en el visor de IA
function simFood(type) {
    if (!alimentosDB[type]) return;
    alimentoActual = type;
    
    const visorIcono = document.getElementById('scanner-visual');
    if (visorIcono) visorIcono.textContent = alimentosDB[type].icon;
    
    updateUI();
}

// Cambiar la lógica según el trimestre seleccionado
function changeTrim(trimestre) {
    trimestreActual = trimestre;
    
    // Actualizar estados visuales de los botones (1º, 2º, 3º)
    [1, 2, 3].forEach(i => {
        const btn = document.getElementById(`b${i}`);
        if (btn) {
            btn.className = i === trimestre 
                ? "py-1 text-xs font-bold rounded-md bg-brand-600 text-white" 
                : "py-1 text-xs font-bold rounded-md bg-slate-800 text-slate-400";
        }
    });
    
    updateUI();
}

// Actualizar la interfaz del visor de resultados IA
function updateUI() {
    const data = alimentosDB[alimentoActual];
    
    const txtTitle = document.getElementById('f-title');
    const txtIron = document.getElementById('f-iron');
    const txtCal = document.getElementById('f-cal');
    const txtGi = document.getElementById('f-gi');
    const badgeSem = document.getElementById('f-sem');
    const txtAdvise = document.getElementById('f-advise');

    if (txtTitle) txtTitle.textContent = data.title;
    if (txtIron) txtIron.textContent = data.iron;
    if (txtCal) txtCal.textContent = data.cal;
    if (txtGi) txtGi.textContent = data.gi;
    
    if (badgeSem) {
        badgeSem.textContent = data.sem;
        badgeSem.className = `px-3 py-1 rounded-full font-bold text-xs ${
            alimentoActual === 'lentejas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`;
    }
    
    if (txtAdvise) {
        txtAdvise.textContent = `[Trimestre ${trimestreActual}] — ${data.adv}`;
    }
}

// Calcular y generar alertas metabólicas según normativas MINSA
function calcAlert() {
    const slider = document.getElementById('s-gl');
    const txtValue = document.getElementById('v-gl');
    const boxAlerta = document.getElementById('alert-box');
    
    if (!slider || !boxAlerta || !txtValue) return;

    let glucosa = slider.value;
    txtValue.textContent = `${glucosa} mg/dL`;
    
    // Umbral de riesgo para diabetes gestacional postprandial / screening general (140 mg/dL)
    if (glucosa >= 140) {
        boxAlerta.className = "p-4 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-100 flex gap-3";
        boxAlerta.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation text-lg"></i>
            <div>
                <b>ALERTA DE RIESGO:</b> Valores de glucosa elevados compatibles con criterios de screening para diabetes gestacional. Se sugiere interconsulta médica inmediata.
            </div>
        `;
    } else {
        boxAlerta.className = "p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-100 flex gap-3";
        boxAlerta.innerHTML = `
            <i class="fa-solid fa-circle-check text-lg"></i>
            <div>
                <b>Nivel Clínico Estable:</b> Los rangos metabólicos evaluados por el algoritmo se encuentran dentro de las metas seguras fijadas por el MINSA.
            </div>
        `;
    }
}

/* ==========================================================================
   MÓDULO DE CONTACTOS (Formulario de Soporte)
   ========================================================================== */

function initContactosModulo() {
    const formulario = document.getElementById('c-form');
    if (formulario) {
        formulario.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita que la página se recargue
            
            const msgOk = document.getElementById('msg-ok');
            if (msgOk) {
                msgOk.classList.remove('hidden');
                
                // Ocultar el mensaje automáticamente después de 4 segundos
                setTimeout(() => {
                    msgOk.classList.add('hidden');
                }, 4000);
            }
            
            formulario.reset(); // Limpia los inputs del formulario
        });
    }
}