-- Database Schema for Trade Backtesting App

-- Instruments Table
CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    tick_value REAL NOT NULL,
    color TEXT NOT NULL
);

-- Entry Methods Table
CREATE TABLE IF NOT EXISTS entry_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT NOT NULL
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    size REAL NOT NULL,
    risk_per_r REAL NOT NULL,
    color TEXT NOT NULL
);

-- Confluences Table
CREATE TABLE IF NOT EXISTS confluences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    min_confluences INTEGER NOT NULL DEFAULT 3
);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    day TEXT NOT NULL,
    confirmation_time TEXT NOT NULL,
    entry_time TEXT NOT NULL,
    instrument_id INTEGER NOT NULL,
    confirmation_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    session TEXT NOT NULL,
    entry_method_id INTEGER NOT NULL,
    stopped_out BOOLEAN NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    ret_entry REAL,
    sd_exit REAL,
    entry REAL NOT NULL,
    stop REAL NOT NULL,
    target REAL NOT NULL,
    exit REAL,
    stop_ticks REAL NOT NULL,
    pot_result REAL NOT NULL,
    result REAL,
    preparation INTEGER,
    entry_score INTEGER,
    stop_loss INTEGER,
    target_score INTEGER,
    management INTEGER,
    rules INTEGER,
    average REAL,
    planned_executed TEXT NOT NULL DEFAULT 'Planned',
    account_id INTEGER,
    FOREIGN KEY (instrument_id) REFERENCES instruments (id),
    FOREIGN KEY (entry_method_id) REFERENCES entry_methods (id),
    FOREIGN KEY (account_id) REFERENCES accounts (id)
);

-- Trade Documentation Table
CREATE TABLE IF NOT EXISTS trade_documentation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL,
    trade_journal TEXT,
    body_mind_state TEXT,
    FOREIGN KEY (trade_id) REFERENCES trades (id) ON DELETE CASCADE
);

-- Trade Confluences Junction Table
CREATE TABLE IF NOT EXISTS trade_confluences (
    trade_id INTEGER NOT NULL,
    confluence_id INTEGER NOT NULL,
    PRIMARY KEY (trade_id, confluence_id),
    FOREIGN KEY (trade_id) REFERENCES trades (id) ON DELETE CASCADE,
    FOREIGN KEY (confluence_id) REFERENCES confluences (id)
);

-- Backtests Table
CREATE TABLE IF NOT EXISTS backtests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Backtest Confluences Junction Table
CREATE TABLE IF NOT EXISTS backtest_confluences (
    backtest_id INTEGER NOT NULL,
    confluence_id INTEGER NOT NULL,
    PRIMARY KEY (backtest_id, confluence_id),
    FOREIGN KEY (backtest_id) REFERENCES backtests (id) ON DELETE CASCADE,
    FOREIGN KEY (confluence_id) REFERENCES confluences (id)
);

-- Filters Table
CREATE TABLE IF NOT EXISTS filters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    date_from TEXT,
    date_to TEXT,
    session TEXT,
    instrument_id INTEGER,
    entry_method_id INTEGER,
    account_id INTEGER,
    average_metrics_from REAL,
    average_metrics_to REAL,
    confluences_logic TEXT,
    execution_status TEXT,
    confirmation_type TEXT,
    direction TEXT,
    status TEXT,
    days TEXT,
    stop_ticks_from REAL,
    stop_ticks_to REAL,
    FOREIGN KEY (instrument_id) REFERENCES instruments (id),
    FOREIGN KEY (entry_method_id) REFERENCES entry_methods (id),
    FOREIGN KEY (account_id) REFERENCES accounts (id)
);

-- Filter Confluences Junction Table
CREATE TABLE IF NOT EXISTS filter_confluences (
    filter_id INTEGER NOT NULL,
    confluence_id INTEGER NOT NULL,
    PRIMARY KEY (filter_id, confluence_id),
    FOREIGN KEY (filter_id) REFERENCES filters (id) ON DELETE CASCADE,
    FOREIGN KEY (confluence_id) REFERENCES confluences (id)
);

-- Playbooks Table
CREATE TABLE IF NOT EXISTS playbooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instrument_id INTEGER NOT NULL,
    FOREIGN KEY (instrument_id) REFERENCES instruments (id) ON DELETE CASCADE
);

-- Playbook Entries Table
CREATE TABLE IF NOT EXISTS playbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playbook_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    direction TEXT NOT NULL,
    confirmation_time TEXT NOT NULL,
    mode_time_start TEXT,
    mode_time_end TEXT,
    time_cl_1_start TEXT,
    time_cl_1_end TEXT,
    ret_median_time TEXT,
    dropoff_time TEXT,
    ret_cluster_1_start REAL,
    ret_cluster_1_end REAL,
    ret_cluster_2_start REAL,
    ret_cluster_2_end REAL,
    ret_cluster_3_start REAL,
    ret_cluster_3_end REAL,
    ext_median_time TEXT,
    ext_cluster_1_start REAL,
    ext_cluster_1_end REAL,
    ext_cluster_2_start REAL,
    ext_cluster_2_end REAL,
    FOREIGN KEY (playbook_id) REFERENCES playbooks (id) ON DELETE CASCADE
);

-- Seed standard entry methods
INSERT OR IGNORE INTO entry_methods (name, description, color) VALUES
    ('Mode Time – Max Retracement', 'Entry at maximum retracement during mode time', '#4CAF50'),
    ('Mode Time M7 Retracement', 'Entry at M7 retracement during mode time', '#2196F3'),
    ('Time Cluster 1', 'Entry during first time cluster', '#FF9800'),
    ('Time Cluster 2', 'Entry during second time cluster', '#F44336'),
    ('Time Cluster 3', 'Entry during third time cluster', '#9C27B0'),
    ('Median Time', 'Entry at median time', '#673AB7'),
    ('Retracement Cluster 1 – Max Retracement', 'Entry at maximum retracement during first cluster', '#3F51B5'),
    ('Retracement Cluster 2 – Max Retracement', 'Entry at maximum retracement during second cluster', '#2196F3'),
    ('Retracement Cluster 3 – Max Retracement', 'Entry at maximum retracement during third cluster', '#03A9F4'),
    ('Retracement Cluster 1 – M7 Retracement', 'Entry at M7 retracement during first cluster', '#00BCD4'),
    ('Retracement Cluster 2 – M7 Retracement', 'Entry at M7 retracement during second cluster', '#009688'),
    ('Retracement Cluster 3 – M7 Retracement', 'Entry at M7 retracement during third cluster', '#4CAF50'),
    ('Percentage Cluster 1 – Max Retracement', 'Entry at maximum retracement percentage during first cluster', '#8BC34A'),
    ('Percentage Cluster 2 – Max Retracement', 'Entry at maximum retracement percentage during second cluster', '#CDDC39'),
    ('Percentage Cluster 3 – Max Retracement', 'Entry at maximum retracement percentage during third cluster', '#FFEB3B'),
    ('Percentage Cluster 1 – M7 Retracement', 'Entry at M7 retracement percentage during first cluster', '#FFC107'),
    ('Percentage Cluster 2 – M7 Retracement', 'Entry at M7 retracement percentage during second cluster', '#FF9800'),
    ('Percentage Cluster 3 – M7 Retracement', 'Entry at M7 retracement percentage during third cluster', '#FF5722'),
    ('Retirement Setup', 'Entry based on retirement setup criteria', '#795548'),
    ('TDRC Rejection + Retracement Cluster', 'Entry based on TDRC rejection with retracement cluster', '#9E9E9E'),
    ('7IB Rejection + Retracement Cluster', 'Entry based on 7IB rejection with retracement cluster', '#607D8B'),
    ('Range Contraction Model', 'Entry based on range contraction model', '#E91E63'),
    ('Range Expansion Model', 'Entry based on range expansion model', '#9C27B0'),
    ('Range Contraction + Expansion Model', 'Entry combining contraction and expansion models', '#673AB7'),
    ('Turnaround Thursday', 'Specific entry strategy for Thursdays', '#3F51B5'),
    ('WDR Rejection', 'Entry based on WDR rejection', '#2196F3'),
    ('Monkey', 'Entry based on Monkey strategy', '#03A9F4'),
    ('Goldfish', 'Entry based on Goldfish strategy', '#00BCD4');

-- Seed standard confluences
INSERT OR IGNORE INTO confluences (name) VALUES
    ('Weekly DRCs'),
    ('Weekly DRC Open'),
    ('Weekly DRC Mid'),
    ('Other DRCs (DR, IDR, Mid, Open)'),
    ('DR Open Price'),
    ('DR Mid Price'),
    ('Upside Expansion'),
    ('Downside Expansion'),
    ('Range Expansion'),
    ('Contraction Model'),
    ('ASS Direction'),
    ('Opening Gap'),
    ('Open/Magnetic VIB/GIB'),
    ('Turnaround Thursday'),
    ('Respected VIB/GIB'),
    ('Time'),
    ('Retracement Cluster'),
    ('Confirmation Candle not broken yet'),
    ('Outside M7 Box'),
    ('Tick Grid Divergence'),
    ('DR Close Price'),
    ('M7IB Special'),
    ('7IB');

-- Initial settings
INSERT OR IGNORE INTO settings (id, min_confluences) VALUES (1, 3);