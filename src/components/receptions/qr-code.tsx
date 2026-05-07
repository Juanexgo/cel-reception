"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

export function QRCode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: 200,
        margin: 2,
      });
    }
  }, [value]);

  return <canvas ref={canvasRef} className="mx-auto" />;
}
