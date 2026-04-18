import { retiredService } from '../index.js'

export const Coincap = retiredService({
  category: 'other',
  route: {
    base: 'coincap',
    pattern: ':various+',
  },
  label: 'coincap',
  dateAdded: new Date('2025-05-11'),
})
