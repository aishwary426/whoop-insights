cat > lib/dataParser.js << 'EOFPARSER'
import { supabase } from './supabase'
import Papa from 'papaparse'

export async function fetchAndParseCSV(userId, filename) {
  try {
    // List all folders for this user
    const { data: folders, error: listError } = await supabase.storage
      .from('whoop-data')
      .list('', {
        search: userId
      })
    
    if (listError || !folders || folders.length === 0) {
      console.log('No uploads found')
      return null
    }

    // Get the most recent upload folder
    const latestFolder = folders.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0]

    // Download the CSV
    const { data, error } = await supabase.storage
      .from('whoop-data')
      .download(`${latestFolder.name}/${filename}`)
    
    if (error) {
      console.error('Download error:', error)
      return null
    }

    // Convert to text
    const text = await data.text()
    
    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    })
    
    return result.data
  } catch (error) {
    console.error('Error parsing CSV:', error)
    return null
  }
}

export async function getUserStats(userId) {
  try {
    // Fetch workouts
    const workouts = await fetchAndParseCSV(userId, 'workouts.csv')
    
    // Fetch recovery cycles
    const recovery = await fetchAndParseCSV(userId, 'physiological_cycles.csv')
    
    if (!workouts && !recovery) {
      return null
    }

    // Calculate stats
    const stats = {
      totalWorkouts: workouts ? workouts.length : 0,
      avgRecovery: 0,
      avgStrain: 0
    }

    if (recovery && recovery.length > 0) {
      // Calculate average recovery
      const recoveryScores = recovery
        .map(r => r['Recovery score %'])
        .filter(score => score != null && !isNaN(score))
      
      if (recoveryScores.length > 0) {
        stats.avgRecovery = Math.round(
          recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length
        )
      }

      // Calculate average strain
      const strains = recovery
        .map(r => r['Day Strain'])
        .filter(strain => strain != null && !isNaN(strain))
      
      if (strains.length > 0) {
        stats.avgStrain = (
          strains.reduce((a, b) => a + b, 0) / strains.length
        ).toFixed(1)
      }
    }

    return stats
  } catch (error) {
    console.error('Error getting user stats:', error)
    return null
  }
}
EOFPARSER

echo "✅ Data parser created!"
