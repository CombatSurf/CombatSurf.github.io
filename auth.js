// Funciones de autenticación y gestión de usuarios

// Verificar si el usuario está autenticado
function isAuthenticated() {
  return localStorage.getItem("currentUser") !== null
}

// Obtener el usuario actual
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "{}")
}

// Verificar si el usuario actual es administrador
function isAdmin() {
  const currentUser = getCurrentUser()
  return currentUser && currentUser.role === "admin"
}

// Cerrar sesión
function logout() {
  localStorage.removeItem("currentUser")
  window.location.href = "index.html"
}

// Proteger páginas que requieren autenticación
function requireAuth() {
  if (!isAuthenticated()) {
    // Guardar la página actual para redirigir después del login
    localStorage.setItem("redirectAfterLogin", window.location.href)
    window.location.href = "login.html"
    return false
  }
  return true
}

// Actualizar la interfaz de usuario según el estado de autenticación
function updateAuthUI() {
  const authLinks = document.querySelectorAll(".auth-status")

  if (isAuthenticated()) {
    const user = getCurrentUser()

    authLinks.forEach((link) => {
      if (link.classList.contains("logged-in")) {
        link.style.display = "block"

        // Actualizar el nombre de usuario si existe el elemento
        const usernameElement = link.querySelector(".username")
        if (usernameElement) {
          usernameElement.textContent = user.username
        }

        // Mostrar/ocultar elementos específicos para administradores
        const adminElements = link.querySelectorAll(".admin-only")
        adminElements.forEach((el) => {
          el.style.display = isAdmin() ? "block" : "none"
        })
      } else if (link.classList.contains("logged-out")) {
        link.style.display = "none"
      }
    })
  } else {
    authLinks.forEach((link) => {
      if (link.classList.contains("logged-in")) {
        link.style.display = "none"
      } else if (link.classList.contains("logged-out")) {
        link.style.display = "block"
      }
    })
  }
}

// Inicializar la autenticación cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI()

  // Manejar el botón de cerrar sesión
  const logoutButtons = document.querySelectorAll(".logout-btn")
  logoutButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  })

  // Verificar si hay una redirección pendiente después del login
  const currentUser = getCurrentUser()
  const redirectUrl = localStorage.getItem("redirectAfterLogin")

  if (currentUser && redirectUrl) {
    localStorage.removeItem("redirectAfterLogin")
    // Solo redirigir si estamos en la página de login
    if (window.location.pathname.includes("login.html")) {
      window.location.href = redirectUrl
    }
  }
})
