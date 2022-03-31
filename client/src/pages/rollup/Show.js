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
  useBoilerplate
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
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import { Button, FormText, Modal } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
import Settings from "settings"
import utils from "utils"

const GQL_ROLLUP_GRAPH = gql`
  query(
    $startDate: Instant!
    $endDate: Instant!
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
        type
      }
      published
      cancelled
    }
  }
`

const GQL_SHOW_ROLLUP_EMAIL = gql`
  query (
    $startDate: Instant!
    $endDate: Instant!
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
  mutation (
    $startDate: Instant!
    $endDate: Instant!
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

const Chart = ({
  pageDispatchers,
  rollupStart,
  rollupEnd,
  orgUuid,
  setFocusedOrg
}) => {
  const variables = getVariables()
  const { loading, error, data } = API.useApiQuery(GQL_ROLLUP_GRAPH, variables)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
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
        const aIndex = pinnedOrgs.indexOf(a.org.shortName)
        const bIndex = pinnedOrgs.indexOf(b.org.shortName)
        if (aIndex < 0) {
          const nameOrder = a.org.shortName.localeCompare(b.org.shortName)
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

  const CHART_ID = "reports_by_organization"
  const barColors = {
    cancelled: "#ec971f",
    published: "#75eb75"
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
        <div style={{ ...legendCss, background: barColors.published }} />{" "}
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
      startDate: rollupStart,
      endDate: rollupEnd,
      advisorOrganizationUuid: orgUuid
      // TODO: We cannot read orgType from the searchQuery
    }
    return variables
  }
}

Chart.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  rollupStart: PropTypes.object,
  rollupEnd: PropTypes.object,
  orgUuid: PropTypes.string,
  setFocusedOrg: PropTypes.func
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

const Map = ({ queryParams }) => (
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

Map.propTypes = {
  queryParams: PropTypes.object
}

const RollupShow = ({ pageDispatchers, searchQuery, setSearchQuery }) => {
  const [period, setPeriod] = useState(ROLLUP_PERIODS[0])
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
  const orgUuid = queryParams.orgUuid
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: REPORT_SEARCH_PROPS,
    pageDispatchers
  })

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
  const INITIAL_LAYOUT = VISUALIZATIONS[0].id
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
          <span>
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
          </span>
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

  function renderChart(id) {
    return (
      <Chart
        pageDispatchers={pageDispatchers}
        rollupStart={startDate}
        rollupEnd={endDate}
        orgUuid={orgUuid}
        setFocusedOrg={setFocusedOrg}
        // TODO: orgType cannot be set using the search query.
        // We need to find a way to set it or remove from rollupGraph query.
        orgType={""}
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

  function setFocusedOrg(org) {
    const newQueryParams = {
      ...queryParams,
      orgUuid: org.uuid,
      orgRecurseStrategy: "CHILDREN",
      orgType: org.type
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
      objectType: objectType,
      filters: filters,
      text: text
    })
  }

  function setRollupDefaultSearchQuery() {
    const queryParams = {
      state: [Report.STATE.PUBLISHED],
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
      endDate: getRollupEnd().valueOf()
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
