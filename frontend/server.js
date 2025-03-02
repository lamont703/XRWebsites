import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.VITE_PORT || 8080;

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set proper MIME types
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    // Set correct MIME type for JavaScript modules
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Set correct MIME type for CSS
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Handle all routes by serving the index.html file
/*app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});*/
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});