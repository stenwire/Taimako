(function () {
  const BACKEND_URL = "http://localhost:8000"; // Should be env var in production
  const FRONTEND_URL = "http://localhost:3000"; // Should be env var in production

  // Find the script element
  const validScripts = document.getElementsByTagName("script");
  let currentScript = null;
  for (let i = 0; i < validScripts.length; i++) {
    if (validScripts[i].dataset.widgetId) {
      currentScript = validScripts[i];
      break;
    }
  }

  if (!currentScript) {
    console.error("Sten Widget: Script tag with data-widget-id not found.");
    return;
  }

  const widgetId = currentScript.dataset.widgetId;

  // Create Container
  const container = document.createElement("div");
  container.id = "sten-widget-container";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "999999";
  container.style.fontFamily = "sans-serif";
  document.body.appendChild(container);

  // Fetch Config
  fetch(`${BACKEND_URL}/widgets/config/${widgetId}`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load widget config");
      return res.json();
    })
    .then(config => {
      initWidget(config);
    })
    .catch(err => {
      console.error("Sten Widget Error:", err);
    });

  function initWidget(config) {
    const primaryColor = config.primary_color || "#000000";

    // Launcher Button
    const button = document.createElement("div");
    button.style.width = "60px";
    button.style.height = "60px";
    button.style.borderRadius = "50%";
    button.style.backgroundColor = primaryColor;
    button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    button.style.cursor = "pointer";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.transition = "transform 0.2s";

    // Icon
    const iconImg = document.createElement("img");
    // Use provided icon or default chat icon
    iconImg.src = config.icon_url || "https://api.iconify.design/lucide:message-circle.svg?color=white";
    iconImg.style.width = "30px";
    iconImg.style.height = "30px";
    button.appendChild(iconImg);

    container.appendChild(button);

    // Iframe Container (Hidden initially)
    const iframeContainer = document.createElement("div");
    iframeContainer.style.width = "380px";
    iframeContainer.style.height = "520px";
    iframeContainer.style.backgroundColor = "white";
    iframeContainer.style.borderRadius = "12px";
    iframeContainer.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
    iframeContainer.style.maxHeight = "calc(100vh - 100px)";
    iframeContainer.style.maxWidth = "calc(100vw - 40px)";
    iframeContainer.style.position = "absolute";
    iframeContainer.style.bottom = "80px";
    iframeContainer.style.right = "0";
    iframeContainer.style.overflow = "hidden";
    iframeContainer.style.opacity = "0";
    iframeContainer.style.transform = "translateY(20px)";
    iframeContainer.style.pointerEvents = "none";
    iframeContainer.style.transition = "opacity 0.2s ease, transform 0.2s ease";

    // Iframe
    const iframe = document.createElement("iframe");
    iframe.src = `${FRONTEND_URL}/widget/${widgetId}`;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframeContainer.appendChild(iframe);

    container.appendChild(iframeContainer);

    // Focus helper - when clicking iframe container, focus the iframe content
    iframeContainer.addEventListener('click', () => {
      iframe.focus();
    });

    // Toggle Logic
    let isOpen = false;
    button.addEventListener("click", () => {
      isOpen = !isOpen;
      if (isOpen) {
        iframeContainer.style.opacity = "1";
        iframeContainer.style.transform = "translateY(0)";
        iframeContainer.style.pointerEvents = "auto";
        // Focus the iframe when opening
        setTimeout(() => iframe.focus(), 100);
      } else {
        iframeContainer.style.opacity = "0";
        iframeContainer.style.transform = "translateY(20px)";
        iframeContainer.style.pointerEvents = "none";
      }
    });
  }

})();
