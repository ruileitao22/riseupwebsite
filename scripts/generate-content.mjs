import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { join, sep } from "node:path";

const root = process.cwd();
const pageFiles = [
  "index.html",
  "sobre.html",
  "equipa.html",
  "riseuplegends.html",
  "projetos.html",
  "junta-te.html",
  "contactos.html",
  "politica-protecao-dados.html",
  "termos-condicoes.html",
  "backoffice.html"
];

function match(source, pattern, fallback = "") {
  return source.match(pattern)?.[1]?.trim() ?? fallback;
}

function cleanRoute(value) {
  return value
    .replace(/href="index\.html([#?][^"]*)?"/g, 'href="/$1"')
    .replace(/href="([a-z0-9-]+)\.html([#?][^"]*)?"/gi, 'href="/$1$2"')
    .replace(/(src|href)="(img|documentos)\//g, '$1="/$2/')
    .replace(/src="(hero-(?:desktop|mobile)\.png)"/g, 'src="/$1"');
}

function repairMojibake(value) {
  let result = value;
  for (let attempt = 0; attempt < 2 && /[ÃÂ]|â€/.test(result); attempt += 1) {
    result = Buffer.from(result, "latin1").toString("utf8");
  }
  return result;
}

const pages = {};
for (const filename of pageFiles) {
  const source = await readFile(join(root, filename), "utf8");
  const slug = filename === "index.html" ? "home" : filename.replace(/\.html$/, "");
  const canonical = match(source, /<link rel="canonical" href="([^"]+)"/i, `https://riseupmaia.pt/${slug}`)
    .replace(/index\.html$/, "")
    .replace(/\.html(?=$|[#?])/, "");
  const structuredData = match(source, /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i)
    .replaceAll(".html#webpage", "#webpage")
    .replace(/https:\/\/riseupmaia\.pt\/([a-z0-9-]+)\.html/g, "https://riseupmaia.pt/$1");

  pages[slug] = {
    slug,
    bodyPage: match(source, /<body[^>]*data-page="([^"]+)"/i, slug === "backoffice" ? "backoffice" : slug),
    title: repairMojibake(match(source, /<title>([\s\S]*?)<\/title>/i)),
    description: repairMojibake(match(source, /<meta name="description" content="([^"]*)"/i)),
    canonical,
    structuredData: repairMojibake(structuredData),
    body: cleanRoute(match(source, /<body[^>]*>([\s\S]*?)<\/body>/i))
  };
}

await mkdir(join(root, "src", "generated"), { recursive: true });
await writeFile(
  join(root, "src", "generated", "pages.ts"),
  `// Generated from the original HTML by npm run generate:content.\nexport const pages = ${JSON.stringify(pages, null, 2)} as const;\n\nexport type PageSlug = keyof typeof pages;\n`,
  "utf8"
);

await mkdir(join(root, "public", "legacy"), { recursive: true });
for (const file of ["style.css", "backoffice.css", "script.js", "riseup-data.js", "backoffice.js", "backoffice-workspace.js", "backoffice-selects.js"]) {
  await cp(join(root, file), join(root, "public", "legacy", file));
}
for (const file of ["favicon.ico", "apple-touch-icon.png", "hero-desktop.png", "hero-mobile.png", "site.webmanifest"]) {
  await cp(join(root, file), join(root, "public", file));
}
await cp(join(root, "img"), join(root, "public", "img"), {
  recursive: true,
  filter: (source) => {
    const normalized = source.toLowerCase();
    return !normalized.includes(`${sep}_arquivo${sep}`) && !normalized.includes(`${sep}riseup legends${sep}`);
  }
});
