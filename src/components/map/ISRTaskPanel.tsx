'use client';

import { useState, useEffect } from 'react';
import { fetchISRAssets, taskISR, type ISRAsset, type ISRTaskRequest, type ISRTaskResponse, type H3Cell } from '@/lib/gzm-client';

/**
 * ISR Task Panel
 * Click-to-task interface for autonomous collection management.
 * Shows available ISR assets, allows selection, and sends task to CBBA allocator.
 *
 * Flow:
 * 1. User clicks convergence hotspot on map
 * 2. This panel opens showing the hotspot details
 * 3. Available ISR assets are listed (filtered by range/capability)
 * 4. User selects asset + priority + collection type
 * 5. Task sent to gzm-isr:8087 CBBA endpoint
 * 6. Confirmation with ETA displayed
 */

interface ISRTaskPanelProps {
  targetCell: H3Cell | null;
  onClose: () => void;
  onTaskComplete: (response: ISRTaskResponse) => void;
}

export function ISRTaskPanel({ targetCell, onClose, onTaskComplete }: ISRTaskPanelProps) {
  const [assets, setAssets] = useState<ISRAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [collectionType, setCollectionType] = useState('EO/IR');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ISRTaskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (targetCell) {
      fetchISRAssets()
        .then(setAssets)
        .catch(() => setAssets([]));
    }
  }, [targetCell]);

  if (!targetCell) return null;

  const readyAssets = assets.filter(a => a.status === 'ready');

  async function handleTask() {
    if (!selectedAsset || !targetCell) return;
    setLoading(true);
    setError(null);

    try {
      const request: ISRTaskRequest = {
        target_hex: targetCell.hex,
        target_lat: targetCell.lat,
        target_lng: targetCell.lng,
        priority,
        asset_id: selectedAsset,
        collection_type: collectionType,
        duration_minutes: duration,
      };

      const response = await taskISR(request);
      setResult(response);
      onTaskComplete(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-2 top-16 z-50 w-80 bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Task ISR Collection</h3>
          <p className="text-[10px] text-gray-500">CBBA Autonomous Allocation</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          ✕
        </button>
      </div>

      {/* Target Info */}
      <div className="px-4 py-2 border-b border-gray-800 bg-red-950/30">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-300 font-medium">Convergence Hotspot</span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-gray-400">
          <div>Score: <span className="text-white font-mono">{targetCell.score.toFixed(2)}</span></div>
          <div>Signals: <span className="text-white font-mono">{targetCell.signals}</span></div>
          <div>Top INT: <span className="text-white font-mono">{targetCell.top_int}</span></div>
        </div>
      </div>

      {result ? (
        /* Success State */
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400 text-lg">✓</span>
            <span className="text-sm text-green-300 font-medium">Task {result.status}</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Task ID: <span className="text-white font-mono">{result.task_id}</span></div>
            <div>Asset: <span className="text-white">{result.asset_name}</span></div>
            <div>ETA: <span className="text-white">{result.eta_minutes} min</span></div>
          </div>
          <button
            onClick={onClose}
            className="mt-3 w-full py-2 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        /* Task Form */
        <div className="p-4 space-y-3">
          {/* Priority */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Priority</label>
            <div className="mt-1 flex gap-1">
              {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1 text-[10px] rounded capitalize transition-colors ${
                    priority === p
                      ? p === 'critical' ? 'bg-red-600 text-white'
                        : p === 'high' ? 'bg-orange-600 text-white'
                        : p === 'medium' ? 'bg-yellow-600 text-black'
                        : 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Type */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Collection Type</label>
            <select
              value={collectionType}
              onChange={e => setCollectionType(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1.5"
            >
              <option value="EO/IR">EO/IR (Electro-Optical/Infrared)</option>
              <option value="SAR">SAR (Synthetic Aperture Radar)</option>
              <option value="SIGINT">SIGINT (Signal Collection)</option>
              <option value="FMV">FMV (Full Motion Video)</option>
              <option value="LIDAR">LIDAR (3D Terrain)</option>
              <option value="MULTI">Multi-Sensor</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Duration: {duration} min</label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="mt-1 w-full accent-cyan-500"
            />
          </div>

          {/* Available Assets */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Available Assets ({readyAssets.length})</label>
            <div className="mt-1 max-h-32 overflow-y-auto space-y-1">
              {readyAssets.length === 0 ? (
                <p className="text-[10px] text-gray-600 italic">No assets available (backend offline or none in range)</p>
              ) : (
                readyAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                      selectedAsset === asset.id
                        ? 'bg-cyan-900/50 border border-cyan-600'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-sm">
                      {asset.type === 'drone' ? '🛸' : asset.type === 'satellite' ? '🛰️' : asset.type === 'ground_sensor' ? '📡' : '🚢'}
                    </span>
                    <div className="flex-1">
                      <div className="text-[11px] text-white">{asset.name}</div>
                      <div className="text-[9px] text-gray-500">{asset.capabilities.join(', ')}</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-[10px] text-red-400 bg-red-950/30 rounded px-2 py-1">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleTask}
            disabled={!selectedAsset || loading}
            className={`w-full py-2 text-xs font-medium rounded transition-all ${
              !selectedAsset || loading
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
            }`}
          >
            {loading ? 'Tasking...' : 'Task Collection Asset'}
          </button>
        </div>
      )}
    </div>
  );
}
