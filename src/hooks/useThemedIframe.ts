// hooks/useThemedIframe.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  injectThemeIntoHTML,
  getThemeColors,
} from '../utils/iframeThemeInjector';

interface UseThemedIframeProps {
  htmlContent: string;
  enabled?: boolean;
}

interface UseThemedIframeReturn {
  processedHTML: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  sendThemeUpdate: () => void;
}

export const useThemedIframe = ({
  htmlContent,
  enabled = true,
}: UseThemedIframeProps): UseThemedIframeReturn => {
  const { isDark } = useTheme();
  const [processedHTML, setProcessedHTML] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Process HTML with theme injection when content or theme changes
  useEffect(() => {
    if (!htmlContent || !enabled) {
      setProcessedHTML(htmlContent);
      return;
    }

    const themeColors = getThemeColors(isDark);
    const themedHTML = injectThemeIntoHTML(htmlContent, themeColors);
    setProcessedHTML(themedHTML);
  }, [htmlContent, isDark, enabled]);

  // Send theme update to iframe
  const sendThemeUpdate = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !enabled) return;

    const themeColors = getThemeColors(isDark);

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'THEME_UPDATE',
        theme: themeColors,
      },
      '*'
    );
  }, [isDark, enabled]);

  // Send theme update when theme changes (with delay for iframe loading)
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      sendThemeUpdate();
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled, sendThemeUpdate]);

  return {
    processedHTML,
    iframeRef,
    sendThemeUpdate,
  };
};
