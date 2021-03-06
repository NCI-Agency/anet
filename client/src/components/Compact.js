// Print friendly table layout for pages
import { Icon, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { Tooltip2 } from "@blueprintjs/popover2"
import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import {
  CompactSecurityBanner,
  SETTING_KEY_COLOR
} from "components/SecurityBanner"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import anetLogo from "resources/logo.svg"
import Settings from "settings"

export const CompactHeaderContent = ({ sensitiveInformation }) => {
  const { appSettings } = useContext(AppContext)
  return (
    <HeaderContentS bgc={appSettings[SETTING_KEY_COLOR]}>
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <ClassificationBoxS>
        <ClassificationBanner />
        {sensitiveInformation && <ReleasabilityInformation />}
      </ClassificationBoxS>
    </HeaderContentS>
  )
}

CompactHeaderContent.propTypes = {
  sensitiveInformation: PropTypes.bool
}

export const CompactFooterContent = ({ object }) => {
  const location = useLocation()
  const { currentUser, appSettings } = useContext(AppContext)
  return (
    <FooterContentS bgc={appSettings[SETTING_KEY_COLOR]}>
      <span style={{ fontSize: "10px" }}>
        uuid: <Link to={location.pathname}>{object.uuid}</Link>
      </span>
      <ClassificationBanner />
      <PrintedByBoxS>
        <div>
          printed by <LinkTo modelType="Person" model={currentUser} />
        </div>
        <div>
          {moment().format(Settings.dateFormats.forms.displayLong.withTime)}
        </div>
      </PrintedByBoxS>
    </FooterContentS>
  )
}

CompactFooterContent.propTypes = {
  object: PropTypes.object
}

const ReleasabilityInformation = () => {
  return (
    <ReleasabilityInformationS>
      <span className="releasability-information">
        {" "}
        - {Settings.printOptions.sensitiveInformationText}
      </span>
      <span className="releasability-tooltip">
        <Tooltip2
          content={Settings.printOptions.sensitiveInformationTooltipText}
          intent={Intent.WARNING}
        >
          <Icon icon={IconNames.INFO_SIGN} intent={Intent.PRIMARY} />
        </Tooltip2>
      </span>
    </ReleasabilityInformationS>
  )
}

const ReleasabilityInformationS = styled.div`
  .releasability-tooltip {
    padding: 0 1rem;
    svg {
      height: 20px;
    }
    @media print {
      display: none;
    }
  }
`

const ClassificationBoxS = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 18px;
  min-width: 235px;
  text-align: center;
  margin: auto;
`

const PrintedByBoxS = styled.span`
  align-self: flex-start;
  width: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  flex-wrap: wrap;
  font-size: 10px;
  & > span {
    display: inline-block;
    text-align: right;
  }
`

// background color of banner makes reading blue links hard. Force white color
const HF_COMMON_STYLE = `
  position: absolute;
  left: 0mm;
  display: flex;
  width: 100%;
  max-height: 80px;
  margin: 10px auto;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  img {
    max-width: 50px !important;
    max-height: 24px !important;
  }
  & * {
    color: white !important;
  }
  @media print {
    position: fixed;
    max-height: 80px;
  }
`

const HeaderContentS = styled.div`
  ${HF_COMMON_STYLE};
  top: 0mm;
  border-bottom: 1px solid black;
  background-color: ${props => props.bgc} !important;
`

const FooterContentS = styled.div`
  ${HF_COMMON_STYLE};
  bottom: 0mm;
  border-top: 1px solid black;
  background-color: ${props => props.bgc} !important;
`

const ClassificationBanner = () => {
  return (
    <ClassificationBannerS>
      <CompactSecurityBanner />
    </ClassificationBannerS>
  )
}

const ClassificationBannerS = styled.div`
  width: auto;
  max-width: 67%;
  text-align: center;
  display: inline-block;
  & > .banner {
    padding: 2px 4px;
  }
`

const CompactTable = ({ className, children }) => {
  return (
    <CompactTableS className={className}>
      <thead>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </thead>
      {
        <tbody>
          <tr>
            <td>{children}</td>
          </tr>
        </tbody>
      }
      <tfoot>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </tfoot>
    </CompactTableS>
  )
}

CompactTable.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

export default CompactTable

const CompactTableS = styled.table`
  width: 100% !important;
  background-color: transparent !important;
  table,
  tbody,
  tr {
    width: 100% !important;
    background-color: transparent !important;
  }
  td {
    background-color: transparent !important;
  }
`
// Used to leave a space from top and bottom in each printed pages
const EmptySpaceTdS = styled.td`
  height: 80px;
`

export const CompactRow = ({ label, content, ...otherProps }) => {
  const { style, className } = otherProps
  // merge custom style
  const CustomStyled = styled(CompactRowS)`
    ${style};
  `

  // top level th have different width
  const isTopLevelTh = className === "reportField"

  return (
    <CustomStyled className={className || null}>
      <RowLabelS isTopLevelTh={isTopLevelTh}>{label}</RowLabelS>
      <CompactRowContentS>{content}</CompactRowContentS>
    </CustomStyled>
  )
}

CompactRow.propTypes = {
  label: PropTypes.node,
  content: PropTypes.node
}

export const CompactRowS = styled.tr`
  vertical-align: top;
  font-family: "Times New Roman", Times, serif;
  width: 100%;
`

const RowLabelS = styled.th`
  padding: 4px 0;
  font-style: italic;
  color: grey;
  max-width: 50%;
  font-weight: 300;
  width: ${props => (props.isTopLevelTh ? "15%" : "auto")};
`

export const CompactRowContentS = styled.td`
  display: flex;
  justify-content: space-between;
  padding: 4px 1rem;
  & .form-control-static {
    margin-bottom: 0;
    padding-top: 0;
  }
  & .bp3-popover2-target {
    padding: 0 1rem;
    svg {
      height: 16px;
    }
    @media print {
      display: none;
    }
  }
`

export const CompactTitle = ({ label }) => {
  return (
    <CompactTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactTitleS>
  )
}

CompactTitle.propTypes = {
  label: PropTypes.node
}

const CompactTitleS = styled(CompactRowS)`
  & > th {
    font-size: 18px;
    font-style: normal;
    color: black;
    text-align: center;
    font-weight: bold;
  }
`

export const CompactSubTitle = ({ label }) => {
  return (
    <CompactSubTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactSubTitleS>
  )
}

CompactSubTitle.propTypes = {
  label: PropTypes.node
}

const CompactSubTitleS = styled(CompactRowS)`
  & > th {
    font-style: italic;
    color: black;
    text-align: center;
    font-weight: normal;
  }
`
