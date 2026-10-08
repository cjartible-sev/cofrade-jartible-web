module.exports = {
  layout: "post.njk",
  permalink: (data) => `/noticias/${data.page.fileSlug}/`,
};
