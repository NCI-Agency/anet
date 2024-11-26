import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Organization, Task } from "models"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import TaskForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
  }
`

interface TaskNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const TaskNew = ({ pageDispatchers }: TaskNewProps) => {
  const routerLocation = useLocation()
  const taskShortLabel = Settings.fields.task.shortLabel
  usePageTitle(`New ${taskShortLabel}`)
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.get("taskedOrgUuid")) {
    return (
      <TaskNewFetchTaskedOrg
        taskedOrgUuid={qs.get("taskedOrgUuid")}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <TaskNewConditional pageDispatchers={pageDispatchers} />
}

interface TaskNewFetchTaskedOrgProps {
  taskedOrgUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const TaskNewFetchTaskedOrg = ({
  taskedOrgUuid,
  pageDispatchers
}: TaskNewFetchTaskedOrgProps) => {
  const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid: taskedOrgUuid
  })
  return (
    <TaskNewConditional
      pageDispatchers={pageDispatchers}
      {...queryResult}
      orgUuid={taskedOrgUuid}
    />
  )
}

interface TaskNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  orgUuid?: string
  pageDispatchers?: PageDispatchersPropType
}

const TaskNewConditional = ({
  loading,
  error,
  data,
  orgUuid,
  pageDispatchers
}: TaskNewConditionalProps) => {
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const task = new Task()
  if (data) {
    task.taskedOrganizations = [new Organization(data.organization)]
  }
  // mutates the object
  initInvisibleFields(task, Settings.fields.task.customFields)

  return (
    <TaskForm
      initialValues={task}
      title={`Create a new ${Settings.fields.task.shortLabel}`}
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(TaskNew)
