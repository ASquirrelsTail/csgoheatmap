<script>
  import { parsedFiles, points, mapName} from '../store.js'
  import mapData from '../mapdata.js';

  let selectedFiles = [];
  let filesToFilter = [];
  let maps = new Set();
  let players = [];
  let selectedPlayer;
  let group = 0;

  let metric = 2;
  let team = false;

  let total = 0;
  let games = 0;
  let wins = 0;
  let rounds = 0;
  let roundWins = 0;

  function runFilters() {
    const metricSet = metric % 2 ? 'hits' : 'deaths';
    const dealt = !Math.floor(metric / 2);
    const role = dealt ? 'a' : 'p';

    const filteredFiles = filesToFilter.filter(file => file.mapName === $mapName &&
                              (!selectedPlayer || selectedPlayer in file.players));
    
    // If a specific player's team or opponents are selected
    if (selectedPlayer && group > 0) {
      $points = [].concat(...filteredFiles.map(file => {
        let playerTeam;
        if (group === 1) playerTeam = file.players[selectedPlayer].team;
        else playerTeam = (file.players[selectedPlayer].team + 1) % 2;
        let teamPlayers = Object.keys(file.players)
                                .filter(playerId => file.players[playerId].team === playerTeam)
                                .map(playerId => parseInt(playerId));
        if (team === false) // Use all team data
          return file[metricSet][0].concat(file[metricSet][1])
                                   .filter(event => teamPlayers.includes(event[role]));
        else // Select team
          return file[metricSet][(dealt + team) % 2].filter(event => teamPlayers.includes(event[role])); 
      }));
    } else {
      // Select events type, deaths/hits and team, t/ct/all
      let events;
      if (team === false) // Use all team data
        events = filteredFiles.map(file => file[metricSet][0].concat(file[metricSet][1]));
      else // Select team
        events = filteredFiles.map(file => file[metricSet][(dealt + team) % 2]); // Invert team if we are looking at damage dealt
      if (selectedPlayer) $points = [].concat(...events).filter(event => event[role] === selectedPlayer);
      else $points = [].concat(...events)
    }
    
    // Pull stats
    total = $points.reduce((acc, point) => acc + (point.d ? point.d : 1), 0);
    games = filteredFiles.length;
    if (!selectedPlayer) {
      rounds = filteredFiles.reduce((acc, game) => acc + game.rounds, 0);
      wins = false;
      roundWins = false;
    } else {
      wins = filteredFiles.reduce((acc, game) =>
                ((game.players[selectedPlayer].team === game.winner && group !== 2) ||
                 (game.players[selectedPlayer].team !== game.winner && group === 2)) ?
                acc + 1 : acc, 0);
      if (team === false) {
        rounds = filteredFiles.reduce((acc, game) => acc + game.rounds, 0);
        roundWins = filteredFiles.reduce((acc, game) => {
          let playerTeam;
          if (group === 2) playerTeam = (game.players[selectedPlayer].team + 1) % 2;
          else playerTeam = game.players[selectedPlayer].team;
          return game.scores[playerTeam].ct + game.scores[playerTeam].t + acc;
        }, 0);
      } else {
        rounds = filteredFiles.reduce((acc, game) => {
          if (game.rounds < 15) {
            if ((team === game.players[selectedPlayer].team && group !== 2) ||
                (team !== game.players[selectedPlayer].team && group === 2))
              return acc + game.rounds;
            else return acc;
          }
          if ((team !== game.players[selectedPlayer].team && group !== 2) ||
              (team === game.players[selectedPlayer].team && group === 2))
            return 15 + acc;
          else return game.rounds - 15 + acc;
        }, 0);
        roundWins = filteredFiles.reduce((acc, game) => {
          let playerTeam;
          if (group === 2) playerTeam = (game.players[selectedPlayer].team + 1) % 2;
          else playerTeam = game.players[selectedPlayer].team;
          return (team === 1 ? game.scores[playerTeam].ct : game.scores[playerTeam].t) + acc;
        }, 0);
      }
    }
  }

  $: {
    filesToFilter = selectedFiles.length ? selectedFiles : $parsedFiles;
    maps = new Set(filesToFilter.map(file => file.mapName));
    if ((!$mapName || !maps.has($mapName)) && filesToFilter.length > 0) $mapName = filesToFilter[0].mapName;
    players = Object.entries(Object.assign({}, ...filesToFilter.filter(file => file.mapName === $mapName)
                                                            .map(file => file.players)))
      .map(player => { return {id: parseInt(player[0]), name: player[1].name}})
      .filter(player => player.id > 40);
    if (!players.some(player => player.id === selectedPlayer)) selectedPlayer = false;
    runFilters();
  }

</script>

<label for="files">Demo Files</label>
<select multiple id="files" bind:value={selectedFiles}>
  {#each $parsedFiles as file}
    <option value={file}>
      {file.fileName} - {file.mapName}
    </option>
  {/each}
</select>

<label for="map">Map:</label>
<select id="map" bind:value={$mapName}>
  {#each Object.keys(mapData) as map}
    <option value={map} disabled={!maps.has(map)}>
      {map}
    </option>
  {/each}
</select>

<br>

<label for="players">Players</label>
<select id="players" bind:value={selectedPlayer}>
  <option value={false}>All</option>
  {#each players as player}
    <option value={player.id}>
      {player.name}
    </option>
  {/each}
</select>
<button on:click="{() => {group = 0; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 0}">Solo</button>
<button on:click="{() => {group = 1; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 1}">Team</button>
<button on:click="{() => {group = 2; runFilters()}}" disabled={!selectedPlayer}
  class:selected="{selectedPlayer && group === 2}">Opponents</button>

<br>

<button on:click="{() => {metric = 0; runFilters()}}" class:selected="{metric === 0}">Kills</button>
<button on:click="{() => {metric = 1; runFilters()}}" class:selected="{metric === 1}">Damage Dealt</button>
<br>
<button on:click="{() => {metric = 2; runFilters()}}" class:selected="{metric === 2}">Deaths</button>
<button on:click="{() => {metric = 3; runFilters()}}" class:selected="{metric === 3}">Damage Taken</button>

<br>

<button on:click="{() => {team = 0; runFilters()}}" class:selected="{team === 0}">T</button>
<button on:click="{() => {team = 1; runFilters()}}" class:selected="{team === 1}">CT</button>
<button on:click="{() => {team = false; runFilters()}}" class:selected="{team === false}">All</button>

<br>

<p>
  {total} total {['kills', 'damage dealt', 'deaths', 'damage taken'][metric]}
  <br>
  {games} games {#if !isNaN(wins)}({wins} wins){/if}
  <br>
  {rounds} rounds {#if !isNaN(roundWins)}({roundWins} wins){/if}
</p>
