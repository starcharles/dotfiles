// This script is loaded by FigmaWebviewPanel and can be used to run JS in its
// context, for example for handling messages

const figmaIframe = document.getElementById('figma-iframe')
if (!figmaIframe) {
  throw new Error('Figma iframe not found')
}

const figmaIframeSource = figmaIframe.contentWindow
const vsCode = acquireVsCodeApi()

// Handle messages from the extension by passing into the Figma iframe
window.addEventListener('message', (message) => {
  // console.log('Extension recevied message', message)

  if (message.source === figmaIframeSource) {
    // console.log('Extension webview posting received message from iframe to VS Code', message.data)
    vsCode.postMessage(message.data)
  } else {
    // console.log('Extension webview posting received message from VS Code to iframe', message.data)
    document.getElementById('figma-iframe').contentWindow.postMessage(message.data, '*')
  }
})
