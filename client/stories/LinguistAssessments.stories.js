import {
  InstantAssessmentsRow,
  QuestionSetRow
} from "components/assessments/InstantAssessmentResults"
import InstantAssessmentsContainerField from "components/assessments/InstantAssessmentsContainerField"
import Fieldset from "components/Fieldset"
import { Form, Formik } from "formik"
import { Person } from "models"
import moment from "moment"
import React from "react"
import Settings from "settings"
import LinguistAssessmentsDoc from "./1-user/linguistAssessments.stories.mdx"

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

const instantAssessmentConfig = Settings.fields.advisor.person.assessments.find(
  assessment => assessment.recurrence === "once"
)
const assessmentConfig = {
  questions: instantAssessmentConfig.questions,
  questionSets: instantAssessmentConfig.questionSets
}

const PERIODS = [
  { start: moment().startOf("month"), end: moment().endOf("month") }
]

const translatorPerson = new Person(translator)

const ASSESSMENT_RESULTS = [
  [
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
            interpreterInterpretationOverallScore: "VG"
          }
        }
      },
      __recurrence: "once",
      __relatedObjectType: "report"
    }
  ]
]

export default {
  title: "ANET COMPONENTS/Linguist Assessments",
  parameters: {
    docs: {
      page: LinguistAssessmentsDoc
    }
  },
  decorators: [
    Story => (
      <Formik initialValues={{}} setFieldValue>
        {({ setFieldValue, setFieldTouched, validateForm, values }) => {
          return (
            <div>
              <Form className="form-horizontal" method="post">
                <Fieldset
                  title="Attendees engagement assessments"
                  id="attendees-engagement-assessments"
                >
                  <Story
                    relatedObject={values}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      validateForm,
                      values
                    }}
                  />
                </Fieldset>
              </Form>
            </div>
          )
        }}
      </Formik>
    )
  ]
}

const AssessmentForm = (args, context) => {
  const { formikProps, relatedObject } = context
  return (
    <InstantAssessmentsContainerField
      formikProps={formikProps}
      relatedObject={relatedObject}
      entityType={Person}
      entities={[translatorPerson]}
      parentFieldName={"attendeesAssessments"}
      {...args}
    />
  )
}

const AssessmentResults = () => {
  return (
    <table>
      <tbody>
        {Object.entries(assessmentConfig.questions || {}).map(
          ([key, config], index) => (
            <InstantAssessmentsRow
              key={key}
              idSuffix={`${key}-assessment`}
              questionKey={key}
              questionConfig={config}
              periods={PERIODS}
              periodsData={ASSESSMENT_RESULTS}
              isFirstRow={index === 0}
            />
          )
        )}
        {Object.entries(assessmentConfig?.questionSets || {}).map(
          ([questionSet, config]) => (
            <QuestionSetRow
              idSuffix={`assessment-${questionSet}`}
              key={questionSet}
              questionSetConfig={config}
              questionSetKey={questionSet}
              periods={PERIODS}
              periodsData={ASSESSMENT_RESULTS}
            />
          )
        )}
      </tbody>
    </table>
  )
}

export const AssessmentFormExample = AssessmentForm.bind({})

export const AssessmentResultsExample = AssessmentResults.bind({})
