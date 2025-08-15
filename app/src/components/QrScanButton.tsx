"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { QrCodeIcon } from "lucide-react";

export default function QrScanButton() {
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedText, setScannedText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const handleDialogClose = (open: boolean) => {
    setShowQrDialog(open);
  };

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraAndScan = useCallback(async () => {
    setError(null);
    setScannedText(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      // Use BarcodeDetector if available
      type Barcode = { rawValue?: string; raw?: string };
      type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Barcode[]>;
      };
      const BD = (
        window as unknown as {
          BarcodeDetector?: BarcodeDetectorCtor;
        }
      ).BarcodeDetector;
      if (!BD) {
        setError(
          "BarcodeDetector API is not available in this browser. Try Chrome/Edge or install a QR library."
        );
        return;
      }
      const detector = new BD({ formats: ["qr_code"] });
      scanningRef.current = true;

      const loop = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          // Only attempt detection when video has enough data
          if (video.readyState >= 2) {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const first = barcodes[0];
              const value: string = first.rawValue ?? first.raw ?? "";
              if (value) {
                console.log("QR scanned:", value);
                setScannedText(value);

                try {
                  const response = await fetch("/api/mark-attendance", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ qrValue: value }),
                  });
                  if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to mark attendance.");
                  }
                } catch (error) {
                  setError("An unexpected error occurred.");
                  console.error(error);
                }

                // Stop after first successful scan
                stopCamera();
                return;
              }
            }
          }
        } catch (e: unknown) {
          // Some implementations throw when no barcode is found; ignore
          const obj = (e ?? {}) as Record<string, unknown>;
          const name = typeof obj.name === "string" ? obj.name : undefined;
          if (name && name !== "NotFoundError") console.error(e);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e: unknown) {
      const obj = (e ?? {}) as Record<string, unknown>;
      const name = typeof obj.name === "string" ? obj.name : undefined;
      const message = typeof obj.message === "string" ? obj.message : undefined;
      const msg =
        name === "NotAllowedError"
          ? "Camera permission was denied."
          : message || "Failed to start camera.";
      setError(msg);
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (showQrDialog) {
      startCameraAndScan();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showQrDialog, startCameraAndScan, stopCamera]);

  return (
    <>
      <Button
        onClick={() => setShowQrDialog(true)}
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50"
      >
        <QrCodeIcon className="size-9" />
      </Button>

      <Dialog open={showQrDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm sm:max-w-md w-full p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center">QR Scanner</DialogTitle>
            <DialogDescription className="text-center">
              Point your camera at a QR code. We&apos;ll stop after the first
              scan.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full">
            <div className="relative w-full aspect-[3/4] bg-black/80 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              {/* Simple viewfinder overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white/70 rounded-lg w-3/4 h-1/2" />
              </div>
            </div>
            {/* {scannedText && (
              <p className="mt-3 text-sm text-green-600 break-all">
                Scanned: {scannedText}
              </p>
            )} */}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              {!scannedText && (
                <Button
                  onClick={() => {
                    // restart scanning if previously errored
                    stopCamera();
                    startCameraAndScan();
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Restart
                </Button>
              )}
              {scannedText && (
                <Button
                  onClick={() => {
                    setScannedText(null);
                    stopCamera();
                    startCameraAndScan();
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Scan again
                </Button>
              )}
              <Button
                onClick={() => setShowQrDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
