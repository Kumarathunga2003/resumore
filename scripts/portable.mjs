import { readFile, writeFile } from "node:fs/promises";
const base = new URL("../dist/", import.meta.url);
let html = await readFile(new URL("index.html", base), "utf8");
const js = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const css = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if (!js || !css) throw Error("Expected one Vite script and stylesheet.");
const code = await readFile(new URL(js[1].replace(/^\//, ""), base), "utf8");
const style = await readFile(new URL(css[1].replace(/^\//, ""), base), "utf8");
html = html
  .replace(js[0], "")
  .replace(css[0], () => "<style>" + style + "</style>")
  .replace(
    "./favicon.svg",
    "data:image/svg+xml;base64," +
      (await readFile(new URL("favicon.svg", base))).toString("base64"),
  )
  .replace(
    "</body>",
    () =>
      '<script type="module">' +
      code.replaceAll("</script", "<\\/script") +
      "</script></body>",
  );
await writeFile(new URL("../Resumora.html", base), html);
