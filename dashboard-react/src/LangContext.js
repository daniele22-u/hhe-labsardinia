import { createContext, useContext } from 'react';
export const LangContext = createContext('en');
export const useLang = () => useContext(LangContext);
