import { Organization } from "models"
import pluralize from "pluralize"
import Settings from "settings"

const taskShortLabelSingular = Settings.fields.task.shortLabel
const taskShortLabelPlural = pluralize(taskShortLabelSingular)
const personSingular = Settings.fields.regular.person.name
const advisorSingular = Settings.fields.advisor.person.name
const advisorPlural = pluralize(advisorSingular)
const interlocutorSingular = Settings.fields.interlocutor.person.name
const interlocutorPlural = pluralize(interlocutorSingular)
const positionSingular = Settings.fields.regular.position.name
const positionCode = Settings.fields.position.code.label

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
const userTour = (currentUser, navigate) => {
  return {
    id: "home",
    steps: [
      {
        title: "Welcome",
        content:
          "Welcome to ANET! This tour will quickly show you where to find information in ANET, and how to draft a report.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      },
      {
        title: "My ANET snapshot",
        content:
          "This area shows you how many reports you've drafted but haven't submitted, the number of your reports waiting for approval from your organization's approval chain, and your organization's reports in the last 7 days and planned engagements.",
        disableBeacon: true,
        target: ".home-tile-row",
        placement: "bottom"
      },
      {
        title: "Home",
        content:
          "Click on the logo to get back to your homepage, from wherever you are.",
        disableBeacon: true,
        target: "#anet-logo",
        placement: "right",
        isFixed: true
      },
      {
        title: "Search",
        content:
          "Search for reports, people, keywords, or organizations. You can save searches to your homepage.",
        disableBeacon: true,
        target: "#searchBarInput",
        placement: "bottom",
        isFixed: true
      },
      {
        title: "My Work",
        content:
          'The "My Work" menu contains quick links to items that are relevant for you. E.g. when you save searches, they appear under My Searches in this menu. Saved searches are a good way to stay update on certain topics. For example, you can save a search for the word "Corruption" to see reports that mention that keyword. If you have more than one saved search, you can choose which one to display by selecting it from the list.',
        disableBeacon: true,
        target: "#my-work",
        placement: "top",
        isFixed: true
      },
      {
        title: "New Report",
        content: "Create a report by clicking on this button.",
        disableBeacon: true,
        target: "#createButton",
        placement: "left",
        isFixed: true
      }
    ]
  }
}

const superuserTour = (currentUser, navigate) => {
  return {
    id: "home",
    steps: [
      {
        title: "Welcome",
        content:
          "Welcome to ANET! This guided tour shows superusers how to find reports you need to approve and keep your organization up to date.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      },
      {
        title: "Home",
        content:
          "Click on the logo to get back to your homepage, from wherever you are.",
        disableBeacon: true,
        target: "#anet-logo",
        placement: "right",
        isFixed: true
      },
      {
        title: "Search",
        content:
          "Search for reports, people, keywords, or organizations. You can save searches to your homepage.",
        disableBeacon: true,
        target: "#searchBarInput",
        placement: "bottom",
        isFixed: true
      },
      {
        title: "My ANET snapshot",
        content:
          "This area shows you the reports that need your approval as well as your organization's draft reports, reports submitted in the last 7 days, and planned engagements.",
        disableBeacon: true,
        target: ".home-tile-row",
        placement: "bottom"
      },
      {
        title: "Create",
        content:
          'If you need to create a new report, person, position, or location, click on this "Create" button and select what you need from the menu.',
        disableBeacon: true,
        target: "#createButton",
        placement: "left",
        isFixed: true
      },
      {
        title: "My Organization",
        content:
          'You can navigate to your organization by clicking on the "My Organization" link under the "My Work" menu. Click "next" to continue this tour on your organization\'s page.',
        disableBeacon: true,
        target: "#my-work",
        placement: "right",
        isFixed: true,
        locale: { last: "Next" },
        // Custom props:
        multipage: true,
        onNext: () =>
          navigate(Organization.pathFor(currentUser.position.organization), {
            state: { showGuidedTour: true }
          })
      }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
const reportTour = (currentUser, navigate) => {
  return {
    id: "report",
    steps: [
      {
        title: Settings.fields.report.intent.label,
        content: `Use this section to tell readers why you met with your ${interlocutorSingular}. Were you working on a specific goal or problem with them? This will be part of your report's summary, so use this space to tell readers the high-level purpose of your engagement.`,
        disableBeacon: true,
        target: "#fg-intent",
        placement: "bottom-start"
      },
      {
        title: "Engagement date",
        content:
          "When did this engagement happen, or when will it take place? Choosing a date in the future will create an planned engagement. On the day of your planned engagement you'll get an email letting you know that the report you started moved back to your drafts.",
        disableBeacon: true,
        target: "#fg-engagementDate",
        placement: "bottom-start"
      },
      {
        title: "Engagement location",
        content:
          "Start typing the location of where the engagement took place. Select one of the options available, or ask your superuser to add it.",
        disableBeacon: true,
        target: "#fg-location",
        placement: "bottom-start"
      },
      {
        title: Settings.fields.report.atmosphere.label,
        content: `Select the ${Settings.fields.report.atmosphere.label} of your meeting. This information is used in threat assessments. Highlight specific issues or concerns in the details section below.`,
        disableBeacon: true,
        target: "#fg-atmosphere",
        placement: "bottom-start"
      },
      {
        title: "Attendee(s)",
        content: `Start typing the name of everyone who was at the meeting, including ${interlocutorPlural} and ${advisorPlural}. Select one of the options available or ask your superuser to add it.`,
        disableBeacon: true,
        target: "#fg-reportPeople",
        placement: "bottom-start"
      },
      {
        title: "Recents",
        content: `If you've written reports in the past, your recent selections of attendees, ${taskShortLabelPlural} and locations will show up in the select pop-up. You can select them to quickly add them to your report.`,
        disableBeacon: true,
        target: "#fg-reportPeople",
        placement: "bottom-end"
      },
      {
        title: `Primary ${advisorSingular} and ${interlocutorSingular}`,
        content: `Use these check boxes to indicate who the primary ${advisorSingular} and primary ${interlocutorSingular} was. The people you choose will display on your report's summary as the main individuals involved in your engagement.`,
        disableBeacon: true,
        target:
          "#reportPeopleContainer table.advisorAttendeesTable th:first-child",
        placement: "top-start"
      },
      {
        title: taskShortLabelPlural,
        content: `Search for the ${taskShortLabelPlural} that apply to this engagement. You can search for ${taskShortLabelPlural} in any organization, including your organization and its sub-organizations. ${taskShortLabelPlural} are required.`,
        disableBeacon: true,
        target: "#fg-tasks",
        placement: "bottom-start"
      },
      {
        title: Settings.fields.report.keyOutcomes.label,
        content:
          "Use this section to tell readers what the main information or results from your engagement were. This will be displayed in your report's summary, so include information that you think would be valuable for leadership and other organizations to know.",
        disableBeacon: true,
        target: "#fg-keyOutcomes",
        placement: "bottom-start"
      },
      {
        title: Settings.fields.report.nextSteps.label,
        content:
          "Here, tell readers about the next concrete steps that you'll be taking to build on the progress made in your engagement. This will be displayed in your report's summary, so include information that will explain to leadership what you are doing next, as a result of your meeting's outcomes.",
        disableBeacon: true,
        target: "#fg-nextSteps",
        placement: "bottom-start"
      },
      {
        title: Settings.fields.report.reportText.label,
        content:
          "Record here discussion topics and notes that may be helpful to you, your organization, or leadership later on. This section does not display in the report summary.",
        disableBeacon: true,
        target: "#fg-reportText",
        placement: "bottom-start"
      },
      {
        title: "Sensitive information",
        content:
          "If there's sensitive information from your meeting that you'd like to include, click on the \"Add sensitive information\" button. You will have additional space to record sensitive information, visible only to the groups that you authorize. This section does not display in the report summary.",
        disableBeacon: true,
        target: "#toggleSensitiveInfo",
        placement: "left"
      },
      {
        title: "Save Report",
        content:
          "Pressing this button will save the report as a draft and take you to the preview page. You will have a chance to review your report before you send it for approval and then to the SFAC.",
        disableBeacon: true,
        target: "#formBottomSubmit",
        placement: "top-end"
      },
      {
        title: "Start this tour again",
        content: "Click this button to restart the tour.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
const orgTour = (currentUser, navigate) => {
  return {
    id: "org",
    steps: [
      {
        title: "Your organization's information",
        content:
          "This section shows your organization's superusers and sub-organizations. Keep in mind that superusers in a sub-organization can only update information for that sub-organization.",
        disableBeacon: true,
        target: "#info h4",
        placement: "bottom"
      },
      {
        title: "Navigating your organization's page",
        content:
          "When viewing your organization, you can quickly see and navigate to each section on this page using the sub-menu under your organization's name.",
        disableBeacon: true,
        target: "#myorg-nav",
        placement: "right"
      },
      {
        title: "Supported positions",
        content: `This section shows positions in your organization that currently have people assigned to them. The ${positionSingular} column tells you the name and ${positionCode} of the position. To update this information, click on the position and select the "Edit" option.`,
        disableBeacon: true,
        target: "#supportedPositions h4",
        placement: "bottom"
      },
      {
        title: "Vacant positions",
        content:
          "Here you'll find positions that don't have anyone assigned to them. To assign someone to the position, or to mark the position inactive, click on the position.",
        disableBeacon: true,
        target: "#vacantPositions h4",
        placement: "bottom"
      },
      {
        title: "Engagement planning approval process",
        content:
          'Set up or update the approval process for planning of future engagements authored in your organization by clicking "Edit" on the top of the page. We recommend having more than one approver in each step so that either person can approve the planning of the engagement. When a future engagement has gone through every step in your approval chain, it will automatically be published on ANET. You can add anyone in a position to your approval chain, they do not need to be a superuser. Keep in mind that you\'ll need to set up an approval chain for each sub-organization as well.',
        disableBeacon: true,
        target: "#planningApprovals h4",
        placement: "bottom"
      },
      {
        title: "Report publication approval process",
        content:
          "Set up or update the approval process for publication of reports authored in your organization by clicking \"Edit\" on the top of the page. We recommend having more than one approver in each step so that either person can approve the report. When a report has gone through every step in your approval chain, it will automatically go into that day's daily rollup. You can add anyone in a position to your approval chain, they do not need to be a superuser. Keep in mind that you'll need to set up an approval chain for each sub-organization as well.",
        disableBeacon: true,
        target: "#approvals h4",
        placement: "bottom"
      },
      {
        title: "Your organization's reports",
        content:
          "Here, you'll find the complete list of all reports authored by your members of your organization.",
        disableBeacon: true,
        target: "#reports h4",
        placement: "bottom"
      },
      {
        title: "Edit your organization",
        content:
          'If you need to make changes to any of the information we just went over, click the "Edit" button.',
        disableBeacon: true,
        target: "#editButton",
        placement: "left"
      },
      {
        title: "Take a guided tour",
        content: "Click on this button to take this page's tour again.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
const positionTour = (currentUser, navigate) => {
  return {
    id: "position",
    steps: [
      {
        title: "Positions",
        content: `This section allows you to quickly review this position's detailed information, such as the position's ${positionCode}, status, and organization.`,
        disableBeacon: true,
        target: "#info h4",
        placement: "bottom-start"
      },
      {
        title: "Type of user",
        content: `There are three types of users: user, superuser, and administrator. Superusers can give other positions either user or superuser privileges. Users are able to take basic actions, like submitting reports, using search, and reviewing the daily rollup. Superusers are able to edit positions, people, and ${taskShortLabelPlural} in their organization, as well as locations.`,
        disableBeacon: true,
        target: "#fg-type",
        placement: "bottom"
      },
      {
        title: "Active/inactive status",
        content:
          'Positions can be either active or inactive. Changing the status to "Inactive" means that your organization no longer supports that position / function. This is different than a vacant position, which is one that does not have a person assigned to it. Positions will move to the "Vacant" section of your organization\'s page automatically when no one is assigned to it.',
        disableBeacon: true,
        target: "#fg-status",
        placement: "bottom"
      },
      {
        title: "Current assigned person",
        content:
          'This section shows you who is currently assigned to this position. You can click the "Change assigned person" button to quickly change who is in this position.',
        disableBeacon: true,
        target: "#assigned-person h4",
        placement: "bottom"
      },
      {
        title: "Previous position holders",
        content:
          "The previous position holders section will show you other people who have previously held this position.",
        disableBeacon: true,
        target: "#previous-people h4",
        placement: "bottom"
      },
      {
        title: "Take a guided tour",
        content: "Click on this button to take this page's tour again.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
const personTour = (currentUser, navigate) => {
  return {
    id: "person",
    steps: [
      {
        title: "Information about this person",
        content: `You can review this person's basic information, including their contact information, and see if they are "Active". A superuser should change a person to "Inactive" when they are no longer in a job as a ${personSingular}. Setting them as inactive keeps them from being added to reports as attendees.`,
        disableBeacon: true,
        target: "#info h4",
        placement: "bottom"
      },
      {
        title: "Current assigned position",
        content:
          "This section tells you which position this person is currently in. If you need to remove them from this position, or assign them to a different position, you can do so from here.",
        disableBeacon: true,
        target: "#fg-position",
        placement: "bottom"
      },
      {
        title: "Authored reports",
        content:
          "If this person has authored any reports, you'll be able to see them displayed here.",
        disableBeacon: true,
        target: "#reports-authored h4",
        placement: "bottom"
      },
      {
        title: "Engagements attended by this person",
        content:
          "If this person has been mentioned as an attendee of reports, those reports will display here.",
        disableBeacon: true,
        target: "#reports-attended h4",
        placement: "bottom"
      },
      {
        title: "Take a guided tour",
        content: "Click on this button to take this page's tour again.",
        disableBeacon: true,
        target: ".persistent-tour-launcher",
        placement: "left"
      }
    ]
  }
}

export {
  userTour,
  superuserTour,
  reportTour,
  orgTour,
  positionTour,
  personTour
}
