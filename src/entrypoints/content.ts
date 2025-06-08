export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx: any) {
    // Define the UI
    const ui = createIframeUi(ctx, {
      page: '/iframe.html', // Use the entrypoint name
      position: 'inline',
      anchor: 'body',
      onMount: (wrapper: any, iframe: { style: { border: string; height: string; width: string; position: string; bottom: string; left: string; zIndex: string; }; }) => {
        // Add styles to the iframe like width
        iframe.style.border = 'none';
        iframe.style.height = 'auto';
        iframe.style.width = '100%';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '999999';
      },
    });

    // Show UI to user
    ui.mount();
  },
});