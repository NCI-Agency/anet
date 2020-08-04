import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import React, { useContext } from "react"

const SETTING_KEY_TEXT = "SECURITY_BANNER_TEXT"
const SETTING_KEY_COLOR = "SECURITY_BANNER_COLOR"

const css = {
  zIndex: 101
}

const aCss = {
  color: "white",
  fontSize: "0.7em"
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
    </div>
  )
}

export default SecurityBanner
