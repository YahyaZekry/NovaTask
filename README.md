# NovaTask 🐻

_Modern task management with bear-like strength and stellar organization_ ⭐

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](https://github.com/YahyaZekry/NovaTask/actions)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1-AA-blue.svg)](https://www.w3.org/TR/WCAG21/)
[![Performance](https://img.shields.io/badge/Performance-95%2B-brightgreen.svg)](https://web.dev/vitals/)

A beautiful and powerful todo list application that makes managing your tasks effortless and enjoyable.

**🎉 [Live Demo](https://novatask89.vercel.app/)** - Try NovaTask right now!

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [📱 For Users](#-for-users)
- [🛠️ For Developers](#️-for-developers)
- [🎨 Design & Accessibility](#-design--accessibility)
- [📊 Performance](#-performance)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

### 🎯 **Task Management Made Simple**
- **Create & Organize** - Add tasks with priorities, due dates, and categories
- **Smart Filtering** - Instantly find what you need with powerful filters
- **Visual Priority** - Color-coded tasks make priorities clear at a glance
- **Auto-Save** - Your work is always saved, even if you close the browser

### 🎨 **Beautiful Design**
- **Glass Morphism UI** - Modern frosted glass effects that look stunning
- **Smooth Animations** - Fluid 60fps transitions that feel natural
- **Dark & Light Mode** - Comfortable viewing in any environment
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### ⚡ **Performance & Reliability**
- **Lightning Fast** - Built with cutting-edge web technologies
- **Offline Ready** - Works even without an internet connection
- **Cross-Device Sync** - Your tasks stay in sync across all your devices
- **Error Recovery** - Automatically recovers from unexpected issues

### ♿ **Accessibility First**
- **Keyboard Navigation** - Full keyboard support for power users
- **Screen Reader Friendly** - Optimized for assistive technologies
- **WCAG 2.1 Compliant** - Meets the highest accessibility standards
- **Focus Management** - Clear visual indicators for navigation

---

## 🚀 Quick Start

### **Try It Now**
No installation required! Visit the **[Live Demo](https://novatask89.vercel.app/)** to start using NovaTask immediately.

### **Local Installation**

```bash
# Clone the repository
git clone https://github.com/YahyaZekry/NovaTask.git
cd NovaTask

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

That's it! You're ready to start organizing your tasks with NovaTask.

---

## 📱 For Users

### **Getting Started Guide**

1. **Create Your First Task** - Click the "Add Task" button and type what you need to do
2. **Set Priority** - Choose High (red), Medium (yellow), or Low (green) priority
3. **Add Categories** - Organize tasks by project, context, or any system you prefer
4. **Set Due Dates** - Never miss a deadline with built-in date tracking
5. **Filter & Find** - Use the filter buttons to see All, Active, or Completed tasks

### **Power User Tips**

- **Keyboard Shortcuts** - Press `?` to see all available shortcuts
- **Quick Edit** - Click on any task to edit it inline
- **Bulk Actions** - Select multiple tasks to change their status at once
- **Export Data** - Download your tasks as JSON or CSV for backup

### **Common Workflows**

#### **Project Management**
```
1. Create categories for each project
2. Set high priority for urgent tasks
3. Use due dates to track deadlines
4. Filter by category to focus on one project
```

#### **Daily Planning**
```
1. Start each day by reviewing active tasks
2. Set priorities for what must get done
3. Check off completed items throughout the day
4. Review completed tasks at day's end
```

---

## 🛠️ For Developers

### **Technology Stack**

- **Frontend** - Next.js 15, React 19, TypeScript 5
- **Styling** - Tailwind CSS 4 with custom animations
- **Testing** - Jest, Playwright, React Testing Library
- **Performance** - Web Vitals monitoring, bundle optimization

### **Project Structure**

```
NovaTask/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── contexts/      # React contexts
├── tests/             # Test suites
├── docs/              # Documentation
└── public/            # Static assets
```

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Check code quality |

### **Testing**

```bash
# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run performance tests
npm run test:performance

# Run accessibility tests
npm run test:accessibility
```

---

## 🎨 Design & Accessibility

### **Design System**

- **Glass Morphism** - Modern frosted glass effects with backdrop blur
- **Color Palette** - Carefully chosen colors for optimal contrast
- **Typography** - Clean, readable fonts with proper hierarchy
- **Animations** - Smooth, hardware-accelerated transitions

### **Accessibility Features**

- **Full Keyboard Support** - Navigate and use all features with keyboard only
- **Screen Reader Optimized** - Works perfectly with assistive technologies
- **High Contrast** - Meets WCAG 2.1 AA contrast requirements
- **Focus Management** - Clear focus indicators for navigation
- **ARIA Labels** - Proper ARIA attributes throughout the application

### **Responsive Design**

- **Mobile First** - Optimized for touch and small screens
- **Tablet Ready** - Perfect layout for tablet productivity
- **Desktop Optimized** - Full-featured experience on larger screens
- **PWA Support** - Install as a native app on supported devices

---

## 📊 Performance

### **Speed Metrics**

- **Load Time** - Under 1 second on average connections
- **Bundle Size** - Optimized for fast loading (<200KB gzipped)
- **Lighthouse Score** - 95+ across all categories
- **Core Web Vitals** - Excellent scores for user experience

### **Optimizations**

- **Code Splitting** - Only loads what you need
- **Image Optimization** - Automatic WebP conversion and lazy loading
- **Virtual Scrolling** - Handles large lists efficiently
- **Memory Management** - Prevents memory leaks and bloat

---

## ❓ FAQ

### **General Questions**

**Q: Is my data stored privately?**
A: Yes, all your data is stored locally in your browser and never sent to any server.

**Q: Can I use NovaTask offline?**
A: Absolutely! NovaTask works completely offline and syncs when you're back online.

**Q: Is there a mobile app?**
A: NovaTask is a progressive web app (PWA) that works great on mobile browsers and can be installed on your home screen.

### **Technical Questions**

**Q: What browsers are supported?**
A: NovaTask works on all modern browsers: Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+.

**Q: How do I report bugs or request features?**
A: Please open an issue on the [GitHub repository](https://github.com/YahyaZekry/NovaTask/issues).

**Q: Can I contribute to the project?**
A: Yes! We welcome contributions. See the Contributing section below for details.

---

## 🤝 Contributing

We love contributions from the community! Here's how you can help:

### **Getting Started**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new features
5. Ensure accessibility compliance
6. Test performance impact
7. Commit with clear messages
8. Push and open a Pull Request

### **Guidelines**

- **Code Quality** - Follow TypeScript and ESLint best practices
- **Testing** - All features must include tests
- **Accessibility** - Ensure WCAG 2.1 AA compliance
- **Performance** - Optimize for performance impact
- **Documentation** - Update docs for new features

### **Areas Where We Need Help**

- 🌐 **Internationalization** - Help translate NovaTask into more languages
- 🎨 **Design** - Contribute to the design system and UI improvements
- 📱 **Mobile** - Improve the mobile experience
- ⚡ **Performance** - Help optimize for even better performance
- ♿ **Accessibility** - Improve accessibility features

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for complete details.

**Copyright (c) 2025 The Bear Code**

---

## 👨‍💻 Author

**Yahya Zekry** • The Bear Code  
- GitHub: [@YahyaZekry](https://github.com/YahyaZekry)  
- LinkedIn: [Professional Profile](https://www.linkedin.com/in/yahyazekry/)  
- Project: [NovaTask Repository](https://github.com/YahyaZekry/NovaTask)

---

<div align="center">
  <a href="https://buymeacoffee.com/YahyaZekry" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Support The Bear Code" height="45" />
  </a>
</div>

<div align="center">
  <sub>Organizing the future, one task at a time 🧉</sub>
</div>