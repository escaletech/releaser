function resolveBranchToPush ({ abbrevRef, branchesAtHead = [] }) {
  if (abbrevRef && abbrevRef !== 'HEAD') {
    return abbrevRef
  }

  const branches = branchesAtHead.map(branch => String(branch).trim()).filter(Boolean)
  if (branches.includes('main')) return 'main'
  if (branches.includes('master')) return 'master'
  if (branches.length === 1) return branches[0]

  const listed = branches.length ? branches.join(', ') : 'nenhum'
  throw new Error(`HEAD destacado. Faça checkout do branch antes do release (candidatos: ${listed}).`)
}

module.exports = {
  resolveBranchToPush
}
