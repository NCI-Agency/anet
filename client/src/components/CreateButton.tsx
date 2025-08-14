import AppContext from "components/AppContext"
import * as Models from "models"
import React, { useContext } from "react"
import { Button, Dropdown, DropdownButton } from "react-bootstrap"
import { useNavigate } from "react-router-dom"

const DEFAULT_ACTIONS = [Models.Report]

const SUPERUSER_ACTIONS = [
  Models.Person,
  Models.Position,
  Models.Location,
  Models.Event,
  Models.EventSeries
]

const ENHANCED_SUPERUSER_ACTIONS = [Models.Organization, Models.Task]

const ADMIN_ACTIONS = [Models.AuthorizationGroup]

const CreateButton = () => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()

  const modelClasses = getActions()

  if (modelClasses.length > 1) {
    return (
      <DropdownButton id="createButton" title="Create" align="end">
        {modelClasses.map(modelClass => {
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

  function getActions() {
    const result: any[] = [...DEFAULT_ACTIONS]
    if (currentUser.isSuperuser()) {
      result.push(...SUPERUSER_ACTIONS)
    }
    if (currentUser.isEnhancedSuperuser()) {
      result.push(...ENHANCED_SUPERUSER_ACTIONS)
    }
    if (currentUser.isAdmin()) {
      result.push(...ADMIN_ACTIONS)
    }
    return result
  }
}

export default CreateButton
