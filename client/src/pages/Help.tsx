import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import EmailAddressTable from "components/EmailAddressTable"
import Fieldset from "components/Fieldset"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React, { useContext } from "react"
import { connect } from "react-redux"
import TOUR_SCREENSHOT from "resources/tour-screenshot.png"
import Settings from "settings"
import utils from "utils"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ascendantOrgs(query: { status: ACTIVE }) {
        administratingPositions {
          uuid
          person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            emailAddresses {
              network
              address
            }
          }
        }
      }
    }
  }
`

const screenshotCss = {
  width: "100%",
  boxShadow: "0px 0px 10px #aaa"
}

function getAllSuperusers(organization) {
  return Object.values(
    organization.ascendantOrgs?.reduce((acc, o) => {
      o.administratingPositions.forEach(p => (acc[p.uuid] = p))
      return acc
    }, {}) || {}
  )
}

interface HelpProps {
  pageDispatchers?: PageDispatchersPropType
}

const Help = ({ pageDispatchers }: HelpProps) => {
  const { appSettings, currentUser } = useContext(AppContext)
  usePageTitle("Help")
  if (
    currentUser.uuid &&
    currentUser.position &&
    currentUser.position.organization
  ) {
    return (
      <HelpFetchSuperusers
        orgUuid={currentUser.position.organization.uuid}
        appSettings={appSettings}
        currentUser={currentUser}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return (
    <HelpConditional
      appSettings={appSettings}
      currentUser={currentUser}
      pageDispatchers={pageDispatchers}
    />
  )
}

interface HelpFetchSuperusersProps {
  orgUuid: string
  appSettings?: any
  currentUser?: any
  pageDispatchers?: PageDispatchersPropType
}

const HelpFetchSuperusers = ({
  orgUuid,
  appSettings,
  currentUser,
  pageDispatchers
}: HelpFetchSuperusersProps) => {
  // Retrieve superusers
  const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid: orgUuid
  })
  return (
    <HelpConditional
      appSettings={appSettings}
      currentUser={currentUser}
      pageDispatchers={pageDispatchers}
      {...queryResult}
      orgUuid={orgUuid}
    />
  )
}

interface HelpConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  orgUuid?: string
  appSettings?: any
  currentUser?: any
  pageDispatchers?: PageDispatchersPropType
}

const HelpConditional = ({
  loading,
  error,
  data,
  orgUuid,
  appSettings,
  currentUser,
  pageDispatchers
}: HelpConditionalProps) => {
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

  let superusers = []
  if (data) {
    superusers = getAllSuperusers(data.organization)
      .filter(p => p.person)
      .map(p => p.person)
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
          alt='Screenshot of "Guided Tour" link'
          style={screenshotCss}
        />

        <h4>2. Email your superuser</h4>
        <p>
          Your organization's superusers are able to modify a lot of data in the
          system regarding how your organization, position and profile are set
          up.
        </p>
        <p>Your superusers:</p>
        <ul>
          {superusers.map(user => (
            <li key={user.uuid}>
              {user.rank} {user.name}:
              <EmailAddressTable
                label={Settings.fields.person.emailAddresses.label}
                emailAddresses={user.emailAddresses}
              />
            </li>
          ))}
          {superusers.length === 0 && <em>No superusers found</em>}
        </ul>

        <h4>3. Check out the FAQ</h4>
        <p>
          Many common issues are explained in the FAQ document, especially for
          common superuser tasks.
        </p>
        <p>
          <a href={url} target="help">
            <strong>The FAQ is available on the portal.</strong>
          </a>
        </p>

        <h4>4. Contact ANET support</h4>
        <p>
          Technical issues may be able to be resolved by the ANET
          administrators: {utils.createMailtoLink(email)}
        </p>
      </Fieldset>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(Help)
