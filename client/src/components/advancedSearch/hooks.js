import _isEqualWith from "lodash/isEqualWith"
import { useState, useEffect, useRef } from "react"
import utils from "utils"

const useSearchFilter = (
  asFormField,
  onChange,
  inputValue,
  defaultValue,
  toQuery
) => {
  const latestValueProp = useRef(inputValue)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    inputValue,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(defaultValue)
  const toQueryValue = toQuery(value)

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = inputValue
      setValue(inputValue)
    }
  }, [inputValue, valuePropUnchanged])

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
