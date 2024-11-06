import AppContext from "components/AppContext"
import * as Models from "models"
import React, { useContext } from "react"
import { Button, Dropdown, DropdownButton } from "react-bootstrap"
import { useNavigate } from "react-router-dom"

const DEFAULT_ACTIONS = [Models.Report]

const SUPERUSER_ACTIONS = [Models.Person, Models.Position, Models.Location]

const ADMIN_ACTIONS = [
  Models.Organization,
  Models.Task,
  Models.AuthorizationGroup
]

const CreateButton = () => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()

  const modelClasses = DEFAULT_ACTIONS.concat(
    currentUser.isSuperuser() && SUPERUSER_ACTIONS,
    currentUser.isAdmin() && ADMIN_ACTIONS
  ).filter(value => !!value)

  if (modelClasses.length > 1) {
    return (
      <DropdownButton id="createButton" title="Create" align="end">
        {modelClasses.map((modelClass, i) => {
          const name = modelClass.displayName() || modelClass.resourceName
          return (
            <Dropdown.Item
              key={modelClass.resourceName}
              id={`new-${name.toLowerCase()}`}
              onClick={() => onSelect(modelClass)}
            >
              New {name}
            </Dropdown.Item>
          )
        })}
      </DropdownButton>
    )
  } else if (modelClasses.length) {
    const modelClass = modelClasses[0]
    return (
      <Button
        variant="primary"
        onClick={() => onSelect(modelClass)}
        id="createButton"
        style={{ whiteSpace: "nowrap" }}
      >
        New{" "}
        {(modelClass.displayName() || modelClass.resourceName).toLowerCase()}
      </Button>
    )
  }

  function onSelect(modelClass) {
    navigate(modelClass.pathForNew())
  }
}

export default CreateButton
