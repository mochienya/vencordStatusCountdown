import { powerMonitor } from "electron";

// like setInterval, but it resumes the interval following system sleep
export function setSafeInterval(_, handler: () => void, delay: number): void {
  let interval: NodeJS.Timeout
  const createInterval = () => interval = setInterval(handler, delay)

  createInterval();
  powerMonitor.addListener('suspend', () => clearInterval(interval));
  powerMonitor.addListener('resume', createInterval);
}
