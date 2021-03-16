import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import LinkToPreviewed from "components/LinkToPreviewed"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import Settings, { Version } from "settings"

export const SETTING_KEY_TEXT = "SECURITY_BANNER_TEXT"
export const SETTING_KEY_COLOR = "SECURITY_BANNER_COLOR"

const CONNECTION_INFO_COLORS = {
  newVersion: "black",
  error: "red"
}

const css = {
  zIndex: 101,
  position: "relative"
}

const aCss = {
  color: "white",
  fontSize: "0.7em"
}

const SecurityBanner = () => {
  const { appSettings, currentUser, connection } = useContext(AppContext)
  const background = appSettings[SETTING_KEY_COLOR]

  return (
    <>
      <div className="banner" style={{ ...css, background }}>
        <>
          {appSettings[SETTING_KEY_TEXT]} || {currentUser.name}{" "}
          <LinkToPreviewed
            modelType="Person"
            model={currentUser}
            style={aCss}
            showIcon={false}
            previewId="security-banner"
          >
            (edit)
          </LinkToPreviewed>
          <VersionBox>Version : {Version}</VersionBox>
        </>
      </div>
      <ConnectionBanner connection={connection} />
    </>
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

const ConnectionBanner = ({ connection }) => {
  let background = ""
  let newBanner = ""
  if (connection.error) {
    background = CONNECTION_INFO_COLORS.error
    newBanner = <>{Settings.CONNECTION_ERROR_MSG}</>
  } else if (connection.newVersion) {
    background = CONNECTION_INFO_COLORS.newVersion
    newBanner = (
      <a
        href="/"
        onClick={event => {
          window.location.reload()
          event.preventDefault()
        }}
        style={{ color: "white" }}
      >
        {Settings.VERSION_CHANGED_MSG}
      </a>
    )
  }
  return !newBanner ? null : (
    <div className="banner" style={{ ...css, background }}>
      {newBanner}
    </div>
  )
}

ConnectionBanner.propTypes = {
  connection: PropTypes.object.isRequired
}

export const CompactSecurityBanner = () => {
  const { appSettings } = useContext(AppContext)
  return (
    <CompactBannerS className="banner" bgc={appSettings[SETTING_KEY_COLOR]}>
      {appSettings[SETTING_KEY_TEXT]}
    </CompactBannerS>
  )
}
const CompactBannerS = styled.div`
  ${css};
`

export default SecurityBanner
