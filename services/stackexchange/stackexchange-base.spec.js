import Joi from 'joi'
import { expect } from 'chai'
import nock from 'nock'
import { pathParams } from '../index.js'
import { cleanUpNockAfterEach, defaultContext } from '../test-helpers.js'
import { StackExchangeBase } from './stackexchange-base.js'
import StackExchangeMonthlyQuestions from './stackexchange-monthlyquestions.service.js'
import StackExchangeReputation from './stackexchange-reputation.service.js'
import StackExchangeQuestions from './stackexchange-taginfo.service.js'

class DummyStackExchangeService extends StackExchangeBase {
  static route = { base: 'fake-base' }

  static openApi = {
    '/fake-base': {
      get: {
        parameters: pathParams({
          name: 'fakeparam',
          example: 'fakeparam',
        }),
      },
    },
  }

  async handle() {
    const data = await this.fetch({
      schema: Joi.any(),
      url: 'https://api.stackexchange.com/2.2/tags/python/info',
    })
    return { message: data.message }
  }
}

// format is [class, example response from server]
const testClasses = [
  [DummyStackExchangeService, { message: 'fake message' }],
  [StackExchangeMonthlyQuestions, { total: 8 }],
  [StackExchangeReputation, { items: [{ reputation: 8 }] }],
  [StackExchangeQuestions, { items: [{ count: 8 }] }],
]

for (const [serviceClass, dummyResponse] of testClasses) {
  testAuth(serviceClass, dummyResponse)
}

function testAuth(serviceClass, dummyResponse) {
  describe(serviceClass.name, function () {
    describe('auth', function () {
      cleanUpNockAfterEach()

      const config = { private: { stackapps_api_key: 'fake-key' } }
      const firstOpenapiPath = Object.keys(serviceClass.openApi)[0]
      const exampleInvokeParams = serviceClass.openApi[
        firstOpenapiPath
      ].get.parameters.reduce((acc, obj) => {
        acc[obj.name] = obj.example
        return acc
      }, {})

      it('sends the auth information as configured', async function () {
        const scope = nock('https://api.stackexchange.com')
          .get(/.*/)
          .query(queryObject => queryObject.key === 'fake-key')
          .reply(200, dummyResponse)
        expect(
          await serviceClass.invoke(
            defaultContext,
            config,
            exampleInvokeParams,
          ),
        ).to.not.have.property('isError')

        scope.done()
      })
    })
  })
}
