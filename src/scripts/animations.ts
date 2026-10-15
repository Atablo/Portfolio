// =============================================================================
// Animaciones del portfolio con GSAP
// -----------------------------------------------------------------------------
// GSAP (GreenSock Animation Platform) anima propiedades CSS con JavaScript.
// Las tres ideas que se usan aquí:
//
//   gsap.from(el, {...})   -> el elemento EMPIEZA con esos valores y vuelve a
//                             su estado natural (el que define el CSS).
//   gsap.timeline()        -> encadena varias animaciones una detrás de otra.
//   ScrollTrigger          -> plugin que arranca (o "arrastra") una animación
//                             según la posición del scroll.
//
// "autoAlpha" = opacity + visibility. Mejor que solo opacity porque al llegar
// a 0 oculta el elemento de verdad (no se puede clicar algo invisible).
// =============================================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Los plugins hay que registrarlos una vez antes de usarlos.
gsap.registerPlugin(ScrollTrigger, SplitText);

// matchMedia ejecuta las animaciones SOLO si el usuario no ha pedido
// "reducir movimiento" en su sistema operativo (accesibilidad). Si cambia la
// preferencia, GSAP deshace automáticamente todo lo creado dentro.
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  // ---------------------------------------------------------------------------
  // 1. Barra de progreso de lectura (arriba del todo)
  // ---------------------------------------------------------------------------
  // scaleX va de 0 a 1 mientras recorres la página entera. "scrub: true" ata
  // la animación al scroll: si subes, la barra retrocede.
  gsap.to("#scroll-progress", {
    scaleX: 1,
    ease: "none", // ritmo lineal, que avance igual que el scroll
    scrollTrigger: {
      start: 0, // desde el pixel 0...
      end: "max", // ...hasta el final del documento
      scrub: true,
    },
  });

  // ---------------------------------------------------------------------------
  // 1b. Luz de fondo que cambia de color según la sección
  // ---------------------------------------------------------------------------
  // Cada sección tiene un color (sacado de la paleta de la web). Cuando una
  // sección cruza el centro de la pantalla, la luz de fondo se funde a su color.
  const glowColors: [string, string][] = [
    ["#hero", "rgba(120, 119, 198, 0.2)"], // violeta (el del fondo original)
    ["#experience", "rgba(245, 158, 11, 0.18)"], // ámbar, como la línea del timeline
    ["#projects", "rgba(16, 185, 129, 0.18)"], // verde esmeralda
    ["#about", "rgba(56, 189, 248, 0.18)"], // azul cielo
  ];

  glowColors.forEach(([section, color]) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      // onToggle salta al entrar o salir de la zona; solo actuamos al entrar
      // (bajando o subiendo). overwrite corta el fundido anterior si lo hay.
      onToggle: (self) =>
        self.isActive && gsap.to("#bg-glow", { "--glow": color, duration: 1, overwrite: "auto" }),
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Entrada del hero (lo primero que ves al cargar)
  // ---------------------------------------------------------------------------
  // SplitText trocea el saludo: envuelve cada letra en su propio elemento
  // para poder animarlas por separado. Añade un aria-label con el texto
  // completo, así los lectores de pantalla siguen leyendo "Hi! I'm Pablo".
  const greeting = SplitText.create("#hero h1", { type: "chars" });

  // Un timeline reproduce sus pasos en orden. "defaults" se aplica a todos.
  const hero = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

  hero
    // El menú baja desde arriba.
    .from("header", { y: -60, autoAlpha: 0 })
    // La foto aparece creciendo con un pequeño rebote ("back" se pasa un poco y vuelve).
    // "<" = empieza a la vez que el paso anterior.
    .from("#hero img", { scale: 0, autoAlpha: 0, ease: "back.out(1.7)" }, "<")
    // El badge entra desde la derecha. "<0.2" = empieza 0.2s después
    // del INICIO del paso anterior (se solapan, se siente más fluido).
    .from("#hero > div > a", { x: 40, autoAlpha: 0 }, "<0.2")
    // Cada letra del saludo cae desde arriba girando un poco, una tras otra.
    .from(greeting.chars, { y: -40, rotate: -20, autoAlpha: 0, stagger: 0.04, ease: "back.out(2)" }, "-=0.4")
    // Cada <span> del subtítulo se "enfoca" uno tras otro (stagger = retraso
    // entre ellos). Se usa blur y no "y" porque los <span> son inline y
    // los transform no les afectan.
    .from("#hero h2 > span", { filter: "blur(8px)", autoAlpha: 0, stagger: 0.15 }, "-=0.4")
    // Los botones sociales "saltan" en cascada.
    .from("#hero nav > *", { y: 20, autoAlpha: 0, scale: 0.8, stagger: 0.1, ease: "back.out(2)" }, "-=0.3")
    // Para terminar, la mano saluda: gira de un lado a otro desde la muñeca
    // (transformOrigin abajo a la derecha). repeat: 5 + yoyo = 6 medios giros
    // de ida y vuelta, así acaba en su posición original.
    .to("#wave", { rotate: 20, duration: 0.15, repeat: 5, yoyo: true, ease: "sine.inOut", transformOrigin: "70% 70%" }, "-=0.2");

  // Los .from() de arriba ya han puesto el hero en su estado inicial (oculto),
  // así que podemos quitar el "pending" del Layout sin que se vea un parpadeo.
  document.documentElement.classList.remove("gsap-pending");

  // ---------------------------------------------------------------------------
  // 3. Títulos de cada sección (Work experience, Projects, About me)
  // ---------------------------------------------------------------------------
  // gsap.utils.toArray convierte el resultado del selector en un array normal,
  // así cada título recibe su propio ScrollTrigger.
  gsap.utils.toArray<HTMLElement>("main section:not(#hero) > h2").forEach((title) => {
    gsap.from(title, {
      x: -60,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: title,
        // "top 85%" = cuando la parte de arriba del título llega al 85% de la
        // altura de la ventana (o sea, justo al asomar por abajo).
        start: "top 85%",
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Experiencia: la línea del timeline se "dibuja" mientras haces scroll
  // ---------------------------------------------------------------------------
  // La línea es el border-left del <ol>. En lugar de animar el borde, ocultamos
  // ese borde y animamos una línea propia (#experience-line) con scaleY.
  gsap.from("#experience-line", {
    scaleY: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "#experience ol",
      start: "top 75%",
      end: "bottom 60%",
      scrub: 0.5, // un número = la línea "persigue" al scroll con 0.5s de suavizado
    },
  });

  // Cada trabajo entra desde la derecha cuando aparece en pantalla.
  gsap.utils.toArray<HTMLElement>("#experience li").forEach((item) => {
    gsap.from(item, {
      x: 50,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: { trigger: item, start: "top 80%" },
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Proyectos: imagen y texto llegan desde lados opuestos + parallax
  // ---------------------------------------------------------------------------
  gsap.utils.toArray<HTMLElement>("#projects article").forEach((project) => {
    // Los hijos directos del <article> son: [0] bloque imagen, [1] bloque texto.
    const [imageBox, textBox] = project.children;

    // Un timeline por proyecto, disparado cuando el proyecto entra en pantalla.
    const tl = gsap.timeline({
      defaults: { duration: 0.9, ease: "power3.out" },
      scrollTrigger: { trigger: project, start: "top 80%" },
    });

    tl.from(imageBox, { x: -80, autoAlpha: 0, rotate: -3 })
      .from(textBox, { x: 80, autoAlpha: 0 }, "<0.15")
      // Las etiquetas de tecnologías aparecen "pop" una a una.
      .from(project.querySelectorAll("ul li"), { scale: 0, autoAlpha: 0, stagger: 0.06, ease: "back.out(2)" }, "-=0.5");

    // Parallax: mientras el proyecto cruza la pantalla, el bloque de la imagen
    // sube un poco más despacio que el texto, dando sensación de profundidad.
    // (Se anima el bloque y no el <img> para no pisar los scale/hover de Tailwind.)
    gsap.fromTo(
      imageBox,
      { y: 30 },
      {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: project,
          start: "top bottom", // desde que asoma por abajo...
          end: "bottom top", // ...hasta que sale por arriba
          scrub: true,
        },
      },
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Sobre mí: la foto gira hasta su sitio y los párrafos aparecen en cascada
  // ---------------------------------------------------------------------------
  const about = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: { trigger: "#about", start: "top 75%" },
  });

  about
    // La foto ya tiene rotate-3 en Tailwind; partimos de -15º y una escala
    // menor, y GSAP la lleva a su valor del CSS.
    .from("#about img", { rotate: -15, scale: 0.7, autoAlpha: 0, duration: 1, ease: "back.out(1.4)" })
    .from("#about p", { y: 30, autoAlpha: 0, stagger: 0.15, duration: 0.7 }, "<0.2");
});

// Las imágenes con loading="lazy" cargan tarde y cambian la altura de la
// página; si no recalculamos, los ScrollTrigger se dispararían en mal sitio.
document.querySelectorAll<HTMLImageElement>("main img").forEach((img) => {
  if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});
