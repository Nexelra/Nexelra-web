import React, { useEffect, useRef } from 'react';
import { env } from '../../env'; 

declare global {
  interface Window {
    SDK: {
      launch: (config: any) => void;
    };
  }
}

interface EkycConfig {
  BACKEND_URL?: string;
  TOKEN_ID: string;
  TOKEN_KEY: string;
  ACCESS_TOKEN: string;
  CALL_BACK_END_FLOW: (result: any) => Promise<void>;
  HAS_BACKGROUND_IMAGE: boolean;
  LIST_TYPE_DOCUMENT: number[];
}

interface EkycSDKProps {
  config?: Partial<EkycConfig>;
  onResult?: (result: any) => void;
  cccdId?: string | null; 
}

const EkycSDK: React.FC<EkycSDKProps> = ({ config, onResult, cccdId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadSDK = async () => {
      try {
        await loadScript('/web-sdk-version-3.1.0.0.js');
        await loadScript('/lib/VNPTQRBrowserApp.js');
        await loadScript('/lib/VNPTBrowserSDKAppV4.0.0.js');

        
        const defaultConfig: EkycConfig = {
          BACKEND_URL: 'https://api.idg.vnpt.vn',
          TOKEN_ID: env.TOKEN_ID, 
          TOKEN_KEY: env.TOKEN_KEY, 
          ACCESS_TOKEN: env.ACCESS_TOKEN, 
          CALL_BACK_END_FLOW: async (result: any) => {
            console.log('result ==>', result);
            console.log('cccdId from props ==>', cccdId); 
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            if (onResult) {
              onResult(result);
            }
          },
          HAS_BACKGROUND_IMAGE: true,
          LIST_TYPE_DOCUMENT: [-1, 4, 5, 6, 7],
        };

        const finalConfig = { ...defaultConfig, ...config };

        
        if (window.SDK) {
          window.SDK.launch(finalConfig);
        }
      } catch (error) {
        console.error('Error loading eKYC SDK:', error);
      }
    };

    loadSDK();
  }, [config, onResult, cccdId]); 

  return (
    <div>
      <div id="ekyc_sdk_intergrated" ref={containerRef}></div>
    </div>
  );
};

export default EkycSDK;