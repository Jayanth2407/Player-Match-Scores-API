const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    const db = await open({
      filename: "cricketMatchDetails.db",
      driver: sqlite3.Database,
    });

    // API 1: Get all players
    app.get("/players/", async (req, res) => {
      const query = "SELECT player_id AS playerId, player_name AS playerName FROM player_details;";
      const players = await db.all(query);
      res.send(players);
    });

    // API 2: Get a specific player by ID
    app.get("/players/:playerId/", async (req, res) => {
      const { playerId } = req.params;
      const query = "SELECT player_id AS playerId, player_name AS playerName FROM player_details WHERE player_id = ?;";
      const player = await db.get(query, playerId);
      res.send(player);
    });

    // API 3: Update a player's details by ID
    app.put("/players/:playerId/", async (req, res) => {
      const { playerId } = req.params;
      const { playerName } = req.body;
      const query = "UPDATE player_details SET player_name = ? WHERE player_id = ?;";
      await db.run(query, playerName, playerId);
      res.send("Player Details Updated");
    });

    // API 4: Get match details by match ID
    app.get("/matches/:matchId/", async (req, res) => {
      const { matchId } = req.params;
      const query = "SELECT match_id AS matchId, match, year FROM match_details WHERE match_id = ?;";
      const match = await db.get(query, matchId);
      res.send(match);
    });

    // API 5: Get all matches of a player
    app.get("/players/:playerId/matches", async (req, res) => {
      const { playerId } = req.params;
      const query = `
        SELECT match_details.match_id AS matchId, match, year 
        FROM player_match_score
        JOIN match_details ON player_match_score.match_id = match_details.match_id
        WHERE player_match_score.player_id = ?;
      `;
      const matches = await db.all(query, playerId);
      res.send(matches);
    });

    // API 6: Get all players of a specific match
    app.get("/matches/:matchId/players", async (req, res) => {
      const { matchId } = req.params;
      const query = `
        SELECT player_details.player_id AS playerId, player_name AS playerName 
        FROM player_match_score
        JOIN player_details ON player_match_score.player_id = player_details.player_id
        WHERE player_match_score.match_id = ?;
      `;
      const players = await db.all(query, matchId);
      res.send(players);
    });

    // API 7: Get statistics of a player's scores
    app.get("/players/:playerId/playerScores", async (req, res) => {
      const { playerId } = req.params;
      const playerQuery = "SELECT player_name AS playerName FROM player_details WHERE player_id = ?;";
      const statsQuery = `
        SELECT 
          SUM(score) AS totalScore, 
          SUM(fours) AS totalFours, 
          SUM(sixes) AS totalSixes
        FROM player_match_score
        WHERE player_id = ?;
      `;
      const player = await db.get(playerQuery, playerId);
      const stats = await db.get(statsQuery, playerId);
      res.send({
        playerId: Number(playerId),
        playerName: player.playerName,
        ...stats,
      });
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.error(`Error initializing database and server: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

module.exports = app;
