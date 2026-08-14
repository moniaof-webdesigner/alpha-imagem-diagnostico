"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Review } from "./reviews";
import { team } from "./team";

export { team } from "./team";

type ScanPoint = { x: number; y: number; z: number; seed: number };

export function HeroImagingCanvas() {
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const symbolRef = useRef<HTMLImageElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backCanvas = backCanvasRef.current;
    const frontCanvas = frontCanvasRef.current;
    const symbol = symbolRef.current;
    const shell = shellRef.current;
    if (!backCanvas || !frontCanvas || !symbol || !shell) return;
    const back = backCanvas.getContext("2d");
    const front = frontCanvas.getContext("2d");
    if (!back || !front) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let frameCount = 0;
    let visible = true;
    let points: ScanPoint[] = [];
    let angleY = 0;
    let angleX = 0.2;
    const orbitalRings = [
      { scale: 1.3, tiltX: 0.2, tiltZ: 0.5, speed: 0.001, angle: 0 },
      { scale: 1.45, tiltX: -0.4, tiltZ: 0.2, speed: -0.0015, angle: Math.PI / 3 },
      { scale: 1.2, tiltX: 0.5, tiltZ: -0.3, speed: 0.002, angle: Math.PI / 1.5 },
    ];
    const arcStates = [
      { progress: 0.02, speed: 0.0017 }, { progress: 0.23, speed: 0.00135 },
      { progress: 0.44, speed: 0.00155 }, { progress: 0.65, speed: 0.00125 },
      { progress: 0.82, speed: 0.0018 },
    ];

    const buildPoints = () => {
      const count = width < 500 ? 360 : width < 780 ? 520 : 800;
      const golden = Math.PI * (3 - Math.sqrt(5));
      points = Array.from({ length: count }, (_, index) => {
        const y = 1 - (index / Math.max(1, count - 1)) * 2;
        const radius = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * index;
        return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, seed: (index * 47) % 101 / 101 };
      });
    };

    const resize = () => {
      const rect = shell.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [backCanvas, frontCanvas].forEach((canvas) => {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      buildPoints();
    };

    const rotate = (point: { x: number; y: number; z: number }, yaw: number, pitch: number, roll = 0) => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const x1 = point.x * cy - point.z * sy;
      const z1 = point.x * sy + point.z * cy;
      const y1 = point.y;
      const y2 = y1 * cp - z1 * sp;
      const z2 = y1 * sp + z1 * cp;
      return { x: x1 * cr - y2 * sr, y: x1 * sr + y2 * cr, z: z2 };
    };

    const project = (point: { x: number; y: number; z: number }, radius: number, cx: number, cy: number) => {
      const perspective = 2.9 / (3.35 - point.z);
      return { x: cx + point.x * radius * perspective, y: cy + point.y * radius * perspective, z: point.z, scale: perspective };
    };

    const drawCurve = (context: CanvasRenderingContext2D, samples: Array<{ x: number; y: number; z: number }>, radius: number, cx: number, cy: number, alpha: number, layer: "back" | "front") => {
      context.beginPath();
      let drawing = false;
      samples.forEach((sample) => {
        const p = project(sample, radius, cx, cy);
        const onLayer = layer === "front" ? sample.z >= -0.035 : sample.z < 0.035;
        if (!onLayer) { drawing = false; return; }
        if (!drawing) { context.moveTo(p.x, p.y); drawing = true; } else context.lineTo(p.x, p.y);
      });
      context.strokeStyle = `rgba(218,145,212,${alpha})`;
      context.lineWidth = layer === "front" ? 0.82 : 0.62;
      context.stroke();
    };

    const drawPoints = (context: CanvasRenderingContext2D, projected: Array<{ x: number; y: number; z: number; seed: number }>, scanLineY: number, layer: "back" | "front") => {
      for (const point of projected) {
        if (layer === "front" ? point.z < 0 : point.z >= 0) continue;
        const proximity = Math.max(0, 1 - Math.abs(point.y - scanLineY) / 20);
        const depth = (point.z + 1) / 2;
        const sparkle = point.seed > 0.965 ? 0.35 : 0;
        const alpha = 0.15 + depth * 0.57 + proximity * 0.42 + sparkle;
        const size = 0.62 + depth * 1.48 + proximity * 0.65;
        context.beginPath();
        context.arc(point.x, point.y, size, 0, Math.PI * 2);
        context.fillStyle = `rgba(239,190,234,${Math.min(alpha, 0.95)})`;
        context.fill();
      }
    };

    const bezierPoint = (start: { x: number; y: number }, control: { x: number; y: number }, end: { x: number; y: number }, progress: number) => {
      const inverse = 1 - progress;
      return { x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x, y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y };
    };

    function renderGlobe(timestamp = performance.now()) {
      if (!visible) return;
      const time = timestamp / 1000;
      back.clearRect(0, 0, width, height);
      front.clearRect(0, 0, width, height);
      angleY += 0.002;
      angleX = -0.18 + Math.sin(time * 0.09) * 0.045;
      frameCount += 1;
      const sinY = Math.sin(angleY);
      const cosY = Math.cos(angleY);
      const sinX = Math.sin(angleX);
      const cosX = Math.cos(angleX);
      const rotateGlobe = (node: { x: number; y: number; z: number }) => {
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y;
        return { x: x1, y: y1 * cosX - z1 * sinX, z: y1 * sinX + z1 * cosX };
      };
      const cx = width * 0.52;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * (width < 500 ? 0.38 : 0.36);
      const scanY = Math.sin(time * 0.34) * radius * 0.7;

      const scanIntensity = Math.max(0, 1 - Math.abs(scanY) / Math.max(1, radius * 0.22));
      symbol.style.filter = `brightness(${1 + scanIntensity * 0.22}) drop-shadow(0 0 ${18 + scanIntensity * 22}px rgba(232,146,224,${0.32 + scanIntensity * 0.32}))`;

      for (let lat = -3; lat <= 3; lat++) {
        const phi = lat * Math.PI / 9;
        const samples = Array.from({ length: 65 }, (_, i) => {
          const theta = i / 64 * Math.PI * 2;
          return rotateGlobe({ x: Math.cos(phi) * Math.cos(theta), y: Math.sin(phi), z: Math.cos(phi) * Math.sin(theta) });
        });
        drawCurve(back, samples, radius, cx, cy, lat === 0 ? 0.1 : 0.055, "back");
        drawCurve(front, samples, radius, cx, cy, lat === 0 ? 0.18 : 0.095, "front");
      }
      for (let lon = 0; lon < 7; lon++) {
        const theta = lon / 7 * Math.PI * 2;
        const samples = Array.from({ length: 49 }, (_, i) => {
          const phi = -Math.PI / 2 + i / 48 * Math.PI;
          return rotateGlobe({ x: Math.cos(phi) * Math.cos(theta), y: Math.sin(phi), z: Math.cos(phi) * Math.sin(theta) });
        });
        drawCurve(back, samples, radius, cx, cy, 0.045, "back");
        drawCurve(front, samples, radius, cx, cy, 0.08, "front");
      }

      const projected = points.map((point) => {
        const rotated = rotateGlobe(point);
        return { ...project(rotated, radius, cx, cy), seed: point.seed };
      }).sort((a, b) => a.z - b.z);
      drawPoints(back, projected, cy + scanY, "back");

      orbitalRings.forEach((ring, orbitIndex) => {
        ring.angle += ring.speed;
        const samples = Array.from({ length: 90 }, (_, i) => {
          const angle = i / 89 * Math.PI * 2;
          return rotate({ x: Math.cos(angle) * ring.scale, y: Math.sin(angle) * ring.scale, z: 0 }, ring.angle, ring.tiltX, ring.tiltZ);
        });
        drawCurve(back, samples, radius, cx, cy, 0.09 - orbitIndex * 0.012, "back");
        drawCurve(front, samples, radius, cx, cy, 0.2 - orbitIndex * 0.028, "front");
        const nodeAngle = ring.angle * (2.6 + orbitIndex * 0.35) + orbitIndex * 1.9;
        const node = rotate({ x: Math.cos(nodeAngle) * ring.scale, y: Math.sin(nodeAngle) * ring.scale, z: 0 }, ring.angle, ring.tiltX, ring.tiltZ);
        const p = project(node, radius, cx, cy);
        const layer = node.z >= 0 ? front : back;
        layer.beginPath();
        layer.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        layer.fillStyle = "rgba(250,225,247,0.82)";
        layer.shadowColor = "rgba(218,87,207,0.72)";
        layer.shadowBlur = 10;
        layer.fill();
        layer.shadowBlur = 0;
      });

      const anchors = [
        { x: -0.72, y: -0.2, z: 0.58 }, { x: -0.24, y: -0.72, z: -0.48 },
        { x: 0.56, y: -0.42, z: 0.62 }, { x: 0.76, y: 0.22, z: -0.44 },
        { x: 0.04, y: 0.78, z: 0.5 }, { x: -0.68, y: 0.46, z: -0.4 },
      ].map((anchor) => rotateGlobe(anchor));
      const connections = [[0, 2], [2, 4], [4, 5], [5, 1], [1, 3]];
      connections.forEach(([from, to], index) => {
        const start3d = anchors[from];
        const end3d = anchors[to];
        const start = project(start3d, radius, cx, cy);
        const end = project(end3d, radius, cx, cy);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const bend = (index % 2 ? -1 : 1) * radius * (0.11 + index * 0.008);
        const control = { x: (start.x + end.x) / 2 - dy / length * bend, y: (start.y + end.y) / 2 + dx / length * bend };
        const layer = (start3d.z + end3d.z) / 2 >= 0 ? front : back;
        const breathe = 0.085 + Math.max(0, Math.sin(time * 0.52 + index * 1.7)) * 0.15;
        layer.beginPath();
        layer.moveTo(start.x, start.y);
        layer.quadraticCurveTo(control.x, control.y, end.x, end.y);
        layer.strokeStyle = `rgba(228,153,221,${breathe})`;
        layer.lineWidth = 0.82;
        layer.stroke();
        const arc = arcStates[index];
        arc.progress += arc.speed;
        if (arc.progress > 1) arc.progress = 0;
        const pulse = bezierPoint(start, control, end, arc.progress);
        layer.beginPath();
        layer.arc(pulse.x, pulse.y, 2.05, 0, Math.PI * 2);
        layer.fillStyle = "rgba(255,226,251,0.88)";
        layer.shadowColor = "rgba(231,109,221,0.85)";
        layer.shadowBlur = 9;
        layer.fill();
        layer.shadowBlur = 0;
      });

      anchors.forEach((anchor) => {
        const p = project(anchor, radius, cx, cy);
        const layer = anchor.z >= 0 ? front : back;
        layer.beginPath();
        layer.arc(p.x, p.y, anchor.z >= 0 ? 2.2 : 1.55, 0, Math.PI * 2);
        layer.fillStyle = anchor.z >= 0 ? "rgba(250,220,247,.76)" : "rgba(220,151,214,.32)";
        layer.fill();
      });

      drawPoints(front, projected, cy + scanY, "front");

      backCanvas.dataset.frameCount = String(frameCount);
      backCanvas.dataset.angleY = angleY.toFixed(5);
      backCanvas.dataset.ringAngles = orbitalRings.map((ring) => ring.angle.toFixed(5)).join(",");
      backCanvas.dataset.arcProgress = arcStates.map((arc) => arc.progress.toFixed(5)).join(",");
      frame = requestAnimationFrame(renderGlobe);
    }

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(renderGlobe);
      } else cancelAnimationFrame(frame);
    }, { threshold: 0.05 });
    resizeObserver.observe(shell);
    visibilityObserver.observe(shell);
    resize();
    window.addEventListener("resize", resize, { passive: true });
    renderGlobe();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <div className="hero-imaging" ref={shellRef} aria-hidden="true"><div className="imaging-halo" /><canvas id="hero-globe" className="hero-globe-back" ref={backCanvasRef} /><div className="alpha-symbol-layer"><div className="alpha-symbol-float"><img ref={symbolRef} src="/assets/alpha-symbol-white.png" alt="" /></div></div><canvas className="hero-globe-front" ref={frontCanvasRef} /></div>;
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <a className={`logo ${inverse ? "logo-inverse" : ""}`} href="/" aria-label="Alpha Imagem e Diagnóstico - início"><img src={inverse ? "/assets/logo-branca-transparente.png" : "/assets/logo-alpha.jpg"} alt="Alpha Imagem e Diagnóstico" width="1983" height="535" /></a>;
}

export function Header({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 30); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  return <header className={`site-header ${solid || scrolled ? "is-solid" : ""} ${open ? "menu-open" : ""}`}><div className="header-inner"><Logo inverse /><nav className={`nav ${open ? "is-open" : ""}`} aria-label="Navegação principal"><a href="/#sobre" onClick={() => setOpen(false)}>Sobre</a><a href="/exames" onClick={() => setOpen(false)}>Exames</a><a href="/equipe" onClick={() => setOpen(false)}>Equipe</a><a href="/equipe-estrutura#estrutura" onClick={() => setOpen(false)}>Estrutura</a><a href="/#convenios" onClick={() => setOpen(false)}>Convênios</a><a href="/#contato" onClick={() => setOpen(false)}>Contato</a><a className="nav-patient" href="/area-do-paciente">Área do Paciente</a><a className="button button-small" href="https://wa.me/552730606900" target="_blank" rel="noopener noreferrer">Agendar exame</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}><span /><span /></button></div></header>;
}

function TeamCard({ person }: { person: (typeof team)[number] }) {
  return <article className="doctor-card"><img src={person.image} alt={person.name} width="600" height="600" loading="lazy" /><div className="doctor-copy"><p>{person.role}</p><h3>{person.name}</h3><span>{person.summary}</span></div></article>;
}

export function TeamCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const group = track.firstElementChild as HTMLElement | null;
      const loopWidth = group?.offsetWidth || 1;
      if (!pausedRef.current && !reducedMotion.matches) offsetRef.current += Math.min(now - previous, 40) * 0.028;
      previous = now;
      offsetRef.current = ((offsetRef.current % loopWidth) + loopWidth) % loopWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const move = (direction: number) => {
    const group = trackRef.current?.firstElementChild as HTMLElement | null;
    const loopWidth = group?.offsetWidth || 1;
    offsetRef.current = ((offsetRef.current + direction * 372) % loopWidth + loopWidth) % loopWidth;
  };

  return <div className="team-shell"><div className="team-controls" aria-label="Controles do carrossel"><button type="button" onClick={() => move(-1)} aria-label="Ver profissionais anteriores">←</button><button type="button" onClick={() => move(1)} aria-label="Ver próximos profissionais">→</button></div><div className="team-marquee" aria-label="Equipe médica da Alpha" onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }}><div className="team-track" ref={trackRef}>{[0, 1].map((copy) => <div className="team-group" aria-hidden={copy === 1} key={copy}>{team.map((person) => <TeamCard person={person} key={`${copy}-${person.name}`} />)}</div>)}</div></div></div>;
}

type StructureImage = { src: string; alt: string; caption: string };

export function GlobalRevealObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const registered = new Set<HTMLElement>();
    const timers: number[] = [];

    const register = (element: HTMLElement | null, variant: "up" | "left" | "right" | "scale" = "up", delay = 0) => {
      if (!element || element.closest(".hero") || registered.has(element)) return;
      element.classList.add("scroll-reveal", `reveal-${variant}`);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      registered.add(element);
    };

    const registerAll = (selector: string, variant: "up" | "left" | "right" | "scale" = "up", step = 0, start = 0) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => register(element, variant, start + index * step));
    };

    const registerChildren = (selector: string, variant: "up" | "left" | "right" | "scale" = "up", step = 90, start = 0) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((group) => {
        Array.from(group.children).forEach((child, index) => register(child as HTMLElement, variant, start + index * step));
      });
    };

    registerChildren(".section-heading > div, .faq-grid > :first-child, .patient-head, .team-page-hero .container, .inner-hero .container", "up", 95);
    registerAll(".section-heading > p", "up", 0, 170);
    registerAll(".reviews-heading > .eyebrow", "up");
    registerChildren(".reviews-title-block", "up", 95, 95);

    registerAll(".trust-grid > .trust-card", "up", 70);
    registerAll(".service-grid > .service-card", "up", 90);
    registerAll(".glass-grid > .glass-card", "up", 85);
    registerAll(".logo-grid > .plan-logo", "up", 60);
    registerAll(".faq-list > .faq-item", "up", 55);
    registerAll(".patient-cards > .patient-card", "up", 90);
    registerAll(".enriched-team-grid > .enriched-doctor", "up", 80);
    registerAll(".editorial-gallery > .editorial-gallery-item", "scale", 75);

    registerAll(".about-image", "left");
    registerChildren(".about-copy", "right", 85);
    registerChildren(".history-copy", "left", 85);
    registerAll(".history-gallery", "right", 100);
    registerChildren(".structure-editorial-heading > :first-child", "left", 90);
    registerChildren(".structure-editorial-copy", "right", 90,);
    registerChildren(".contact-copy", "left", 90);
    registerAll(".contact-form", "right", 120);
    registerAll(".team-shell", "up", 0, 150);
    registerAll(".center-action, .plan-note, .reviews-attribution, .integration-note", "up", 0, 120);
    registerChildren(".cta-inner > :first-child", "up", 90);
    registerAll(".cta-inner > :last-child", "up", 0, 300);
    registerChildren(".footer-grid", "up", 80);

    document.querySelectorAll<HTMLElement>(".exam-group").forEach((group) => {
      register(group.querySelector<HTMLElement>(".exam-title"), "left");
      register(group.querySelector<HTMLElement>(".exam-items"), "right", 100);
    });

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
      if (element.querySelector(".scroll-reveal")) element.classList.add("is-visible");
      else register(element, "up");
    });

    const elements = Array.from(registered);
    document.documentElement.classList.add("reveal-system-ready");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return () => document.documentElement.classList.remove("reveal-system-ready");
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.classList.add("is-visible");
        observer.unobserve(element);
        const delay = Number.parseInt(element.style.getPropertyValue("--reveal-delay"), 10) || 0;
        timers.push(window.setTimeout(() => {
          element.classList.remove("scroll-reveal", "reveal-up", "reveal-left", "reveal-right", "reveal-scale");
          if (!element.hasAttribute("data-reveal")) element.classList.remove("is-visible");
          element.style.removeProperty("--reveal-delay");
          element.dataset.revealed = "true";
        }, delay + 1450));
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -12% 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      document.documentElement.classList.remove("reveal-system-ready");
    };
  }, []);
  return null;
}

export function StructureGallery({ images }: { images: StructureImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const showPrevious = () => setActive((current) => current === null ? null : (current - 1 + images.length) % images.length);
  const showNext = () => setActive((current) => current === null ? null : (current + 1) % images.length);

  useEffect(() => {
    if (active === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, images.length]);

  return <>
    <div className="editorial-gallery" data-reveal>
      {images.map((image, index) => <figure className={`editorial-gallery-item gallery-item-${index + 1}`} key={image.src}>
        <button type="button" onClick={() => setActive(index)} aria-label={`Ampliar: ${image.caption}`}>
          <img src={image.src} alt={image.alt} loading="lazy" />
          <span><small>{String(index + 1).padStart(2, "0")}</small>{image.caption}</span>
        </button>
      </figure>)}
    </div>
    {active !== null && <div className="structure-lightbox" role="dialog" aria-modal="true" aria-label={`Galeria ampliada: ${images[active].caption}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
      <button className="lightbox-close" type="button" onClick={() => setActive(null)} aria-label="Fechar galeria">×</button>
      <button className="lightbox-nav lightbox-prev" type="button" onClick={showPrevious} aria-label="Imagem anterior">←</button>
      <div className="lightbox-stage" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }} onTouchStart={(event) => { touchStartRef.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartRef.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < 45) return;
        if (end < start) showNext(); else showPrevious();
      }}>
        <figure key={images[active].src}>
          <img src={images[active].src} alt={images[active].alt} />
          <figcaption><span>{String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>{images[active].caption}</figcaption>
        </figure>
      </div>
      <button className="lightbox-nav lightbox-next" type="button" onClick={showNext} aria-label="Próxima imagem">→</button>
    </div>}
  </>;
}

const faqs = [
  {
    question: "A partir de que idade devo fazer mamografia?",
    answer: [
      "Para mulheres sem sinais ou sintomas e com risco habitual, a recomendação de rastreamento pode variar conforme a diretriz adotada. No SUS, atualmente, o Ministério da Saúde recomenda mamografia de rastreamento a cada dois anos para mulheres de 50 a 74 anos.",
      "Fora dessa faixa etária, ou quando existem sintomas, alterações nas mamas ou fatores de risco específicos, a necessidade e a frequência do exame devem ser avaliadas individualmente pelo médico.",
    ],
  },
  {
    question: "Mamografia dói? Por que a mama precisa ser comprimida?",
    answer: [
      "A mamografia pode causar desconforto ou pressão durante alguns segundos, e a sensibilidade varia de pessoa para pessoa.",
      "A compressão é necessária para espalhar melhor o tecido mamário, reduzir sobreposições e permitir imagens mais nítidas. Ela também ajuda a reduzir a quantidade de radiação necessária para produzir uma imagem adequada.",
      "Se você estiver com as mamas muito sensíveis, avise a profissional responsável pelo exame.",
    ],
  },
  {
    question: "Preciso estar em jejum para fazer meu exame?",
    answer: [
      "Depende do exame.",
      "Alguns exames de ultrassonografia exigem jejum, enquanto outros não necessitam de nenhuma preparação especial.",
      "Por isso, siga sempre as orientações de preparo fornecidas pela Alpha no momento do agendamento. Se tiver alguma dúvida antes de comparecer à clínica, confirme as instruções com nossa equipe.",
    ],
  },
  {
    question: "Por que alguns ultrassons precisam de bexiga cheia?",
    answer: [
      "Em determinados exames, especialmente algumas ultrassonografias da região pélvica e abdominal, a bexiga cheia ajuda a criar uma melhor janela para a passagem das ondas de ultrassom e facilita a visualização das estruturas que precisam ser examinadas.",
      "A quantidade de água e o tempo de preparo podem variar conforme o exame. Siga as orientações recebidas no agendamento.",
    ],
  },
  {
    question: "Posso fazer mamografia se tenho prótese de silicone?",
    answer: [
      "Sim. Mulheres com próteses mamárias podem realizar mamografia.",
      "É importante informar à equipe antes do exame que você possui implantes. A técnica pode ser adaptada e podem ser realizadas incidências adicionais para permitir uma melhor avaliação do tecido mamário.",
    ],
  },
  {
    question: "Qual a diferença entre mamografia e ultrassom das mamas?",
    answer: [
      "São exames diferentes e, em muitas situações, complementares.",
      "A mamografia utiliza raios X em baixa dose e é um dos principais exames utilizados para identificar alterações nas mamas.",
      "A ultrassonografia utiliza ondas sonoras e pode ajudar na avaliação de nódulos, cistos e outras alterações do tecido mamário.",
      "Um exame não substitui necessariamente o outro. A indicação depende da idade, dos sintomas, do histórico e da avaliação médica.",
    ],
  },
  {
    question: "Preciso levar meus exames anteriores?",
    answer: [
      "Sim, sempre que possível.",
      "Levar mamografias, ultrassonografias e outros exames de imagem anteriores permite que o médico compare as imagens atuais com as anteriores e identifique possíveis mudanças ao longo do tempo.",
      "Mesmo exames realizados em outra clínica podem ser importantes para essa comparação.",
    ],
  },
  {
    question: "Vou fazer uma punção ou biópsia. Preciso de algum preparo especial?",
    answer: [
      "O preparo depende do tipo de procedimento e das condições de cada paciente.",
      "Antes de uma punção ou biópsia, a equipe pode precisar saber quais medicamentos você utiliza, especialmente anticoagulantes e outros medicamentos que possam interferir na coagulação.",
      "Não suspenda nenhum medicamento por conta própria.",
      "Siga as orientações fornecidas pela Alpha no agendamento e, caso utilize medicação contínua ou tenha alguma condição de saúde relevante para o procedimento, informe previamente à equipe.",
    ],
    emphasis: 2,
  },
];

export function FAQ() {
  const [active, setActive] = useState<number | null>(null);
  return <div className="faq-list">{faqs.map((item, index) => {
    const isActive = active === index;
    const answerId = `faq-answer-${index + 1}`;
    return <div className={`faq-item ${isActive ? "is-open" : ""}`} key={item.question}>
      <button type="button" onClick={() => setActive(isActive ? null : index)} aria-expanded={isActive} aria-controls={answerId}>
        <span>{item.question}</span><b aria-hidden="true">+</b>
      </button>
      <div className="faq-answer-wrap" id={answerId} aria-hidden={!isActive}>
        <div className="faq-answer">{item.answer.map((paragraph, paragraphIndex) => <p key={paragraph}>{item.emphasis === paragraphIndex ? <strong>{paragraph}</strong> : paragraph}</p>)}</div>
      </div>
    </div>;
  })}</div>;
}

export function ContactForm() {
  const options = ["um exame", "uma ultrassonografia", "uma mamografia", "um procedimento guiado por imagem"];
  const [interest, setInterest] = useState(options[0]);
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!selectRef.current?.contains(event.target as Node)) setSelectOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); const name = String(data.get("name") || ""); const interest = String(data.get("interest") || ""); const message = encodeURIComponent(`Olá, meu nome é ${name}. Gostaria de solicitar informações para agendar ${interest}.`); window.open(`https://wa.me/552730606900?text=${message}`, "_blank", "noopener,noreferrer"); };
  return <form className="contact-form" onSubmit={submit}><label>Seu nome<input name="name" autoComplete="name" required placeholder="Como podemos chamar você?" /></label><div className="custom-select-field"><span className="custom-select-label">Exame ou serviço de interesse</span><input type="hidden" name="interest" value={interest} /><div className={`custom-select ${selectOpen ? "is-open" : ""}`} ref={selectRef}><button type="button" className="custom-select-trigger" aria-haspopup="listbox" aria-expanded={selectOpen} onClick={() => setSelectOpen(!selectOpen)} onKeyDown={(event) => { if (event.key === "Escape") setSelectOpen(false); }}><span>{interest}</span><i aria-hidden="true">⌄</i></button>{selectOpen && <div className="custom-select-menu" role="listbox" aria-label="Exame ou serviço de interesse">{options.map((option) => <button type="button" role="option" aria-selected={interest === option} className={interest === option ? "is-selected" : ""} key={option} onClick={() => { setInterest(option); setSelectOpen(false); }}>{option}{interest === option && <span aria-hidden="true">✓</span>}</button>)}</div>}</div></div><button className="button" type="submit">Continuar pelo WhatsApp <span>↗</span></button><small>Nenhum dado clínico será solicitado ou armazenado neste site.</small></form>;
}

function ReviewStars({ rating }: { rating: number }) {
  return <span className="review-stars" aria-label={`${rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" aria-hidden="true" className={index < rating ? "is-filled" : ""}><path d="m12 2.8 2.8 5.68 6.27.91-4.54 4.42 1.07 6.24L12 17.1l-5.6 2.95 1.07-6.24-4.54-4.42 6.27-.91L12 2.8Z" /></svg>)}</span>;
}

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true"><i>G</i></span>;
}

function ReviewItem({ review, duplicate, onReadMore }: { review: Review; duplicate: boolean; onReadMore: (review: Review) => void }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const check = () => setIsClamped(text.scrollHeight > text.clientHeight + 2);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(text);
    return () => observer.disconnect();
  }, [review.text]);

  return <article className="review-item"><div className="review-author"><span className="review-avatar" aria-hidden="true">{review.author.trim().charAt(0).toUpperCase()}</span><span><strong>{review.author}</strong><small>{review.relativeTime}</small></span></div><ReviewStars rating={review.rating} /><div className="review-body"><p ref={textRef}>“{review.text}”</p>{isClamped && <button type="button" tabIndex={duplicate ? -1 : 0} onClick={() => onReadMore(review)}>Ler avaliação completa</button>}</div><div className="review-source" translate="no"><GoogleMark /><span>{review.sourceLabel}</span></div></article>;
}

export function ReviewsSection({ reviews, sourceUri }: { reviews: Review[]; sourceUri?: string }) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reviews.length === 0) return;
    const firstGroup = track.firstElementChild as HTMLElement | null;
    if (!firstGroup) return;

    let frame = 0;
    let previous = 0;
    let firstSetWidth = 0;

    const measure = () => {
      firstSetWidth = firstGroup.getBoundingClientRect().width;
      if (firstSetWidth > 0) offsetRef.current %= firstSetWidth;
    };

    const animate = (now: number) => {
      if (!previous) previous = now;
      const deltaTime = Math.min((now - previous) / 1000, 0.1);
      previous = now;

      if (firstSetWidth > 0) {
        const speed = window.innerWidth <= 620 ? 26 : window.innerWidth <= 980 ? 29 : 32;
        offsetRef.current += speed * deltaTime;
        if (offsetRef.current >= firstSetWidth) offsetRef.current %= firstSetWidth;
      }

      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      frame = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstGroup);
    measure();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [reviews.length]);

  useEffect(() => {
    if (!selectedReview) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedReview(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [selectedReview]);

  return <section className="section reviews-section" aria-labelledby="reviews-title"><div className="container reviews-heading"><p className="eyebrow">Avaliações</p><div className="reviews-title-block"><h2 id="reviews-title">O que nossos pacientes estão falando</h2><p>Experiências reais compartilhadas por quem já passou pela Alpha.</p></div></div><div className="reviews-marquee" aria-label="Avaliações de pacientes no Google"><div className="reviews-track" ref={trackRef}>{[0, 1].map((copy) => <div className="reviews-group" aria-hidden={copy === 1} key={copy}>{reviews.map((review, index) => <ReviewItem review={review} duplicate={copy === 1} onReadMore={setSelectedReview} key={`${copy}-${review.author}-${index}`} />)}</div>)}</div></div><div className="container reviews-attribution">{sourceUri ? <a href={sourceUri} target="_blank" rel="noopener noreferrer" translate="no">Ver avaliações no Google ↗</a> : <span translate="no">Avaliações reais do Google</span>}</div>{selectedReview && <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-author" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReview(null); }}><div className="review-modal-card"><button type="button" className="review-modal-close" onClick={() => setSelectedReview(null)} aria-label="Fechar avaliação">×</button><div className="review-author"><span className="review-avatar" aria-hidden="true">{selectedReview.author.trim().charAt(0).toUpperCase()}</span><span><strong id="review-modal-author">{selectedReview.author}</strong><small>{selectedReview.relativeTime}</small></span></div><ReviewStars rating={selectedReview.rating} /><p>“{selectedReview.text}”</p><div className="review-source" translate="no"><GoogleMark /><span>{selectedReview.sourceLabel}</span></div><button type="button" className="review-less" onClick={() => setSelectedReview(null)}>Mostrar menos</button></div></div>}</section>;
}

export function Footer() { return <footer><div className="footer-grid"><div><Logo inverse /><p>Precisão médica, tecnologia e acolhimento em cada etapa do seu cuidado.</p><span className="footer-cnpj">CNPJ 31.406.814/0001-54</span><div className="footer-socials" aria-label="Redes sociais da Alpha"><a href="https://www.instagram.com/alpha.imagem" target="_blank" rel="noopener noreferrer" aria-label="Instagram da Alpha Imagem e Diagnóstico"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg></a><a href="https://www.facebook.com/alphaimagemediagnostico/" target="_blank" rel="noopener noreferrer" aria-label="Facebook da Alpha Imagem e Diagnóstico"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a6 6 0 0 0-6 6v2H5v4h3v8h4v-8h4l1-4h-5v-2a2 2 0 0 1 2-2Z" /></svg></a></div></div><div><h3>Navegação</h3><a href="/exames">Exames e serviços</a><a href="/equipe">Equipe médica</a><a href="/area-do-paciente">Área do Paciente</a></div><div><h3>Contato</h3><a href="tel:+552730606900">(27) 3060-6900</a><a href="mailto:atendimento@alphadiagnostico.com">atendimento@alphadiagnostico.com</a><span>Rua Desembargador Sampaio, 177<br />Praia do Canto, Vitória - ES</span></div></div><div className="footer-bottom"><span>© 2026 Alpha Imagem e Diagnóstico</span><a href="https://wa.me/5527992750016?text=Ol%C3%A1%2C%20M%C3%B4nia%21%20Vim%20pelo%20site%20da%20Alpha%20Imagem%20e%20Diagn%C3%B3stico%20e%20gostaria%20de%20solicitar%20um%20or%C3%A7amento%2C%20por%20favor." target="_blank" rel="noopener noreferrer">Site desenvolvido por Mônia de Oliveira</a></div></footer>; }
