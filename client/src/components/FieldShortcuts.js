import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"

const FieldShortcuts = ({
  shortcuts,
  fieldName,
  objectType,
  curValue,
  onChange,
  handleAddItem,
  title
}) =>
  shortcuts &&
  shortcuts.length > 0 && (
    <div id={`${fieldName}-shortcut-list`} className="shortcut-list">
      <h5>{title}</h5>
      {objectType.map(shortcuts, (shortcut, idx) => (
        <Button
          key={shortcut.uuid}
          bsStyle="link"
          onClick={() => handleAddItem(shortcut, onChange, curValue)}
        >
          Add{" "}
          <LinkTo
            modelType={objectType.resourceName}
            model={shortcut}
            isLink={false}
            forShortcut
          />
        </Button>
      ))}
    </div>
  )

FieldShortcuts.propTypes = {
  shortcuts: PropTypes.arrayOf(PropTypes.shape({ uuid: PropTypes.string })),
  fieldName: PropTypes.string.isRequired,
  objectType: PropTypes.func.isRequired,
  curValue: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func,
  handleAddItem: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
}

export default FieldShortcuts
