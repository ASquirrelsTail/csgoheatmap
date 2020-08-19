import { Buffer } from 'buffer';
import demofile from 'demofile';

export default function parseFile(file) {
  return new Promise((resolve, reject) => {
    const parsedFile = {fileName: file.name, deaths: [[], []], hits: [[], []],  players: {}};

    const demoFile = new demofile.DemoFile();
    let matchStart = false;
    let phase = 'first';
    const playerInfo = {};
    
    // Get map name from header
    demoFile.on('start', () => parsedFile.mapName = demoFile.header.mapName);

    demoFile.entities.on('create', e => {
    // When a player is created make an entry for them in playerinfo using their userId
      if (e.entity instanceof demofile.Player) {
        playerInfo[e.entity.userId] = {name: e.entity.name,
                                       userid: e.entity.userId,
                                       steam: e.entity.userInfo.friendsId};
      }
    });

    demoFile.gameEvents.on('round_start', () => {
      let changeHalf = false;
      // Check if it's half time
      if (phase !== demoFile.gameRules.phase) {
        phase = demoFile.gameRules.phase;
        changeHalf = true;
      }
      Object.keys(playerInfo).forEach(userId => {
        // Loop through players and add missing team assignments
        if (!playerInfo[userId].team) {
          const player = demoFile.entities.getByUserId(parseInt(userId));
          if (player && player.teamNumber > 1) {
            playerInfo[userId].team = player.teamNumber - 2;
          }
        } else if (changeHalf && playerInfo[userId].team) // Players that already have teams need them fliping at half time
          playerInfo[userId].team = (playerInfo[userId].team + 1) % 2;
      });
    });

    // Check once match has started
    demoFile.gameEvents.on('round_announce_match_start', () => matchStart = true);
    
    // If match is started log deaths
    demoFile.gameEvents.on('player_death', e => {
      if (matchStart) {
        const player = demoFile.entities.getByUserId(e.userid);
        if (player && playerInfo[e.userid].team >= 0) {
          const killer = demoFile.entities.getByUserId(e.attacker);
          parsedFile.deaths[playerInfo[e.userid].team].push({
            p: playerInfo[e.userid].steam,
            a: e.attacker !== 0 ? playerInfo[e.attacker].steam : null,
            pp: [parseInt(player.position.x), parseInt(player.position.y)],
            ap: killer && e.weapon !== 'inferno' && e.weapon !== 'hegrenade' ?
              [parseInt(killer.position.x), parseInt(killer.position.y)] : null,
          });
        }
      }
    });
    
    // And damage
    demoFile.gameEvents.on('player_hurt', e => {
      if (matchStart) {
        const player = demoFile.entities.getByUserId(e.userid);
        if (player && playerInfo[e.userid].team >= 0) {
          const killer = demoFile.entities.getByUserId(e.attacker);
          parsedFile.hits[playerInfo[e.userid].team].push({
            p: playerInfo[e.userid].steam,
            a: e.attacker !== 0 ? playerInfo[e.attacker].steam : null,
            d: e.dmg_health,
            pp: [parseInt(player.position.x), parseInt(player.position.y)],
            ap: killer && e.weapon !== 'inferno' && e.weapon !== 'hegrenade' ?
              [parseInt(killer.position.x), parseInt(killer.position.y)] : null,
          });
        }
      }
    });

    demoFile.on('end', () => {
      // Convert player list to format [steamId] {name, team} and add to parsed file
      Object.entries(playerInfo).forEach(entry => {
        const player = entry[1];
        parsedFile.players[player.steam] = {name: player.name, team: player.team};
      });
      console.log(parsedFile);
      // Resolve promise with parsed file
      resolve(parsedFile);
    });

    // Load file in to buffer and parse
    const fr = new FileReader();
    fr.readAsArrayBuffer(file);
    fr.onloadend = () => demoFile.parse(Buffer(fr.result));
  });
}
