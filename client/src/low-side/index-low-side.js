import "bootstrap/dist/css/bootstrap.css"
// import "index.css"
import "locale-compare-polyfill"
import App from "low-side/App"
import { jumpToTop } from "low-side/components/Page"
import "low-side/index.css"
import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter, Route } from "react-router-dom"

ReactDOM.render(
  <BrowserRouter onUpdate={jumpToTop}>
    <Route path="/" component={App} />
  </BrowserRouter>,
  document.getElementById("root")
)
