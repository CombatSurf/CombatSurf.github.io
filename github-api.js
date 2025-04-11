/**
 * GitHub API Integration
 * Este archivo contiene funciones para interactuar con GitHub API
 * y almacenar/recuperar datos de comentarios, actualizaciones y rap prices
 */

// Configuración de GitHub
const GITHUB_CONFIG = {
  owner: "", // Nombre de usuario de GitHub (se configura en la inicialización)
  repo: "", // Nombre del repositorio (se configura en la inicialización)
  dataPath: "data", // Carpeta donde se almacenarán los archivos JSON
  branch: "main", // Rama principal
}

// Archivos de datos
const DATA_FILES = {
  comments: "comments.json",
  updates: "updates.json",
  rapPrices: "rap-prices.json",
}

// Token de GitHub (se establece durante la autenticación)
let githubToken = ""

/**
 * Inicializa la configuración de GitHub
 * @param {Object} config - Configuración de GitHub
 */
function initGitHubConfig(config) {
  if (config.owner) GITHUB_CONFIG.owner = config.owner
  if (config.repo) GITHUB_CONFIG.repo = config.repo
  if (config.branch) GITHUB_CONFIG.branch = config.branch

  // Guardar la configuración en localStorage
  localStorage.setItem("githubConfig", JSON.stringify(GITHUB_CONFIG))

  console.log("GitHub config initialized:", GITHUB_CONFIG)
}

/**
 * Carga la configuración de GitHub desde localStorage
 */
function loadGitHubConfig() {
  const savedConfig = localStorage.getItem("githubConfig")
  if (savedConfig) {
    const config = JSON.parse(savedConfig)
    GITHUB_CONFIG.owner = config.owner
    GITHUB_CONFIG.repo = config.repo
    GITHUB_CONFIG.branch = config.branch
    console.log("GitHub config loaded:", GITHUB_CONFIG)
  }
}

/**
 * Establece el token de GitHub
 * @param {string} token - Token de GitHub
 */
function setGitHubToken(token) {
  githubToken = token
  // Guardar el token en sessionStorage (no en localStorage por seguridad)
  sessionStorage.setItem("githubToken", token)
  console.log("GitHub token set")
}

/**
 * Carga el token de GitHub desde sessionStorage
 */
function loadGitHubToken() {
  const token = sessionStorage.getItem("githubToken")
  if (token) {
    githubToken = token
    console.log("GitHub token loaded")
    return true
  }
  return false
}

/**
 * Verifica si el usuario está autenticado con GitHub
 * @returns {boolean} - True si el usuario está autenticado
 */
function isGitHubAuthenticated() {
  return githubToken !== ""
}

/**
 * Inicia el proceso de autenticación con GitHub OAuth
 */
function authenticateWithGitHub() {
  // Parámetros de OAuth
  const clientId = prompt("Por favor, ingresa tu GitHub OAuth Client ID:", "")
  if (!clientId) return

  const redirectUri = window.location.origin + window.location.pathname
  const scope = "repo"

  // Guardar el estado actual para verificar después
  const state = Math.random().toString(36).substring(2)
  localStorage.setItem("githubOAuthState", state)

  // Construir la URL de autorización
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

  // Redirigir a GitHub para autenticación
  window.location.href = authUrl
}

/**
 * Maneja la respuesta de autenticación de GitHub
 */
function handleGitHubAuthResponse() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get("code")
  const state = urlParams.get("state")

  // Verificar el estado para prevenir ataques CSRF
  const savedState = localStorage.getItem("githubOAuthState")
  if (state !== savedState) {
    console.error("Estado inválido, posible ataque CSRF")
    return
  }

  // Limpiar el estado
  localStorage.removeItem("githubOAuthState")

  if (code) {
    // En un entorno real, este intercambio debería hacerse en el servidor
    // por razones de seguridad. Aquí usamos un enfoque simplificado.
    alert(
      "Código de autorización recibido. En una implementación real, este código se intercambiaría por un token de acceso en el servidor.",
    )

    // Simulamos la obtención de un token (en producción, esto se haría en el servidor)
    const simulatedToken = prompt("Por favor, ingresa tu token de acceso personal de GitHub:", "")
    if (simulatedToken) {
      setGitHubToken(simulatedToken)

      // Configurar el repositorio
      const owner = prompt("Nombre de usuario de GitHub:", "")
      const repo = prompt("Nombre del repositorio:", "")

      if (owner && repo) {
        initGitHubConfig({ owner, repo })

        // Limpiar la URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Recargar la página
        window.location.reload()
      }
    }
  }
}

/**
 * Obtiene el contenido de un archivo desde GitHub
 * @param {string} path - Ruta del archivo
 * @returns {Promise<Object>} - Contenido del archivo y SHA
 */
async function getFileFromGitHub(path) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`

    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (response.status === 404) {
      // El archivo no existe
      return { content: null, sha: null }
    }

    if (!response.ok) {
      throw new Error(`Error al obtener el archivo: ${response.statusText}`)
    }

    const data = await response.json()

    // Decodificar el contenido (está en base64)
    const content = data.content ? JSON.parse(atob(data.content)) : null

    return { content, sha: data.sha }
  } catch (error) {
    console.error("Error al obtener archivo de GitHub:", error)
    return { content: null, sha: null }
  }
}

/**
 * Guarda un archivo en GitHub
 * @param {string} path - Ruta del archivo
 * @param {Object} content - Contenido a guardar
 * @param {string} sha - SHA del archivo (null para crear nuevo)
 * @param {string} message - Mensaje de commit
 * @returns {Promise<boolean>} - True si se guardó correctamente
 */
async function saveFileToGitHub(path, content, sha, message) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`

    const body = {
      message,
      content: btoa(JSON.stringify(content, null, 2)), // Convertir a base64
      branch: GITHUB_CONFIG.branch,
    }

    // Si tenemos SHA, es una actualización
    if (sha) {
      body.sha = sha
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Error al guardar el archivo: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Error al guardar archivo en GitHub:", error)
    return false
  }
}

/**
 * Carga comentarios desde GitHub
 * @returns {Promise<Array>} - Lista de comentarios
 */
async function loadCommentsFromGitHub() {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.comments}`
  const { content } = await getFileFromGitHub(path)

  return content || []
}

/**
 * Guarda un comentario en GitHub
 * @param {Object} comment - Comentario a guardar
 * @returns {Promise<boolean>} - True si se guardó correctamente
 */
async function saveCommentToGitHub(comment) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.comments}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  // Preparar los datos
  const comments = content || []
  comments.push(comment)

  // Guardar el archivo
  const message = `Añadir comentario de ${comment.author}`
  return await saveFileToGitHub(path, comments, sha, message)
}

/**
 * Elimina un comentario en GitHub
 * @param {string} commentId - ID del comentario a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
async function deleteCommentFromGitHub(commentId) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.comments}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  if (!content) return false

  // Filtrar el comentario
  const comments = content.filter((c) => c.id !== commentId)

  // Guardar el archivo
  const message = `Eliminar comentario ${commentId}`
  return await saveFileToGitHub(path, comments, sha, message)
}

/**
 * Carga actualizaciones desde GitHub
 * @returns {Promise<Array>} - Lista de actualizaciones
 */
async function loadUpdatesFromGitHub() {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.updates}`
  const { content } = await getFileFromGitHub(path)

  return content || []
}

/**
 * Guarda una actualización en GitHub
 * @param {Object} update - Actualización a guardar
 * @returns {Promise<boolean>} - True si se guardó correctamente
 */
async function saveUpdateToGitHub(update) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.updates}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  // Preparar los datos
  const updates = content || []
  updates.push(update)

  // Guardar el archivo
  const message = `Añadir actualización: ${update.title} (${update.version})`
  return await saveFileToGitHub(path, updates, sha, message)
}

/**
 * Elimina una actualización en GitHub
 * @param {string} updateId - ID de la actualización a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
async function deleteUpdateFromGitHub(updateId) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.updates}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  if (!content) return false

  // Filtrar la actualización
  const updates = content.filter((u) => u.id !== updateId)

  // Guardar el archivo
  const message = `Eliminar actualización ${updateId}`
  return await saveFileToGitHub(path, updates, sha, message)
}

/**
 * Carga rap prices desde GitHub
 * @returns {Promise<Array>} - Lista de rap prices
 */
async function loadRapPricesFromGitHub() {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.rapPrices}`
  const { content } = await getFileFromGitHub(path)

  return content || []
}

/**
 * Guarda un rap price en GitHub
 * @param {Object} rapPrice - Rap price a guardar
 * @returns {Promise<boolean>} - True si se guardó correctamente
 */
async function saveRapPriceToGitHub(rapPrice) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.rapPrices}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  // Preparar los datos
  const rapPrices = content || []
  rapPrices.push(rapPrice)

  // Guardar el archivo
  const message = `Añadir rap price: ${rapPrice.title}`
  return await saveFileToGitHub(path, rapPrices, sha, message)
}

/**
 * Elimina un rap price en GitHub
 * @param {string} rapPriceId - ID del rap price a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
async function deleteRapPriceFromGitHub(rapPriceId) {
  const path = `${GITHUB_CONFIG.dataPath}/${DATA_FILES.rapPrices}`

  // Obtener el archivo actual y su SHA
  const { content, sha } = await getFileFromGitHub(path)

  if (!content) return false

  // Filtrar el rap price
  const rapPrices = content.filter((r) => r.id !== rapPriceId)

  // Guardar el archivo
  const message = `Eliminar rap price ${rapPriceId}`
  return await saveFileToGitHub(path, rapPrices, sha, message)
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Cargar configuración y token
  loadGitHubConfig()
  loadGitHubToken()

  // Verificar si hay una respuesta de autenticación
  if (window.location.search.includes("code=")) {
    handleGitHubAuthResponse()
  }
})
