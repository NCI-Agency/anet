import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import { Person, Position } from "models"
import React from "react"
import { Table } from "react-bootstrap"

interface NoPaginationPeopleTableProps {
  id?: string
  people?: any[]
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  noPeopleMessage?: string
}

const NoPaginationPeopleTable = ({
  id,
  people,
  showDelete = false,
  onDelete,
  noPeopleMessage = "No people found"
}: NoPaginationPeopleTableProps) => {
  const peopleExists = _get(people, "length", 0) > 0

  return (
    <div id={id}>
      {peopleExists ? (
        <Table striped hover responsive className="people_table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Position</th>
              <th>Location</th>
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {Person.map(people, person => {
              return (
                <tr key={person.uuid}>
                  <td>
                    <LinkTo modelType="Person" model={person} />
                  </td>
                  <td>
                    {person.position && person.position.organization && (
                      <LinkTo
                        modelType="Organization"
                        model={person.position.organization}
                      />
                    )}
                  </td>
                  <td>
                    <LinkTo modelType="Position" model={person.position}>
                      {Position.toString(person.position)}
                      {person.position?.code ? `, ${person.position.code}` : ""}
                    </LinkTo>
                  </td>
                  <td>
                    <LinkTo
                      modelType="Location"
                      model={person.position && person.position.location}
                      whenUnspecified=""
                    />
                  </td>
                  {showDelete && (
                    <td id={"personDelete_" + person.uuid}>
                      <RemoveButton
                        title="Remove person"
                        onClick={() => onDelete(person)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <em>{noPeopleMessage}</em>
      )}
    </div>
  )
}

export default NoPaginationPeopleTable
