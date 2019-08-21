import API from "api"
import { gql } from "apollo-boost"
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
import { AuthorizationGroup, Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"

const GQL_GET_POSITION_LIST = gql`
  fragment paginatedPositions on Query {
    paginatedPositions: positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
        }
      }
    }
  }
`
const GQL_GET_AUTHORIZATION_GROUP = gql`
  fragment authorizationGroup on Query {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
        }
      }
      status
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`
const GQL_GET_DATA = gql`
  query(
    $positionQuery: PositionSearchQueryInput
    $uuid: String
    $includeAuthorizationGroup: Boolean!
  ) {
    ...paginatedPositions
    ...authorizationGroup @include(if: $includeAuthorizationGroup)
  }

  ${GQL_GET_POSITION_LIST}
  ${GQL_GET_AUTHORIZATION_GROUP}
`

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

  fetchData(props) {
    return this.runGQL(props.match.params.uuid, true).then(data =>
      this.setState({
        authorizationGroup: new AuthorizationGroup(data.authorizationGroup),
        positions: data.paginatedPositions
      })
    )
  }

  runGQL = (uuid, includeAuthorizationGroup) => {
    const positionQuery = {
      pageNum: this.state.positionsPageNum,
      pageSize: 10,
      authorizationGroupUuid: uuid
    }
    return API.query(GQL_GET_DATA, {
      positionQuery,
      uuid,
      includeAuthorizationGroup
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
                    paginationKey={`r_${this.props.match.params.uuid}`}
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
      this.runGQL(this.state.authorizationGroup.uuid, false).then(data =>
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
