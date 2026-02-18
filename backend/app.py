import os
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for Next.js with credentials support
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:3001"])
from dotenv import load_dotenv

# Load from the backend directory specifically
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.tracker import tracker_bp
from routes.splitter import splitter_bp
from routes.budget import budget_bp
from routes.events import events_bp
import db

app.secret_key = os.getenv('SECRET_KEY', 'finvest-jwt-secret')

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(tracker_bp)
app.register_blueprint(splitter_bp, url_prefix='/api/splitter')
app.register_blueprint(budget_bp)
app.register_blueprint(events_bp)

@app.route('/')
def home():
    """Health check."""
    return jsonify({"status": "live", "message": "FinVest API is running."})

if __name__ == '__main__':
    app.run(debug=True)
