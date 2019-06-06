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
import ReportCollectionContainer from "components/ReportCollectionContainer"
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
    positionsPageNum: 0,
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

  fetchData(props) {
    const authGroupPart = new GQL.Part(/* GraphQL */ `
      authorizationGroup(uuid:"${props.match.params.uuid}") {
      uuid, name, description
      positions { uuid, name, code, type, status, organization { uuid, shortName }, person { uuid, name, rank, role } }
      status
      ${GRAPHQL_NOTES_FIELDS}
    }`)
    const positionsPart = this.getPositionQueryPart(props.match.params.uuid)
    return this.runGQL([authGroupPart, positionsPart])
  }

  runGQL(queries) {
    return GQL.run(queries).then(data => {
      this.setState({
        authorizationGroup: new AuthorizationGroup(data.authorizationGroup),
        positions: data.paginatedPositions
      })
    })
  }

  render() {
    const { authorizationGroup, positions } = this.state
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
                  <ReportCollectionContainer
                    queryParams={{
                      authorizationGroupUuid: this.props.match.params.uuid
                    }}
                    mapId="reports"
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
