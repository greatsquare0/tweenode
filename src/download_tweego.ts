import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { downloadFile, extract } from "./utils";
import { getTweegoUrl } from "./get_tweego_url";
import { emptyDir } from "fs-extra";
import { deepmerge } from "deepmerge-ts";

export interface StoryFormat {
  name: string;
  version?: string;
  /**
   * Currently, not implemented
   */
  local?: boolean;
  /**
   * If compacted, must be a zip
   */
  src?: string;
  /**
   * Some may provide a folder inside the .zip (Like SugarCube), some won't, use this to create a folder for the format
   *
   * It will use the provided `name` property
   */
  createFolder?: boolean;
}
export interface TweenodeSetupOptions {
  tweegoBinaries?: {
    version: string;
    /**
     * Must be a .zip
     */
    customUrl?: string;
  };
  /**
   * Used to donwload other formats not included in Tweego
   * (WIP)
   */
  storyFormats?: {
    /**
     * When `false`, it will delete all formats shipped with Tweego
     * @deprecated use cleanTweegoBuiltins
     */
    useTweegoBuiltin?: boolean;
    /**
     * When `true`, it will delete all formats shipped with Tweego
     */
    cleanTweegoBuiltins: boolean;
    /**
     * Array of custom formats to be downloaded
     */
    formats?: StoryFormat[];
  };
}

export const setupDefaults = {
  tweegoBinaries: {
    version: "2.1.1",
  },
  storyFormats: {
    cleanTweegoBuiltins: false,
    formats: [
      {
        name: "sugarcube-2",
        version: "2.37.3",
        local: false,
        src: "https://www.motoslave.net/sugarcube/download.php/2/sugarcube-2.37.3-for-twine-2.1-local.zip",
      },
      {
        name: "chapbook-2",
        version: "2.2.0",
        src: "https://klembot.github.io/chapbook/use/2.2.0/format.js",
        createFolder: true,
      },
      {
        name: "harlowe-3",
        version: "3.3.9",
        src: "https://twine2.neocities.org/harlowe-3.3.9.js",
        createFolder: true,
      },
      {
        name: "harlowe-4-unstable",
        version: "4.0.0",
        src: "https://twine2.neocities.org/harlowe4-unstable.js",
        createFolder: true,
      },
    ],
  },
} as const;

export const getTweenodeFolderPath = () => {
  return resolve(process.cwd(), "./.tweenode/");
};

export const downloadTweego = async (options?: TweenodeSetupOptions) => {
  const config = deepmerge(setupDefaults, options) as TweenodeSetupOptions;

  if (!existsSync(getTweenodeFolderPath())) {
    await mkdir(getTweenodeFolderPath(), { recursive: true });
  }

  const url =
    config.tweegoBinaries!.customUrl !== ""
      ? getTweegoUrl(config)
      : config!.tweegoBinaries!.customUrl;
  await downloadFile(
    url!,
    resolve(getTweenodeFolderPath(), url!.split("/").pop()!),
  );
};

export const extractTweego = async (options?: TweenodeSetupOptions) => {
  const config = deepmerge(setupDefaults, options) as TweenodeSetupOptions;

  const archiveName = getTweegoUrl(config).split("/").pop();
  const archivePath = resolve(getTweenodeFolderPath(), archiveName!);

  await extract(archivePath, getTweenodeFolderPath());
  await rm(archivePath);
};

export const downloadCustomStoryFormats = async (
  options?: TweenodeSetupOptions,
) => {
  const config = deepmerge(setupDefaults, options) as TweenodeSetupOptions;

  if (config!.storyFormats?.cleanTweegoBuiltins) {
    await emptyDir(resolve(getTweenodeFolderPath(), "./storyformats/"));
  }

  if (config!.storyFormats!.formats) {
    for await (const format of config!.storyFormats!.formats) {
      await downloadFormat(format);
    }
  }
};

const downloadFormat = async (format: StoryFormat) => {
  const downloadedFileName = format.src!.split("/").pop();
  let finalName = "";
  let path = "";

  if (downloadedFileName!.split(".").pop() == "zip") {
    finalName = downloadedFileName!;
  } else {
    if (downloadedFileName! !== "format.js") {
      finalName = "format.js";
    } else {
      finalName = downloadedFileName;
    }
  }

  if (format.createFolder) {
    path = resolve(getTweenodeFolderPath(), `./storyformats/${format.name}`);

    if (!existsSync(path)) {
      await mkdir(path, { recursive: true });
    } else {
      await rm(path, { recursive: true });
      await mkdir(path, { recursive: true });
    }
  } else {
    path = resolve(getTweenodeFolderPath(), "./storyformats/");
    const formatFolder = resolve(path, format.name);
    if (!existsSync(path)) {
      await mkdir(path, { recursive: true });
    }

    if (existsSync(formatFolder)) {
      await rm(formatFolder, { recursive: true });
    }
  }

  await downloadFile(format.src!, resolve(path, finalName!));
  if (finalName?.split(".").pop() == "zip") {
    await extract(resolve(path, finalName!), path);
    await rm(resolve(path, finalName!));
  }
};

export const setupTweego = async (options?: TweenodeSetupOptions) => {
  const config = deepmerge(setupDefaults, options) as TweenodeSetupOptions;

  if (!existsSync(getTweenodeFolderPath())) {
    await downloadTweego(options);
    await extractTweego(options);

    if (
      config!.storyFormats!.formats!.length > 0 ||
      options!.storyFormats!.formats!.length > 0
    ) {
      await downloadCustomStoryFormats(options);
    }
  }
};
