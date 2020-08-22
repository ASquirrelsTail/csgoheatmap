import App from './App.svelte';

if (localStorage.getItem('parsedFiles')) {
  const storedFiles = JSON.parse(localStorage.getItem('parsedFiles'))
  if (storedFiles[0] && !storedFiles[0].rounds)
    localStorage.clear();
}

const app = new App({
	target: document.body,
});

export default app;