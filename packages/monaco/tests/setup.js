import {initializeMonacoMdx} from '@glass-lang/monaco'
import {monaco} from 'playwright-monaco'

monaco.languages.register({
  id: 'glass',
  extensions: ['.glass']
})

initializeMonacoMdx(monaco)
