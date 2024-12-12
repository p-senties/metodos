// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Función para calcular el polinomio de Newton
function newtonPolynomial(xPoints, yPoints, xEval) {
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

    // Evaluar el polinomio en xEval usando Horner's method
    let result = coef[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        result = result * (xEval - xPoints[i]) + coef[i];
    }

    return result;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de la API para evaluar el polinomio
app.post('/api/evaluate', (req, res) => {
    try {
        const { xPoints, yPoints, xEval } = req.body;

        // Validar que los datos sean correctos
        if (!Array.isArray(xPoints) || !Array.isArray(yPoints) || typeof xEval !== 'number') {
            return res.status(400).json({ error: "Datos de entrada inválidos." });
        }

        const result = newtonPolynomial(xPoints, yPoints, xEval);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
