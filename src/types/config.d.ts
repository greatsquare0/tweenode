interface StoryFormat {
  version: string,
  src: string
}

interface PlataformObj {
  [key in Architecture]?: string
}

interface ConfigTOML {
  tweego: {
    binaries: {
      acceptable_plataforms: Platform;
      acceptable_arch: Architecture;
      version: string;
    } & {
      [key in Platform]?: PlatformObj;
    };
  };
  storyFormats: {
    [key: string]: StoryFormat;
  };
}

export default ConfigTOML