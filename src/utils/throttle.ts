export function throttle<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let last = 0;
  let timer: number | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
      return;
    }
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      last = Date.now();
      fn(...args);
    }, wait - (now - last));
  };
}
