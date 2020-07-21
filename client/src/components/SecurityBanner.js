import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import React, { useContext } from "react"
import { Version } from "settings"

const SETTING_KEY_TEXT = "SECURITY_BANNER_TEXT"
const SETTING_KEY_COLOR = "SECURITY_BANNER_COLOR"

const css = {
  zIndex: 101,
  position: "relative"
}

const aCss = {
  color: "white",
  fontSize: "0.7em"
}

const versionCss = {
  position: "absolute",
  top: 10,
  right: 10,
  margin: 0
}

const SecurityBanner = () => {
  const { appSettings, currentUser } = useContext(AppContext)
  return (
    <div
      className="banner"
      style={{ ...css, background: appSettings[SETTING_KEY_COLOR] }}
    >
      {appSettings[SETTING_KEY_TEXT]} || {currentUser.name}{" "}
      <LinkTo
        modelType="Person"
        model={currentUser}
        style={aCss}
        showIcon={false}
      >
        (edit)
      </LinkTo>
      <h6 style={{ ...versionCss }}>Version : {Version}</h6>
    </div>
  )
}

export default SecurityBanner
