// Shared by the post list, individual routes, and legacy redirects.
export function isPostVisible(status = 'draft', production = false) {
  return status === 'published' || (!production && status === 'draft');
}
