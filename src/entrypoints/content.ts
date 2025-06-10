export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx: any) {
    let iframeElement: HTMLIFrameElement | null = null;
    let isVisible = true;
    let currentLayout = 'compact';

    // Height configurations based on layout mode
    const heightConfig = {
      compact: '72px',
      comfort: '176px'
    };

    // Define the UI
    const ui = createIframeUi(ctx, {
      page: '/iframe.html',
      position: 'inline',
      anchor: 'body',
      onMount: async (wrapper: any, iframe: HTMLIFrameElement) => {
        iframeElement = iframe;

        // Get initial state from background script
        try {
          const response = await browser.runtime.sendMessage({ type: 'GET_IFRAME_STATE' });
          if (response && !response.error) {
            currentLayout = response.layout;
            isVisible = response.power;
          }
        } catch (error) {
          console.error('Failed to get initial state:', error);
        }

        // Apply initial styles
        iframe.style.border = 'none';
        iframe.style.height = heightConfig[currentLayout];
        iframe.style.width = '100%';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '999999';
        iframe.style.transition = 'all 0.3s ease-out';
        iframe.style.opacity = isVisible ? '1' : '0';
        iframe.style.pointerEvents = isVisible ? 'auto' : 'none';
        iframe.style.transform = isVisible ? 'translateY(0)' : 'translateY(100%)';
      },
    });

    // Function to update iframe height
    const updateIframeHeight = (layoutMode: string) => {
      if (iframeElement && isVisible) {
        currentLayout = layoutMode;
        // @ts-ignore
        const newHeight = heightConfig[layoutMode] || heightConfig.compact;
        iframeElement.style.height = newHeight;
        console.log(`Iframe height updated to: ${newHeight} for layout: ${layoutMode}`);
      }
    };

    // Function to toggle iframe visibility
    const toggleIframeVisibility = (visible: boolean) => {
      if (iframeElement) {
        isVisible = visible;

        if (visible) {
          iframeElement.style.opacity = '1';
          iframeElement.style.pointerEvents = 'auto';
          iframeElement.style.transform = 'translateY(0)';
          // @ts-ignore
          iframeElement.style.height = heightConfig[currentLayout];
        } else {
          iframeElement.style.opacity = '0';
          iframeElement.style.pointerEvents = 'none';
          iframeElement.style.transform = 'translateY(100%)';
        }

        console.log(`Iframe visibility toggled: ${visible ? 'visible' : 'hidden'}`);
      }
    };

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message: { type: string; layout?: string; power?: boolean; }) => {
      if (message.type === 'IFRAME_STATE_UPDATE') {
        if (message.layout && message.layout !== currentLayout) {
          updateIframeHeight(message.layout);
        }
        if (message.power !== undefined && message.power !== isVisible) {
          toggleIframeVisibility(message.power);
        }
      }
    });

    // Show UI to user
    ui.mount();

    // Cleanup function
    const cleanup = () => {
      // No cleanup needed since browser.runtime.onMessage handles its own cleanup
    };

    return cleanup;
  },
});