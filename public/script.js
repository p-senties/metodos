// public/script.js

// Funcionalidad del acordeón
document.querySelectorAll('.accordion-button').forEach(button => {
    button.addEventListener('click', () => {
        const accordionItem = button.parentElement;
        const accordionContent = button.nextElementSibling;

        // Toggle activo/inactivo
        button.classList.toggle('active');

        if (button.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        } else {
            accordionContent.style.maxHeight = 0;
        }

        // Opcional: cerrar otros acordeones si se desea que solo uno esté abierto a la vez
        
        document.querySelectorAll('.accordion-button').forEach(otherButton => {
            if (otherButton !== button && otherButton.classList.contains('active')) {
                otherButton.classList.remove('active');
                otherButton.nextElementSibling.style.maxHeight = 0;
            }
        });
        
    });
});

// Función para calcular el polinomio de Newton
function newtonPolynomial(xPoints, yPoints, x) {
    if (xPoints.length !== yPoints.length) {
        throw new Error("Las listas de xPoints e yPoints deben tener la misma longitud.");
    }

    const n = xPoints.length;
    const coef = [...yPoints]; // Copia de yPoints para almacenar los coeficientes

    // Calcular las diferencias divididas
    for (let j = 1; j < n; j++) {
        for (let i = n - 1; i >= j; i--) {
            coef[i] = (coef[i] - coef[i - 1]) / (xPoints[i] - xPoints[i - j]);
        }
    }

    // Evaluar el polinomio en x usando Horner's method
    let result = coef[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        result = result * (x - xPoints[i]) + coef[i];
    }

    return result;
}

// Lógica del formulario
document.getElementById('newtonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores del formulario
    const xPointsInput = document.getElementById('xPoints').value;
    const yPointsInput = document.getElementById('yPoints').value;
    const xEvalInput = parseFloat(document.getElementById('xEval').value);

    // Convertir cadenas a arreglos de números
    const xPoints = xPointsInput.split(',').map(item => parseFloat(item.trim()));
    const yPoints = yPointsInput.split(',').map(item => parseFloat(item.trim()));
    const xEval = xEvalInput;

    // Validar entradas
    if (xPoints.length !== yPoints.length) {
        mostrarResultado("Las listas de X y Y deben tener la misma cantidad de elementos.", true);
        return;
    }

    // Validar que todas las entradas sean números válidos
    if (xPoints.some(isNaN) || yPoints.some(isNaN) || isNaN(xEval)) {
        mostrarResultado("Por favor, asegúrate de que todas las entradas sean números válidos.", true);
        return;
    }

    try {
        // Enviar datos al backend
        const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ xPoints, yPoints, xEval })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarResultado(`La temperatura estimada a las ${xEval} horas es ${data.result.toFixed(2)} °C.`, false);
            // Generar la gráfica
            generarGrafica(xPoints, yPoints, xEval);
        } else {
            mostrarResultado(data.error, true);
        }
    } catch (error) {
        mostrarResultado("Error al comunicarse con el servidor.", true);
    }
});

// Función para mostrar resultados con estilos
function mostrarResultado(mensaje, esError = false) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.textContent = mensaje;

    if (esError) {
        resultadoDiv.classList.remove('success');
        resultadoDiv.classList.add('error');
    } else {
        resultadoDiv.classList.remove('error');
        resultadoDiv.classList.add('success');
    }
}

// Función para generar la gráfica utilizando Chart.js
function generarGrafica(xPoints, yPoints, xEval) {
    const canvas = document.getElementById('polynomialChart');
    const ctx = canvas.getContext('2d');

    // Calcular el rango de x para la gráfica
    const xMin = Math.min(...xPoints) - 5;
    const xMax = Math.max(...xPoints) + 5;
    const step = (xMax - xMin) / 1000; // Aumentamos el número de puntos para una curva más suave

    // Generar puntos para la gráfica del polinomio
    const xValues = [];
    const yValues = [];

    for (let x = xMin; x <= xMax; x += step) {
        try {
            const y = newtonPolynomial(xPoints, yPoints, x);
            if (!isNaN(y) && isFinite(y)) { // Verificar que y es un número válido
                xValues.push(x);
                yValues.push(y);
            }
        } catch (error) {
            console.error(`Error al calcular y para x=${x}:`, error);
            continue;
        }
    }

    // Verificar que se generaron suficientes puntos
    if (xValues.length < 2) {
        mostrarResultado("No se pudo generar la gráfica correctamente.", true);
        return;
    }

    // Datos de los puntos originales
    const puntosOriginales = {
        label: 'Puntos Originales',
        data: xPoints.map((x, index) => ({ x: x, y: yPoints[index] })),
        backgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 5,
        type: 'scatter'
    };

    // Datos de la curva del polinomio
    const curvaPolinomio = {
        label: 'Polinomio de Newton',
        data: xValues.map((x, index) => ({ x: x, y: yValues[index] })),
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: false,
        tension: 0.1,
        type: 'line'
    };

    // Si ya existe una gráfica, la destruimos antes de crear una nueva
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Crear la gráfica
    canvas.chartInstance = new Chart(ctx, {
        data: {
            datasets: [curvaPolinomio, puntosOriginales]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Polinomio de Newton'
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'X'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y'
                    }
                }
            }
        }
    });

    // Mostrar el canvas con animación
    if (!canvas.classList.contains('displayed')) {
        canvas.classList.add('displayed');
        canvas.style.display = 'block';
    }
}

/* Carrusel de Imágenes de Fondo con Transiciones Suaves */
let currentImageIndex = 0;
const images = document.querySelectorAll('.carousel-slide img');
const totalImages = images.length;
const carouselIntervalTime = 5000; // Tiempo entre transiciones en milisegundos (5 segundos)

function showNextImage() {
    // Ocultar la imagen actual
    images[currentImageIndex].classList.remove('active');

    // Calcular el índice de la próxima imagen
    currentImageIndex = (currentImageIndex + 1) % totalImages;

    // Mostrar la próxima imagen
    images[currentImageIndex].classList.add('active');
}

// Iniciar el carrusel
images[currentImageIndex].classList.add('active'); // Mostrar la primera imagen

// Cambiar de imagen cada cierto tiempo
setInterval(showNextImage, carouselIntervalTime);
