import { r as HTTPResponse } from "../_libs/h3+rou3+srvx.mjs";
//#region #nitro/virtual/renderer-template
var rendererTemplate = () => new HTTPResponse("<!doctype html>\n<html lang=\"cs\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>lovec upírů</title>\n    <meta name=\"description\" content=\"1D tahová taktická roguelite. Venca Česnekáč v boji proti hradním upírům a nočním stvůrám.\" />\n    <meta property=\"og:title\" content=\"lovec upírů\" />\n    <meta property=\"og:description\" content=\"1D tahová taktická roguelite. Venca Česnekáč v boji proti hradním upírům a nočním stvůrám.\" />\n    <meta property=\"og:type\" content=\"website\" />\n    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n", { headers: { "content-type": "text/html; charset=utf-8" } });
//#endregion
//#region node_modules/nitro/dist/runtime/internal/routes/renderer-template.mjs
function renderIndexHTML(event) {
	return rendererTemplate(event.req);
}
//#endregion
export { renderIndexHTML as default };
