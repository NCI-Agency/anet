import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Organization, Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import utils from "utils"
import TaskForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      type
    }
  }
`

const TaskNew = ({ pageDispatchers }) => {
  const routerLocation = useLocation()
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.taskedOrgUuid) {
    const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
      uuid: qs.taskedOrgUuid
    })
    return (
      <TaskNewConditional
        pageDispatchers={pageDispatchers}
        {...queryResult}
        orgUuid={qs.taskedOrgUuid}
      />
    )
  }
  return <TaskNewConditional pageDispatchers={pageDispatchers} />
}

TaskNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const TaskNewConditional = ({
  loading,
  error,
  data,
  orgUuid,
  pageDispatchers
}) => {
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

  return (
    <TaskForm
      initialValues={task}
      title={`Create a new ${Settings.fields.task.shortLabel}`}
    />
  )
}

TaskNewConditional.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  data: PropTypes.object,
  orgUuid: PropTypes.string,
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(TaskNew)
