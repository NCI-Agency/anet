import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import { Person, Position } from "models"
import React from "react"
import { Button, Table } from "react-bootstrap"

interface NoPaginationPeopleTableProps {
  id?: string
  people?: any[]
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  showAccessActions?: boolean
  onAccessChanged?: (person: any, allow: boolean) => unknown
  noPeopleMessage?: React.ReactNode
}

const NoPaginationPeopleTable = ({
  id,
  people,
  showDelete = false,
  onDelete,
  showAccessActions = false,
  onAccessChanged,
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
              {showAccessActions && <th className="col-sm-3" />}
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
                  {showAccessActions && (
                    <td>
                      <Button
                        variant="primary"
                        onClick={() => onAccessChanged(person, true)}
                      >
                        Allow Access
                      </Button>
                      <Button
                        variant="outline-danger"
                        className="ms-2"
                        onClick={() => onAccessChanged(person, false)}
                      >
                        Deny Access
                      </Button>
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
