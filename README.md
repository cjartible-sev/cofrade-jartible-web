# Cofrade Jartible – web estática con panel de edición

Web hecha con Eleventy (se regenera sola en cada cambio) y un panel de edición en `/admin` (Sveltia CMS, compatible con la configuración de Decap CMS).

## Puesta en marcha (todo gratis)
1. Crea una cuenta en github.com y un repositorio llamado `cofrade-jartible-web`. Sube todo el contenido de esta carpeta.
2. Abre `src/admin/config.yml` y cambia `TU_USUARIO` por tu usuario de GitHub.
3. Crea una cuenta en Cloudflare Pages (o Netlify) y conecta el repositorio.
   - Comando de build: `npm run build`
   - Carpeta de salida: `_site`
4. En GitHub: Settings > Developer settings > Personal access tokens > Fine-grained tokens. Crea uno solo para este repositorio con permiso «Contents: Read and write».
5. Entra en `https://tu-web/admin`, inicia sesión con GitHub usando ese token, y ya puedes escribir noticias, eventos y subir fotos.
6. Cada vez que guardas, la web se regenera y se actualiza en 1-2 minutos.

## Qué se edita en el panel
- Noticias y galerías (el tipo «Galería de fotos» sale en la sección Galería)
- Agenda (los eventos pasados se ocultan solos)
- Páginas de Semana Santa (aparecen en el desplegable del menú)
- Ajustes: frase, fecha de la cuenta atrás, redes y Reto Cofrade

## Probar en tu ordenador
`npm install` y después `npm start` (Node 18 o superior).
