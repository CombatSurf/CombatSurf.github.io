// Función para obtener datos de Roblox
async function fetchRobloxGameData() {
  try {
    // Mostrar loaders mientras se cargan los datos
    document.getElementById("online-count").innerHTML = '<span class="loader"></span>'
    document.getElementById("peak-count").innerHTML = '<span class="loader"></span>'

    // URL del juego de Roblox
    const gameId = "16167223198"
    const proxyUrl = "https://cors-anywhere.herokuapp.com/"
    const targetUrl = `https://www.roblox.com/games/${gameId}/Combat-Surf`

    try {
      // Intentar obtener datos directamente (esto puede fallar debido a CORS)
      const response = await fetch(targetUrl)
      const html = await response.text()
      processGameData(html)
    } catch (error) {
      console.log("Error fetching directly, using fallback method:", error)

      // Fallback: Usar valores simulados con animación
      simulateGameData()
    }
  } catch (error) {
    console.error("Error fetching Roblox data:", error)
    // En caso de error, mostrar datos simulados
    simulateGameData()
  }
}

// Procesar los datos del HTML de Roblox
function processGameData(html) {
  try {
    // Crear un parser DOM temporal
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    // Intentar extraer el número de jugadores activos
    // Nota: Esto es una aproximación y puede necesitar ajustes según la estructura real de la página
    const playingCountElement = doc.querySelector(".game-stat-playing .text-lead")
    let playingCount = 0

    if (playingCountElement) {
      playingCount = Number.parseInt(playingCountElement.textContent.replace(/,/g, "").trim()) || 0
    }

    // Actualizar el contador de jugadores en línea con animación
    animateCounter("online-count", 0, playingCount, 1500)

    // Obtener el pico histórico almacenado
    let storedPeak = localStorage.getItem("peakCount") || 0
    storedPeak = Number.parseInt(storedPeak)

    // Actualizar el pico si el número actual es mayor
    if (playingCount > storedPeak) {
      localStorage.setItem("peakCount", playingCount)
      storedPeak = playingCount
    }

    // Actualizar el contador de pico con animación
    animateCounter("peak-count", 0, storedPeak, 1500)
  } catch (error) {
    console.error("Error processing game data:", error)
    simulateGameData()
  }
}

// Función para simular datos del juego (fallback)
function simulateGameData() {
  const onlineCount = Math.floor(Math.random() * 100) + 50

  // Obtener el pico histórico almacenado o crear uno nuevo
  let storedPeak = localStorage.getItem("peakCount") || 0
  storedPeak = Number.parseInt(storedPeak)

  // Generar un pico simulado que sea al menos igual al almacenado
  const simulatedPeak = Math.max(storedPeak, Math.floor(Math.random() * 200) + 150)

  // Actualizar el pico almacenado si el simulado es mayor
  if (simulatedPeak > storedPeak) {
    localStorage.setItem("peakCount", simulatedPeak)
  }

  // Animar los contadores
  animateCounter("online-count", 0, onlineCount, 1500)
  animateCounter("peak-count", 0, simulatedPeak, 1500)
}

// Función para animar contadores
function animateCounter(elementId, start, end, duration) {
  const element = document.getElementById(elementId)
  const range = end - start
  const increment = end > start ? 1 : -1
  const stepTime = Math.abs(Math.floor(duration / range))
  let current = start

  const timer = setInterval(() => {
    current += increment
    element.textContent = current

    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = end
      clearInterval(timer)

      // Añadir efecto de pulso al completar
      element.classList.add("pulse")
      setTimeout(() => {
        element.classList.remove("pulse")
      }, 2000)
    }
  }, stepTime)
}

// Contador de visitas
document.addEventListener("DOMContentLoaded", () => {
  // Iniciar la obtención de datos de Roblox
  fetchRobloxGameData()

  // Gestionar el contador de visitas
  let viewsCount = localStorage.getItem("viewsCount") || 0
  viewsCount = Number.parseInt(viewsCount) + 1
  localStorage.setItem("viewsCount", viewsCount)

  // Animar el contador de visitas
  animateCounter("views-count", 0, viewsCount, 1000)

  // Añadir animaciones a elementos al hacer scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll(".welcome-section, .portada")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const screenPosition = window.innerHeight / 1.3

      if (elementPosition < screenPosition) {
        element.style.opacity = "1"
        element.style.transform = "translateY(0)"
      }
    })
  }

  // Inicialmente establecer los elementos como ocultos
  document.querySelectorAll(".welcome-section, .portada").forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.8s ease, transform 0.8s ease"
  })

  // Ejecutar la animación al cargar y al hacer scroll
  animateOnScroll()
  window.addEventListener("scroll", animateOnScroll)
})
