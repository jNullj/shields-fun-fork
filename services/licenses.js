/**
 * Common functions and utilities for tasks related to license badges.
 *
 * @module
 */

import toArray from '../core/base-service/to-array.js'

const licenseTypes = {
  // permissive licenses - not public domain and not copyleft
  permissive: {
    spdxLicenseIds: [
      'AFL-3.0',
      'Apache-2.0',
      'Artistic-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'BSD-3-Clause-Clear',
      'BSL-1.0',
      'CC-BY-4.0',
      'ECL-2.0',
      'ISC',
      'MIT',
      'MS-PL',
      'NCSA',
      'PostgreSQL',
      'Zlib',
    ],
    aliases: ['BSD', 'Apache 2.0'],
    color: 'green',
    priority: '2',
  },
  // copyleft licenses require 'Disclose source' (https://choosealicense.com/appendix/#disclose-source)
  // or 'Same license' (https://choosealicense.com/appendix/#same-license)
  copyleft: {
    spdxLicenseIds: [
      'AGPL-1.0-only',
      'AGPL-1.0-or-later',
      'AGPL-3.0-only',
      'AGPL-3.0-or-later',
      'CC-BY-SA-4.0',
      'EPL-1.0',
      'EPL-2.0',
      'EUPL-1.1',
      'GPL-1.0-only',
      'GPL-1.0-or-later',
      'GPL-2.0-only',
      'GPL-2.0-or-later',
      'GPL-3.0-only',
      'GPL-3.0-or-later',
      'LGPL-2.0-only',
      'LGPL-2.0-or-later',
      'LGPL-2.1-only',
      'LGPL-2.1-or-later',
      'LGPL-3.0-only',
      'LGPL-3.0-or-later',
      'LPPL-1.3c',
      'MPL-2.0',
      'MS-RL',
      'OFL-1.1',
      'OSL-3.0',
    ],
    aliases: [
      'GPL',
      'GPL-2.0',
      'GPL-3.0',
      'GPLv2',
      'GPLv2+',
      'GPLv3',
      'GPLv3+',
      'LGPL',
      'LGPL-2.1',
      'LGPL-3.0',
      'LGPLv2',
      'LGPLv2+',
      'LGPLv3',
      'LGPLv3+',
      'AGPL-3.0',
      'AGPLv3+',
      'MPL',
      'MPL 1.1',
      'MPL 2.0',
      'EPL',
    ],
    color: 'orange',
    priority: '1',
  },
  // public domain licenses do not require 'License and copyright notice' (https://choosealicense.com/appendix/#include-copyright)
  'public-domain': {
    spdxLicenseIds: ['CC0-1.0', 'Unlicense', 'WTFPL', '0BSD'],
    aliases: ['CC0'],
    color: '7cd958',
    priority: '3',
  },
}

/**
 * Mapping of licenses to their corresponding color and priority.
 *
 * @type {object}
 */
const licenseToColorMap = {}
Object.keys(licenseTypes).forEach(licenseType => {
  const { spdxLicenseIds, aliases, color, priority } = licenseTypes[licenseType]
  spdxLicenseIds.forEach(license => {
    licenseToColorMap[license] = { color, priority }
  })
  aliases.forEach(license => {
    licenseToColorMap[license] = { color, priority }
  })
})

/**
 * Maps the license to its corresponding color and priority and sorts the list of mapped licenses by priority.
 *
 * @param {string | string[]} licenses License or list of licenses
 * @returns {string} Color corresponding to the license or the list of licenses
 */
function licenseToColor(licenses) {
  if (!Array.isArray(licenses)) {
    licenses = [licenses]
  }

  const [{ color }] = licenses
    .map(license => licenseToColorMap[license])
    .filter(Boolean)
    .concat([{ color: 'lightgrey', priority: 0 }])
    .sort((a, b) => b.priority - a.priority)

  return color
}

/**
 * Handles rendering concerns of license badges.
 * Determines the message of the badge by joining the licenses in a comma-separated format.
 * Sets the badge color to the provided value, if not provided then the color is used from licenseToColorMap.
 *
 * @param {object} attrs Refer to individual attributes
 * @param {string} [attrs.license] License to render, required if badge contains only one license
 * @param {string[]} [attrs.licenses] List of licenses to render, required if badge contains multiple licenses
 * @param {string} [attrs.color] If provided then the badge will use this color value
 * @returns {object} Badge with message and color properties
 */
function renderLicenseBadge({ license, licenses, color }) {
  if (licenses === undefined) {
    licenses = toArray(license)
  }

  if (licenses.length === 0) {
    return { message: 'missing', color: 'red' }
  }

  return {
    message: licenses.join(', '),
    color: color || licenseToColor(licenses),
  }
}

export { licenseToColor, renderLicenseBadge }
