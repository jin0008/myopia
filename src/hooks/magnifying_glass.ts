import { useEffect, useState } from "react";

export function useMagnifyingGlass({
  canvas,
  zoom,
  height,
  width,
}: {
  canvas: HTMLCanvasElement;
  zoom: number;
  height: number;
  width: number;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }, [canvas, zoom, height, width]);
}
