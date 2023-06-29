import OnDemandAssessment from "components/assessments/ondemand/OndemandAssessment"
import { Person } from "models"
import moment from "moment"
import { useResponsiveNumberOfPeriods } from "periodUtils"
import React, { useState } from "react"
import vettingAndScreeningDoc from "./vettingAndScreening.stories.mdx"

const assessmentSubkey = "interlocutorOndemandScreeningAndVetting"
const assessmentKey = `fields.regular.person.assessments.${assessmentSubkey}`

const personData = {
  avatar: null,
  biography: "",
  code: "",
  country: "",
  domainUsername: "",
  emailAddress: "",
  name: "Testperson, Person",
  rank: "CIV",
  user: false,
  position: {
    type: "REGULAR",
    name: "Director of Tests",
    organization: {
      identificationCode: "Z12345",
      shortName: "MoD",
      uuid: "2612c0e7-3bb3-47d8-9697-c41854ee2a99"
    },
    uuid: "338e4d54-ada7-11eb-8529-0242ac130003"
  },
  status: "ACTIVE",
  uuid: "b7072fc0-427d-4c4e-b979-7d4e3d5a6d36",
  notes: [
    {
      uuid: "d635a894-1e6c-4040-a0d3-bdd9cb6a2746",
      createdAt: moment(),
      updatedAt: moment(),
      type: "ASSESSMENT",
      assessmentKey,
      text: JSON.stringify({
        question2: "<p>Assessment rich text!</p>",
        question1: "pass1",
        expirationDate: moment().add(108, "days"),
        assessmentDate: moment(),
        __recurrence: "ondemand",
        __periodStart: "2021-10-08"
      }),
      author: {
        uuid: "6fc24fab-f869-49de-bfb9-3f0eb3a36488",
        name: "DMIN, Arthur",
        rank: "CIV"
      },
      noteRelatedObjects: [
        {
          noteUuid: "d635a894-1e6c-4040-a0d3-bdd9cb6a2746",
          relatedObjectType: "people",
          relatedObjectUuid: "b7072fc0-427d-4c4e-b979-7d4e3d5a6d36",
          relatedObject: {
            rank: "CIV",
            name: "KYLESON, Kyle",
            avatar: null
          }
        }
      ]
    },
    {
      uuid: "e9678e99-c0f4-417a-8bc3-40b49e4e0143",
      createdAt: moment().subtract(3, "days"),
      updatedAt: moment().subtract(3, "days"),
      type: "ASSESSMENT",
      assessmentKey,
      text: JSON.stringify({
        question2: "<p>Assessment rich text!</p>",
        question1: "pass3",
        expirationDate: moment().subtract(1, "day"),
        assessmentDate: moment().subtract(3, "days"),
        __recurrence: "ondemand",
        __periodStart: "2021-10-08"
      }),
      author: {
        uuid: "6fc24fab-f869-49de-bfb9-3f0eb3a36488",
        name: "DMIN, Arthur",
        rank: "CIV"
      },
      noteRelatedObjects: [
        {
          noteUuid: "e9678e99-c0f4-417a-8bc3-40b49e4e0143",
          relatedObjectType: "people",
          relatedObjectUuid: "b7072fc0-427d-4c4e-b979-7d4e3d5a6d36",
          relatedObject: {
            rank: "CIV",
            name: "KYLESON, Kyle",
            avatar: null
          }
        }
      ]
    },
    {
      uuid: "6ec4a426-369c-444c-bdc2-0a5d94763e5e",
      createdAt: moment().subtract(6, "days"),
      updatedAt: moment().subtract(6, "days"),
      type: "ASSESSMENT",
      assessmentKey,
      text: JSON.stringify({
        question2: "<p>Assessment rich text!</p>",
        question1: "fail1",
        expirationDate: moment().add(102, "days"),
        assessmentDate: moment().subtract(6, "days"),
        __recurrence: "ondemand",
        __periodStart: "2021-10-08"
      }),
      author: {
        uuid: "6fc24fab-f869-49de-bfb9-3f0eb3a36488",
        name: "DMIN, Arthur",
        rank: "CIV"
      },
      noteRelatedObjects: [
        {
          noteUuid: "6ec4a426-369c-444c-bdc2-0a5d94763e5e",
          relatedObjectType: "people",
          relatedObjectUuid: "b7072fc0-427d-4c4e-b979-7d4e3d5a6d36",
          relatedObject: {
            rank: "CIV",
            name: "KYLESON, Kyle",
            avatar: null
          }
        }
      ]
    },
    {
      uuid: "36065d64-7d17-4be6-993a-fa20af80c662",
      createdAt: moment().subtract(9, "days"),
      updatedAt: moment().subtract(9, "days"),
      type: "ASSESSMENT",
      assessmentKey,
      text: JSON.stringify({
        question2: "<p>Assessment rich text!</p>",
        question1: "fail3",
        expirationDate: moment().subtract(6, "days"),
        assessmentDate: moment().subtract(9, "days"),
        __recurrence: "ondemand",
        __periodStart: "2021-10-08"
      }),
      author: {
        uuid: "6fc24fab-f869-49de-bfb9-3f0eb3a36488",
        name: "DMIN, Arthur",
        rank: "CIV"
      },
      noteRelatedObjects: [
        {
          noteUuid: "36065d64-7d17-4be6-993a-fa20af80c662",
          relatedObjectType: "people",
          relatedObjectUuid: "b7072fc0-427d-4c4e-b979-7d4e3d5a6d36",
          relatedObject: {
            rank: "CIV",
            name: "KYLESON, Kyle",
            avatar: null
          }
        }
      ]
    }
  ]
}

const person = new Person(personData)

export default {
  title: "ANET COMPONENTS/On Demand Assessments",
  parameters: {
    docs: {
      page: vettingAndScreeningDoc
    }
  }
}

export const VettingAndScreening = () => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)
  return (
    <div ref={contRef}>
      <OnDemandAssessment
        key="ondemand"
        assessmentKey={assessmentSubkey}
        style={{ flex: "0 0 100%" }}
        entity={person}
        entityType={Person}
        periodsDetails={{
          recurrence: "ondemand",
          numberOfPeriods
        }}
        canAddAssessment
        onUpdateAssessment={() => {
          console.log("Assessment updated")
        }}
      />
    </div>
  )
}
