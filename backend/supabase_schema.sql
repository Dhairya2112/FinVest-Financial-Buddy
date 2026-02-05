-- FinVest Supabase PostgreSQL Schema
-- This replaces the old MySQL database. Paste this into the Supabase SQL Editor and hit 'Run'.

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,          -- Encrypted via AES-256 in Python
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount TEXT NOT NULL,        -- Encrypted string representing a float
    type VARCHAR(50) NOT NULL,   -- 'income' or 'expense'
    date DATE NOT NULL,
    category TEXT NOT NULL,      -- Encrypted string
    description TEXT,            -- Encrypted string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Budgets Table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    monthly_budget TEXT NOT NULL, -- Encrypted float
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Category Budgets Table
CREATE TABLE category_budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    monthly_budget TEXT NOT NULL, -- Encrypted float
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- 5. Portfolio Assets Table
CREATE TABLE portfolio_assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- Encrypted
    symbol TEXT NOT NULL,        -- Encrypted
    asset_type VARCHAR(100),
    current_price TEXT NOT NULL, -- Encrypted
    quantity TEXT NOT NULL,      -- Encrypted
    purchase_price TEXT NOT NULL,-- Encrypted
    purchase_date DATE,
    total_value TEXT NOT NULL,   -- Encrypted
    total_cost TEXT NOT NULL,    -- Encrypted
    unrealized_pl TEXT NOT NULL, -- Encrypted
    unrealized_pl_percent TEXT NOT NULL, -- Encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Portfolio History Table
CREATE TABLE portfolio_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES portfolio_assets(id) ON DELETE CASCADE,
    price TEXT NOT NULL,         -- Encrypted
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Events Table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- Encrypted
    exclude_from_main_budget BOOLEAN DEFAULT FALSE,
    budget TEXT,                 -- Encrypted
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Event Transactions Table
CREATE TABLE event_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    amount TEXT NOT NULL,        -- Encrypted
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,      -- Encrypted
    description TEXT,            -- Encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_portfolio_user_id ON portfolio_assets(user_id);
CREATE INDEX idx_events_user_id ON events(user_id);

-- 9. OTP Requests Table (Passwordless Auth)
CREATE TABLE otp_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_otp_email ON otp_requests(email);
