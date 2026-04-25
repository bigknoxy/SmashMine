let deferredPrompt: any = null;
let installBtn: HTMLButtonElement | null = null;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton(): void {
  if (!installBtn) {
    installBtn = document.createElement('button');
    installBtn.textContent = 'Install SmashMine';
    installBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;background:#e040fb;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:bold;z-index:9999;cursor:pointer;display:none;';
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        console.log('PWA installed');
      }
      deferredPrompt = null;
      if (installBtn) installBtn.style.display = 'none';
    });
    document.body.appendChild(installBtn);
  }
  installBtn.style.display = 'block';
}

export function promptInstall(): void {
  if (deferredPrompt && installBtn) {
    installBtn.style.display = 'block';
  }
}

export function isInstallable(): boolean {
  return deferredPrompt !== null;
}