# FinVest - Personal Financial Management System

<p align="center">
  <img src="https://img.shields.io/badge/Flask-2.3.2-blue?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

> A comprehensive personal financial management web application built with Flask. Track your income, expenses, investments, and budgets all in one place.

---

## ✨ Features

- **User Authentication** - Secure registration and login system
- **Transaction Tracking** - Track income and expenses with categories
- **Portfolio Management** - Monitor investments (stocks, crypto, real estate, etc.)
- **Budget Management** - Set monthly budgets with category-based allocation
- **Event Budgeting** - Create isolated budgets for special events
- **Reports & Analytics** - Visual charts and financial insights
- **Modern UI** - Glassmorphism design with dark/light mode

---

## 🛠 Tech Stack

- **Backend:** Flask 2.3.2
- **Database:** MySQL 8.0+
- **Libraries:** mysql-connector-python, Werkzeug, Matplotlib, NumPy

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
├── README.md                   # Project documentation
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
