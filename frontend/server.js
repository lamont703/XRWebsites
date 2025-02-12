import express from 'express';
import path from 'path';

const app = express();
const port = process.env.VITE_PORT || 8080;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});