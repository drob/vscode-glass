import {configure} from '@glass-lang/monaco/glass.worker.js'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

configure({
  plugins: [remarkFrontmatter, remarkGfm]
})
