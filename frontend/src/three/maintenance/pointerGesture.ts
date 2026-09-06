/**
 * Shared pointer helpers: drag-vs-click and pointer cursor hygiene.
 */

import { CLICK_DRAG_THRESHOLD_PX } from "./inspectionClick";

let downX = 0;
let downY = 0;
let moved = false;

export function notePointerDown(clientX: number, clientY: number) {
  downX = clientX;
  downY = clientY;
  moved = false;
}

export function notePointerMove(clientX: number, clientY: number) {
  if (
    Math.hypot(clientX - downX, clientY - downY) >= CLICK_DRAG_THRESHOLD_PX
  ) {
    moved = true;
  }
}

export function wasDragGesture(): boolean {
  return moved;
}

export function resetPointerGesture() {
  moved = false;
}

/** True if this pointer-up should count as a click (not a drag). */
export function acceptAsClick(clientX?: number, clientY?: number): boolean {
  if (clientX != null && clientY != null) {
    notePointerMove(clientX, clientY);
  }
  const drag = moved;
  resetPointerGesture();
  return !drag;
}
