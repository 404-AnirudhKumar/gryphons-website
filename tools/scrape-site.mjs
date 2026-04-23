import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = new URL(process.argv[2] ?? 'https://gryphons.sg/');
const outputFile = path.resolve(process.argv[3] ?? 'data/gryphons-site-content.json');
const maxPages = Number(process.env.MAX_PAGES ?? 50);

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl, baseUrl);
  url.hash = '';
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function isInternalUrl(rawUrl) {
  try {
    const url = new URL(rawUrl, baseUrl);
    return url.origin === baseUrl.origin;
  } catch {
    return false;
  }
}

function slugFromUrl(rawUrl) {
  const url = new URL(rawUrl, baseUrl);
  const pathname = url.pathname === '/' ? 'home' : url.pathname.replace(/^\/+|\/+$/g, '').replace(/[^\w/-]+/g, '-');
  const query = url.search ? `-${url.search.replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')}` : '';
  return `${pathname}${query}`.replace(/\//g, '__');
}

async function ensureDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function extractUrlsFromCssValue(value) {
  const matches = value.match(/url\((['"]?)(.*?)\1\)/g) || [];
  return matches
    .map((match) => {
      const inner = match.replace(/^url\((['"]?)/, '').replace(/(['"]?)\)$/, '');
      return inner.trim();
    })
    .filter(Boolean);
}

async function downloadAssets(pages) {
  const assetDir = path.join(path.dirname(outputFile), 'site-assets');
  const seen = new Set();
  const queue = [];

  for (const page of pages) {
    for (const image of page.media.images) {
      if (image.src && !seen.has(image.src)) {
        seen.add(image.src);
        queue.push(image.src);
      }
    }

    for (const video of page.media.videos) {
      if (video.src && !seen.has(video.src)) {
        seen.add(video.src);
        queue.push(video.src);
      }
      if (video.poster && !seen.has(video.poster)) {
        seen.add(video.poster);
        queue.push(video.poster);
      }
    }

    for (const background of page.media.backgrounds) {
      for (const assetUrl of extractUrlsFromCssValue(background.backgroundImage)) {
        if (!seen.has(assetUrl)) {
          seen.add(assetUrl);
          queue.push(assetUrl);
        }
      }
    }
  }

  const downloads = [];
  for (const assetUrl of queue) {
    try {
      const url = new URL(assetUrl, baseUrl);
      const relativeAssetPath = url.pathname.replace(/^\/+/, '') || path.basename(url.pathname) || 'asset';
      const localPath = path.join(assetDir, relativeAssetPath);

      await fs.mkdir(path.dirname(localPath), { recursive: true });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(localPath, bytes);

      downloads.push({
        url: url.toString(),
        localPath,
        contentType: response.headers.get('content-type'),
        size: bytes.length,
      });
    } catch (error) {
      downloads.push({
        url: assetUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const downloadMap = new Map(
    downloads
      .filter((download) => download.localPath)
      .map((download) => [download.url, download]),
  );

  for (const page of pages) {
    for (const image of page.media.images) {
      if (image.src && downloadMap.has(image.src)) {
        image.localPath = downloadMap.get(image.src).localPath;
      }
    }

    for (const video of page.media.videos) {
      if (video.src && downloadMap.has(video.src)) {
        video.localPath = downloadMap.get(video.src).localPath;
      }
      if (video.poster && downloadMap.has(video.poster)) {
        video.posterLocalPath = downloadMap.get(video.poster).localPath;
      }
    }

    for (const background of page.media.backgrounds) {
      const assets = extractUrlsFromCssValue(background.backgroundImage)
        .map((assetUrl) => {
          const normalizedAssetUrl = new URL(assetUrl, baseUrl).toString();
          const match = downloadMap.get(normalizedAssetUrl);
          return match ? { url: normalizedAssetUrl, localPath: match.localPath } : { url: normalizedAssetUrl };
        });

      if (assets.length > 0) {
        background.assets = assets;
      }
    }
  }

  return downloads;
}

async function settlePage(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Some apps keep background requests alive. Continue with a timed delay.
  }
  await page.waitForTimeout(800);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const step = Math.max(window.innerHeight * 0.8, 300);
      let travelled = 0;
      const timer = setInterval(() => {
        const maxHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );
        window.scrollBy(0, step);
        travelled += step;
        if (travelled >= maxHeight + window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function expandInteractiveContent(page) {
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((element) => {
      element.open = true;
    });
  });

  const expandable = page.locator(
    'button[aria-expanded="false"], [role="button"][aria-expanded="false"], [data-accordion-target], details summary',
  );
  const count = await expandable.count();

  for (let index = 0; index < count; index += 1) {
    const target = expandable.nth(index);
    try {
      if (await target.isVisible()) {
        await target.click({ force: true, timeout: 1500 });
        await page.waitForTimeout(150);
      }
    } catch {
      // Ignore elements that are not actionable in headless mode.
    }
  }
}

async function capturePage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settlePage(page);
  await expandInteractiveContent(page);
  await autoScroll(page);
  await expandInteractiveContent(page);

  return page.evaluate(() => {
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();
    const seenSectionText = new Set();

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const pickText = (elements) => {
      const seen = new Set();
      const texts = [];
      for (const element of elements) {
        if (!isVisible(element)) {
          continue;
        }
        const text = normalize(element.innerText || element.textContent || '');
        if (!text || seen.has(text)) {
          continue;
        }
        seen.add(text);
        texts.push(text);
      }
      return texts;
    };

    const extractLinks = (elements) => elements
      .filter((element) => isVisible(element))
      .map((element) => ({
        text: normalize(element.innerText || element.textContent || ''),
        href: element.getAttribute('href'),
        absoluteHref: element.href || null,
        ariaLabel: element.getAttribute('aria-label'),
        target: element.getAttribute('target'),
      }))
      .filter((item) => item.href || item.absoluteHref);

    const extractMedia = () => {
      const images = Array.from(document.querySelectorAll('img'))
        .filter((element) => isVisible(element))
        .map((element) => ({
          type: 'image',
          src: element.currentSrc || element.src || null,
          alt: normalize(element.getAttribute('alt') || ''),
          width: element.naturalWidth || null,
          height: element.naturalHeight || null,
        }));

      const videos = Array.from(document.querySelectorAll('video'))
        .filter((element) => isVisible(element))
        .map((element) => ({
          type: 'video',
          src: element.currentSrc || element.getAttribute('src') || null,
          poster: element.getAttribute('poster'),
        }));

      const backgrounds = Array.from(document.querySelectorAll('header, nav, main, section, article, footer, div'))
        .filter((element) => isVisible(element))
        .map((element) => ({
          element: element.tagName.toLowerCase(),
          backgroundImage: window.getComputedStyle(element).backgroundImage,
        }))
        .filter((item) => item.backgroundImage && item.backgroundImage !== 'none');

      return { images, videos, backgrounds };
    };

    const collectElements = (elements, selector) => elements.flatMap((element) => {
      const matches = [];
      if (element.matches && element.matches(selector)) {
        matches.push(element);
      }
      matches.push(...Array.from(element.querySelectorAll(selector)));
      return matches;
    });

    const serializeSection = (elements, labelOverride) => {
        const text = normalize(elements.map((element) => element.innerText || element.textContent || '').join(' '));
        if (!text || seenSectionText.has(text)) {
          return null;
        }
        seenSectionText.add(text);

        const root = elements[0];
        const headingElements = collectElements(elements, 'h1, h2, h3, h4, h5, h6');
        const heading = headingElements[0] || null;
        const classes = normalize(root.className || '');
        const label = normalize(
          heading?.innerText
          || root.getAttribute('aria-label')
          || root.id
          || classes.split(' ').slice(0, 3).join(' ')
          || `${root.tagName.toLowerCase()}-section`,
        );

        return {
          label: labelOverride || label,
          displayTitle: heading ? normalize(heading.innerText || heading.textContent || '') : null,
          tag: root.tagName.toLowerCase(),
          id: root.id || null,
          ids: elements.map((element) => element.id).filter(Boolean),
          classes: classes || null,
          text,
          headings: pickText(headingElements),
          paragraphs: pickText(collectElements(elements, 'p')),
          listItems: pickText(collectElements(elements, 'li')),
          buttons: pickText(collectElements(elements, 'button')),
          links: extractLinks(collectElements(elements, 'a[href]')),
          images: collectElements(elements, 'img')
            .filter((item) => isVisible(item))
            .map((item) => ({
              src: item.currentSrc || item.src || null,
              alt: normalize(item.getAttribute('alt') || ''),
            })),
        };
      };

    const sections = [];
    const appendSection = (elements, label) => {
      if (!elements || elements.length === 0) {
        return;
      }
      const visibleElements = elements.filter((element) => isVisible(element));
      if (visibleElements.length === 0) {
        return;
      }
      const section = serializeSection(visibleElements, label);
      if (section) {
        sections.push(section);
      }
    };

    appendSection([document.querySelector('nav')].filter(Boolean), 'nav');

    const rootShell = document.querySelector('#root > div') || document.querySelector('#root') || document.body;
    const contentContainer = Array.from(rootShell.children)
      .find((element) => element.tagName.toLowerCase() === 'div' && element.querySelector('#aboutus'))
      || rootShell;

    const contentBlocks = Array.from(contentContainer.children).filter((element) => isVisible(element));
    const meaningfulIds = new Set(
      contentBlocks
        .map((element) => element.id)
        .filter((id) => id && id !== 'root' && !id.startsWith('headlessui-')),
    );

    let currentGroup = { label: 'hero', elements: [] };
    for (const block of contentBlocks) {
      const blockId = block.id;
      if (blockId && meaningfulIds.has(blockId)) {
        if (currentGroup.elements.length > 0) {
          appendSection(currentGroup.elements, currentGroup.label);
        }
        currentGroup = { label: blockId, elements: [block] };
        continue;
      }
      currentGroup.elements.push(block);
    }
    if (currentGroup.elements.length > 0) {
      appendSection(currentGroup.elements, currentGroup.label);
    }

    const metaTags = Array.from(document.querySelectorAll('meta[name], meta[property]')).map((tag) => ({
      key: tag.getAttribute('name') || tag.getAttribute('property'),
      value: tag.getAttribute('content'),
    }));

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter((element) => isVisible(element))
      .map((element) => ({
        level: element.tagName.toLowerCase(),
        text: normalize(element.innerText || element.textContent || ''),
        id: element.id || null,
      }))
      .filter((item) => item.text);

    const rawText = normalize(document.body.innerText || '');

    return {
      title: document.title,
      language: document.documentElement.lang || null,
      metaTags,
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      headings,
      sections,
      paragraphs: pickText(Array.from(document.querySelectorAll('p'))),
      listItems: pickText(Array.from(document.querySelectorAll('li'))),
      buttons: pickText(Array.from(document.querySelectorAll('button'))),
      links: extractLinks(Array.from(document.querySelectorAll('a[href]'))),
      media: extractMedia(),
      rawText,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const queue = [normalizeUrl(baseUrl.toString())];
  const visited = new Set();
  const pages = [];
  const errors = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);
    console.log(`Scraping ${currentUrl}`);

    try {
      const snapshot = await capturePage(page, currentUrl);
      const pageRecord = {
        url: currentUrl,
        path: new URL(currentUrl).pathname,
        slug: slugFromUrl(currentUrl),
        ...snapshot,
      };
      pages.push(pageRecord);

      const discoveredInternalUrls = snapshot.links
        .map((link) => link.absoluteHref || link.href)
        .filter(Boolean)
        .filter((link) => isInternalUrl(link))
        .map((link) => normalizeUrl(link))
        .filter((link) => !visited.has(link));

      for (const discoveredUrl of discoveredInternalUrls) {
        if (!queue.includes(discoveredUrl)) {
          queue.push(discoveredUrl);
        }
      }
    } catch (error) {
      errors.push({
        url: currentUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const assetDownloads = await downloadAssets(pages);

  const output = {
    source: {
      siteName: 'Gryphons',
      baseUrl: normalizeUrl(baseUrl.toString()),
      scrapedAt: new Date().toISOString(),
      maxPages,
    },
    summary: {
      pagesCaptured: pages.length,
      pageUrls: pages.map((entry) => entry.url),
      assetsCaptured: assetDownloads.filter((asset) => asset.localPath).length,
      errors,
    },
    assets: assetDownloads,
    pages,
  };

  await ensureDirectory(outputFile);
  await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${pages.length} pages to ${outputFile}`);
  if (errors.length > 0) {
    console.log(`Encountered ${errors.length} errors.`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
