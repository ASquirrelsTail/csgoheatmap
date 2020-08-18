import { writable } from 'svelte/store';

export const parsedFiles = writable(localStorage.getItem('parsedFiles') ? JSON.parse(localStorage.getItem('parsedFiles')) : []);
export const points = writable([]);
export const mapName = writable(null);
export const toasts = writable([]);
toasts.push = function(message, type) {
  this.update($toasts => {
    $toasts.push({message, type});
    return $toasts;
  });
  setTimeout(() => this.pop(), 2000);
}
toasts.pop = function() {
  this.update($toasts => $toasts.slice(1));
}
