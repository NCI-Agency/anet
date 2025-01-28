// Print friendly table layout for pages
import { Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import { CompactSecurityBanner } from "components/SecurityBanner"
import moment from "moment"
import React, { useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
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
  color?: string
  policyAndClassification?: string
  releasableTo?: string
  sensitiveInformation?: boolean
  useBgColor: boolean
}

export const CompactHeaderContent = ({
  color = utils.getColorForChoice(Settings.siteClassification),
  policyAndClassification = utils.getPolicyAndClassificationForChoice(
    Settings.siteClassification
  ),
  releasableTo = utils.getReleasableToForChoice(Settings.siteClassification),
  sensitiveInformation,
  useBgColor = true
}: CompactHeaderContentProps) => {
  return (
    <HeaderContentS bgc={useBgColor ? color : "unset"}>
      <img
        src={anetLogo}
        alt="logo"
        width="120"
        style={{ position: "absolute" }}
      />
      <ClassificationBoxS>
        <ClassificationBanner
          color={color}
          policyAndClassification={policyAndClassification}
          releasableTo={releasableTo}
          bannerId="header-banner"
        />
        {sensitiveInformation && (
          <SensitivityInformation useBgColor={useBgColor} />
        )}
      </ClassificationBoxS>
    </HeaderContentS>
  )
}

interface CompactFooterContentProps {
  object?: any
  color?: string
  policyAndClassification?: string
  releasableTo?: string
}

export const CompactFooterContent = ({
  object,
  color = utils.getColorForChoice(Settings.siteClassification),
  policyAndClassification = utils.getPolicyAndClassificationForChoice(
    Settings.siteClassification
  ),
  releasableTo = utils.getReleasableToForChoice(Settings.siteClassification)
}: CompactFooterContentProps) => {
  const location = useLocation()
  const { currentUser } = useContext(AppContext)
  return (
    <FooterContentS bgc="unset">
      <ClassificationBanner
        color={color}
        policyAndClassification={policyAndClassification}
        releasableTo={releasableTo}
        bannerId="footer-banner"
      />
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
  text-align: center;
  margin: auto;
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
  background-color: ${props => props.bgc} !important;
`

const FooterContentS = styled.div`
  ${HF_COMMON_STYLE};
  justify-content: center;
  bottom: 0mm;
  background-color: ${props => props.bgc} !important;
`

interface ClassificationBannerProps {
  color: string
  policyAndClassification: string
  releasableTo: string
  bannerId?: string
}

const ClassificationBanner = ({
  color,
  policyAndClassification,
  releasableTo,
  bannerId
}: ClassificationBannerProps) => {
  return (
    <ClassificationBannerS>
      <CompactSecurityBanner
        color={color}
        policyAndClassification={policyAndClassification}
        releasableTo={releasableTo}
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
          <EmptySpaceTdS colSpan={2} />
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
          <EmptySpaceTdS colSpan={2} />
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
    margin: 0px;
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
  const isKeyDetailsRow = className?.includes("keyDetailsRow")
  const CustomStyled = styled(CompactRowS)`
    ${style};
  `

  return (
    <CustomStyled id={id} className={className}>
      {label && !isKeyDetailsRow && <RowLabelS>{label}</RowLabelS>}
      <CompactRowContentS colSpan={!isKeyDetailsRow ? 1 : 2}>
        {content}
      </CompactRowContentS>
    </CustomStyled>
  )
}

export const CompactRowS = styled.tr`
  vertical-align: middle;
  font-family: "Arial", sans-serif;
  width: 100%;
  border-bottom: 1px solid #d1d5db;
  &:last-child {
    border-bottom: none;
    border-bottom: none;
  }
`

const RowLabelS = styled.th`
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  color: #445566;
  width: 20%;
`

export const CompactRowContentS = styled.td`
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #112222;
  text-align: left;
`

interface CompactTitleProps {
  label?: React.ReactNode
}

export const CompactTitle = ({ label }: CompactTitleProps) => {
  return (
    <CompactTitleS>
      <RowLabelS colSpan={2}>{label}</RowLabelS>
    </CompactTitleS>
  )
}

const CompactTitleS = styled(CompactRowS)`
  & > th {
    font-size: 18px;
    color: #223333;
    text-align: center;
    padding: 12px 16px;
    border-bottom: 2px solid #d1d5db;
  }
`

interface CompactSubTitleProps {
  label?: React.ReactNode
}

export const CompactSubTitle = ({ label }: CompactSubTitleProps) => {
  return (
    <CompactSubTitleS>
      <RowLabelS colSpan={2}>{label}</RowLabelS>
    </CompactSubTitleS>
  )
}

const CompactSubTitleS = styled(CompactRowS)`
  & > th {
    color: #404050;
    text-align: center;
    padding: 10px 14px;
  }
`

const getBackgroundIndent = (pageWidth, textWidth) => {
  // Takes page width in "NNNmm", text width in number format and returns left indentation to center the text
  return `${(parseInt(pageWidth) - textWidth) / 2}mm`
}
