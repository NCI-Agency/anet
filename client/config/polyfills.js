import 'core-js/stable'
import 'locale-compare-polyfill'

// Unhandled rejection may affect REACT state. Making sure these are logged
// TODO: log on server
// TODO: move this to platform specfic api.js for web and add nodejs implementation
window.addEventListener('unhandledrejection', e => console.log('(**) Unhandled rejection', e.reason, e.promise))

// fetch() polyfill for making API calls.
require('whatwg-fetch')
