import { initOptions, keycloak } from "keycloak"

keycloak
  .init({ onLoad: initOptions.onLoad })
  .then(authenticated => {
    if (!authenticated) {
      window.location.reload()
    } else {
      console.info("Authenticated successfully")
    }

    require("index.js")
  })
  .catch(() => {
    console.error("Authentication failed")
  })

export default keycloak
