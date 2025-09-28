import { SceneManager } from './SceneManager';

export class SettingsUI {
    private static sceneManager: SceneManager | null = null;

    public static initialize(sceneManager: SceneManager): void {
        this.sceneManager = sceneManager;
    }

  public static async changeCharacter(_characterIndexOrName: number | string): Promise<void> {

  }

    public static async changeEnvironment(environmentName: string): Promise<void> {
        if (this.sceneManager) {
            // Check if the environment is actually different from current
            const currentEnvironment = this.sceneManager.getCurrentEnvironment();
            if (currentEnvironment === environmentName) {

                return; // No change needed
            }



            // Pause physics to prevent character from falling during environment change
            this.sceneManager.pausePhysics();

            // Clear existing environment, items, and particles
            this.sceneManager.clearEnvironment();
            this.sceneManager.clearItems();
            this.sceneManager.clearParticles();

            // Load the new environment

            await this.sceneManager.loadEnvironment(environmentName);

            // Set up environment items for the new environment

            await this.sceneManager.setupEnvironmentItems();

            // Reposition character to safe location in new environment
            this.sceneManager.repositionCharacter();

            // Force activate smooth camera following after environment transition
            this.sceneManager.forceActivateSmoothFollow();

            // Resume physics after environment is loaded
            this.sceneManager.resumePhysics();


        }
    }
}
