# 📊 Scrollr - Real-Time Browser Extension Ticker

<div align="center">

![Scrollr Logo](https://img.shields.io/badge/Scrollr-v2.0.0--beta.1-blue?style=for-the-badge)
[![MPL-2.0 License](https://img.shields.io/badge/License-MPL-2.0-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mpl-2.0/)
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

### 👤 User Management
- **Secure Authentication** - JWT-based login system with PostgreSQL backend
- **User Profiles** - Customizable user accounts with preferences
- **Data Synchronization** - Sync settings across devices
- **Privacy First** - Local data storage with optional cloud sync
- **Role-Based Access** - Admin and user permission levels

### 🎨 Customization
- **Theme System** - Multiple built-in themes with custom color schemes
- **Layout Options** - Flexible ticker positioning and sizing
- **Display Modes** - Carousel, list, grid, and custom layout modes
- **Notification Settings** - Customizable alerts and updates
- **Widget Configuration** - Drag-and-drop interface customization

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
- **Optimized Actions** - Efficient state updates for real-time data
- **Persistence** - Automatic state persistence across sessions

#### UI Components (`src/entrypoints/popup/`)
- **DisplayTab.jsx** - Main ticker display interface
- **AccountsTab.tsx** - User authentication and profile management
- **ThemeTab.tsx** - Theme customization controls
- **Responsive Design** - Mobile-first approach with desktop optimization

#### Data Layer (`src/entrypoints/iframe/`)
- **useFinanceData.js** - Real-time data fetching with WebSocket connections
- **GameCard.jsx** - Sports data display with performance optimization
- **Carousel.jsx** - Smooth scrolling ticker with dynamic breakpoints

#### Backend (`backend/accounts/`)
- **JWT Authentication** - Secure token-based authentication
- **PostgreSQL Integration** - Scalable user data storage
- **RESTful APIs** - Clean, documented API endpoints
- **Security Features** - bcrypt hashing, CORS protection, input validation

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

## 📈 Roadmap

### v2.1.0 - Enhanced Analytics
- [ ] Advanced portfolio tracking
- [ ] Custom chart visualization
- [ ] Export functionality for data
- [ ] Advanced filtering options

### v2.2.0 - Social Features
- [ ] Public ticker sharing
- [ ] Community watchlists
- [ ] Social trading insights
- [ ] User-generated content

### v2.3.0 - AI Integration
- [ ] Predictive analytics
- [ ] Smart notifications
- [ ] Automated portfolio rebalancing
- [ ] Natural language queries

### v3.0.0 - Platform Expansion
- [ ] Mobile app companion
- [ ] Desktop application
- [ ] Web dashboard
- [ ] API for third-party integrations

## 🔗 Links

- **GitHub Repository**: [https://github.com/brandon-relentnet/wxt-extension-template](https://github.com/brandon-relentnet/wxt-extension-template)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/brandon-relentnet/wxt-extension-template/issues)
- **Chrome Web Store**: *Coming Soon*
- **Firefox Add-ons**: *Coming Soon*
- **Documentation**: [Wiki](https://github.com/brandon-relentnet/wxt-extension-template/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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