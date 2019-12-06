import _isEqualWith from "lodash/isEqualWith"
import { useState, useEffect, useRef } from "react"
import utils from "utils"

const useSearchFilter = (props, defaultValue, toQuery) => {
  const { asFormField, onChange } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(defaultValue)
  const toQueryVal = toQuery(value) // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
  }, [props.value, valuePropUnchanged])

  useEffect(() => {
    if (asFormField) {
      onChange({
        ...value,
        toQuery: () => toQueryVal
      })
    }
  }, [asFormField, onChange, toQueryVal, value])

  return [value, setValue]
}

export default useSearchFilter
