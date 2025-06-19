# 📊 Scrollr - Real-Time Browser Extension Ticker

<div align="center">

![Scrollr Logo](https://img.shields.io/badge/Scrollr-v2.0.0--beta.1-blue?style=for-the-badge)
[![MPL-2.0 License](https://img.shields.io/badge/License-MPL2.0-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mpl-2.0/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge)](https://github.com/brandon-relentnet/wxt-extension-template)

**A modern, high-performance browser extension for displaying real-time financial, sports, and custom data tickers across your browser tabs.**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🛠️ Development](#️-development) • [🤝 Contributing](#-contributing)

</div>

## ✨ Features

### 🎯 Core Functionality
- **Real-Time Data Streaming** - Live financial markets, sports scores, and custom data feeds
- **Multi-Source Integration** - Stocks, crypto, forex, sports, and custom API endpoints
- **Cross-Browser Support** - Chrome, Firefox, Edge, and other WebExtension-compatible browsers
- **Responsive Design** - Optimized for all screen sizes and tab widths
- **Performance Optimized** - <100ms response times with efficient memory usage

### 💼 Financial Data
- **Stock Market Tickers** - Real-time stock prices, volume, and market indicators
- **Cryptocurrency Tracking** - Live crypto prices, market cap, and trading volumes
- **Forex Rates** - Currency exchange rates with historical data
- **Custom Portfolios** - Track your investments with personalized watchlists
- **Market Analysis** - Technical indicators and trend analysis

### 🏆 Sports Integration
- **Live Scores** - Real-time game scores and updates
- **Multiple Sports** - NFL, NBA, MLB, NHL, Soccer, and more
- **Game Statistics** - Detailed stats, player performance, and game insights
- **Schedule Tracking** - Upcoming games and event calendars
- **Team Customization** - Follow your favorite teams and leagues

### 📡 RSS Feed Management
- **Custom RSS Feeds** - Add and manage personal RSS subscriptions
- **Authentication Required** - Secure feed management with user accounts
- **Multi-Format Support** - RSS 2.0 and Atom feed compatibility
- **Auto-Refresh** - Feeds update automatically every 5 minutes
- **Category Organization** - Organize feeds by category (Tech, News, Sports, etc.)
- **Reliable Fetching** - Multiple CORS proxy fallbacks for maximum uptime
- **Real-Time Display** - RSS articles appear seamlessly in the ticker carousel

### 🎮 Fantasy Sports Integration
- **Coming Soon** - Yahoo, ESPN, Sleeper, and CBS integrations
- **League Management** - Track multiple fantasy leagues
- **Player Statistics** - Real-time player performance data
- **Matchup Alerts** - Notifications for important lineup decisions

### 👤 User Management
- **Secure Authentication** - JWT-based login system with PostgreSQL backend
- **User Profiles** - Customizable user accounts with preferences
- **Settings Synchronization** - Automatic cross-device sync of all preferences
- **Cloud Storage** - Server-side settings backup with local fallback
- **Privacy First** - Optional account creation, local-only mode available
- **Role-Based Access** - Admin and user permission levels

### 🎨 Customization
- **Theme System** - Multiple built-in themes with custom color schemes
- **Layout Options** - Compact/comfort modes with flexible ticker sizing
- **Speed Control** - Three-speed ticker animation (slow/classic/fast)
- **Position Control** - Top or bottom browser positioning with smooth transitions
- **Display Modes** - Carousel scrolling with responsive breakpoints
- **Settings Management** - Export/import settings with backup functionality
- **Data Privacy** - Local storage management and comprehensive data clearing

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 12+ (for user accounts)
- **Modern Browser** with WebExtension support

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/brandon-relentnet/scrollr.git
   cd scrollr
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Database** (Optional - for user accounts)
   ```bash
   # Create PostgreSQL database
   createdb extension_accounts
   
   # Navigate to backend directory
   cd backend/accounts
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start Development Server**
   ```bash
   # Main extension development
   npm run dev
   
   # Authentication backend (separate terminal)
   cd backend/accounts && npm run dev
   ```

5. **Load Extension**
   - **Chrome**: Navigate to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select the `dist` folder
   - **Firefox**: Navigate to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select any file in the `dist` folder

## 📖 Documentation

### 🏗️ Architecture

Scrollr is built on a modern, scalable architecture designed for performance and maintainability:

```
scrollr/
├── src/entrypoints/          # Extension entry points
│   ├── popup/               # Main popup interface
│   ├── iframe/              # Content display iframe
│   └── store/               # Redux state management
├── backend/accounts/        # Authentication backend
├── public/                  # Static assets
└── dist/                   # Built extension files
```

### 🔧 Core Technologies

- **[WXT Framework](https://wxt.dev/)** - Modern WebExtension development framework
- **[React 19](https://react.dev/)** - Component-based UI with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - Predictable state management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[DaisyUI](https://daisyui.com/)** - Beautiful component library
- **[PostgreSQL](https://www.postgresql.org/)** - Robust database backend
- **[Express.js](https://expressjs.com/)** - RESTful API server

### 🎯 Key Components

#### State Management (`src/entrypoints/store/`)
- **financeSlice.js** - Financial data state with Redux Toolkit
- **layoutSlice.js** - Speed, position, and layout mode state management
- **powerSlice.js** - Extension visibility and power controls
- **rssSlice.js** - RSS feed management and selection state
- **Optimized Actions** - Efficient state updates for real-time data
- **Persistence** - Automatic state persistence across sessions

#### UI Components (`src/entrypoints/popup/`)
- **DisplayTab.jsx** - Main ticker display and data source toggles
- **PowerTab.jsx** - Quick settings for speed, position, and layout controls
- **AccountsTab.tsx** - User authentication and profile management
- **SettingsTab.tsx** - Settings backup/restore and privacy management
- **ThemeTab.tsx** - Theme customization controls
- **Responsive Design** - Mobile-first approach with desktop optimization

#### Data Layer (`src/entrypoints/iframe/`)
- **useFinanceData.js** - Real-time data fetching with WebSocket connections
- **useRssData.js** - RSS feed fetching with multiple CORS proxy fallbacks
- **GameCard.jsx** - Sports data display with performance optimization
- **TradeCard.jsx** - Financial data display with memoization
- **RssCard.jsx** - RSS article display with compact/comfort modes
- **Carousel.jsx** - Variable-speed scrolling ticker with responsive breakpoints
- **content.ts** - Dynamic iframe positioning and visibility management

#### Backend (`backend/accounts/`)
- **JWT Authentication** - Secure token-based authentication
- **PostgreSQL Integration** - Scalable user data storage with settings sync
- **Settings API** - GET/POST endpoints for cross-device settings synchronization
- **RSS Feed API** - CRUD endpoints for user RSS feed management
- **RESTful APIs** - Clean, documented API endpoints
- **Security Features** - bcrypt hashing, CORS protection, input validation
- **Data Management** - JSONB storage for flexible settings with UPSERT operations

#### Authentication & Sync (`src/entrypoints/popup/hooks/`)
- **useAuth.tsx** - Complete authentication and settings sync management
- **useRssFeeds.tsx** - RSS feed management with server API integration
- **Automatic Sync** - Debounced settings save (2s delay) when logged in
- **Conflict Resolution** - Server settings take precedence on login
- **Fallback Strategy** - Local storage when offline or not authenticated
- **Cross-device** - Settings sync across all browser tabs and devices

## 🛠️ Development

### Development Commands

```bash
# Development mode with hot reload
npm run dev

# Development for Firefox
npm run dev:firefox

# Build for production
npm run build

# Build for Firefox
npm run build:firefox

# Create distribution packages
npm run zip
npm run zip:firefox

# Type checking
npm run compile

# Backend development
cd backend/accounts && npm run dev
```

### 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test backend APIs
cd backend/accounts && npm test
```

### 📊 Performance Optimization

Scrollr includes several performance optimizations:

- **React.memo** - Prevent unnecessary re-renders
- **Memoized Selectors** - Efficient Redux state selection
- **WebSocket Throttling** - Optimized real-time data updates
- **Bundle Optimization** - Tree-shaking and code splitting
- **Lazy Loading** - Dynamic component loading

### 🔒 Security Features

- **JWT Token Authentication** - Secure session management
- **bcrypt Password Hashing** - Industry-standard password security
- **CORS Protection** - Cross-origin request filtering
- **Input Validation** - Comprehensive data sanitization
- **SQL Injection Prevention** - Parameterized database queries

### ⚙️ Quick Settings & Controls

Scrollr provides intuitive quick settings accessible through the Power tab:

#### 🎛️ **Speed Control**
- **Three Speed Modes**: Slow (5s intervals), Classic (3s intervals), Fast (1.5s intervals)
- **Real-time Switching**: Changes apply instantly without refresh
- **Visual Indicators**: Speed badge (S/C/F) shows current setting
- **Smooth Transitions**: Configurable animation speeds for optimal experience

#### 📍 **Position Control**
- **Flexible Positioning**: Toggle between top and bottom of browser window
- **Smooth Animations**: CSS transitions for seamless position changes
- **Smart Hiding**: Direction-aware slide animations (up/down based on position)
- **Cross-tab Sync**: Position changes apply across all browser tabs

#### 🎨 **Layout Modes**
- **Compact Mode**: Minimal 72px height for unobtrusive viewing
- **Comfort Mode**: Expanded 176px height with detailed information
- **Responsive Design**: Automatic adaptation to different screen sizes

#### 💾 **Settings Management**
- **Cloud Sync**: Automatic settings synchronization when logged in
- **Cross-device**: All preferences sync across multiple devices
- **Export/Import**: Manual backup and restore functionality
- **Privacy Controls**: Clear local storage and cached data
- **Local Fallback**: Works without account using local storage
- **Version Control**: Timestamped backups with compatibility checking

## 🚀 Deployment

### Extension Stores

1. **Chrome Web Store**
   ```bash
   npm run build
   npm run zip
   # Upload dist.zip to Chrome Web Store Developer Dashboard
   ```

2. **Firefox Add-ons**
   ```bash
   npm run build:firefox
   npm run zip:firefox
   # Upload dist-firefox.zip to Firefox Developer Hub
   ```

### Backend Deployment

1. **Production Environment**
   ```bash
   # Set up production database
   createdb extension_accounts_prod
   
   # Configure production environment
   cp backend/accounts/.env.example backend/accounts/.env.production
   # Edit with production credentials
   
   # Start production server
   cd backend/accounts
   NODE_ENV=production npm start
   ```

2. **Docker Deployment**
   ```bash
   # Build Docker image
   docker build -t scrollr-backend backend/accounts/
   
   # Run with Docker Compose
   docker-compose up -d
   ```

## 🤝 Contributing

We welcome contributions from the community! Scrollr is designed to be extensible and developer-friendly.

### 🎯 Contributing Guidelines

1. **Fork the Repository**
   ```bash
   git fork https://github.com/brandon-relentnet/wxt-extension-template.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Describe your changes clearly
   - Include screenshots for UI changes
   - Reference related issues

### 📋 Development Standards

- **Code Style** - ESLint + Prettier configuration
- **TypeScript** - Strict type checking enabled
- **Testing** - Jest + React Testing Library
- **Documentation** - JSDoc comments for all functions
- **Accessibility** - WCAG 2.1 compliance

### 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and extension version
- Screenshots if applicable

### 💡 Feature Requests

Have an idea? We'd love to hear it! Please include:
- Detailed description of the feature
- Use cases and benefits
- Mockups or examples if available
- Implementation suggestions
## 🚧 Coming Soon (Roadmap)

Exciting new features and enhancements are on the way!

Follow our updates for detailed release plans and progress.

## 🔗 Links

- **GitHub Repository**: [https://github.com/brandon-relentnet/wxt-extension-template](https://github.com/brandon-relentnet/wxt-extension-template)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/brandon-relentnet/wxt-extension-template/issues)
- **Chrome Web Store**: *Coming Soon*
- **Firefox Add-ons**: *Coming Soon*
- **Documentation**: [Wiki](https://github.com/brandon-relentnet/wxt-extension-template/wiki)

## 📄 License

This project is licensed under the Mozilla Public License v2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WXT Framework** - For the excellent WebExtension development experience
- **Open Source Community** - For the amazing tools and libraries
- **Contributors** - For making Scrollr better every day
- **Users** - For your feedback and support

## 💬 Support

Need help? Here are the best ways to get support:

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and community support
- **Wiki** - For detailed documentation and guides
- **Email** - For security issues and private matters

---

<div align="center">

**Built with ❤️ by [Brandon RelentNet](https://github.com/brandon-relentnet)**

*Scrollr v2.0.0-beta.1 - The future of browser-based data visualization*

[![Star on GitHub](https://img.shields.io/github/stars/brandon-relentnet/wxt-extension-template?style=social)](https://github.com/brandon-relentnet/wxt-extension-template/stargazers)
[![Follow on GitHub](https://img.shields.io/github/followers/brandon-relentnet?style=social)](https://github.com/brandon-relentnet)

</div>