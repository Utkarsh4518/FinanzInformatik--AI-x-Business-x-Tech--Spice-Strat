import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");

function getDataFilePath(fileName: string) {
  return path.join(dataDirectory, fileName);
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = getDataFilePath(fileName);

  try {
    const fileContents = await readFile(filePath, "utf8");
    return JSON.parse(fileContents) as T;
  } catch {
    await writeJsonFile(fileName, fallback);
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  const filePath = getDataFilePath(fileName);
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
