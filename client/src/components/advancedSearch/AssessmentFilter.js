import useSearchFilter from "components/advancedSearch/hooks"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Form } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const KEY = "key"
const FILTERS = "filters"

function getLabel(k, v) {
  return v?.label ?? utils.sentenceCase(k)
}

const AssessmentFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange,
  objectType
}) => {
  const defaultValue = {
    [KEY]: inputValue[KEY] ?? "",
    [FILTERS]: {
      ...(inputValue[FILTERS] ?? {})
    }
  }
  const toQuery = val => ({
    [queryKey]: {
      [KEY]: val[KEY],
      [FILTERS]: val[FILTERS]
    }
  })
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )
  const assessmentDefinitions =
    _get(Settings.fields, objectType)?.assessments ?? {}
  const optionsLabels = Object.entries(assessmentDefinitions).map(([k, v]) => ({
    value: k,
    label: getLabel(k, v)
  }))
  const assessmentKey = value[KEY]
  const assessmentDefinition = assessmentDefinitions?.[assessmentKey]

  return !asFormField ? (
    <>{getDisplay()}</>
  ) : (
    <Form.Group>
      <Form.Select
        id={queryKey}
        name={KEY}
        value={assessmentKey}
        onChange={handleKeyChange}
      >
        <option value="" />
        {optionsLabels.map((v, idx) => (
          <option key={idx} value={v.value}>
            {v.label}
          </option>
        ))}
      </Form.Select>
      {!!assessmentDefinition &&
        Object.entries(assessmentDefinition?.questions || {})
          .filter(([_, v]) => ["enum", "enumset"].includes(v.type))
          .map(([k, v]) => (
            <div
              key={`${queryKey}.${k}`}
              style={{ verticalAlign: "top", paddingLeft: "8px" }}
            >
              <em>{getLabel(k, v)} </em>
              <Form.Select
                id={`${queryKey}.${k}`}
                name={k}
                value={value[FILTERS]?.[k]}
                onChange={handleFilterChange}
              >
                <option value="" />
                {Object.entries(v?.choices ?? []).map(
                  ([optionKey, optionValue]) => (
                    <option key={optionKey} value={optionKey}>
                      {getLabel(optionKey, optionValue)}
                    </option>
                  )
                )}
              </Form.Select>
            </div>
          ))}
    </Form.Group>
  )

  function getDisplay() {
    let display =
      optionsLabels.find(v => v.value === assessmentKey)?.label ?? ""
    const filtersDisplay = Object.entries(value[FILTERS] ?? {}).map(
      ([k, v]) => {
        const matchingFilter = Object.entries(
          assessmentDefinition?.questions || {}
        ).find(([adk, _]) => k === adk)?.[1]
        if (!matchingFilter) {
          return null
        }
        const matchingValue = Object.entries(matchingFilter.choices || {}).find(
          ([adc, _]) => v === adc
        )?.[1]
        if (!matchingValue) {
          return null
        }
        return `${matchingFilter.label} = ${matchingValue.label}`
      }
    )
    if (!_isEmpty(filtersDisplay)) {
      display = display.concat(" with ").concat(filtersDisplay.join(" and "))
    }
    return display
  }

  function handleKeyChange(event) {
    // set the key, and remove all filters
    setValue({ [KEY]: event.target.value })
  }

  function handleFilterChange(event) {
    if (_isEmpty(event.target.value)) {
      // remove the filter
      setValue(prevValue => {
        const filters = prevValue?.[FILTERS]
        delete filters[event.target.name]
        return {
          ...prevValue,
          [FILTERS]: filters
        }
      })
    } else {
      // add the filter
      setValue(prevValue => ({
        ...prevValue,
        [FILTERS]: {
          ...prevValue?.[FILTERS],
          [event.target.name]: event.target.value
        }
      }))
    }
  }
}
AssessmentFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      [KEY]: PropTypes.string,
      [FILTERS]: PropTypes.object,
      toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    })
  ]),
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  asFormField: PropTypes.bool
}
AssessmentFilter.defaultProps = {
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    const value = {
      [KEY]: query[queryKey][KEY],
      [FILTERS]: { ...query[queryKey][FILTERS] }
    }
    return {
      key,
      value: {
        ...value,
        toQuery: {
          [queryKey]: {
            ...value
          }
        }
      }
    }
  }
  return null
}

export default AssessmentFilter
