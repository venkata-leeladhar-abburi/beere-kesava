/**
 * A tiny pub/sub tracking how long the oldest in-flight request has been
 * running. Lives outside React (client.ts is used by plain modules and
 * contexts, not only components) and is read by the useSlowNetwork hook.
 *
 * The point is the difference between "loading" and "loading for an
 * uncomfortably long time". A skeleton is reassuring for a second and
 * alarming after eight — at that point the user needs to be told the app is
 * still trying, not left guessing whether it has hung. On the 2G-ish
 * connections the shop floor actually runs on, that is the common case.
 */
const SLOW_THRESHOLD_MS = 4_000;

type Listener = (isSlow: boolean) => void;

const inFlight = new Map<number, number>();
const listeners = new Set<Listener>();
let nextId = 0;
let isSlow = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit(next: boolean) {
  if (next === isSlow) return;
  isSlow = next;
  listeners.forEach((listener) => listener(isSlow));
}

function evaluate() {
  if (inFlight.size === 0) {
    if (timer) clearTimeout(timer);
    timer = undefined;
    emit(false);
    return;
  }

  const oldest = Math.min(...Array.from(inFlight.values()));
  const elapsed = Date.now() - oldest;
  if (elapsed >= SLOW_THRESHOLD_MS) {
    emit(true);
    return;
  }

  if (timer) clearTimeout(timer);
  timer = setTimeout(evaluate, SLOW_THRESHOLD_MS - elapsed);
}

export function notifyRequestStarted(): number {
  const id = nextId++;
  inFlight.set(id, Date.now());
  evaluate();
  return id;
}

export function notifyRequestSettled(id: number): void {
  inFlight.delete(id);
  evaluate();
}

export function subscribeToSlowNetwork(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIsSlowNetwork(): boolean {
  return isSlow;
}

export const SLOW_NETWORK_THRESHOLD_MS = SLOW_THRESHOLD_MS;
