const mediaColorScheme = '(prefers-color-scheme: dark)';

chrome.runtime.onMessage.addListener(async (message) => {
  if ('requestMatchMedia' in message) {
    const darkMode = window.matchMedia && window.matchMedia(mediaColorScheme).matches;

    return chrome.runtime.sendMessage({ darkMode: darkMode });
  }
});
