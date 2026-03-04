import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Form as FormBS, Modal } from "react-bootstrap"

type DiffLine = {
  type: "equal" | "add" | "remove"
  text: string
}

type DiffSide = "left" | "right"

type DiffModalProps = {
  show: boolean
  title?: string
  leftText?: string
  rightText?: string
  leftLabel?: string
  rightLabel?: string
  onClose: () => void
  onApply: (mergedValue: string) => void
}

function splitLines(text?: string) {
  if (!text) {
    return []
  }
  return text.split(/\r?\n/).filter(line => line.trim() !== "")
}

// Compute a line-by-line diff between `leftLines` (old) and `mergedLines` (new) using
// an LCS (Longest Common Subsequence) DP table, returning equal/add/remove operations.
function computeLineDiff(
  leftLines: string[],
  mergedLines: string[]
): DiffLine[] {
  const m = leftLines.length
  const n = mergedLines.length

  // dp[i][j] = LCS length of leftLines[i..] vs mergedLines[j..]
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  // Build LCS table bottom-up
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] =
        leftLines[i] === mergedLines[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const diff: DiffLine[] = []
  let i = 0
  let j = 0

  // Reconstruct edit operations guided by the dp table
  while (i < m || j < n) {
    if (i < m && j < n && leftLines[i] === mergedLines[j]) {
      diff.push({ type: "equal", text: leftLines[i] })
      i += 1
      j += 1
    } else if (j < n && (i === m || dp[i][j + 1] >= dp[i + 1][j])) {
      diff.push({ type: "add", text: mergedLines[j] })
      j += 1
    } else {
      diff.push({ type: "remove", text: leftLines[i] })
      i += 1
    }
  }

  return diff
}

export default function DiffModal({
  show,
  title,
  leftText,
  rightText,
  leftLabel,
  rightLabel,
  onClose,
  onApply
}: DiffModalProps) {
  const [choices, setChoices] = useState<Array<Array<DiffSide>>>([])
  const [previewOverride, setPreviewOverride] = useState("")
  const [previewDirty, setPreviewDirty] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const leftLines = useMemo(() => splitLines(leftText), [leftText])
  const rightLines = useMemo(() => splitLines(rightText), [rightText])
  const maxLines = Math.max(leftLines.length, rightLines.length)

  const mergeLine = useCallback(
    (lineChoices: Array<DiffSide>, leftLine: string, rightLine: string) => {
      if (lineChoices.length === 0) {
        return ""
      }
      const hasLeft = lineChoices.includes("left")
      const hasRight = lineChoices.includes("right")
      if (hasLeft && hasRight) {
        if (leftLine && rightLine) {
          return `${leftLine}\n${rightLine}`
        }
        return leftLine || rightLine
      }
      return hasLeft ? leftLine : rightLine
    },
    []
  )

  const buildMergedText = useCallback(
    (lineChoices: Array<Array<DiffSide>>) =>
      Array.from({ length: maxLines })
        .map((_, idx) =>
          mergeLine(
            lineChoices[idx] ?? [],
            leftLines[idx] ?? "",
            rightLines[idx] ?? ""
          )
        )
        .filter(line => line !== "")
        .join("\n"),
    [leftLines, maxLines, mergeLine, rightLines]
  )

  // Initialize choices + preview when the modal opens or inputs change.
  useEffect(() => {
    if (!show) {
      return
    }
    const nextChoices: Array<Array<DiffSide>> = new Array(maxLines)
      .fill(null)
      .map((_, idx) =>
        (leftLines[idx] ?? "") === (rightLines[idx] ?? "")
          ? ["left"]
          : ["right"]
      )
    setChoices(nextChoices)
    setPreviewOverride(buildMergedText(nextChoices))
    setPreviewDirty(false)
    setEditMode(false)
  }, [show, maxLines, leftLines, rightLines, buildMergedText])

  const mergedText = previewOverride

  // Sync preview from selections unless the user is editing it.
  useEffect(() => {
    if (!show) {
      return
    }
    if (!previewDirty) {
      setPreviewOverride(buildMergedText(choices))
    }
  }, [show, previewDirty, buildMergedText, choices])

  const previewDiffLines = useMemo(() => {
    if (!show) {
      return []
    }
    const mergedLines = mergedText ? mergedText.split(/\r?\n/) : []
    return computeLineDiff(leftLines, mergedLines)
  }, [show, leftLines, mergedText])

  const toggleChoice = useCallback((idx: number, choice: DiffSide) => {
    setChoices(prev => {
      const next = [...prev]
      const existing = next[idx] ?? []
      next[idx] = existing.includes(choice)
        ? existing.filter(item => item !== choice)
        : [...existing, choice]
      return next
    })
  }, [])

  const resetPreview = useCallback(() => {
    const nextChoices: Array<Array<DiffSide>> = new Array(maxLines)
      .fill(null)
      .map((_, idx) =>
        (leftLines[idx] ?? "") === (rightLines[idx] ?? "")
          ? ["left"]
          : ["right"]
      )
    setChoices(nextChoices)
    setPreviewOverride(buildMergedText(nextChoices))
    setPreviewDirty(false)
    setEditMode(false)
  }, [maxLines, leftLines, rightLines, buildMergedText])

  const diffButtonStyle = (selected: boolean): React.CSSProperties => ({
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: selected ? "#eef2ff" : "#f8fafc",
    border: selected ? "1px solid #1d4ed8" : "1px solid #e2e8f0",
    fontSize: 16,
    lineHeight: 1.6,
    cursor: "pointer"
  })
  const diffPlaceholderStyle: React.CSSProperties = {
    border: "1px solid transparent",
    background: "transparent"
  }
  const previewLineStyle = (type: DiffLine["type"]): React.CSSProperties => ({
    background:
      type === "add"
        ? "#dcfce7"
        : type === "remove"
          ? "#fee2e2"
          : "transparent",
    textDecoration: type === "remove" ? "line-through" : "none",
    fontSize: 16,
    lineHeight: 1.6
  })

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title ?? "Diff"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {maxLines === 0 ? (
          <div>No content available for comparison.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {(leftLabel || rightLabel) && (
              <div
                className="d-grid gap-2 text-uppercase text-muted"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div>{leftLabel}</div>
                <div>{rightLabel}</div>
              </div>
            )}
            {Array.from({ length: maxLines }).map((_, idx) => {
              const leftLine = leftLines[idx] ?? ""
              const rightLine = rightLines[idx] ?? ""
              const lineChoices = choices[idx] ?? []
              const hasLeft = Boolean(leftLine)
              const hasRight = Boolean(rightLine)
              return (
                <div
                  key={`diff-line-${idx}`}
                  className="d-grid gap-2 align-items-stretch"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div>
                    {hasLeft ? (
                      <button
                        type="button"
                        className="w-100 h-100 text-start d-block rounded-3 p-2"
                        style={diffButtonStyle(lineChoices.includes("left"))}
                        onClick={() => toggleChoice(idx, "left")}
                      >
                        {leftLine}
                      </button>
                    ) : (
                      <div
                        className="w-100 h-100 rounded-3 p-2"
                        style={diffPlaceholderStyle}
                      />
                    )}
                  </div>
                  <div>
                    {hasRight ? (
                      <button
                        type="button"
                        className="w-100 h-100 text-start d-block rounded-3 p-2"
                        style={diffButtonStyle(lineChoices.includes("right"))}
                        onClick={() => toggleChoice(idx, "right")}
                      >
                        {rightLine}
                      </button>
                    ) : (
                      <div
                        className="w-100 h-100 rounded-3 p-2"
                        style={diffPlaceholderStyle}
                      />
                    )}
                  </div>
                </div>
              )
            })}
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <div className="text-muted text-uppercase">Merged preview</div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setEditMode(prev => !prev)}
                >
                  {editMode ? "Preview" : "Edit"}
                </Button>
              </div>
              {editMode ? (
                <FormBS.Control
                  as="textarea"
                  rows={6}
                  className="mt-2 rounded-3 p-3 lh-base"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0"
                  }}
                  value={previewOverride || ""}
                  onChange={event => {
                    setPreviewOverride(event.target.value)
                    setPreviewDirty(true)
                  }}
                />
              ) : (
                <div className="d-flex flex-column gap-1 mt-2">
                  {previewDiffLines
                    .filter(line => line.text)
                    .map((line, lineIdx) => (
                      <div
                        key={`diff-preview-${lineIdx}`}
                        className="px-2 py-1 rounded"
                        style={previewLineStyle(line.type)}
                      >
                        {line.text}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={resetPreview}>
          Reset
        </Button>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onApply(mergedText)}>
            Apply to ANET
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
