import { retiredService } from '../index.js'

export const HackageDeps = retiredService({
  category: 'dependencies',
  route: {
    base: 'hackage-deps/v',
    pattern: ':packageName',
  },
  label: 'hackagedeps',
  dateAdded: new Date('2024-10-18'),
})
