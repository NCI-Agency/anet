import { expect } from "@playwright/test"
import ShowOrganization from "../pages/showOrganization.page.js"
import { test } from "../support.js"

test.describe("Organization assessment save synchronization", () => {
  for (const existingAssessment of [false, true]) {
    test(`Should wait for all answers after ${existingAssessment ? "editing with an unchanged priority" : "creating an assessment"}`, async ({
      page
    }) => {
      const expectedDetails = [
        "T2",
        "Improve",
        "Improve relationship",
        "TRJU-1 TRJU-2"
      ]
      // Exercise the page object without a server: modal closure precedes the
      // refetch, and the first answer can already match the expected value.
      await page.setContent(`
        <div id="entity-assessments-results-organizationAnnually-annually">
          <table class="assessments-table"><tbody><tr><td></td><td>
            <div class="card"><div class="card-body"></div></div>
          </td></tr></tbody></table>
        </div>
        <div class="modal-content"><form>
          <button type="button">Save</button>
        </form></div>
      `)
      await page.evaluate(
        ({ existingAssessment, expectedDetails }) => {
          const body = document.querySelector(".card-body")
          const render = details => {
            body.replaceChildren(
              ...details.map(text => {
                const field = document.createElement("div")
                field.className = "form-control-plaintext"
                field.textContent = text
                return field
              })
            )
          }
          if (existingAssessment) {
            render(["T2", "No statement", "Develop relationship", "TRJU-1"])
          }
          document.querySelector("button").addEventListener("click", () => {
            document.querySelector(".modal-content").remove()
            // Even a partially rendered set must not satisfy the save wait.
            setTimeout(() => render(expectedDetails.slice(0, 1)), 200)
            setTimeout(() => render(expectedDetails), 800)
          })
        },
        { existingAssessment, expectedDetails }
      )

      await ShowOrganization.saveAssessmentAndWaitForModalClose(
        "organizationAnnually",
        "annually",
        expectedDetails
      )

      // A one-shot read verifies the helper itself waited, not this assertion.
      expect(
        await (
          await ShowOrganization.getShownAssessmentDetails(
            "organizationAnnually",
            "annually"
          )
        ).allTextContents()
      ).toEqual(expectedDetails)
    })
  }
})
