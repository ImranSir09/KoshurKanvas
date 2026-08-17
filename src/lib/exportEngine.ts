import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CanvasAspectRatio } from '../types';

export interface ExportOptions {
  fileName: string;
  format: 'png' | 'jpeg' | 'pdf' | 'transparent_png';
  pixelRatio?: number;
  quality?: number;
  aspectRatio?: CanvasAspectRatio;
}

let cachedFontEmbedCSS: string | null = null;
let fontLoadingPromise: Promise<string> | null = null;

/**
 * Pre-fetches and inlines Google Fonts into base64 @font-face CSS
 * so that html-to-image / SVG foreignObject can render Noto Nastaliq Urdu,
 * Gulzar, Amiri, and Noto Sans Arabic fonts with 100% fidelity without network/CORS blocks.
 */
export async function getBase64FontEmbedCSS(): Promise<string> {
  if (cachedFontEmbedCSS) return cachedFontEmbedCSS;
  if (fontLoadingPromise) return fontLoadingPromise;

  fontLoadingPromise = (async () => {
    try {
      const fontCssUrl =
        'https://fonts.googleapis.com/css2?family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      
      const res = await fetch(fontCssUrl);
      if (!res.ok) throw new Error(`Failed to fetch font CSS: ${res.status}`);
      let cssText = await res.text();

      // Find all font binary URLs (https://fonts.gstatic.com/...)
      const matches = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+)\)/g));
      const urlToDataMap = new Map<string, string>();

      // Fetch and base64-encode font files
      await Promise.all(
        matches.map(async (m) => {
          const rawUrl = m[1].replace(/['"]/g, '');
          if (urlToDataMap.has(rawUrl)) return;
          try {
            const fontRes = await fetch(rawUrl);
            const blob = await fontRes.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            urlToDataMap.set(rawUrl, base64);
          } catch (e) {
            console.warn('Failed to base64-encode font url:', rawUrl, e);
          }
        })
      );

      // Replace URLs in CSS with base64 data URIs
      for (const [url, dataUri] of urlToDataMap.entries()) {
        cssText = cssText.split(url).join(dataUri);
      }

      cachedFontEmbedCSS = cssText;
      return cssText;
    } catch (err) {
      console.warn('Could not load base64 font embed CSS:', err);
      return '';
    }
  })();

  return fontLoadingPromise;
}

// Pre-warm font cache on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getBase64FontEmbedCSS().catch(() => {});
  }, 500);
}

export async function exportElement(
  element: HTMLElement,
  options: ExportOptions
): Promise<string> {
  const pixelRatio = options.pixelRatio || 2; // High DPI for Nastaliq
  const fileName = options.fileName || 'kashur-lekhun-export';

  // Ensure fonts and images are fully settled in the DOM
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Retrieve base64-embedded font CSS
  const fontEmbedCSS = await getBase64FontEmbedCSS();

  // Determine target aspect ratio and natural dimension bounds
  const targetRatio: CanvasAspectRatio =
    options.aspectRatio ||
    (element.getAttribute('data-aspect-ratio') as CanvasAspectRatio) ||
    'auto';

  const rect = element.getBoundingClientRect();
  const currentWidth = Math.round(rect.width) || 800;
  const currentHeight = Math.round(rect.height) || 600;

  let targetWidth: number | undefined;
  let targetHeight: number | undefined;

  if (targetRatio && targetRatio !== 'auto') {
    let ratioNum: number; // width / height
    switch (targetRatio) {
      case '1:1':
        ratioNum = 1.0;
        break;
      case '4:5':
        ratioNum = 4 / 5;
        break;
      case '9:16':
        ratioNum = 9 / 16;
        break;
      case '16:9':
        ratioNum = 16 / 9;
        break;
      case '3:4':
        ratioNum = 3 / 4;
        break;
      case 'a4':
        ratioNum = 1 / 1.41421356;
        break;
      default:
        ratioNum = currentWidth / currentHeight;
    }

    targetWidth = currentWidth;
    targetHeight = Math.round(currentWidth / ratioNum);
  }

  const commonHtmlToImageOptions = {
    pixelRatio,
    cacheBust: true,
    fontEmbedCSS: fontEmbedCSS || undefined,
    width: targetWidth,
    height: targetHeight,
    style:
      targetWidth && targetHeight
        ? {
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            maxWidth: 'none',
            maxHeight: 'none',
            minHeight: '0',
            minWidth: '0',
            transform: 'none',
          }
        : undefined,
    filter: (node: HTMLElement) => {
      // Exclude resize handles, selection outlines, textareas during export
      if (node.classList && node.classList.contains('export-exclude')) {
        return false;
      }
      if (node.tagName === 'TEXTAREA') {
        return false;
      }
      return true;
    },
  };

  if (options.format === 'png') {
    const dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      quality: 1,
    });
    triggerDownload(dataUrl, `${fileName}.png`);
    return dataUrl;
  }

  if (options.format === 'transparent_png') {
    const dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      backgroundColor: 'transparent',
      quality: 1,
    });
    triggerDownload(dataUrl, `${fileName}-transparent.png`);
    return dataUrl;
  }

  if (options.format === 'jpeg') {
    const dataUrl = await htmlToImage.toJpeg(element, {
      ...commonHtmlToImageOptions,
      quality: options.quality || 0.95,
      backgroundColor: '#ffffff',
    });
    triggerDownload(dataUrl, `${fileName}.jpg`);
    return dataUrl;
  }

  if (options.format === 'pdf') {
    const pageElements = Array.from(element.querySelectorAll('[data-page-index]')) as HTMLElement[];
    if (pageElements.length > 0) {
      const firstPageEl = pageElements[0];
      const pRect = firstPageEl.getBoundingClientRect();
      const finalWidth = Math.round(pRect.width) || targetWidth || 800;
      const finalHeight = Math.round(pRect.height) || targetHeight || 1131;
      const isLandscape = finalWidth > finalHeight;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [finalWidth, finalHeight],
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        const pageDataUrl = await htmlToImage.toPng(pageEl, {
          ...commonHtmlToImageOptions,
          pixelRatio: 2.5,
          quality: 1,
          width: finalWidth,
          height: finalHeight,
          style: {
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
            transform: 'none',
            maxWidth: 'none',
            maxHeight: 'none',
          },
        });

        if (i > 0) {
          pdf.addPage([finalWidth, finalHeight], isLandscape ? 'landscape' : 'portrait');
        }
        pdf.addImage(pageDataUrl, 'PNG', 0, 0, finalWidth, finalHeight);
      }

      pdf.save(`${fileName}.pdf`);
      return '';
    } else {
      const dataUrl = await htmlToImage.toPng(element, {
        ...commonHtmlToImageOptions,
        pixelRatio: 2.5,
        quality: 1,
      });

      const finalWidth = targetWidth || rect.width;
      const finalHeight = targetHeight || rect.height;
      const isLandscape = finalWidth > finalHeight;
      
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [finalWidth, finalHeight],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, finalWidth, finalHeight);
      pdf.save(`${fileName}.pdf`);
      return dataUrl;
    }
  }

  return '';
}

export async function shareCanvasImage(
  element: HTMLElement,
  title: string,
  aspectRatio?: CanvasAspectRatio
): Promise<boolean> {
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
    const fontEmbedCSS = await getBase64FontEmbedCSS();

    const targetRatio: CanvasAspectRatio =
      aspectRatio ||
      (element.getAttribute('data-aspect-ratio') as CanvasAspectRatio) ||
      'auto';

    const rect = element.getBoundingClientRect();
    const currentWidth = Math.round(rect.width) || 800;
    const currentHeight = Math.round(rect.height) || 600;

    let targetWidth: number | undefined;
    let targetHeight: number | undefined;

    if (targetRatio && targetRatio !== 'auto') {
      let ratioNum: number;
      switch (targetRatio) {
        case '1:1':
          ratioNum = 1.0;
          break;
        case '4:5':
          ratioNum = 4 / 5;
          break;
        case '9:16':
          ratioNum = 9 / 16;
          break;
        case '16:9':
          ratioNum = 16 / 9;
          break;
        case '3:4':
          ratioNum = 3 / 4;
          break;
        case 'a4':
          ratioNum = 1 / 1.41421356;
          break;
        default:
          ratioNum = currentWidth / currentHeight;
      }

      targetWidth = currentWidth;
      targetHeight = Math.round(currentWidth / ratioNum);
    }

    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: 2,
      cacheBust: true,
      fontEmbedCSS: fontEmbedCSS || undefined,
      width: targetWidth,
      height: targetHeight,
      style:
        targetWidth && targetHeight
          ? {
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              minHeight: '0',
              minWidth: '0',
              transform: 'none',
            }
          : undefined,
      filter: (node: HTMLElement) => {
        if (node.classList && node.classList.contains('export-exclude')) return false;
        if (node.tagName === 'TEXTAREA') return false;
        return true;
      },
    });

    // Convert dataUrl to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'kashur-design.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title || 'کٲشُر لیٚکھُن سٹوڈیو',
        text: 'Created with Koshur Kanvas',
        files: [file],
      });
      return true;
    } else if (navigator.share) {
      await navigator.share({
        title: title || 'کٲشُر لیٚکھُن سٹوڈیو',
        text: 'Created with Koshur Kanvas',
        url: window.location.href,
      });
      return true;
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.warn('Share error:', err);
    }
  }
  return false;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch {
    return false;
  }
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename.endsWith('.txt') ? filename : `${filename}.txt`);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function downloadDocFile(title: string, content: string, filename: string) {
  const htmlContent = `<!DOCTYPE html>
<html lang="ks" dir="rtl">
<head>
<meta charset="utf-8">
<title>${title || 'کٲشُر مسودہ'}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
body { 
  font-family: 'Noto Nastaliq Urdu', 'Gulzar', 'Amiri', serif; 
  direction: rtl; 
  text-align: right; 
  line-height: 2.4; 
  font-size: 20pt; 
  padding: 40px;
  color: #1c1917;
  background-color: #ffffff;
}
h1 { 
  font-size: 26pt; 
  color: #065f46; 
  border-bottom: 2px solid #059669; 
  padding-bottom: 12px; 
  margin-bottom: 24px; 
  font-weight: bold;
}
p {
  margin-bottom: 16px;
}
</style>
</head>
<body>
<h1>${title || 'کٲشُر مسودہ'}</h1>
<div style="white-space: pre-wrap;">${content}</div>
</body>
</html>`;
  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename.endsWith('.doc') ? filename : `${filename}.doc`);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

