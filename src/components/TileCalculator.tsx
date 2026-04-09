import React, { useState, useEffect } from 'react';
import { RoomDimensions, TileConfig, CalculationResult, TilePattern, AISuggestion } from '../types';
import { Calculator, Ruler, IndianRupee, Layers, Sparkles, RefreshCw } from 'lucide-react';
import { getTileSuggestions } from '../lib/gemini';
import { cn } from '../lib/utils';

interface TileCalculatorProps {
  config: TileConfig;
  onChange: (config: TileConfig) => void;
}

export const TileCalculator: React.FC<TileCalculatorProps> = ({ config, onChange }) => {
  const [results, setResults] = useState<CalculationResult>({
    roomArea: 0,
    wallArea: 0,
    tileArea: 0,
    wallTileArea: 0,
    tilesRequired: 0,
    wallTilesRequired: 0,
    totalTiles: 0,
    totalWallTiles: 0,
    totalCost: 0,
    oneTileCost: 0,
    oneWallTileCost: 0,
    wastage: 0,
    wallWastage: 0
  });

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculate();
    }, 300);
    return () => clearTimeout(timer);
  }, [config]);

  const calculate = () => {
    // Validation
    const isFloorValid = config.room.width > 0 && config.room.length > 0 && config.tile.width > 0 && config.tile.length > 0 && config.costPerTile > 0;
    const isWallValid = !config.includeWallTiles || (config.room.height > 0 && config.wallTile?.width && config.wallTile.width > 0 && config.wallTile.length > 0 && config.wallTileCost && config.wallTileCost > 0);

    if (!config.room.type || !isFloorValid || !isWallValid) {
      // Don't show error during automatic calculation, just reset results
      setResults({
        roomArea: 0,
        wallArea: 0,
        tileArea: 0,
        wallTileArea: 0,
        tilesRequired: 0,
        wallTilesRequired: 0,
        totalTiles: 0,
        totalWallTiles: 0,
        totalCost: 0,
        oneTileCost: 0,
        oneWallTileCost: 0,
        wastage: 0,
        wallWastage: 0
      });
      setHasCalculated(false);
      return;
    }

    setError(null);
    
    // Floor Calculation
    const roomArea = config.room.width * config.room.length;
    const tileArea = (config.tile.width / 100) * (config.tile.length / 100);
    let floorCount = Math.ceil(roomArea / tileArea);
    const floorWastageCount = Math.ceil(floorCount * 0.1);
    const totalFloorCount = floorCount + floorWastageCount;

    // Wall Calculation
    let wallArea = 0;
    let wallTileArea = 0;
    let wallTilesRequired = 0;
    let totalWallTiles = 0;
    let wallWastage = 0;
    let wallCost = 0;

    if (config.includeWallTiles && config.wallTile) {
      wallArea = 2 * (config.room.width + config.room.length) * config.room.height;
      wallTileArea = (config.wallTile.width / 100) * (config.wallTile.length / 100);
      wallTilesRequired = Math.ceil(wallArea / wallTileArea);
      wallWastage = Math.ceil(wallTilesRequired * 0.1);
      totalWallTiles = wallTilesRequired + wallWastage;
      wallCost = totalWallTiles * (config.wallTileCost || 0);
    }
    
    setResults({
      roomArea,
      wallArea,
      tileArea,
      wallTileArea,
      tilesRequired: floorCount,
      wallTilesRequired,
      totalTiles: totalFloorCount,
      totalWallTiles,
      totalCost: (totalFloorCount * config.costPerTile) + wallCost,
      oneTileCost: config.costPerTile,
      oneWallTileCost: config.wallTileCost || 0,
      wastage: floorWastageCount,
      wallWastage
    });
    setHasCalculated(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const keys = name.split('.');
    
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    }

    if (keys.length === 2) {
      onChange({
        ...config,
        [keys[0]]: {
          ...(config[keys[0] as keyof TileConfig] as any),
          [keys[1]]: val
        }
      });
    } else {
      onChange({
        ...config,
        [name]: val
      });
    }
  };

  const fetchSuggestions = async () => {
    if (!config.room.type) {
      setError("Please select a room type first.");
      return;
    }
    setIsSuggesting(true);
    const data = await getTileSuggestions(config.room);
    setSuggestions(data);
    setIsSuggesting(false);
  };

  const applySuggestion = (s: AISuggestion) => {
    onChange({
      ...config,
      pattern: s.pattern,
      wallPattern: s.pattern, // Default wall pattern to same as floor suggestion
      color: s.color,
      wallColor: s.wallColor,
      tile: {
        width: s.tileSize.width,
        length: s.tileSize.length
      },
      wallTile: s.wallTileSize ? {
        width: s.wallTileSize.width,
        length: s.wallTileSize.length
      } : config.wallTile
    });
  };

  const ROOM_PRESETS: Record<string, any[]> = {
    'Kitchen': [
      { name: 'Chef\'s Choice', color: '#f7fafc', wallColor: '#2d3748', groutColor: '#e2e8f0', pattern: 'square', tile: { width: 60, length: 60 }, textureUrl: 'https://picsum.photos/seed/marble/512/512' },
      { name: 'Rustic Farmhouse', color: '#c05621', wallColor: '#fffaf0', groutColor: '#7b341e', pattern: 'offset', tile: { width: 30, length: 15 }, textureUrl: 'https://picsum.photos/seed/wood/512/512' },
      { name: 'Modern Bistro', color: '#1a202c', wallColor: '#ffffff', groutColor: '#4a5568', pattern: 'checker', tile: { width: 40, length: 40 } },
    ],
    'Bathroom': [
      { name: 'Spa Retreat', color: '#ebf8ff', wallColor: '#3182ce', groutColor: '#bee3f8', pattern: 'mosaic', tile: { width: 30, length: 30 }, textureUrl: 'https://picsum.photos/seed/mosaic/512/512' },
      { name: 'Zen Stone', color: '#edf2f7', wallColor: '#4a5568', groutColor: '#cbd5e0', pattern: 'square', tile: { width: 60, length: 60 }, textureUrl: 'https://picsum.photos/seed/stone/512/512' },
      { name: 'Art Deco', color: '#ffffff', wallColor: '#000000', groutColor: '#e2e8f0', pattern: 'herringbone', tile: { width: 30, length: 10 } },
    ],
    'Bedroom': [
      { name: 'Cozy Oak', color: '#744210', wallColor: '#fefcbf', groutColor: '#542c0d', pattern: 'offset', tile: { width: 120, length: 20 }, textureUrl: 'https://picsum.photos/seed/wood/512/512' },
      { name: 'Cloud Soft', color: '#f7fafc', wallColor: '#edf2f7', groutColor: '#e2e8f0', pattern: 'square', tile: { width: 80, length: 80 }, textureUrl: 'https://picsum.photos/seed/marble/512/512' },
      { name: 'Minimalist Loft', color: '#4a5568', wallColor: '#ffffff', groutColor: '#2d3748', pattern: 'square', tile: { width: 60, length: 60 } },
    ],
    'Living Room': [
      { name: 'Grand Hall', color: '#ffffff', wallColor: '#2d3748', groutColor: '#edf2f7', pattern: 'diagonal', tile: { width: 80, length: 80 }, textureUrl: 'https://picsum.photos/seed/marble/512/512' },
      { name: 'Industrial Concrete', color: '#718096', wallColor: '#1a202c', groutColor: '#2d3748', pattern: 'square', tile: { width: 100, length: 100 } },
      { name: 'Classic Parquet', color: '#975a16', wallColor: '#fffaf0', groutColor: '#542c0d', pattern: 'basketweave', tile: { width: 60, length: 60 }, textureUrl: 'https://picsum.photos/seed/wood/512/512' },
    ]
  };

  const PRESETS = [
    { name: 'Modern Grey', color: '#4a5568', wallColor: '#f7fafc', groutColor: '#2d3748', pattern: 'square' as TilePattern },
    { name: 'Warm Terracotta', color: '#c05621', wallColor: '#fffaf0', groutColor: '#7b341e', pattern: 'offset' as TilePattern },
    { name: 'Classic Marble', color: '#ffffff', wallColor: '#edf2f7', groutColor: '#cbd5e0', pattern: 'diagonal' as TilePattern, textureUrl: 'https://picsum.photos/seed/marble/512/512' },
    { name: 'Deep Ocean', color: '#2c5282', wallColor: '#ebf8ff', groutColor: '#1a365d', pattern: 'mosaic' as TilePattern },
    { name: '3D Illusion', color: '#ffffff', wallColor: '#1a202c', groutColor: '#000000', pattern: '3d-cube' as TilePattern },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <Calculator className="w-6 h-6 text-indigo-600" />
          <h3>Enter Room Details</h3>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Room Type</label>
              <select 
                name="room.type"
                value={config.room.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select Room Type</option>
                <option value="Hall">Hall</option>
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Office">Office</option>
                <option value="Balcony">Balcony</option>
                <option value="Garage">Garage</option>
                <option value="Store Room">Store Room</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Length (m)</label>
                <input 
                  type="number" 
                  name="room.length"
                  value={config.room.length ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Width (m)</label>
                <input 
                  type="number" 
                  name="room.width"
                  value={config.room.width ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Room Height (m)</label>
              <input 
                type="number" 
                name="room.height"
                value={config.room.height ?? ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="includeWallTiles"
                name="includeWallTiles"
                checked={config.includeWallTiles}
                onChange={handleInputChange}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="includeWallTiles" className="text-sm font-bold text-slate-700">Include Wall Tiles</label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Floor Tile L (cm)</label>
                <input 
                  type="number" 
                  name="tile.length"
                  value={config.tile.length ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Floor Tile W (cm)</label>
                <input 
                  type="number" 
                  name="tile.width"
                  value={config.tile.width ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Floor Tile Cost (₹)</label>
              <input 
                type="number" 
                name="costPerTile"
                value={config.costPerTile ?? ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {config.includeWallTiles && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Wall Tile L (cm)</label>
                    <input 
                      type="number" 
                      name="wallTile.length"
                      value={config.wallTile?.length ?? ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Wall Tile W (cm)</label>
                    <input 
                      type="number" 
                      name="wallTile.width"
                      value={config.wallTile?.width ?? ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Wall Tile Cost (₹)</label>
                  <input 
                    type="number" 
                    name="wallTileCost"
                    value={config.wallTileCost ?? ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Wall Pattern</label>
                  <select 
                    name="wallPattern"
                    value={config.wallPattern}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="square">Square</option>
                    <option value="checker">Checker</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="offset">Offset (Brick)</option>
                    <option value="herringbone">Herringbone</option>
                    <option value="basketweave">Basketweave</option>
                    <option value="mosaic">Mosaic</option>
                    <option value="windmill">Windmill</option>
                    <option value="hopscotch">Hopscotch</option>
                    <option value="chevron">Chevron</option>
                    <option value="random-mix">Random Mix</option>
                    <option value="modular-3">Modular (3 sizes)</option>
                    <option value="pinwheel">Pinwheel</option>
                    <option value="versailles">Versailles (4 sizes)</option>
                    <option value="3d-cube">3D Cube Illusion</option>
                    <option value="medallion">Central Medallion</option>
                    <option value="circle">Circle Pattern</option>
                    <option value="triangle">Triangle Pattern</option>
                    <option value="diamond">Diamond Pattern</option>
                    <option value="cross">Cross Pattern</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Floor Texture</label>
            <select 
              name="textureUrl"
              value={config.textureUrl || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Plain Color</option>
              <option value="https://picsum.photos/seed/geometric/512/512">Geometric Modern</option>
              <option value="https://picsum.photos/seed/marble/512/512">Marble Texture</option>
              <option value="https://picsum.photos/seed/wood/512/512">Wood Texture</option>
              <option value="https://picsum.photos/seed/mosaic/512/512">Mosaic Pattern</option>
              <option value="https://picsum.photos/seed/tiles/512/512">Classic Tiles</option>
            </select>
          </div>
          {config.includeWallTiles && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Wall Texture</label>
              <select 
                name="wallTextureUrl"
                value={config.wallTextureUrl || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Plain Color</option>
                <option value="https://picsum.photos/seed/geometric/512/512">Geometric Modern</option>
                <option value="https://picsum.photos/seed/wall/512/512">Wall Texture</option>
                <option value="https://picsum.photos/seed/stone/512/512">Stone Texture</option>
                <option value="https://picsum.photos/seed/mosaic-wall/512/512">Mosaic Wall</option>
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Floor Pattern</label>
            <select 
              name="pattern"
              value={config.pattern}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="square">Square</option>
              <option value="checker">Checker</option>
              <option value="diagonal">Diagonal</option>
              <option value="offset">Offset (Brick)</option>
              <option value="herringbone">Herringbone</option>
              <option value="basketweave">Basketweave</option>
              <option value="mosaic">Mosaic</option>
              <option value="windmill">Windmill</option>
              <option value="hopscotch">Hopscotch</option>
              <option value="chevron">Chevron</option>
              <option value="random-mix">Random Mix</option>
              <option value="modular-3">Modular (3 sizes)</option>
              <option value="pinwheel">Pinwheel</option>
              <option value="versailles">Versailles (4 sizes)</option>
              <option value="3d-cube">3D Cube Illusion</option>
              <option value="medallion">Central Medallion</option>
              <option value="circle">Circle Pattern</option>
              <option value="triangle">Triangle Pattern</option>
              <option value="diamond">Diamond Pattern</option>
              <option value="cross">Cross Pattern</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Floor Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  name="color"
                  value={config.color}
                  onChange={handleInputChange}
                  className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                />
                <input 
                  type="text" 
                  name="color"
                  value={config.color}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Wall Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  name="wallColor"
                  value={config.wallColor}
                  onChange={handleInputChange}
                  className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                />
                <input 
                  type="text" 
                  name="wallColor"
                  value={config.wallColor}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Grout Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                name="groutColor"
                value={config.groutColor}
                onChange={handleInputChange}
                className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
              />
              <input 
                type="text" 
                name="groutColor"
                value={config.groutColor}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          {config.room.type && ROOM_PRESETS[config.room.type] && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-indigo-600 uppercase mb-2 block tracking-widest">Recommended for {config.room.type}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROOM_PRESETS[config.room.type].map((p) => (
                  <button
                    key={p.name}
                    onClick={() => onChange({ ...config, ...p })}
                    className="group relative overflow-hidden p-3 text-left bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: p.color }} />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{p.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">
                      {p.pattern} • {p.tile.width}x{p.tile.length}cm
                    </div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500 translate-x-4 -translate-y-4 rotate-45 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Global Themes</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onChange({ ...config, ...p })}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output Summary */}
      {hasCalculated ? (
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold tracking-tight">Calculation Output</h3>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Project Cost</p>
                <p className="text-3xl font-black text-green-400">₹{results.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Floor Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Floor Requirements</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Room Area</p>
                  <p className="text-lg font-bold">{results.roomArea.toFixed(2)} m²</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Base Tiles</p>
                  <p className="text-lg font-bold">{results.tilesRequired}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Wastage Tiles</p>
                  <p className="text-lg font-bold text-red-400">{results.wastage}</p>
                </div>
                <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-500/20">
                  <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Tiles</p>
                  <p className="text-lg font-bold text-indigo-400">{results.totalTiles}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl col-span-2">
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Floor Tile Cost</p>
                  <p className="text-xl font-bold text-green-400">₹{(results.totalTiles * results.oneTileCost).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Wall Section */}
            {config.includeWallTiles ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Wall Requirements</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Wall Area</p>
                    <p className="text-lg font-bold">{results.wallArea.toFixed(2)} m²</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Base Tiles</p>
                    <p className="text-lg font-bold">{results.wallTilesRequired}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Wastage Tiles</p>
                    <p className="text-lg font-bold text-red-400">{results.wallWastage}</p>
                  </div>
                  <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-500/20">
                    <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Tiles</p>
                    <p className="text-lg font-bold text-indigo-400">{results.totalWallTiles}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl col-span-2">
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Wall Tile Cost</p>
                    <p className="text-xl font-bold text-green-400">₹{(results.totalWallTiles * results.oneWallTileCost).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-800 p-6">
                <p className="text-slate-500 text-xs font-medium italic">Wall tiles not included in this plan</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">One Tile Cost (Floor)</p>
              <p className="text-xl font-bold">₹{results.oneTileCost}</p>
            </div>
            {config.includeWallTiles && (
              <div className="space-y-1">
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">One Tile Cost (Wall)</p>
                <p className="text-xl font-bold">₹{results.oneWallTileCost}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Room Type</p>
              <p className="text-xl font-bold capitalize">{config.room.type || 'Standard'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Grout Gap</p>
              <p className="text-xl font-bold">{config.gap} mm</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-2">
          <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">Fill in all details to see results</p>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3>AI Design Suggestions</h3>
          </div>
          <button 
            onClick={fetchSuggestions}
            disabled={isSuggesting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isSuggesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Get Suggestions
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((s, idx) => (
              <div 
                key={idx} 
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group"
                onClick={() => applySuggestion(s)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase">{s.pattern}</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: s.color }} title="Tile Color" />
                    <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: s.wallColor }} title="Wall Color" />
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{s.reasoning}</p>
                <button className="w-full py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  APPLY DESIGN
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
