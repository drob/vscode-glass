import {expect} from '@playwright/test'
import {test} from 'playwright-monaco'

test('syntax errors', async ({editor}) => {
  const result = await editor.waitForMarkers('file:///a.glass', async () => {
    await editor.createModel('<\n', 'file:///a.glass')
  })
  expect(result).toStrictEqual([
    {
      code: 'Glass',
      endColumn: 1,
      endLineNumber: 2,
      message:
        'Unexpected end of file before name, expected a character that can start a name, such as a letter, `$`, or `_`',
      owner: 'glass',
      relatedInformation: [],
      resource: 'file:///a.glass',
      severity: 8,
      source: undefined,
      startColumn: 2,
      startLineNumber: 1,
      tags: []
    }
  ])
})
