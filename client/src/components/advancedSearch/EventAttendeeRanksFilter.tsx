import useSearchFilter from "components/advancedSearch/hooks"
import _map from "lodash/map"
import React from "react"
import { Form } from "react-bootstrap"
import Settings from "settings"

interface EventAttendeeRanksFilterProps {
  queryKey: string
  value?: {
    attendeeRanks?: string[]
    toQuery?: (...args: unknown[]) => unknown
  }
  onChange?: (...args: unknown[]) => unknown
  asFormField?: boolean
}

const EventAttendeeRanksFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue = {},
  onChange
}: EventAttendeeRanksFilterProps) => {
  const ranks = Settings.fields.person.ranks || []

  const defaultValue = {
    attendeeRanks: inputValue.attendeeRanks || []
  }

  const toQuery = val => ({
    attendeeRanks: val.attendeeRanks ?? []
  })

  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const filterDisplay =
    value.attendeeRanks.length === 0
      ? "All ranks"
      : value.attendeeRanks.join(" or ")

  return !asFormField ? (
    filterDisplay
  ) : (
    <Form.Group>
      <Form.Select
        id={queryKey}
        multiple
        value={value.attendeeRanks}
        onChange={handleChange}
      >
        {ranks.map(rank => (
          <option key={rank.value} value={rank.value}>
            {rank.value}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )

  function handleChange(event) {
    const selectedOptions =
      event.target.selectedOptions ||
      Array.from(event.target.options).filter(o => o.selected)

    setValue(prevValue => ({
      ...prevValue,
      attendeeRanks: _map(selectedOptions, o => o.value)
    }))
  }
}

export const deserialize = (props, query, key) => {
  if (!query.attendeeRanks) {
    return null
  }

  const value = {
    attendeeRanks: Array.isArray(query.ranks)
      ? query.attendeeRanks
      : [query.attendeeRanks]
  }

  return {
    key,
    value: {
      ...value,
      toQuery: value
    }
  }
}

export default EventAttendeeRanksFilter
