import { createContext, useContext } from 'react';

export const ClipficsContext = createContext();

export const useClipficsContext = () => {
  return useContext(ClipficsContext);
}
