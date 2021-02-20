/**
 * Remove a given element from a given array
 * @param {Array<?>} array
 * @param {?} element
 */
export function arrayRemove(array, element) {
  let index = array.indexOf(element);
  if (index > -1) {
    return array.splice(index, 1);
  }
}

/**
 * Map a given value from a given range into another
 *
 * @export
 * @param {?} value value to map
 * @param {Array<?>} from [range_start, range_end]
 * @param {Array<?>} to [range_start, range_end]
 * @returns the mapped value
 */
export function mapRange(value, from, to) {
  return to[0] + ((value - from[0]) * (to[1] - to[0])) / (from[1] - from[0]);
}

/**
 * Clamp a value between a range
 *
 * @export
 * @param {?} value the value to clamp
 * @param {?} min the minimum to clamp to
 * @param {?} max the maximum to clamp to
 * @returns the clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
