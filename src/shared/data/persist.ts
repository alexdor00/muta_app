// Pide al navegador que no borre los datos (Safari borra los de webs no instaladas).

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

/** Para enseñarlo en Perfil: ¿ha concedido el navegador el almacenamiento persistente? */
export async function isStoragePersisted(): Promise<boolean> {
  return (await navigator.storage?.persisted?.()) ?? false
}
