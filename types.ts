
import React from 'react';

export enum ModuleId {
  HOME = 'home',
  FACE_SAFE = 'face-safe',
  IMG2PROMPT = 'img2prompt',
  OOTD_EXTRACT = 'ootd-extract',
  BG_SWAP = 'bg-swap',
  RESTORE = 'restore',
  INPAINT = 'inpaint',
  PROMPT_MAKER = 'prompt-maker',
  ID_PHOTO = 'id-photo',
  TRAVEL = 'travel',
  PRODUCT_FASHION = 'product-fashion',
  LOOKBOOK = 'lookbook',
  SETTINGS = 'settings'
}

export interface Module {
  id: ModuleId;
  name: string;
  description: string;
  icon: React.ReactNode;
}

declare global {
  // Augment the AIStudio interface to ensure it has the methods we need.
  // This avoids conflicting with existing Window.aistudio declarations.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
