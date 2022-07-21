import { ApolloProvider } from "@apollo/client"
import API from "api"
import "bootstrap/dist/css/bootstrap.css"
import { jumpToTop } from "components/Page"
import "locale-compare-polyfill"
import App from "pages/App"
import React from "react"
import { DndProvider } from "react-dnd-multi-backend"
import HTML5ToTouch from "react-dnd-multi-backend/dist/cjs/HTML5toTouch"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter, Route } from "react-router-dom"
import { persistStore } from "redux-persist"
import { PersistGate } from "redux-persist/lib/integration/react"
import "./bootstrapOverrides.css"
import "./index.css"
import configureStore from "./store/configureStore"

const store = configureStore()
const persistor = persistStore(store)

window.onerror = function(message, url, lineNumber, columnNumber) {
  API.logOnServer("ERROR", url, lineNumber + ":" + columnNumber, message)
  return false
}

const root = createRoot(document.getElementById("root"))

root.render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <ApolloProvider client={API.client}>
        <DndProvider options={HTML5ToTouch}>
          <BrowserRouter onUpdate={jumpToTop}>
            <Route path="/" component={App} />
          </BrowserRouter>
        </DndProvider>
      </ApolloProvider>
    </PersistGate>
  </Provider>
)
