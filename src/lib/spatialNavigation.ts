/**
 * Spatial Navigation System for Android TV and D-Pad Remotes
 * Native focus-based coordinate comparison algorithm.
 */

// Selector for focusable elements
const FOCUSABLE_SELECTOR = 'a, button, input:not([type="hidden"]), select, textarea, [tabindex="0"], [role="button"], .tv-focusable';

// Check if element is truly visible and interactable in browser rendering tree
function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  
  // Track ancestors to make sure none are hidden
  let parent = el.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return false;
    }
    parent = parent.parentElement;
  }
  return true;
}

// Distance scoring algorithm for spatial navigation directions
function getScore(activeRect: DOMRect, candRect: DOMRect, direction: string): number {
  const cxActive = activeRect.left + activeRect.width / 2;
  const cyActive = activeRect.top + activeRect.height / 2;
  
  const cxCand = candRect.left + candRect.width / 2;
  const cyCand = candRect.top + candRect.height / 2;
  
  const dx = cxCand - cxActive;
  const dy = cyCand - cyActive;
  
  const penaltyFactor = 3.0; // Penalize orthogonal deviation to favor straight lines (rows/columns)

  switch (direction) {
    case 'right':
      if (dx <= 1) return Infinity; // Candidate is to the left or same column
      return dx + Math.abs(dy) * penaltyFactor;
      
    case 'left':
      if (dx >= -1) return Infinity; // Candidate is to the right or same column
      return Math.abs(dx) + Math.abs(dy) * penaltyFactor;
      
    case 'down':
      if (dy <= 1) return Infinity; // Candidate is above or same row
      return dy + Math.abs(dx) * penaltyFactor;
      
    case 'up':
      if (dy >= -1) return Infinity; // Candidate is below or same row
      return Math.abs(dy) + Math.abs(dx) * penaltyFactor;
      
    default:
      return Infinity;
  }
}

// Global spatial navigation navigation handler
export function initSpatialNavigation() {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    
    // 1. Manage Remote Back/Close Buttons (Escape, Backspace)
    if (key === 'Escape' || key === 'Backspace') {
      // If we are currently typing in an input field, let backspace act as deleting letters first
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (key === 'Backspace' && (activeEl as HTMLInputElement).value.length > 0) {
          // Allow native backspace on inputs
          return;
        }
      }

      // Check if details popup or panels are open. Close them by triggering clicks on their designated close buttons:
      const closeButtons = [
        document.getElementById('movie-details-close-button'),
        document.getElementById('ai-close-button'),
        document.getElementById('search-close-button'),
        document.querySelector('.tv-close-button'),
        document.querySelector('[aria-label="Close"]'),
      ];

      for (const btn of closeButtons) {
        if (btn && isVisible(btn as HTMLElement)) {
          (btn as HTMLElement).click();
          e.preventDefault();
          return;
        }
      }

      // Otherwise if a watch trailer or trailer overlay is on, or simply navigating back in routes
      // Native back navigation to previous route
      if (window.location.pathname.startsWith('/watch')) {
        const lastCatalogPath = sessionStorage.getItem('lastCatalogPath') || '/';
        if ((window as any).customNavigate) {
          (window as any).customNavigate(lastCatalogPath);
        } else {
          window.location.href = lastCatalogPath;
        }
        e.preventDefault();
      } else if (window.location.pathname !== '/') {
        window.history.back();
        e.preventDefault();
      }
      return;
    }

    // 2. Manage D-Pad Directional Arrows (Up, Down, Left, Right)
    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    if (!isArrow) return;

    const directionMap: Record<string, string> = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
    };
    
    const direction = directionMap[key];
    const active = document.activeElement as HTMLElement;

    // Get all focusable elements
    const candidates = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
    const visibleCandidates = candidates.filter(cand => cand !== active && isVisible(cand));

    if (visibleCandidates.length === 0) return;

    let target: HTMLElement | null = null;

    if (!active || active === document.body || !isVisible(active)) {
      // Find candidate closest to top-left of viewport when starting focus
      let bestDist = Infinity;
      for (const cand of visibleCandidates) {
        const rect = cand.getBoundingClientRect();
        const dist = Math.sqrt(rect.left * rect.left + rect.top * rect.top);
        if (dist < bestDist) {
          bestDist = dist;
          target = cand;
        }
      }
    } else {
      // Find candidate with lowest deviation distance score
      const activeRect = active.getBoundingClientRect();
      let bestScore = Infinity;
      
      for (const cand of visibleCandidates) {
        const candRect = cand.getBoundingClientRect();
        const score = getScore(activeRect, candRect, direction);
        if (score < bestScore) {
          bestScore = score;
          target = cand;
        }
      }
    }

    if (target) {
      e.preventDefault();
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };

  const handleEnterClick = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      const active = document.activeElement as HTMLElement;
      if (active && active !== document.body) {
        const tag = active.tagName.toLowerCase();
        // Trigger programmatic click on divs / cards with tabIndex = 0 that don't trigger native form submissions
        if (tag !== 'button' && tag !== 'input' && tag !== 'a') {
          e.preventDefault();
          active.click();
        }
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keydown', handleEnterClick);

  // Return a cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keydown', handleEnterClick);
  };
}
