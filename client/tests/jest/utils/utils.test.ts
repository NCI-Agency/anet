import { expect } from "chai"
import utils from "../../../src/utils"

const MAXLENGTH = 40

describe("When elipsizing a string", () => {
  it("We should make sure a MAXLENGTH string will be fully included", () => {
    expect(
      utils.ellipsizeOnWords(
        "This intent is exact 40 characters long.",
        MAXLENGTH
      )
    ).to.equal("This intent is exact 40 characters long.")
  })
  it("We should make sure a string over MAXLENGTH will be cut out on the word before reaching the limit", () => {
    expect(
      utils.ellipsizeOnWords(
        "This one is just a tad bit longer than the max characters limit.",
        MAXLENGTH
      )
    ).to.equal("This one is just a tad bit longer than…")
  })
  it("We should make sure shorter strings will be kept entirely", () => {
    expect(
      utils.ellipsizeOnWords("And this one is very short.", MAXLENGTH)
    ).to.equal("And this one is very short.")
  })
  it("We should make sure using paranthesis in the middle of two words makes it count as one word", () => {
    expect(
      utils.ellipsizeOnWords(
        "This one makes makes use of parenthesis(like such).",
        MAXLENGTH
      )
    ).to.equal("This one makes makes use of…")
  })
  it("We should make sure using a slash in the middle of two words makes it count as one word", () => {
    expect(
      utils.ellipsizeOnWords(
        "It should also work for hyphen, so like/this.",
        MAXLENGTH
      )
    ).to.equal("It should also work for hyphen, so…")
  })
  it("We should make sure using a dash in the middle of two words makes it count as one word", () => {
    expect(
      utils.ellipsizeOnWords(
        "This one makes use of hyphen words like-this.",
        MAXLENGTH
      )
    ).to.equal("This one makes use of hyphen words…")
  })
  it("We should make sure that having many periods will not change the behavior", () => {
    expect(
      utils.ellipsizeOnWords("This one. Has two phrases.", MAXLENGTH)
    ).to.equal("This one. Has two phrases.")
  })
  it("We should make sure that strings that have only one word, get capped at the MAXLENGTH", () => {
    expect(
      utils.ellipsizeOnWords(
        "Thisisaaveryaveyveryverylongwordwithoutanyspaces",
        MAXLENGTH
      )
    ).to.equal("Thisisaaveryaveyveryverylongwordwithouta…")
  })
  it("We should make sure that strings with multiple spaces in a row, remove the extra spaces", () => {
    expect(
      utils.ellipsizeOnWords(
        " Now this one    has some extra      spaces.",
        MAXLENGTH
      )
    ).to.equal("Now this one has some extra spaces.")
  })
  it("We should make sure alternative spacing characters are all treated equally", () => {
    expect(
      utils.ellipsizeOnWords(
        "This phrase\tuses\ralternative space\ncharacters.",
        MAXLENGTH
      )
    ).to.equal("This phrase uses alternative space…")
  })
  it("We should make sure empty strings to return empty strings", () => {
    expect(utils.ellipsizeOnWords("", MAXLENGTH)).to.equal("")
  })
  it("We should make sure null values also return null", () => {
    expect(utils.ellipsizeOnWords(null, MAXLENGTH)).to.equal(null)
  })
})
