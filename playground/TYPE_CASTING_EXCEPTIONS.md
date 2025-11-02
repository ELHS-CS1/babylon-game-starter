# Type Casting Exceptions (Temporary)

This document tracks temporary type casting solutions that need proper type definitions.

## Current Exceptions

### Lightmap Texture Properties (SceneManager)

**File:** `playground/managers/SceneManager.ts` (lines ~350-360)

**Issue:** `lightmapTexture.uAng` property not recognized by TypeScript for both `StandardMaterial` and `PBRMaterial`

**Current Workaround:** User added `@ts-ignore` and type casting:
```typescript
// @ts-ignore
(mesh.material.lightmapTexture as BABYLON.Texture).uAng = Math.PI;
```

**Location in SceneManager:**
- `setupLightmappedMeshes()` method
- Applied to both `StandardMaterial` and `PBRMaterial` lightmap textures

**Affected Properties:**
- `uAng` - Texture rotation angle
- `level` - Lightmap level  
- `coordinatesIndex` - Texture coordinate index

**Status:** Temporary solution until proper type definitions can be added to `babylon.d.ts`

**TODO:** Add these properties to `Texture` interface in `babylon.d.ts`:
```typescript
interface Texture {
    uAng: number;
    level: number;
    coordinatesIndex: number;
    // ... existing properties
}
```

## Resolution Plan

1. **Research Babylon.js Documentation** - Find official type definitions for lightmap texture properties
2. **Update babylon.d.ts** - Add missing properties to Texture interface
3. **Remove Type Casting** - Replace `@ts-ignore` and `as BABYLON.Texture` with proper typing
4. **Test** - Ensure lightmap functionality still works correctly

## Notes

- These are temporary workarounds to maintain functionality
- Type casting should be avoided when possible for better type safety
- All exceptions should be resolved before production deployment
