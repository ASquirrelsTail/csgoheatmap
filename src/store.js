import { writable } from 'svelte/store';

export const parsedFiles = writable(localStorage.getItem('parsedFiles') ? JSON.parse(localStorage.getItem('parsedFiles')) : []);
export const points = writable([]);
export const mapName = writable(null);
