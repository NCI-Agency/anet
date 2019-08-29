import { PAGE_PROPS_NO_NAV } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import { Organization, Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
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

const TaskNew = props => {
  const qs = utils.parseQueryString(props.location.search)
  if (qs.responsibleOrgUuid) {
    const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
      uuid: qs.responsibleOrgUuid
    })
    return (
      <TaskNewConditional
        {...props}
        {...queryResult}
        orgUuid={qs.responsibleOrgUuid}
      />
    )
  }
  return <TaskNewConditional {...props} />
}

TaskNew.propTypes = {
  ...pagePropTypes
}

const TaskNewConditional = props => {
  const { loading, error, data, orgUuid, ...otherProps } = props
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    ...otherProps
  })
  if (done) {
    return result
  }

  const task = new Task()
  if (data) {
    task.responsibleOrg = new Organization(data.organization)
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
  ...pagePropTypes
}

export default connect(
  null,
  mapDispatchToProps
)(TaskNew)
