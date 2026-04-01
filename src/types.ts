export type TilePattern = 'square' | 'checker' | 'diagonal' | 'offset' | 'herringbone' | 'basketweave' | 'mosaic' | 'windmill' | 'hopscotch' | 'chevron' | 'random-mix' | 'modular-3' | 'pinwheel' | 'versailles' | '3d-cube' | 'medallion' | 'circle' | 'triangle' | 'diamond' | 'cross';

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
  type: string; // e.g., 'hall', 'kitchen', 'bedroom'
}

export interface TileDimensions {
  width: number;
  length: number;
}

export interface TileConfig {
  room: RoomDimensions;
  tile: TileDimensions;
  wallTile?: TileDimensions; // Optional: if different from floor
  costPerTile: number;
  wallTileCost?: number;
  includeWallTiles: boolean;
  pattern: TilePattern;
  wallPattern: TilePattern;
  gap: number; // grout gap in mm
  color: string;
  wallColor: string;
  textureUrl?: string;
  wallTextureUrl?: string;
  groutColor: string;
}

export interface CalculationResult {
  roomArea: number;
  wallArea: number;
  tileArea: number;
  wallTileArea: number;
  tilesRequired: number;
  wallTilesRequired: number;
  totalTiles: number;
  totalWallTiles: number;
  totalCost: number;
  oneTileCost: number;
  oneWallTileCost: number;
  wastage: number;
  wallWastage: number;
}

export interface AISuggestion {
  pattern: TilePattern;
  tileSize: { width: number; length: number };
  wallTileSize?: { width: number; length: number };
  color: string;
  wallColor: string;
  reasoning: string;
}
