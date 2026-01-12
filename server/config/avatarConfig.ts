/**
 * Avatar configuration for AI models in debates
 * Server-side version for random assignment
 */

export const AVATAR_PATHS = [
    '/avatars/01-the-oracle.jpg',
    '/avatars/02-the-analyst.jpg',
    '/avatars/03-logic-core.jpg',
    '/avatars/04-synaptic-poet.jpg',
    '/avatars/05-provocateur.jpg',
    '/avatars/06-the-jurist.jpg',
    '/avatars/07-deep-thinker.jpg',
    '/avatars/08-data-oracle.jpg',
    '/avatars/09-the-skeptic.jpg',
    '/avatars/10-system-mind.jpg',
    '/avatars/11-cyber-scholar.jpg',
    '/avatars/12-abstract-logic.jpg',
    '/avatars/13-the-architect.jpg',
    '/avatars/14-echo-mind.jpg',
    '/avatars/15-neon-sage.jpg',
    '/avatars/16-neuron-x.jpg',
    '/avatars/17-vortex.jpg',
    '/avatars/18-cypher.jpg',
    '/avatars/19-prism.jpg',
    '/avatars/20-axon.jpg',
    '/avatars/21-ghost.jpg',
    '/avatars/22-plasma.jpg',
    '/avatars/23-cloud.jpg',
    '/avatars/24-void.jpg',
    '/avatars/25-flux.jpg',
] as const;

/**
 * Randomly assigns unique avatars to a list of model IDs
 * @param modelIds - Array of model IDs to assign avatars to
 * @returns Record mapping modelId to avatar path
 */
export function assignRandomAvatars(modelIds: string[]): Record<string, string> {
    const availableAvatars = [...AVATAR_PATHS];
    const assignments: Record<string, string> = {};

    // Shuffle avatars for randomness
    for (let i = availableAvatars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableAvatars[i], availableAvatars[j]] = [availableAvatars[j], availableAvatars[i]];
    }

    // Assign avatars to models
    modelIds.forEach((modelId, index) => {
        // Cycle through avatars if we have more models than avatars
        assignments[modelId] = availableAvatars[index % availableAvatars.length];
    });

    return assignments;
}
