# 📱 **Ejercicios por Biotipo**

## 📖 Overview
Esta aplicación **React Native** (Expo) permite a los usuarios explorar ejercicios físicos personalizados según su biotipo (ectomorfo, mesomorfo, endomorfo).  Se conecta en tiempo real a la **API Ninja** para obtener hasta 5 ejercicios y los muestra con una UI premium, totalmente traducida al español.

---

## ✨ Features
- **Biotipo Selector** con visualización de información anatómica y recomendaciones de entrenamiento.
- **Búsqueda de ejercicios** por nombre o por músculo predeterminado del biotipo.
- **Integración en vivo con la API Ninja** (`https://api.api-ninjas.com/v1/exercises`).
- **Traducción completa al español** (músculos, equipos, dificultades y tipos de ejercicio).
- **Responsive scaling** con la función `normalize` para adaptarse a cualquier pantalla.
- **Manejo robusto de errores**: guardas contra valores `undefined` y muestra mensajes amigables.
- **Error Boundary** (próxima incorporación) para evitar caídas inesperadas.
- **Test de biotipo** interactivo que determina el tipo corporal del usuario.

---

## 📸 Screenshots
> (Añade imágenes generadas con el comando `/generate_image` o captura de pantalla aquí)

---

## 🛠️ Installation & Running
```bash
# 1️⃣ Clona el repositorio (si corresponde)
git clone <repo-url>
cd ejercicios

# 2️⃣ Instala dependencias
npm install   # o yarn install

# 3️⃣ Configura la variable de entorno con tu API‑Key de API‑Ninjas
#    (puedes crear un archivo .env)
#    X_API_KEY=TU_API_KEY

# 4️⃣ Inicia la app con Expo
npx expo start -c
```

_El proyecto está configurado para **Expo SDK 54** (verifica la documentación oficial <https://docs.expo.dev/versions/v54.0.0/>)._

---

## 🌐 API Integration
- **Endpoint**: `GET https://api.api-ninjas.com/v1/exercises`
- Parámetros principales: `muscle`, `name`, `type`, `difficulty`, `equipment`.
- La petición se hace desde `fetchExercisesFromApi` en **[`explore.tsx`](file:///c:/Users/Franklyn%20Ramirez/Documents/Proyect/ejercicios/app/(tabs)/explore.tsx)**.
- Se limita a 4 resultados para mantener la UI limpia.

---

## 🇪🇸 Localization (Español)
Los diccionarios de traducción están definidos en **[`explore.tsx`](file:///c:/Users/Franklyn%20Ramirez/Documents/Proyect/ejercicios/app/(tabs)/explore.tsx)**:
- `translateMuscle`
- `translateEquipment`
- `translateDifficulty`
- `translateType`

Cada función protege contra valores nulos/undefined devolviendo `"Desconocido"`.

---

## 📱 Responsive Design
Se añadió la función **`normalize(size: number)`** basada en el ancho de pantalla (baseline 375 dp).  Todas las dimensiones de paddings, márgenes, fuentes y radii usan `normalize(...)` para escalar automáticamente.

---

## 🛡️ Error Handling & Future Work
- Actualmente se muestra un mensaje amigable cuando la API falla.
- Próximamente se integrará un **Error Boundary** (ver advertencia en la consola) para capturar excepciones de renderizado y evitar crashes.

---

## 🤝 Contributing
1. Fork the repo.
2. Crea una rama `feature/tu‑feature`.
3. Envía pull request.
4. Asegúrate de que el proyecto sigue corriendo sin errores en diferentes tamaños de pantalla.

---

## 📄 License
Este proyecto está bajo la licencia MIT.
