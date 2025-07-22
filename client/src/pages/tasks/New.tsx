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

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      longName
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
  if (qs.get("parentTaskUuid")) {
    return (
      <TaskNewFetchParentTask
        parentTaskUuid={qs.get("parentTaskUuid")}
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
    <TaskNewConditional pageDispatchers={pageDispatchers} {...queryResult} />
  )
}

interface TaskNewFetchParentTaskProps {
  parentTaskUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const TaskNewFetchParentTask = ({
  parentTaskUuid,
  pageDispatchers
}: TaskNewFetchParentTaskProps) => {
  const queryResult = API.useApiQuery(GQL_GET_TASK, {
    uuid: parentTaskUuid
  })
  return (
    <TaskNewConditional pageDispatchers={pageDispatchers} {...queryResult} />
  )
}

interface TaskNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  pageDispatchers?: PageDispatchersPropType
}

const TaskNewConditional = ({
  loading,
  error,
  data,
  pageDispatchers
}: TaskNewConditionalProps) => {
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const task = new Task()
  if (data?.organization) {
    task.taskedOrganizations = [new Organization(data.organization)]
  }
  if (data?.task) {
    task.parentTask = new Task(data.task)
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
