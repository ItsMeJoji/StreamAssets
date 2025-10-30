from flask import Flask, send_from_directory, request, jsonify
import os
import json

app = Flask(__name__)

# Path to your StreamAssets directory
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(STATIC_DIR, 'pokemonData.json')

# Initialize empty data file if it doesn't exist
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump({}, f)

# Serve the main HTML file
@app.route('/')
@app.route('/parasocial-checker.html')
def serve_main():
    return send_from_directory(STATIC_DIR, 'parasocial-checker.html')

# Serve static files from assets directory
@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(os.path.join(STATIC_DIR, 'assets'), path)

# API endpoints for Pokemon data
@app.route('/api/pokemon/<username>', methods=['GET'])
def get_pokemon(username):
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return jsonify(data.get(username, {}))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pokemon/<username>', methods=['POST'])
def save_pokemon(username):
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        data[username] = request.json
        
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pokemon', methods=['GET'])
def get_all_pokemon():
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)