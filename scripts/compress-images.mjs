import sharp from 'sharp';
import { readdir, stat, unlink, rename } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

async function compress(inputPath, outputPath, options = {}) {
  const before = (await stat(inputPath)).size;
  const ext = extname(inputPath).toLowerCase();

  let pipeline = sharp(inputPath);

  if (options.webp) {
    pipeline = pipeline.webp({ quality: options.quality ?? 80 });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: options.quality ?? 80, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: options.quality ?? 80 });
  }

  await pipeline.toFile(outputPath);
  const after = (await stat(outputPath)).size;
  const saved = ((before - after) / before * 100).toFixed(0);
  console.log(`  ${basename(inputPath)} → ${basename(outputPath)}  ${(before/1024).toFixed(0)} KB → ${(after/1024).toFixed(0)} KB  (${saved}% smaller)`);
  return { before, after };
}

async function run() {
  let totalBefore = 0, totalAfter = 0;

  // ── 0. Resize + convert oversized images ─────────────────────────────────
  console.log('\nResize + convert:');
  const resizeTargets = [
    { src: 'src/assets/instant qoutes.jpg', out: 'src/assets/instant_qoutes.webp', width: 560 },
    { src: 'src/assets/Ratings.png',        out: 'src/assets/Ratings.webp',        width: 560 },
    { src: 'src/assets/search_options.png', out: 'src/assets/search_options.webp', width: 560 },
    { src: 'src/assets/Lucid.png',          out: 'src/assets/Lucid.webp',          width: 200 },
    { src: 'src/assets/web-189884714.jpg',  out: 'src/assets/web-189884714.webp',  width: 300 },
  ];
  for (const { src, out, width } of resizeTargets) {
    const inputPath  = join(ROOT, src);
    const outputPath = join(ROOT, out);
    try {
      const before = (await stat(inputPath)).size;
      await sharp(inputPath).resize(width).webp({ quality: 82 }).toFile(outputPath);
      const after = (await stat(outputPath)).size;
      const saved = ((before - after) / before * 100).toFixed(0);
      console.log(`  ${basename(src)} → ${basename(out)}  ${(before/1024).toFixed(0)} KB → ${(after/1024).toFixed(0)} KB  (${saved}% smaller)`);
      totalBefore += before; totalAfter += after;
      if (inputPath !== outputPath) await unlink(inputPath);
    } catch (e) { console.warn(`  skipped ${src}: ${e.message}`); }
  }

  // ── 1. Heavy one-off images ──────────────────────────────────────────────
  console.log('\nHeavy images:');
  const oneOffs = [
    { src: 'src/assets/app.jpg',    out: 'src/assets/app.webp' },
    { src: 'src/assets/book.png',   out: 'src/assets/book.webp' },
    { src: 'src/assets/19605.jpg',  out: 'src/assets/19605.webp' },
    { src: 'src/assets/2150721533.jpg', out: 'src/assets/2150721533.webp' },
  ];
  for (const { src, out } of oneOffs) {
    try {
      const { before, after } = await compress(join(ROOT, src), join(ROOT, out), { webp: true, quality: 80 });
      await unlink(join(ROOT, src));
      totalBefore += before; totalAfter += after;
    } catch (e) { console.warn(`  skipped ${src}: ${e.message}`); }
  }

  // ── 2. Location images ───────────────────────────────────────────────────
  console.log('\nLocation images:');
  const locDir = join(ROOT, 'src/assets/locations');
  const locFiles = (await readdir(locDir)).filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f));

  for (const file of locFiles) {
    const inputPath = join(locDir, file);
    const outName   = basename(file, extname(file)) + '.webp';
    const outputPath = join(locDir, outName);
    if (inputPath === outputPath) {
      // Already webp — re-compress in place via tmp
      const tmp = outputPath + '.tmp';
      try {
        const { before, after } = await compress(inputPath, tmp, { webp: true, quality: 75 });
        await unlink(inputPath);
        await rename(tmp, outputPath);
        totalBefore += before; totalAfter += after;
      } catch (e) { console.warn(`  skipped ${file}: ${e.message}`); }
    } else {
      try {
        const { before, after } = await compress(inputPath, outputPath, { webp: true, quality: 75 });
        await unlink(inputPath);
        totalBefore += before; totalAfter += after;
      } catch (e) { console.warn(`  skipped ${file}: ${e.message}`); }
    }
  }

  console.log(`\nTotal saved: ${((totalBefore - totalAfter)/1024/1024).toFixed(1)} MB  (${(totalBefore/1024/1024).toFixed(1)} MB → ${(totalAfter/1024/1024).toFixed(1)} MB)`);
}

run().catch(console.error);
