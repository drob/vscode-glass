/**
 * Remove the `.jsx` postfix from a file name ending with `.glass.jsx`.
 *
 * @param {string} fileName
 *   The file name to process.
 * @returns {string}
 *   The filename without the `.jsx` postfix if it ends with `.glass.jsx`.
 */
export function fakeMdxPath(fileName) {
  const postfix = '.jsx'

  if (fileName.endsWith(`.glass${postfix}`)) {
    return fileName.slice(0, -postfix.length)
  }

  return fileName
}
