const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayers = `select * from player_details;`;
  const players = await db.all(getPlayers);
  response.send(players.map((each) => convertDbObjectToResponseObject(each)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `select * from player_details where player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  response.send(convertDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `update player_details set player_name = '${playerName}' where player_id = ${playerId};`;
  const update = await db.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `select match_id as matchId,match,year from match_details where match_id = ${matchId};`;
  const match = await db.get(getMatch);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getDetails = `select match_details.match_id as matchId,match,year from match_details,player_match_score
     where match_details.match_id = player_match_score.match_id and player_id= ${playerId};`;
  const details = await db.all(getDetails);
  response.send(details);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayers = `select player_details.player_id as playerId,player_name as playerName from player_details,player_match_score
    where player_details.player_id = player_match_score.player_id and match_id = ${matchId};`;
  const details = await db.all(getPlayers);
  response.send(details);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getDetails = `select player_match_score.player_id as playerId,player_details.player_name as playerName, sum(score) as totalScore,sum(fours) as totalFours,sum(sixes) as totalSixes
    from player_match_score,player_details where player_details.player_id = ${playerId} and  player_match_score.player_id = ${playerId};`;
  const details = await db.get(getDetails);
  response.send(details);
});

module.exports = app;
