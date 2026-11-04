import { useEffect } from 'preact/hooks'
import { EquipmentList } from '../../components/EquipmentList.tsx'
import { MATERIALES, materialQueFalta } from '../../state/material.ts'
import { cargarMaterial, tenerMaterial } from '../../use-cases/myEquipment.ts'

/** «Tu material» para el Perfil (sale por el index.ts de Entreno): lo carga y guarda cada cambio. */
export function TuMaterial() {
  useEffect(() => {
    void cargarMaterial()
  }, [])
  const falta = materialQueFalta.value
  return (
    <EquipmentList
      materiales={MATERIALES.map((m) => ({ ...m, tienes: !falta.includes(m.id) }))}
      onCambio={(id, tienes) => {
        const m = MATERIALES.find((x) => x.id === id)
        if (m) void tenerMaterial(m.id, tienes)
      }}
    />
  )
}
