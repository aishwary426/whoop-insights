'use client'

import { useState, useRef, useEffect } from 'react'
import type { DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, Check, X, Loader2, ScanBarcode, Bug, Edit3, SwitchCamera } from 'lucide-react'
import { format } from 'date-fns'
import NeonCard from '../ui/NeonCard'
import { getApiUrl } from '../../lib/api-config'
import { Html5Qrcode } from 'html5-qrcode'

interface FoodUploaderProps {
  onCaloriesAdded: (calories: number) => void
  userId?: string
}

export default function FoodUploader({ onCaloriesAdded, userId }: FoodUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  // Scanner States
  const [isScanning, setIsScanning] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScannerRunning = useRef(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  
  // Camera Selection States
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([])
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [calories, setCalories] = useState<number | null>(null)
  const [protein, setProtein] = useState<number | null>(null)
  const [carbs, setCarbs] = useState<number | null>(null)
  const [fats, setFats] = useState<number | null>(null)
  const [foodName, setFoodName] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Rating Interface
  interface RatingBreakdown {
      score: number;
      verdict: string;
      category?: string;
      nutrient_density?: number;
  }

  interface FoodRating {
      overall_score: number;
      grade: string;
      confidence: string;
      breakdown: {
          macro_profile: RatingBreakdown;
          caloric_efficiency: RatingBreakdown;
          satiety_index?: RatingBreakdown;
      }
  }

  const [rating, setRating] = useState<FoodRating | null>(null)

  const addLog = (msg: string) => {
      console.log(`[Scanner] ${msg}`)
      setDebugLogs(prev => [...prev.slice(-4), msg]) // Keep last 5 logs
  }

  // Helper to stop scanner
  const handleStopScanner = async () => {
      if (scannerRef.current && isScannerRunning.current) {
          try {
              await scannerRef.current.stop();
              isScannerRunning.current = false;
              addLog("Scanner stopped");
          } catch (e) {
              addLog(`Stop error: ${e}`);
          }
      }
      setIsScanning(false);
  }

  const handleSwitchCamera = async () => {
    if (cameras.length < 2 || !currentCameraId) return;

    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;

    addLog(`Switching to camera: ${cameras[nextIndex].label}`);

    if (scannerRef.current && isScannerRunning.current) {
        try {
            await scannerRef.current.stop();
            isScannerRunning.current = false;
            
            // Wait a bit before restarting
            await new Promise(r => setTimeout(r, 200));

            setCurrentCameraId(nextCameraId); 
            // The useEffect will trigger restart or we can call startScanner directly.
            // But since currentCameraId is state, let's let state drive it or call start manually with new ID.
            // Actually, we are inside useEffect dependence on isScanning. 
            // Switching camera while scanning is tricky if dependencies aren't set up.
            // Let's manually restart here to be safe and fast.
            
            startScanner(nextCameraId);
        } catch (e) {
            addLog(`Switch error: ${e}`);
            setCameraError("Failed to switch camera");
        }
    }
  }

  // Refactored startScanner to accept optional cameraId override
  const startScanner = async (cameraIdOverride?: string) => {
        // Poll for the reader element
        let attempts = 0;
        const maxAttempts = 15; 
        
        while (attempts < maxAttempts) {
            if (document.getElementById('reader')) break;
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        if (!document.getElementById('reader')) {
            addLog("Reader element not found.")
            setCameraError("Scanner failed to load. Please try again.");
            return;
        }

        if (scannerRef.current && isScannerRunning.current) {
             // If we are just switching cameras, we might have stopped it above.
             // But if called from useEffect, it might be running.
             // For simplicity, if running, don't re-init unless we force stop first.
        }

        if (!scannerRef.current) {
             addLog("Initializing Html5Qrcode...")
             const html5QrCode = new Html5Qrcode("reader", { 
                 formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                 verbose: false,
                 useBarCodeDetectorIfSupported: true 
             });
             scannerRef.current = html5QrCode;
        }

        const html5QrCode = scannerRef.current; // safely cast

        try {
            let targetCameraId = cameraIdOverride || currentCameraId;

            // If we don't have a specific camera yet, find the best one
            if (!targetCameraId) {
                addLog("Getting cameras...");
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    
                    // Logic to find 'Main' back camera
                    // 1. Filter for back/environment
                    const backCameras = devices.filter(d => 
                        d.label.toLowerCase().includes('back') || 
                        d.label.toLowerCase().includes('rear') ||
                        d.label.toLowerCase().includes('environment')
                    );

                    // 2. Try to avoid 'wide', '0.5x', 'ultra' if possible, unless it's the only one
                    // Many phones label main as just "Back Camera 0" or similar.
                    // Ultra wide often has "0.5x" or "Wide" explicitly.
                    let bestCamera = backCameras.find(d => {
                        const label = d.label.toLowerCase();
                        return !label.includes('0.5') && !label.includes('wide') && !label.includes('ultra');
                    });

                    // Fallback to first back camera
                    if (!bestCamera && backCameras.length > 0) {
                        bestCamera = backCameras[0];
                    }
                    
                    // Fallback to first available if no back camera found
                    if (!bestCamera) {
                        bestCamera = devices[0];
                    }

                    targetCameraId = bestCamera.id;
                    setCurrentCameraId(targetCameraId);
                    addLog(`Selected: ${bestCamera.label}`);
                } else {
                    addLog("No cameras found via API");
                    // Fallback to facing mode if enumeration fails
                }
            }

            addLog(`Starting stream on ${targetCameraId ? 'specific ID' : 'facing mode'}...`)
            
            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            // If we have a specific ID, use it. Otherwise fall back to mode.
            const cameraConfig = targetCameraId ? { deviceId: { exact: targetCameraId } } : { facingMode: "environment" };

            await html5QrCode.start(
                cameraConfig,
                config, 
                (decodedText) => {
                    handleStopScanner()
                    processBarcode(decodedText)
                },
                (errorMessage) => {
                    // unexpected error or just no code found in frame
                }
            );
            
            isScannerRunning.current = true;
            addLog("Camera started successfully")

        } catch (err: any) {
             addLog(`Start failed: ${err}`);
             console.error("Camera start error", err);
             setCameraError("Camera failed to start. Please check permissions.");
        }
  }

  useEffect(() => {
    let mounted = true;

    if (isScanning) {
        setCameraError(null);
        setDebugLogs([]);
        // We delay slightly to ensure DOM is ready
        setTimeout(() => {
            if (mounted) startScanner();
        }, 100);
    } else {
        // Cleanup if isScanning becomes false
         if (scannerRef.current && isScannerRunning.current) {
            scannerRef.current.stop().catch(console.error).then(() => {
                isScannerRunning.current = false;
                if (scannerRef.current) {
                    scannerRef.current.clear();
                    // Don't nullify ref eagerly if we want to reuse instance, 
                    // but for clean unmount/remount often better to clear.
                    scannerRef.current = null;
                }
            });
         }
    }

    return () => {
        mounted = false;
        // Urgent cleanup on unmount
        if (scannerRef.current && isScannerRunning.current) {
             scannerRef.current.stop().catch(console.error);
             isScannerRunning.current = false;
        }
    }
  }, [isScanning])

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await processFile(file)
    }
  }

  const handleFile = async (file: File) => {
      await processFile(file)
  }

  const processBarcode = async (barcode: string) => {
      setIsScanning(false); // UI switch
      // Reset previous states
      setCalories(null)
      setProtein(null)
      setRating(null)
        // Sanitize: remove spaces and non-numeric chars (standard EAN/UPC)
        const cleanBarcode = barcode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
        
        if (!cleanBarcode) {
            alert("Invalid barcode detected.")
            return;
        }

        // Reset previous states
        setCalories(null)
        setProtein(null)
        setCarbs(null)
        setFats(null)
        setFoodName('')
        setShowResult(false)
        setPreview(null) // Clear previous preview
        setRating(null)

        setIsAnalyzing(true)
        setShowManualInput(false) // Close manual if open
        
        // Use the cleaned barcode for display and API
        setManualBarcode(cleanBarcode) 
        // Or better, just pass it to API. We don't display "manualBarcode" state in the success view directly, 
        // we use it for input binding.
        
        try {
            const apiUrl = getApiUrl(`/food/barcode/${cleanBarcode}`);
            const res = await fetch(apiUrl);
            
            if (!res.ok) {
                if (res.status === 404) {
                    alert("Product not found in database.")
                } else {
                    alert(`Error fetching product data (Status: ${res.status})`)
                }
                setIsAnalyzing(false)
                return
            }
            
            const data = await res.json()
            
            setCalories(data.calories)
            setProtein(data.protein)
            setCarbs(data.carbs)
            setFats(data.fats)
            setFoodName(data.description) // "Unknown Product" if logic falls back
            setRating(data.rating || null)
            
            if (data.image_url) {
                setPreview(data.image_url)
            } else {
                setPreview(null) // Or keep null
            }
            
            setShowResult(true)
            
        } catch (e) {
            console.error("Barcode lookup failed", e)
            alert("Network error looking up barcode.")
        } finally {
            setIsAnalyzing(false)
        }
    }

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return

    // Reset previous states
    setCalories(null)
    setProtein(null)
    setCarbs(null)
    setFats(null)
    setFoodName('')
    setShowResult(false)
    setRating(null)

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Start Analysis
    setIsAnalyzing(true)
    
    // Use environment variable or default to relative path (for rewrites)
    const apiUrl = getApiUrl('/food/analyze');

    try {
      console.log(`Starting food analysis for file: ${file.name} (${file.size} bytes)`);
      const formData = new FormData()
      formData.append('file', file)

      console.log(`Sending request to: ${apiUrl}`)
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      console.log(`Analysis response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Analysis failed with status ${response.status}: ${errorText}`);
        throw new Error(`${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 50)}` : ''}`)
      }

      const data = await response.json()
      console.log("Analysis data received:", data)
      
      setCalories(data.calories)
      setProtein(data.protein)
      setCarbs(data.carbs)
      setFats(data.fats)
      setFoodName(data.description || "Analyzed Food")
      setRating(data.rating || null)
      
      // Simulate "Scanning" delay slightly if API is too fast
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowResult(true)
      }, 1500)

    } catch (error: any) {
      console.error("Analysis failed:", error)
      setIsAnalyzing(false)
      // Provide fallback values but indicate error
      setCalories(0)
      setProtein(0)
      setCarbs(0)
      setFats(0)
      setRating(null)
      // Show actual error in the UI for debugging
      setFoodName(`Error: ${error.message || 'Unknown error'}`)
      setShowResult(true)
    }
  }

  const handleAddParams = async () => {
    // Allow logging 0 calories (e.g., Water, Diet Coke)
    if (calories === null || isLogging) return;

    setIsLogging(true)

    try {
        if (!userId) {
            console.error("User ID missing, cannot save meal")
            alert("Unable to save: User ID missing. Please refresh the page.")
            setIsLogging(false)
            return
        }

        const apiUrl = getApiUrl('/meals/');
        
        // Prepare payload
        const payload: any = {
            user_id: userId,
            name: foodName,
            // Ensure values are integers
            calories: Math.round(Number(calories) || 0),
            protein: Math.round(Number(protein) || 0),
            carbs: Math.round(Number(carbs) || 0),
            fats: Math.round(Number(fats) || 0),
            timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
        };

        // Only attach image_url if it's a remote URL (not a base64 data URI from local upload)
        if (preview && preview.startsWith('http')) {
            payload.image_url = preview;
        }

        // Ensure trailing slash to prevent 307 Redirects
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        })
        
        if (res.ok) {
            // Small delay to show success feedback
            await new Promise(resolve => setTimeout(resolve, 500))
            onCaloriesAdded(Number(calories) || 0)
            reset()
        } else {
            const errorText = await res.text();
            console.error("Failed to save meal", res.status, errorText)
            alert(`Failed to save meal (Status: ${res.status}).\nDetails: ${errorText.substring(0, 100)}`)
            setIsLogging(false)
        }
    } catch (e: any) {
        console.error("Error saving meal:", e)
        alert(`An error occurred while saving: ${e.message}`)
        setIsLogging(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setCalories(null)
    setProtein(null)
    setCarbs(null)
    setFats(null)
    setFoodName('')
    setRating(null)
    setIsAnalyzing(false)
    setIsLogging(false)
    setIsScanning(false)
    setShowResult(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Calculate colors for grades
  const getGradeColor = (grade: string) => {
      const g = grade.charAt(0);
      if (g === 'A') return 'text-neon';
      if (g === 'B') return 'text-blue-400';
      if (g === 'C') return 'text-yellow-400';
      return 'text-red-400';
  }

  const getScoreColor = (score: number) => {
      if (score >= 85) return 'bg-neon text-black';
      if (score >= 70) return 'bg-blue-500 text-white';
      if (score >= 50) return 'bg-yellow-500 text-black';
      return 'bg-red-500 text-white';
  }

  return (
    <NeonCard className="p-6 overflow-hidden relative min-h-[300px]">
      <AnimatePresence mode="wait">
        {isScanning ? (
             <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
             >
                 {cameraError ? (
                     <div className="text-center p-4 text-red-400 bg-red-400/10 rounded-xl mb-4 w-full">
                         <p className="text-sm font-semibold">{cameraError}</p>
                     </div>
                 ) : (
                    <div className="relative w-full max-w-sm rounded-xl overflow-hidden mb-4 border-2 border-neon bg-black">
                        <div id="reader" className="w-full min-h-[250px]"></div>
                        
                        {/* Switch Camera Button Overlay */}
                        {cameras.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSwitchCamera();
                                }}
                                className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:text-neon transition-colors z-10 border border-white/10"
                                title="Switch Camera"
                            >
                                <SwitchCamera size={20} />
                            </button>
                        )}

                        {/* Overlay debug logs */}
                        <div className="absolute top-0 left-0 w-full p-2 pointer-events-none">
                            {debugLogs.map((log, i) => (
                                <div key={i} className="text-[10px] text-neon/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded mb-1 w-fit max-w-full truncate">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
                 <button 
                    onClick={() => {
                        setIsScanning(false);
                        setCameraError(null);
                        setCurrentCameraId(null);
                    }}
                    className="mt-4 text-white hover:text-neon transition-colors flex items-center gap-2"
                 >
                     <X size={20} /> Cancel Scan
                 </button>
             </motion.div>
        ) : !preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all h-full flex flex-col items-center justify-center gap-6 ${
              isDragging
                ? 'border-neon bg-neon/10'
                : 'border-gray-300 dark:border-white/20 hover:border-neon dark:hover:border-neon'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            
            <div className="flex gap-4 w-full">
                {/* Image Upload Option */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center gap-3 cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-colors group"
                >
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-neon/20 transition-colors">
                        <Camera size={28} className="text-gray-500 dark:text-white/60 group-hover:text-neon" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Snap Photo</h3>
                        <p className="text-[10px] text-gray-500 dark:text-white/50">AI Analysis</p>
                    </div>
                </div>

                <div className="w-[1px] bg-white/10 my-2"></div>

                {/* Barcode Scan Option */}
                <div 
                    onClick={() => setIsScanning(true)}
                    className="flex-1 flex flex-col items-center gap-3 cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-colors group"
                >
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-neon/20 transition-colors">
                        <ScanBarcode size={28} className="text-gray-500 dark:text-white/60 group-hover:text-neon" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Scan Barcode</h3>
                        <p className="text-[10px] text-gray-500 dark:text-white/50">Details Lookup</p>
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-gray-400 dark:text-white/30 mt-2">
                Drag & Drop generic food images here
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
             <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Food Preview" className="w-full h-full object-contain" />
                
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                         <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden mb-4 w-1/2">
                            <motion.div 
                                className="h-full bg-neon"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                         </div>
                         <div className="text-white font-mono text-sm animate-pulse">Processing Data...</div>
                    </div>
                )}
             </div>

             {calories !== null && !isAnalyzing && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full"
                 >
                     <div className="text-center mb-6">
                        <div className="text-sm text-gray-500 dark:text-white/60 uppercase tracking-widest text-xs mb-1">Detected</div>
                        <div className="text-5xl font-bold text-white mb-2">{calories} <span className="text-xl text-neon">kcal</span></div>
                        
                        {/* Editable Food Name */}
                        <div className="relative max-w-xs mx-auto mb-3">
                             <input 
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                                className="w-full bg-transparent text-center text-white/80 italic border-b border-white/10 focus:border-neon focus:outline-none py-1 transition-colors"
                                placeholder="Enter product name..."
                             />
                        </div>

                        <div className="text-xs text-neon border border-neon/30 bg-neon/10 px-3 py-1 rounded-full inline-block">
                             Details Found
                        </div>
                     </div>

                     {/* Rating Card */}
                     {rating && (
                        <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 w-full text-left">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Health Score</div>
                                    <div className={`text-2xl font-black ${getGradeColor(rating.grade)} flex items-baseline gap-2`}>
                                        {rating.grade} 
                                        <span className="text-xs text-white/50 font-normal">({rating.overall_score}/100)</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getScoreColor(rating.overall_score)}`}>
                                    {rating.breakdown.macro_profile.category || "General"}
                                </div>
                            </div>
                            
                            <div className="space-y-2 border-t border-white/5 pt-3">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-gray-400 text-xs whitespace-nowrap">Macros</span>
                                    <span className="text-white text-xs text-right opacity-90">{rating.breakdown.macro_profile.verdict}</span>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-gray-400 text-xs whitespace-nowrap">Efficiency</span>
                                    <span className="text-white text-xs text-right opacity-90">{rating.breakdown.caloric_efficiency.verdict}</span>
                                </div>
                            </div>
                        </div>
                     )}

                     {/* Logging Progress Bar */}
                     {isLogging && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 w-full"
                        >
                            <div className="w-full h-2 bg-gray-700 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-neon"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </div>
                            <div className="text-center mt-2 text-sm text-gray-400 dark:text-white/60 flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Logging meal...</span>
                            </div>
                        </motion.div>
                     )}

                     <div className="flex gap-3">
                        <button 
                            onClick={reset}
                            disabled={isLogging}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Retake
                        </button>
                        <button 
                            onClick={handleAddParams}
                            disabled={isLogging}
                            className="flex-1 py-3 rounded-xl bg-neon text-black font-bold hover:bg-neon-hover transition-colors shadow-[0_0_20px_rgba(0,255,143,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogging ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Logging...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Log Meal</span>
                                </>
                            )}
                        </button>
                     </div>
                 </motion.div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </NeonCard>
  )
}

