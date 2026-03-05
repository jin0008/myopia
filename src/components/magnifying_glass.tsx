import { useEffect, useState, useRef, useCallback } from "react";

export function MagnifyingGlass({
  targetCanvas,
  zoom,
  height,
  width,
}: {
  targetCanvas: HTMLCanvasElement | null;
  zoom: number;
  height: number;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMouseOnCanvas, setIsMouseOnCanvas] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const drawMagnifyingGlass = useCallback(
    (x: number, y: number) => {
      if (!targetCanvas) return;
      const canvasContext = canvasRef.current?.getContext("2d");
      if (!canvasContext) return;

      // Convert display coordinates to canvas buffer coordinates
      const rect = targetCanvas.getBoundingClientRect();
      const scaleX = targetCanvas.width / rect.width;
      const scaleY = targetCanvas.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;

      // Source region: centered at cursor, size = magnifying glass / zoom
      const sourceWidth = (width * scaleX) / zoom;
      const sourceHeight = (height * scaleY) / zoom;
      const sourceX = canvasX - sourceWidth / 2;
      const sourceY = canvasY - sourceHeight / 2;

      canvasContext.clearRect(0, 0, width, height);
      canvasContext.drawImage(
        targetCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      );
    },
    [targetCanvas, zoom, height, width],
  );

  useEffect(() => {
    if (!targetCanvas) return;
    const handleMouseMove = (e: MouseEvent) => {
      //get the position of the mouse relative to the target canvas
      const x = e.offsetX;
      const y = e.offsetY;
      setPosition({ x, y });
      drawMagnifyingGlass(x, y);
    };
    const handleMouseLeave = () => {
      setIsMouseOnCanvas(false);
    };
    const handleMouseEnter = () => {
      setIsMouseOnCanvas(true);
    };
    const handleMouseDown = () => {
      setIsMouseDown(true);
    };
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    targetCanvas.addEventListener("mousedown", handleMouseDown);
    targetCanvas.addEventListener("mouseup", handleMouseUp);
    targetCanvas.addEventListener("mousemove", handleMouseMove);
    targetCanvas.addEventListener("mouseleave", handleMouseLeave);
    targetCanvas.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      targetCanvas.removeEventListener("mousedown", handleMouseDown);
      targetCanvas.removeEventListener("mouseup", handleMouseUp);
      targetCanvas.removeEventListener("mousemove", handleMouseMove);
      targetCanvas.removeEventListener("mouseleave", handleMouseLeave);
      targetCanvas.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [targetCanvas, drawMagnifyingGlass]);

  if (!targetCanvas) return null;

  const targetCanvasPosition = targetCanvas.getBoundingClientRect();

  return (
    <canvas
      width={width}
      height={height}
      style={{
        pointerEvents: "none",
        display: isMouseOnCanvas && isMouseDown ? "block" : "none",
        position: "fixed",
        zIndex: 1000,
        top: targetCanvasPosition.top + position.y - height / 2,
        left: targetCanvasPosition.left + position.x - width / 2,
        width: width,
        height: height,
        border: "1px solid black",
        backgroundColor: "white",
      }}
      ref={canvasRef}
    />
  );
}
