export const generarDireccion = (via, numeroCasa, zona, municipio) => {
  const ordinal = `${via.numero}ª`
  return `${ordinal} ${via.tipo_via.nombre} ${numeroCasa}, Zona ${zona.numero}, ${municipio.nombre}`
  // → "2ª. Calle 4-39, Zona 2, Patzicía"
}