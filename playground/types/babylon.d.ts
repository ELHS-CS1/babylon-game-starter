// ============================================================================
// BABYLON.JS TYPE DECLARATIONS FOR PLAYGROUND V2
// ============================================================================

// Global BABYLON namespace is available in Playground v2
declare global {
    const BABYLON: any;
    
    namespace BABYLON {
        interface Scene {
            engine: any;
            meshes: any[];
            animationGroups: any[];
            deltaTime: number;
            onPointerObservable: any;
            onBeforeRenderObservable: any;
            onAfterPhysicsObservable: any;
            onKeyboardObservable: any;
            enablePhysics(gravity: any, plugin: any): void;
            getAnimationGroupByName(name: string): any;
            getEngine(): any;
            getRenderingCanvas(): HTMLCanvasElement | null;
        }

        interface Engine {
            getRenderingCanvas(): HTMLCanvasElement | null;
        }

        interface TargetCamera {
            position: any;
            lockedTarget: any;
            setTarget(target: any): void;
            getDirection(direction: any): any;
        }

        interface Vector3 {
            x: number;
            y: number;
            z: number;
            length(): number;
            normalize(): any;
            normalizeToNew(): any;
            normalizeFromLength(length: number): void;
            add(other: any): any;
            addInPlace(other: any): void;
            subtract(other: any): any;
            subtractInPlace(other: any): void;
            scale(factor: number): any;
            scaleInPlace(factor: number): void;
            copyFrom(other: any): void;
            clone(): any;
            dot(other: any): number;
            cross(other: any): any;
            applyRotationQuaternion(quaternion: any): any;
            rotateByQuaternionToRef(quaternion: any, result: any): any;
        }

        interface Quaternion {
            x: number;
            y: number;
            z: number;
            w: number;
            copyFrom(other: any): void;
        }

        interface Mesh {
            geometry: any;
            material: any;
            scaling: any;
            rotation: any;
            rotationQuaternion: any;
            position: any;
            isVisible: boolean;
            parent: any;
            name: string;
            dispose(): void;
        }

        interface AbstractMesh {
            name: string;
            position: any;
            rotation: any;
            rotationQuaternion: any;
            scaling: any;
            isVisible: boolean;
            parent: any;
            material: any;
            dispose(): void;
        }

        interface PhysicsCharacterController {
            getPosition(): any;
            setPosition(position: any): void;
            getVelocity(): any;
            setVelocity(velocity: any): void;
            checkSupport(deltaTime: number, direction: any): any;
            calculateMovement(deltaTime: number, forward: any, up: any, currentVelocity: any, surfaceVelocity: any, desiredVelocity: any, gravity: any): any;
            integrate(deltaTime: number, supportInfo: any, gravity: any): void;
        }

        interface AnimationGroup {
            name: string;
            weight: number;
            start(loop?: boolean): void;
            stop(): void;
            dispose(): void;
        }

        interface ParticleSystem {
            name: string;
            emitter: any;
            particleTexture: any;
            minEmitBox: any;
            maxEmitBox: any;
            color1: any;
            color2: any;
            colorDead: any;
            gravity: any;
            direction1: any;
            direction2: any;
            start(): void;
            stop(): void;
            dispose(): void;
        }

        interface IParticleSystem extends ParticleSystem {}

        interface Sound {
            name: string;
            isPlaying: boolean;
            onended: (() => void) | null;
            play(): void;
            stop(): void;
            dispose(): void;
            setVolume(volume: number): void;
            getVolume(): number;
            setPosition(position: any): void;
        }

        interface CharacterSurfaceInfo {
            supportedState: any;
            averageSurfaceNormal: any;
            averageSurfaceVelocity: any;
        }

        interface Observable<T> {
            add(callback: (data: T) => void): any;
            remove(observer: any): void;
        }

        interface Observer<T> {}

        interface PointerInfo {
            type: any;
            event: PointerEvent;
        }

        interface KeyboardInfo {
            type: any;
            event: KeyboardEvent;
        }

        // Static classes
        class Vector3 {
            constructor(x: number, y: number, z: number);
            static Zero(): any;
            static Up(): any;
            static Down(): any;
            static Right(): any;
            static Forward(): any;
            static LerpToRef(from: any, to: any, amount: number, result: any): void;
        }

        class Quaternion {
            constructor(x: number, y: number, z: number, w: number);
            static FromEulerAngles(x: number, y: number, z: number): any;
            static FromEulerAnglesToRef(x: number, y: number, z: number, result: any): void;
        }

        class Scalar {
            static Clamp(value: number, min: number, max: number): number;
            static Lerp(start: number, end: number, amount: number): number;
            static LerpToRef(start: number, end: number, amount: number, result: any): void;
        }

        class MeshBuilder {
            static CreateCapsule(name: string, options: { height: number; radius: number }, scene: any): any;
        }

        class ParticleHelper {
            static ParseFromSnippetAsync(snippetId: string, scene: any, rootUrl?: string): Promise<any>;
        }

        class NodeMaterial {
            constructor(name: string, scene: any);
            static ParseFromSnippetAsync(snippetId: string, scene: any): Promise<any>;
        }

        // Import utilities
        function ImportMeshAsync(meshNames: string, rootUrl: string, sceneFilename: string, scene: any): Promise<{ meshes: any[]; particleSystems: any[]; skeletons: any[]; animationGroups: any[] }>;
    }
}

export {};