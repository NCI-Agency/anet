import "bootstrap/dist/css/bootstrap.css"
import AppContext from "components/AppContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import "index.css"
import { Person } from "models"
import React from "react"
import { MemoryRouter } from "react-router"

const admin = new Person({
  uuid: "d80d6b0a-ac99-401c-8060-6a61d6083c5c",
  name: "DMIN, Arthur",
  rank: "CIV",
  role: "ADVISOR",
  emailAddress: "hunter+arthur@example.com",
  status: "ACTIVE",
  pendingVerification: false,
  avatar: null,
  code: null,
  position: {
    uuid: "a772a6a5-4821-4a9f-9315-28a9b82df09f",
    name: "ANET Administrator",
    code: null,
    type: "ADMINISTRATOR",
    status: "ACTIVE",
    isApprover: true,
    organization: {
      uuid: "85ca7421-bc22-40dc-820a-83c8a2a78971",
      shortName: "ANET Administrators",
      descendantOrgs: []
    },
    location: {
      uuid: "c8fdb53f-6f93-46fc-b0fa-f005c7b49667",
      name: "Cabot Tower"
    },
    associatedPositions: [],
    responsibleTasks: [],
    authorizationGroups: []
  }
})

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    // Sort stories alphabetically
    storySort: (a, b) =>
      a.title === b.title
        ? 0
        : a.id.localeCompare(b.id, undefined, { numeric: true })
  }
}

export const decorators = [
  story => (
    <MemoryRouter initialEntries={["/"]}>
      <AppContext.Provider
        value={{
          currentUser: admin
        }}
      >
        <ResponsiveLayoutContext.Provider
          value={{
            showFloatingMenu: false,
            topbarOffset: 0,
            securityBannerOffset: 0
          }}
        >
          {story()}
        </ResponsiveLayoutContext.Provider>
      </AppContext.Provider>
    </MemoryRouter>
  )
]
