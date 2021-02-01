import React from "react"

const Help = () => {
  return (
    <div>
      <h2>How it works</h2>
      <ul style={{ listStyle: "outside", paddingInlineStart: "20px" }}>
        <li>
          <p>
            You can create draft reports and preview / review them until the
            report is ready to submit
          </p>
        </li>
        <li>
          <p>
            After reviewing, once you submit a report, you can't update further
          </p>
        </li>
        <li>
          <p>
            The reports will be available for 2 hours after creating, after that
            it will automatically be deleted
          </p>
        </li>
        <li>
          <p>You can also delete reports manually after you are finished</p>
        </li>
      </ul>
    </div>
  )
}
export default Help
