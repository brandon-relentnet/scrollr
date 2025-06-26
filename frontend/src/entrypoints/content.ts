import debugLogger, { DEBUG_CATEGORIES } from "./utils/debugLogger.js";

export default defineContentScript({
  matches: ["<all_urls>"],

  main(ctx: any) {
    let iframeElement: HTMLIFrameElement | null = null;
    let isVisible = true;
    let currentLayout = "compact";
    let currentPosition = "bottom";
    let currentOpacity = 1.0;

    // Height configurations based on layout mode
    const heightConfig: { [key: string]: string } = {
      compact: "72px",
      comfort: "176px",
    };

    // Define the UI
    const ui = createIframeUi(ctx, {
      page: "/iframe.html",
      position: "inline",
      anchor: "body",
      onMount: async (wrapper: any, iframe: HTMLIFrameElement) => {
        iframeElement = iframe;

        // Get initial state from background script
        try {
          const response = await browser.runtime.sendMessage({
            type: "GET_IFRAME_STATE",
          });
          if (response && !response.error) {
            currentLayout = response.layout;
            currentPosition = response.position || "bottom";
            currentOpacity = response.opacity ?? 1.0;
            isVisible = response.power;
          }
        } catch (error) {
          debugLogger.error(DEBUG_CATEGORIES.UI, "Failed to get initial state", error);
        }

        // Apply initial styles
        iframe.style.border = "none";
        iframe.style.height = heightConfig[currentLayout];
        iframe.style.width = "100%";
        iframe.style.position = "fixed";
        iframe.style.left = "0";
        iframe.style.zIndex = "2147483647";
        iframe.style.transition = "all 0.3s ease-out";
        iframe.style.opacity = isVisible ? currentOpacity.toString() : "0";
        iframe.style.pointerEvents = isVisible ? "auto" : "none";

        // Set initial position
        updateIframePosition(currentPosition);
        updateIframeTransform(isVisible, currentPosition);
      },
    });

    // Function to update iframe position (top/bottom)
    const updateIframePosition = (position: string) => {
      if (iframeElement) {
        if (position === "top") {
          iframeElement.style.top = "0";
          iframeElement.style.bottom = "";
        } else {
          iframeElement.style.bottom = "0";
          iframeElement.style.top = "";
        }
        currentPosition = position;
        debugLogger.uiEvent(`Iframe position updated to ${position}`);
      }
    };

    // Function to update iframe transform based on visibility and position
    const updateIframeTransform = (visible: boolean, position: string) => {
      if (iframeElement) {
        if (visible) {
          iframeElement.style.transform = "translateY(0)";
        } else {
          const translateDirection = position === "top" ? "-100%" : "100%";
          iframeElement.style.transform = `translateY(${translateDirection})`;
        }
      }
    };

    // Function to update iframe height
    const updateIframeHeight = (layoutMode: string) => {
      if (iframeElement && isVisible) {
        currentLayout = layoutMode;
        const newHeight = heightConfig[layoutMode] || heightConfig.compact;
        iframeElement.style.height = newHeight;
        debugLogger.uiEvent(`Iframe height updated to ${newHeight} for layout ${layoutMode}`);
      }
    };

    // Function to update iframe opacity
    const updateIframeOpacity = (opacity: number) => {
      if (iframeElement && isVisible) {
        currentOpacity = Math.max(0, Math.min(1, opacity));
        iframeElement.style.opacity = currentOpacity.toString();
        debugLogger.uiEvent(`Iframe opacity updated to ${currentOpacity}`);
      }
    };

    // Function to toggle iframe visibility
    const toggleIframeVisibility = (visible: boolean) => {
      if (iframeElement) {
        isVisible = visible;

        if (visible) {
          iframeElement.style.opacity = currentOpacity.toString();
          iframeElement.style.pointerEvents = "auto";
          iframeElement.style.height = heightConfig[currentLayout];
        } else {
          iframeElement.style.opacity = "0";
          iframeElement.style.pointerEvents = "none";
        }

        updateIframeTransform(visible, currentPosition);
        debugLogger.uiEvent(`Iframe visibility toggled: ${visible ? "visible" : "hidden"}`);
      }
    };

    // Listen for messages from background script
    browser.runtime.onMessage.addListener(
      (message: {
        type: string;
        layout?: string;
        power?: boolean;
        position?: string;
        opacity?: number;
      }) => {
        if (message.type === "IFRAME_STATE_UPDATE") {
          if (message.layout && message.layout !== currentLayout) {
            updateIframeHeight(message.layout);
          }
          if (message.position && message.position !== currentPosition) {
            updateIframePosition(message.position);
            updateIframeTransform(isVisible, message.position);
          }
          if (message.opacity !== undefined && message.opacity !== currentOpacity) {
            updateIframeOpacity(message.opacity);
          }
          if (message.power !== undefined && message.power !== isVisible) {
            toggleIframeVisibility(message.power);
          }
        } else if (message.type === "LOGOUT_REFRESH") {
          // Refresh the iframe when user logs out
          if (iframeElement) {
            debugLogger.uiEvent("Refreshing iframe due to logout");
            // Force reload the iframe
            const currentSrc = iframeElement.src;
            iframeElement.src = "";
            setTimeout(() => {
              if (iframeElement) {
                iframeElement.src = currentSrc;
              }
            }, 100);
          }
        }
      }
    );

    // Show UI to user
    ui.mount();
  },
});
