// Tiny global store backing Alert.alert → <DialogHost/>
let listeners = new Set();
let queue = [];

export function showDialog(d) {
  queue = [...queue, { id: Date.now() + Math.random(), ...d }];
  listeners.forEach((l) => l(queue));
}
export function closeDialog(id) {
  queue = queue.filter((d) => d.id !== id);
  listeners.forEach((l) => l(queue));
}
export function subscribe(fn) {
  listeners.add(fn);
  fn(queue);
  return () => listeners.delete(fn);
}
