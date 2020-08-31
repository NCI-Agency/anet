import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import React, { useContext } from "react"
import { Version } from "settings"

const SETTING_KEY_TEXT = "SECURITY_BANNER_TEXT"
export const SETTING_KEY_COLOR = "SECURITY_BANNER_COLOR"

const css = {
  zIndex: 101,
  position: "relative"
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
      <VersionBox>Version : {Version}</VersionBox>
    </div>
  )
}

const VersionBox = styled.h6`
  position: absolute;
  top: 10px;
  right: 10px;
  margin: 0;
  @media (max-width: 768px) {
    display: none;
  }
`

export const CompactSecurityBanner = () => {
  const { appSettings } = useContext(AppContext)
  return (
    <PrintBanner className="banner" bgc={appSettings[SETTING_KEY_COLOR]}>
      {appSettings[SETTING_KEY_TEXT]}
    </PrintBanner>
  )
}
// override global print background-color stripping
const PrintBanner = styled.div`
  ${css};
`

export default SecurityBanner
