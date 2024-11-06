// Print friendly table layout for pages
import { Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import {
  CompactSecurityBanner,
  SETTING_KEY_COLOR
} from "components/SecurityBanner"
import moment from "moment"
import React, { useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import Settings from "settings"
import anetLogo from "../../public/favicon/logo.svg"

export const PAGE_SIZES = {
  A4: {
    name: "A4 (210 x 297 mm)",
    width: "210mm",
    height: "297mm",
    avatarSize: 256
  },
  A5: {
    name: "A5 (148 x 210 mm)",
    width: "148mm",
    height: "210mm",
    avatarSize: 128
  },
  letter: {
    name: "Letter (8.5 x 11 inches)",
    width: "216mm",
    height: "279mm",
    avatarSize: 256
  },
  juniorLegal: {
    name: "Junior Legal (5 x 8 inches)",
    width: "127mm",
    height: "203mm",
    avatarSize: 128
  },
  legal: {
    name: "Legal (8.5 x 14 inches)",
    width: "216mm",
    height: "356mm",
    avatarSize: 256
  }
}

interface CompactViewProps {
  className?: string
  pageSize?: any
  backgroundText?: string
  children?: React.ReactNode
}

export const CompactView = ({
  className,
  pageSize,
  backgroundText,
  children
}: CompactViewProps) => {
  return (
    <CompactViewS
      className={className}
      pageSize={pageSize}
      backgroundText={backgroundText}
    >
      {children}
    </CompactViewS>
  )
}

// color-adjust forces browsers to keep color values of the node
// supported in most major browsers' new versions, but not in IE or some older versions
// TODO: Find a way to calculate background text width after 45deg rotation currently it is hardcoded as 130
const CompactViewS = styled.div`
  position: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: ${props => props.pageSize.width};
  &:before {
    content: "${props => props.backgroundText}";
    z-index: -1000;
    position: absolute;
    font-weight: 100;
    top: 40%;
    left: ${props => getBackgroundIndent(props.pageSize.width, 130)};
    font-size: 150px;
    color: rgba(161, 158, 158, 0.3) !important;
    -webkit-print-color-adjust: exact;
    color-adjust: exact !important;
    transform: rotateZ(-45deg);
  }
  @media print {
    outline: none;
    .banner {
      display: inline-block !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact !important;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: auto;
    }
    @page {
      size: ${props => props.pageSize.width} ${props => props.pageSize.height};
    }
    &:before {
      position: fixed;
    }
    .workflow-action .btn {
      display: inline-block !important;
    }
  }
`

interface CompactHeaderContentProps {
  classification?: string
  sensitiveInformation?: boolean
}

export const CompactHeaderContent = ({
  classification,
  sensitiveInformation
}: CompactHeaderContentProps) => {
  const { appSettings } = useContext(AppContext)
  return (
    <HeaderContentS bgc={appSettings[SETTING_KEY_COLOR]}>
      <img src={anetLogo} alt="logo" width="50" height="12" />
      <ClassificationBoxS>
        <ClassificationBanner
          classification={classification}
          bannerId="header-banner"
        />
        {sensitiveInformation && <SensitivityInformation />}
      </ClassificationBoxS>
    </HeaderContentS>
  )
}

interface CompactFooterContentProps {
  object?: any
  classification?: string
}

export const CompactFooterContent = ({
  object,
  classification
}: CompactFooterContentProps) => {
  const location = useLocation()
  const { currentUser, appSettings } = useContext(AppContext)
  return (
    <FooterContentS bgc={appSettings[SETTING_KEY_COLOR]}>
      <span style={{ fontSize: "10px" }}>
        uuid:{" "}
        <Link to={location.pathname} style={{ fontSize: "10px" }}>
          {object.uuid}
        </Link>
      </span>
      <ClassificationBanner
        classification={classification}
        bannerId="footer-banner"
      />
      <PrintedByBoxS>
        <div>
          printed by{" "}
          <LinkTo
            style={{ fontSize: "10px" }}
            modelType="Person"
            model={currentUser}
          />
        </div>
        <div>
          {moment().format(Settings.dateFormats.forms.displayLong.withTime)}
        </div>
      </PrintedByBoxS>
    </FooterContentS>
  )
}

const SensitivityInformation = () => {
  return (
    <SensitivityInformationS>
      <span className="sensitivity-information">
        {" "}
        - {Settings.printOptions.sensitiveInformationText}
      </span>
      <span className="sensitivity-tooltip">
        <Tooltip
          content={Settings.printOptions.sensitiveInformationTooltipText}
          intent={Intent.WARNING}
        >
          <Icon icon={IconNames.INFO_SIGN} intent={Intent.PRIMARY} />
        </Tooltip>
      </span>
    </SensitivityInformationS>
  )
}

const SensitivityInformationS = styled.div`
  .sensitivity-tooltip {
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

interface ClassificationBannerProps {
  classification?: string
  bannerId?: string
}

const ClassificationBanner = ({
  classification,
  bannerId
}: ClassificationBannerProps) => {
  return (
    <ClassificationBannerS>
      <CompactSecurityBanner
        classification={classification}
        bannerId={bannerId}
      />
    </ClassificationBannerS>
  )
}

const ClassificationBannerS = styled.div`
  width: auto;
  text-align: center;
  display: inline-block;
  & > .banner {
    padding: 2px 4px;
  }
`

interface CompactTableProps {
  className?: string
  children?: React.ReactNode
}

const CompactTable = ({ className, children }: CompactTableProps) => {
  return (
    <CompactTableS className={className}>
      <thead>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <InnerTable>{children}</InnerTable>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </tfoot>
    </CompactTableS>
  )
}

export default CompactTable

export const InnerTable = styled.table`
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  margin-bottom: 10px;
`

export const HalfColumn = styled.tbody`
  flex: 1 1 50%;
`

export const FullColumn = styled.tbody`
  flex: 1 1 100%;
`

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

interface CompactRowProps {
  label?: React.ReactNode
  content?: React.ReactNode
}

export const CompactRow = ({
  label,
  content,
  ...otherProps
}: CompactRowProps) => {
  const { id, style, className } = otherProps
  // merge custom style
  const CustomStyled = styled(CompactRowS)`
    ${style};
  `

  // top level th have different width
  const isHeaderRow = className === "reportField"

  return (
    <CustomStyled id={id} className={className}>
      {label && <RowLabelS isHeaderRow={isHeaderRow}>{label}</RowLabelS>}
      <CompactRowContentS colSpan={label ? 1 : 2}>{content}</CompactRowContentS>
    </CustomStyled>
  )
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
  width: ${props => (props.isHeaderRow ? "15%" : "auto")};
`

export const CompactRowContentS = styled.td`
  padding: 4px 1rem;
  & .form-control-plaintext {
    margin-bottom: 0;
    padding-top: 0;
  }
  & .bp5-icon-info-sign {
    padding: 0 1rem;
    @media print {
      display: none;
    }
  }
`

interface CompactTitleProps {
  label?: React.ReactNode
}

export const CompactTitle = ({ label }: CompactTitleProps) => {
  return (
    <CompactTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactTitleS>
  )
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

interface CompactSubTitleProps {
  label?: React.ReactNode
}

export const CompactSubTitle = ({ label }: CompactSubTitleProps) => {
  return (
    <CompactSubTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactSubTitleS>
  )
}

const CompactSubTitleS = styled(CompactRowS)`
  & > th {
    font-style: italic;
    color: black;
    text-align: center;
    font-weight: normal;
  }
`

const getBackgroundIndent = (pageWidth, textWidth) => {
  // Takes page width in "NNNmm", text width in number format and returns left indentation to center the text
  return `${(parseInt(pageWidth) - textWidth) / 2}mm`
}
