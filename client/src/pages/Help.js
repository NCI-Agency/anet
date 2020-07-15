import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import TOUR_SCREENSHOT from "resources/tour-screenshot.png"
import Settings from "settings"

const GQL_GET_POSITION_LIST = gql`
  query($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      list {
        uuid
        person {
          uuid
          rank
          role
          name
          emailAddress
        }
      }
    }
  }
`

const screenshotCss = {
  width: "100%",
  boxShadow: "0px 0px 10px #aaa"
}

const BaseHelp = ({ appSettings, currentUser, pageDispatchers }) => {
  if (
    currentUser.uuid &&
    currentUser.position &&
    currentUser.position.organization
  ) {
    return (
      <BaseHelpFetchSuperUsers
        orgUuid={currentUser.position.organization.uuid}
        appSettings={appSettings}
        currentUser={currentUser}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return (
    <BaseHelpConditional
      appSettings={appSettings}
      currentUser={currentUser}
      pageDispatchers={pageDispatchers}
    />
  )
}

BaseHelp.propTypes = {
  appSettings: PropTypes.object,
  currentUser: PropTypes.instanceOf(Person),
  pageDispatchers: PageDispatchersPropType
}

const BaseHelpFetchSuperUsers = ({
  orgUuid,
  appSettings,
  currentUser,
  pageDispatchers
}) => {
  // Retrieve super users
  const positionQuery = {
    pageSize: 0, // retrieve all these positions
    type: [Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR],
    status: Position.STATUS.ACTIVE,
    organizationUuid: orgUuid
  }
  const queryResult = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery
  })
  return (
    <BaseHelpConditional
      appSettings={appSettings}
      currentUser={currentUser}
      pageDispatchers={pageDispatchers}
      {...queryResult}
      orgUuid={orgUuid}
    />
  )
}

BaseHelpFetchSuperUsers.propTypes = {
  orgUuid: PropTypes.string.isRequired,
  appSettings: PropTypes.object,
  currentUser: PropTypes.instanceOf(Person),
  pageDispatchers: PageDispatchersPropType
}

const BaseHelpConditional = ({
  loading,
  error,
  data,
  orgUuid,
  appSettings,
  currentUser,
  pageDispatchers
}) => {
  const url = appSettings.HELP_LINK_URL
  const email = appSettings.CONTACT_EMAIL
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  let superUsers = []
  if (data) {
    const filledPositions = data.positionList.list.filter(
      position => position && position.person
    )
    superUsers = filledPositions.map(position => position.person)
  }

  return (
    <div className="help-page">
      <Fieldset title="Need help with ANET?">
        <p className="help-text">There are a few ways to get help:</p>

        <h4>1. Use the guided tours</h4>
        <p>
          If you're stuck on a page and you don't know what to do, look for the{" "}
          <strong>"Take a tour"</strong> link near the top of the page.
        </p>
        <img
          src={TOUR_SCREENSHOT}
          alt={'Screenshot of "Guided Tour" link'}
          style={screenshotCss}
        />

        <h4>2. Email your super user</h4>
        <p>
          Your organization's super users are able to modify a lot of data in
          the system regarding how your organization, position, profile, and{" "}
          {Settings.fields.principal.person.name} are set up.
        </p>
        <p>Your super users:</p>
        <ul>
          {superUsers.map(user => (
            <li key={user.emailAddress}>
              <a href={`mailto:${user.emailAddress}`}>
                {user.rank} {user.name} - {user.emailAddress}
              </a>
            </li>
          ))}
          {superUsers.length === 0 && <em>No super users found</em>}
        </ul>

        <h4>3. Check out the FAQ</h4>
        <p>
          Many common issues are explained in the FAQ document, especially for
          common super user tasks.
        </p>
        <p>
          <a href={url} target="help">
            <strong>The FAQ is available on the portal.</strong>
          </a>
        </p>

        <h4>4. Contact ANET support</h4>
        <p>
          Technical issues may be able to be resolved by the ANET
          administrators: <a href={`mailto:${email}`}>{email}</a>
        </p>

        {currentUser.isAdmin() && (
          <div>
            <h4>Advanced troubleshooting</h4>
            <p>
              Admins, you can also consult the{" "}
              <a href="/assets/client/changelog.html">changelog</a>.
            </p>
          </div>
        )}
      </Fieldset>
    </div>
  )
}

BaseHelpConditional.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  data: PropTypes.object,
  orgUuid: PropTypes.string,
  appSettings: PropTypes.object,
  currentUser: PropTypes.instanceOf(Person),
  pageDispatchers: PageDispatchersPropType
}

const Help = props => (
  <AppContext.Consumer>
    {context => (
      <BaseHelp
        appSettings={context.appSettings}
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(Help)
