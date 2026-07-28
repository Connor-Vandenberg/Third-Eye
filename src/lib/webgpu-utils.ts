/**
 * WebGPU Utilities
 * Detects WebGPU availability and provides fallback to WebGL2.
 * Used by deck.gl for 260M+ point rendering when available.
 *
 * deck.gl 9.3+ supports WebGPU via luma.gl v9.
 * When WebGPU is available, deck.gl uses compute shaders for aggregation
 * and instanced rendering for massive point clouds.
 *
 * Fallback: WebGL2 (still handles 100K+ tracks at 60fps).
 */

export interface GPUCapabilities {
  webgpu: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  maxVertexAttributes: number;
  renderer: string;
  vendor: string;
  supportsFloat32Filtering: boolean;
}

export async function detectGPUCapabilities(): Promise<GPUCapabilities> {
  const caps: GPUCapabilities = {
    webgpu: false,
    webgl2: false,
    maxTextureSize: 0,
    maxVertexAttributes: 0,
    renderer: 'unknown',
    vendor: 'unknown',
    supportsFloat32Filtering: false,
  };

  // Check WebGPU
  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        caps.webgpu = true;
        const info = await adapter.requestAdapterInfo();
        caps.renderer = info.device || 'WebGPU Device';
        caps.vendor = info.vendor || 'Unknown';

        // Check float32 filtering support (needed for HeatmapLayer)
        caps.supportsFloat32Filtering = adapter.features.has('float32-filterable');
      }
    } catch {
      // WebGPU not available or failed
    }
  }

  // Check WebGL2
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      caps.webgl2 = true;
      caps.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      caps.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        caps.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        caps.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    }
  } catch {
    // WebGL2 not available
  }

  return caps;
}

/**
 * Get optimal deck.gl device configuration based on capabilities.
 * Returns props to pass to Deck constructor.
 */
export function getDeckDeviceProps(caps: GPUCapabilities) {
  if (caps.webgpu) {
    return {
      deviceType: 'webgpu' as const,
      // WebGPU-specific optimizations
      parameters: {
        // Enable depth testing for 3D layers
        depthTest: true,
        depthFunc: 'less-equal',
        // Enable blending for transparency
        blend: true,
      },
    };
  }

  // Fallback: WebGL2
  return {
    deviceType: 'webgl2' as const,
    glOptions: {
      // Performance hints for WebGL2
      antialias: false, // Better perf, deck.gl handles AA
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance' as const,
    },
  };
}

/**
 * Estimate maximum renderable points for current GPU.
 * Used to auto-set LOD thresholds.
 */
export function estimateMaxPoints(caps: GPUCapabilities): number {
  if (caps.webgpu) {
    // WebGPU: can handle 100M+ with instancing
    return 100_000_000;
  }

  if (caps.webgl2) {
    // WebGL2: depends on GPU, but typically 1M-10M
    if (caps.maxTextureSize >= 16384) return 10_000_000;
    if (caps.maxTextureSize >= 8192) return 5_000_000;
    return 1_000_000;
  }

  // Fallback: very limited
  return 100_000;
}
