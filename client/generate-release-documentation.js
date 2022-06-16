require("dotenv").config()
const { Octokit } = require("@octokit/core")
const ado = require("azure-devops-node-api")

// Should we include details of each PR/issue/work item?
const showDetails = process.argv[process.argv.length - 2] === "-D"

// Which release to generate documentation for
const releaseTag = process.argv[process.argv.length - 1]

// GitHub settings
const ghOwner = "NCI-Agency"
const ghRepo = "anet"
// Create a Personal Access Token at https://github.com/settings/tokens with permission repo: status
const ghAuthToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN

// Azure DevOps settings
const adoOrg = "ncia-anet"
const adoProject = "ANET"
const adoOrgUrl = `https://dev.azure.com/${adoOrg}`
// Create a Personal Access Token at `${adoOrgUrl}/_usersSettings/tokens` with permission Work Items: Read
// or pass System.AccessToken in the AZURE_PERSONAL_ACCESS_TOKEN environment variable (e.g. in a pipeline)
const adoAuthToken = process.env.AZURE_PERSONAL_ACCESS_TOKEN

// API handling for GitHub with https://github.com/octokit/core.js
const octokit = new Octokit({ auth: ghAuthToken })

// API handling for Azure DevOps with https://github.com/microsoft/azure-devops-node-api
const adoAuthHandler = ado.getHandlerFromToken(adoAuthToken)
const adoConnection = new ado.WebApi(adoOrgUrl, adoAuthHandler)
const adoWitApi = adoConnection.getWorkItemTrackingApi()

// Regexps to match PR's, issues and work items
const ghPrRef = /\(#(\d+)\)/g
const ghIssueRef = new RegExp(`(?<= |${ghOwner}/${ghRepo})#(\\d+)\\b`, "g")
const adoWorkItemRef = /\[AB#(\d+)\]/g

function getGitHubRelease(ghReleaseTag) {
  return octokit.request("GET /repos/{owner}/{repo}/releases/tags/{tag}", {
    owner: ghOwner,
    repo: ghRepo,
    tag: ghReleaseTag
  })
}

function getGitHubPullRequest(ghPrNumber) {
  return octokit.request("GET /repos/{owner}/{repo}/pulls/{prNumber}", {
    owner: ghOwner,
    repo: ghRepo,
    prNumber: ghPrNumber
  })
}

function getGitHubIssue(ghIssueNumber) {
  return octokit.request("GET /repos/{owner}/{repo}/issues/{issueNumber}", {
    owner: ghOwner,
    repo: ghRepo,
    issueNumber: ghIssueNumber
  })
}

function getAzureDevOpsWorkItem(adoWorkItemNumber) {
  return adoWitApi.then(api =>
    api.getWorkItem(
      adoWorkItemNumber,
      ["System.Title", "System.Description"],
      null,
      null,
      adoProject
    )
  )
}

function logError(message, error) {
  console.error(
    message,
    error.response.url,
    error.response.status,
    error.response.data.message
  )
}

async function generateReleaseDocumentation(releaseTag) {
  // Fetch release
  const release = await getGitHubRelease(releaseTag).catch(error =>
    logError("GitHub release tag not found:", error)
  )
  const releaseBody = release?.data?.body || ""

  // Parse release body for pull requests
  const ghPrList = [] // array to keep them in order of appearance
  for (const match of releaseBody.matchAll(ghPrRef)) {
    // avoid duplicates
    if (!ghPrList.includes(match[1])) {
      ghPrList.push(match[1])
    }
  }

  // Fetch pull requests
  const prPromises = [] // collect all promises so we can resolve them later on
  const ghPrDocs = {}
  const ghIssueList = [] // array to keep them in order of appearance
  const adoWorkItemList = [] // array to keep them in order of appearance
  ghPrList.forEach(ghPrNumber => {
    prPromises.push(
      getGitHubPullRequest(ghPrNumber)
        .then(ghPr => {
          // Store PR title and body
          const ghPrBody = ghPr.data.body || "no description"
          ghPrDocs[ghPrNumber] = {
            title: ghPr.data.title,
            body: ghPrBody
          }

          // Parse PR body for GitHub issues
          for (const match of ghPrBody.matchAll(ghIssueRef)) {
            // avoid duplicates
            if (!ghIssueList.push(match[1])) {
              ghIssueList.push(match[1])
            }
          }

          // Parse PR body for references to Azure DevOps work items
          for (const match of ghPrBody.matchAll(adoWorkItemRef)) {
            // avoid duplicates
            if (!adoWorkItemList.push(match[1])) {
              adoWorkItemList.push(match[1])
            }
          }
        })
        .catch(error => logError("GitHub pull request not found:", error))
    )
  })

  // Fetch issues
  const issuePromises = [] // collect all promises so we can resolve them later on
  const ghIssueDocs = {}
  const adoWorkItemDocs = {}
  await Promise.all(prPromises).then(() => {
    // Fetch GitHub issues
    ghIssueList.forEach(ghIssueNumber => {
      issuePromises.push(
        getGitHubIssue(ghIssueNumber)
          .then(ghIssue => {
            ghIssueDocs[ghIssueNumber] = {
              title: ghIssue.data.title,
              body: ghIssue.data.body || "no description"
            }
          })
          .catch(error => logError("GitHub issue not found:", error))
      )
    })

    // Fetch Azure DevOps issues
    adoWorkItemList.forEach(adoWorkItemNumber => {
      issuePromises.push(
        getAzureDevOpsWorkItem(adoWorkItemNumber)
          .then(adoWorkItem => {
            adoWorkItemDocs[adoWorkItemNumber] = {
              title: adoWorkItem.fields["System.Title"],
              body: adoWorkItem.fields["System.Description"] || "no description"
            }
          })
          .catch(error => logError("Azure DevOps work item not found:", error))
      )
    })
  })

  // Combine into release documentation
  const detailsSection = showDetails ? "\n## " : "- "
  return await Promise.all(issuePromises).then(() => {
    // Add release description
    let docs = `# Release Documentation for ${releaseTag}\n\n${releaseBody}\n`

    // Add all PR descriptions
    docs += "\n\n# Pull requests in this release\n\n"
    if (!ghPrList.length) {
      docs += "None\n"
    } else {
      ghPrList.forEach(ghPrNumber => {
        const { title, body } = ghPrDocs[ghPrNumber]
        docs += `${detailsSection}PR ${ghPrNumber} ${title}\n`
        if (showDetails) {
          docs += `${body}\n`
        }
      })
    }

    // Add all GitHub issue descriptions
    docs += "\n\n# GitHub issues in this release\n\n"
    if (!ghIssueList.length) {
      docs += "None\n"
    } else {
      ghIssueList.forEach(ghIssueNumber => {
        const { title, body } = ghIssueDocs[ghIssueNumber]
        docs += `${detailsSection}GitHub issue ${ghIssueNumber} ${title}\n`
        if (showDetails) {
          docs += `${body}\n`
        }
      })
    }

    // Add all Azure DevOps work item descriptions
    docs += "\n\n# AzureDevOps work items in this release\n\n"
    if (!adoWorkItemList.length) {
      docs += "None\n"
    } else {
      adoWorkItemList.forEach(adoWorkItemNumber => {
        const { title, body } = adoWorkItemDocs[adoWorkItemNumber]
        docs += `${detailsSection}Azure DevOps work item ${adoWorkItemNumber} ${title}\n`
        if (showDetails) {
          docs += `${body}\n`
        }
      })
    }

    return docs
  })
}

generateReleaseDocumentation(releaseTag).then(docs => console.log(docs))
