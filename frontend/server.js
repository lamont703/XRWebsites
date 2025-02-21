import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.VITE_PORT || 8080;

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root directory
app.use(express.static(__dirname));
//app.use(express.static(path.join(__dirname, 'dist')));


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