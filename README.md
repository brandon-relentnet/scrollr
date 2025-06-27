# 🚀 Scrollr - The Ultimate Real-Time Data Ticker for Your Browser

<div align="center">

![Scrollr Logo](https://img.shields.io/badge/Scrollr-v2.0.0--beta.1-blue?style=for-the-badge)
[![MPL-2.0 License](https://img.shields.io/badge/License-MPL2.0-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mpl-2.0/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge)](https://github.com/brandon-relentnet/scrollr)

**Transform your browser into a real-time data powerhouse! 📊**

Scrollr is a blazing-fast browser extension that brings live financial markets, sports scores, and RSS feeds directly to your browser tabs. Built with enterprise-grade microservices architecture, modular React components, and a buttery-smooth developer experience.

[🎯 Features](#-why-scrollr) • [⚡ Quick Start](#-quick-start) • [🛠️ Developer Heaven](#%EF%B8%8F-developer-heaven) • [🐳 Production Ready](#-production-deployment) • [🤝 Join Us](#-contributing)

<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/WXT-0.20-FF6B35?style=flat-square" alt="WXT Framework" />
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js" />
<img src="https://img.shields.io/badge/PostgreSQL-12+-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />

</div>

---

## 🎯 Why Scrollr?

Imagine having Bloomberg Terminal, ESPN SportCenter, and your favorite RSS feeds all running seamlessly in your browser - that's Scrollr! Whether you're a day trader tracking markets, a sports fanatic following games, or an information junkie staying current, Scrollr delivers real-time data without the tab-switching chaos.

### 🌟 What Makes Scrollr Special

- **⚡ Lightning Fast**: Sub-100ms response times with optimized React 19 and intelligent memoization
- **🔄 Real-Time Everything**: WebSocket connections deliver instant updates with automatic reconnection
- **📌 Pin System**: Revolutionary pinning keeps your most important items always visible
- **🎨 Beautiful UI**: 30+ stunning themes with DaisyUI, smooth animations, responsive design
- **☁️ Cloud Sync**: Your settings follow you across all devices seamlessly
- **🔒 Privacy First**: Optional accounts, local-only mode available, no tracking
- **🧩 Modular Architecture**: Clean, maintainable codebase with extracted components
- **🐳 Production Ready**: Full Docker deployment with enterprise microservices

---

## 🎯 Key Features

### 📊 **Financial Markets** 
Professional-grade market data that rivals trading platforms:
- **Real-Time Quotes**: Stocks, crypto, forex with millisecond precision updates
- **Smart Presets**: S&P 500, NASDAQ, Dow Jones, Top Crypto - one-click activation
- **Custom Watchlists**: Build your own symbol collections with advanced filtering
- **WebSocket Streaming**: Direct Finnhub connection for institutional-speed data
- **Portfolio Tracking**: Monitor your investments with accurate change calculations

### 🏆 **Sports Scores**
Never miss a moment of the action:
- **Live Game Updates**: Real-time scores as they happen across all major leagues
- **Multi-League Support**: NFL, NBA, NHL, MLB with smart scheduling
- **Game Intelligence**: Quarter/period info, possession indicators, game status
- **Automated Updates**: Smart cron jobs keep schedules current
- **Team Following**: Track your favorites with personalized notifications

### 📰 **RSS Feed Manager**
Your personalized news command center:
- **Universal Feeds**: Add any RSS/Atom feed URL - we handle the rest
- **CORS Bypass Magic**: Multiple proxy fallbacks ensure feeds always work
- **Smart Refresh**: Automatic updates every 5 minutes with intelligent caching
- **Category Organization**: Tech, News, Sports, Entertainment, Custom categories
- **Secure Cloud Storage**: Feeds sync with your account across devices

### 📌 **Revolutionary Pin System**
Our game-changing pinning feature:
- **Persistent Pins**: Important items stay visible on the left side always
- **Cross-Type Support**: Pin stocks, games, or articles - anything important
- **Smart Overlay**: Pins don't disrupt the ticker flow - they enhance it
- **Cloud Sync**: Your pins follow you across all devices and browsers

### ⚙️ **Customization Paradise**
Make Scrollr truly yours:
- **Speed Control**: Slow (5s), Classic (3s), or Fast (1.5s) scrolling speeds
- **Position Mastery**: Top or bottom of browser with pixel-perfect positioning
- **Layout Modes**: Compact (72px) or Comfort (176px) for your viewing preference
- **Theme Universe**: 30+ beautiful themes from minimalist to vibrant
- **Settings Sync**: Export/import/cloud sync for all your preferences
- **Debug Powerhouse**: 8-category logging system for developers and power users

---

## ⚡ Quick Start

Get Scrollr running in under 90 seconds! 🚀

### Prerequisites
```bash
# Required
✅ Node.js 18+ and npm
✅ Modern browser (Chrome, Firefox, Edge)

# Optional (for full features)
📊 PostgreSQL 12+ (for accounts and cloud sync)
🐳 Docker (for production deployment)
```

### 🚀 One-Command Installation

```bash
# 1. Clone and enter
git clone https://github.com/brandon-relentnet/scrollr.git && cd scrollr

# 2. Install everything (frontend + backend)
npm install && make install-deps

# 3. Set up environment (optional - for accounts & cloud sync)
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (Finnhub, ESPN)

# 4. Launch everything! 🎉
make dev-up && cd frontend && npm run dev

# 5. Load extension in browser
# Chrome: chrome://extensions/ → Developer mode → Load unpacked → Select 'frontend/dist'
# Firefox: about:debugging → Load Temporary Add-on → Select any file in 'frontend/dist'
```

**That's it!** Scrollr is now live in your browser! 🎊

---

## 🛠️ Developer Heaven

We've obsessed over developer experience. Check out these productivity superpowers:

### 🎯 One-Command Everything

```bash
# Start the universe (frontend + 3 backend services) 🌌
make dev-up && npm run dev

# Check if everything's alive and healthy 📊
make dev-status

# Watch live logs from all services in real-time 📜
make dev-logs

# Graceful shutdown when you're done 🛑
make dev-down

# Clean restart for a fresh start ♻️
make dev-restart
```

### 🏗️ Revolutionary Architecture

```
scrollr/
├── frontend/src/entrypoints/    # WXT + React 19 + TypeScript
│   ├── popup/                   # Main extension UI
│   │   ├── tabs/               # Display, Accounts, Themes tabs
│   │   └── App.tsx             # Root popup component
│   ├── iframe/                 # Real-time ticker display
│   │   ├── Cards/              # Finance, Sports, RSS cards
│   │   └── Carousel.jsx        # Main ticker carousel
│   ├── components/             # Modular component library
│   │   ├── auth/               # Login, Register, Profile, Settings
│   │   ├── controls/           # Speed, Layout, Position controls
│   │   └── hooks/              # Business logic hooks
│   ├── store/                  # Redux Toolkit state management
│   └── background.ts           # Service worker with cross-tab sync
│
├── backend/                    # Microservices paradise
│   ├── accounts/               # JWT auth, profiles, settings sync
│   ├── finance/                # Real-time market data via Finnhub
│   ├── sports/                 # Live scores from ESPN API
│   └── docker-compose.yml      # Production orchestration
│
└── Makefile                   # Developer productivity magic
```

### 💻 Developer Experience Features

- **🔥 Hot Module Replacement**: See changes instantly - no extension reloading needed
- **📝 TypeScript Everywhere**: Full type safety across frontend, components, and hooks
- **🔍 Redux DevTools**: Debug state changes in real-time with beautiful visualizations
- **🐛 Advanced Debug Mode**: 8-category logging system (WebSocket, Auth, RSS, Storage, UI, Config, Network, State)
- **🏥 Health Monitoring**: Real-time service health with comprehensive metrics
- **📚 Interactive API Docs**: Built-in API hub with testing tools and live monitoring
- **🧩 Modular Components**: Clean architecture with extracted, focused components

### 🎨 Recent Architecture Improvements

**Massive Code Organization Wins:**
- **DisplayTab**: 782 lines → 76 lines (90% reduction!) 📉
- **AccountsTab**: 624 lines → 433 lines (31% reduction!) 📉
- **Extracted Components**: FinanceSection, SportsSection, RssSection, Auth views
- **Custom Hooks**: Separated business logic into focused, reusable hooks
- **TypeScript Interfaces**: Comprehensive type safety for all component props

### 🧪 Advanced Features for Power Users

1. **WebSocket Testing Interface**
   ```javascript
   // Direct connection to finance data
   ws://localhost:4001/ws
   
   // Subscribe to symbols in real-time
   {"type": "subscribe", "symbols": ["AAPL", "GOOGL", "TSLA"]}
   ```

2. **Health Monitoring & API Testing**
   ```bash
   # Comprehensive service health checks
   curl http://localhost:5000/health  # Accounts (DB + JWT + user metrics)
   curl http://localhost:4001/health  # Finance (DB + Finnhub + cache stats)
   curl http://localhost:4000/health  # Sports (DB + ESPN + WebSocket clients)
   
   # Authenticated API testing
   curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/settings
   
   # Interactive API playground at backend landing page
   open http://localhost:5000
   ```

3. **Database & Debug Management**
   ```bash
   # Create database tables across all services
   make create-tables
   
   # TypeScript compilation with full error checking
   npm run compile
   
   # Direct database access
   psql -d extension_accounts
   ```

---

## 🐳 Production Deployment

Enterprise-ready Docker deployment with one command:

### 🚀 Deploy Like a Pro

```bash
# 1. Configure production secrets
cp backend/.env.example backend/.env.production
# Edit with production database, API keys, JWT secrets

# 2. Build optimized Docker images
make prod-build

# 3. Launch production stack with monitoring
make prod-up

# 4. Monitor production health
make prod-status && make prod-logs
```

### 🏢 Production Architecture

```yaml
Production Stack:
  🗄️  PostgreSQL:     Persistent database with automated backups
  🔐  Accounts API:    JWT authentication and user management  
  📊  Finance API:     High-frequency market data streaming
  🏆  Sports API:      Live scores with intelligent scheduling
  🌐  Nginx Proxy:     SSL termination and load balancing
  📚  API Hub:         Interactive documentation and monitoring
  📈  Health Checks:   Real-time service monitoring
```

### 🔒 Enterprise Security Features

- **🔐 JWT Authentication**: Secure, stateless token-based auth
- **🛡️ bcrypt Hashing**: Military-grade password protection
- **⚡ Rate Limiting**: API protection (60 requests/minute)
- **🌐 CORS Protection**: Configured for your domains only
- **🔒 SSL/TLS Ready**: Nginx handles certificates automatically
- **✅ Input Validation**: Comprehensive request sanitization
- **📊 Audit Logging**: Complete request/response tracking

---

## 🎨 Customization & Theming

Scrollr is built to be absolutely gorgeous and endlessly customizable:

### 🌈 Stunning Theme Collection
- 🌙 **Dark Mode** (sleek default)
- ☀️ **Light Mode** (clean and bright) 
- 🌸 **Cupcake** (playful and sweet)
- 🐝 **Bumblebee** (energetic yellow)
- 🖤 **Black** (OLED-friendly pure black)
- 💼 **Business** (professional blue)
- 🌃 **Synthwave** (retro neon vibes)
- 🍂 **Autumn** (warm and cozy)
- 🧛 **Dracula** (classic programmer theme)
- 🎨 **Plus 20+ more themes!**

### ⚡ Performance & Layout Options
```javascript
// Speed controls for every preference
speeds: {
  slow: { duration: 5000 },     // Relaxed information consumption
  classic: { duration: 3000 },  // Perfect balance
  fast: { duration: 1500 }      // Information overload mode!
}

// Layout modes for every screen
layouts: {
  compact: { height: 72 },   // Minimal browser footprint
  comfort: { height: 176 }   // Maximum information density
}

// Position flexibility
positions: {
  top: "Overlay at top of pages",
  bottom: "Unobtrusive at bottom"
}
```

---

## 📚 Documentation & Learning

### 🚀 Quick Links
- **[Interactive API Hub](http://localhost:5000)**: Live API testing with real-time health monitoring
- **[Debug System Guide](CLAUDE.md#frontend-debug-system)**: Master the 8-category logging system
- **[Health Monitoring](CLAUDE.md#backend-health-monitoring)**: Service status and dependency tracking
- **[Development Workflow](CLAUDE.md#development-workflow)**: Complete setup and advanced commands

### 🎯 Example: Adding Your Custom Data Source

```javascript
// 1. Create your Redux data slice
const myCustomSlice = createSlice({
  name: 'myCustomData',
  initialState: { items: [], loading: false },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

// 2. Create a beautiful card component
const MyCustomCard = ({ item, isPinned }) => (
  <div className={`card ${isPinned ? 'pinned' : ''}`}>
    <h3 className="font-bold">{item.title}</h3>
    <p className="text-success">{item.value}</p>
    <span className="text-xs opacity-70">{item.source}</span>
  </div>
);

// 3. Add to the carousel - Scrollr handles the rest!
// Your data automatically gets:
// ✅ Real-time updates
// ✅ Pinning capability  
// ✅ Theme integration
// ✅ Performance optimization
```

---

## 🤝 Contributing

We absolutely love contributions! Scrollr thrives because of our amazing community.

### 🌟 How to Contribute

1. **🍴 Fork & Clone**
   ```bash
   # Fork on GitHub, then:
   git clone https://github.com/YOUR-USERNAME/scrollr.git
   cd scrollr
   ```

2. **🌿 Create Feature Branch**
   ```bash
   git checkout -b feature/your-amazing-idea
   ```

3. **✨ Make Your Magic**
   - Follow existing component patterns
   - Add TypeScript interfaces for new props
   - Keep performance and modularity in mind
   - Test across different themes and layouts

4. **🚀 Submit PR**
   - Clear, descriptive title and description
   - Screenshots for UI changes
   - Link any related issues
   - Ensure TypeScript compilation passes

### 🏆 What We're Looking For

- 🧩 **New Data Sources**: Crypto exchanges, news APIs, weather data
- 🎨 **Beautiful Themes**: Dark modes, light modes, creative designs  
- 🔧 **Developer Tools**: Better debugging, testing frameworks, automation
- 📱 **Mobile Support**: Responsive design improvements
- ⚡ **Performance**: Optimization, caching, rendering improvements
- 🌐 **Internationalization**: Multiple language support

### 🏆 Contributors Hall of Fame

<a href="https://github.com/brandon-relentnet/scrollr/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=brandon-relentnet/scrollr" />
</a>

---

## 🆘 Support & Community

Need help? Our community has your back! 💪

- **💬 [GitHub Discussions](https://github.com/brandon-relentnet/scrollr/discussions)**: Ask questions, share ideas, get help
- **🐛 [Issue Tracker](https://github.com/brandon-relentnet/scrollr/issues)**: Report bugs, request features
- **📧 Email Support**: scrollr-support@relentnet.dev
- **🐦 Follow Updates**: [@ScrollrApp](https://twitter.com/scrollrapp)

### 🔧 Troubleshooting

**Extension not loading?**
```bash
# Check if services are running
make dev-status

# Rebuild and reload
npm run build && reload extension in browser
```

**WebSocket connection issues?**
```bash
# Check service health
curl http://localhost:4001/health
curl http://localhost:4000/health

# Enable debug mode in extension settings
```

**Missing data?**
- Verify API keys in `backend/.env`
- Check debug logs in extension settings
- Ensure internet connectivity for external APIs

---

## 📄 License & Legal

Scrollr is proudly open source under the **Mozilla Public License 2.0**. This means:

- ✅ **Commercial Use**: Build your business with Scrollr
- ✅ **Modify & Distribute**: Make it your own and share
- ✅ **Private Use**: Use internally without restrictions  
- ✅ **Patent Protection**: We've got your back legally

See [LICENSE](LICENSE) for complete details.

---

<div align="center">

### 🌟 Star us on GitHub!

If Scrollr transforms your browsing experience, please give us a star! It helps others discover the project and motivates our team to keep innovating.

[![Star on GitHub](https://img.shields.io/github/stars/brandon-relentnet/scrollr?style=social)](https://github.com/brandon-relentnet/scrollr/stargazers)

**Built with ❤️ by [Brandon RelentNet](https://github.com/brandon-relentnet) and the amazing Scrollr Community**

*Transform your browser. Transform your workflow. Transform your day.*

**Scrollr v2.0.0-beta.1** - The Future of Browser-Based Real-Time Data

---

### 🚀 Ready to get started?

```bash
git clone https://github.com/brandon-relentnet/scrollr.git && cd scrollr
make dev-up && cd frontend && npm run dev
```

**Your new superpower awaits!** ⚡

</div>