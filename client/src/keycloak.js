import * as Keycloak from "keycloak-js"

// Keycloak init options
export const initOptions = {
  url: "http://localhost:9080/auth",
  realm: "ANET-Realm",
  clientId: "ANET-Dev-Client",
  onLoad: "login-required"
}

export const keycloak =
  typeof Keycloak === "function" ? Keycloak(initOptions) : {}
