import { Popover, PopoverInteractionKind } from "@blueprintjs/core"
import App6Symbol from "components/App6Symbol"
import { Organization } from "models"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"
import { App6Choices } from "./App6"

interface FieldRow {
  fieldName: string
  value: string
  parentValue?: string
}

const FieldRow = ({ fieldName, value, parentValue = null }: FieldRow) => {
  const valueText =
    (parentValue && (
      <em>{App6Choices[fieldName][parentValue]} (inherited from parent)</em>
    )) ||
    App6Choices[fieldName][value]
  return (
    <tr style={{ border: "hidden" }}>
      <td style={{ fontWeight: "bold" }}>
        {Settings.fields.organization[fieldName].label}
      </td>
      <td>{valueText}</td>
    </tr>
  )
}

interface App6SymbolPreviewProps {
  values: any
  version?: string
  status?: string
  size?: number
}

const App6SymbolPreview = ({
  values,
  version = "10",
  status = "0",
  size = 30
}: App6SymbolPreviewProps) => {
  const { parentContext, parentStandardIdentity, parentSymbolSet } =
    Organization.getApp6ParentFields(values, values)
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
                <FieldRow
                  fieldName="app6context"
                  value={values.app6context}
                  parentValue={parentContext}
                />
                <FieldRow
                  fieldName="app6standardIdentity"
                  value={values.app6standardIdentity}
                  parentValue={parentStandardIdentity}
                />
                <FieldRow
                  fieldName="app6symbolSet"
                  value={values.app6symbolSet}
                  parentValue={parentSymbolSet}
                />
                <FieldRow fieldName="app6hq" value={values.app6hq} />
                {/* <FieldRow
                  fieldName="app6amplifier"
                  value={values.app6amplifier}
                /> */}
              </tbody>
            </Table>
          </div>
        </div>
      }
    >
      <div
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
              : parentContext,
            app6standardIdentity: values.app6standardIdentity
              ? values.app6standardIdentity
              : parentStandardIdentity,
            app6symbolSet: values.app6symbolSet
              ? values.app6symbolSet
              : parentSymbolSet
          }}
          size={size}
        />
      </div>
    </Popover>
  )
}

export default App6SymbolPreview
