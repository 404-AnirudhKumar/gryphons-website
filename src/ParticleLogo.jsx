import { useEffect, useRef } from 'react';

export function ParticleLogo({ imageSrc }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    const pointer = { x: 0, y: 0, active: false, radius: 260, moveX: 0, moveY: 0 };
    const dpr = window.devicePixelRatio || 1;
    const image = new Image();
    const offscreen = document.createElement('canvas');
    const offscreenContext = offscreen.getContext('2d');
    let points = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;

    const randomOffset = (amount = 18) => (Math.random() - 0.5) * amount;

    const buildPoints = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.max(320, Math.floor(bounds.width));
      height = Math.max(320, Math.floor(bounds.height));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      offscreen.width = width;
      offscreen.height = height;
      offscreenContext.clearRect(0, 0, width, height);

      const margin = Math.min(width, height) * 0.14;
      const scale = Math.min(
        (width - margin * 2) / image.width,
        (height - margin * 2) / image.height,
      );
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;

      offscreenContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const imageData = offscreenContext.getImageData(0, 0, width, height).data;
      const nextPoints = [];
      const step = width < 600 ? 8 : 7;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          const alpha = imageData[index + 3];
          if (alpha < 46) {
            continue;
          }

          nextPoints.push({
            originX: x,
            originY: y,
            x: x + randomOffset(10),
            y: y + randomOffset(10),
            vx: 0,
            vy: 0,
            size: 1 + Math.random() * 1.2,
            currentSize: 1,
            drift: 1.2 + Math.random() * 3.6,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            speed: 0.8 + Math.random() * 1.3,
            glow: 0,
          });
        }
      }

      points = nextPoints;
    };

    const animate = () => {
      const time = performance.now() * 0.001;
      context.clearRect(0, 0, width, height);
      context.lineWidth = 0.6;
      pointer.moveX *= 0.82;
      pointer.moveY *= 0.82;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const targetX = point.originX + Math.sin(time * point.speed + point.phaseX) * point.drift;
        const targetY = point.originY + Math.cos(time * point.speed * 0.92 + point.phaseY) * point.drift;
        let pointerStrength = 0;
        let desiredX = targetX;
        let desiredY = targetY;
        let spring = 0.05;

        if (pointer.active) {
          const rawDx = point.x - pointer.x;
          const rawDy = point.y - pointer.y;
          const distance = Math.hypot(rawDx, rawDy);

          if (distance > 0 && distance < pointer.radius) {
            pointerStrength = (1 - distance / pointer.radius) ** 2.1;
            const nx = distance > 0.001 ? rawDx / distance : Math.cos(point.phaseX);
            const ny = distance > 0.001 ? rawDy / distance : Math.sin(point.phaseY);
            const spread = 48 + pointerStrength * 210;
            desiredX = point.originX + nx * spread;
            desiredY = point.originY + ny * spread;
            spring = 0.2;
            point.vx += nx * (2.4 + pointerStrength * 18) + pointer.moveX * 0.08 * pointerStrength;
            point.vy += ny * (2.4 + pointerStrength * 18) + pointer.moveY * 0.08 * pointerStrength;
          }
        }

        point.vx += (desiredX - point.x) * spring;
        point.vy += (desiredY - point.y) * spring;
        point.vx *= 0.88;
        point.vy *= 0.88;
        point.x += point.vx;
        point.y += point.vy;
        point.glow += (pointerStrength - point.glow) * 0.24;
        point.currentSize += ((point.size + point.glow * 2.1) - point.currentSize) * 0.22;

        for (let compare = index + 1; compare < Math.min(index + 16, points.length); compare += 1) {
          const other = points[compare];
          const distX = other.x - point.x;
          const distY = other.y - point.y;
          const distance = Math.hypot(distX, distY);

          const linkThreshold = Math.max(8, 34 - Math.max(point.glow, other.glow || 0) * 28);
          if (distance < linkThreshold) {
            const glowBoost = Math.max(point.glow, other.glow || 0) * 0.26;
            context.strokeStyle = `rgba(255,255,255,${0.24 - distance / 180 + glowBoost})`;
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }
      }

      for (const point of points) {
        context.fillStyle = `rgba(255,255,255,${0.92 + point.glow * 0.08})`;
        context.beginPath();
        context.arc(point.x, point.y, point.currentSize, 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.moveX = event.clientX - bounds.left - pointer.x;
      pointer.moveY = event.clientY - bounds.top - pointer.y;
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleResize = () => {
      buildPoints();
    };

    image.onload = () => {
      buildPoints();
      animate();
    };
    image.src = imageSrc;

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerenter', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerenter', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [imageSrc]);

  return (
    <div className="particle-shell" ref={containerRef}>
      <canvas className="particle-canvas" ref={canvasRef} />
      <div className="particle-glow" />
    </div>
  );
}
