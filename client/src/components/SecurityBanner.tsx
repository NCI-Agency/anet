import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import LinkTo from "components/LinkTo"
import { Person } from "models"
import React, { useContext, useEffect, useRef, useState } from "react"
import { ButtonGroup, Dropdown } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"
import Version from "version"

const CONNECTION_INFO_COLORS = {
  newVersion: "black",
  error: "red"
}

const css = {
  zIndex: 101,
  display: "flex",
  alignItems: "center"
}

interface SecurityBannerProps {
  onLogout?: (...args: unknown[]) => unknown
  handleSecurityBannerBottom?: (...args: unknown[]) => unknown
}

const SecurityBanner = ({
  onLogout,
  handleSecurityBannerBottom
}: SecurityBannerProps) => {
  const { currentUser, connection } = useContext(AppContext)
  const securityTextRef = useRef(null)
  const [bannerSideHeight, setBannerSideHeight] = useState(0)
  const securityTextHeight = securityTextRef.current?.clientHeight || 0
  const securityBannerRef = useRef()
  const [securityBannerOffset, setSecurityBannerOffset] = useState(0)

  useEffect(() => {
    setBannerSideHeight(securityTextHeight)
  }, [setBannerSideHeight, securityTextHeight])

  useEffect(() => {
    function updateSecurityBannerBottom() {
      const curOffset = securityBannerRef.current.getBoundingClientRect().bottom
      if (curOffset !== undefined && curOffset !== securityBannerOffset) {
        setSecurityBannerOffset(curOffset)
      }
    }
    updateSecurityBannerBottom()
    window.addEventListener("resize", updateSecurityBannerBottom)
    // returned function will be called on component unmount
    return () => {
      window.removeEventListener("resize", updateSecurityBannerBottom)
    }
  }, [securityBannerOffset])

  useEffect(() => {
    if (handleSecurityBannerBottom !== undefined) {
      handleSecurityBannerBottom(securityBannerOffset)
    }
  }, [securityBannerOffset, handleSecurityBannerBottom])

  return (
    <>
      <SecurityBannerContainer className="bg-primary" ref={securityBannerRef}>
        <VersionBox id="bannerVersion">Version : {Version}</VersionBox>
        <SecurityTextContainer
          id="bannerSecurityText"
          ref={securityTextRef}
          bgc={utils.getColorForChoice(Settings.siteClassification)}
          sideHeight={bannerSideHeight}
        >
          <span className="fw-bold me-1">
            {utils.getPolicyAndClassificationForChoice(
              Settings.siteClassification
            )}
          </span>
          <span>
            {utils.getReleasableToForChoice(Settings.siteClassification)}
          </span>
        </SecurityTextContainer>
        <UserBox id="bannerUser">
          <Dropdown as={ButtonGroup}>
            <LinkTo
              modelType="Person"
              model={currentUser}
              button
              className="shadow-none"
              variant="primary"
              showIcon={false}
            >
              <EntityAvatarDisplay
                avatar={currentUser.entityAvatar}
                defaultAvatar={Person.relatedObjectType}
                width={25}
                height={25}
              />{" "}
              {Person.militaryName(currentUser.name)}
            </LinkTo>
            {Settings.keycloakConfiguration.showLogoutLink && (
              <Dropdown.Toggle
                className="shadow-none"
                split
                id="dropdown-split-basic"
              />
            )}
            <Dropdown.Menu>
              <Dropdown.Item href="/api/logout" onClick={onLogout}>
                Sign out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </UserBox>
      </SecurityBannerContainer>
      <ConnectionBanner connection={connection} />
    </>
  )
}

const VersionBox = styled.h6`
  flex: 2 2 20%;
  text-align: left;
  margin: 0 20px;
  line-height: 40px;
  @media (max-width: 768px) {
    display: none;
  }
  font-size: 12px;
`

const UserBox = styled.h6`
  flex: 2 2 20%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 0 20px;
  line-height: 40px;
  font-size: 12px;
`

const SecurityTextContainer = styled.div`
  background: ${props => props.bgc};
  color: ${props => utils.getContrastYIQ(props.bgc, "black")};
  flex: 3 3 30%;
  margin-bottom: 10px;
  line-height: 25px;
  align-self: start;
  text-align: center;
  position: relative;
  &:before {
    content: "";
    border-right: ${props => `20px solid ${props.bgc}`};
    border-bottom: ${props => `${props.sideHeight}px solid transparent`};
    position: absolute;
    left: -20px;
    top: 0;
  }

  &:after {
    content: "";
    border-left: ${props => `20px solid ${props.bgc}`};
    border-bottom: ${props => `${props.sideHeight}px solid transparent`};
    position: absolute;
    right: -20px;
    top: 0;
  }
`

const SecurityBannerContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  z-index: 1202;
  position: relative;
`

interface ConnectionBannerProps {
  connection: any
}

const ConnectionBanner = ({ connection }: ConnectionBannerProps) => {
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

interface CompactSecurityBannerProps {
  policyAndClassification: string
  releasableTo: string
  bannerId?: string
}

export const CompactSecurityBanner = ({
  policyAndClassification,
  releasableTo,
  bannerId
}: CompactSecurityBannerProps) => {
  return (
    <CompactBannerS className="banner">
      <span className="fw-bold me-1" id={bannerId}>
        {policyAndClassification}
      </span>
      <span>{releasableTo}</span>
    </CompactBannerS>
  )
}

const CompactBannerS = styled.div`
  color: black;
  display: flex;
  flex-direction: column;
`

export default SecurityBanner
