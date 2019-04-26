import API from "api"
import "bootstrap/dist/css/bootstrap.css"
import { jumpToTop } from "components/Page"
import "locale-compare-polyfill"
import App from "pages/App"
import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { BrowserRouter, Route } from "react-router-dom"
import { persistStore } from "redux-persist"
import { PersistGate } from "redux-persist/lib/integration/react"
import "./index.css"
import configureStore from "./store/configureStore"

const store = configureStore()
const persistor = persistStore(store)

window.onerror = function(message, url, lineNumber, columnNumber) {
  API.logOnServer("ERROR", url, lineNumber + ":" + columnNumber, message)
  return false
}

ReactDOM.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <BrowserRouter onUpdate={jumpToTop}>
        <Route path="/" component={App} />
      </BrowserRouter>
    </PersistGate>
  </Provider>,
  document.getElementById("root")
)
