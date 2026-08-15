export class VirusTotalModule {
  constructor() {
    this.resultsEl = document.getElementById('vtResults');
    this.statusEl = document.getElementById('virusTotalStatus');
  }

  async scan(url, apiKey) {
    // Show loading
    if (this.resultsEl) {
      this.resultsEl.innerHTML = `
        <div class="vt-scanning">
          <div class="scan-animation"><div class="scan-ring"></div></div>
          <p>Scanning URL with VirusTotal...</p>
        </div>`;
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge info pulse-glow">Scanning...</span>';

    try {
      // Step 1: Submit URL for scanning
      const formData = new FormData();
      formData.append('url', url);
      
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: { 'x-apikey': apiKey },
        body: formData
      });

      if (!submitResponse.ok) {
        if (submitResponse.status === 401) {
          this.showError('Invalid API key');
          return;
        }
        if (submitResponse.status === 429) {
          this.showError('Rate limit exceeded. Please wait a minute.');
          return;
        }
        // CORS error will be caught in catch block
        throw new Error(`HTTP ${submitResponse.status}`);
      }

      const submitData = await submitResponse.json();
      const analysisId = submitData.data?.id;

      if (!analysisId) {
        this.showError('Failed to get analysis ID');
        return;
      }

      // Step 2: Poll for results (wait 3 seconds then check)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const resultResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey }
      });

      if (!resultResponse.ok) throw new Error(`HTTP ${resultResponse.status}`);

      const resultData = await resultResponse.json();
      const stats = resultData.data?.attributes?.stats;

      if (stats) {
        this.showResults(stats, url);
      } else {
        // Analysis still in progress, try URL lookup
        await this.fallbackLookup(url, apiKey);
      }

    } catch (e) {
      // Check if CORS error
      if (e.message.includes('Failed to fetch') || e.name === 'TypeError') {
        this.showCorsError(url);
      } else {
        this.showError(e.message);
      }
    }
  }

  async fallbackLookup(url, apiKey) {
    try {
      // Try URL lookup (for previously scanned URLs)
      const urlId = btoa(url).replace(/=/g, '');
      const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { 'x-apikey': apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        if (stats) {
          this.showResults(stats, url);
          return;
        }
      }
      this.showError('Analysis still in progress. Please try again in a few seconds.');
    } catch (e) {
      this.showCorsError(url);
    }
  }

  showResults(stats, url) {
    const total = (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0) + (stats.timeout || 0);
    const threats = (stats.malicious || 0) + (stats.suspicious || 0);
    const threatPercent = total > 0 ? (threats / total * 100) : 0;
    
    let severity = 'safe';
    let severityText = 'No threats detected';
    let severityClass = 'success';
    
    if (threats > 0 && threats <= 3) {
      severity = 'low';
      severityText = 'Low risk — few detections';
      severityClass = 'warning';
    } else if (threats > 3 && threats <= 10) {
      severity = 'medium';
      severityText = 'Medium risk — multiple detections';
      severityClass = 'warning';
    } else if (threats > 10) {
      severity = 'high';
      severityText = 'High risk — many detections!';
      severityClass = 'danger';
    }

    let html = `
      <div class="vt-result">
        <div class="threat-meter">
          <div class="threat-meter-bar">
            <div class="threat-meter-fill ${severity}" style="width: ${Math.max(threatPercent, 2)}%"></div>
          </div>
          <div class="threat-meter-label ${severityClass}">${severityText}</div>
        </div>
        <div class="vt-stats">
          <div class="vt-stat safe"><span class="vt-stat-count">${stats.harmless || 0}</span><span class="vt-stat-label">Harmless</span></div>
          <div class="vt-stat danger"><span class="vt-stat-count">${stats.malicious || 0}</span><span class="vt-stat-label">Malicious</span></div>
          <div class="vt-stat warning"><span class="vt-stat-count">${stats.suspicious || 0}</span><span class="vt-stat-label">Suspicious</span></div>
          <div class="vt-stat neutral"><span class="vt-stat-count">${stats.undetected || 0}</span><span class="vt-stat-label">Undetected</span></div>
        </div>
        <div class="vt-detection">${threats}/${total} security vendors flagged this URL</div>
      </div>`;

    if (this.resultsEl) this.resultsEl.innerHTML = html;
    if (this.statusEl) this.statusEl.innerHTML = `<span class="status-badge ${severityClass}">${threats}/${total} detections</span>`;
  }

  showCorsError(url) {
    const vtUrl = `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g, '')}/detection`;
    if (this.resultsEl) {
      this.resultsEl.innerHTML = `
        <div class="module-error">
          <span class="error-icon">🔒</span>
          <p>VirusTotal API is blocked by browser CORS policy.</p>
          <p class="error-hint">You can:</p>
          <ul class="error-list">
            <li>Check directly on <a href="${vtUrl}" target="_blank" rel="noopener">VirusTotal website</a></li>
            <li>Use a CORS browser extension</li>
            <li>Use the API via a backend proxy</li>
          </ul>
        </div>`;
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge warning">CORS blocked</span>';
  }

  showError(msg) {
    if (this.resultsEl) {
      this.resultsEl.innerHTML = `<div class="module-error"><span class="error-icon">⚠</span> ${msg}</div>`;
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge danger">Error</span>';
  }

  clear() {
    if (this.resultsEl) this.resultsEl.innerHTML = '';
    if (this.statusEl) this.statusEl.innerHTML = '';
  }
}
