import { createContext, useContext } from 'react';

export const ClipficsContext = createContext();

export const useClipfics = () => {
  return useContext(ClipficsContext);
}
