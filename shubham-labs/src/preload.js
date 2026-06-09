import gsap from 'gsap';

export function initPreloader(onComplete) {
  const preloader = document.getElementById('preloader');
  const progressCircle = document.getElementById('loader-progress-circle');
  const percentage = document.getElementById('loader-percentage');
  const btnEnter = document.getElementById('btn-enter');
  const subtitle = document.getElementById('loader-subtitle');

  if (!preloader) return;

  let currentProgress = 0;

  // Animate circular stroke dashoffset
  const updateProgress = () => {
    percentage.textContent = `${currentProgress}%`;
    // Circle path circumference: 2 * Math.PI * r (45) = 282.74
    const offset = 283 - (283 * currentProgress) / 100;
    progressCircle.style.strokeDashoffset = offset;
  };

  const startPreload = () => {
    // Artificial interval for fluid loader state
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        revealEnterButton();
      }
      updateProgress();
    }, 120);
  };

  const revealEnterButton = () => {
    percentage.style.opacity = '0';
    if (progressCircle) {
      progressCircle.parentElement.style.opacity = '0';
    }
    subtitle.textContent = 'SYSTEMS INITIALIZED';
    subtitle.style.color = 'var(--color-accent)';

    btnEnter.classList.remove('hidden');
    gsap.fromTo(btnEnter, 
      { scale: 0.6, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
  };

  btnEnter.addEventListener('click', () => {
    gsap.to(preloader, {
      y: '-100%',
      duration: 1.2,
      ease: 'power4.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        if (onComplete) onComplete();
      }
    });
  });

  startPreload();
}
