import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import { Person } from "models"
import PropTypes from "prop-types"
import React from "react"

const SETTING_KEY_TEXT = "SECURITY_BANNER_TEXT"
const SETTING_KEY_COLOR = "SECURITY_BANNER_COLOR"

const css = {
  zIndex: 101
}

const aCss = {
  color: "white",
  fontSize: "0.7em"
}

const BaseSecurityBanner = ({ currentUser, appSettings }) => (
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
BaseSecurityBanner.propTypes = {
  currentUser: PropTypes.instanceOf(Person),
  appSettings: PropTypes.object
}
BaseSecurityBanner.defaultProps = {
  appSettings: {}
}

const SecurityBanner = props => (
  <AppContext.Consumer>
    {context => (
      <BaseSecurityBanner
        appSettings={context.appSettings}
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default SecurityBanner
