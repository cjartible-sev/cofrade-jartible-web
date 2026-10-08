module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy({ "src/admin/config.yml": "admin/config.yml" });

  const porFecha = (a, b) => new Date(b.data.date || b.date) - new Date(a.data.date || a.date);

  eleventyConfig.addCollection("noticias", (api) =>
    api.getFilteredByGlob("src/noticias/*.md").filter((n) => n.data.categoria !== "galeria").sort(porFecha));
  eleventyConfig.addCollection("galeria", (api) =>
    api.getFilteredByGlob("src/noticias/*.md").filter((n) => n.data.categoria === "galeria").sort(porFecha));
  eleventyConfig.addCollection("agenda", (api) =>
    api.getFilteredByGlob("src/agenda/*.md").sort((a, b) => new Date(a.data.fecha) - new Date(b.data.fecha)));
  eleventyConfig.addCollection("paginas", (api) =>
    api.getFilteredByGlob("src/paginas/*.md").sort((a, b) => (a.data.orden || 0) - (b.data.orden || 0)));

  eleventyConfig.addFilter("primeros", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("submenu", (arr) => (arr || []).filter((p) => p.fileSlug !== "semana-santa"));
  eleventyConfig.addFilter("iso", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("dia", (d) => new Date(d).getUTCDate());
  eleventyConfig.addFilter("mes", (d) => new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(new Date(d)));
  eleventyConfig.addFilter("fechaLarga", (d) => new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" }).format(new Date(d)));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
};
