import { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';

interface AppContextProps {
    search: string | undefined;
    tagId: string | undefined;
    validUrl: boolean;
    initApp: () => Promise<boolean>;
    tabId?: number;
    setTabId: (tabId: number) => void;
}

const AppContext = createContext<AppContextProps>({
    search: undefined,
    tagId: undefined,
    validUrl: false,
    initApp: async () => false,
    tabId: undefined,
    setTabId: () => {},
});

export const AppContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [ search, setSearch ] = useState<string | undefined>();
    const [ tagId, setTagId ] = useState<string | undefined>();
    const [ validUrl, setValidUrl ] = useState<boolean>(false);
    const [ tabId, setTabId ] = useState<number | undefined>();

    const initApp = async () => {
        // Query for the active tab in the current window
        let valid = false;
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url;

        if (url) {
            const urlInfo = new URL(url);
            const hostname = urlInfo.hostname;
            if (hostname === 'threads.com' || hostname === 'www.threads.com') {
                const queryParams = new URLSearchParams(urlInfo.search);
                const {
                    q,
                    serp_type,
                    tag_id,
                    filter,
                } = Object.fromEntries(queryParams.entries());
                if (q && serp_type && tag_id && filter === 'recent') {
                    valid = true;
                    setSearch(q);
                    setTagId(tag_id);
                }
            }
        }
        setValidUrl(valid);

        return valid;
    };

    useEffect(() => {
        initApp();
    }, []);

    return (
      <AppContext.Provider value={{ search, tagId, validUrl, initApp, tabId, setTabId }}>
          {children}
      </AppContext.Provider>
    );
};

export const useAppContext = () => {
    if (!AppContext) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }
    return useContext(AppContext);
};
