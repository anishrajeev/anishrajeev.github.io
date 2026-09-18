// Shared by the post list, individual routes, and legacy redirects.
export function isPostVisible(status = 'draft', production = false) {
  return status === 'published' || status === 'unlisted' || (!production && status === 'draft');
}

// Keep shareable drafts easy to find locally, but off the public posts list.
export function isPostListed(status = 'draft', production = false) {
  return isPostVisible(status, production) && !(production && status === 'unlisted');
}
