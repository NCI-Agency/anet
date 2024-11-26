import { initOptions, keycloak } from "keycloak"

;(async() => {
  keycloak.onTokenExpired = () =>
    keycloak
      .updateToken()
      .then(() => {
        console.info("Token refreshed")
      })
      .catch(error => {
        console.warn(
          "Keycloak client failed to refresh token, re-authentication is needed"
        )
        console.warn(error)
      })

  try {
    const authenticated = await keycloak.init({ onLoad: initOptions.onLoad })
    if (!authenticated) {
      console.info("Keycloak client not authenticated, reloading page…")
      window.location.reload()
      return
    }
  } catch (error) {
    console.info("Error occurred during Keycloak client initialization")
    console.error(error)
    return
  }

  console.info("Authenticated successfully")
  try {
    await import("index")
  } catch (error) {
    console.error(error)
  }
})()

export default keycloak
