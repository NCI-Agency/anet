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
  const toQueryValue = toQuery(value)

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
        toQuery: toQueryValue
      })
    }
  }, [asFormField, onChange, toQueryValue, value])

  return [value, setValue]
}

export default useSearchFilter
