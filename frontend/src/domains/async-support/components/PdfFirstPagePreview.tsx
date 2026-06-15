'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';

type PdfFirstPagePreviewProps = {
  url: string;
  title: string;
  className?: string;
};

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { url: string; disableStream?: boolean; disableAutoFetch?: boolean }) => {
    promise: Promise<{
      getPage: (pageNumber: number) => Promise<{
        getViewport: (options: { scale: number }) => {
          width: number;
          height: number;
        };
        render: (options: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void>; cancel: () => void };
      }>;
      destroy: () => Promise<void>;
    }>;
    destroy: () => Promise<void>;
  };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
    logicGatePdfJsPromise?: Promise<PdfJsLib>;
  }
}

const PDF_JS_VERSION = '3.11.174';
const PDF_JS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.min.js`;
const PDF_JS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js`;

function getPreviewPdfUrl(url: string) {
  return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
}

function loadPdfJs() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (window.logicGatePdfJsPromise) {
    return window.logicGatePdfJsPromise;
  }

  window.logicGatePdfJsPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PDF_JS_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (!window.pdfjsLib) {
          reject(new Error('PDF renderer loaded but was not available.'));
          return;
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
        resolve(window.pdfjsLib);
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('PDF renderer failed to load.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = PDF_JS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error('PDF renderer loaded but was not available.'));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('PDF renderer failed to load.'));
    document.head.appendChild(script);
  });

  return window.logicGatePdfJsPromise;
}

export function PdfFirstPagePreview({
  url,
  title,
  className,
}: PdfFirstPagePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isCancelled = false;
    let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;
    let loadedDocument: { destroy: () => Promise<void> } | null = null;

    async function renderFirstPage() {
      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (!container || !canvas) return;

      setStatus('loading');

      try {
        const pdfjsLib = await loadPdfJs();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          url: getPreviewPdfUrl(url),
          disableStream: true,
          disableAutoFetch: true,
        });
        const pdf = await loadingTask.promise;
        loadedDocument = pdf;

        const page = await pdf.getPage(1);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const containerWidth = Math.max(container.clientWidth - 4, 180);
        const deviceScale = window.devicePixelRatio || 1;
        const displayScale = containerWidth / baseViewport.width;
        const renderScale = displayScale * deviceScale;
        const viewport = page.getViewport({ scale: renderScale });
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas is not available.');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${Math.floor(viewport.width / deviceScale)}px`;
        canvas.style.height = `${Math.floor(viewport.height / deviceScale)}px`;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;

        if (!isCancelled) {
          setStatus('ready');
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('PDF preview failed:', error);
          setStatus('error');
        }
      }
    }

    void renderFirstPage();

    return () => {
      isCancelled = true;
      renderTask?.cancel();
      void loadedDocument?.destroy();
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex justify-center overflow-hidden rounded-lg bg-white shadow-sm',
        className,
      )}
      aria-label={title}
    >
      {status === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-400">
          Loading PDF preview...
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="flex aspect-[1/1.414] items-center justify-center bg-white px-4 text-center text-xs font-semibold text-slate-500">
          PDF preview unavailable
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        className={cn(
          'mx-auto block max-w-full bg-white',
          status !== 'ready' && 'opacity-0',
        )}
      />
    </div>
  );
}
