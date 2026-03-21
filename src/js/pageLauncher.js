const HOST_ID = 'devinks-page-launcher-host';

const isRuntimeAvailable = () => {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
};

if (window.top === window && !document.getElementById(HOST_ID)) {
  const host = document.createElement('div');
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const iconUrl = chrome.runtime.getURL('src/assets/DevInks.png');
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('src/styles/page-launcher.css');

  const launcher = document.createElement('button');
  launcher.className = 'page-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Open DevInks side panel');
  launcher.title = 'Open DevInks';

  const icon = document.createElement('img');
  icon.src = iconUrl;
  icon.alt = 'DevInks';
  launcher.appendChild(icon);

  shadowRoot.appendChild(styleLink);
  shadowRoot.appendChild(launcher);

  const resetLauncherState = () => {
    launcher.classList.remove('is-opening');
  };

  launcher.addEventListener('click', () => {
    if (!isRuntimeAvailable()) {
      resetLauncherState();
      host.remove();
      console.warn('DevInks was reloaded. Refresh the page to re-enable it.');
      return;
    }

    launcher.classList.add('is-opening');
    window.setTimeout(resetLauncherState, 220);

    try {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, () => {
        if (chrome.runtime.lastError) {
          resetLauncherState();
          console.warn(chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      resetLauncherState();
      host.remove();
      console.warn('DevInks was reloaded. Refresh the page to re-enable it.');
      console.error(error);
    }
  });
}
