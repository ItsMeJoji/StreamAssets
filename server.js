const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Path for storing Pokemon data
const POKEMON_DATA_FILE = path.join(__dirname, 'pokemonData.json');

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(POKEMON_DATA_FILE)) {
    fs.writeFileSync(POKEMON_DATA_FILE, '{}', 'utf8');
}

// API endpoint to save Pokemon data
app.post('/api/pokemon/:username', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(POKEMON_DATA_FILE, 'utf8'));
        data[req.params.username] = req.body;
        fs.writeFileSync(POKEMON_DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get Pokemon data
app.get('/api/pokemon/:username', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(POKEMON_DATA_FILE, 'utf8'));
        res.json(data[req.params.username] || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get all Pokemon data
app.get('/api/pokemon', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(POKEMON_DATA_FILE, 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});