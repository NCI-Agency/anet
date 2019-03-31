import { createStore } from "redux"
import persistReducer from "../reducers/persistReducer"

/**
 * configureStore function which encapsulates the store creation logic,
 * middlewares and enhancers can be added here to the redux store
 * @param {Object} initialState
 */
export default function configureStore(initialState) {
  const enhancer =
    window.__REDUX_DEVTOOLS_EXTENSION__ &&
    window.__REDUX_DEVTOOLS_EXTENSION__({ serialize: true, trace: true })
  if (!enhancer) {
    console.warn(
      "Install Redux DevTools Extension to inspect the app state: " +
        "https://github.com/zalmoxisus/redux-devtools-extension#installation"
    )
  }

  const store = createStore(persistReducer, initialState, enhancer)

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept("../reducers", () => {
      const nextReducer = require("../reducers")
      store.replaceReducer(nextReducer)
    })
  }

  return store
}
