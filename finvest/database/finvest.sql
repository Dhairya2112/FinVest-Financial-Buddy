-- FinVest Database Schema - UPDATED FOR ADVANCED PORTFOLIO MANAGEMENT
-- Complete MySQL schema for the financial management system with P&L tracking

CREATE DATABASE IF NOT EXISTS finvest;
USE finvest;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_user_category (user_id, category)
);

-- Advanced Portfolio Assets table (replaces old portfolio table)
CREATE TABLE IF NOT EXISTS portfolio_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    asset_type ENUM('Stocks', 'Bonds', 'Cryptocurrency', 'Real Estate', 'Gold & Precious Metals', 'Cash & Savings', 'Vehicle', 'Other') NOT NULL,
    current_price DECIMAL(15,4) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    purchase_price DECIMAL(15,4) NOT NULL,
    purchase_date DATE NOT NULL,
    total_value DECIMAL(20,4) NOT NULL,
    total_cost DECIMAL(20,4) NOT NULL,
    unrealized_pl DECIMAL(20,4) NOT NULL,
    unrealized_pl_percent DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, asset_type),
    INDEX idx_user_symbol (user_id, symbol)
);

-- Portfolio History table (for growth tracking and charts)
CREATE TABLE IF NOT EXISTS portfolio_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    asset_id INT NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES portfolio_assets(id) ON DELETE CASCADE,
    INDEX idx_user_asset_date (user_id, asset_id, date_recorded)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    monthly_budget DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_budget (user_id)
);

-- Category Budgets table
CREATE TABLE IF NOT EXISTS category_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    monthly_budget DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, category),
    INDEX idx_user_category (user_id, category)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2) NULL,
    exclude_from_main_budget BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date_range (user_id, start_date, end_date)
);

-- Event Transactions table
CREATE TABLE IF NOT EXISTS event_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_date (event_id, date),
    INDEX idx_user_event (user_id, event_id)
);

-- Insert sample data for testing (only if user doesn't exist)
INSERT IGNORE INTO users (name, email, password_hash) VALUES
('dhairya', 'dhairya211206@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeXt1jQvLxW8h1Q7e');

-- Sample transactions for user 3 (dhairya) - only insert if not exists
INSERT IGNORE INTO transactions (user_id, amount, type, date, category, description) VALUES
(3, 8000.00, 'income', '2024-01-01', 'Salary', 'Monthly salary'),
(3, 2000.00, 'expense', '2024-01-02', 'Rent', 'Monthly rent'),
(3, 500.00, 'expense', '2024-01-03', 'Food', 'Groceries and dining'),
(3, 200.00, 'expense', '2024-01-04', 'Transportation', 'Car fuel and maintenance'),
(3, 150.00, 'expense', '2024-01-05', 'Entertainment', 'Movies and games'),
(3, 1000.00, 'expense', '2024-01-06', 'Bills', 'Electricity and internet'),
(3, 300.00, 'expense', '2024-01-07', 'Shopping', 'Clothing and accessories');

-- Sample portfolio assets for user 3 (dhairya) - only insert if not exists
INSERT IGNORE INTO portfolio_assets (user_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date, total_value, total_cost, unrealized_pl, unrealized_pl_percent) VALUES
(3, 'Google Inc.', 'GOOGL', 'Stocks', 140.00, 15, 120.00, '2023-11-01', 2100.00, 1800.00, 300.00, 16.67),
(3, 'Amazon.com Inc.', 'AMZN', 'Stocks', 155.00, 8, 130.00, '2023-10-15', 1240.00, 1040.00, 200.00, 19.23),
(3, 'NVIDIA Corp', 'NVDA', 'Stocks', 850.00, 3, 700.00, '2023-09-20', 2550.00, 2100.00, 450.00, 21.43),
(3, 'Cardano', 'ADA', 'Cryptocurrency', 0.45, 5000, 0.30, '2023-08-10', 2250.00, 1500.00, 750.00, 50.00),
(3, 'Solana', 'SOL', 'Cryptocurrency', 95.00, 20, 75.00, '2023-07-05', 1900.00, 1500.00, 400.00, 26.67);

-- Sample portfolio history for growth tracking (last 30 days) - only insert if not exists
INSERT IGNORE INTO portfolio_history (user_id, asset_id, price, date_recorded) VALUES
-- Google stock history
(3, 1, 135.00, '2024-01-01'), (3, 1, 137.50, '2024-01-02'), (3, 1, 139.80, '2024-01-03'), (3, 1, 140.00, '2024-01-04'),
-- Amazon stock history
(3, 2, 150.00, '2024-01-01'), (3, 2, 152.50, '2024-01-02'), (3, 2, 154.80, '2024-01-03'), (3, 2, 155.00, '2024-01-04'),
-- NVIDIA stock history
(3, 3, 820.00, '2024-01-01'), (3, 3, 835.00, '2024-01-02'), (3, 3, 845.00, '2024-01-03'), (3, 3, 850.00, '2024-01-04'),
-- Cardano history
(3, 4, 0.42, '2024-01-01'), (3, 4, 0.43, '2024-01-02'), (3, 4, 0.44, '2024-01-03'), (3, 4, 0.45, '2024-01-04'),
-- Solana history
(3, 5, 90.00, '2024-01-01'), (3, 5, 92.50, '2024-01-02'), (3, 5, 94.80, '2024-01-03'), (3, 5, 95.00, '2024-01-04');

-- Sample budget for user 3 (dhairya) - only insert if not exists
INSERT IGNORE INTO budgets (user_id, monthly_budget) VALUES
(3, 8000.00);

-- Sample category budgets for user 3 (dhairya) - only insert if not exists
INSERT IGNORE INTO category_budgets (user_id, category, monthly_budget) VALUES
(3, 'Food', 800.00),
(3, 'Transportation', 400.00),
(3, 'Entertainment', 300.00),
(3, 'Bills', 1500.00),
(3, 'Shopping', 600.00);

-- Sample events for user 3 (dhairya) - only insert if not exists
INSERT IGNORE INTO events (user_id, name, date, budget) VALUES
(3, 'Birthday Party', '2024-02-15', 500.00),
(3, 'Vacation', '2024-03-01', 2000.00),
(3, 'Home Renovation', '2024-04-10', 1500.00);
