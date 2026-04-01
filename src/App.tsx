import React, { useState } from 'react';
import { TileConfig } from './types';
import { TileCalculator } from './components/TileCalculator';
import { FloorVisualizer } from './components/FloorVisualizer';
import { Layout, Box, Info, Github } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<TileConfig>({
    room: { width: 0, length: 0, height: 2.5, type: '' },
    tile: { width: 0, length: 0 },
    wallTile: { width: 0, length: 0 },
    costPerTile: 0,
    wallTileCost: 0,
    includeWallTiles: false,
    pattern: 'square',
    wallPattern: 'square',
    gap: 3,
    color: '#ffffff',
    wallColor: '#e2e8f0',
    groutColor: '#444444'
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">SmartFloor</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Tile Planning System</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Documentation</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              Export Plan
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls & AI */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-800">Configuration</h2>
              </div>
              <TileCalculator config={config} onChange={setConfig} />
            </section>

            <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex gap-4 items-start">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-900 text-sm">Pro Tip</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Always order 10-15% more tiles than calculated to account for breakage, cuts, and future repairs. Our calculator automatically includes a 10% wastage buffer.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-800">3D Visualization</h2>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Live Preview</span>
                <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded uppercase">Interactive</span>
              </div>
            </div>
            
            <FloorVisualizer config={config} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Visualizer Controls</h4>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Left Click + Drag to rotate</li>
                  <li>• Right Click + Drag to pan</li>
                  <li>• Scroll to zoom in/out</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Pattern Info</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The current <strong>{config.pattern}</strong> pattern is rendered at scale. Changes in tile size or room dimensions update the 3D view in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Layout className="w-4 h-4" />
            <span className="text-xs font-medium">© 2026 SmartFloor Tile Planning System</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Github className="w-3 h-3" />
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
