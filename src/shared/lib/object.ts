/** Una copia del objeto sin esas claves (el original no cambia). */
export function sinClaves<T extends object, K extends keyof T>(objeto: T, claves: readonly K[]): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(objeto).filter(([k]) => !(claves as readonly PropertyKey[]).includes(k)),
  ) as Omit<T, K>
}
