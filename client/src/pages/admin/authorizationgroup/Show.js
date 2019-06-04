import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages, { setMessages } from "components/Messages"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import GQL from "graphqlapi"
import { AuthorizationGroup, Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"

class BaseAuthorizationGroupShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "AuthorizationGroup"

  state = {
    authorizationGroup: new AuthorizationGroup(),
    positions: null,
    reports: null,
    allReports: null,
    positionsPageNum: 0,
    reportsPageNum: 0,
    success: null,
    error: null
  }

  constructor(props) {
    super(props)
    setMessages(props, this.state)
  }

  getPositionQueryPart(authGroupUuid) {
    const positionQuery = {
      pageNum: this.state.positionsPageNum,
      pageSize: 10,
      authorizationGroupUuid: authGroupUuid
    }
    const positionsPart = new GQL.Part(/* GraphQL */ `
      paginatedPositions: positionList(query:$positionQuery) {
        pageNum, pageSize, totalCount, list { uuid, name, code, type, status, organization { uuid, shortName }, person { uuid, name, rank, role } }
      }`).addVariable(
      "positionQuery",
      "PositionSearchQueryInput",
      positionQuery
    )
    return positionsPart
  }

  getReportQueryPart(authGroupUuid, withPagination) {
    const result = withPagination ? "paginatedReports" : "allReports"
    const reportQuery = {
      pageNum: withPagination ? this.state.reportsPageNum : 0,
      pageSize: withPagination ? 10 : 0,
      authorizationGroupUuid: authGroupUuid
    }
    const reportsPart = new GQL.Part(
      /* GraphQL */ result +
        `
      : reportList(query:$reportQuery) {
        pageNum, pageSize, totalCount, list {
          ${ReportCollection.GQL_REPORT_FIELDS}
        }
      }`
    ).addVariable("reportQuery", "ReportSearchQueryInput", reportQuery)
    return reportsPart
  }

  fetchData(props) {
    const authGroupPart = new GQL.Part(/* GraphQL */ `
      authorizationGroup(uuid:"${props.match.params.uuid}") {
      uuid, name, description
      positions { uuid, name, code, type, status, organization { uuid, shortName }, person { uuid, name, rank, role } }
      status
      ${GRAPHQL_NOTES_FIELDS}
    }`)
    const positionsPart = this.getPositionQueryPart(props.match.params.uuid)
    const reportsPart = this.getReportQueryPart(props.match.params.uuid, true)
    const allReportsPart = this.getReportQueryPart(
      props.match.params.uuid,
      false
    )
    return this.runGQL([
      authGroupPart,
      positionsPart,
      reportsPart,
      allReportsPart
    ])
  }

  runGQL(queries) {
    return GQL.run(queries).then(data => {
      this.setState({
        authorizationGroup: new AuthorizationGroup(data.authorizationGroup),
        positions: data.paginatedPositions,
        reports: data.paginatedReports,
        allReports: data.allReports.list
      })
    })
  }

  render() {
    const { authorizationGroup, reports, allReports, positions } = this.state
    const { currentUser, ...myFormProps } = this.props

    const canEdit = currentUser.isSuperUser()

    return (
      <Formik
        enableReinitialize
        initialValues={authorizationGroup}
        {...myFormProps}
      >
        {({ values }) => {
          const action = canEdit && (
            <LinkTo
              authorizationGroup={authorizationGroup}
              edit
              button="primary"
            >
              Edit
            </LinkTo>
          )
          return (
            <div>
              <RelatedObjectNotes
                notes={authorizationGroup.notes}
                relatedObject={
                  authorizationGroup.uuid && {
                    relatedObjectType: "authorizationGroups",
                    relatedObjectUuid: authorizationGroup.uuid
                  }
                }
              />
              <Messages success={this.state.success} error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset
                  title={`Authorization Group ${authorizationGroup.name}`}
                  action={action}
                />
                <Fieldset>
                  <Field
                    name="name"
                    component={FieldHelper.renderReadonlyField}
                  />

                  <Field
                    name="status"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={AuthorizationGroup.humanNameOfStatus}
                  />
                </Fieldset>

                <Fieldset title="Positions">
                  <PositionTable
                    paginatedPositions={positions}
                    goToPage={this.goToPositionsPage}
                  />
                </Fieldset>

                <Fieldset title="Reports">
                  <ReportCollection
                    reports={allReports}
                    paginatedReports={reports}
                    goToPage={this.goToReportsPage}
                  />
                </Fieldset>
              </Form>
            </div>
          )
        }}
      </Formik>
    )
  }

  goToPositionsPage = pageNum => {
    this.setState({ positionsPageNum: pageNum }, () => {
      const positionQueryPart = this.getPositionQueryPart(
        this.state.authorizationGroup.uuid
      )
      GQL.run([positionQueryPart]).then(data =>
        this.setState({ positions: data.paginatedPositions })
      )
    })
  }

  goToReportsPage = pageNum => {
    this.setState({ reportsPageNum: pageNum }, () => {
      const reportQueryPart = this.getReportQueryPart(
        this.state.authorizationGroup.uuid
      )
      GQL.run([reportQueryPart]).then(data =>
        this.setState({ reports: data.paginatedReports })
      )
    })
  }
}

const AuthorizationGroupShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseAuthorizationGroupShow
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(AuthorizationGroupShow)
