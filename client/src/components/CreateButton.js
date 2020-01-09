import AppContext from "components/AppContext"
import * as Models from "models"
import PropTypes from "prop-types"
import React from "react"
import { Button, DropdownButton, MenuItem } from "react-bootstrap"
import { useHistory } from "react-router-dom"

const DEFAULT_ACTIONS = [Models.Report]

const SUPER_USER_ACTIONS = [Models.Person, Models.Position, Models.Location]

const ADMIN_ACTIONS = [
  Models.Organization,
  Models.Task,
  Models.AuthorizationGroup
]

const BaseCreateButton = props => {
  const { currentUser } = props
  const history = useHistory()

  const modelClasses = DEFAULT_ACTIONS.concat(
    currentUser.isSuperUser() && SUPER_USER_ACTIONS,
    currentUser.isAdmin() && ADMIN_ACTIONS
  ).filter(value => !!value)

  if (modelClasses.length > 1) {
    return (
      <DropdownButton
        title="Create"
        pullRight
        bsStyle="primary"
        id="createButton"
        onSelect={onSelect}
      >
        {modelClasses.map((modelClass, i) => (
          <MenuItem key={modelClass.resourceName} eventKey={modelClass}>
            New {modelClass.displayName() || modelClass.resourceName}
          </MenuItem>
        ))}
      </DropdownButton>
    )
  } else if (modelClasses.length) {
    const modelClass = modelClasses[0]
    return (
      <Button
        bsStyle="primary"
        onClick={() => onSelect(modelClass)}
        id="createButton"
      >
        New{" "}
        {(modelClass.displayName() || modelClass.resourceName).toLowerCase()}
      </Button>
    )
  }

  function onSelect(modelClass) {
    history.push(modelClass.pathForNew())
  }
}

BaseCreateButton.propTypes = {
  currentUser: PropTypes.instanceOf(Models.Person)
}

const CreateButton = props => (
  <AppContext.Consumer>
    {context => (
      <BaseCreateButton currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default CreateButton
