import pool from "./db.js";

const excludedStates = ["post", "completed", "final"];

async function getTimeInfo() {
  const currentDate = new Date();
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 1);

  let timeInfo = {
    currentDay: currentDate.toISOString(),
    nextDay: nextDate.toISOString(),
  };

  console.log("TIME INFO", timeInfo);
  return timeInfo;
}

async function clearTable(leaguesToIngest) {
  const leagueNames = leaguesToIngest.map((league) => league.name); // Extract names
  const placeholders = leagueNames
    .map((_, index) => `$${index + 1}`)
    .join(", "); // Create placeholders for query

  const query = `DELETE FROM games WHERE league IN (${placeholders});`;
  await pool.query(query, leagueNames);

  console.log(
    `All rows with league_type ${JSON.stringify(
      leagueNames
    )} have been deleted.`
  );
}

/**
 * Get live games (state = 'in') for debugging
 */
async function getLiveGames() {
  const query = `
    SELECT league, COUNT(*) as count
    FROM games
    WHERE state = 'in'
    GROUP BY league;
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Upsert a single game record into the "games" table.
 */
async function upsertGame(game) {
  const upsertQuery = `
    INSERT INTO games (
      league,
      external_game_id,
      link,
      home_team_name,
      home_team_logo,
      home_team_score,
      away_team_name,
      away_team_logo,
      away_team_score,
      start_time,
      short_detail,
      state
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (league, external_game_id)
    DO UPDATE
      SET link             = EXCLUDED.link,
          home_team_name   = EXCLUDED.home_team_name,
          home_team_logo   = EXCLUDED.home_team_logo,
          home_team_score  = EXCLUDED.home_team_score,
          away_team_name   = EXCLUDED.away_team_name,
          away_team_logo   = EXCLUDED.away_team_logo,
          away_team_score  = EXCLUDED.away_team_score,
          start_time       = EXCLUDED.start_time,
          short_detail     = EXCLUDED.short_detail,
          state            = EXCLUDED.state,
          updated_at       = CURRENT_TIMESTAMP;
  `;

  const values = [
    game.league,
    game.externalGameId,
    game.link,
    game.homeTeam.name,
    game.homeTeam.logo,
    game.homeTeam.score,
    game.awayTeam.name,
    game.awayTeam.logo,
    game.awayTeam.score,
    game.startTime,
    game.shortDetail,
    game.state,
  ];

  await pool.query(upsertQuery, values);
}

/**
 * Returns all "not-final" games scheduled for TODAY (UTC-based).
 * This includes:
 * - Games that haven't started yet (pre)
 * - Games currently in progress (in)
 * - Any non-final games from today
 */
async function getNotFinalGamesToday() {
  const currentDate = new Date();
  const startOfToday = new Date(currentDate);
  startOfToday.setUTCHours(0, 0, 0, 0); // Start of today UTC

  const endOfToday = new Date(currentDate);
  endOfToday.setUTCHours(23, 59, 59, 999); // End of today UTC

  const query = `
    SELECT *
    FROM games
    WHERE
      start_time >= $1
      AND start_time <= $2
      AND state != ALL($3::text[])
    ORDER BY 
      CASE WHEN state = 'in' THEN 0 ELSE 1 END, 
      start_time ASC;
  `;

  const values = [
    startOfToday.toISOString(),
    endOfToday.toISOString(),
    excludedStates,
  ];

  console.log("SQL Query for today's non-final games:");
  console.log("Start of today:", startOfToday.toISOString());
  console.log("End of today:", endOfToday.toISOString());
  console.log("Excluded states:", excludedStates);

  const result = await pool.query(query, values);
  console.log(`Found ${result.rows.length} non-final games for today`);

  // Log game states for debugging
  const stateCount = {};
  result.rows.forEach((game) => {
    stateCount[game.state] = (stateCount[game.state] || 0) + 1;
  });
  console.log("Game states:", stateCount);

  return result.rows;
}

/**
 * Checks if all games for a given league are final today.
 */
async function areAllGamesFinal(league) {
  const currentDate = new Date();
  const startOfToday = new Date(currentDate);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const endOfToday = new Date(currentDate);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const query = `
    SELECT COUNT(*) AS cnt
    FROM games
    WHERE league = $1
      AND start_time >= $2
      AND start_time <= $3
      AND state != ALL($4::text[])
  `;

  const values = [
    league,
    startOfToday.toISOString(),
    endOfToday.toISOString(),
    excludedStates,
  ];

  const res = await pool.query(query, values);
  const countNonFinal = parseInt(res.rows[0].cnt, 10);
  return countNonFinal === 0; // If countNonFinal is 0, no non-final games remain
}

/**
 * Returns all games from the "games" table.
 */
async function getAllGames() {
  const query = `
    SELECT *
    FROM games
    ORDER BY 
      CASE WHEN state = 'in' THEN 1 ELSE 2 END ASC,
      league ASC, 
      start_time ASC, 
      external_game_id ASC;
  `;

  const result = await pool.query(query);
  return result.rows; // Return all games ordered by the criteria
}

/**
 * Returns all games for a given league.
 */
async function getGamesByLeague(leagueName) {
  const query = `
    SELECT *
    FROM games
    WHERE league = $1
    ORDER BY start_time ASC;
  `;

  const result = await pool.query(query, [leagueName]);
  return result.rows; // Return games for the specified league
}

export {
  upsertGame,
  getNotFinalGamesToday,
  areAllGamesFinal,
  getAllGames,
  getGamesByLeague,
  clearTable,
  getLiveGames,
};
