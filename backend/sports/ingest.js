// ingest.js is a utility file that fetches data from ESPN for the given leagues, transforms the data, and upserts it into the database.
require('dotenv').config()
const axios = require('axios')
const leagueConfigs = require('./leagueConfigs')
const { upsertGame, clearTable } = require('./dbQueries')

/**
 * Fetch data from ESPN for the given leagues,
 * transform the data, and upsert into DB.
 *
 * If no leaguesToIngest is provided, default = all leagueConfigs.
 */
async function ingestData(leaguesToIngest = leagueConfigs) {

  console.log('leagueConfigs:', leaguesToIngest)
  await clearTable(leaguesToIngest) // Clear all existing data
  
  try {
    for (const { name, slug } of leaguesToIngest) {
      const url = `${process.env.ESPN_API_URL}/${slug}/scoreboard`
      console.log(`\x1b[34m\nFetching data for ${name} (${slug})...\x1b[0m`)

      const response = await axios.get(url)
      const games = response.data?.events || []
      console.log(`Fetched ${games.length} games for ${name}.`)

      // Transform
      const cleanedData = games.map(game => {
        const competition = game?.competitions?.[0] || {}
        const team1 = competition.competitors?.[0]
        const team2 = competition.competitors?.[1]

        return {
          league: name,
          externalGameId: game.id,
          link: game.links?.[0]?.href || null,
          homeTeam: {
            name: team1?.team?.shortDisplayName || 'TBD',
            logo: team1?.team?.logo || null,
            score: parseInt(team1?.score, 10) || 0,
          },
          awayTeam: {
            name: team2?.team?.shortDisplayName || 'TBD',
            logo: team2?.team?.logo || null,
            score: parseInt(team2?.score, 10) || 0,
          },
          startTime: new Date(game.date).toISOString(),
          shortDetail: game.status?.type?.shortDetail || 'N/A',
          state: game.status?.type?.state || 'N/A',
        }
      })

      // Upsert each record
      for (const g of cleanedData) {
        await upsertGame(g)
      }

      console.log(`Upserted ${cleanedData.length} games for league: ${name}.`)
    }

    console.log('\x1b[32mLeague(s) processed and upserted successfully!\n\x1b[0m')
  } catch (err) {
    console.error('\x1b[41m Error occurred in ingestData: \x1b[0m', err)
  }
}

module.exports = { ingestData }
