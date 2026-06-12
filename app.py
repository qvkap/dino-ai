import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import openai
from functools import lru_cache

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='chrome-extension', static_url_path='/')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dino-ai-secret-key-2024')

# Configure CORS
CORS(app, resources={r"/ws": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    logger.warning('OPENAI_API_KEY not set. Using mock AI responses.')

# Game state storage
game_sessions = {}


class DinoAIEngine:
    """AI engine for Chrome Dino Game analysis and decision making"""
    
    def __init__(self):
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
        self.reaction_time = int(os.getenv('AI_REACTION_TIME', 50))
        self.game_history = []
        
    @lru_cache(maxsize=128)
    def analyze_game_state(self, state_json: str) -> dict:
        """Analyze current game state and decide action"""
        try:
            state = json.loads(state_json)
        except:
            return self._mock_decision()
        
        # Build prompt for AI
        prompt = self._build_analysis_prompt(state)
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert Chrome Dino Game player AI. Analyze the game state and provide JSON response with action and reasoning."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            response_text = response.choices[0].message.content
            decision = self._parse_ai_response(response_text)
            return decision
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._mock_decision()
    
    def _build_analysis_prompt(self, state: dict) -> str:
        """Build prompt for AI analysis"""
        score = state.get('score', 0)
        obstacles = state.get('obstacles', [])
        player_y = state.get('player_y', 0)
        speed = state.get('speed', 6)
        
        obstacles_desc = f"Nearest obstacles at positions: {obstacles[:3]}" if obstacles else "No obstacles detected"
        
        return f"""
Analyze this Chrome Dino Game state and decide the next action:

Current Score: {score}
Player Position Y: {player_y}
Game Speed: {speed}
{obstacles_desc}

Respond in JSON format:
{{
    "action": "jump" or "duck" or "stay",
    "confidence": 0.0-1.0,
    "reason": "brief reason",
    "advice": "optional advice for player"
}}

Be concise and decisive.
        """
    
    def _parse_ai_response(self, response_text: str) -> dict:
        """Parse AI response into action decision"""
        try:
            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                decision = json.loads(json_match.group())
                return decision
        except:
            pass
        
        return self._mock_decision()
    
    def _mock_decision(self) -> dict:
        """Return mock decision when API is unavailable"""
        return {
            "action": "stay",
            "confidence": 0.5,
            "reason": "Mock AI response",
            "advice": "Set OPENAI_API_KEY for real AI"
        }
    
    def get_statistics(self, session_id: str) -> dict:
        """Get game statistics for a session"""
        if session_id not in game_sessions:
            return {}
        
        session = game_sessions[session_id]
        history = session.get('history', [])
        
        if not history:
            return {}
        
        scores = [h.get('score', 0) for h in history]
        actions = [h.get('action', 'stay') for h in history]
        
        return {
            "total_games": len(history),
            "average_score": sum(scores) / len(scores) if scores else 0,
            "best_score": max(scores) if scores else 0,
            "action_distribution": {
                "jump": actions.count('jump'),
                "duck": actions.count('duck'),
                "stay": actions.count('stay')
            },
            "timestamp": datetime.now().isoformat()
        }


# Initialize AI engine
ai_engine = DinoAIEngine()


# Routes
@app.route('/')
def index():
    """Serve extension popup"""
    return app.send_static_file('popup.html')


@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ai_model": ai_engine.model
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """HTTP endpoint for game analysis"""
    try:
        data = request.get_json()
        game_state = json.dumps(data.get('game_state', {}))
        decision = ai_engine.analyze_game_state(game_state)
        return jsonify(decision)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 400


@app.route('/api/stats/<session_id>', methods=['GET'])
def get_stats(session_id):
    """Get statistics for a session"""
    stats = ai_engine.get_statistics(session_id)
    return jsonify(stats)


# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('response', {
        'data': 'Connected to Dino AI Server',
        'timestamp': datetime.now().isoformat()
    })


@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info(f"Client disconnected: {request.sid}")


@socketio.on('game_state')
def handle_game_state(data):
    """Handle real-time game state analysis"""
    try:
        session_id = request.sid
        
        # Initialize session if needed
        if session_id not in game_sessions:
            game_sessions[session_id] = {'history': []}
        
        # Analyze game state
        game_state = json.dumps(data.get('state', {}))
        decision = ai_engine.analyze_game_state(game_state)
        
        # Store in history
        game_sessions[session_id]['history'].append({
            'score': data.get('state', {}).get('score', 0),
            'action': decision.get('action', 'stay'),
            'timestamp': datetime.now().isoformat()
        })
        
        # Emit decision back to client
        emit('ai_decision', decision, room=request.sid)
        
    except Exception as e:
        logger.error(f"Game state handling error: {e}")
        emit('error', {'message': str(e)})


@socketio.on('start_auto_play')
def handle_auto_play(data):
    """Start auto-play mode"""
    session_id = request.sid
    if session_id not in game_sessions:
        game_sessions[session_id] = {'history': []}
    
    game_sessions[session_id]['mode'] = 'auto_play'
    emit('mode_changed', {'mode': 'auto_play', 'message': 'Auto-play mode activated'})


@socketio.on('start_advisor')
def handle_advisor(data):
    """Start advisor mode"""
    session_id = request.sid
    if session_id not in game_sessions:
        game_sessions[session_id] = {'history': []}
    
    game_sessions[session_id]['mode'] = 'advisor'
    emit('mode_changed', {'mode': 'advisor', 'message': 'Advisor mode activated'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True') == 'True'
    logger.info(f"Starting Dino AI Server on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)