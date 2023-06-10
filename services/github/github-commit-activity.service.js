import gql from 'graphql-tag'
import Joi from 'joi'
import parseLinkHeader from 'parse-link-header'
import { InvalidResponse } from '../index.js'
import { metric } from '../text-formatters.js'
import { nonNegativeInteger } from '../validators.js'
import { GithubAuthV4Service } from './github-auth-service.js'
import {
  transformErrors,
  documentation,
  errorMessagesFor,
} from './github-helpers.js'

const schema = Joi.object({
  data: Joi.object({
    repository: Joi.object({
      object: Joi.object({
        history: Joi.object({
          totalCount: nonNegativeInteger,
        }).required(),
      }),
    }).required(),
  }).required(),
}).required()

const queryParamSchema = Joi.object({
  authorFilter: Joi.string(),
})

export default class GitHubCommitActivity extends GithubAuthV4Service {
  static category = 'activity'
  static route = {
    base: 'github/commit-activity',
    pattern: ':interval(t|y|m|4w|w)/:user/:repo/:branch*',
    queryParamSchema,
  }

  static examples = [
    {
      title: 'GitHub commit activity',
      // Override the pattern to omit the deprecated interval "4w".
      pattern: ':interval(t|y|m|w)/:user/:repo',
      namedParams: { interval: 'm', user: 'eslint', repo: 'eslint' },
      queryParams: { authorFilter: 'chris48s' },
      staticPreview: this.render({ interval: 'm', commitCount: 457 }),
      keywords: ['commits'],
      documentation,
    },
    {
      title: 'GitHub commit activity (branch)',
      // Override the pattern to omit the deprecated interval "4w".
      pattern: ':interval(t|y|m|w)/:user/:repo/:branch*',
      namedParams: {
        interval: 'm',
        user: 'badges',
        repo: 'squint',
        branch: 'main',
      },
      queryParams: { authorFilter: 'jnullj' },
      staticPreview: this.render({ interval: 'm', commitCount: 5 }),
      keywords: ['commits'],
      documentation,
    },
  ]

  static defaultBadgeData = { label: 'commit activity', color: 'blue' }

  static render({ interval, commitCount, authorFilter }) {
    // If total commits selected change label from commit activity to commits
    const label = interval === 't' ? 'commits' : this.defaultBadgeData.label
    const authorFilterLabel = authorFilter ? ` by ${authorFilter}` : ``

    const intervalLabel = {
      t: '',
      y: '/year',
      m: '/month',
      '4w': '/four weeks',
      w: '/week',
    }[interval]

    return {
      label: `${label}${authorFilterLabel}`,
      message: `${metric(commitCount)}${intervalLabel}`,
    }
  }

  async fetch({ interval, user, repo, branch = 'HEAD' }) {
    const since = this.constructor.getIntervalQueryStartDate({ interval })
    return this._requestGraphql({
      query: gql`
        query (
          $user: String!
          $repo: String!
          $branch: String!
          $since: GitTimestamp
        ) {
          repository(owner: $user, name: $repo) {
            object(expression: $branch) {
              ... on Commit {
                history(since: $since) {
                  totalCount
                }
              }
            }
          }
        }
      `,
      variables: {
        user,
        repo,
        branch,
        since,
      },
      schema,
      transformErrors,
    })
  }

  async fetchAuthorFilter({
    interval,
    user,
    repo,
    branch = 'HEAD',
    authorFilter,
  }) {
    const since =
      this.constructor.getIntervalQueryStartDate({ interval }) || undefined

    return this._request({
      url: `/repos/${user}/${repo}/commits`,
      options: {
        searchParams: {
          sha: branch,
          author: authorFilter,
          per_page: '1',
          since: since,
        },
      },
      errorMessages: errorMessagesFor('repo not found'),
    })
  }

  static transform({ data }) {
    const {
      repository: { object: repo },
    } = data

    if (!repo) {
      throw new InvalidResponse({ prettyMessage: 'invalid branch' })
    }

    return repo.history.totalCount
  }

  static transformAuthorFilter({ res, buffer }) {
    if (buffer.message === 'Not Found') {
      throw new InvalidResponse({ prettyMessage: 'invalid branch' })
    }

    const parsed = parseLinkHeader(res.headers.link)

    if (!parsed) {
      return 0
    }

    return parsed.last.page
  }

  static getIntervalQueryStartDate({ interval }) {
    const now = new Date()

    if (interval === 't') {
      return null
    } else if (interval === 'y') {
      now.setUTCFullYear(now.getUTCFullYear() - 1)
    } else if (interval === 'm' || interval === '4w') {
      now.setUTCDate(now.getUTCDate() - 30)
    } else {
      now.setUTCDate(now.getUTCDate() - 7)
    }

    return now.toISOString()
  }

  async handle({ interval, user, repo, branch }, { authorFilter }) {
    let commitCount
    if (authorFilter) {
      const authorFilterRes = await this.fetchAuthorFilter({
        interval,
        user,
        repo,
        branch,
        authorFilter,
      })
      commitCount = this.constructor.transformAuthorFilter(authorFilterRes)
    } else {
      const json = await this.fetch({ interval, user, repo, branch })
      commitCount = this.constructor.transform(json)
    }
    return this.constructor.render({ interval, commitCount, authorFilter })
  }
}
