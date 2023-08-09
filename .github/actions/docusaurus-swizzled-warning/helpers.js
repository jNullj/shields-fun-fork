'use strict'

/**
 * Returns info about all files changed in a PR (max 3000 results)
 *
 * @param {object} client hydrated octokit ready to use for GitHub Actions
 * @param {string} owner repo owner
 * @param {string} repo repo name
 * @param {number} pullNumber pull request number
 * @returns {object[]} array of object that describe pr changed files - see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests-files
 */
function getAllFilesForPullRequest(client, owner, repo, pullNumber) {
  const perPage = 100 // Max number of items per page
  let page = 1 // Start with the first page
  let allFiles = []
  while (true) {
    const response = client.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      {
        owner,
        repo,
        pull_number: pullNumber,
        per_page: perPage,
        page,
      },
    )

    if (response.data.length === 0) {
      // Break the loop if no more results
      break
    }

    console.log('res_data:s', response.data)

    allFiles = allFiles.concat(response.data)
    page++ // Move to the next page
  }
  return allFiles
}

/**
 * Get a list of files changed betwen two tags for a github repo
 *
 * @param {object} client hydrated octokit ready to use for GitHub Actions
 * @param {string} owner repo owner
 * @param {string} repo repo name
 * @param {string} baseTag base tag
 * @param {string} headTag head tag
 * @returns {string[]} Array listing all changed files betwen the base tag and the head tag
 */
function getChangedFilesBetweenTags(client, owner, repo, baseTag, headTag) {
  const response = client.rest.repos.compareCommits({
    owner,
    repo,
    base: baseTag,
    head: headTag,
  })

  return response.data.files.map(file => file.filename)
}

module.exports = { getAllFilesForPullRequest, getChangedFilesBetweenTags }
