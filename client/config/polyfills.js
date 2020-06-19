import "core-js/stable"
import "locale-compare-polyfill"

// fetch() polyfill for making API calls.
import "cross-fetch/polyfill"

const isIE = /* @cc_on!@ */ false || !!document.documentMode

if (isIE) {
  window.addEventListener("load", function() {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div id="ieBanner" style="display: flex; justify-content: center; align-items: center; width: 100vw; background-color: #ffa500; padding: 4px">' +
        '<div style="font-size: 24px; line-height: 24px; margin: 0 8px">&#9888;</div>' +
        '<div style="font-size: 16px; line-height: 16px; padding-top: 4px">' +
        "Internet Explorer is not fully supported by ANET. Some features may not work. Please consider switching to a modern browser." +
        "</div>" +
        "</div>"
    )
  })
}
