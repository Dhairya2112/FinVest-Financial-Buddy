# 💰 FinVest-Financial Buddy

A comprehensive web-based personal finance management application built with Flask, featuring transaction tracking, portfolio management, budgeting, and detailed financial reports with interactive charts. The project integrates MySQL for database management, applies modern web development practices, and follows clean architecture principles.

The system manages financial transactions, investment portfolios, budgets, special events, and generates insightful financial analytics with persistent database storage.

## 📌 Project Objectives

- Manage personal finances using modern web technologies
- Apply data visualization for financial insights
- Store and retrieve financial data using MySQL
- Provide intuitive user experience with glassmorphism design

## 🚀 Project Features

### 💰 Transaction Management
- **Income & Expense Tracking**: Record and categorize all financial transactions
- **Advanced Filtering**: Search, filter, and sort transactions by date, amount, category, and description
- **Real-time Updates**: Add, edit, and delete transactions with instant updates

### 📊 Portfolio Management
- **Asset Tracking**: Monitor stocks, cryptocurrencies, mutual funds, and other investments
- **Performance Analytics**: Track unrealized gains/losses and portfolio growth
- **Price History**: Automatic price tracking and historical data

### 💵 Budgeting & Planning
- **Monthly Budgets**: Set and monitor monthly spending limits
- **Category Budgets**: Allocate budgets to specific expense categories
- **Budget Alerts**: Get notifications when approaching or exceeding limits
- **Spending Analysis**: Detailed breakdown of expenses by category

### 📅 Event-Based Budgeting
- **Special Events**: Create isolated budgets for vacations, weddings, or other events
- **Event Transactions**: Track expenses specific to events
- **Date Range Management**: Set start and end dates for event budgeting

### 📈 Reports & Analytics
- **Interactive Charts**: Beautiful matplotlib-generated charts with glassmorphism theme
- **Financial Reports**: Income vs expenses, net balance, and cash flow trends
- **Category Analysis**: Pie charts and bar graphs for spending patterns
- **Monthly Trends**: Historical financial data visualization

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Modern, translucent UI with backdrop blur effects
- **Dark/Light Mode**: Automatic theme switching with system preference detection
- **Responsive Design**: Fully responsive across all devices
- **Smooth Animations**: Subtle hover effects and transitions

## 🗄️ Database Features
- **Persistent Storage**: Using MySQL database
- **Relational Design**: Well-structured database schema
- **SQL Operations**: Complex queries for financial calculations
- **Data Integrity**: Foreign keys and constraints

## 🛠️ Technology Stack

| Technology | Description |
|------------|-------------|
| **Python Flask** | Core web application framework |
| **MySQL** | Relational database management |
| **Bootstrap 5.1.3** | CSS framework for responsive design |
| **HTML5/CSS3** | Frontend markup and styling |
| **JavaScript** | Client-side interactivity |
| **Matplotlib** | Chart generation and visualization |
| **Jinja2** | Template engine |
| **Werkzeug** | WSGI utility library |
| **Font Awesome** | Icon library |

## 🧠 Key Concepts Applied

### Data Structures & Algorithms
- **Array Operations**: Handling transaction lists and portfolio data
- **Sorting Algorithms**: Transaction sorting by date, amount, category
- **Search Algorithms**: Filtering and searching financial data
- **Aggregation**: Calculating totals, averages, and financial metrics

### Software Architecture
- **MVC Pattern**: Model-View-Controller architecture with Flask
- **Blueprint Organization**: Modular route organization
- **Separation of Concerns**: Clean separation between models, views, and controllers
- **Database Abstraction**: Clean database layer with connection pooling

## 🗄️ Database Design (SQL)

### Database Used
- **MySQL**

### SQL File
- `database/finvest.sql`

### Tables Store
- **Users**: User authentication and profile data
- **Transactions**: Income and expense records
- **Portfolio Assets**: Investment holdings and performance
- **Budgets**: Monthly and category budget settings
- **Category Budgets**: Detailed category-wise budgets
- **Events**: Special event budgeting
- **Event Transactions**: Event-specific expenses

### SQL Concepts Used
- `CREATE TABLE` with constraints
- `INSERT`, `UPDATE`, `DELETE` operations
- `JOIN` queries for complex data retrieval
- `GROUP BY` and aggregation functions
- `FOREIGN KEY` relationships
- `INDEX` for performance optimization

The Flask application connects to MySQL using mysql-connector-python.

## 📂 Project File Structure

```
finvest/
│
├── app.py                    # Main Flask application & route registration
├── models.py                 # Database models & business logic (User, Transaction, Portfolio, etc.)
├── db.py                     # Database connection & query utilities
├── validators.py             # Input validation functions
├── requirements.txt          # Python dependencies
│
├── database/
│   └── finvest.sql           # MySQL database schema & initial data
│
├── routes/                   # Flask blueprints (modular routing)
│   ├── __init__.py          # Blueprint initialization
│   ├── auth.py              # User authentication (login/register)
│   ├── dashboard.py         # Main dashboard & overview
│   ├── tracker.py           # Transaction management
│   ├── portfolio.py         # Investment portfolio tracking
│   ├── budget.py            # Budget setting & monitoring
│   ├── events.py            # Event-based budgeting
│   ├── reports.py           # Financial reports & analytics
│
├── static/                   # Static assets (CSS, JS, images)
│   ├── css/
│   │   └── style.css        # Main stylesheet with glassmorphism theme
│   └── js/
│       ├── dashboard.js     # Dashboard interactivity & widgets
│       ├── portfolio.js     # Portfolio management scripts
│       ├── theme.js         # Dark/light mode switching
│       └── tracker.js       # Transaction form handling
│
└── templates/                # Jinja2 HTML templates
    ├── base.html            # Base template with navigation & layout
    ├── login.html           # User login page
    ├── register.html        # User registration page
    ├── dashboard.html       # Financial overview dashboard
    ├── tracker.html         # Transaction tracker interface
    ├── portfolio.html       # Portfolio management view
    ├── budget.html          # Budget setting & monitoring
    ├── reports.html         # Financial reports & charts
    ├── events.html          # Event management interface
    ├── edit_event.html      # Event editing form
    ├── event_detail.html    # Event details view
    └── profile.html         # User profile management
```

## 📋 Prerequisites

- Python 3.8 or higher
- MySQL Server 8.0+
- pip (Python package manager)
- Git (for cloning repository)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/finvest.git
cd finvest
```

### 2. Create Virtual Environment
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Database Setup
```bash
# Start MySQL service (if using XAMPP or similar)
# Create database
mysql -u root -p
CREATE DATABASE finvest;
EXIT;

# Import database schema
mysql -u root -p finvest < database/finvest.sql
```

### 5. Configure Database Connection
Update database credentials in `db.py`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_mysql_password',
    'database': 'finvest'
}
```

### 6. Run the Application
```bash
python app.py
```

## 📊 Usage Guide

### Getting Started
1. **Register Account**: Create a new user account
2. **Add Transactions**: Record your income and expenses
3. **Set Budget**: Define monthly spending limits
4. **Track Investments**: Add your portfolio assets
5. **View Analytics**: Analyze financial data with charts

### Core Features

#### 💰 Transaction Tracking
- Navigate to **Transaction Tracker**
- Add income/expense transactions with categories
- Use advanced filters and search functionality
- Sort transactions by date, amount, or category

#### 📊 Portfolio Management
- Access **Portfolio** section
- Add investment assets with purchase details
- Monitor real-time performance and P/L
- View risk analysis and diversification scores

#### 💵 Budget Management
- Visit **Budget** page
- Set overall monthly budget
- Allocate budgets to specific categories
- Track spending vs. budget with alerts

#### 📈 Financial Reports
- Explore **Reports** section
- View interactive matplotlib charts
- Analyze spending patterns and trends
- Monitor cash flow and net balance

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## 👨‍💻 Developer

**Dhairya Dave** - Software Developer
- GitHub: [@Dhairya2112](https://github.com/Dhairya2112)
- Email: davedhairya21@gmail.com

## 🙏 Acknowledgments

- **Flask Framework**: Robust web development
- **Matplotlib**: Powerful data visualization
- **MySQL**: Reliable database management
- **Bootstrap Components**: UI consistency
- **Font Awesome**: Beautiful iconography
- **Google Fonts**: Modern typography

**Made with ❤️ for smarter financial management**

