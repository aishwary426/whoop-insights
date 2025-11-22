import * as tf from '@tensorflow/tfjs'

/**
 * ML Trainer for Personalized Predictions
 * Trains models on user's actual Whoop data in the browser
 */

export class PersonalMLModel {
  constructor() {
    this.recoveryModel = null
    this.workoutModel = null
    this.modelTrained = false
  }

  /**
   * Train recovery prediction model
   * Predicts tomorrow's recovery based on today's metrics
   */
  async trainRecoveryModel(recoveryData) {
    if (!recoveryData || recoveryData.length < 10) {
      console.log('Need at least 10 days of data to train')
      return false
    }

    try {
      // Prepare training data
      const trainingData = this.prepareRecoveryData(recoveryData)
      
      if (trainingData.inputs.length === 0) {
        return false
      }

      // Create model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [5], units: 16, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Output 0-1 (will multiply by 100 for %)
        ]
      })

      // Compile model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      })

      // Convert to tensors
      const xs = tf.tensor2d(trainingData.inputs)
      const ys = tf.tensor2d(trainingData.outputs)

      // Train model
      console.log('🤖 Training recovery prediction model...')
      await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 8,
        validationSplit: 0.2,
        shuffle: true,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`)
            }
          }
        }
      })

      // Cleanup tensors
      xs.dispose()
      ys.dispose()

      this.recoveryModel = model
      this.modelTrained = true
      
      console.log('✅ Recovery model trained successfully!')
      return true

    } catch (error) {
      console.error('Error training recovery model:', error)
      return false
    }
  }

  /**
   * Prepare recovery data for training
   * Features: [today_recovery, sleep_hours, hrv, rhr, day_strain]
   * Target: tomorrow_recovery
   */
  prepareRecoveryData(recoveryData) {
    const inputs = []
    const outputs = []

    // Sort by date
    const sortedData = recoveryData
      .filter(d => d['Recovery score %'] != null)
      .sort((a, b) => new Date(a['Cycle start time']) - new Date(b['Cycle start time']))

    // Create input-output pairs (today -> tomorrow)
    for (let i = 0; i < sortedData.length - 1; i++) {
      const today = sortedData[i]
      const tomorrow = sortedData[i + 1]

      // Extract features (normalize to 0-1)
      const todayRecovery = (today['Recovery score %'] || 50) / 100
      const sleepHours = Math.min((today['Sleep time hours'] || 7) / 12, 1)
      const hrv = Math.min((today['HRV'] || 50) / 200, 1)
      const rhr = Math.max(1 - ((today['Resting heart rate'] || 60) / 100), 0)
      const strain = Math.min((today['Day Strain'] || 10) / 21, 1)

      // Target: tomorrow's recovery (normalized)
      const tomorrowRecovery = (tomorrow['Recovery score %'] || 50) / 100

      inputs.push([todayRecovery, sleepHours, hrv, rhr, strain])
      outputs.push([tomorrowRecovery])
    }

    return { inputs, outputs }
  }

  /**
   * Predict tomorrow's recovery
   */
  async predictTomorrowRecovery(todayMetrics) {
    if (!this.recoveryModel || !this.modelTrained) {
      // Fallback to simple rule-based prediction
      return this.simpleRecoveryPrediction(todayMetrics)
    }

    try {
      const { recovery, sleepHours, hrv, rhr, strain } = todayMetrics

      // Normalize inputs
      const input = tf.tensor2d([[
        recovery / 100,
        Math.min(sleepHours / 12, 1),
        Math.min(hrv / 200, 1),
        Math.max(1 - (rhr / 100), 0),
        Math.min(strain / 21, 1)
      ]])

      // Predict
      const prediction = this.recoveryModel.predict(input)
      const predictionValue = await prediction.data()
      
      // Cleanup
      input.dispose()
      prediction.dispose()

      // Convert back to percentage
      const predictedRecovery = Math.round(predictionValue[0] * 100)
      
      return {
        prediction: Math.min(100, Math.max(0, predictedRecovery)),
        confidence: 0.85, // Model-based prediction has high confidence
        isML: true
      }

    } catch (error) {
      console.error('Prediction error:', error)
      return this.simpleRecoveryPrediction(todayMetrics)
    }
  }

  /**
   * Simple rule-based prediction (fallback)
   */
  simpleRecoveryPrediction(todayMetrics) {
    const { recovery, sleepHours, strain } = todayMetrics
    
    let predicted = recovery
    
    // Sleep adjustment
    if (sleepHours >= 8) predicted += 5
    else if (sleepHours < 6) predicted -= 10
    
    // Strain adjustment
    if (strain > 15) predicted -= 5
    else if (strain < 10) predicted += 3
    
    // Add some randomness
    predicted += (Math.random() * 10 - 5)
    
    return {
      prediction: Math.round(Math.min(100, Math.max(30, predicted))),
      confidence: 0.65, // Rule-based has lower confidence
      isML: false
    }
  }

  /**
   * Train workout efficiency model
   * Predicts optimal workout type based on recovery state
   */
  async trainWorkoutModel(workoutData, recoveryData) {
    if (!workoutData || workoutData.length < 20) {
      console.log('Need at least 20 workouts to train workout model')
      return false
    }

    try {
      // Prepare training data
      const trainingData = this.prepareWorkoutData(workoutData, recoveryData)
      
      if (trainingData.inputs.length === 0) {
        return false
      }

      // Create model for workout efficiency prediction
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [4], units: 12, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' }) // Predict calories/min
        ]
      })

      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError'
      })

      const xs = tf.tensor2d(trainingData.inputs)
      const ys = tf.tensor2d(trainingData.outputs)

      console.log('🤖 Training workout efficiency model...')
      await model.fit(xs, ys, {
        epochs: 30,
        batchSize: 4,
        shuffle: true,
        verbose: 0
      })

      xs.dispose()
      ys.dispose()

      this.workoutModel = model
      
      console.log('✅ Workout model trained successfully!')
      return true

    } catch (error) {
      console.error('Error training workout model:', error)
      return false
    }
  }

  /**
   * Prepare workout data
   * Features: [recovery, duration, strain, avg_hr]
   * Target: efficiency (calories/min)
   */
  prepareWorkoutData(workoutData, recoveryData) {
    const inputs = []
    const outputs = []

    // Create recovery lookup by date
    const recoveryByDate = {}
    recoveryData.forEach(r => {
      const date = new Date(r['Cycle start time']).toDateString()
      recoveryByDate[date] = r['Recovery score %'] || 50
    })

    workoutData.forEach(workout => {
      const duration = workout['Duration (minutes)']
      const calories = workout['Kilojoules'] || workout['Calories']
      const strain = workout['Strain']
      const avgHR = workout['Average heart rate']
      
      if (!duration || duration < 5 || !calories) return

      // Get recovery for that day
      const workoutDate = new Date(workout['Workout start time']).toDateString()
      const recovery = recoveryByDate[workoutDate] || 50

      // Calculate efficiency (cal/min)
      const efficiency = calories / duration

      // Normalize inputs
      inputs.push([
        recovery / 100,
        Math.min(duration / 120, 1), // Max 2 hours
        Math.min(strain / 21, 1),
        Math.min(avgHR / 200, 1)
      ])
      
      outputs.push([efficiency / 20]) // Normalize efficiency
    })

    return { inputs, outputs }
  }

  /**
   * Predict workout efficiency
   */
  async predictWorkoutEfficiency(recovery, duration, expectedStrain) {
    if (!this.workoutModel) {
      // Simple fallback
      const baseEfficiency = 7
      const recoveryBonus = ((recovery - 50) / 50) * 2
      return baseEfficiency + recoveryBonus
    }

    try {
      const input = tf.tensor2d([[
        recovery / 100,
        Math.min(duration / 120, 1),
        Math.min(expectedStrain / 21, 1),
        0.7 // Estimated avg HR normalized
      ]])

      const prediction = this.workoutModel.predict(input)
      const value = await prediction.data()
      
      input.dispose()
      prediction.dispose()

      return value[0] * 20 // Denormalize
    } catch (error) {
      console.error('Efficiency prediction error:', error)
      return 7 // Default fallback
    }
  }

  /**
   * Generate personalized insights
   */
  generateInsights(userData) {
    const insights = []

    // Recovery patterns
    const avgRecovery = userData.avgRecovery
    if (avgRecovery < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Average Recovery',
        message: 'Your recovery has been below 50%. Consider more rest days and better sleep.'
      })
    } else if (avgRecovery > 70) {
      insights.push({
        type: 'success',
        icon: '��',
        title: 'Excellent Recovery',
        message: 'Your body is responding well! You can push harder on high-recovery days.'
      })
    }

    // Sleep correlation (if available)
    if (userData.sleepHours && userData.avgRecovery) {
      const sleepImpact = (userData.sleepHours - 7) * 3
      insights.push({
        type: 'info',
        icon: '😴',
        title: 'Sleep Impact',
        message: `You typically get ${userData.sleepHours.toFixed(1)}h sleep. Every extra hour could boost recovery by ~3%.`
      })
    }

    // Workout frequency
    if (userData.totalWorkouts > 50) {
      insights.push({
        type: 'success',
        icon: '🏆',
        title: 'Consistency Champion',
        message: `${userData.totalWorkouts} workouts tracked! Consistency is key to progress.`
      })
    }

    return insights
  }

  /**
   * Save model to browser storage
   */
  async saveModel() {
    if (this.recoveryModel) {
      await this.recoveryModel.save('localstorage://recovery-model')
      console.log('💾 Model saved to browser storage')
    }
  }

  /**
   * Load model from browser storage
   */
  async loadModel() {
    try {
      this.recoveryModel = await tf.loadLayersModel('localstorage://recovery-model')
      this.modelTrained = true
      console.log('✅ Model loaded from storage')
      return true
    } catch (error) {
      console.log('No saved model found')
      return false
    }
  }
}

export default PersonalMLModel
