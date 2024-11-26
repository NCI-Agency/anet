import CreateButton from "components/CreateButton"
import SearchBar from "components/SearchBar"
import React from "react"
import { Col, Container, Row } from "react-bootstrap"
import { Link } from "react-router-dom"
import menuLogo from "resources/anet-menu.svg"
import logo from "../../public/favicon/logo.svg"

const backgroundCss = {
  background: "#fff",
  paddingTop: "2em",
  paddingBottom: "1em",
  zIndex: 100,
  boxShadow: "0 4px 6px hsla(0, 0%, 0%, 0.2)"
}

interface HeaderProps {
  minimalHeader?: boolean
  onHomeClick?: (...args: unknown[]) => unknown
  toggleMenuAction?: (...args: unknown[]) => unknown
}

const Header = ({
  minimalHeader,
  onHomeClick,
  toggleMenuAction
}: HeaderProps) => (
  <header style={backgroundCss} className="header">
    <Container fluid>
      <Row>
        <Col xs={3} sm={3} md={2} lg={2}>
          {minimalHeader ? (
            <span>
              <img src={logo} alt="ANET Logo" />
            </span>
          ) : (
            <Link
              className="logo d-none d-sm-block"
              to="/"
              onClick={onHomeClick}
            >
              <img src={logo} alt="ANET logo" />
            </Link>
          )}
          <span className="logo d-xs-block d-sm-none">
            <img src={menuLogo} alt="ANET Menu" onClick={toggleMenuAction} />
          </span>
        </Col>

        {!minimalHeader && (
          <Col xs={6} sm={7} md={8} lg={9} className="middle-header">
            <SearchBar />
          </Col>
        )}

        {!minimalHeader && (
          <Col xs={3} sm={2} md={2} lg={1}>
            <div style={{ paddingRight: 5 }} className="float-end">
              <CreateButton />
            </div>
          </Col>
        )}
      </Row>
    </Container>
  </header>
)

export default Header
