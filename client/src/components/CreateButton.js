import AppContext from "components/AppContext"
import * as Models from "models"
import React, { useContext } from "react"
import { Button, DropdownButton, MenuItem } from "react-bootstrap"
import { useHistory } from "react-router-dom"

const DEFAULT_ACTIONS = [Models.Report]

const SUPER_USER_ACTIONS = [Models.Person, Models.Position, Models.Location]

const ADMIN_ACTIONS = [
  Models.Organization,
  Models.Task,
  Models.AuthorizationGroup
]

const CreateButton = () => {
  const { currentUser } = useContext(AppContext)
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
        {modelClasses.map((modelClass, i) => {
          const name = modelClass.displayName() || modelClass.resourceName
          return (
            <MenuItem
              key={modelClass.resourceName}
              eventKey={modelClass}
              id={`new-${name.toLowerCase()}`}
            >
              New {name}
            </MenuItem>
          )
        })}
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

export default CreateButton
