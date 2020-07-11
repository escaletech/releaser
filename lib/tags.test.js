const { getNextTag } = require('./tags')

const getRecommendedBump = require('conventional-recommended-bump')

jest.mock('conventional-recommended-bump')
const mockRecommendedBump = (error, result) =>
  getRecommendedBump.mockImplementation((options, callback) => callback(error, result))

describe('getNextTag', () => {
  test.each([
    ['v1.2.3', 'patch', 'v1.2.4'],
    ['v1.2.3', 'minor', 'v1.3.0'],
    ['v1.2.3', 'major', 'v2.0.0'],
    ['v0.1.2', 'patch', 'v0.1.3'],
    ['v0.1.2', 'minor', 'v0.2.0'],
    ['v0.1.2', 'major', 'v0.2.0'],
    ['', 'patch', 'v0.1.0'],
    ['', 'minor', 'v0.1.0'],
    ['', 'major', 'v0.1.0']
  ])(
    'given last tag %p and level %p it should return %p',
    async (lastTag, level, expectedTag) => {
      mockRecommendedBump(null, { releaseType: level })
      const next = await getNextTag(lastTag)
      expect(next).toEqual(expectedTag)
    })
})
