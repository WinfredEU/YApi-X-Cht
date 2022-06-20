module.exports = function (uid, projectId, interfaceId) {
  if (!uid || !projectId || !interfaceId) {
    console.error('uid projectId interfaceId 不能為空', uid, projectId, interfaceId)
  }

  /**
   * 統一轉換為number
   */
  return {
    uid: +uid,
    projectId: +projectId,
    interfaceId: +interfaceId,
  }
}
