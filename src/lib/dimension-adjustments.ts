/**
 * Utility functions for adjusting item dimensions based on item type
 */

export type ItemType = 'standard' | 'rug' | 'tv' | 'picture' | 'bed' | 'mattress' | 'bedframe';

export interface Dimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

/**
 * Adjusts dimensions for rugs/rollable items to rolled up size
 * Typical rolled rug: diameter ~12-18", height ~36-48"
 */
export function getRolledRugDimensions(originalDimensions: Dimensions): Dimensions {
  // If dimensions are provided, calculate rolled size
  if (originalDimensions.length && originalDimensions.width) {
    // Estimate rolled diameter based on area
    const area = originalDimensions.length * originalDimensions.width;
    const diameter = Math.sqrt(area / Math.PI) * 0.15; // Rough estimate: 15% of flat size
    const height = Math.max(originalDimensions.length, originalDimensions.width) * 0.1; // 10% of longest dimension
    
    return {
      length: Math.round(diameter),
      width: Math.round(diameter),
      height: Math.round(Math.max(height, 36)) // Minimum 36" height
    };
  }
  
  // Default rolled rug dimensions
  return {
    length: 15,
    width: 15,
    height: 42
  };
}

/**
 * Adjusts dimensions for TVs to include box padding
 * Adds 4-6 inches padding on all sides for packaging
 */
export function getTVBoxDimensions(originalDimensions: Dimensions): Dimensions {
  const padding = 6; // 6 inches padding on all sides
  
  return {
    length: originalDimensions.length ? originalDimensions.length + (padding * 2) : null,
    width: originalDimensions.width ? originalDimensions.width + (padding * 2) : null,
    height: originalDimensions.height ? originalDimensions.height + (padding * 2) : null
  };
}

/**
 * Adjusts dimensions for pictures/frames to include box padding
 * Adds 2-4 inches padding for picture frame boxes
 */
export function getPictureBoxDimensions(originalDimensions: Dimensions): Dimensions {
  const padding = 4; // 4 inches padding on all sides
  
  return {
    length: originalDimensions.length ? originalDimensions.length + (padding * 2) : null,
    width: originalDimensions.width ? originalDimensions.width + (padding * 2) : null,
    height: originalDimensions.height ? originalDimensions.height + (padding * 2) : null
  };
}

/**
 * Gets standard mattress dimensions based on size
 */
export function getMattressDimensions(mattressSize: 'twin' | 'full' | 'queen' | 'king' | 'cal-king' = 'queen'): Dimensions {
  const sizes: Record<string, Dimensions> = {
    twin: { length: 75, width: 38, height: 10 },
    full: { length: 75, width: 54, height: 10 },
    queen: { length: 80, width: 60, height: 10 },
    king: { length: 80, width: 76, height: 10 },
    'cal-king': { length: 84, width: 72, height: 10 }
  };
  
  return sizes[mattressSize] || sizes.queen;
}

/**
 * Gets bedframe dimensions based on mattress size and collapsible status
 */
export function getBedframeDimensions(
  mattressSize: 'twin' | 'full' | 'queen' | 'king' | 'cal-king' = 'queen',
  isCollapsible: boolean = false
): Dimensions {
  const mattressDims = getMattressDimensions(mattressSize);
  
  if (isCollapsible) {
    // Collapsible bedframe: typically 6-8" height, width and length match mattress
    return {
      length: mattressDims.length,
      width: mattressDims.width,
      height: 7 // Collapsed height
    };
  } else {
    // Non-collapsible bedframe: typically 12-18" height
    return {
      length: mattressDims.length,
      width: mattressDims.width,
      height: 15 // Standard bedframe height
    };
  }
}

/**
 * Detects item type from shortName
 */
export function detectItemType(shortName: string): ItemType {
  const lower = shortName.toLowerCase();
  
  // Check for rugs/carpets - must be before other checks
  if (lower.includes('rug') || lower.includes('carpet') || lower.includes('mat') || 
      lower.includes('runner') || lower.includes('area rug')) {
    console.log(`🔍 Detected RUG: "${shortName}"`);
    return 'rug';
  }
  
  // Check for TV/monitors
  if (lower.includes('tv') || lower.includes('television') || lower.includes('monitor') ||
      lower.includes('flatscreen') || lower.includes('flat-screen') || lower.includes('display')) {
    console.log(`🔍 Detected TV: "${shortName}"`);
    return 'tv';
  }
  
  // Check for pictures/frames
  if (lower.includes('picture') || lower.includes('frame') || lower.includes('art') || 
      lower.includes('painting') || lower.includes('artwork') || lower.includes('photo') ||
      lower.includes('mirror')) {
    console.log(`🔍 Detected PICTURE: "${shortName}"`);
    return 'picture';
  }
  
  // Check for mattress specifically
  if (lower.includes('mattress')) {
    console.log(`🔍 Detected MATTRESS: "${shortName}"`);
    return 'mattress';
  }
  
  // Check for bed frame specifically
  if (lower.includes('bed frame') || lower.includes('bedframe') || lower.includes('bedstead')) {
    console.log(`🔍 Detected BEDFRAME: "${shortName}"`);
    return 'bedframe';
  }
  
  // Check for bed (must be after mattress and bedframe checks)
  // This includes: bed, bedroom set, platform bed, sleigh bed, etc.
  if (lower.includes('bed') || lower.includes('bedroom') || lower.includes('bunk') ||
      lower.includes('crib') || lower.includes('sleeper')) {
    console.log(`🔍 Detected BED (will split): "${shortName}"`);
    return 'bed';
  }
  
  console.log(`🔍 Detected STANDARD: "${shortName}"`);
  return 'standard';
}

/**
 * Adjusts dimensions based on item type
 */
export function adjustDimensionsForItemType(
  itemType: ItemType,
  originalDimensions: Dimensions,
  isCollapsible?: boolean
): Dimensions {
  console.log(`🔧 Adjusting dimensions for itemType: ${itemType}`, originalDimensions);
  
  switch (itemType) {
    case 'rug':
      const rugDims = getRolledRugDimensions(originalDimensions);
      console.log(`📐 Rug rolled: ${JSON.stringify(originalDimensions)} → ${JSON.stringify(rugDims)}`);
      return rugDims;
    
    case 'tv':
      const tvDims = getTVBoxDimensions(originalDimensions);
      console.log(`📺 TV boxed: ${JSON.stringify(originalDimensions)} → ${JSON.stringify(tvDims)}`);
      return tvDims;
    
    case 'picture':
      const picDims = getPictureBoxDimensions(originalDimensions);
      console.log(`🖼️ Picture boxed: ${JSON.stringify(originalDimensions)} → ${JSON.stringify(picDims)}`);
      return picDims;
    
    case 'bedframe':
      // For bedframe, we need to infer mattress size from dimensions
      const mattressSize = inferMattressSize(originalDimensions);
      const bedframeDims = getBedframeDimensions(mattressSize, isCollapsible || false);
      console.log(`🛏️ Bedframe (${mattressSize}, collapsible: ${isCollapsible}): ${JSON.stringify(bedframeDims)}`);
      return bedframeDims;
    
    case 'mattress':
      // For mattress, use standard dimensions if not provided
      if (!originalDimensions.length || !originalDimensions.width) {
        const defaultDims = getMattressDimensions('queen');
        console.log(`🛏️ Mattress (default queen): ${JSON.stringify(defaultDims)}`);
        return defaultDims;
      }
      console.log(`🛏️ Mattress (original): ${JSON.stringify(originalDimensions)}`);
      return originalDimensions;
    
    case 'bed':
      // Beds should be split, but if we're here, return original
      console.log(`⚠️ Warning: adjustDimensionsForItemType called with 'bed' type - should be split first`);
      return originalDimensions;
    
    default:
      console.log(`📦 Standard item (no adjustment): ${JSON.stringify(originalDimensions)}`);
      return originalDimensions;
  }
}

/**
 * Infers mattress size from dimensions
 */
function inferMattressSize(dimensions: Dimensions): 'twin' | 'full' | 'queen' | 'king' | 'cal-king' {
  if (!dimensions.length || !dimensions.width) {
    return 'queen'; // Default
  }
  
  const length = dimensions.length;
  const width = dimensions.width;
  
  // Standard mattress dimensions (length x width)
  if (length >= 82 && length <= 86 && width >= 70 && width <= 74) {
    return 'cal-king';
  }
  if (length >= 78 && length <= 82 && width >= 74 && width <= 78) {
    return 'king';
  }
  if (length >= 78 && length <= 82 && width >= 58 && width <= 62) {
    return 'queen';
  }
  if (length >= 73 && length <= 77 && width >= 52 && width <= 56) {
    return 'full';
  }
  if (length >= 73 && length <= 77 && width >= 36 && width <= 40) {
    return 'twin';
  }
  
  return 'queen'; // Default
}

