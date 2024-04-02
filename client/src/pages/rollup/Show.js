import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import { IconNames } from "@blueprintjs/icons"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  DEFAULT_SEARCH_QUERY,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API from "api"
import "components/BlueprintOverrides.css"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import DailyRollupChart from "components/DailyRollupChart"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import MosaicLayout from "components/MosaicLayout"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_STATISTICS,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
import {
  deserializeQueryParams,
  getSearchQuery,
  SearchQueryPropType
} from "components/SearchFilters"
import { Field, Form, Formik } from "formik"
import { Report, RollupGraph } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import { Button, FormText, Modal } from "react-bootstrap"
import { connect } from "react-redux"
import { useResizeDetector } from "react-resize-detector"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        state
        engagementDate
        advisorOrg {
          uuid
          shortName
          longName
          identificationCode
          ascendantOrgs {
            uuid
            shortName
            longName
            identificationCode
          }
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
          ascendantOrgs {
            uuid
            shortName
            longName
            identificationCode
          }
        }
      }
    }
  }
`

const GQL_SHOW_ROLLUP_EMAIL = gql`
  query (
    $startDate: Instant!
    $endDate: Instant!
    $orgUuid: String
    $orgType: RollupGraphType
  ) {
    showRollupEmail(
      startDate: $startDate
      endDate: $endDate
      orgUuid: $orgUuid
      orgType: $orgType
    )
  }
`
const GQL_EMAIL_ROLLUP = gql`
  mutation (
    $startDate: Instant!
    $endDate: Instant!
    $email: AnetEmailInput!
    $orgUuid: String
    $orgType: RollupGraphType
  ) {
    emailRollup(
      startDate: $startDate
      endDate: $endDate
      email: $email
      orgUuid: $orgUuid
      orgType: $orgType
    )
  }
`

const Chart = ({
  queryParams,
  pageDispatchers,
  setOrg,
  orgType,
  setOrgType
}) => {
  const { width, ref } = useResizeDetector()
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery: { ...queryParams, pageSize: 0 }
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const graphData = useMemo(() => {
    if (!data) {
      return {}
    }
    return generateChartDataFromAllReports(
      data.reportList.list,
      queryParams.orgUuid
    )
  }, [data, queryParams.orgUuid])

  const advisorOrgGraphData = useMemo(() => {
    return Object.values(graphData?.advisorOrgReports || {}).sort((a, b) =>
      a.org.shortName > b.org.shortName ? 1 : -1
    )
  }, [graphData])
  const interlocutorOrgGraphData = useMemo(() => {
    return Object.values(graphData?.interlocutorOrgReports || {}).sort((a, b) =>
      a.org.shortName > b.org.shortName ? 1 : -1
    )
  }, [graphData])

  const displayedGraphData =
    orgType === RollupGraph.TYPE.ADVISOR
      ? advisorOrgGraphData
      : interlocutorOrgGraphData

  if (done) {
    return result
  }

  const CHART_ID = "reports_by_organization"
  const barColors = {
    cancelled: "#ec971f",
    published: "#75eb75",
    planned: "#2965cc"
  }
  const legendCss = {
    width: "14px",
    height: "14px",
    display: "inline-block"
  }
  const publishedLabel = "Published engagement reports"
  const plannedLabel = "Approved planned engagements"
  const cancelledLabel = "Cancelled engagements"
  return (
    <div ref={ref} className="scrollable-y">
      <ButtonToggleGroup value={orgType} onChange={setOrgType}>
        <Button value={RollupGraph.TYPE.ADVISOR} variant="outline-secondary">
          {pluralize(Settings.fields.advisor.org.name)}
        </Button>
        <Button
          value={RollupGraph.TYPE.INTERLOCUTOR}
          variant="outline-secondary"
        >
          {pluralize(Settings.fields.interlocutor.org.name)}
        </Button>
      </ButtonToggleGroup>
      <DailyRollupChart
        width={width}
        chartId={CHART_ID}
        data={displayedGraphData}
        onBarClick={setOrg}
        tooltip={d => `
            <h4>${d.org.shortName}</h4>
            <p>${publishedLabel}: ${d.published}</p>
            <p>${plannedLabel}: ${d.planned}</p>
            <p>${cancelledLabel}: ${d.cancelled}</p>
            <p>Click to view details</p>
          `}
        barColors={barColors}
      />

      <div className="graph-legend">
        <div
          className="me-1"
          style={{ ...legendCss, background: barColors.published }}
        />
        {publishedLabel}:
        <strong className="ms-1">
          {displayedGraphData.reduce((acc, org) => acc + org.published, 0)}
        </strong>
      </div>
      <div className="graph-legend">
        <div
          className="me-1"
          style={{ ...legendCss, background: barColors.planned }}
        />
        {plannedLabel}:
        <strong className="ms-1">
          {displayedGraphData.reduce((acc, org) => acc + org.planned, 0)}
        </strong>
      </div>
      <div className="graph-legend">
        <div
          className="me-1"
          style={{ ...legendCss, background: barColors.cancelled }}
        />
        {cancelledLabel}:
        <strong className="ms-1">
          {displayedGraphData.reduce((acc, org) => acc + org.cancelled, 0)}
        </strong>
      </div>
    </div>
  )
}

Chart.propTypes = {
  queryParams: PropTypes.object,
  pageDispatchers: PageDispatchersPropType,
  setOrg: PropTypes.func,
  orgType: PropTypes.oneOf(Object.values(RollupGraph.TYPE)),
  setOrgType: PropTypes.func
}

const updateOrgReports = (
  orgReports,
  displayedOrg,
  reportState,
  engagementDate
) => {
  // Initialize the organization object if it is the first report belongs to the organization
  const elem = (orgReports[displayedOrg.uuid] ??= {
    org: displayedOrg,
    published: 0,
    planned: 0,
    cancelled: 0
  })
  const now = moment()
  if (reportState === Report.STATE.PUBLISHED) {
    if (now.isBefore(engagementDate)) {
      elem.planned++
    } else {
      elem.published++
    }
  } else if (reportState === Report.STATE.CANCELLED) {
    elem.cancelled++
  }
  return elem
}

const generateChartDataFromAllReports = (allReports, orgFilterUuid) => {
  return allReports.reduce(
    (acc, r) => {
      if (r.advisorOrg) {
        const topLevelAdvisorOrg = r.advisorOrg.ascendantOrgs[0]
        // If reports are not filtered for organization show reports under the top level organization
        const displayedAdvisorOrg = orgFilterUuid
          ? r.advisorOrg
          : topLevelAdvisorOrg
        updateOrgReports(
          acc.advisorOrgReports,
          displayedAdvisorOrg,
          r.state,
          r.engagementDate
        )
      }
      if (r.interlocutorOrg) {
        const topLevelInterlocutorOrg = r.interlocutorOrg.ascendantOrgs[0]
        const displayedInterlocutorOrg = orgFilterUuid
          ? r.interlocutorOrg
          : topLevelInterlocutorOrg
        updateOrgReports(
          acc.interlocutorOrgReports,
          displayedInterlocutorOrg,
          r.state,
          r.engagementDate
        )
      }

      return acc
    },
    { advisorOrgReports: {}, interlocutorOrgReports: {} }
  )
}

const REPORT_SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS]
})

const ROLLUP_PERIODS = ["day", "week", "month"]

const Collection = ({ queryParams }) => (
  <div className="scrollable">
    <ReportCollection
      paginationKey="r_rollup"
      queryParams={queryParams}
      viewFormats={[
        FORMAT_SUMMARY,
        FORMAT_TABLE,
        FORMAT_STATISTICS,
        FORMAT_CALENDAR
      ]}
    />
  </div>
)

Collection.propTypes = {
  queryParams: PropTypes.object
}

const Map = ({ queryParams }) => {
  const { width, height, ref } = useResizeDetector()
  return (
    <div ref={ref} className="non-scrollable">
      <ReportCollection
        queryParams={queryParams}
        width={width}
        height={height}
        marginBottom={0}
        viewFormats={[FORMAT_MAP]}
      />
    </div>
  )
}

Map.propTypes = {
  queryParams: PropTypes.object
}

const RollupShow = ({ pageDispatchers, searchQuery, setSearchQuery }) => {
  const [period, setPeriod] = useState(ROLLUP_PERIODS[0])
  const [orgType, setOrgType] = useState(RollupGraph.TYPE.ADVISOR)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const previewPlaceholderUrl = "/help"
  let queryParams
  if (searchQuery === DEFAULT_SEARCH_QUERY) {
    // when going from a different page to the rollup page, use the default
    // rollup search query
    queryParams = setRollupDefaultSearchQuery()
  } else {
    queryParams = getSearchQuery(searchQuery)
  }
  const startDate = moment(queryParams.releasedAtStart)
  const endDate = moment(queryParams.releasedAtEnd)
  const { orgUuid } = queryParams
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: REPORT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Daily Rollup")
  const VISUALIZATIONS = [
    {
      id: "rbdow-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports by organization",
      renderer: renderReportCollection
    },
    {
      id: "rbdow-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: "Chart by organization",
      renderer: renderChart
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
    second: VISUALIZATIONS[1].id
  }
  const DESCRIPTION = "Number of reports released per organization."
  const flexStyle = {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    height: "100%",
    overflow: "auto"
  }
  const fieldsetStyle = {
    height: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column"
  }
  const mosaicLayoutStyle = {
    display: "flex",
    flex: "1 1 auto",
    height: "100%"
  }

  return (
    <div id="daily-rollup" style={flexStyle}>
      <Messages error={saveError} success={saveSuccess} />

      <Fieldset
        title={
          <div style={{ float: "left" }}>
            <div className="rollup-date-range-container">
              <div style={{ marginRight: 5 }}>Rollup</div>
              <Button
                id="previous-period"
                onClick={() => showPreviousPeriod(period)}
                variant="outline-secondary"
                style={{ marginRight: 5 }}
              >
                <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
              </Button>
              <ButtonToggleGroup
                value={period}
                onChange={period => {
                  changePeriod(period)
                }}
              >
                {ROLLUP_PERIODS.map(period => (
                  <Button
                    key={period}
                    value={period}
                    variant="outline-secondary"
                  >
                    {period}
                  </Button>
                ))}
              </ButtonToggleGroup>
              <Button
                id="next-period"
                onClick={() => showNextPeriod(period)}
                variant="outline-secondary"
                style={{ marginLeft: 5 }}
              >
                <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
              </Button>
            </div>
          </div>
        }
        action={
          <>
            <Button
              id="print-rollup"
              href={previewPlaceholderUrl}
              target="rollup"
              onClick={printPreview}
              variant="outline-secondary"
            >
              Print
            </Button>
            <Button
              id="email-rollup"
              onClick={toggleEmailModal}
              variant="primary"
            >
              Email rollup
            </Button>
          </>
        }
        style={fieldsetStyle}
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

  function renderChart() {
    return (
      <Chart
        queryParams={queryParams}
        pageDispatchers={pageDispatchers}
        setOrg={changeOrganization}
        orgType={orgType}
        setOrgType={setOrgType}
      />
    )
  }

  function renderReportCollection(id) {
    return <Collection queryParams={queryParams} />
  }

  function renderReportMap(id) {
    return <Map queryParams={queryParams} />
  }

  function showNextPeriod(nextPeriod) {
    const periodStart = moment(queryParams.releasedAtStart)
      .add(1, nextPeriod)
      .startOf(nextPeriod)
    const periodEnd = moment(queryParams.releasedAtStart)
      .add(1, nextPeriod)
      .endOf(nextPeriod)
    const newQueryParams = {
      ...queryParams,
      releasedAtStart: periodStart,
      releasedAtEnd: periodEnd
    }
    deserializeQueryParams(
      REPORT_SEARCH_PROPS.searchObjectTypes[0],
      newQueryParams,
      deserializeCallback
    )
  }

  function showPreviousPeriod(nextPeriod) {
    const periodStart = moment(queryParams.releasedAtStart)
      .subtract(1, nextPeriod)
      .startOf(nextPeriod)
    const periodEnd = moment(queryParams.releasedAtStart)
      .subtract(1, nextPeriod)
      .endOf(nextPeriod)
    const newQueryParams = {
      ...queryParams,
      releasedAtStart: periodStart,
      releasedAtEnd: periodEnd
    }
    deserializeQueryParams(
      REPORT_SEARCH_PROPS.searchObjectTypes[0],
      newQueryParams,
      deserializeCallback
    )
  }

  function changePeriod(nextPeriod) {
    const periodStart = moment(queryParams.releasedAtStart).startOf(nextPeriod)
    const periodEnd = moment(queryParams.releasedAtStart).endOf(nextPeriod)
    const newQueryParams = {
      ...queryParams,
      releasedAtStart: periodStart,
      releasedAtEnd: periodEnd
    }
    deserializeQueryParams(
      REPORT_SEARCH_PROPS.searchObjectTypes[0],
      newQueryParams,
      deserializeCallback
    )
    setPeriod(nextPeriod)
  }

  function changeOrganization(organization) {
    const newQueryParams = {
      ...queryParams,
      orgUuid: organization.uuid,
      orgRecurseStrategy: RECURSE_STRATEGY.CHILDREN
    }
    deserializeQueryParams(
      REPORT_SEARCH_PROPS.searchObjectTypes[0],
      newQueryParams,
      deserializeCallback
    )
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType,
      filters,
      text
    })
  }

  function setRollupDefaultSearchQuery() {
    const queryParams = {
      state: [Report.STATE.PUBLISHED, Report.STATE.CANCELLED],
      releasedAtStart: moment().startOf("day"),
      releasedAtEnd: moment().endOf("day")
    }
    deserializeQueryParams(
      REPORT_SEARCH_PROPS.searchObjectTypes[0],
      queryParams,
      deserializeCallback
    )
    return queryParams
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

  function renderEmailModal(formikProps) {
    const { isSubmitting, submitForm } = formikProps
    return (
      <Modal centered show={showEmailModal} onHide={toggleEmailModal}>
        <Form>
          <Modal.Header closeButton>
            <Modal.Title>Email rollup - {getDateStr()}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Field
              name="to"
              component={FieldHelper.InputField}
              validate={email => handleEmailValidation(email)}
              vertical
            >
              <FormText>
                One or more email addresses, comma separated, e.g.:
                <br />
                <em>
                  jane@nowhere.invalid, John Doe &lt;john@example.org&gt;, "Mr.
                  X" &lt;x@example.org&gt;
                </em>
              </FormText>
            </Field>
            <Field
              name="comment"
              component={FieldHelper.InputField}
              asA="textarea"
              vertical
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              id="preview-rollup-email"
              href={previewPlaceholderUrl}
              target="rollup"
              onClick={showPreview}
              variant="outline-secondary"
            >
              Preview
            </Button>
            <Button
              id="send-rollup-email"
              variant="primary"
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
      endDate: getRollupEnd().valueOf(),
      orgType,
      orgUuid
    }
    return API.query(GQL_SHOW_ROLLUP_EMAIL, variables).then(data => {
      const rollupWindow = window.open("", "rollup")
      const doc = rollupWindow.document
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
      orgType,
      orgUuid,
      email: emailDelivery
    }
    return API.mutation(GQL_EMAIL_ROLLUP, variables)
  }
}

RollupShow.propTypes = {
  searchQuery: SearchQueryPropType,
  pageDispatchers: PageDispatchersPropType,
  setSearchQuery: PropTypes.func
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RollupShow)
