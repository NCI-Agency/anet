import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import React, { useContext } from "react"
import { connect } from "react-redux"
import TOUR_SCREENSHOT from "resources/tour-screenshot.png"
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
  const help_text = appSettings.HELP_TEXT
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
        {help_text && <RichTextEditor readOnly value={help_text} />}

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
        {superusers.length > 0 && (
          <>
            <p>Your superusers:</p>
            <div className="d-flex flex-column gap-2">
              {superusers.map(user => (
                <LinkTo modelType="Person" model={user} className="mb-1" />
              ))}
            </div>
          </>
        )}
        {superusers.length === 0 && <em>No superusers found</em>}
      </Fieldset>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(Help)
