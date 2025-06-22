import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as studentVueRouter } from './api/studentvue.js';
import { router as canvasRouter } from './api/canvas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.use('/api/studentvue', studentVueRouter);
app.use('/api/canvas', canvasRouter);

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
