import "@blueprintjs/core/lib/css/blueprint.css"
import { DateRangeInput } from "@blueprintjs/datetime"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import "components/BlueprintOverrides.css"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import DailyRollupChart from "components/DailyRollupChart"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import MosaicLayout from "components/MosaicLayout"
import {
  getSearchQuery,
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import { Organization, Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import { Button, HelpBlock, Modal } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
import { useHistory, useLocation } from "react-router-dom"
import utils from "utils"

const GQL_ROLLUP_GRAPH = gql`
  query(
    $startDate: Long!
    $endDate: Long!
    $principalOrganizationUuid: String
    $advisorOrganizationUuid: String
    $orgType: OrganizationType
  ) {
    rollupGraph(
      startDate: $startDate
      endDate: $endDate
      principalOrganizationUuid: $principalOrganizationUuid
      advisorOrganizationUuid: $advisorOrganizationUuid
      orgType: $orgType
    ) {
      org {
        uuid
        shortName
      }
      published
      cancelled
    }
  }
`
const GQL_SHOW_ROLLUP_EMAIL = gql`
  query(
    $startDate: Long!
    $endDate: Long!
    $principalOrganizationUuid: String
    $advisorOrganizationUuid: String
    $orgType: OrganizationType
  ) {
    showRollupEmail(
      startDate: $startDate
      endDate: $endDate
      principalOrganizationUuid: $principalOrganizationUuid
      advisorOrganizationUuid: $advisorOrganizationUuid
      orgType: $orgType
    )
  }
`
const GQL_EMAIL_ROLLUP = gql`
  mutation(
    $startDate: Long!
    $endDate: Long!
    $email: AnetEmailInput!
    $principalOrganizationUuid: String
    $advisorOrganizationUuid: String
    $orgType: OrganizationType
  ) {
    emailRollup(
      startDate: $startDate
      endDate: $endDate
      email: $email
      principalOrganizationUuid: $principalOrganizationUuid
      advisorOrganizationUuid: $advisorOrganizationUuid
      orgType: $orgType
    )
  }
`

const Chart = props => {
  const { rollupStart, rollupEnd, focusedOrg, setFocusedOrg, orgType } = props
  const variables = getVariables()
  const { loading, error, data } = API.useApiQuery(GQL_ROLLUP_GRAPH, variables)
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  const graphData = useMemo(() => {
    if (!data) {
      return []
    }
    const pinnedOrgs = Settings.pinned_ORGs
    return data.rollupGraph
      .map(d => {
        d.org = d.org || { uuid: "-1", shortName: "Other" }
        return d
      })
      .sort((a, b) => {
        let aIndex = pinnedOrgs.indexOf(a.org.shortName)
        let bIndex = pinnedOrgs.indexOf(b.org.shortName)
        if (aIndex < 0) {
          let nameOrder = a.org.shortName.localeCompare(b.org.shortName)
          return bIndex < 0
            ? nameOrder === 0
              ? a.org.uuid - b.org.uuid
              : nameOrder
            : 1
        } else {
          return bIndex < 0 ? -1 : aIndex - bIndex
        }
      })
  }, [data])
  if (done) {
    return result
  }

  const CHART_ID = "reports_by_day_of_week"
  const barColors = {
    cancelled: "#EC971F",
    verified: "#337AB7"
  }
  const legendCss = {
    width: "14px",
    height: "14px",
    display: "inline-block"
  }

  return (
    <div className="scrollable-y">
      <ContainerDimensions>
        {({ width }) => (
          <DailyRollupChart
            width={width}
            chartId={CHART_ID}
            data={graphData}
            onBarClick={setFocusedOrg}
            tooltip={d => `
              <h4>${d.org.shortName}</h4>
              <p>Published: ${d.published}</p>
              <p>Cancelled: ${d.cancelled}</p>
              <p>Click to view details</p>
            `}
            barColors={barColors}
          />
        )}
      </ContainerDimensions>

      <div className="graph-legend">
        <div style={{ ...legendCss, background: barColors.verified }} />{" "}
        Published reports:&nbsp;
        <strong>
          {graphData.reduce((acc, org) => acc + org.published, 0)}
        </strong>
      </div>
      <div className="graph-legend">
        <div style={{ ...legendCss, background: barColors.cancelled }} />{" "}
        Cancelled engagements:&nbsp;
        <strong>
          {graphData.reduce((acc, org) => acc + org.cancelled, 0)}
        </strong>
      </div>
    </div>
  )

  function getVariables() {
    const variables = {
      startDate: rollupStart.valueOf(),
      endDate: rollupEnd.valueOf()
    }
    if (focusedOrg) {
      if (orgType === Organization.TYPE.PRINCIPAL_ORG) {
        variables.principalOrganizationUuid = focusedOrg.uuid
      } else {
        variables.advisorOrganizationUuid = focusedOrg.uuid
      }
    } else if (orgType) {
      variables.orgType = orgType
    }
    return variables
  }
}

Chart.propTypes = {
  rollupStart: PropTypes.object,
  rollupEnd: PropTypes.object,
  focusedOrg: PropTypes.object,
  setFocusedOrg: PropTypes.func,
  orgType: PropTypes.string
}

const Collection = props => {
  const { queryParams } = props

  return (
    <div className="scrollable">
      <ReportCollection
        paginationKey="r_rollup"
        queryParams={queryParams}
        viewFormats={[FORMAT_CALENDAR, FORMAT_TABLE, FORMAT_SUMMARY]}
      />
    </div>
  )
}

Collection.propTypes = {
  queryParams: PropTypes.object
}

const Map = props => {
  const { queryParams } = props

  return (
    <div className="non-scrollable">
      <ContainerDimensions>
        {({ width, height }) => (
          <ReportCollection
            queryParams={queryParams}
            width={width}
            height={height}
            marginBottom={0}
            viewFormats={[FORMAT_MAP]}
          />
        )}
      </ContainerDimensions>
    </div>
  )
}

Map.propTypes = {
  queryParams: PropTypes.object
}

const BaseRollupShow = props => {
  const { appSettings, searchQuery } = props
  const history = useHistory()
  const routerLocation = useLocation()
  const { startDate, endDate } = getDateRangeFromQS(routerLocation.search)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [orgType, setOrgType] = useState(Organization.TYPE.ADVISOR_ORG)
  const [focusedOrg, setFocusedOrg] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const previewPlaceholderUrl = API.addAuthParams("/help")
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })

  const VISUALIZATIONS = [
    {
      id: "rbdow-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: "Chart by organization",
      renderer: renderChart
    },
    {
      id: "rbdow-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports by organization",
      renderer: renderReportCollection
    },
    {
      id: "rbdow-map",
      icons: [IconNames.MAP],
      title: "Map by organization",
      renderer: renderReportMap
    }
  ]
  const INITIAL_LAYOUT = {
    direction: "row",
    first: VISUALIZATIONS[0].id,
    second: {
      direction: "column",
      first: VISUALIZATIONS[1].id,
      second: VISUALIZATIONS[2].id
    }
  }
  const DESCRIPTION = "Number of reports released per organization."
  const flexStyle = {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    height: "100%"
  }
  const mosaicLayoutStyle = {
    display: "flex",
    flex: "1 1 auto",
    height: "100%"
  }
  const inputFormat = Settings.dateFormats.forms.input.date[0]
  const style = { width: "7em", fontSize: "1em" }

  return (
    <div id="daily-rollup" style={flexStyle}>
      <Messages error={saveError} success={saveSuccess} />

      <Fieldset
        title={
          <div style={{ float: "left" }}>
            <div
              style={{
                paddingBottom: 8,
                display: "flex",
                alignItems: "center"
              }}
            >
              <div style={{ marginRight: 5 }}>
                Rollup
                {focusedOrg && ` for ${focusedOrg.shortName}`}
              </div>
              <DateRangeInput
                className="rollupDateRange"
                startInputProps={{ style }}
                endInputProps={{ style }}
                value={[startDate.toDate(), endDate.toDate()]}
                onChange={changeRollupDate}
                formatDate={date => moment(date).format(inputFormat)}
                parseDate={str =>
                  moment(
                    str,
                    Settings.dateFormats.forms.input.date,
                    true
                  ).toDate()}
                placeholder={inputFormat}
                maxDate={moment().toDate()}
                allowSingleDayRange
                closeOnSelection={false}
                contiguousCalendarMonths={false}
                shortcuts
              />
            </div>
            {focusedOrg ? (
              <Button onClick={() => setFocusedOrg(null)}>
                All organizations
              </Button>
            ) : (
              <ButtonToggleGroup value={orgType} onChange={setOrgType}>
                <Button value={Organization.TYPE.ADVISOR_ORG}>
                  {pluralize(Settings.fields.advisor.org.name)}
                </Button>
                <Button value={Organization.TYPE.PRINCIPAL_ORG}>
                  {pluralize(Settings.fields.principal.org.name)}
                </Button>
              </ButtonToggleGroup>
            )}
          </div>
        }
        action={
          <span>
            <Button
              href={previewPlaceholderUrl}
              target="rollup"
              onClick={printPreview}
            >
              Print
            </Button>
            <Button onClick={toggleEmailModal} bsStyle="primary">
              Email rollup
            </Button>
          </span>
        }
        style={flexStyle}
      >
        <MosaicLayout
          style={mosaicLayoutStyle}
          visualizations={VISUALIZATIONS}
          initialNode={INITIAL_LAYOUT}
          description={DESCRIPTION}
        />
      </Fieldset>
      <Formik
        enableReinitialize
        onSubmit={onSubmitEmailRollup}
        initialValues={{ to: "", comment: "" }}
      >
        {formikProps => renderEmailModal(formikProps)}
      </Formik>
    </div>
  )

  function renderChart(id) {
    return (
      <Chart
        rollupStart={getRollupStart()}
        rollupEnd={getRollupEnd()}
        focusedOrg={focusedOrg}
        setFocusedOrg={setFocusedOrg}
        orgType={orgType}
      />
    )
  }

  function renderReportCollection(id) {
    return <Collection queryParams={getQueryParams()} />
  }

  function renderReportMap(id) {
    return <Map queryParams={getQueryParams()} />
  }

  function getQueryParams() {
    const sqParams = getSearchQuery(searchQuery)
    const maxReportAge =
      1 + (parseInt(appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    const reportsQueryParams = {
      state: [Report.STATE.PUBLISHED], // Specifically excluding cancelled engagements.
      releasedAtStart: getRollupStart().valueOf(),
      releasedAtEnd: getRollupEnd().valueOf(),
      engagementDateStart: moment(getRollupStart())
        .subtract(maxReportAge, "days")
        .valueOf(),
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC",
      ...sqParams
    }
    if (focusedOrg) {
      if (orgType === Organization.TYPE.PRINCIPAL_ORG) {
        reportsQueryParams.principalOrgUuid = focusedOrg.uuid
        reportsQueryParams.includePrincipalOrgChildren = true
      } else {
        reportsQueryParams.advisorOrgUuid = focusedOrg.uuid
        reportsQueryParams.includeAdvisorOrgChildren = true
      }
    }
    return reportsQueryParams
  }

  function getDateStr() {
    if (startDate.isSame(endDate, "day")) {
      return `for ${startDate.format(
        Settings.dateFormats.forms.displayShort.date
      )}`
    } else {
      return `from ${startDate.format(
        Settings.dateFormats.forms.displayShort.date
      )} to ${endDate.format(Settings.dateFormats.forms.displayShort.date)}`
    }
  }

  function getRollupStart() {
    return moment(startDate).startOf("day")
  }

  function getRollupEnd() {
    return moment(endDate).endOf("day")
  }

  function getDateOrDefault(qsDate) {
    return qsDate ? moment(+qsDate) : moment().subtract(1, "day") // default to yesterday
  }

  function getDateRangeFromQS(search) {
    // Having a qs with ?date=… overrides startDate and endDate (for backwards compatibility)
    const qs = utils.parseQueryString(search)
    return {
      startDate: getDateOrDefault(qs.date || qs.startDate),
      endDate: getDateOrDefault(qs.date || qs.endDate)
    }
  }

  function changeRollupDate(dateRange) {
    const startDate = dateRange[0] && dateRange[0].valueOf()
    const endDate = dateRange[1] && dateRange[1].valueOf()
    if (!startDate || !endDate) {
      return
    }
    history.replace({
      pathname: "rollup",
      search: utils.formatQueryString({
        startDate,
        endDate
      })
    })
  }

  function renderEmailModal(formikProps) {
    const { isSubmitting, submitForm } = formikProps
    return (
      <Modal show={showEmailModal} onHide={toggleEmailModal}>
        <Form>
          <Modal.Header closeButton>
            <Modal.Title>Email rollup - {getDateStr()}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>
              {focusedOrg
                ? `Reports for ${focusedOrg.shortName}`
                : `All reports by ${orgType.replace("_", " ").toLowerCase()}`}
            </h5>
            <Field
              name="to"
              component={FieldHelper.renderInputField}
              validate={email => handleEmailValidation(email)}
              vertical
            >
              <HelpBlock>
                One or more email addresses, comma separated, e.g.:
                <br />
                <em>
                  jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr.
                  X" &lt;x@example.org&gt;
                </em>
              </HelpBlock>
            </Field>
            <Field
              name="comment"
              component={FieldHelper.renderInputField}
              componentClass="textarea"
              vertical
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              href={previewPlaceholderUrl}
              target="rollup"
              onClick={showPreview}
            >
              Preview
            </Button>
            <Button
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Send email
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }

  function handleEmailValidation(value) {
    const r = utils.parseEmailAddresses(value)
    return r.isValid ? null : r.message
  }

  function toggleEmailModal() {
    setShowEmailModal(!showEmailModal)
  }

  function printPreview() {
    showPreview(true)
  }

  function showPreview(print) {
    const variables = {
      startDate: getRollupStart().valueOf(),
      endDate: getRollupEnd().valueOf()
    }
    if (focusedOrg) {
      if (orgType === Organization.TYPE.PRINCIPAL_ORG) {
        variables.principalOrganizationUuid = focusedOrg.uuid
      } else {
        variables.advisorOrganizationUuid = focusedOrg.uuid
      }
    }
    if (orgType) {
      variables.orgType = orgType
    }
    return API.query(GQL_SHOW_ROLLUP_EMAIL, variables).then(data => {
      let rollupWindow = window.open("", "rollup")
      let doc = rollupWindow.document
      doc.clear()
      doc.open()
      doc.write(data.showRollupEmail)
      doc.close()
      if (print === true) {
        rollupWindow.print()
      }
    })
  }

  function onSubmitEmailRollup(values, form) {
    emailRollup(values, form)
      .then(response => onSubmitEmailRollupSuccess(response, values, form))
      .catch(error => {
        setSaveSuccess(null)
        setSaveError(error)
        setShowEmailModal(false)
        form.setSubmitting(false)
      })
  }

  function onSubmitEmailRollupSuccess(response, values, form) {
    setSaveSuccess("Email successfully sent")
    setSaveError(null)
    setShowEmailModal(false)
    form.resetForm() // Reset the email modal field values
  }

  function emailRollup(values, form) {
    const r = utils.parseEmailAddresses(values.to)
    if (!r.isValid) {
      return
    }
    const emailDelivery = {
      toAddresses: r.to,
      comment: values.comment
    }
    const variables = {
      startDate: getRollupStart().valueOf(),
      endDate: getRollupEnd().valueOf(),
      email: emailDelivery
    }
    if (focusedOrg) {
      if (orgType === Organization.TYPE.PRINCIPAL_ORG) {
        variables.principalOrganizationUuid = focusedOrg.uuid
      } else {
        variables.advisorOrganizationUuid = focusedOrg.uuid
      }
    }
    if (orgType) {
      variables.orgType = orgType
    }
    return API.mutation(GQL_EMAIL_ROLLUP, variables)
  }
}

BaseRollupShow.propTypes = {
  appSettings: PropTypes.object,
  ...pagePropTypes
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const RollupShow = props => (
  <AppContext.Consumer>
    {context => <BaseRollupShow appSettings={context.appSettings} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RollupShow)
