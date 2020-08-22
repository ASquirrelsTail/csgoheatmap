import { Buffer } from 'buffer';
import demofile from 'demofile';

export default function parseFile(file) {
  return new Promise((resolve, reject) => {
    const parsedFile = {fileName: file.name, deaths: [[], []], hits: [[], []],  players: {}};

    const demoFile = new demofile.DemoFile();
    let matchStart = false;
    let phase = 'first';
    let round = 1;
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
      if (matchStart) round++;
      let changeHalf = false;
      // Check if it's half time
      if (phase !== demoFile.gameRules.phase) {
        phase = demoFile.gameRules.phase;
        changeHalf = true;

        const teams = demoFile.teams.slice(2);
        parsedFile.scores = [{ct: teams[1].score}, {t: teams[0].score}];
      }
      Object.keys(playerInfo).forEach(userId => {
        // Loop through players and add missing team assignments
        if (!playerInfo[userId].team) {
          const player = demoFile.entities.getByUserId(parseInt(userId));
          if (player && player.teamNumber > 1) {
            playerInfo[userId].team = player.teamNumber - 2;
          }
        } else if (changeHalf && !isNaN(playerInfo[userId].team)) // Players that already have teams need them fliping at half time
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
          const killer = e.attacker !== e.userid ? demoFile.entities.getByUserId(e.attacker) : null;
          parsedFile.deaths[playerInfo[e.userid].team].push({
            p: playerInfo[e.userid].steam,
            a: e.attacker !== 0 && e.attacker !== e.userid ? playerInfo[e.attacker].steam : null,
            pp: [parseInt(player.position.x), parseInt(player.position.y)],
            ap: killer && e.weapon !== 'inferno' && e.weapon !== 'hegrenade' && e.weapon !== 'world' ?
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
          const killer = e.attacker !== e.userid ? demoFile.entities.getByUserId(e.attacker) : null;
          parsedFile.hits[playerInfo[e.userid].team].push({
            p: playerInfo[e.userid].steam,
            a: e.attacker !== 0 && e.attacker !== e.userid ? playerInfo[e.attacker].steam : null,
            d: e.dmg_health,
            pp: [parseInt(player.position.x), parseInt(player.position.y)],
            ap: killer && e.weapon !== 'inferno' && e.weapon !== 'hegrenade' && e.weapon !== 'world' ?
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
      const teams = demoFile.teams.slice(2);
      parsedFile.winner = teams[0].score > teams[1].score ? 0 : teams[0].score > teams[1].score ? 1 : 2;
      parsedFile.scores[0].t = teams[0].score - parsedFile.scores[0].ct;
      parsedFile.scores[1].ct = teams[1].score - parsedFile.scores[1].t;
      
      parsedFile.rounds = round;
      console.log(parsedFile);
      resolve(parsedFile);
    });

    // Load file in to buffer and parse
    const fr = new FileReader();
    fr.readAsArrayBuffer(file);
    fr.onloadend = () => {
      try {
        demoFile.parse(Buffer(fr.result));
      } catch {
        reject(`Something went wrong while parsing ${file.name}`);
      }
    };
  });
}
