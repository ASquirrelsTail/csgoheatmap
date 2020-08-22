<script>
  import parseFile from '../utils/parseFile.js';
  import { parsedFiles, mapName, toasts } from '../store.js'

  let dragging = false;
  let parsing = false;

  let form;

  function addFiles(files) {
    parsing = true;
    const filePromises = [...files]
      .filter(file => !$parsedFiles.some(parsed => parsed.fileName === file.name)) // Check files haven't already been parsed, then parse them
      .map(file => parseFile(file));

    if (filePromises.length < files.length)
      toasts.push(`${files.length - filePromises.length} demos already parsed.`, 'success');
    if (filePromises.length > 0) {
      toasts.push(`Parsing ${filePromises.length} files...`, 'success');

      filePromises.forEach(filePromise => filePromise.then(file => {
        $parsedFiles.push(file);
        $parsedFiles = $parsedFiles;
        toasts.push(`Successfully finished parsing ${file.fileName}.`, 'success');
      }).catch(error => toasts.push(error, 'error')));
      Promise.allSettled(filePromises)
        .then(finishedFiles => {
          parsing = false;
          form.reset();

          const succededFiles = finishedFiles.filter(result => result.status === 'fulfilled').length;
          const failedFiles = finishedFiles.length - succededFiles;
          toasts.push(`Successfully parsed ${succededFiles} files.`, 'success');
          if (failedFiles) toasts.push(`Failed to parse ${failedFiles} files.`, 'error');

          // Store all/updated parsed files to storage
          localStorage.setItem('parsedFiles', JSON.stringify($parsedFiles));
        });
    } else {
      parsing = false;
      form.reset();
    }
  }

  function dropFiles(e) {
    dragging = false;
    const validFiles = [...e.dataTransfer.files].filter(file => file.name.slice(-4) === '.dem');
    if (validFiles.length > 0) addFiles(validFiles);
    else toasts.push('Please select valid CSGO demo files ending in ".dem".', 'error');
  }

</script>

<svelte:body on:dragenter|preventDefault="{() => dragging = true}"
  on:dragover|preventDefault="{() => dragging = true}"/>

<form id="upload-form" bind:this={form}>
  <label for="file-upload" class:spinner={parsing}>
    Upload{#if parsing}ing{/if} demo files
    <input type="file" accept=".dem" id="file-upload" multiple
      disabled={parsing} on:change="{e => addFiles(e.target.files)}">
  </label>
</form>

{#if dragging}
  <div id="drag-files" on:dragleave|preventDefault="{() => dragging = false}"
    on:drop|preventDefault={dropFiles}>
    <div id="drag-files-inner">
      <div id="drop-message">
        Drop .dem files to upload.
      </div>
    </div>
  </div>
{/if}


<style>
  #upload-form {
    position: relative;
  }

  label {
    padding: 0.4em;
    padding-top: 0.3em;
    margin: 0 1em 0 0;
    box-sizing: border-box;
    border: 1px solid #666;
    border-radius: 2px;
    font-size: 1.2em;
    color: #ccc;
    background-color: #273233;
    outline: none;
  }

  #file-upload {
    width: 1px;
    height: 1px;
    opacity: 0;
    padding: 0;
    margin: 0;
  }

  label.spinner {
    color: #999;
    background-color: #565656;
  }

  @keyframes dots {
    0% {
      content: '';
    }
    25% {
      content: '.';
    }
    50% {
      content: '..';
    }
    75% {
      content: '...';
    }
  }

  label.spinner:after {
    display: inline-block;
    content: '...';
    margin-left: -0.3em;
    width: 1em;
    animation-duration: 1.2s;
    animation-name: dots;
    animation-iteration-count: infinite;
  }

  #drag-files {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    padding: 2rem
  }

  #drag-files-inner {
    width: 100%;
    height: 100%;
    border: 2px solid #ccc;
    border-radius: 1rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  #drop-message {
    font-size: 2.4em;
  }

  #drop-message:before {
    content: '+';
    display: block;
    margin: -0.3em;
    text-align: center;
    font-size: 6em;
  }
</style>
