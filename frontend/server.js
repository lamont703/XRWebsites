import express from 'express';

const app = express();
const port = process.env.VITE_PORT || 8080;

// Serve static files from the dist directory
app.use(express.static('dist'));

app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});