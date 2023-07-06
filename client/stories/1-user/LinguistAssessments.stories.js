import InstantAssessmentResultsTable from "components/assessments/instant/InstantAssessmentResultsTable"
import InstantAssessmentsContainerField from "components/assessments/instant/InstantAssessmentsContainerField"
import Fieldset from "components/Fieldset"
import { Form, Formik } from "formik"
import { Person, Report } from "models"
import moment from "moment"
import { RECURRENCE_TYPE, useResponsiveNumberOfPeriods } from "periodUtils"
import React, { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import linguistAssessmentsDoc from "./linguistAssessments.stories.mdx"

const assessmentSubkey = "advisorOnceReportLinguist"
const assessmentKey = `fields.advisor.person.assessments.${assessmentSubkey}`

const translator = {
  attendee: true,
  author: false,
  avatar: null,
  biography: "",
  code: "",
  country: "",
  domainUsername: "",
  emailAddress: "",
  name: "GUIST, Lin",
  notes: [],
  role: "ADVISOR",
  position: {
    name: "LNG Advisor A",
    organization: {
      shortName: "LNG"
    }
  },
  uuid: "7242dcad-62a8-4adf-8ec2-c6460ff0a89d"
}

const ASSESSMENT_RESULTS = [
  {
    linguistRole: "translator",
    questionSets: {
      translator: {
        questions: {
          translatorGotAdequateTime: "yes",
          translatorMetDeadline: "yes",
          translatorSubjectVocabularyScore: "B",
          translatorSubjectComment:
            "Translator doesn't know the meanings of some <i>mission specific</i> words",
          preparedDocuments: "yes",
          documentQuality: "EX",
          translatorOverallScore: "VG"
        }
      }
    },
    __recurrence: "once",
    __relatedObjectType: "report"
  },
  {
    linguistRole: "translator",
    questionSets: {
      translator: {
        questions: {
          translatorGotAdequateTime: "no",
          translatorMetDeadline: "yes",
          translatorSubjectVocabularyScore: "EX",
          preparedDocuments: "yes",
          documentQuality: "B",
          translatorOverallScore: "EX"
        }
      }
    },
    __recurrence: "once",
    __relatedObjectType: "report"
  },
  {
    linguistRole: "translator",
    questionSets: {
      translator: {
        questions: {
          translatorGotAdequateTime: "yes",
          translatorMetDeadline: "no",
          translatorSubjectVocabularyScore: "S",
          preparedDocuments: "no",
          translatorOverallScore: "B",
          translatorOverallComment:
            "He <b>couldn't</b> translate most of the sentences"
        }
      }
    },
    __recurrence: "once",
    __relatedObjectType: "report"
  },
  {
    linguistRole: "interpreter",
    questionSets: {
      interpreter: {
        questions: {
          interpreterHadPreMeeting: "yes",
          interpreterProvidedWithNecessarySubjectMaterial: "yes",
          interpreterSubjectVocabularyScore: "EX",
          interpreterSubjectUnderstandingScore: "VG",
          interpreterWorkEthicScore: "EX",
          interpreterPostureScore: "G",
          interpreterRoleScore: "VG",
          preparedDocuments: "yes",
          documentQuality: "VG",
          interpreterInterpretationOverallScore: "VG"
        }
      }
    },
    __recurrence: "once",
    __relatedObjectType: "report"
  }
]

translator.notes = ASSESSMENT_RESULTS.map(ar => ({
  uuid: uuidv4(),
  createdAt: moment(),
  updatedAt: moment(),
  type: "ASSESSMENT",
  assessmentKey,
  text: JSON.stringify(ar),
  noteRelatedObjects: [
    {
      relatedObjectType: "reports",
      relatedObjectUuid: uuidv4(),
      relatedObject: {
        state: "PUBLISHED",
        engagementDate: moment()
      }
    }
  ]
}))

const translatorPerson = new Person(translator)

export default {
  title: "ANET COMPONENTS/Instant Assessments",
  parameters: {
    docs: {
      page: linguistAssessmentsDoc
    }
  }
}

export const LinguistAssessmentForm = () => {
  return (
    <Formik initialValues={{}} setFieldValue>
      {({ setFieldValue, setFieldTouched, validateForm, values }) => (
        <Form className="form-horizontal" method="post">
          <Fieldset
            title="Attendees engagement assessments"
            id="attendees-engagement-assessments"
          >
            <InstantAssessmentsContainerField
              entityType={Person}
              entities={[translatorPerson]}
              relatedObject={values}
              parentFieldName={Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD}
              formikProps={{
                setFieldTouched,
                setFieldValue,
                validateForm,
                values
              }}
              canRead
              canWrite
            />
          </Fieldset>
        </Form>
      )}
    </Formik>
  )
}

export const LinguistAssessmentResults = () => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)
  return (
    <div ref={contRef}>
      <InstantAssessmentResultsTable
        assessmentKey={assessmentSubkey}
        style={{ flex: "0 0 100%" }}
        entity={translatorPerson}
        entityType={Person}
        periodsDetails={{
          recurrence: RECURRENCE_TYPE.MONTHLY,
          numberOfPeriods
        }}
      />
    </div>
  )
}
