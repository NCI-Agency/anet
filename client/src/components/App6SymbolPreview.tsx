import { Popover, PopoverInteractionKind } from "@blueprintjs/core"
import App6Symbol from "components/App6Symbol"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import { Field, Form } from "formik"
import { Organization } from "models"
import React from "react"
import Settings from "settings"

const FieldLine = ({ fieldName, value, parentValue = null }) => {
  return (
    <DictionaryField
      wrappedComponent={Field}
      dictProps={Settings.fields.organization[fieldName]}
      name={fieldName}
      component={FieldHelper.ReadonlyField}
      humanValue={
        (parentValue && (
          <em>
            {Settings.fields.organization[fieldName][parentValue]} (inherited
            from parent)
          </em>
        )) ||
        Settings.fields.organization[fieldName].choices[value]
      }
    />
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
        <Form
          className="form-horizontal"
          method="post"
          style={{
            minWidth: 500,
            backgroundColor: "#e0e8ed",
            padding: 20,
            boxShadow: "none"
          }}
        >
          <Fieldset
            title="APP-06 symbology"
            id="app6-symbology"
            style={{ borderRadius: 4 }}
          >
            <FieldLine
              fieldName="app6context"
              value={values.app6context}
              parentValue={parentContext}
            />
            <FieldLine
              fieldName="app6standardIdentity"
              value={values.app6standardIdentity}
              parentValue={parentStandardIdentity}
            />
            <FieldLine
              fieldName="app6symbolSet"
              value={values.app6symbolSet}
              parentValue={parentSymbolSet}
            />
            <FieldLine fieldName="app6hq" value={values.app6hq} />
            <FieldLine fieldName="app6amplifier" value={values.app6amplifier} />
          </Fieldset>
        </Form>
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
          context={values.app6context || parentContext}
          standardIdentity={
            values.app6standardIdentity || parentStandardIdentity
          }
          symbolSet={values.app6symbolSet || parentSymbolSet}
          hq={values.app6hq}
          amplifier={values.app6amplifier}
          version={version}
          status={status}
          size={size}
        />
      </div>
    </Popover>
  )
}

export default App6SymbolPreview
