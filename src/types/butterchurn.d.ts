declare module 'butterchurn' {
  const butterchurn: {
    createVisualizer: (
      audioContext: AudioContext,
      canvas: HTMLCanvasElement,
      options?: {
        width?: number;
        height?: number;
        pixelRatio?: number;
        textureRatio?: number;
      }
    ) => {
      connectAudio: (audioNode: AudioNode) => void;
      disconnectAudio: (audioNode: AudioNode) => void;
      loadPreset: (preset: any, blendTime?: number) => void;
      loadExtraImages: (images: any) => void;
      setRendererSize: (width: number, height: number) => void;
      render: () => void;
      launchSongTitleAnim?: (text: string) => void;
    };
  };
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  const butterchurnPresets: {
    getPresets: () => Record<string, any>;
  };
  export default butterchurnPresets;
}
