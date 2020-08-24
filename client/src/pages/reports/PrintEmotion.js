import { css } from "@emotion/core"
import AppContext from "components/AppContext"
import LinkTo from "components/LinkTo"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button } from "react-bootstrap"
import anetLogo from "resources/logo.png"
import Settings from "settings"

const PrintReportPage = ({ report, setPrintDone }) => {
  const { currentUser } = useContext(AppContext)

  return (
    <div css={PRINT_PAGE_STYLE}>
      <PrintPageHeader onPrintClick={printReport} setPrintDone={setPrintDone} />
      <ReportHeaderContent report={report} />
      <PrintTable>
        <PrintRow isTitle label={reportTitle()} />
        <PrintRow isTitle label={reportSubTitle()} />
      </PrintTable>
      <ReportFooterContent report={report} />
    </div>
  )

  function printReport() {
    console.log(report, "printed")
    if (typeof window.print === "function") {
      window.print()
    } else {
      alert("Press CTRL+P to print this report")
    }
  }

  function reportTitle() {
    return (
      <>
        Engagement of <LinkTo modelType="Person" model={report.author} /> on{" "}
        {moment(report.engagementDate).format(Report.getEngagementDateFormat())}
        <br />
        at{" "}
        {report.location && (
          <LinkTo modelType="Location" model={report.location} />
        )}
      </>
    )
  }

  function reportSubTitle() {
    return (
      <>
        Authored by <LinkTo modelType="Person" model={report.author} /> on{" "}
        {moment(report.releasedAt).format(
          Settings.dateFormats.forms.displayShort.withTime
        )}
        <br />
        printed by <LinkTo modelType="Person" model={currentUser} /> [
        {Report.STATE_LABELS[report.state]}]
      </>
    )
  }
}

PrintReportPage.propTypes = {
  report: PropTypes.object.isRequired,
  setPrintDone: PropTypes.func
}

const PRINT_PAGE_STYLE = css`
  postion: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: 768px;
  @media print {
    padding: 0;
    outline: none;
  }
`
const PrintPageHeader = ({ onPrintClick, setPrintDone }) => {
  return (
    <header css={HEADER_STYLE}>
      <h3 style={{ margin: 0 }}>Printable Version</h3>
      <div css={BUTTONS_STYLE}>
        <Button type="button" bsStyle="primary" onClick={onPrintClick}>
          Print
        </Button>
        <Button type="button" bsStyle="primary" onClick={setPrintDone}>
          Web View
        </Button>
      </div>
    </header>
  )
}

PrintPageHeader.propTypes = {
  onPrintClick: PropTypes.func,
  setPrintDone: PropTypes.func
}

const HEADER_STYLE = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 768;
`

const BUTTONS_STYLE = css`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  button {
    margin-left: 5px;
    margin-right: 5px;
  }
`

const ReportHeaderContent = ({ report }) => {
  return (
    <div css={HEADER_CONTENT_STYLE}>
      <img src={anetLogo} alt="logo" width="92" height="21" />
      <div css={TOP_CLASSIFICATION_BANNER_STYLE}>Classification Banner</div>
      <span style={{ fontSize: "12px" }}>#{report.uuid}</span>
    </div>
  )
}

ReportHeaderContent.propTypes = {
  report: PropTypes.object
}
const ReportFooterContent = ({ report }) => {
  return (
    <div css={FOOTER_CONTENT_STYLE}>
      <img src={anetLogo} alt="logo" width="92" height="21" />
      <div css={BOTTOM_CLASSIFICATION_BANNER_STYLE}>Classification Banner</div>
      <span style={{ fontSize: "12px" }}>#{report.uuid}</span>
    </div>
  )
}

ReportFooterContent.propTypes = {
  report: PropTypes.object
}

const HF_COMMON_STYLE = css`
  position: absolute;
  display: flex;
  width: 95%;
  margin: 10px auto;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  @media print {
    position: fixed;
  }
`
const HEADER_CONTENT_STYLE = css`
  ${HF_COMMON_STYLE};
  top: 0mm;
  border-bottom: 1px solid black;
`
const FOOTER_CONTENT_STYLE = css`
  ${HF_COMMON_STYLE};
  bot: 0mm;
  border-top: 1px solid black;
`

const CLASSIFICATION_BANNER_STYLE = css`
  position: absolute;
  margin: 10px auto;
  width: 100%;
  text-align: center;
`
const TOP_CLASSIFICATION_BANNER_STYLE = css`
  ${CLASSIFICATION_BANNER_STYLE};
  top: 0;
`
const BOTTOM_CLASSIFICATION_BANNER_STYLE = css`
  ${CLASSIFICATION_BANNER_STYLE};
  bottom: 0;
`

const PrintTable = ({ children }) => {
  return (
    <table css={TABLE_STYLE}>
      <thead>
        <tr>
          <td css={SPACE_STYLE} colSpan="2" />
        </tr>
      </thead>
      <tbody>{children}</tbody>
      <tfoot>
        <tr>
          <td css={SPACE_STYLE} colSpan="2" />
        </tr>
      </tfoot>
    </table>
  )
}

PrintTable.propTypes = {
  children: PropTypes.node
}

const TABLE_STYLE = css`
  width: 100%;
`
const SPACE_STYLE = css`
  height: 70px;
`

const PrintRow = ({ label, content, isTitle }) => {
  return (
    <tr css={ROW_STYLE}>
      {isTitle ? (
        <th colSpan="2">{label}</th>
      ) : (
        <>
          <th>{label}</th>
          <td>{content}</td>
        </>
      )}
    </tr>
  )
}

PrintRow.propTypes = {
  label: PropTypes.node,
  content: PropTypes.node,
  isTitle: PropTypes.bool
}

const ROW_STYLE = css`
  vertical-align: top;
  font-family: "Times New Roman", Times, serif;
  th {
    padding: 4px 0;
    font-style: italic;
    color: grey;
    width: 15%;
  }
  td {
    padding: 4px 1rem;
    label {
      margin: 0 5px;
    }
  }
`

export default PrintReportPage
