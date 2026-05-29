// jest.setup.js
// Inject missing modern browser encoding globals into JSDOM environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Stub out HTML5 Media properties to prevent unimplemented console errors
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.load = () => {};
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
}