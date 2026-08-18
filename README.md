<p align="center">
  <img src="assets/banner.jpg" alt="LinkGuard Banner" width="100%" />
</p>

<h1 align="center">LinkGuard</h1>

<p align="center">
  <strong>Modern URL Inspector, Privacy Cleaner & Cyber Security Web Application</strong>
</p>

<p align="center">
  <a href="https://github.com/shivanshSWE-cmd/LinkGuard/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/Release-v1.0.0-10b981?style=flat-square&logo=github" alt="Release v1.0.0"></a>
  <a href="https://github.com/shivanshSWE-cmd/LinkGuard/releases"><img src="https://img.shields.io/badge/Installable-Releases-00d4ff?style=flat-square&logo=github" alt="Installable Releases"></a>
  <a href="https://github.com/shivanshSWE-cmd/LinkGuard"><img src="https://img.shields.io/github/repo-size/shivanshSWE-cmd/LinkGuard?style=flat-square&color=8b5cf6" alt="Code Size"></a>
  <a href="https://shivanshswe-cmd.github.io/LinkGuard/"><img src="https://img.shields.io/badge/Live_App-shivanshswe--cmd.github.io%2FLinkGuard-8b5cf6?style=flat-square&logo=github" alt="Live App"></a>
</p>

---

## 🧐 What is LinkGuard?

**LinkGuard** is an open-source, privacy-first web application designed to inspect, clean, unshorten, and analyze web links before you open them. LinkGuard acts as a security shield against tracking parameters, deceptive short links, malicious redirects, and phishing threats.

---

## 📦 Releases & Assets

Click below to view release assets, source code archives (`.zip`, `.tar.gz`), and app release builds:

👉 **[View LinkGuard Releases & Assets](https://github.com/shivanshSWE-cmd/LinkGuard/releases/tag/v1.0.0)**

---

## ✨ Modular Features

LinkGuard is built with a modular design system allowing you to enable, disable, and custom-order tools:

| Module | Description |
| :--- | :--- |
| **🔍 URL Breakdown** | Color-coded syntax parsing of schemes (`http`/`https`), hostnames, ports, paths, query parameter lists, and fragment hashes. |
| **🧹 URL Cleaner** | Strips **50+ known tracking & referral parameters** (`utm_*`, `fbclid`, `gclid`, `msclkid`, `igshid`, `ref`, etc.) to preserve your privacy. |
| **🔗 URL Unshortener** | Resolves destination URLs behind link shorteners (`bit.ly`, `t.co`, `tinyurl.com`, `is.gd`, `cutt.ly`, etc.) via CORS proxy routing. |
| **📶 Status Checker** | Tests HTTP response codes (`200 OK`, `301/302 Redirects`, `404`, `500`), content size, type headers, and redirect destinations. |
| **⚡ Pattern Checker** | Evaluates user-defined regex rules (e.g. `^http://` $\rightarrow$ `https://`) and suggests instant changes with a single click. |
| **⏳ Change History** | Full stack-based modification log with `Ctrl+Z` (Undo) and `Ctrl+Y` (Redo) support, displaying green/red diffs. |
| **📤 Open & Share** | Open in new tab, copy clean URL, or share via the native Web Share API. |
| **⚙️ Customization** | Drag-and-drop module ordering, module toggles, API key management, and settings Export/Import. |

---

## 🌐 Live Web App

LinkGuard is hosted live and can be used on any browser:  
👉 **[https://shivanshswe-cmd.github.io/LinkGuard/](https://shivanshswe-cmd.github.io/LinkGuard/)**

---

## 📱 Progressive Web App (PWA) Installation

LinkGuard is a fully compliant Progressive Web App. You can install it on your device and use it offline like a native app:

### Desktop (Chrome / Edge / Brave / Opera)
1. Open [https://shivanshswe-cmd.github.io/LinkGuard/](https://shivanshswe-cmd.github.io/LinkGuard/)
2. Click the **Install** button in the address bar.
3. Launch LinkGuard directly from your Desktop or App Launcher.

### Mobile (Android / Chrome)
1. Open the website in Chrome.
2. Tap the **Install App** popup or open menu $\rightarrow$ **Add to Home screen**.

### Mobile (iOS / Safari)
1. Open the website in Safari.
2. Tap the **Share** button $\rightarrow$ **Add to Home Screen**.

---

## 💻 Tech Stack

- **HTML5 & Vanilla JavaScript**: Standard ES6 modules with no external framework overhead.
- **Vanilla CSS**: Custom dark mode design system featuring frosted glassmorphism, glowing cyan/violet accents, and micro-animations.
- **Service Worker & Manifest**: PWA caching engine for fast offline access.

---

## 👤 Author

**Shivansh Mishra**
- GitHub: [@shivanshSWE-cmd](https://github.com/shivanshSWE-cmd)
