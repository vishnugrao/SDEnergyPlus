import { BuildingDesign } from '../types/building';

interface Memento {
    state: BuildingDesign;
    timestamp: Date;
}

export class BuildingDesignMemento {
    private states: Memento[] = [];
    private currentIndex: number = -1;
    private maxStates: number = 50; // Maximum number of states to keep

    constructor(initialState?: BuildingDesign) {
        if (initialState) {
            this.saveState(initialState);
        }
    }

    public saveState(state: BuildingDesign): void {
        // Remove any future states if we're not at the end
        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1);
        }

        // Add new state
        this.states.push({
            state: { ...state },
            timestamp: new Date()
        });

        // Maintain maximum number of states
        if (this.states.length > this.maxStates) {
            this.states.shift();
        }

        this.currentIndex = this.states.length - 1;
    }

    public undo(): BuildingDesign | null {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return { ...this.states[this.currentIndex].state };
        }
        return null;
    }

    public redo(): BuildingDesign | null {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            return { ...this.states[this.currentIndex].state };
        }
        return null;
    }

    public canUndo(): boolean {
        return this.currentIndex > 0;
    }

    public canRedo(): boolean {
        return this.currentIndex < this.states.length - 1;
    }

    public getCurrentState(): BuildingDesign | null {
        if (this.currentIndex >= 0) {
            return { ...this.states[this.currentIndex].state };
        }
        return null;
    }

    public getStateHistory(): Memento[] {
        return this.states.map(memento => ({
            state: { ...memento.state },
            timestamp: new Date(memento.timestamp)
        }));
    }

    public compareStates(index1: number, index2: number): Record<string, any> {
        if (index1 < 0 || index2 < 0 || index1 >= this.states.length || index2 >= this.states.length) {
            throw new Error('Invalid state indices');
        }

        const state1 = this.states[index1].state;
        const state2 = this.states[index2].state;

        const differences: Record<string, any> = {};

        // Compare facades
        Object.keys(state1.facades).forEach(facade => {
            const facade1 = state1.facades[facade as keyof typeof state1.facades];
            const facade2 = state2.facades[facade as keyof typeof state2.facades];

            Object.keys(facade1).forEach(prop => {
                if (facade1[prop as keyof typeof facade1] !== facade2[prop as keyof typeof facade2]) {
                    if (!differences.facades) {
                        differences.facades = {};
                    }
                    if (!differences.facades[facade]) {
                        differences.facades[facade] = {};
                    }
                    differences.facades[facade][prop] = {
                        from: facade1[prop as keyof typeof facade1],
                        to: facade2[prop as keyof typeof facade2]
                    };
                }
            });
        });

        // Compare skylight if present
        if (state1.skylight || state2.skylight) {
            if (!state1.skylight || !state2.skylight) {
                differences.skylight = {
                    from: state1.skylight,
                    to: state2.skylight
                };
            } else {
                Object.keys(state1.skylight).forEach(prop => {
                    if (state1.skylight![prop as keyof typeof state1.skylight] !== 
                        state2.skylight![prop as keyof typeof state2.skylight]) {
                        if (!differences.skylight) {
                            differences.skylight = {};
                        }
                        differences.skylight[prop] = {
                            from: state1.skylight![prop as keyof typeof state1.skylight],
                            to: state2.skylight![prop as keyof typeof state2.skylight]
                        };
                    }
                });
            }
        }

        return differences;
    }
} 