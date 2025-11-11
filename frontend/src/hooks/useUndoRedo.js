import { useState, useCallback } from 'react';

export const useUndoRedo = (initialState) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const set = useCallback((newState) => {
    const updatedState = typeof newState === 'function' ? newState(state) : newState;
    setHistory(prev => [...prev.slice(0, index + 1), updatedState]);
    setIndex(prev => prev + 1);
    setState(updatedState);
  }, [state, index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      setState(history[index - 1]);
    }
  }, [index, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prev => prev + 1);
      setState(history[index + 1]);
    }
  }, [index, history]);

  return { state, set, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
};
