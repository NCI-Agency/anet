// Keycloak initialization in browser context
import Keycloak from "keycloak-js"
import Settings from "settings"

// Client-side Keycloak init options are defined in the dictionary by the server
const { realm, url, clientId } = Settings.keycloakConfiguration
export const initOptions = { realm, url, clientId, onLoad: "login-required" }

export const keycloak = new Keycloak(initOptions)
