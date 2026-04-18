import { retiredService } from '../index.js'

export const PubPopularity = retiredService({
  category: 'rating',
  route: {
    base: 'pub/popularity',
    pattern: ':packageName',
  },
  label: 'pubpopularity',
  dateAdded: new Date('2025-05-11'),
})
