/**
 * @typedef {import('@playwright/test').PlaywrightTestConfig} PlaywrightTestConfig
 */

import {createServer} from 'playwright-monaco'

/**
 * @type {PlaywrightTestConfig}
 */
const config = {
  use: {
    baseURL: await createServer({
      setup: './tests/setup.js',
      glass: './glass.worker.js'
    })
  }
}

export default config
