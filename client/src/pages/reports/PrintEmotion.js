/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import AppContext from "components/AppContext"
import { ReadonlyCustomFields } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Button } from "react-bootstrap"
import anetLogo from "resources/logo.png"
import Settings from "settings"
import utils from "utils"
import { parseHtmlWithLinkTo } from "utils_links"
import "./PrintEmotion.css"
const PrintReportPage = ({ report, setPrintDone }) => {
  const { currentUser } = useContext(AppContext)

  if (!report) {
    return null
  }
  console.log("Print Report Page")
  console.dir(report)
  report.formCustomFields.itemsAgreed = [
    {
      item: "Very good item",
      dueDate: moment()
    },
    {
      item: "Very nice item",
      dueDate: moment()
    },
    {
      item: "Very bad item",
      dueDate: moment()
    }
  ]
  return (
    <React.Fragment>
      <PrintPageHeader onPrintClick={printReport} setPrintDone={setPrintDone} />
      <div css={PRINT_PAGE_STYLE}>
        <ReportHeaderContent report={report} />
        <PrintTable>
          <PrintRow
            rowType={ROW_TYPES.titleLike}
            titleStyle={TITLE_STYLE}
            label={reportTitle()}
          />
          <PrintRow
            rowType={ROW_TYPES.titleLike}
            titleStyle={SUBTITLE_STYLE}
            label={reportSubTitle()}
          />
          <PrintRow label="purpose" content={report.intent} />
          <PrintRow
            label={
              Settings.fields.report.keyOutcomes.toLowerCase() || "key outcomes"
            }
            content={report.keyOutcomes}
          />
          <PrintRow
            label={Settings.fields.report.nextSteps.toLowerCase()}
            content={report.intent}
          />

          {Settings.engagementsIncludeTimeAndDuration && report.duration ? (
            <PrintRow label="duration(min)" content={report.duration} />
          ) : null}
          {report.cancelled ? (
            <PrintRow
              label="cancelled reason"
              content={utils.sentenceCase(report.cancelledReason)}
            />
          ) : null}
          {!report.cancelled ? (
            <PrintRow
              label={Settings.fields.report.atmosphere.toLowerCase()}
              content={
                <React.Fragment>
                  {utils.sentenceCase(report.atmosphere)}
                  {report.atmosphereDetails && ` – ${report.atmosphereDetails}`}
                </React.Fragment>
              }
            />
          ) : null}
          {report.reportText ? (
            <PrintRow
              label={Settings.fields.report.reportText.toLowerCase()}
              content={parseHtmlWithLinkTo(report.reportText)}
            />
          ) : null}
          {report.reportSensitiveInformation &&
          report.reportSensitiveInformation.text ? (
            <PrintRow
              label="sensitive information"
              content={parseHtmlWithLinkTo(
                report.reportSensitiveInformation.text
              )}
            />
            ) : null}
          {/*             Workflow needs change */}
          {report.showWorkflow() ? (
            <PrintRow label="workflow" content={report.workflow} />
          ) : null}
          <PrintRow label="comments" content={getComments()} />
          {Settings.fields.report.customFields ? (
            <ReadonlyCustomFields
              fieldsConfig={Settings.fields.report.customFields}
              values={report}
              vertical
              printStyle={{ say: "hello" }}
            />
          ) : null}
          <PrintRow label="purpose" content={report.intent} />
          <PrintRow label="purpose" content={report.intent} />
          <PrintRow label="purpose" content={report.intent} />
        </PrintTable>
        <ReportFooterContent report={report} />
      </div>
    </React.Fragment>
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
      <React.Fragment>
        Engagement of <LinkTo modelType="Person" model={report.author} /> on{" "}
        {moment(report.engagementDate).format(Report.getEngagementDateFormat())}
        <br />
        at{" "}
        {report.location && (
          <LinkTo modelType="Location" model={report.location} />
        )}
      </React.Fragment>
    )
  }

  function reportSubTitle() {
    return (
      <React.Fragment>
        Authored by <LinkTo modelType="Person" model={report.author} /> on{" "}
        {moment(report.releasedAt).format(
          Settings.dateFormats.forms.displayShort.withTime
        )}
        <br />
        printed by <LinkTo modelType="Person" model={currentUser} /> [
        {Report.STATE_LABELS[report.state]}]
      </React.Fragment>
    )
  }

  function getComments() {
    return (
      <React.Fragment>
        {report.comments.map(comment => {
          const createdAt = moment(comment.createdAt)
          return (
            <p key={comment.uuid}>
              <LinkTo modelType="Person" model={comment.author} />,
              <span
                title={createdAt.format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              >
                {" "}
                {createdAt.fromNow()}:{" "}
              </span>
              "{comment.text}"
            </p>
          )
        })}

        {!report.comments.length && <p>There are no comments</p>}
      </React.Fragment>
    )
  }
}

PrintReportPage.propTypes = {
  report: PropTypes.object.isRequired,
  setPrintDone: PropTypes.func
}

const PRINT_PAGE_STYLE = css`
  position: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: 768px;
  @media print {
    position: static;
    padding: 0;
    outline: none;
  }
`

const TITLE_STYLE = css`
  font-size: 18px;
  padding-top: 1rem;
  font-style: normal;
  color: black;
  text-align: center;
`
const SUBTITLE_STYLE = css`
  font-style: italic;
  color: black;
  text-align: center;
  font-weight: normal;
`

const PrintPageHeader = ({ onPrintClick, setPrintDone }) => {
  return (
    <header css={HEADER_STYLE}>
      <h3 css={HEADER_TITLE_STYLE}>Printable Version</h3>
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
  width: 768px;
`

const HEADER_TITLE_STYLE = css`
  margin: 0;
  @media print {
    display: none;
  }
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
      <span style={{ fontSize: "12px" }}>
        <LinkTo modelType="Report" model={report} />
      </span>
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
  bottom: 0mm;
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
  height: 50px;
`

const ROW_TYPES = {
  titleLike: "titleLike",
  customField: "customField"
}

export const PrintRow = ({ label, content, rowType, ...otherProps }) => {
  if (rowType === ROW_TYPES.titleLike) {
    const { titleStyle } = otherProps
    const customStyle = css`
      ${ROW_LABEL};
      ${titleStyle};
    `
    return (
      <tr css={ROW_STYLE}>
        <th css={customStyle} colSpan="2">
          {label}
        </th>
      </tr>
    )
  }

  return (
    <tr css={ROW_STYLE}>
      <th css={ROW_LABEL}>{label}</th>
      <td css={ROW_CONTENT}>{content}</td>
    </tr>
  )
}

PrintRow.propTypes = {
  label: PropTypes.node,
  content: PropTypes.node,
  rowType: PropTypes.string
}

const ROW_STYLE = css`
  vertical-align: top;
  font-family: "Times New Roman", Times, serif;
  width: 100%;
`

const ROW_LABEL = css`
  padding: 4px 0;
  font-style: italic;
  color: grey;
  width: 15%;
`

const ROW_CONTENT = css`
  padding: 4px 1rem;
`
export default PrintReportPage
