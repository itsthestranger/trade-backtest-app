# Trade Backtesting Application

A comprehensive trade backtesting, tracking, review, and journaling application built with React, Material-UI, and Electron with SQLite for local data storage.

## Features

### General Features
- **Local Database**: All data is stored locally in an SQLite database
- **Modern UI**: Clean, responsive interface built with Material-UI
- **Backup & Restore**: Easy database backup and restore functionality

### Dashboard
- View key performance indicators (KPIs) including:
  - Total trades and total result in R
  - Winners, expenses, and break-evens
  - "Chicken Out" trades and missed R
  - Winrate and average metrics
- Weekly metrics visualization

### Trades
- Track live trades with comprehensive data fields
- Document trades with confluences, journal entries, and body/mind state
- Advanced trade planner with:
  - Entry heatmap based on backtest data
  - Confluences checklist
  - Body & Mind check
  - Playbook heatmap integration
  - Position size calculator

### Backtest
- Manage backtest sessions
- Track and analyze backtested trades
- Comprehensive filtering options
- Documentation view and performance reports

### Playbooks
- Create playbooks for different instruments
- Track retracement and extension clusters, time ranges
- View in table or visual format

### Settings
- Configure instruments with tick values and colors
- Manage entry methods with descriptions
- Set up trading accounts with risk profiles
- Define confluences and minimum requirements

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Clone the repository:
```
git clone https://github.com/yourusername/trade-backtesting-app.git
cd trade-backtesting-app
```

2. Install dependencies:
```
npm install
```

3. Run the development version:
```
npm run electron-dev
```

4. Build for production:
```
npm run electron-pack
```

## Database Structure

The application uses SQLite to store all data locally. Main tables include:

- **Instruments**: Trading instruments with tick values
- **Entry Methods**: Methods used to enter trades
- **Accounts**: Trading accounts with size and risk parameters
- **Confluences**: Trading confluences for decision-making
- **Trades**: Full trade details and metrics
- **Backtests**: Backtest sessions with trades
- **Playbooks**: Instrument-specific playbooks
- **Filters**: Saved filters for trade analysis

## Project Structure

```
trade-backtesting-app/
├── public/               # Static files
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── trades/       # Trades components
│   │   ├── backtest/     # Backtest components
│   │   ├── playbooks/    # Playbooks components
│   │   └── settings/     # Settings components
│   ├── database/         # Database modules
│   │   ├── models/       # Database models
│   │   └── migrations/   # Database migrations
│   ├── utils/            # Utility functions
│   ├── contexts/         # React contexts
│   ├── App.jsx           # Main app component
│   └── index.jsx         # Entry point
└── package.json          # Package configuration
```

## Usage

### Dashboard
The dashboard provides an overview of your trading performance with various metrics and visualizations.

### Trades
Track your live trades, document them with confluences and journal entries, and use the trade planner to make informed decisions.

### Backtest
Create backtest sessions, add trades, and analyze your performance with detailed reports.

### Playbooks
Set up playbooks for different instruments with retracement and extension levels, time clusters, and more.

### Settings
Configure your trading environment with instruments, entry methods, accounts, and confluences.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.