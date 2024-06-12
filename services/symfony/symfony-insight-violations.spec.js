import { testAuth } from '../test-helpers.js'
import SymfonyInsightViolations from './symfony-insight-violations.service.js'

describe('SymfonyInsightViolations', function () {
  describe('auth', function () {
    it('sends the auth information as configured', async function () {
      return testAuth(
        SymfonyInsightViolations,
        'BasicAuth',
        `<project><last-analysis>
          <status>finished</status>
        </last-analysis></project>`,
      )
    })
  })
})
