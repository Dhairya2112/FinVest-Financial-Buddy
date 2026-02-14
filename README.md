# FinVest - Personal Financial Management System

<p align="center">
  <img src="https://img.shields.io/badge/Flask-2.3.2-blue?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3" alt="CSS3">
  <img src="https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap" alt="Bootstrap">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

> A comprehensive personal financial management web application built with Flask. Track your income, expenses, investments, and budgets all in one place.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login system with secure password hashing
- Session-based authentication
- Admin panel for user management

### 💰 Transaction Management
- Track income and expenses with detailed categories
- Add, edit, and delete transactions
- Filter and search by category, date range, or amount
- Sort transactions by date, amount, or category

### 📊 Portfolio Management
- Track investments across multiple asset types (stocks, bonds, crypto, real estate, gold, cash, vehicles)
- Real-time P&L (Profit/Loss) calculation
- Portfolio value history tracking
- Asset allocation visualization with pie charts
- Portfolio growth charts and trend analysis
- Risk analysis and diversification scoring

### 💵 Budget Management
- Set monthly budget limits
- Category-based budget allocation
- Visual budget vs. actual spending comparison
- Progress bars for budget tracking
- Alerts when approaching budget limits

### 🎉 Event-Based Budgeting
- Create isolated budgets for special events (weddings, vacations, parties)
- Date range-based expense tracking
- Separate budget management per event
- Event-specific transaction logging
- View event performance in isolation

### 📈 Reports & Analytics
- Expense breakdown by category (interactive pie charts)
- Income analysis by source (bar charts)
- Monthly trends visualization
- Net cash flow tracking
- Interactive dashboard with real-time data

### 🎨 Modern UI/UX
- Beautiful glassmorphism design
- Dark/Light mode toggle
- Fully responsive design (mobile-friendly)
- Interactive charts and visualizations
- Intuitive navigation sidebar
- Smooth transitions and animations

---

## 🛠 Tech Stack

### Backend
- **Framework:** Flask 2.3.2
- **Database:** MySQL 8.0+
- **Libraries:** mysql-connector-python, Werkzeug, Matplotlib, NumPy

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with glassmorphism design
- **Bootstrap 5** - Responsive grid system and components
- **JavaScript (ES6+)** - Interactive functionality
- **Jinja2** - Template engine (Flask built-in)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd finvest

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up database
mysql -u root -p < database/finvest.sql

# Run the application
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

---

## 📂 Project Structure

```
finvest/
├── app.py                      # Main application entry point
├── db.py                       # Database connection and utilities
├── models.py                   # Data models and business logic
├── validators.py               # Input validation utilities
├── requirements.txt            # Python dependencies
├── database/
│   └── finvest.sql            # Database schema and sample data
├── routes/
│   ├── __init__.py            # Routes package initialization
│   ├── admin.py               # Admin panel routes
│   ├── auth.py                # Authentication routes (login/register)
│   ├── budget.py              # Budget management routes
│   ├── dashboard.py           # Dashboard routes
│   ├── events.py              # Event-based budgeting routes
│   ├── portfolio.py           # Portfolio management routes
│   ├── reports.py             # Reports and analytics routes
│   └── tracker.py             # Transaction tracking routes
├── static/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   └── js/
│       ├── dashboard.js      # Dashboard JavaScript
│       ├── portfolio.js      # Portfolio management JavaScript
│       ├── theme.js          # Theme toggle (dark/light mode)
│       └── tracker.js        # Transaction tracker JavaScript
└── templates/
    ├── admin/
    │   ├── dashboard.html    # Admin dashboard
    │   ├── layout.html        # Admin layout template
    │   └── users.html         # User management page
    ├── base.html              # Base template
    ├── budget.html            # Budget management page
    ├── dashboard.html         # Main dashboard
    ├── edit_event.html        # Edit event page
    ├── event_detail.html      # Event detail page
    ├── events.html            # Event management page
    ├── intro.html             # Landing/intro page
    ├── login.html             # Login page
    ├── portfolio.html         # Portfolio view page
    ├── profile.html           # User profile page
    ├── register.html          # Registration page
    ├── reports.html           # Reports and analytics page
    └── tracker.html           # Transaction tracker page
```

---

## 📖 Usage

1. **Register** a new account
2. **Add income** sources
3. **Track expenses** with categories
4. **Set budgets** for spending limits
5. **Monitor investments** in the portfolio

### Default Routes

| Page | URL |
|------|-----|
| Home | `/` |
| Login | `/auth/login` |
| Register | `/auth/register` |
| Dashboard | `/dashboard` |
| Tracker | `/tracker` |
| Portfolio | `/portfolio` |
| Budget | `/budget` |
| Reports | `/reports` |

---

## 📄 License

MIT License - See LICENSE file for details.

---

<p align="center">
  Made with ❤️ for personal finance management
</p>
