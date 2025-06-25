# 🚀 Scrollr - The Ultimate Real-Time Data Ticker for Your Browser

<div align="center">

![Scrollr Logo](https://img.shields.io/badge/Scrollr-v2.0.0--beta.1-blue?style=for-the-badge)
[![MPL-2.0 License](https://img.shields.io/badge/License-MPL2.0-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mpl-2.0/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge)](https://github.com/brandon-relentnet/wxt-extension-template)

**Transform your browser into a real-time data powerhouse! 📊**

Scrollr is a blazing-fast browser extension that brings live financial markets, sports scores, and RSS feeds directly to your browser tabs. Built with enterprise-grade microservices architecture and a buttery-smooth user experience.

[🎯 Features](#-key-features) • [⚡ Quick Start](#-quick-start) • [🛠️ Developer Heaven](#%EF%B8%8F-developer-heaven) • [🐳 Production Ready](#-production-deployment) • [🤝 Join Us](#-contributing)

<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js" />
<img src="https://img.shields.io/badge/PostgreSQL-12+-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />

</div>

---

## 🎯 Why Scrollr?

Imagine having Bloomberg Terminal, ESPN SportCenter, and your favorite RSS feeds all running seamlessly in your browser - that's Scrollr! Whether you're a day trader tracking markets, a sports fanatic following games, or an information junkie staying current, Scrollr delivers real-time data without the tab-switching chaos.

### 🌟 What Makes Scrollr Special

- **⚡ Lightning Fast**: Sub-100ms response times with optimized React 19 and memoization
- **🔄 Real-Time Everything**: WebSocket connections deliver instant updates
- **📌 Pin System**: Keep your most important items always visible
- **🎨 Beautiful UI**: 10+ themes with DaisyUI, smooth animations, responsive design
- **☁️ Cloud Sync**: Your settings follow you across all devices
- **🔒 Privacy First**: Optional accounts, local-only mode available
- **🐳 Production Ready**: Full Docker deployment with microservices architecture

---

## 🎯 Key Features

### 📊 **Financial Markets** 
Live market data that rivals professional trading platforms:
- **Real-Time Quotes**: Stocks, crypto, forex with instant price updates
- **Smart Indicators**: Price changes, volume, market cap, and trends
- **WebSocket Streaming**: Direct connection to Finnhub for millisecond updates
- **Portfolio Tracking**: Create watchlists and monitor your investments
- **Previous Close Tracking**: Accurate change calculations

### 🏆 **Sports Scores**
Never miss a moment of the action:
- **Live Game Updates**: Real-time scores as they happen
- **Multi-League Support**: NFL, NBA, NHL, MLB, Soccer, and more
- **Game Details**: Quarter/period info, possession indicators, game status
- **Smart Scheduling**: Automated daily updates via cron jobs
- **Team Following**: Track your favorite teams across leagues

### 📰 **RSS Feed Manager**
Your personalized news ticker:
- **Custom Feeds**: Add any RSS/Atom feed URL
- **CORS Bypass**: Multiple proxy fallbacks ensure feeds always work
- **Auto-Refresh**: Updates every 5 minutes automatically
- **Category Organization**: Tech, News, Sports, Entertainment, Custom
- **Secure Storage**: Feeds sync with your account

### 📌 **Revolutionary Pin System**
Our unique pinning feature keeps important items in view:
- **Persistent Pins**: Pinned items stay visible on the left
- **Cross-Type Support**: Pin stocks, games, or articles
- **Smart Layout**: Pins overlay without disrupting the ticker
- **Account Sync**: Your pins follow you across devices

### ⚙️ **Customization Heaven**
Make Scrollr truly yours:
- **Speed Control**: Slow (5s), Classic (3s), or Fast (1.5s) scrolling
- **Position Toggle**: Top or bottom of your browser
- **Layout Modes**: Compact (72px) or Comfort (176px) views
- **Theme Selection**: 10+ beautiful themes to match your style
- **Export/Import**: Backup and restore all your settings
- **Debug Mode**: Advanced logging for troubleshooting and development

---

## ⚡ Quick Start

Get Scrollr running in under 2 minutes!

### Prerequisites
```bash
# Required
- Node.js 18+ and npm
- Modern browser (Chrome, Firefox, Edge)

# Optional (for accounts)
- PostgreSQL 12+
- Docker (for production deployment)
```

### 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/brandon-relentnet/scrollr.git
cd scrollr

# 2. Install dependencies (one command!)
npm install && make install-deps

# 3. Set up environment (for full features)
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 4. Start everything with one command! 🎉
npm run dev & make dev-up

# 5. Load the extension
# Chrome: chrome://extensions/ → Load unpacked → Select 'dist' folder
# Firefox: about:debugging → Load Temporary Add-on → Select any file in 'dist'
```

That's it! Scrollr is now running on your browser. 🎊

---

## 🛠️ Developer Heaven

We've built Scrollr with developers in mind. Check out these amazing DX features:

### 🎯 One-Command Everything

```bash
# Start all services (frontend + 3 backends) 🚀
make dev-up && npm run dev

# Check everything's running 📊
make dev-status

# Watch live logs from all services 📜
make dev-logs

# Graceful shutdown 🛑
make dev-down

# Clean restart ♻️
make dev-restart
```

### 🏗️ Architecture Overview

```
scrollr/
├── src/                    # Frontend (WXT + React + TypeScript)
│   ├── entrypoints/       # Extension entry points
│   │   ├── popup/         # Main UI (Display, Settings, Accounts)
│   │   ├── iframe/        # Ticker display (WebSocket, Cards)
│   │   └── store/         # Redux state management
│   └── hooks/             # Auth, RSS, and sync hooks
│
├── backend/               # Microservices Architecture
│   ├── accounts/          # JWT auth, user profiles, settings sync
│   ├── finance/           # Real-time market data via Finnhub
│   ├── sports/            # Live scores from ESPN API
│   └── docker-compose.yml # Production orchestration
│
└── Makefile              # Developer productivity commands
```

### 💻 Development Features

- **Hot Module Replacement**: See changes instantly without reloading
- **TypeScript Everywhere**: Full type safety across the stack
- **Redux DevTools**: Debug state changes in real-time
- **Advanced Debug Mode**: Configurable logging with 8 categories (Settings → Debug Settings)
- **Health Monitoring**: Comprehensive service health checks with real-time status
- **API Documentation**: Interactive API hub with testing tools at backend landing page

### 🧪 Advanced Features for Power Users

1. **WebSocket Testing Interface**
   ```javascript
   // Connect to finance WebSocket
   ws://localhost:4001/ws
   
   // Subscribe to symbols
   {"type": "subscribe", "symbols": ["AAPL", "GOOGL"]}
   ```

2. **Health Monitoring & API Testing**
   ```bash
   # Check comprehensive service health
   curl http://localhost:5000/health  # Accounts (DB + JWT validation)
   curl http://localhost:4001/health  # Finance (DB + Finnhub + cache metrics)
   curl http://localhost:4000/health  # Sports (DB + ESPN API accessibility)
   
   # Get user settings (with auth)
   curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/settings
   
   # Interactive API testing at backend landing page
   ```

3. **Database Management**
   ```bash
   # Create all tables
   make create-tables
   
   # Direct SQL access
   psql -d extension_accounts
   ```

---

## 🐳 Production Deployment

Scrollr includes enterprise-ready Docker deployment:

### 🚀 Deploy with Docker Compose

```bash
# 1. Configure production environment
cp backend/.env.example backend/.env.production
# Edit with production values

# 2. Build all images
make prod-build

# 3. Launch production stack
make prod-up

# 4. Monitor production
make prod-status
make prod-logs
```

### 🏢 Production Architecture

```yaml
Services:
  - PostgreSQL:    Database with persistent volumes
  - Accounts API:  JWT auth and user management
  - Finance API:   Real-time market data streaming
  - Sports API:    Live scores and game updates
  - Nginx:         Reverse proxy with SSL termination
  - Landing Page:  Beautiful API documentation
```

### 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **bcrypt Hashing**: Military-grade password security
- **Rate Limiting**: API protection (60 req/min)
- **CORS Protection**: Configured for your domains
- **SSL/TLS Ready**: Nginx handles certificates
- **Input Validation**: Comprehensive sanitization

### 📊 Monitoring & Debugging

Scrollr includes enterprise-grade monitoring and debugging tools:

#### 🏥 Health Monitoring
- **Comprehensive Health Checks**: All services report `healthy`, `degraded`, or `unhealthy` status
- **Real-Time Dashboard**: Interactive API hub with live service status and detailed tooltips
- **Dependency Tracking**: Database connectivity, external API status, configuration validation
- **Performance Metrics**: Uptime, memory usage, client counts, cache statistics

#### 🐛 Advanced Debug System
- **Configurable Logging**: Toggle debug mode in extension settings
- **8 Debug Categories**: WebSocket, Auth, RSS, Storage, UI, Config, Network, State
- **Smart Filtering**: Show all logs or filter by specific categories
- **Silent Production**: Only critical errors shown by default
- **Cross-Context Sync**: Debug settings work across popup, background, and iframe

---

## 🎨 Customization & Theming

Scrollr is built to be beautiful and customizable:

### Available Themes
- 🌙 Dark Mode (default)
- ☀️ Light Mode
- 🌈 Cupcake (playful)
- 🐝 Bumblebee (energetic)
- 🖤 Black (OLED friendly)
- 💼 Business (professional)
- 🌃 Synthwave (retro)
- 🍂 Autumn (warm)
- 💜 Dracula (classic)
- 🎨 And more!

### Speed & Layout Options
```javascript
// Speed settings
speeds: {
  slow: { duration: 5000 },    // Relaxed viewing
  classic: { duration: 3000 }, // Balanced
  fast: { duration: 1500 }     // Information overload!
}

// Layout modes
layouts: {
  compact: { height: 72 },   // Minimal footprint
  comfort: { height: 176 }   // More information
}
```

---

## 🚀 Roadmap & Coming Soon


---

## 🤝 Contributing

We love contributions! Scrollr is built by the community, for the community.

### How to Contribute

1. **Fork & Clone**
   ```bash
   git fork https://github.com/brandon-relentnet/scrollr
   git clone your-fork-url
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Magic**
   - Follow existing patterns
   - Add tests for new features
   - Keep performance in mind

4. **Submit PR**
   - Clear description
   - Screenshots for UI changes
   - Link related issues

### 🏆 Contributors

<a href="https://github.com/brandon-relentnet/scrollr/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=brandon-relentnet/scrollr" />
</a>

---

## 📚 Documentation

### Quick Links
- **[API Documentation & Testing](backend/landing/)**: Interactive API explorer with real-time health monitoring
- **[Debug System Guide](CLAUDE.md#frontend-debug-system)**: Comprehensive logging and troubleshooting
- **[Health Monitoring](CLAUDE.md#backend-health-monitoring)**: Service status and dependency checks
- **[Development Workflow](CLAUDE.md#development-workflow)**: Complete setup and commands

### Example: Adding a Custom Data Source

```javascript
// 1. Create your data slice
const myDataSlice = createSlice({
  name: 'myData',
  initialState: { items: [] },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    }
  }
});

// 2. Create a custom card component
const MyDataCard = ({ item }) => (
  <div className="card">
    <h3>{item.title}</h3>
    <p>{item.value}</p>
  </div>
);

// 3. Add to the carousel
// The system automatically handles the rest!
```

---

## 🆘 Support & Community

Need help? We've got you covered!

- **💬 [GitHub Discussions](https://github.com/brandon-relentnet/scrollr/discussions)**: Ask questions, share ideas
- **🐛 [Issue Tracker](https://github.com/brandon-relentnet/scrollr/issues)**: Report bugs, request features
- **📧 Email**: scrollr-support@example.com
- **🐦 Twitter**: [@ScrollrApp](https://twitter.com/scrollrapp)

---

## 📄 License

Scrollr is proudly open source under the Mozilla Public License 2.0. This means:
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Private use
- ✅ Patent protection

See [LICENSE](LICENSE) for details.

---

<div align="center">

### 🌟 Star us on GitHub!

If Scrollr makes your browsing experience better, consider giving us a star! It helps others discover the project and motivates us to keep improving.

[![Star on GitHub](https://img.shields.io/github/stars/brandon-relentnet/scrollr?style=social)](https://github.com/brandon-relentnet/scrollr/stargazers)

**Built with ❤️ by [Brandon RelentNet](https://github.com/brandon-relentnet) and the Scrollr Community**

*Transform your browser. Transform your workflow. Transform your day.*

**Scrollr v2.0.0-beta.1** - The Future of Browser-Based Data

</div>