'use client'

import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function DebugCategoriesPage() {
  const { 
    categories,
    currentStore,
    fetchCategoriesByStore,
    debugCategoriesByStore,
    loading,
    error 
  } = useMainStore()

  const [debugLog, setDebugLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleFetchCategories = async () => {
    addLog('🚀 Starting fetchCategoriesByStore...')
    try {
      const result = await fetchCategoriesByStore(currentStore)
      addLog(`✅ fetchCategoriesByStore completed. Got ${result.length} categories`)
    } catch (error) {
      addLog(`❌ fetchCategoriesByStore error: ${error}`)
    }
  }

  const handleDebugCategories = async () => {
    addLog('🔥 Starting debugCategoriesByStore...')
    try {
      const result = await debugCategoriesByStore(currentStore)
      addLog(`🔥 debugCategoriesByStore completed. Got ${result.length} categories`)
    } catch (error) {
      addLog(`🔥 debugCategoriesByStore error: ${error}`)
    }
  }

  const handleDirectAPITest = async () => {
    addLog('🌐 Testing direct API call...')
    try {
      const response = await fetch(`/api/categories/${currentStore}`)
      const data = await response.json()
      addLog(`🌐 Direct API result: ${JSON.stringify(data).substring(0, 100)}...`)
    } catch (error) {
      addLog(`🌐 Direct API error: ${error}`)
    }
  }

  const clearLog = () => {
    setDebugLog([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Categories</h1>
        <p className="text-gray-600">Store: {currentStore || 'No store selected'}</p>
        <p className="text-sm text-gray-500">Categories in store: {categories.length}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Button onClick={handleFetchCategories} disabled={loading}>
          Fetch Categories
        </Button>
        <Button onClick={handleDebugCategories} disabled={loading}>
          Debug Categories
        </Button>
        <Button onClick={handleDirectAPITest} disabled={loading}>
          Direct API Test
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={clearLog} variant="outline">
          Clear Log
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {categories.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-semibold text-green-800">Categories ({categories.length})</h3>
          <div className="space-y-2">
            {categories.slice(0, 5).map(category => (
              <div key={category.id} className="text-sm">
                <strong>{category.name}</strong> ({category.id})
              </div>
            ))}
            {categories.length > 5 && <p>...and {categories.length - 5} more</p>}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800">No Categories Found</h3>
          <p className="text-yellow-700">0 categories in store</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-semibold mb-2">Debug Log</h3>
        <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
          {debugLog.length === 0 ? (
            <p className="text-gray-500">No log entries yet</p>
          ) : (
            debugLog.map((entry, index) => (
              <div key={index} className="font-mono">{entry}</div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>1. Click "Fetch Categories" to test the normal fetch</li>
          <li>2. Click "Debug Categories" to see detailed debug output</li>
          <li>3. Click "Direct API Test" to test the API endpoint directly</li>
          <li>4. Check console.log for detailed debug information</li>
          <li>5. Categories should appear above if successful</li>
        </ul>
      </div>
    </div>
  )
}
