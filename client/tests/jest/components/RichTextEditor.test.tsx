import { act, fireEvent, render, screen } from "@testing-library/react"
import RichTextEditor from "components/RichTextEditor"
import React from "react"

jest.mock("components/editor/Toolbar", () => {
  const React = jest.requireActual("react")
  const { Transforms } = jest.requireActual("slate")
  const { useSlateStatic } = jest.requireActual("slate-react")
  return {
    __esModule: true,
    default: function MockToolbar() {
      const editor = useSlateStatic()
      return (
        <button onClick={() => Transforms.insertText(editor, "TRJU-1")}>
          Enter exercise
        </button>
      )
    }
  }
})
jest.mock("components/editor/LinkAnetEntity", () => () => null)
jest.mock("components/editor/LinkExternalHref", () => () => null)

describe("Rich-text persistence", () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("serializes the last edit before notifying the form of blur", async () => {
    const onChange = jest.fn()
    const onHandleBlur = jest.fn(() => {
      expect(onChange).toHaveBeenLastCalledWith("<p>TRJU-1</p>")
    })
    render(<RichTextEditor onChange={onChange} onHandleBlur={onHandleBlur} />)

    await act(async () => fireEvent.click(screen.getByText("Enter exercise")))
    expect(onChange).not.toHaveBeenCalled()
    const editable = screen.getByRole("textbox")
    // jsdom does not implement contenteditable focus semantics.
    Object.defineProperty(editable, "isContentEditable", { value: true })
    fireEvent.blur(editable)
    expect(onHandleBlur).toHaveBeenCalledTimes(1)
    act(() => jest.advanceTimersByTime(100))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("persists pending changes in two editors independently", async () => {
    const firstChange = jest.fn()
    const secondChange = jest.fn()
    render(
      <>
        <RichTextEditor onChange={firstChange} />
        <RichTextEditor onChange={secondChange} />
      </>
    )

    for (const button of screen.getAllByText("Enter exercise")) {
      await act(async () => fireEvent.click(button))
    }
    act(() => jest.advanceTimersByTime(100))
    expect(firstChange).toHaveBeenCalledWith("<p>TRJU-1</p>")
    expect(secondChange).toHaveBeenCalledWith("<p>TRJU-1</p>")
  })

  it("cancels pending callbacks when an editor is unmounted", async () => {
    const onChange = jest.fn()
    const { unmount } = render(<RichTextEditor onChange={onChange} />)
    await act(async () => fireEvent.click(screen.getByText("Enter exercise")))
    unmount()
    act(() => jest.advanceTimersByTime(100))
    expect(onChange).not.toHaveBeenCalled()
  })
})
