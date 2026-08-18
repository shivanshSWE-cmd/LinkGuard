import { parseURL, isValidURL } from './utils/urlUtils.js';
import { Storage } from './utils/storage.js';
import { HistoryModule } from './modules/history.js';
import { URLParserModule } from './modules/urlParser.js';
import { URLCleanerModule } from './modules/urlCleaner.js';
import { URLUnshortenerModule } from './modules/urlUnshortener.js';
import { StatusCheckerModule } from './modules/statusChecker.js';
import { PatternCheckerModule } from './modules/patternChecker.js';

class URLCheckApp {
  constructor() {
    this.currentUrl = '';
    this.modules = {};
    this.history = new HistoryModule();
    this.init();
  }

  init() {
    this.initModules();
    this.initUI();
    this.initEventListeners();
    this.loadSettings();
    this.showToast('LinkGuard ready!', 'info');
  }

  initModules() {
    this.modules = {
      urlParser: new URLParserModule(),
      urlCleaner: new URLCleanerModule(),
      urlUnshortener: new URLUnshortenerModule(),
      statusChecker: new StatusCheckerModule(),
      patternChecker: new PatternCheckerModule(),
    };
  }

  initUI() {
    // Set up module card collapse/expand toggles
    // Set up all module cards to be collapsed by default except urlParser
    // Add 'collapsed' class to all module-cards except urlParser
    document.querySelectorAll('.module-card').forEach(card => {
      if (card.id !== 'urlParserModule') {
        card.classList.add('collapsed');
      }
      const header = card.querySelector('.module-header');
      if (header) {
        header.addEventListener('click', (e) => {
          if (e.target.closest('button:not(.module-toggle)')) return;
          card.classList.toggle('collapsed');
        });
      }
    });
  }

  initEventListeners() {
    const urlInput = document.getElementById('urlInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const cleanBtn = document.getElementById('cleanBtn');
    const unshortenBtn = document.getElementById('unshortenBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const scanBtn = document.getElementById('scanBtn');
    const openBtn = document.getElementById('openBtn');
    const copyBtn = document.getElementById('copyBtn');
    const shareBtn = document.getElementById('shareBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const addPatternBtn = document.getElementById('addPatternBtn');

    // URL input
    if (urlInput) {
      urlInput.addEventListener('input', () => this.onUrlChange(urlInput.value));
      urlInput.addEventListener('paste', (e) => {
        setTimeout(() => this.onUrlChange(urlInput.value), 0);
      });
    }

    // Paste button
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (urlInput) urlInput.value = text;
          this.onUrlChange(text);
          this.showToast('Pasted from clipboard', 'success');
        } catch (e) {
          this.showToast('Cannot access clipboard', 'error');
        }
      });
    }

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (urlInput) urlInput.value = '';
        this.onUrlChange('');
      });
    }

    // Module action buttons
    if (cleanBtn) cleanBtn.addEventListener('click', () => this.cleanUrl());
    if (unshortenBtn) unshortenBtn.addEventListener('click', () => this.unshortenUrl());
    if (checkStatusBtn) checkStatusBtn.addEventListener('click', () => this.checkStatus());
    if (scanBtn) scanBtn.addEventListener('click', () => this.scanUrl());

    // Open & Share
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (this.currentUrl) window.open(this.currentUrl, '_blank');
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.currentUrl);
          this.showToast('URL copied!', 'success');
        } catch(e) {
          this.showToast('Failed to copy', 'error');
        }
      });
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ url: this.currentUrl });
          } catch(e) {}
        } else {
          await navigator.clipboard.writeText(this.currentUrl);
          this.showToast('URL copied (share not supported)', 'info');
        }
      });
    }

    // History
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this.clearChangeHistory());

    // Settings
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettings());
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) this.closeSettings();
      });
    }

    // Pattern
    if (addPatternBtn) addPatternBtn.addEventListener('click', () => this.addPatternRule());

    // Settings actions
    document.getElementById('exportSettingsBtn')?.addEventListener('click', () => this.exportSettings());
    document.getElementById('importSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', (e) => this.importSettings(e));

    // VT API key save (both in module and settings)
    document.getElementById('saveVtKey')?.addEventListener('click', () => {
      const key = document.getElementById('vtApiKey')?.value;
      if (key) {
        Storage.setApiKey('virustotal', key);
        this.showToast('API key saved', 'success');
      }
    });
    document.getElementById('settingsSaveVtKey')?.addEventListener('click', () => {
      const key = document.getElementById('settingsVtApiKey')?.value;
      if (key) {
        Storage.setApiKey('virustotal', key);
        const modKey = document.getElementById('vtApiKey');
        if (modKey) modKey.value = key;
        this.showToast('API key saved', 'success');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      if (e.ctrlKey && e.key === 'v' && document.activeElement !== urlInput) {
        if (pasteBtn) pasteBtn.click();
      }
    });
  }

  onUrlChange(url) {
    const trimmed = url.trim();
    // Auto-add protocol if missing
    let processedUrl = trimmed;
    if (trimmed && !trimmed.match(/^[a-zA-Z]+:\/\//)) {
      processedUrl = 'https://' + trimmed;
    }
    
    const valid = isValidURL(processedUrl);
    const statusEl = document.getElementById('inputStatus');
    
    if (!trimmed) {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'input-status';
      }
      this.currentUrl = '';
      this.updateButtonStates(false);
      this.clearAllModules();
      return;
    }

    if (valid) {
      if (statusEl) {
        statusEl.innerHTML = '<span class="status-valid">✓ Valid URL</span>';
        statusEl.className = 'input-status valid';
      }
      
      const oldUrl = this.currentUrl;
      this.currentUrl = processedUrl;
      
      if (oldUrl && oldUrl !== processedUrl) {
        this.history.push(oldUrl, processedUrl, 'Manual edit');
      } else if (!oldUrl) {
        this.history.push('', processedUrl, 'URL entered');
      }
      
      this.updateButtonStates(true);
      this.processUrl(processedUrl);
    } else {
      if (statusEl) {
        statusEl.innerHTML = '<span class="status-invalid">✗ Invalid URL</span>';
        statusEl.className = 'input-status invalid';
      }
      this.currentUrl = '';
      this.updateButtonStates(false);
      this.clearAllModules();
    }
  }

  processUrl(url) {
    // Run all automatic modules
    if (this.modules.urlParser) this.modules.urlParser.analyze(url);
    if (this.modules.urlCleaner) this.modules.urlCleaner.analyze(url);
    if (this.modules.patternChecker) this.modules.patternChecker.analyze(url);
    if (this.history) this.history.render();
  }

  clearAllModules() {
    Object.values(this.modules).forEach(m => {
      if (m && m.clear) m.clear();
    });
  }

  updateButtonStates(enabled) {
    const buttons = ['cleanBtn', 'unshortenBtn', 'checkStatusBtn', 'scanBtn', 'openBtn', 'copyBtn', 'shareBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !enabled;
    });
  }

  updateUrl(newUrl, reason) {
    const oldUrl = this.currentUrl;
    this.currentUrl = newUrl;
    const urlInput = document.getElementById('urlInput');
    if (urlInput) urlInput.value = newUrl;
    this.history.push(oldUrl, newUrl, reason);
    this.processUrl(newUrl);
    this.updateButtonStates(true);
  }

  async cleanUrl() {
    if (!this.modules.urlCleaner) return;
    const result = this.modules.urlCleaner.clean(this.currentUrl);
    if (result && result.cleanUrl !== this.currentUrl) {
      this.updateUrl(result.cleanUrl, `Cleaned ${result.removed.length} tracking param(s)`);
      this.showToast(`Removed ${result.removed.length} tracking parameter(s)`, 'success');
    } else {
      this.showToast('URL is already clean!', 'info');
    }
  }

  async unshortenUrl() {
    if (!this.modules.urlUnshortener) return;
    const result = await this.modules.urlUnshortener.unshorten(this.currentUrl);
    if (result && result.resolved && result.resolved !== this.currentUrl) {
      this.updateUrl(result.resolved, 'Unshortened URL');
      this.showToast('URL unshortened!', 'success');
    } else if (result && result.error) {
      this.showToast(result.error, 'error');
    } else {
      this.showToast('URL does not appear to be shortened', 'info');
    }
  }

  async checkStatus() {
    if (!this.modules.statusChecker) return;
    await this.modules.statusChecker.check(this.currentUrl);
  }

  async scanUrl() {
    if (!this.modules.virusTotal) return;
    const apiKey = Storage.getApiKey('virustotal');
    if (!apiKey) {
      this.showToast('Please enter a VirusTotal API key first', 'warning');
      return;
    }
    await this.modules.virusTotal.scan(this.currentUrl, apiKey);
  }

  undo() {
    if (!this.history) return;
    const entry = this.history.undo();
    if (entry) {
      this.currentUrl = entry.url;
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.value = entry.url;
      this.processUrl(entry.url);
      this.updateButtonStates(!!entry.url);
    }
  }

  redo() {
    if (!this.history) return;
    const entry = this.history.redo();
    if (entry) {
      this.currentUrl = entry.url;
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.value = entry.url;
      this.processUrl(entry.url);
      this.updateButtonStates(!!entry.url);
    }
  }

  clearChangeHistory() {
    if (this.history) this.history.clear();
    this.showToast('History cleared', 'info');
  }

  addPatternRule() {
    if (this.modules.patternChecker) this.modules.patternChecker.showAddRuleDialog();
  }

  // Settings
  openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) overlay.classList.add('active');
    this.renderSettingsModuleList();
    // Load saved VT key
    const vtKey = Storage.getApiKey('virustotal');
    if (vtKey) {
      const el = document.getElementById('settingsVtApiKey');
      if (el) el.value = vtKey;
    }
  }

  closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  renderSettingsModuleList() {
    const list = document.getElementById('moduleList');
    if (!list) return;
    const settings = Storage.getModuleSettings();
    list.innerHTML = '';
    
    const moduleNames = {
      urlParser: 'URL Breakdown',
      urlCleaner: 'URL Cleaner',
      urlUnshortener: 'URL Unshortener',
      statusChecker: 'Status Checker',
      patternChecker: 'Pattern Checker',
      history: 'History',
      openShare: 'Open & Share'
    };

    settings.order.forEach(moduleId => {
      const li = document.createElement('li');
      li.className = 'module-setting-item';
      li.dataset.moduleId = moduleId;
      li.draggable = true;
      li.innerHTML = `
        <span class="drag-handle">⠿</span>
        <span class="module-setting-name">${moduleNames[moduleId] || moduleId}</span>
        <label class="toggle-switch">
          <input type="checkbox" ${settings.enabled[moduleId] !== false ? 'checked' : ''} data-module="${moduleId}">
          <span class="toggle-slider"></span>
        </label>
      `;
      list.appendChild(li);
    });

    // Toggle listeners
    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const moduleId = cb.dataset.module;
        const card = document.querySelector(`[data-module="${moduleId}"]`);
        if (card) {
          card.style.display = cb.checked ? '' : 'none';
        }
        this.saveModuleSettings();
      });
    });

    // Drag-and-drop reordering
    this.initDragReorder(list);
  }

  initDragReorder(list) {
    let dragItem = null;
    list.addEventListener('dragstart', (e) => {
      dragItem = e.target.closest('.module-setting-item');
      if (dragItem) dragItem.classList.add('dragging');
    });
    list.addEventListener('dragend', () => {
      if (dragItem) dragItem.classList.remove('dragging');
      dragItem = null;
      this.saveModuleSettings();
    });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        if (dragItem) list.appendChild(dragItem);
      } else {
        if (dragItem) list.insertBefore(dragItem, afterElement);
      }
    });
  }

  getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.module-setting-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  saveModuleSettings() {
    const items = document.querySelectorAll('.module-setting-item');
    const order = [];
    const enabled = {};
    items.forEach(item => {
      const id = item.dataset.moduleId;
      order.push(id);
      enabled[id] = item.querySelector('input[type=checkbox]').checked;
    });
    Storage.setModuleSettings({ order, enabled });
  }

  loadSettings() {
    const settings = Storage.getModuleSettings();
    // Apply module visibility
    Object.entries(settings.enabled).forEach(([moduleId, isEnabled]) => {
      const card = document.querySelector(`[data-module="${moduleId}"]`);
      if (card) card.style.display = isEnabled ? '' : 'none';
    });
    // Apply module order
    const container = document.getElementById('modulesContainer');
    if (container) {
      settings.order.forEach(moduleId => {
        const card = document.querySelector(`[data-module="${moduleId}"]`);
        if (card) container.appendChild(card);
      });
    }
    // Load VT API key
    const vtKey = Storage.getApiKey('virustotal');
    if (vtKey) {
      const vtInput = document.getElementById('vtApiKey');
      if (vtInput) vtInput.value = vtKey;
    }
  }

  exportSettings() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkguard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Settings exported', 'success');
  }

  importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Storage.importAll(data);
        this.loadSettings();
        this.showToast('Settings imported', 'success');
      } catch (err) {
        this.showToast('Invalid settings file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${message}</span>
      <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('active'));
    
    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.urlCheckApp = new URLCheckApp();
});
