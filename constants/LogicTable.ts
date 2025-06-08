/**
 * Creates a 2D array (or matrix) of the given size filled with `false` values.
 * @param {number} size - The size of the matrix.
 * @returns {boolean[][]} A 2D array filled with `false` values.
 */
export default (size: number): boolean[][] => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
};