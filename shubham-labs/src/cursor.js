import gsap from 'gsap';

export function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');
  const links = document.querySelectorAll('a, button, .menu-link');

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let dotPos = { x: mouse.x, y: mouse.y };
  let ringPos = { x: mouse.x, y: mouse.y };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Ticker loop for interpolation (lerp)
  gsap.ticker.add(() => {
    dotPos.x += (mouse.x - dotPos.x) * 0.35;
    dotPos.y += (mouse.y - dotPos.y) * 0.35;
    dot.style.left = `${dotPos.x}px`;
    dot.style.top = `${dotPos.y}px`;

    ringPos.x += (mouse.x - ringPos.x) * 0.12;
    ringPos.y += (mouse.y - ringPos.y) * 0.12;
    ring.style.left = `${ringPos.x}px`;
    ring.style.top = `${ringPos.y}px`;
  });

  // Hover animations
  const addHover = (elements) => {
    elements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('hovering');
      });
    });
  };

  addHover(links);

  // Return binder interface to register dynamically rendered 3D nodes
  return {
    bindHover: (elements) => {
      addHover(elements);
    }
  };
}
