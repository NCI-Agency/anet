import { ApolloProvider } from "@apollo/client"
import { OverlaysProvider } from "@blueprintjs/core"
import API from "api"
import { jumpToTop } from "components/Page"
import "locale-compare-polyfill"
import App from "pages/App"
import React from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { persistStore } from "redux-persist"
import { PersistGate } from "redux-persist/lib/integration/react"
import "./index.css"
import configureStore from "./store/configureStore"

const store = configureStore()
const persistor = persistStore(store)

window.onerror = function (message, url, lineNumber, columnNumber) {
  API.logOnServer("ERROR", url, lineNumber + ":" + columnNumber, message)
  return false
}

const root = createRoot(document.getElementById("root"))

root.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <ApolloProvider client={API.client}>
        <BrowserRouter onUpdate={jumpToTop}>
          <OverlaysProvider>
            <App />
          </OverlaysProvider>
        </BrowserRouter>
      </ApolloProvider>
    </PersistGate>
  </Provider>
)
