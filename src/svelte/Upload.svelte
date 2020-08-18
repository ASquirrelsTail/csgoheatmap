<script>
  import parseFile from '../utils/parseFile.js';
  import { parsedFiles, mapName } from '../store.js'
  
  let form;
  let files;
  let parsing = false;

  function addFiles() {
    parsing = true;
    const filePromises = [...files]
      .filter(file => !$parsedFiles.some(parsed => parsed.fileName === file.name)) // Check files haven't already been parsed, then parse them
      .map(file => parseFile(file));
    Promise.all(filePromises)
      .then(finishedFiles => finishedFiles.forEach(file => $parsedFiles.push(file)))
      .then(() => {
        parsing = false;
        $parsedFiles = $parsedFiles;
        // Set the map if it's not set
        if (!$mapName && $parsedFiles.length > 0) $mapName = $parsedFiles[0].mapName;
        form.reset();
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
