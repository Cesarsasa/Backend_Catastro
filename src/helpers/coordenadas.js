export const puntosAPoligono = (puntos) => {
  // puntos = [[lat, lng], [lat, lng], ...]
  const cerrado = [...puntos, puntos[0]]  // cierra el polígono
  const coords  = cerrado.map(([lat, lng]) => `${lng} ${lat}`).join(', ')
  return `SRID=4326;POLYGON((${coords}))`
}

export const dmsToDecimal = (grados, minutos, segundos, direccion) => {
  // Convierte "N 14° 37' 52.34"" a 14.631206
  let decimal = grados + minutos / 60 + segundos / 3600
  if (direccion === 'S' || direccion === 'O' || direccion === 'W') {
    decimal = -decimal
  }
  return decimal
}