import { Person } from "models"

const adminData = {
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
}

export const admin = new Person(adminData)
