const { resolveBranchToPush } = require('./resolveBranchToPush')

describe('resolveBranchToPush', () => {
  test('uses the checked out branch', () => {
    expect(resolveBranchToPush({ abbrevRef: 'main', branchesAtHead: [] })).toBe('main')
  })

  test('uses main when HEAD is detached on that commit', () => {
    expect(resolveBranchToPush({ abbrevRef: 'HEAD', branchesAtHead: ['main'] })).toBe('main')
  })

  test('prefers main when several local branches point at HEAD', () => {
    expect(resolveBranchToPush({
      abbrevRef: 'HEAD',
      branchesAtHead: ['feature', 'main']
    })).toBe('main')
  })

  test('prefers master when main is absent', () => {
    expect(resolveBranchToPush({
      abbrevRef: 'HEAD',
      branchesAtHead: ['feature', 'master']
    })).toBe('master')
  })

  test('uses the only local branch when HEAD is detached', () => {
    expect(resolveBranchToPush({
      abbrevRef: 'HEAD',
      branchesAtHead: ['release']
    })).toBe('release')
  })

  test('ignores blank lines from for-each-ref', () => {
    expect(resolveBranchToPush({
      abbrevRef: 'HEAD',
      branchesAtHead: ['release', '']
    })).toBe('release')
  })

  test('fails before tagging when detached and no local branch matches', () => {
    expect(() => resolveBranchToPush({ abbrevRef: 'HEAD', branchesAtHead: [] }))
      .toThrow('HEAD destacado. Faça checkout do branch antes do release (candidatos: nenhum).')
  })

  test('fails when detached on several branches and none is main or master', () => {
    expect(() => resolveBranchToPush({
      abbrevRef: 'HEAD',
      branchesAtHead: ['feature-a', 'feature-b']
    })).toThrow('candidatos: feature-a, feature-b')
  })
})
