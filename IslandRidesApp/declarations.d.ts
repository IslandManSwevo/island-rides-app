declare module 'styled-components/native' {
  import * as styled from 'styled-components/native';
  export * from 'styled-components/native';
  export default styled;
}

// Global type definitions
declare global {
  var global: typeof globalThis;
  var performance: Performance;
  var localStorage: Storage;
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      EXPO_PUBLIC_FIREBASE_API_KEY?: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
      EXPO_PUBLIC_FIREBASE_APP_ID?: string;
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_WEBSOCKET_URL?: string;
      [key: string]: string | undefined;
    }
    
    type Timeout = number;
  }
  
  var process: {
    env: NodeJS.ProcessEnv;
    nextTick: (callback: () => void) => void;
  };
  
  interface Performance {
    now(): number;
    mark(markName: string): void;
    measure(measureName: string, startMark?: string, endMark?: string): void;
    clearMarks(markName?: string): void;
    clearMeasures(measureName?: string): void;
    getEntriesByName(name: string, type?: string): PerformanceEntry[];
    getEntriesByType(type: string): PerformanceEntry[];
    getEntries(): PerformanceEntry[];
  }
  
  interface PerformanceEntry {
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
  }
  
  interface Storage {
    readonly length: number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    [name: string]: any;
  }
}

// Firebase Auth module declarations removed - using actual Firebase SDK types

export {};