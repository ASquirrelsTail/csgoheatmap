<script>
  import parseFile from '../utils/parseFile.js';
  import { parsedFiles, mapName, toasts } from '../store.js'
  
  let form;
  let files;
  let parsing = false;

  function addFiles() {
    parsing = true;
    const filePromises = [...files]
      .filter(file => !$parsedFiles.some(parsed => parsed.fileName === file.name)) // Check files haven't already been parsed, then parse them
      .map(file => parseFile(file));
    filePromises.forEach(filePromise => filePromise.then(file => {
      $parsedFiles.push(file);
      $parsedFiles = $parsedFiles;
      toasts.push(`Successfuly finished parsing ${file.fileName}.`, 'success');
    }));
    Promise.allSettled(filePromises)
      .then(finishedFiles => {
        parsing = false;
        form.reset();

        const succededFiles = finishedFiles.filter(result => result.status === 'fulfilled').length;
        const failedFiles = finishedFiles.length - succededFiles;
        toasts.push(`Successfuly parsed ${succededFiles} files.`, 'success');
        if (failedFiles) toasts.push(`Failed to parse ${failedFiles} files.`, 'error');

        // Store all/updated parsed files to storage
        localStorage.setItem('parsedFiles', JSON.stringify($parsedFiles));
      });
  }

</script>

<form id="upload-form" class:spinner={parsing} bind:this={form}>
  <label for="file-upload">Upload demo files</label>
  <input type="file" accept=".dem" id="file-upload" multiple
    bind:files disabled={parsing} on:change={addFiles}>
  <button on:click|preventDefault="{() => form.reset()}" disabled={parsing}>Clear</button>
</form>

<style>
  #upload-form {
    position: relative;
  }

  @keyframes pulse {
    from {
      width: 2em;
      height: 2em;
    }

    to {
      width: 5em;
      height: 5em;
    }
  }

  #upload-form.spinner:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4em;
    height: 4em;
    border-radius: 50%;
    background-color: rgba(100, 100, 100, 0.5);
    transform: translate(-50%, -50%);
    animation-duration: 0.4s;
    animation-name: pulse;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    animation-timing-function: ease-in-out;
  }
</style>
