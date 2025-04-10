import { Popover, PopoverInteractionKind } from "@blueprintjs/core"
import App6Symbol, { getChoices } from "components/App6Symbol"
import { Organization } from "models"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

interface FieldRow {
  fieldName: string
  values: any[]
  parentValue?: string
}

const FieldRow = ({ fieldName, values, parentValue }: FieldRow) => {
  if (!values[fieldName] && !parentValue) {
    return null
  }
  const choices = getChoices(fieldName, values)
  const text =
    choices[values[fieldName] || parentValue] +
    (values[fieldName] ? "" : " (inherited)")
  return (
    <tr style={{ border: "hidden" }}>
      <td style={{ fontWeight: "bold" }}>
        {Settings.fields.organization[fieldName].label}
      </td>
      <td id={fieldName}>{text}</td>
    </tr>
  )
}

interface App6SymbolPreviewProps {
  values: any
  size?: number
  maxHeight?: number
}

const App6SymbolPreview = ({
  values,
  size = 30,
  maxHeight
}: App6SymbolPreviewProps) => {
  const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values, values)
  const parentValues = {
    app6context: parentContext,
    app6standardIdentity: parentStandardIdentity,
    app6symbolSet: parentSymbolSet
  }
  const app6ValueKeys = Object.keys(values).filter(key =>
    key.startsWith("app6")
  )
  return (
    <Popover
      captureDismiss
      interactionKind={PopoverInteractionKind.HOVER}
      placement="bottom-start"
      autoFocus
      enforceFocus={false}
      content={
        <div
          style={{
            width: 500,
            backgroundColor: "#e0e8ed",
            padding: 20
          }}
        >
          <h4 className="mb-3">APP-06 Symbology</h4>
          <div
            className="bg-white"
            style={{
              borderRadius: 4,
              padding: 20
            }}
          >
            <Table responsive>
              <tbody>
                {app6ValueKeys.map(key => {
                  return (
                    <FieldRow
                      key={key}
                      fieldName={key}
                      values={values}
                      parentValue={parentValues[key]}
                    />
                  )
                })}
              </tbody>
            </Table>
          </div>
        </div>
      }
    >
      <div
        id="app6-symbol-preview"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 160,
          cursor: "pointer"
        }}
      >
        <App6Symbol
          values={{
            ...values,
            app6context: values.app6context
              ? values.app6context
              : parentValues.app6context,
            app6standardIdentity: values.app6standardIdentity
              ? values.app6standardIdentity
              : parentValues.app6standardIdentity,
            app6symbolSet: values.app6symbolSet
              ? values.app6symbolSet
              : parentValues.app6symbolSet
          }}
          size={size}
          maxHeight={maxHeight}
        />
      </div>
    </Popover>
  )
}

export default App6SymbolPreview
