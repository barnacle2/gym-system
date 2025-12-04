import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

declare global {
  interface Window {
    Html5Qrcode?: any;
  }
}

export default function QrScanner() {
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const containerId = 'qr-reader';
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Stop scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => undefined);
      }
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current.clear())
        .catch(() => undefined);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startWithHtml5Qrcode = async () => {
    setError(null);
    setLastResult(null);

    try {
      const Html5Qrcode = window.Html5Qrcode;
      if (!Html5Qrcode) {
        setError('Failed to initialize QR scanner library.');
        return;
      }

      // Discover available cameras and remember them for selection
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setError('No camera devices found.');
        return;
      }

      const mapped = devices.map((d: any) => ({ id: d.id, label: d.label || d.id }));
      setCameras(mapped);

      const cameraId = selectedCameraId ?? mapped[0].id;
      setSelectedCameraId(cameraId);

      scannerRef.current = new Html5Qrcode(containerId);
      setScanning(true);

      await scannerRef.current.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        (decodedText: string) => {
          setLastResult(decodedText);

          // Stop scanning once we have a result
          stopScanner();

          if (decodedText && /^https?:\/\//i.test(decodedText)) {
            window.location.href = decodedText;
          } else {
            setError('Scanned QR is not a valid URL.');
          }
        },
        () => {
          // ignore decode errors per frame
        },
      );
    } catch (e) {
      console.error(e);
      setError('Unable to start camera. Please check permissions and try again.');
      stopScanner();
    }
  };

  const startScan = async () => {
    if (scanning) return;

    // Load html5-qrcode from CDN if not yet available
    if (!window.Html5Qrcode) {
      setError(null);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      script.onload = () => {
        void startWithHtml5Qrcode();
      };
      script.onerror = () => {
        setError('Unable to load QR scanner library. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
      await startWithHtml5Qrcode();
    }
  };

  return (
    <>
      <Head title="QR Scanner" />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
        <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <h1 className="text-lg font-semibold tracking-wide">QR Scanner</h1>
            <a
              href="/dashboard"
              className="cursor-pointer rounded-full bg-slate-800 px-3 py-1 text-xs text-gray-200 hover:bg-slate-700"
            >
               ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/40">
            <h2 className="mb-2 text-sm font-semibold text-gray-100">Scan Member QR Code</h2>
            <p className="mb-4 text-xs text-gray-400">
              Point the camera at the member&apos;s QR code. Once detected, this page will automatically open the member&apos;s
              time tracking URL to time in or out.
            </p>

            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1">
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black/60 aspect-video">
                  <div id={containerId} className="h-full w-full" />
                  {!scanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-gray-400">
                      Camera inactive. Click &quot;Start Scanner&quot; to begin.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {!scanning ? (
                    <button
                      type="button"
                      onClick={startScan}
                      className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Start Scanner
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Stop Scanner
                    </button>
                  )}
                  {cameras.length > 0 && (
                    <select
                      value={selectedCameraId ?? cameras[0]?.id}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                    >
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="w-full max-w-xs space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                <h3 className="text-sm font-semibold text-gray-100">How it works</h3>
                <ul className="list-disc space-y-1 pl-4 text-gray-400">
                  <li>Use a device with a camera (laptop, tablet, or phone in admin view).</li>
                  <li>Press <span className="font-medium text-gray-200">Start Scanner</span> and allow camera access.</li>
                  <li>Hold the member&apos;s QR ID in front of the camera until it is detected.</li>
                  <li>
                    The scanner will open the encoded URL in this browser, which triggers the member&apos;s time in/out logic.
                  </li>
                </ul>

                {lastResult && (
                  <div className="mt-2 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-[11px] text-emerald-200">
                    <div className="font-semibold">Last scanned:</div>
                    <div className="break-all">{lastResult}</div>
                  </div>
                )}

                {error && (
                  <div className="mt-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-[11px] text-red-200">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
