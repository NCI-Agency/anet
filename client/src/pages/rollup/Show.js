import "@blueprintjs/core/lib/css/blueprint.css"
import { DateRangeInput } from "@blueprintjs/datetime"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import { IconNames } from "@blueprintjs/icons"
import API, { Settings } from "api"
import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import "components/BlueprintOverrides.css"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import DailyRollupChart from "components/DailyRollupChart"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import MosaicLayout from "components/MosaicLayout"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import ReportCollection, {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR,
  GQL_REPORT_FIELDS,
  GQL_BASIC_REPORT_FIELDS
} from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import LoaderHOC, {
  mapDispatchToProps as loaderMapDispatchToProps
} from "HOC/LoaderHOC"
import { Organization, Report } from "models"
import moment from "moment"
import pluralize from "pluralize"
import React from "react"
import { Button, HelpBlock, Modal, Overlay, Popover } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import utils from "utils"

const BarChartWithLoader = connect(
  null,
  loaderMapDispatchToProps
)(LoaderHOC("isLoading")("data")(DailyRollupChart))
const Context = React.createContext()

const barColors = {
  cancelled: "#EC971F",
  verified: "#337AB7"
}

const legendCss = {
  width: "14px",
  height: "14px",
  display: "inline-block"
}

class BaseRollupShow extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  get dateStr() {
    if (this.state.startDate.isSame(this.state.endDate, "day")) {
      return `for ${this.state.startDate.format(
        Settings.dateFormats.forms.displayShort.date
      )}`
    } else {
      return `from ${this.state.startDate.format(
        Settings.dateFormats.forms.displayShort.date
      )} to ${this.state.endDate.format(
        Settings.dateFormats.forms.displayShort.date
      )}`
    }
  }
  get rollupStart() {
    return moment(this.state.startDate).startOf("day")
  }
  get rollupEnd() {
    return moment(this.state.endDate).endOf("day")
  }
  static dateOrDefault = qsDate =>
    qsDate ? moment(+qsDate) : moment().subtract(1, "day") // default to yesterday
  static dateRangeFromQS = search => {
    // Having a qs with ?date=… overrides startDate and endDate (for backwards compatibility)
    const qs = utils.parseQueryString(search)
    return {
      startDate: BaseRollupShow.dateOrDefault(qs.date || qs.startDate),
      endDate: BaseRollupShow.dateOrDefault(qs.date || qs.endDate)
    }
  }

  constructor(props) {
    super(props)

    this.CHART_ID = "reports_by_day_of_week"
    this.GQL_CHART_FIELDS = /* GraphQL */ `
      org {uuid shortName}
      published
      cancelled
    `
    this.VISUALIZATIONS = [
      {
        id: "rbdow-chart",
        icons: [IconNames.GROUPED_BAR_CHART],
        title: "Chart by organization",
        renderer: this.getBarChart
      },
      {
        id: "rbdow-collection",
        icons: [IconNames.PANEL_TABLE],
        title: "Reports by organization",
        renderer: this.getReportCollection
      },
      {
        id: "rbdow-map",
        icons: [IconNames.MAP],
        title: "Map by organization",
        renderer: this.getReportMap
      }
    ]
    this.INITIAL_LAYOUT = {
      direction: "row",
      first: this.VISUALIZATIONS[0].id,
      second: {
        direction: "column",
        first: this.VISUALIZATIONS[1].id,
        second: this.VISUALIZATIONS[2].id
      }
    }
    this.DESCRIPTION = "Number of reports released per organization."

    const { startDate, endDate } = BaseRollupShow.dateRangeFromQS(
      props.location.search
    )
    this.state = {
      startDate,
      endDate,
      reports: { list: [] },
      reportsPageNum: 0,
      graphData: [],
      showEmailModal: false,
      maxReportAge: null,
      hoveredBar: { org: {} },
      orgType: Organization.TYPE.ADVISOR_ORG,
      updateChart: true, // whether the chart needs to be updated
      isLoading: false
    }
    this.previewPlaceholderUrl = API.addAuthParams("/help")
  }

  static getDerivedStateFromProps(props, state) {
    const stateUpdate = {}
    const { startDate, endDate } = BaseRollupShow.dateRangeFromQS(
      props.location.search
    )
    if (!state.startDate.isSame(startDate, "day")) {
      Object.assign(stateUpdate, { startDate })
    }
    if (!state.endDate.isSame(endDate, "day")) {
      Object.assign(stateUpdate, { endDate })
    }
    const { appSettings } = props || {}
    const maxReportAge = appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS
    if (maxReportAge !== state.maxReportAge) {
      Object.assign(stateUpdate, { maxReportAge: maxReportAge })
    }
    return stateUpdate
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !this.state.startDate.isSame(prevState.startDate, "day") ||
      !this.state.endDate.isSame(prevState.endDate, "day") ||
      prevState.maxReportAge !== this.state.maxReportAge
    ) {
      this.loadData()
    }
  }

  fetchData(props) {
    if (!this.state.maxReportAge) {
      // don't run the query unless we've loaded the rollup settings.
      return
    }

    this.setState({ isLoading: true })
    this.props.showLoading()
    Promise.all([
      // Query used by the chart
      this.fetchChartData(this.runChartQuery(...this.chartQueryParams())),
      this.fetchReportData(true)
    ])
      .then(() => this.props.hideLoading())
      .catch(error => this.setState({ error }, this.props.hideLoading))
  }

  fetchReportData(includeAll) {
    // Query used by the reports collection
    const queries = [
      this.runReportsQuery(this.reportsQueryParams(false), false)
    ]
    if (includeAll) {
      // Query used by the map
      queries.push(this.runReportsQuery(this.reportsQueryParams(true), true))
    }
    return Promise.all(queries).then(values => {
      const stateUpdate = {
        updateChart: false, // only update the report list
        reports: values[0].reportList
      }
      if (includeAll) {
        Object.assign(stateUpdate, {
          allReports: values[1].reportList.list
        })
      }
      this.setState(stateUpdate)
    })
  }

  chartQueryParams = () => {
    let chartQuery = "rollupGraph(startDate: $startDate, endDate: $endDate"
    let chartQueryParamsDef = "($startDate: Long!, $endDate: Long!"
    const chartQueryParams = {
      startDate: this.rollupStart.valueOf(),
      endDate: this.rollupEnd.valueOf()
    }
    if (this.state.focusedOrg) {
      if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
        chartQuery += ", principalOrganizationUuid: $principalOrganizationUuid"
        chartQueryParamsDef += ", $principalOrganizationUuid: String!"
        chartQueryParams.principalOrganizationUuid = this.state.focusedOrg.uuid
      } else {
        chartQuery += " ,advisorOrganizationUuid: $advisorOrganizationUuid"
        chartQueryParamsDef += ", $advisorOrganizationUuid: String!"
        chartQueryParams.advisorOrganizationUuid = this.state.focusedOrg.uuid
      }
    } else if (this.state.orgType) {
      chartQuery += ", orgType: $orgType"
      chartQueryParamsDef += ", $orgType: OrganizationType!"
      chartQueryParams.orgType = this.state.orgType
    }
    chartQuery += ")"
    chartQueryParamsDef += ")"
    Object.assign(chartQueryParams, {
      pageSize: 0 // retrieve all the filtered reports
    })
    return [chartQuery, chartQueryParams, chartQueryParamsDef]
  }

  runChartQuery = (chartQuery, chartQueryParams, chartQueryParamsDef) => {
    return API.query(
      /* GraphQL */ `
      ${chartQuery} {
        ${this.GQL_CHART_FIELDS}
      }`,
      chartQueryParams,
      chartQueryParamsDef
    )
  }

  reportsQueryParams = includeAll => {
    const reportsQueryParams = {
      state: [Report.STATE.PUBLISHED], // Specifically excluding cancelled engagements.
      releasedAtStart: this.rollupStart.valueOf(),
      releasedAtEnd: this.rollupEnd.valueOf(),
      engagementDateStart: moment(this.rollupStart)
        .subtract(this.state.maxReportAge, "days")
        .valueOf(),
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    }
    Object.assign(reportsQueryParams, this.getSearchQuery(this.props))
    Object.assign(reportsQueryParams, {
      pageNum: includeAll ? 0 : this.state.reportsPageNum,
      pageSize: includeAll ? 0 : 10
    })
    if (this.state.focusedOrg) {
      if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
        reportsQueryParams.principalOrgUuid = this.state.focusedOrg.uuid
        reportsQueryParams.includePrincipalOrgChildren = true
      } else {
        reportsQueryParams.advisorOrgUuid = this.state.focusedOrg.uuid
        reportsQueryParams.includeAdvisorOrgChildren = true
      }
    }
    return reportsQueryParams
  }

  runReportsQuery = (reportsQueryParams, includeAll) => {
    return API.query(
      /* GraphQL */ `
      reportList(query:$reportsQueryParams) {
        pageNum, pageSize, totalCount, list {
          ${includeAll ? GQL_BASIC_REPORT_FIELDS : GQL_REPORT_FIELDS}
        }
      }`,
      { reportsQueryParams },
      "($reportsQueryParams: ReportSearchQueryInput)"
    )
  }

  @autobind
  fetchChartData(chartQuery) {
    return Promise.all([chartQuery]).then(values => {
      const pinnedOrgs = Settings.pinned_ORGs
      this.setState({
        isLoading: false,
        updateChart: true, // update chart after fetching the data
        graphData: values[0].rollupGraph
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
      })
    })
  }

  @autobind
  getBarChart(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="scrollable-y">
            <ContainerDimensions>
              {({ width }) => (
                <BarChartWithLoader
                  width={width}
                  chartId={this.CHART_ID}
                  data={context.graphData}
                  onBarClick={this.goToOrg}
                  showPopover={this.showPopover}
                  hidePopover={this.hidePopover}
                  updateChart={context.updateChart}
                  isLoading={context.isLoading}
                  barColors={barColors}
                />
              )}
            </ContainerDimensions>

            <Overlay
              show={!!context.graphPopover}
              placement="top"
              container={document.body}
              animation={false}
              target={() => context.graphPopover}
            >
              <Popover
                id="graph-popover"
                title={context.hoveredBar && context.hoveredBar.org.shortName}
              >
                <p>
                  Published:{" "}
                  {context.hoveredBar && context.hoveredBar.published}
                </p>
                <p>
                  Cancelled:{" "}
                  {context.hoveredBar && context.hoveredBar.cancelled}
                </p>
                <p>Click to view details</p>
              </Popover>
            </Overlay>

            <div className="graph-legend">
              <div style={{ ...legendCss, background: barColors.verified }} />{" "}
              Published reports:&nbsp;
              <strong>
                {context.graphData.reduce((acc, org) => acc + org.published, 0)}
              </strong>
            </div>
            <div className="graph-legend">
              <div style={{ ...legendCss, background: barColors.cancelled }} />{" "}
              Cancelled engagements:&nbsp;
              <strong>
                {context.graphData.reduce((acc, org) => acc + org.cancelled, 0)}
              </strong>
            </div>
          </div>
        )}
      </Context.Consumer>
    )
  }

  @autobind
  getReportCollection(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="scrollable">
            <ReportCollection
              paginatedReports={context.reports}
              reports={context.allReports}
              goToPage={this.goToReportsPage}
              viewFormats={[FORMAT_CALENDAR, FORMAT_TABLE, FORMAT_SUMMARY]}
            />
          </div>
        )}
      </Context.Consumer>
    )
  }

  @autobind
  getReportMap(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="non-scrollable">
            <ContainerDimensions>
              {({ width, height }) => (
                <ReportCollection
                  width={width}
                  height={height}
                  marginBottom={0}
                  reports={context.allReports}
                  viewFormats={[FORMAT_MAP]}
                />
              )}
            </ContainerDimensions>
          </div>
        )}
      </Context.Consumer>
    )
  }

  render() {
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
        <Messages error={this.state.error} success={this.state.success} />

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
                  {this.state.focusedOrg &&
                    ` for ${this.state.focusedOrg.shortName}`}
                </div>
                <DateRangeInput
                  className="rollupDateRange"
                  startInputProps={{ style }}
                  endInputProps={{ style }}
                  value={[
                    this.state.startDate.toDate(),
                    this.state.endDate.toDate()
                  ]}
                  onChange={this.changeRollupDate}
                  formatDate={date => moment(date).format(inputFormat)}
                  parseDate={str =>
                    moment(
                      str,
                      Settings.dateFormats.forms.input.date,
                      true
                    ).toDate()
                  }
                  placeholder={inputFormat}
                  maxDate={moment().toDate()}
                  allowSingleDayRange
                  closeOnSelection={false}
                  contiguousCalendarMonths={false}
                  shortcuts
                />
              </div>
              {this.state.focusedOrg ? (
                <Button onClick={() => this.goToOrg()}>
                  All organizations
                </Button>
              ) : (
                <ButtonToggleGroup
                  value={this.state.orgType}
                  onChange={this.changeOrgType}
                >
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
                href={this.previewPlaceholderUrl}
                target="rollup"
                onClick={this.printPreview}
              >
                Print
              </Button>
              <Button onClick={this.toggleEmailModal} bsStyle="primary">
                Email rollup
              </Button>
            </span>
          }
          style={flexStyle}
        >
          <Context.Provider value={this.state}>
            <MosaicLayout
              style={mosaicLayoutStyle}
              visualizations={this.VISUALIZATIONS}
              initialNode={this.INITIAL_LAYOUT}
              description={this.DESCRIPTION}
            />
          </Context.Provider>
        </Fieldset>
        <Formik
          enableReinitialize
          onSubmit={this.onSubmitEmailRollup}
          initialValues={{ to: "", comment: "" }}
        >
          {formikProps => this.renderEmailModal(formikProps)}
        </Formik>
      </div>
    )
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({ updateChart: false, reportsPageNum: newPage }, () =>
      this.fetchReportData(false)
    )
  }

  @autobind
  goToOrg(org) {
    this.setState(
      {
        reportsPageNum: 0,
        focusedOrg: org,
        graphPopover: null,
        hoveredBar: null,
        isLoading: true
      },
      () => this.loadData()
    )
  }

  @autobind
  changeOrgType(orgType) {
    this.setState(
      { orgType, graphPopover: null, hoveredBar: null, isLoading: true },
      () => this.loadData()
    )
  }

  @autobind
  changeRollupDate(dateRange) {
    this.props.history.replace({
      pathname: "rollup",
      search: utils.formatQueryString({
        startDate: dateRange[0].valueOf(),
        endDate: dateRange[1].valueOf()
      })
    })
  }

  @autobind
  showPopover(graphPopover, hoveredBar) {
    this.setState({ graphPopover, hoveredBar })
  }

  @autobind
  hidePopover() {
    this.setState({ graphPopover: null, hoveredBar: null })
  }

  @autobind
  renderEmailModal(formikProps) {
    const { isSubmitting, submitForm } = formikProps
    return (
      <Modal show={this.state.showEmailModal} onHide={this.toggleEmailModal}>
        <Form>
          <Modal.Header closeButton>
            <Modal.Title>Email rollup - {this.dateStr}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>
              {this.state.focusedOrg
                ? `Reports for ${this.state.focusedOrg.shortName}`
                : `All reports by ${this.state.orgType
                  .replace("_", " ")
                  .toLowerCase()}`}
            </h5>
            <Field
              name="to"
              component={FieldHelper.renderInputField}
              validate={email => this.handleEmailValidation(email)}
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
              href={this.previewPlaceholderUrl}
              target="rollup"
              onClick={this.showPreview}
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

  handleEmailValidation = value => {
    const r = utils.parseEmailAddresses(value)
    return r.isValid ? null : r.message
  }

  @autobind
  toggleEmailModal() {
    this.setState({ showEmailModal: !this.state.showEmailModal })
  }

  @autobind
  printPreview() {
    this.showPreview(true)
  }

  @autobind
  showPreview(print) {
    let graphQL = /* GraphQL */ `
      showRollupEmail(
        startDate: ${this.rollupStart.valueOf()},
        endDate: ${this.rollupEnd.valueOf()}
    `
    if (this.state.focusedOrg) {
      if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
        graphQL += `, principalOrganizationUuid: "${
          this.state.focusedOrg.uuid
        }"`
      } else {
        graphQL += `, advisorOrganizationUuid: "${this.state.focusedOrg.uuid}"`
      }
    }
    if (this.state.orgType) {
      graphQL += `, orgType: ${this.state.orgType}`
    }
    graphQL += ")"
    API.query(graphQL).then(data => {
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

  onSubmitEmailRollup = (values, form) => {
    this.emailRollup(values, form)
      .then(response => this.onSubmitEmailRollupSuccess(response, values, form))
      .catch(error => {
        this.setState(
          {
            success: null,
            error: error,
            showEmailModal: false
          },
          () => {
            form.setSubmitting(false)
          }
        )
      })
  }

  onSubmitEmailRollupSuccess = (response, values, form) => {
    this.setState({
      success: "Email successfully sent",
      error: null,
      showEmailModal: false
    })
    form.resetForm() // Reset the email modal field values
  }

  emailRollup = (values, form) => {
    const r = utils.parseEmailAddresses(values.to)
    if (!r.isValid) {
      return
    }
    const emailDelivery = {
      toAddresses: r.to,
      comment: values.comment
    }
    let graphql =
      /* GraphQL */ "emailRollup(startDate: $startDate, endDate: $endDate"
    const variables = {
      startDate: this.rollupStart.valueOf(),
      endDate: this.rollupEnd.valueOf(),
      email: emailDelivery
    }
    let variableDef = "($startDate: Long!, $endDate: Long!"
    if (this.state.focusedOrg) {
      if (this.state.orgType === Organization.TYPE.PRINCIPAL_ORG) {
        graphql += ", principalOrganizationUuid: $principalOrganizationUuid"
        variables.principalOrganizationUuid = this.state.focusedOrg.uuid
        variableDef += ", $principalOrganizationUuid: String!"
      } else {
        graphql += ",advisorOrganizationUuid: $advisorOrganizationUuid"
        variables.advisorOrganizationUuid = this.state.focusedOrg.uuid
        variableDef += ", $advisorOrganizationUuid: String!"
      }
    }
    if (this.state.orgType) {
      graphql += ", orgType: $orgType"
      variables.orgType = this.state.orgType
      variableDef += ", $orgType: OrganizationType!"
    }
    graphql += ", email: $email)"
    variableDef += ", $email: AnetEmailInput!)"
    return API.mutation(graphql, variables, variableDef)
  }
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
)(withRouter(RollupShow))
