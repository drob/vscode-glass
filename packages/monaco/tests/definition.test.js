import {expect} from '@playwright/test'
import {test} from 'playwright-monaco'

test('ESM definition', async ({editor, page}) => {
  await editor.open('*.glass', {
    cwd: new URL('../../../fixtures/node16', import.meta.url)
  })
  await editor.setModel('file:///a.glass')
  await editor.setPosition({lineNumber: 2, column: 10})
  await editor.trigger('editor.action.peekDefinition')

  await expect(page.locator('.peekview-widget .ref-tree')).toHaveText(
    'function a() {}'
  )
})

test('JSX hover', async ({editor, page}) => {
  await editor.open('*.glass', {
    cwd: new URL('../../../fixtures/node16', import.meta.url)
  })
  await editor.setModel('file:///a.glass')
  await editor.setPosition({lineNumber: 12, column: 3})
  await editor.trigger('editor.action.peekDefinition')

  await expect(page.locator('.peekview-widget .ref-tree')).toHaveText(
    'function a() {}'
  )
})
