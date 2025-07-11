import {
  describe,
  it,
  vi,
  afterEach,
  beforeEach,
  expect,
  afterAll,
  beforeAll,
} from "vitest";
import { setupTweego } from "../src/download_tweego";
import { nanoid } from "nanoid";
import { viChdir } from "./util/helpers";
import { verifyBinarie } from "../src/verify_tweego";
import { outputFile, readFileSync, removeSync } from "fs-extra";
import { resolve } from "node:path";
import { tweenode } from "../src/run_tweego";
import { JSDOM } from "jsdom";

describe("Run Tweego", () => {
  beforeAll(() => {
    removeSync(resolve(process.cwd(), "__tests__/temp/run/"));
  });

  beforeEach(() => {
    viChdir("run");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    removeSync(resolve(process.cwd(), "__tests__/temp/util"));
  });

  describe("Verify Tweego Installation", () => {
    beforeEach(async () => {
      viChdir(resolve(process.cwd(), `${nanoid(6)}/`));
      await setupTweego();
    });

    afterEach(() => {
      removeSync(process.cwd());
    });

    it("should correctly setup and run", { repeats: 3 }, async () => {
      expect(await verifyBinarie()).toEqual(true);
    });
  });

  describe("Story compilation", () => {
    let path = "";
    beforeEach(async () => {
      viChdir(resolve(process.cwd(), `${nanoid(6)}/`));
      path = process.cwd();
      await setupTweego();

      const files = [
        {
          name: "StoryData.twee",
          content:
            ':: StoryData\n{\n"ifid": "D674C58C-DEFA-4F70-B7A2-27742230C0FC",\n"format": "SugarCube",\n"format-version": "2.37.3"\n}',
        },
        {
          name: "Start.twee",
          content: ":: StoryTitle\nHello There!\n:: Start\nHello World!",
        },
      ];

      for await (const file of files) {
        await outputFile(
          resolve(process.cwd(), `Story/${file.name}`),
          file.content,
          {
            encoding: "utf-8",
          },
        );
      }
    });

    afterAll(() => {
      removeSync(path);
    });

    it("should compile the story and return the code as a string", async () => {
      const tweego = await tweenode({
        build: {
          input: {
            storyDir: resolve(process.cwd(), "Story/"),
          },
          output: {
            mode: "string",
          },
        },
      });
      const result = await tweego.process();

      expect(isValidHtml(result!)).toBe(true);
    });

    it("should compile the story and write the code to a file", async () => {
      const tweego = await tweenode({
        build: {
          input: {
            storyDir: resolve(process.cwd(), "Story/"),
          },
          output: {
            mode: "file",
            fileName: "dist/index.html",
          },
        },
      });
      await tweego.process();
      const result = readFileSync("dist/index.html", "utf-8");
      expect(isValidHtml(result)).toBe(true);
    });
  });
});

const isValidHtml = (html: string) => {
  if (!html.includes("</body>")) {
    return false;
  }

  let dom: JSDOM;

  try {
    dom = new JSDOM(html);
  } catch (error) {
    throw new Error(`Failed to parse HTML: ${error}`);
  }

  if (!dom.window.document.querySelector("tw-storydata")) {
    return false;
  } else {
    return true;
  }
};
