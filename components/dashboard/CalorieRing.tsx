'use client'

import { motion } from 'framer-motion'

interface CalorieRingProps {
  consumed: number
  burnt: number
  goal?: number // Goal for burnt or consumed? Usually specific. Let's say goal is Net 0 or specific intake.
}

export default function CalorieRing({ consumed, burnt, goal = 2500 }: CalorieRingProps) {
  // Increased size significantly to fit text
  // Outer: 384px (w-96), Center 192, Radius 160
  const radius = 160
  const circumference = 2 * Math.PI * radius
  
  // Calculations
  // User request (Latest): Burnt > Consumed = Negative, Consumed > Burnt = Positive
  // Net = Consumed - Burnt
  const net = consumed - burnt
  const percentageBurnt = Math.min((burnt / goal) * 100, 100)
  const percentageConsumed = Math.min((consumed / goal) * 100, 100)
  
  const strokeDashoffsetBurnt = circumference - (percentageBurnt / 100) * circumference
  
  // Inner Ring Calculations
  // Inner: 320px (w-80), Center 160, Radius 120
  const innerRadius = 120
  const innerCircumference = 2 * Math.PI * innerRadius
  
  return (
    <div className="relative flex items-center justify-center w-96 h-96 mx-auto">
      {/* Background Circle & Burnt Ring */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="192"
          cy="192"
          r={radius}
          stroke="currentColor"
          strokeWidth="18"
          fill="transparent"
          className="text-gray-200 dark:text-white/10"
        />
        {/* Burnt Ring (Outer/Green) */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffsetBurnt }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="192"
          cy="192"
          r={radius}
          stroke="currentColor"
          strokeWidth="18"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="text-neon dark:text-neon"
        />
      </svg>
      
       {/* Consumed Ring (Inner) */}
       <svg className="absolute w-80 h-80 transform -rotate-90">
        <circle
          cx="160"
          cy="160"
          r={innerRadius}
          stroke="currentColor"
          strokeWidth="15"
          fill="transparent"
          className="text-gray-200 dark:text-white/10"
        />
        {/* Consumed Ring (Inner/Red-Orange) */}
        <motion.circle
            initial={{ strokeDashoffset: innerCircumference }}
            animate={{ strokeDashoffset: innerCircumference - (percentageConsumed / 100) * innerCircumference }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="160"
            cy="160"
            r={innerRadius}
            stroke="currentColor"
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={innerCircumference}
            strokeLinecap="round"
            className="text-orange-500"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="text-sm font-semibold text-gray-500 dark:text-white/60 mb-1">Net Calories</div>
        {/* Burnt > Consumed (Net Negative) = Neon. Consumed > Burnt (Net Positive) = Orange. */}
        <div className={`text-6xl font-bold ${net <= 0 ? 'text-neon' : 'text-orange-500'}`}>
          {net > 0 ? '+' : ''}{Math.round(net)}
        </div>
        <div className="text-sm text-gray-400 dark:text-white/40 mt-2">
            {Math.round(consumed)} in / {Math.round(burnt)} out
        </div>
      </div>
    </div>
  )
}
