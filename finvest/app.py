from flask import Flask
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.tracker import tracker_bp
from routes.portfolio import portfolio_bp
from routes.budget import budget_bp
from routes.events import events_bp
from routes.reports import reports_bp
import db

app = Flask(__name__)
app.secret_key = 'finvest'  # Set a secret key for sessions

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(tracker_bp)
app.register_blueprint(reports_bp, url_prefix='/reports')
app.register_blueprint(portfolio_bp)
app.register_blueprint(budget_bp)
app.register_blueprint(events_bp)

if __name__ == '__main__':
    app.run(debug=True)
