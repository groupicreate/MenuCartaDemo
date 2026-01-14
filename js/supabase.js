// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabaseUrl = 'https://qozzxdrjwjskmwmxscqj.supabase.co'
export const supabaseKey = 'sb_publishable_UtBfupVv8e2zniYdv1jvEA_SXIyWE0Z'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Obtener todo el menú
export async function getMenu() {
  const { data, error } = await supabase.from('Menu').select('*').order('id')
  if (error) console.error(error)
  return data
}

// Agregar plato
export async function addPlato(plato, descripcion, precio, categoria) {
  const { data, error } = await supabase.from('Menu')
    .insert([{ plato, descripcion, precio, categoria }])
  if (error) console.error(error)
  return data
}

// Actualizar plato
export async function updatePlato(id, plato, descripcion, precio, categoria) {
  const { data, error } = await supabase.from('Menu')
    .update({ plato, descripcion, precio, categoria })
    .eq('id', id)
  if (error) console.error(error)
  return data
}

// Borrar plato
export async function deletePlato(id) {
  const { data, error } = await supabase.from('Menu').delete().eq('id', id)
  if (error) console.error(error)
  return data
}
