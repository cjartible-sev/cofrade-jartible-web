// Lee los últimos vídeos del canal desde su RSS público cada vez que se compila la web.
const CANAL_ID = "UC8xEJlHs_C_Yzvb2CM3MSYw";
const CANAL_URL = "https://www.youtube.com/@CofradeJartibleSevilla";

function decodificar(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function parsear(xml) {
  return xml.split("<entry>").slice(1).map((e) => ({
    id: (e.match(/<yt:videoId>([^<]+)</) || [])[1],
    titulo: decodificar((e.match(/<title>([^<]*)</) || [])[1] || ""),
    fecha: (e.match(/<published>([^<]+)</) || [])[1],
    short: /\/shorts\//.test(e),
  })).filter((v) => v.id && !v.short).slice(0, 4);
}

module.exports = async function () {
  const datos = { canal: CANAL_URL, videos: [] };
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_ID}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    datos.videos = parsear(await res.text());
  } catch (err) {
    console.warn("[youtube] No se pudieron leer los vídeos del canal:", err.message);
  }
  return datos;
};
module.exports.parsear = parsear;
