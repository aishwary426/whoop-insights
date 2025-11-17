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

import PersonalMLModel from './mlTrainer'

// Global ML model instance
let mlModel = null

export async function trainUserModel(userId) {
  try {
    console.log('🎯 Starting personalized ML training...')
    
    // Get user data
    const recovery = await fetchAndParseCSV(userId, 'physiological_cycles.csv')
    const workouts = await fetchAndParseCSV(userId, 'workouts.csv')
    
    if (!recovery || recovery.length < 10) {
      console.log('⚠️ Not enough data to train (need 10+ days)')
      return null
    }

    // Initialize ML model
    mlModel = new PersonalMLModel()
    
    // Try to load existing model
    const loaded = await mlModel.loadModel()
    
    if (!loaded) {
      // Train new model
      console.log('🧠 Training new model on your data...')
      const recoveryTrained = await mlModel.trainRecoveryModel(recovery)
      
      if (workouts && workouts.length >= 20) {
        await mlModel.trainWorkoutModel(workouts, recovery)
      }
      
      // Save model
      if (recoveryTrained) {
        await mlModel.saveModel()
      }
    }

    return mlModel
  } catch (error) {
    console.error('Error training model:', error)
    return null
  }
}

export async function getPredictions(userId, currentMetrics) {
  if (!mlModel) {
    mlModel = await trainUserModel(userId)
  }

  if (!mlModel) {
    return null
  }

  const prediction = await mlModel.predictTomorrowRecovery(currentMetrics)
  return prediction
}

export { mlModel }
