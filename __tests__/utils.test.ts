import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs-extra";
import { resolve } from "node:path";
import { nanoid } from "nanoid";

import { viChdir } from "./util/helpers";
import { downloadFile, generateChecksum } from "../src/utils";

describe("Utils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    viChdir("util");
    rmSync(process.cwd(), { recursive: true, force: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    rmSync(resolve(process.cwd(), "__tests__/temp/util"), {
      recursive: true,
      force: true,
    });
  });

  describe("generateChecksum", () => {
    describe("Should return a valid checksum given a file path and algorithm", () => {
      beforeEach(() => {
        viChdir(resolve(process.cwd(), `${nanoid(6)}/`));
        mkdirSync(process.cwd(), { recursive: true });

        writeFileSync(
          resolve(process.cwd(), path),
          "lorem ipsum sit dolor amen",
          {
            encoding: "utf-8",
          },
        );
      });

      const path = "testFile.txt";
      const cases = [
        {
          algorithm: "md5",
          hash: "95b1f284c87cd5eec4ad1c88270c861e",
        },
        {
          algorithm: "sha256",
          hash: "842287a9f1422491aee1ea72f5c2531eba451d288030a1a58749830bff67382f",
        },
      ];

      test.each(cases)(
        `File ${path} with algorithm: $algorithm, should result in the hash: $hash`,
        async ({ algorithm, hash }) => {
          const result = await generateChecksum(path, algorithm);
          expect(result).toEqual(hash);
        },
      );
    });
  });

  describe("downloadFile", () => {
    const genericTestFiles = [
      {
        url: "https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm",
        hash: "6b2afedd9fa041fdff5d9e1d6d909c393268669005041c572abcc5923c939c58",
      },
      {
        url: "https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/720/Big_Buck_Bunny_720_10s_2MB.webm",
        hash: "e059378d52d93277ceaa1c8137122e4acda87b8e3a891a2804a7386162b37235",
      },
      {
        url: "https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/1080/Big_Buck_Bunny_1080_10s_5MB.webm",
        hash: "3011a3d7dc742d6c0f37194ba8273e6b09b90fe768d5f11386ff140bc6745d52",
      },
    ];

    beforeEach(() => {
      viChdir(resolve(process.cwd(), `${nanoid(6)}/`));
    });

    describe("Should be able to successively download and save a file", () => {
      test.each(genericTestFiles)(
        `Donwloading file: $url with checksum $hash`,
        async ({ url, hash }) => {
          mkdirSync(resolve(process.cwd()), { recursive: true });

          const path = resolve(process.cwd(), `${nanoid(8)}.webm`);
          await downloadFile(url, path);
          const result = await generateChecksum(path, "sha256");
          expect(result).toEqual(hash);
        },
      );
    });
  });
});
