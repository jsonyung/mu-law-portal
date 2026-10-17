/** Body scroll lock with position restore (supports nested open/close). */

let lockCount = 0;
let savedScrollY = 0;
let touchMoveBlocker = null;

function onTouchMoveBlock(e) {
  const scrollRoot = document.getElementById('mobile-nav-scroll');
  if (scrollRoot && scrollRoot.contains(e.target)) return;
  e.preventDefault();
}

export function lockBodyScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.classList.add('mobile-nav-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    touchMoveBlocker = onTouchMoveBlock;
    document.addEventListener('touchmove', touchMoveBlocker, { passive: false });
  }
  lockCount += 1;
}

export function unlockBodyScroll() {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  if (touchMoveBlocker) {
    document.removeEventListener('touchmove', touchMoveBlocker);
    touchMoveBlocker = null;
  }

  document.body.classList.remove('mobile-nav-open');
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, savedScrollY);
}

/** @internal test helper */
export function resetScrollLockForTests() {
  lockCount = 0;
  savedScrollY = 0;
  if (touchMoveBlocker) {
    document.removeEventListener('touchmove', touchMoveBlocker);
    touchMoveBlocker = null;
  }
  document.body.classList.remove('mobile-nav-open');
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
}
