import { env } from "../env.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;
type Meta = Record<string, unknown>;

const minimum: number = env.isProd ? LEVELS.info : LEVELS.debug;

function write(level: Level, message: string, meta?: Meta) {
  if (LEVELS[level] < minimum) return;

  if (env.isProd) {
    const line = JSON.stringify({
      level,
      time: new Date().toISOString(),
      message,
      ...meta,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const prefix = `[${level}] ${message}`;
  if (level === "error") console.error(prefix, meta ?? "");
  else if (level === "warn") console.warn(prefix, meta ?? "");
  else console.log(prefix, meta ?? "");
}

export const logger = {
  debug: (message: string, meta?: Meta) => write("debug", message, meta),
  info: (message: string, meta?: Meta) => write("info", message, meta),
  warn: (message: string, meta?: Meta) => write("warn", message, meta),
  error: (message: string, meta?: Meta) => write("error", message, meta),
};
