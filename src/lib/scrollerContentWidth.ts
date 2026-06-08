/** Usable horizontal space for scroll children (client area minus padding). */
export function getScrollerContentWidth(scroller: HTMLElement): number {
  const style = window.getComputedStyle(scroller);
  const pad =
    (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  return Math.max(0, Math.floor(scroller.clientWidth - pad));
}
