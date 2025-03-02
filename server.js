import express from 'express';
import fetch from 'node-fetch';
import favicon from 'serve-favicon';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para servir el favicon
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/descripcion', async (req, res) => {
    const region = req.query.region;
    if (!region) {
      return res.status(400).json({ error: "Falta el parámetro 'region'" });
    }
    
    try {
      // Construir la URL de la API de Wikipedia con la región solicitada
      const wikiUrl = `https://es.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=extracts&explaintext=false&exintro&titles=${encodeURIComponent(region)}`;
      const response = await fetch(wikiUrl);
      const data = await response.json();
  
      // Acceder a las páginas devueltas
      const pages = data.query.pages;
      const pageKey = Object.keys(pages)[0];
      const page = pages[pageKey];
      
      // Si la propiedad "missing" existe, significa que no se encontró la página
      if (page.missing !== undefined) {
        return res.status(404).json({ extract: "No se encontró información para esta región." });
      }
      
      const extract = page.extract || "No se encontró información para esta región.";
      // Truncar el extracto a 500 caracteres
      let truncatedExtract = extract;
      if (extract.length > 500) {
        // Buscar el primer punto después de 500 caracteres
        const periodIndex = extract.indexOf('.', 500);
        if (periodIndex !== -1) {
          truncatedExtract = extract.slice(0, periodIndex + 1);
        } else {
          truncatedExtract = extract.slice(0, 500);
        }
      }
      
      res.status(200).json({ extract: truncatedExtract });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener datos de Wikipedia" });
    }
  });
  

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
