// Contador de visitas (simulado)
document.addEventListener("DOMContentLoaded", () => {
  // Simulación de estadísticas
  let viewsCount = localStorage.getItem("viewsCount") || 0
  viewsCount = Number.parseInt(viewsCount) + 1
  localStorage.setItem("viewsCount", viewsCount)

  // Valores simulados
  const onlineCount = Math.floor(Math.random() * 100) + 50
  const peakCount = Math.floor(Math.random() * 200) + 150

  // Actualizar los contadores en la página
  document.getElementById("online-count").textContent = onlineCount
  document.getElementById("peak-count").textContent = peakCount
  document.getElementById("views-count").textContent = viewsCount
})
