import AggregationWidgetContainer, {
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
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

const questionConfig = Settings.fields.advisor.person.assessments.find(
  assessment => assessment.recurrence === "once"
).questions

const translatorPerson = new Person(translator)

const ASSESSMENT_RESULTS = [
  {
    linguistRole: "translator",
    translatorGotAdequateTime: "yes",
    translatorMetDeadline: "yes",
    translatorSubjectVocabularyScore: "B",
    translatorSubjectComment:
      "Translator doesn't know the meanings of some mission specific words",
    translatorOverallScore: "VG"
  },
  {
    linguistRole: "interpreter",
    interpreterHadPreMeeting: "yes",
    interpreterProvidedWithNecessarySubjectMaterial: "yes",
    interpreterSubjectVocabularyScore: "EX",
    interpreterSubjectUnderstandingScore: "VG",
    interpreterWorkEthicScore: "EX",
    interpreterPostureScore: "EX",
    interpreterRoleScore: "VG",
    interpreterInterpretationOverallScore: "EX"
  }
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
  return Object.keys(questionConfig).map(question => {
    const aggregationWidget = getAggregationWidget(questionConfig[question])
    return (
      <div key={question}>
        <AggregationWidgetContainer
          data={ASSESSMENT_RESULTS}
          fieldConfig={questionConfig[question]}
          fieldName={question}
          period={{ start: moment(), end: moment() }}
          vertical={true}
          widget={aggregationWidget}
          widgetId="widgetId"
        />
      </div>
    )
  })
}

export const AssessmentFormExample = AssessmentForm.bind({})

export const AssessmentResultsExample = AssessmentResults.bind({})
