import { useState, useCallback } from 'react';
import { BuildingDesign } from '../types/building';
import { BuildingDesignMemento } from '../services/memento';

export function useMemento(initialState?: BuildingDesign) {
    const [memento] = useState(() => new BuildingDesignMemento(initialState));
    const [currentState, setCurrentState] = useState<BuildingDesign | null>(
        initialState || null
    );

    const saveState = useCallback((state: BuildingDesign) => {
        memento.saveState(state);
        setCurrentState({ ...state });
    }, [memento]);

    const undo = useCallback(() => {
        const previousState = memento.undo();
        if (previousState) {
            setCurrentState(previousState);
        }
    }, [memento]);

    const redo = useCallback(() => {
        const nextState = memento.redo();
        if (nextState) {
            setCurrentState(nextState);
        }
    }, [memento]);

    const canUndo = useCallback(() => memento.canUndo(), [memento]);
    const canRedo = useCallback(() => memento.canRedo(), [memento]);

    const getStateHistory = useCallback(() => memento.getStateHistory(), [memento]);

    const compareStates = useCallback((index1: number, index2: number) => {
        return memento.compareStates(index1, index2);
    }, [memento]);

    return {
        currentState,
        saveState,
        undo,
        redo,
        canUndo,
        canRedo,
        getStateHistory,
        compareStates
    };
} 