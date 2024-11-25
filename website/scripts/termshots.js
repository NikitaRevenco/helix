/*
 * This script creates @/termshots/.../index.astro files in each directory within @/termshots for easier importing within mdx files:
 *
 * import { T } from @/termshots/.../index.astro
 *
 * It automatically runs on `pnpm dev`, `pnpm build` and `pnpm preview` and can be manually run with `pnpm termshots`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const termshotsDirectory = path.join(scriptDirectory, "..", "src", "termshots");
const termshotFolders = fs.readdirSync(termshotsDirectory);

function generateFileContents(files, contentGenerator) {
  return files.reduce((contents, file) => {
    if (file === "index.astro") {
      // skip including the file we are generating
      return contents;
    }
    // remove .astro file extension
    const baseName = file.slice(0, -6);
    return `${contents}\n${contentGenerator(baseName, file)}`;
  }, "");
}

termshotFolders.forEach((folder) => {
  const folderPath = path.join(termshotsDirectory, folder);

  if (fs.lstatSync(folderPath).isDirectory()) {
    const disclaimer = `\
/*
 * This file was generated by \`pnpm termshots\`
 */`;

    const filesInFolder = fs.readdirSync(folderPath);

    const importStatements = generateFileContents(
      filesInFolder,
      (baseName, fileName) => `import ${baseName} from "./${fileName}";`,
    );

    const exportedObject = generateFileContents(
      filesInFolder,
      (baseName) => `\t${baseName},`,
    );

    const indexAstroContent = `\
---
${disclaimer}
${importStatements}

export const T = {${exportedObject}
};
---`;

    const indexFilePath = path.join(folderPath, "index.astro");
    fs.writeFileSync(indexFilePath, indexAstroContent);
  }
});
