import { TextStyleProperties, TextStyleSpan } from '../types';
import { DEFAULT_TEXT_STYLE } from './kashmiriData';

export interface RenderedTextSlice {
  text: string;
  start: number;
  end: number;
  style: TextStyleProperties;
  isSelected?: boolean;
  hasCaretAtStart?: boolean;
  hasCaretAtEnd?: boolean;
}

/**
 * Merges default styles with applicable span styles at any character index,
 * producing flattened rendered slices of clean Unicode text.
 * When selection or cursorPos is provided, splits at boundaries and flags selected slices or caret positions.
 */
export function buildRenderedSlices(
  content: string,
  spans: TextStyleSpan[],
  defaultStyle: TextStyleProperties = DEFAULT_TEXT_STYLE,
  selection?: { start: number; end: number },
  cursorPos?: number
): RenderedTextSlice[] {
  if (!content) return [];

  const hasSelection = selection && selection.start !== selection.end && selection.start < selection.end;
  const selStart = hasSelection ? Math.max(0, Math.min(content.length, selection.start)) : 0;
  const selEnd = hasSelection ? Math.max(0, Math.min(content.length, selection.end)) : 0;
  const validCursor = !hasSelection && cursorPos !== undefined && cursorPos >= 0 && cursorPos <= content.length ? cursorPos : -1;

  // Find all unique split points within bounds
  const points = new Set<number>([0, content.length]);

  if (hasSelection) {
    points.add(selStart);
    points.add(selEnd);
  }

  if (validCursor !== -1) {
    points.add(validCursor);
  }

  if (spans && spans.length > 0) {
    for (const span of spans) {
      if (span.start >= 0 && span.start <= content.length) points.add(span.start);
      if (span.end >= 0 && span.end <= content.length) points.add(span.end);
    }
  }

  const sortedPoints = Array.from(points).sort((a, b) => a - b);
  const slices: RenderedTextSlice[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start === end) continue;

    const sliceText = content.slice(start, end);
    // Combine styles from all overlapping spans in order
    let combinedStyle: TextStyleProperties = { ...defaultStyle };

    if (spans && spans.length > 0) {
      for (const span of spans) {
        if (span.start < end && span.end > start) {
          combinedStyle = {
            ...combinedStyle,
            ...span.style,
          };
        }
      }
    }

    const isSelected = hasSelection && start >= selStart && end <= selEnd;
    const hasCaretAtStart = !hasSelection && validCursor === start && start !== content.length;
    const hasCaretAtEnd = !hasSelection && validCursor === end && end === content.length;

    slices.push({
      text: sliceText,
      start,
      end,
      style: combinedStyle,
      isSelected,
      hasCaretAtStart,
      hasCaretAtEnd,
    });
  }

  return slices;
}

/**
 * Gets the effective formatting style at a given selection or cursor position.
 */
export function getEffectiveStyleAtRange(
  contentLength: number,
  spans: TextStyleSpan[],
  defaultStyle: TextStyleProperties,
  rangeStart: number,
  rangeEnd: number
): TextStyleProperties {
  let effective: TextStyleProperties = { ...defaultStyle };
  const targetStart = rangeStart === rangeEnd ? Math.max(0, rangeStart - 1) : rangeStart;
  const targetEnd = rangeStart === rangeEnd ? rangeStart : rangeEnd;

  if (spans && spans.length > 0) {
    for (const span of spans) {
      if (span.start < targetEnd && span.end > targetStart) {
        effective = {
          ...effective,
          ...span.style,
        };
      }
    }
  }
  return effective;
}

/**
 * Applies a partial style change to the EXACT arbitrary character range [start, end].
 * Non-destructive: splits existing spans cleanly and applies property without modifying unmodified areas.
 */
export function applyStyleToRange(
  contentLength: number,
  existingSpans: TextStyleSpan[],
  rangeStart: number,
  rangeEnd: number,
  styleDiff: Partial<TextStyleProperties>
): TextStyleSpan[] {
  if (rangeStart >= rangeEnd || rangeStart < 0 || rangeEnd > contentLength) {
    return existingSpans;
  }

  const newSpan: TextStyleSpan = {
    id: `span-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    start: rangeStart,
    end: rangeEnd,
    style: styleDiff,
  };

  const resultingSpans: TextStyleSpan[] = [];

  for (const span of existingSpans) {
    // 1. Completely before or completely after
    if (span.end <= rangeStart || span.start >= rangeEnd) {
      resultingSpans.push(span);
      continue;
    }

    // 2. Completely enclosed by new span
    if (span.start >= rangeStart && span.end <= rangeEnd) {
      // Retain unaffected properties
      const remainingStyle = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingStyle[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingStyle).length > 0) {
        resultingSpans.push({
          ...span,
          style: remainingStyle,
        });
      }
      continue;
    }

    // 3. Spans that overlap start or end
    if (span.start < rangeStart && span.end > rangeEnd) {
      // Split into 3 parts: left, middle, right
      resultingSpans.push({
        ...span,
        id: `${span.id}-left`,
        end: rangeStart,
      });

      const remainingMiddle = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingMiddle[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingMiddle).length > 0) {
        resultingSpans.push({
          id: `${span.id}-mid`,
          start: rangeStart,
          end: rangeEnd,
          style: remainingMiddle,
        });
      }

      resultingSpans.push({
        ...span,
        id: `${span.id}-right`,
        start: rangeEnd,
      });
      continue;
    }

    if (span.start < rangeStart && span.end > rangeStart) {
      // Overlaps left boundary
      resultingSpans.push({
        ...span,
        end: rangeStart,
      });
      const remainingOverlap = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingOverlap[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingOverlap).length > 0) {
        resultingSpans.push({
          id: `${span.id}-ovl`,
          start: rangeStart,
          end: span.end,
          style: remainingOverlap,
        });
      }
      continue;
    }

    if (span.start < rangeEnd && span.end > rangeEnd) {
      // Overlaps right boundary
      const remainingOverlap = { ...span.style };
      for (const key of Object.keys(styleDiff)) {
        delete remainingOverlap[key as keyof TextStyleProperties];
      }
      if (Object.keys(remainingOverlap).length > 0) {
        resultingSpans.push({
          id: `${span.id}-ovr`,
          start: span.start,
          end: rangeEnd,
          style: remainingOverlap,
        });
      }
      resultingSpans.push({
        ...span,
        start: rangeEnd,
      });
      continue;
    }
  }

  resultingSpans.push(newSpan);
  return resultingSpans;
}

/**
 * Clears all custom formatting within the exact range [start, end].
 */
export function clearFormattingInRange(
  contentLength: number,
  existingSpans: TextStyleSpan[],
  rangeStart: number,
  rangeEnd: number
): TextStyleSpan[] {
  if (rangeStart >= rangeEnd || rangeStart < 0 || rangeEnd > contentLength) {
    return existingSpans;
  }

  const resultingSpans: TextStyleSpan[] = [];

  for (const span of existingSpans) {
    if (span.end <= rangeStart || span.start >= rangeEnd) {
      resultingSpans.push(span);
    } else if (span.start < rangeStart && span.end > rangeEnd) {
      resultingSpans.push({
        ...span,
        id: `${span.id}-l`,
        end: rangeStart,
      });
      resultingSpans.push({
        ...span,
        id: `${span.id}-r`,
        start: rangeEnd,
      });
    } else if (span.start < rangeStart && span.end > rangeStart) {
      resultingSpans.push({
        ...span,
        end: rangeStart,
      });
    } else if (span.start < rangeEnd && span.end > rangeEnd) {
      resultingSpans.push({
        ...span,
        start: rangeEnd,
      });
    }
    // Completely enclosed spans are discarded
  }

  return resultingSpans;
}

/**
 * Adjusts span indices when text is inserted or deleted at index `changePos`.
 */
export function shiftSpansOnTextChange(
  spans: TextStyleSpan[],
  changePos: number,
  deltaLength: number // positive for insert, negative for delete
): TextStyleSpan[] {
  if (deltaLength === 0 || !spans) return spans || [];

  const updated: TextStyleSpan[] = [];

  for (const span of spans) {
    if (deltaLength > 0) {
      // Insertion
      if (span.start >= changePos) {
        updated.push({
          ...span,
          start: span.start + deltaLength,
          end: span.end + deltaLength,
        });
      } else if (span.end > changePos) {
        updated.push({
          ...span,
          end: span.end + deltaLength,
        });
      } else {
        updated.push(span);
      }
    } else {
      // Deletion (deltaLength is negative)
      const deleteEnd = changePos - deltaLength;
      if (span.end <= changePos) {
        updated.push(span);
      } else if (span.start >= deleteEnd) {
        updated.push({
          ...span,
          start: span.start + deltaLength,
          end: span.end + deltaLength,
        });
      } else {
        // Partially deleted
        const newStart = Math.min(span.start, changePos);
        const newEnd = Math.max(newStart, span.end + deltaLength);
        if (newEnd > newStart) {
          updated.push({
            ...span,
            start: newStart,
            end: newEnd,
          });
        }
      }
    }
  }

  return updated;
}
