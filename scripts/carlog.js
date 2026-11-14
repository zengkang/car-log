#!/usr/bin/env bun
// @bun

// src/cli/output.ts
var JSON_SCHEMA_VERSION = 2;
function setExitCode(ctx, code) {
  ctx.exitCode = code;
}
function ensureTrailingNewline(text) {
  return text.endsWith(`
`) ? text : `${text}
`;
}
function writeLine(ctx, text) {
  ctx.stdout(ensureTrailingNewline(text));
}
function successEnvelope(data) {
  return { ok: true, schema_version: JSON_SCHEMA_VERSION, data };
}
function errorEnvelope(error) {
  return {
    ok: false,
    schema_version: JSON_SCHEMA_VERSION,
    error: {
      code: error.code,
      message: error.message,
      hint: error.hint,
      details: error.details
    }
  };
}
function emitSuccess(ctx, json, data, renderHuman) {
  if (json) {
    ctx.stdout(`${JSON.stringify(successEnvelope(data))}
`);
    return;
  }
  if (renderHuman) {
    renderHuman(ctx, data);
    return;
  }
  ctx.stdout(`${JSON.stringify(data, null, 2)}
`);
}
function emitError(ctx, json, error) {
  if (json) {
    ctx.stdout(`${JSON.stringify(errorEnvelope(error))}
`);
  }
  ctx.stderr(`\u9519\u8BEF: ${error.message}
`);
  if (error.hint)
    ctx.stderr(`\u63D0\u793A: ${error.hint}
`);
}

// src/errors.ts
class DomainError extends Error {
  code;
  hint;
  details;
  constructor(code, message, options) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.hint = options?.hint;
    this.details = options?.details ?? {};
  }
}

// src/cli/errors.ts
var EXIT_CODES = {
  OK: 0,
  INTERNAL_ERROR: 1,
  ARGUMENT: 2,
  NOT_FOUND: 3,
  VALIDATION: 4,
  CONFLICT: 5,
  INTEGRITY: 6
};
var ERROR_DEFINITIONS = {
  INTERNAL_ERROR: {
    exitCode: EXIT_CODES.INTERNAL_ERROR,
    hint: "\u8BF7\u68C0\u67E5\u8F93\u5165\u540E\u91CD\u8BD5\uFF1B\u5982\u679C\u95EE\u9898\u6301\u7EED\uFF0C\u4F7F\u7528 --json \u67E5\u770B\u8BE6\u60C5"
  },
  UNKNOWN_COMMAND: {
    exitCode: EXIT_CODES.ARGUMENT,
    hint: "\u8FD0\u884C carlog help \u67E5\u770B\u53EF\u7528\u547D\u4EE4"
  },
  INVALID_ARGUMENT: {
    exitCode: EXIT_CODES.ARGUMENT,
    hint: "\u68C0\u67E5\u53C2\u6570\u540D\u79F0\u3001\u683C\u5F0F\u548C\u5FC5\u586B\u9879"
  },
  FULLNESS_REQUIRED: {
    exitCode: EXIT_CODES.ARGUMENT,
    hint: "\u8BF7\u663E\u5F0F\u4F20 --full \u6216 --partial\uFF1B\u672A\u52A0\u6EE1\u4E14\u77E5\u9053\u6CB9\u8868\u6BD4\u4F8B\u65F6\u53EF\u4F20 --fuel-level"
  },
  VEHICLE_NOT_FOUND: {
    exitCode: EXIT_CODES.NOT_FOUND,
    hint: "\u7528 car list \u67E5\u770B\u8F66\u8F86\uFF0C\u6216\u5148 car add \u5EFA\u6863"
  },
  RECORD_NOT_FOUND: {
    exitCode: EXIT_CODES.NOT_FOUND,
    hint: "\u7528\u5BF9\u5E94 list \u547D\u4EE4\u786E\u8BA4\u8BB0\u5F55 ID"
  },
  MILEAGE_ORDER: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u8BF7\u68C0\u67E5\u65E5\u671F\u6216\u91CC\u7A0B\uFF1B\u8865\u5F55\u65F6\u786E\u4FDD\u4E0E\u524D\u540E\u8BB0\u5F55\u4E00\u81F4"
  },
  MAINTENANCE_ITEM_UNKNOWN: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u7528 maintenance item list \u67E5\u770B\u76EE\u5F55\uFF0C\u6216\u5148 maintenance item add"
  },
  NO_CURRENT_MILEAGE: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u5148\u8BB0\u5F55\u5F53\u524D\u91CC\u7A0B\uFF1Amileage add --mileage KM"
  },
  RECORD_TYPE_MISMATCH: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u8BE5 ID \u5C5E\u4E8E\u53E6\u4E00\u79CD\u8BB0\u5F55\u7C7B\u578B\uFF1B\u8BF7\u7528\u5BF9\u5E94\u547D\u4EE4\u64CD\u4F5C"
  },
  INVALID_CATEGORY: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u7528 expense categories \u67E5\u770B\u652F\u6301\u7684\u5206\u7C7B"
  },
  IMPORT_SCHEMA_MISMATCH: {
    exitCode: EXIT_CODES.VALIDATION,
    hint: "\u5BFC\u51FA\u6587\u4EF6\u4E0E\u5F53\u524D CLI \u7684 schema \u7248\u672C\u4E0D\u4E00\u81F4"
  },
  VEHICLE_AMBIGUOUS: {
    exitCode: EXIT_CODES.CONFLICT,
    hint: "\u7528 --car \u6307\u5B9A\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C"
  },
  VEHICLE_NAME_EXISTS: {
    exitCode: EXIT_CODES.CONFLICT,
    hint: "\u6362\u4E00\u4E2A\u540D\u79F0\uFF0C\u6216\u5148 car list \u67E5\u770B\u73B0\u6709\u8F66\u8F86"
  },
  DUPLICATE_RECORD: {
    exitCode: EXIT_CODES.CONFLICT,
    hint: "\u786E\u8BA4\u4E0D\u662F\u91CD\u590D\u63D0\u4EA4\u540E\u52A0 --force"
  },
  IMPORT_CONFLICT: {
    exitCode: EXIT_CODES.CONFLICT,
    hint: "\u68C0\u67E5\u51B2\u7A81\u5BF9\u8C61\uFF0C\u6216\u4F7F\u7528 --replace"
  },
  DOCTOR_ISSUES: {
    exitCode: EXIT_CODES.INTEGRITY,
    hint: "\u6309\u95EE\u9898\u5217\u8868\u4E2D\u7684\u5EFA\u8BAE\u547D\u4EE4\u4FEE\u590D"
  },
  MIGRATION_FAILED: {
    exitCode: EXIT_CODES.INTEGRITY,
    hint: "\u6570\u636E\u5E93\u672A\u8FC1\u79FB\uFF0C\u539F\u5E93\u548C\u8FC1\u79FB\u524D\u5907\u4EFD\u4ECD\u53EF\u7528"
  }
};

class AppError extends Error {
  code;
  hint;
  details;
  exitCode;
  constructor(code, message, options) {
    super(message);
    this.name = "AppError";
    this.code = code;
    const definition = ERROR_DEFINITIONS[code];
    this.exitCode = options?.exitCode ?? definition?.exitCode ?? EXIT_CODES.INTERNAL_ERROR;
    this.hint = options?.hint ?? definition?.hint ?? "\u8BF7\u68C0\u67E5\u8F93\u5165\u540E\u91CD\u8BD5\uFF1B\u5982\u679C\u95EE\u9898\u6301\u7EED\uFF0C\u4F7F\u7528 --json \u67E5\u770B\u8BE6\u60C5";
    this.details = options?.details ?? {};
  }
}
function toAppError(error) {
  if (error instanceof AppError)
    return error;
  if (error instanceof DomainError) {
    const definition = ERROR_DEFINITIONS[error.code];
    if (definition) {
      return new AppError(error.code, error.message, {
        hint: error.hint,
        details: error.details,
        exitCode: definition.exitCode
      });
    }
    return new AppError("INTERNAL_ERROR", error.message, {
      hint: error.hint,
      details: { ...error.details, domain_code: error.code }
    });
  }
  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message, {
      details: { name: error.name }
    });
  }
  return new AppError("INTERNAL_ERROR", String(error));
}

// src/cli/parser.ts
function buildFlagArity(specs) {
  const arity = new Map;
  const register = (name, isBoolean) => {
    const existing = arity.get(name);
    if (existing !== undefined && existing !== isBoolean) {
      throw new Error(`Flag --${name} is declared both as boolean and value flag; keep one arity per flag name.`);
    }
    arity.set(name, isBoolean);
  };
  register("db", false);
  register("json", true);
  register("version", true);
  for (const spec of specs) {
    for (const flag of spec.flags ?? [])
      register(flag.name, flag.boolean === true);
  }
  return arity;
}
function tokenize(argv, arity, repeatable) {
  const flags = new Map;
  const positionals = [];
  let positionalOnly = false;
  const store = (name, value) => {
    if (typeof value === "string" && repeatable.has(name)) {
      const previous = flags.get(name);
      flags.set(name, Array.isArray(previous) ? [...previous, value] : [value]);
      return;
    }
    flags.set(name, value);
  };
  for (let i = 0;i < argv.length; i++) {
    const token = argv[i];
    if (positionalOnly) {
      positionals.push(token);
      continue;
    }
    if (token === "--") {
      positionalOnly = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const equalsAt = body.indexOf("=");
    const name = equalsAt === -1 ? body : body.slice(0, equalsAt);
    const inlineValue = equalsAt === -1 ? undefined : body.slice(equalsAt + 1);
    if (name === "") {
      throw new AppError("INVALID_ARGUMENT", `\u65E0\u6CD5\u8BC6\u522B\u7684\u53C2\u6570\uFF1A\u300C${token}\u300D`, {
        details: { argument: token }
      });
    }
    const isBoolean = arity.get(name) === true;
    if (isBoolean) {
      if (inlineValue !== undefined) {
        throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${name} \u662F\u5E03\u5C14\u5F00\u5173\uFF0C\u4E0D\u63A5\u53D7\u503C\u300C${inlineValue}\u300D`, { details: { flag: name, value: inlineValue } });
      }
      store(name, true);
      continue;
    }
    let value;
    if (inlineValue !== undefined) {
      value = inlineValue;
    } else {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${name} \u7F3A\u5C11\u503C`, {
          details: { flag: name }
        });
      }
      value = next;
      i++;
    }
    store(name, value);
  }
  return { flags, positionals };
}
function isPathPrefix(path, positionals) {
  if (path.length > positionals.length)
    return false;
  return path.every((segment, index) => positionals[index] === segment);
}
function resolveCommand(specs, positionals) {
  let best;
  for (const spec of specs) {
    if (!isPathPrefix(spec.path, positionals))
      continue;
    if (best === undefined || spec.path.length > best.path.length)
      best = spec;
  }
  return best;
}
function findCommand(specs, path) {
  return specs.find((spec) => spec.path.length === path.length && spec.path.every((segment, index) => segment === path[index]));
}
function failUnknownFlag(name) {
  throw new AppError("INVALID_ARGUMENT", `\u672A\u77E5\u53C2\u6570 --${name}`, {
    hint: "\u8FD0\u884C carlog help <command> \u67E5\u770B\u8BE5\u547D\u4EE4\u652F\u6301\u7684\u53C2\u6570",
    details: { flag: name }
  });
}
function validateFlags(spec, parsed) {
  const declared = new Map((spec.flags ?? []).map((flag) => [flag.name, flag]));
  for (const [name, value] of parsed.flags) {
    if (name === "json" || name === "db" || name === "version")
      continue;
    const flag = declared.get(name);
    if (!flag)
      failUnknownFlag(name);
    if (!flag.boolean && typeof value !== "string" && !Array.isArray(value)) {
      throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${name} \u7F3A\u5C11\u503C`, {
        details: { flag: name }
      });
    }
  }
  for (const flag of spec.flags ?? []) {
    if (flag.required && !parsed.flags.has(flag.name)) {
      throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 --${flag.name}`, {
        details: { flag: flag.name }
      });
    }
  }
}
function validatePositionals(spec, positionals) {
  const specs = spec.positionals ?? [];
  if (specs.length === 0) {
    if (positionals.length > 0) {
      throw new AppError("INVALID_ARGUMENT", `\u547D\u4EE4 ${spec.path.join(" ")} \u4E0D\u63A5\u53D7\u4F4D\u7F6E\u53C2\u6570\uFF1A${positionals.join(" ")}`, { details: { positionals } });
    }
    return;
  }
  let index = 0;
  for (const positional of specs) {
    if (positional.variadic) {
      if (positional.required && index >= positionals.length) {
        throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u4F4D\u7F6E\u53C2\u6570 <${positional.name}>`, { details: { positional: positional.name } });
      }
      index = positionals.length;
      break;
    }
    if (index >= positionals.length) {
      if (positional.required) {
        throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u4F4D\u7F6E\u53C2\u6570 <${positional.name}>`, { details: { positional: positional.name } });
      }
      break;
    }
    index++;
  }
  if (index < positionals.length) {
    throw new AppError("INVALID_ARGUMENT", `\u547D\u4EE4 ${spec.path.join(" ")} \u6536\u5230\u591A\u4F59\u53C2\u6570\uFF1A${positionals.slice(index).join(" ")}`, { details: { positionals: positionals.slice(index) } });
  }
}
function parseArgv(argv, specs, arity) {
  const repeatable = new Set;
  for (const spec of specs) {
    for (const flag of spec.flags ?? []) {
      if (flag.repeatable)
        repeatable.add(flag.name);
    }
  }
  const parsed = tokenize(argv, arity, repeatable);
  const command = resolveCommand(specs, parsed.positionals);
  if (!command) {
    if (parsed.positionals.length === 0)
      return;
    throw new AppError("UNKNOWN_COMMAND", `\u672A\u77E5\u547D\u4EE4\uFF1A${parsed.positionals.join(" ")}`, { details: { command: parsed.positionals.join(" ") } });
  }
  validateFlags(command, parsed);
  const rest = parsed.positionals.slice(command.path.length);
  validatePositionals(command, rest);
  const flags = {};
  for (const [name, value] of parsed.flags) {
    if (name === "json" || name === "db" || name === "version")
      continue;
    flags[name] = value;
  }
  const db = parsed.flags.get("db");
  if (db !== undefined && typeof db !== "string") {
    throw new AppError("INVALID_ARGUMENT", "\u53C2\u6570 --db \u7F3A\u5C11\u503C", {
      details: { flag: "db" }
    });
  }
  return {
    command,
    flags,
    positionals: rest,
    globals: {
      json: parsed.flags.get("json") === true,
      db: typeof db === "string" ? db : undefined
    }
  };
}
function getStringFlag(inv, name) {
  const value = inv.flags[name];
  return typeof value === "string" ? value : undefined;
}
function getBooleanFlag(inv, name) {
  return inv.flags[name] === true;
}
function getRepeatedFlag(inv, name) {
  const value = inv.flags[name];
  if (Array.isArray(value))
    return value;
  if (typeof value === "string")
    return [value];
  return [];
}
function argvHasFlag(argv, name) {
  const target = `--${name}`;
  for (const token of argv) {
    if (token === "--")
      return false;
    if (token === target || token.startsWith(`${target}=`))
      return true;
  }
  return false;
}

// src/utils.ts
function parseDatetime(input, now = () => new Date) {
  if (!input || input.trim() === "") {
    return formatNow(now);
  }
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace("T", " ").substring(0, 19);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed + " 00:00:00";
  }
  throw new Error(`Invalid datetime format: "${input}". Expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.`);
}
function formatNow(now = () => new Date) {
  return formatDate(now());
}
function formatDate(d) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function formatCurrency(amount) {
  return `\xA5${amount.toFixed(2)}`;
}
function formatDuration(days) {
  if (days < 1)
    return "\u4E0D\u52301\u5929";
  if (days < 30)
    return `${Math.floor(days)}\u5929`;
  if (days < 365) {
    const months2 = Math.floor(days / 30);
    const remainDays = Math.floor(days % 30);
    return remainDays > 0 ? `${months2}\u4E2A\u6708${remainDays}\u5929` : `${months2}\u4E2A\u6708`;
  }
  const years = Math.floor(days / 365);
  const months = Math.floor(days % 365 / 30);
  return months > 0 ? `${years}\u5E74${months}\u4E2A\u6708` : `${years}\u5E74`;
}
function formatMileage(km) {
  if (km === null)
    return "-";
  return `${km.toLocaleString("zh-CN")} km`;
}
function displayWidth(s) {
  let w = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code >= 19968 && code <= 40959 || code >= 12288 && code <= 12351 || code >= 65280 && code <= 65519) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}
function padToWidth(s, w, alignRight = false) {
  const cur = displayWidth(s);
  if (cur > w) {
    let result = "";
    let resultWidth = 0;
    for (const ch of s) {
      const chWidth = displayWidth(ch);
      if (resultWidth + chWidth > w - 1)
        break;
      result += ch;
      resultWidth += chWidth;
    }
    return result + "\u2026";
  }
  const padding = w - cur;
  const space = " ".repeat(padding);
  return alignRight ? space + s : s + space;
}
function table(headers, rows, options) {
  const maxWidth = options?.maxWidth ?? 50;
  const widths = headers.map((h, i) => {
    const maxData = rows.reduce((max, row) => {
      const cell = String(row[i] ?? "-");
      return Math.max(max, displayWidth(cell));
    }, 0);
    return Math.min(Math.max(displayWidth(h), maxData), maxWidth);
  });
  const divider = widths.map((w) => "-".repeat(w + 2)).join("+");
  const lines = [];
  lines.push(divider);
  lines.push("| " + headers.map((h, i) => padToWidth(h, widths[i])).join(" | ") + " |");
  lines.push(divider);
  for (const row of rows) {
    const cells = row.map((cell, i) => {
      const str = cell === null ? "-" : String(cell);
      const alignRight = typeof cell === "number";
      return padToWidth(str, widths[i], alignRight);
    });
    lines.push("| " + cells.join(" | ") + " |");
  }
  lines.push(divider);
  return lines.join(`
`);
}

// src/cli/parse-values.ts
var NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;
var INTEGER_PATTERN = /^-?\d+$/;
function invalid(flag, raw, reason) {
  throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${flag} \u65E0\u6548\uFF1A\u300C${raw}\u300D${reason}`, {
    details: { flag, value: raw }
  });
}
function parseNumberFlag(flag, raw, options = {}) {
  if (raw === undefined)
    return;
  const trimmed = raw.trim();
  if (trimmed === "")
    invalid(flag, raw, "\uFF0C\u4E0D\u80FD\u4E3A\u7A7A");
  if (options.integer) {
    if (!INTEGER_PATTERN.test(trimmed))
      invalid(flag, raw, "\uFF0C\u5FC5\u987B\u662F\u6574\u6570");
  } else if (!NUMBER_PATTERN.test(trimmed)) {
    invalid(flag, raw, "\uFF0C\u5FC5\u987B\u662F\u6570\u5B57");
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value))
    invalid(flag, raw, "\uFF0C\u5FC5\u987B\u662F\u6709\u9650\u6570\u5B57");
  if (options.positive && value <= 0)
    invalid(flag, raw, "\uFF0C\u5FC5\u987B\u5927\u4E8E 0");
  if (options.min !== undefined && value < options.min) {
    invalid(flag, raw, `\uFF0C\u4E0D\u80FD\u5C0F\u4E8E ${options.min}`);
  }
  if (options.max !== undefined && value > options.max) {
    invalid(flag, raw, `\uFF0C\u4E0D\u80FD\u5927\u4E8E ${options.max}`);
  }
  return value;
}
function requireNumberFlag(flag, raw, options = {}) {
  if (raw === undefined) {
    throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 --${flag}`, {
      details: { flag }
    });
  }
  return parseNumberFlag(flag, raw, options);
}
function requireStringFlag(flag, raw) {
  if (raw === undefined || raw.trim() === "") {
    throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 --${flag}`, {
      details: { flag }
    });
  }
  return raw;
}
function parseDatetimeFlag(flag, raw, now) {
  try {
    return parseDatetime(raw, now);
  } catch {
    throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${flag} \u65E0\u6548\uFF1A\u300C${raw ?? ""}\u300D\uFF0C\u8BF7\u4F7F\u7528 YYYY-MM-DD \u6216 YYYY-MM-DD HH:MM[:SS]`, { details: { flag, value: raw } });
  }
}
function parseFuelLevelFlag(raw) {
  if (raw === undefined)
    return;
  const value = raw.trim();
  if (value === "") {
    throw new AppError("INVALID_ARGUMENT", "\u53C2\u6570 --fuel-level \u4E0D\u80FD\u4E3A\u7A7A", {
      details: { flag: "fuel-level", value: raw }
    });
  }
  let ratio;
  if (/^\d+$/.test(value)) {
    ratio = Number(value) / 100;
  } else if (/^\d+(?:\.\d+)?%$/.test(value)) {
    ratio = Number(value.slice(0, -1)) / 100;
  } else if (/^0?\.\d+$/.test(value)) {
    ratio = Number(value);
  } else if (/^\d+\/\d+$/.test(value)) {
    const [open, total] = value.split("/");
    const numerator = Number(open);
    const denominator = Number(total);
    if (denominator === 0) {
      throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --fuel-level \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u5206\u6BCD\u4E0D\u80FD\u4E3A 0`, {
        details: { flag: "fuel-level", value: raw }
      });
    }
    ratio = numerator / denominator;
  }
  if (ratio === undefined || !Number.isFinite(ratio)) {
    throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --fuel-level \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u652F\u6301 80\u300180%\u30010.8 \u6216 1/2`, { details: { flag: "fuel-level", value: raw } });
  }
  if (ratio < 0 || ratio > 1) {
    throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --fuel-level \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u6BD4\u4F8B\u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4`, { details: { flag: "fuel-level", value: raw } });
  }
  return ratio;
}
function parsePositionalInteger(name, raw) {
  if (raw === undefined || raw.trim() === "") {
    throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u4F4D\u7F6E\u53C2\u6570 <${name}>`, {
      details: { positional: name }
    });
  }
  if (!INTEGER_PATTERN.test(raw.trim())) {
    throw new AppError("INVALID_ARGUMENT", `\u4F4D\u7F6E\u53C2\u6570 <${name}> \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u5FC5\u987B\u662F\u6574\u6570`, { details: { positional: name, value: raw } });
  }
  return Number(raw.trim());
}
function parseEnumFlag(flag, raw, allowed) {
  if (raw === undefined)
    return;
  if (!allowed.includes(raw)) {
    throw new AppError("INVALID_ARGUMENT", `\u53C2\u6570 --${flag} \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u53EF\u9009\u503C\uFF1A${allowed.join(", ")}`, { details: { flag, value: raw, allowed } });
  }
  return raw;
}

// src/db.ts
import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { homedir } from "os";

// src/db/migrations.ts
function vehiclesTableDdl(tableName) {
  return `
CREATE TABLE ${tableName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  plate TEXT,
  tank_capacity_l REAL,
  initial_mileage REAL,
  initial_datetime TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  deleted INTEGER NOT NULL DEFAULT 0,
  CHECK (tank_capacity_l IS NULL OR tank_capacity_l > 0)
);`;
}
function recordsTableDdl(tableName) {
  return `
CREATE TABLE ${tableName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('mileage', 'refuel', 'maintenance')),
  datetime TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  mileage REAL,
  liters REAL,
  cost REAL,
  is_full INTEGER NOT NULL DEFAULT 1 CHECK (is_full IN (0, 1)),
  fuel_level_after REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  deleted INTEGER NOT NULL DEFAULT 0,
  -- Type-specific required fields are enforced by the command layer so legacy
  -- null/zero rows remain migratable; doctor flags them.
  CHECK (record_type = 'refuel' OR is_full = 1),
  CHECK (fuel_level_after IS NULL OR (fuel_level_after >= 0 AND fuel_level_after <= 1)),
  CHECK (fuel_level_after IS NULL OR (record_type = 'refuel' AND is_full = 0))
);`;
}
var SUPPORT_TABLE_DDL = [
  `
CREATE TABLE maintenance_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  aliases TEXT,
  category TEXT NOT NULL CHECK (category IN ('engine', 'filter', 'brake', 'tire', 'fluid', 'electrical', 'inspection', 'other')),
  default_interval_km REAL,
  default_interval_months INTEGER,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  CHECK (default_interval_km IS NULL OR default_interval_km > 0),
  CHECK (default_interval_months IS NULL OR default_interval_months > 0)
);`,
  `
CREATE TABLE maintenance_record_items (
  record_id INTEGER NOT NULL REFERENCES records(id),
  item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  cost REAL,
  note TEXT,
  PRIMARY KEY (record_id, item_id)
);`,
  `
CREATE TABLE vehicle_maintenance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  interval_km REAL,
  interval_months INTEGER,
  baseline_mileage REAL,
  baseline_datetime TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(vehicle_id, item_id),
  CHECK (interval_km IS NULL OR interval_km > 0),
  CHECK (interval_months IS NULL OR interval_months > 0)
);`,
  `
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  category TEXT NOT NULL CHECK (category IN ('insurance', 'parking', 'toll', 'wash', 'repair', 'tax', 'fine', 'other')),
  amount REAL NOT NULL CHECK (amount > 0),
  datetime TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  deleted INTEGER NOT NULL DEFAULT 0
);`,
  `
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`
];
var INDEX_DDL = [
  "CREATE UNIQUE INDEX idx_vehicles_active_name ON vehicles(name) WHERE deleted = 0;",
  "CREATE INDEX idx_records_vehicle_datetime ON records(vehicle_id, datetime, id);",
  "CREATE INDEX idx_records_vehicle_type_datetime ON records(vehicle_id, record_type, datetime, id);",
  "CREATE INDEX idx_mri_item ON maintenance_record_items(item_id);",
  "CREATE INDEX idx_expenses_vehicle_datetime ON expenses(vehicle_id, datetime, id);",
  "CREATE INDEX idx_expenses_vehicle_category ON expenses(vehicle_id, category);"
];
var MAINTENANCE_ITEM_SEEDS = [
  {
    code: "engine_oil",
    name: "\u673A\u6CB9",
    aliases: "\u673A\u6CB9,\u53D1\u52A8\u673A\u6CB9,\u6DA6\u6ED1\u6CB9",
    category: "engine",
    default_interval_km: 5000,
    default_interval_months: 6
  },
  {
    code: "oil_filter",
    name: "\u673A\u6CB9\u6EE4\u82AF",
    aliases: "\u673A\u6EE4,\u673A\u6CB9\u6EE4,\u673A\u6CB9\u6EE4\u6E05\u5668",
    category: "filter",
    default_interval_km: 5000,
    default_interval_months: 6
  },
  {
    code: "air_filter",
    name: "\u7A7A\u6C14\u6EE4\u82AF",
    aliases: "\u7A7A\u6EE4,\u7A7A\u6C14\u6EE4,\u7A7A\u6C14\u6EE4\u6E05\u5668",
    category: "filter",
    default_interval_km: 1e4,
    default_interval_months: 12
  },
  {
    code: "cabin_filter",
    name: "\u7A7A\u8C03\u6EE4\u82AF",
    aliases: "\u7A7A\u8C03\u6EE4,\u7A7A\u8C03\u6EE4\u6E05\u5668",
    category: "filter",
    default_interval_km: 1e4,
    default_interval_months: 12
  },
  {
    code: "brake_pad",
    name: "\u5239\u8F66\u7247",
    aliases: "\u5239\u8F66\u7247,\u5236\u52A8\u7247,\u5239\u8F66\u76AE",
    category: "brake",
    default_interval_km: 30000,
    default_interval_months: 24
  },
  {
    code: "brake_fluid",
    name: "\u5239\u8F66\u6CB9",
    aliases: "\u5239\u8F66\u6CB9,\u5236\u52A8\u6DB2",
    category: "fluid",
    default_interval_km: 40000,
    default_interval_months: 24
  },
  {
    code: "coolant",
    name: "\u9632\u51BB\u6DB2",
    aliases: "\u9632\u51BB\u6DB2,\u51B7\u5374\u6DB2",
    category: "fluid",
    default_interval_km: 40000,
    default_interval_months: 24
  },
  {
    code: "transmission_oil",
    name: "\u53D8\u901F\u7BB1\u6CB9",
    aliases: "\u53D8\u901F\u7BB1\u6CB9,\u6CE2\u7BB1\u6CB9",
    category: "fluid",
    default_interval_km: 60000,
    default_interval_months: 36
  },
  {
    code: "spark_plug",
    name: "\u706B\u82B1\u585E",
    aliases: "\u706B\u82B1\u585E",
    category: "engine",
    default_interval_km: 40000,
    default_interval_months: 36
  },
  {
    code: "tire",
    name: "\u8F6E\u80CE",
    aliases: "\u8F6E\u80CE,\u80CE",
    category: "tire",
    default_interval_km: 50000,
    default_interval_months: 60
  },
  {
    code: "battery",
    name: "\u7535\u74F6",
    aliases: "\u7535\u74F6,\u84C4\u7535\u6C60",
    category: "electrical",
    default_interval_km: null,
    default_interval_months: 36
  },
  {
    code: "inspection",
    name: "\u5E74\u68C0",
    aliases: "\u5E74\u68C0,\u9A8C\u8F66",
    category: "inspection",
    default_interval_km: null,
    default_interval_months: 12
  },
  {
    code: "other",
    name: "\u5176\u4ED6",
    aliases: "\u5176\u4ED6",
    category: "other",
    default_interval_km: null,
    default_interval_months: null
  }
];
var SETTINGS_DEFAULTS = [
  { key: "due_soon_km", value: "500" },
  { key: "due_soon_days", value: "30" }
];
function readUserVersion(db) {
  return db.query("PRAGMA user_version").get()?.user_version ?? 0;
}
function writeUserVersion(db, version) {
  db.exec(`PRAGMA user_version = ${version}`);
}
function tableExists(db, table2) {
  return db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table2) !== null;
}
function tableColumns(db, table2) {
  return new Set(db.query(`PRAGMA table_info("${table2}")`).all().map((row) => row.name));
}
function hasLegacyCoreTables(db) {
  return tableExists(db, "vehicles") || tableExists(db, "records");
}
function createSupportTables(db) {
  for (const ddl of SUPPORT_TABLE_DDL)
    db.exec(ddl);
}
function createIndexes(db) {
  for (const ddl of INDEX_DDL)
    db.exec(ddl);
}
function seedMaintenanceCatalog(db) {
  const insertItem = db.query(`INSERT OR IGNORE INTO maintenance_items
       (code, name, aliases, category, default_interval_km, default_interval_months)
     VALUES (?, ?, ?, ?, ?, ?)`);
  for (const item of MAINTENANCE_ITEM_SEEDS) {
    insertItem.run(item.code, item.name, item.aliases, item.category, item.default_interval_km, item.default_interval_months);
  }
  const insertSetting = db.query("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const setting of SETTINGS_DEFAULTS) {
    insertSetting.run(setting.key, setting.value);
  }
}
function createSchemaV2(db) {
  db.exec(vehiclesTableDdl("vehicles"));
  db.exec(recordsTableDdl("records"));
  createSupportTables(db);
  createIndexes(db);
  seedMaintenanceCatalog(db);
}
function migrateLegacySchemaToV2(db) {
  rebuildVehicles(db);
  rebuildRecords(db);
  createSupportTables(db);
  createIndexes(db);
  seedMaintenanceCatalog(db);
}
function rebuildVehicles(db) {
  const existed = tableExists(db, "vehicles");
  const columns = tableColumns(db, "vehicles");
  db.exec(vehiclesTableDdl("vehicles_new"));
  if (existed) {
    const name = columns.has("name") ? "name" : "''";
    const plate = columns.has("plate") ? "plate" : "NULL";
    const createdAt = columns.has("created_at") ? "created_at" : "datetime('now', 'localtime')";
    const deleted = columns.has("deleted") ? "deleted" : "0";
    const tankCapacity = columns.has("tank_capacity_l") ? "tank_capacity_l" : "NULL";
    const initialMileage = columns.has("initial_mileage") ? "initial_mileage" : "NULL";
    const initialDatetime = columns.has("initial_datetime") ? "initial_datetime" : "NULL";
    const updatedAt = columns.has("updated_at") ? "updated_at" : createdAt;
    db.exec(`
INSERT INTO vehicles_new
  (id, name, plate, tank_capacity_l, initial_mileage, initial_datetime,
   created_at, updated_at, deleted)
SELECT id, ${name}, ${plate}, ${tankCapacity}, ${initialMileage}, ${initialDatetime},
       ${createdAt}, ${updatedAt}, ${deleted}
FROM vehicles`);
  }
  db.exec("DROP TABLE IF EXISTS vehicles");
  db.exec("ALTER TABLE vehicles_new RENAME TO vehicles");
}
function rebuildRecords(db) {
  const existed = tableExists(db, "records");
  const columns = tableColumns(db, "records");
  db.exec(recordsTableDdl("records_new"));
  if (existed) {
    const datetime = columns.has("datetime") ? "datetime" : "datetime('now', 'localtime')";
    const mileage = columns.has("mileage") ? "mileage" : "NULL";
    const liters = columns.has("liters") ? "liters" : "NULL";
    const cost = columns.has("cost") ? "cost" : "NULL";
    const note = columns.has("note") ? "note" : "NULL";
    const createdAt = columns.has("created_at") ? "created_at" : "datetime('now', 'localtime')";
    const deleted = columns.has("deleted") ? "deleted" : "0";
    const updatedAt = columns.has("updated_at") ? "updated_at" : createdAt;
    const rawIsFull = columns.has("is_full") ? "is_full" : "1";
    const isFull = `
CASE
  WHEN record_type = 'refuel' THEN
    (CASE WHEN ${rawIsFull} IN (0, 1) THEN ${rawIsFull} ELSE 1 END)
  ELSE 1
END`;
    const fuelLevel = columns.has("fuel_level_after") ? `
CASE
  WHEN fuel_level_after IS NULL THEN NULL
  WHEN ${isFull} = 0 AND fuel_level_after >= 0 AND fuel_level_after <= 1
  THEN fuel_level_after
  ELSE NULL
END` : "NULL";
    db.exec(`
INSERT INTO records_new
  (id, vehicle_id, record_type, datetime, mileage, liters, cost, is_full,
   fuel_level_after, note, created_at, updated_at, deleted)
SELECT id, vehicle_id, record_type, ${datetime}, ${mileage}, ${liters}, ${cost},
       ${isFull}, ${fuelLevel}, ${note}, ${createdAt}, ${updatedAt}, ${deleted}
FROM records`);
  }
  db.exec("DROP TABLE IF EXISTS records");
  db.exec("ALTER TABLE records_new RENAME TO records");
}

// src/db.ts
var DEFAULT_DB_DIR = join(homedir(), ".car-log");
var DEFAULT_DB_NAME = "car_log.db";
var DB_SCHEMA_VERSION = 2;
function getDbPath(customPath) {
  if (customPath)
    return customPath;
  if (process.env.CAR_LOG_DB)
    return process.env.CAR_LOG_DB;
  return join(DEFAULT_DB_DIR, DEFAULT_DB_NAME);
}
function createDatabase(dbPath) {
  if (dbPath !== ":memory:") {
    const dir = dbPath.substring(0, dbPath.lastIndexOf("/"));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}
function runInTransaction(db, work) {
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}
function formatBackupTimestamp(date) {
  const pad = (value) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` + `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function createMigrationBackup(db, now = () => new Date) {
  const filename = db.filename;
  if (!filename || filename === ":memory:" || filename.startsWith("file::memory:")) {
    return null;
  }
  if (!existsSync(filename))
    return null;
  const basePath = `${filename}.bak-${formatBackupTimestamp(now())}`;
  let backupPath = basePath;
  let suffix = 1;
  while (existsSync(backupPath)) {
    backupPath = `${basePath}-${suffix}`;
    suffix += 1;
  }
  db.query("VACUUM INTO ?").run(backupPath);
  const snapshot = new Database(backupPath, { readonly: true });
  try {
    const rows = snapshot.query("PRAGMA integrity_check").all();
    if (rows.length !== 1 || rows[0]?.integrity_check !== "ok") {
      const detail = rows.map((row) => row.integrity_check).join("; ") || "no result";
      throw new Error(`\u8FC1\u79FB\u524D\u5907\u4EFD\u5B8C\u6574\u6027\u68C0\u67E5\u5931\u8D25 (${backupPath}): ${detail}`);
    }
  } finally {
    snapshot.close();
  }
  return backupPath;
}
function runMigrationTransaction(db, migrate) {
  db.exec("PRAGMA foreign_keys = OFF");
  try {
    runInTransaction(db, migrate);
    const violations = db.query("PRAGMA foreign_key_check").all();
    if (violations.length > 0) {
      throw new Error(`\u8FC1\u79FB\u540E\u5916\u952E\u6821\u9A8C\u5931\u8D25\uFF1A${violations.length} \u884C\u8FDD\u53CD\u5916\u952E\u7EA6\u675F`);
    }
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }
}
function initDb(db) {
  const version = readUserVersion(db);
  if (version === DB_SCHEMA_VERSION)
    return;
  if (version === 0) {
    if (!hasLegacyCoreTables(db)) {
      runInTransaction(db, () => {
        createSchemaV2(db);
        writeUserVersion(db, DB_SCHEMA_VERSION);
      });
      return;
    }
    createMigrationBackup(db);
    runMigrationTransaction(db, () => {
      migrateLegacySchemaToV2(db);
      writeUserVersion(db, DB_SCHEMA_VERSION);
    });
    return;
  }
  throw new Error(`\u4E0D\u652F\u6301\u7684\u6570\u636E\u5E93 schema \u7248\u672C ${version}\uFF08\u5F53\u524D\u652F\u6301 legacy \u7248\u672C 0 \u548C\u76EE\u6807\u7248\u672C ${DB_SCHEMA_VERSION}\uFF09`);
}

// src/cli/db.ts
var cached;
function getCliDb(ctx) {
  if (ctx.db)
    return ctx.db;
  const path = ctx.dbPath ?? getDbPath();
  if (!cached || cached.path !== path) {
    const db = createDatabase(path);
    initDb(db);
    cached = { path, db };
  }
  return cached.db;
}

// src/validation.ts
function formatKm(value) {
  return value.toLocaleString("zh-CN");
}
function candidatesOf(vehicles) {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plate
  }));
}
function ambiguous(car, vehicles) {
  const candidates = candidatesOf(vehicles);
  const message = car === undefined ? `\u5B58\u5728 ${vehicles.length} \u8F86\u5728\u7528\u8F66\u8F86\uFF0C\u8BF7\u7528 --car \u6307\u5B9A ID\u3001\u540D\u79F0\u6216\u8F66\u724C` : `\u8F66\u8F86\u300C${car}\u300D\u5339\u914D\u5230 ${vehicles.length} \u8F86\u5728\u7528\u8F66\u8F86\uFF0C\u8BF7\u7528 --car \u6307\u5B9A ID\u3001\u540D\u79F0\u6216\u8F66\u724C`;
  return new DomainError("VEHICLE_AMBIGUOUS", message, {
    details: { car: car ?? null, candidates }
  });
}
function resolveVehicle(db, car) {
  const trimmed = car?.trim();
  if (trimmed !== undefined && trimmed !== "") {
    const numericId = /^\d+$/.test(trimmed) ? Number(trimmed) : -1;
    const matches = db.query(`SELECT * FROM vehicles
         WHERE deleted = 0
           AND (id = ? OR name = ? OR (plate IS NOT NULL AND plate = ?))
         ORDER BY id ASC`).all(numericId, trimmed, trimmed);
    if (matches.length === 0) {
      throw new DomainError("VEHICLE_NOT_FOUND", `\u672A\u627E\u5230\u8F66\u8F86\u300C${trimmed}\u300D`, {
        details: { car: trimmed }
      });
    }
    if (matches.length > 1)
      throw ambiguous(trimmed, matches);
    return matches[0];
  }
  const active = db.query("SELECT * FROM vehicles WHERE deleted = 0 ORDER BY id ASC").all();
  if (active.length === 0) {
    throw new DomainError("VEHICLE_NOT_FOUND", "\u5F53\u524D\u6CA1\u6709\u5728\u7528\u8F66\u8F86", {
      details: { car: null }
    });
  }
  if (active.length > 1)
    throw ambiguous(undefined, active);
  return active[0];
}
function assertActiveVehicle(db, id) {
  const vehicle = db.query(`SELECT id, name, plate, tank_capacity_l, initial_mileage, initial_datetime
       FROM vehicles WHERE id = ? AND deleted = 0`).get(id);
  if (!vehicle) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u8F66\u8F86\u4E0D\u5B58\u5728 (ID: ${id})`, {
      details: { vehicle_id: id }
    });
  }
  return vehicle;
}
function getCurrentMileage(db, vehicleId) {
  const row = db.query(`SELECT mileage FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
       ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId);
  if (row)
    return row.mileage;
  const vehicle = db.query("SELECT initial_mileage FROM vehicles WHERE id = ? AND deleted = 0").get(vehicleId);
  return vehicle?.initial_mileage ?? null;
}
function getPreviousRecord(db, vehicleId, datetime, options = {}) {
  const conditions = [
    "vehicle_id = ?",
    "deleted = 0",
    "mileage IS NOT NULL"
  ];
  const params = [vehicleId];
  if (options.recordType !== undefined) {
    conditions.push("record_type = ?");
    params.push(options.recordType);
  }
  if (options.excludeId !== undefined) {
    conditions.push("(datetime < ? OR (datetime = ? AND id < ?))");
    params.push(datetime, datetime, options.excludeId);
  } else {
    conditions.push("datetime <= ?");
    params.push(datetime);
  }
  return db.query(`SELECT * FROM records WHERE ${conditions.join(" AND ")}` + " ORDER BY datetime DESC, id DESC LIMIT 1").get(...params) ?? undefined;
}
function findMileageConflict(db, input) {
  const excludeSql = input.excludeId === undefined ? "" : " AND id <> ?";
  const excludeParam = input.excludeId === undefined ? [] : [input.excludeId];
  const before = db.query(`SELECT * FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
         AND datetime < ?${excludeSql}
       ORDER BY mileage DESC, datetime DESC, id DESC LIMIT 1`).get(input.vehicleId, input.datetime, ...excludeParam);
  if (before && input.mileage < before.mileage) {
    return { direction: "before", record: before };
  }
  const after = db.query(`SELECT * FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
         AND datetime > ?${excludeSql}
       ORDER BY mileage ASC, datetime ASC, id ASC LIMIT 1`).get(input.vehicleId, input.datetime, ...excludeParam);
  if (after && input.mileage > after.mileage) {
    return { direction: "after", record: after };
  }
  const sameTime = db.query(`SELECT * FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
         AND datetime = ?${excludeSql}
       ORDER BY mileage DESC, id DESC LIMIT 1`).get(input.vehicleId, input.datetime, ...excludeParam);
  if (sameTime && input.mileage < sameTime.mileage) {
    return { direction: "same_time", record: sameTime };
  }
  return null;
}
function mileageOrderError(conflict, input) {
  const { record, direction } = conflict;
  let message;
  if (direction === "before") {
    message = `\u65B0\u8BB0\u5F55\u91CC\u7A0B ${formatKm(input.mileage)} km \u5C0F\u4E8E\u8FC7\u53BB\u7684\u6700\u5927\u91CC\u7A0B ` + `${formatKm(record.mileage)} km`;
  } else if (direction === "after") {
    message = `\u65B0\u8BB0\u5F55\u91CC\u7A0B ${formatKm(input.mileage)} km \u5927\u4E8E\u672A\u6765\u7684\u6700\u5C0F\u91CC\u7A0B ` + `${formatKm(record.mileage)} km`;
  } else {
    message = `\u540C\u4E00\u65F6\u95F4 ${input.datetime} \u5DF2\u6709\u91CC\u7A0B ${formatKm(record.mileage)} km\uFF0C` + `\u65B0\u8BB0\u5F55\u91CC\u7A0B ${formatKm(input.mileage)} km \u4E0D\u80FD\u66F4\u5C0F`;
  }
  return new DomainError("MILEAGE_ORDER", message, {
    details: {
      direction,
      vehicle_id: input.vehicleId,
      new_record: { mileage: input.mileage, datetime: input.datetime },
      conflicting_record: {
        id: record.id,
        datetime: record.datetime,
        mileage: record.mileage,
        record_type: record.record_type
      }
    }
  });
}
function mileageOrderWarning(conflict, input) {
  return {
    code: "MILEAGE_ORDER_FORCED",
    message: `\u5DF2\u7528 --force \u7ED5\u8FC7\u91CC\u7A0B\u987A\u5E8F\u6821\u9A8C\uFF1A${mileageOrderError(conflict, input).message}`,
    details: {
      direction: conflict.direction,
      conflicting_record_id: conflict.record.id,
      conflicting_record_mileage: conflict.record.mileage,
      conflicting_record_datetime: conflict.record.datetime
    }
  };
}
function requirePositive(field, value) {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    throw new DomainError("INVALID_ARGUMENT", `${field} \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6570\u5B57`, {
      details: { field, value: value ?? null }
    });
  }
}
function requireNonNegative(field, value) {
  if (value === undefined || value === null || !Number.isFinite(value) || value < 0) {
    throw new DomainError("INVALID_ARGUMENT", `${field} \u5FC5\u987B\u662F\u5927\u4E8E\u7B49\u4E8E 0 \u7684\u6570\u5B57`, {
      details: { field, value: value ?? null }
    });
  }
}

// src/vehicle.ts
function invalid2(message, details) {
  throw new DomainError("INVALID_ARGUMENT", message, { details });
}
function validateTankCapacity(value) {
  if (value !== undefined && value !== null && (!Number.isFinite(value) || value <= 0)) {
    invalid2("\u6CB9\u7BB1\u5BB9\u91CF\u5FC5\u987B\u5927\u4E8E 0", { field: "tank_capacity_l", value });
  }
}
function validateInitialMileage(value) {
  if (value !== undefined && value !== null && (!Number.isFinite(value) || value < 0)) {
    invalid2("\u521D\u59CB\u91CC\u7A0B\u4E0D\u80FD\u5C0F\u4E8E 0", { field: "initial_mileage", value });
  }
}
function getVehicleById(db, id) {
  return db.query("SELECT * FROM vehicles WHERE id = ? AND deleted = 0").get(id) ?? undefined;
}
function vehicleToView(db, vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plate,
    tank_capacity_l: vehicle.tank_capacity_l,
    initial_mileage: vehicle.initial_mileage,
    initial_datetime: vehicle.initial_datetime,
    current_mileage: getCurrentMileage(db, vehicle.id),
    created_at: vehicle.created_at,
    updated_at: vehicle.updated_at
  };
}
function addVehicle(db, name, plate, options = {}) {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    invalid2("\u8F66\u8F86\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A", { field: "name" });
  }
  validateTankCapacity(options.tankCapacity);
  validateInitialMileage(options.initialMileage);
  if (options.initialDatetime !== undefined && options.initialDatetime !== null) {
    if (options.initialMileage === undefined || options.initialMileage === null) {
      invalid2("\u8BBE\u7F6E\u521D\u59CB\u65E5\u671F\u65F6\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B\u521D\u59CB\u91CC\u7A0B", {
        field: "initial_datetime"
      });
    }
  }
  const existing = db.query("SELECT id FROM vehicles WHERE name = ? AND deleted = 0").get(trimmedName);
  if (existing) {
    throw new DomainError("VEHICLE_NAME_EXISTS", `\u8F66\u8F86\u540D\u79F0\u300C${trimmedName}\u300D\u5DF2\u5B58\u5728 (ID: ${existing.id})`, { details: { name: trimmedName, existing_id: existing.id } });
  }
  const stamp = formatNow(options.now ?? (() => new Date));
  const result = db.query(`INSERT INTO vehicles
         (name, plate, tank_capacity_l, initial_mileage, initial_datetime,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id`).get(trimmedName, plate ?? null, options.tankCapacity ?? null, options.initialMileage ?? null, options.initialDatetime ?? null, stamp, stamp);
  return getVehicleById(db, result.id);
}
function updateVehicle(db, id, patch, now = () => new Date) {
  const vehicle = getVehicleById(db, id);
  if (!vehicle) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u8F66\u8F86\u4E0D\u5B58\u5728 (ID: ${id})`, {
      details: { vehicle_id: id }
    });
  }
  const assignments = [];
  const params = [];
  const push = (column, value) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };
  if (patch.name !== undefined) {
    const trimmedName = patch.name.trim();
    if (trimmedName === "") {
      invalid2("\u8F66\u8F86\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A", { field: "name" });
    }
    const duplicate = db.query("SELECT id FROM vehicles WHERE name = ? AND deleted = 0 AND id <> ?").get(trimmedName, id);
    if (duplicate) {
      throw new DomainError("VEHICLE_NAME_EXISTS", `\u8F66\u8F86\u540D\u79F0\u300C${trimmedName}\u300D\u5DF2\u5B58\u5728 (ID: ${duplicate.id})`, { details: { name: trimmedName, existing_id: duplicate.id } });
    }
    push("name", trimmedName);
  }
  if (patch.plate !== undefined)
    push("plate", patch.plate);
  if (patch.tankCapacity !== undefined) {
    validateTankCapacity(patch.tankCapacity);
    push("tank_capacity_l", patch.tankCapacity);
  }
  if (patch.initialMileage !== undefined) {
    validateInitialMileage(patch.initialMileage);
    push("initial_mileage", patch.initialMileage);
  }
  if (patch.initialDatetime !== undefined) {
    push("initial_datetime", patch.initialDatetime);
  }
  if (assignments.length === 0) {
    invalid2("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", { vehicle_id: id });
  }
  push("updated_at", formatNow(now));
  params.push(id);
  db.query(`UPDATE vehicles SET ${assignments.join(", ")} WHERE id = ?`).run(...params);
  return getVehicleById(db, id);
}
function listVehicles(db) {
  const vehicles = db.query("SELECT * FROM vehicles WHERE deleted = 0 ORDER BY id ASC").all();
  return vehicles.map((vehicle) => ({
    ...vehicle,
    current_mileage: getCurrentMileage(db, vehicle.id)
  }));
}
function deleteVehicle(db, vehicleId, options = {}) {
  const vehicle = getVehicleById(db, vehicleId);
  if (!vehicle) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u8F66\u8F86\u4E0D\u5B58\u5728 (ID: ${vehicleId})`, {
      details: { vehicle_id: vehicleId }
    });
  }
  const recordCount = db.query("SELECT COUNT(*) AS count FROM records WHERE vehicle_id = ? AND deleted = 0").get(vehicleId)?.count ?? 0;
  const expenseCount = db.query("SELECT COUNT(*) AS count FROM expenses WHERE vehicle_id = ? AND deleted = 0").get(vehicleId)?.count ?? 0;
  const ruleCount = db.query("SELECT COUNT(*) AS count FROM vehicle_maintenance_rules WHERE vehicle_id = ?").get(vehicleId)?.count ?? 0;
  if ((recordCount > 0 || expenseCount > 0) && options.yes !== true) {
    throw new DomainError("INVALID_ARGUMENT", `\u8F66\u8F86\u300C${vehicle.name}\u300D\u8FD8\u6709 ${recordCount} \u6761\u8BB0\u5F55\u548C ${expenseCount} \u6761\u6742\u8D39\uFF0C\u8BF7\u52A0 --yes \u786E\u8BA4\u5220\u9664`, {
      hint: "\u8F66\u8F86\u8FD8\u6709\u8BB0\u5F55\u6216\u6742\u8D39\u65F6\uFF0C\u8BF7\u52A0 --yes \u786E\u8BA4\u5220\u9664",
      details: {
        vehicle_id: vehicleId,
        records: recordCount,
        expenses: expenseCount,
        requires_yes: true
      }
    });
  }
  const updatedAt = formatNow(options.now ?? (() => new Date));
  const tx = db.transaction(() => {
    db.query("UPDATE vehicles SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0").run(updatedAt, vehicleId);
    db.query("UPDATE records SET deleted = 1, updated_at = ? WHERE vehicle_id = ? AND deleted = 0").run(updatedAt, vehicleId);
    db.query("UPDATE expenses SET deleted = 1, updated_at = ? WHERE vehicle_id = ? AND deleted = 0").run(updatedAt, vehicleId);
    db.query("DELETE FROM vehicle_maintenance_rules WHERE vehicle_id = ?").run(vehicleId);
  });
  tx();
  return {
    vehicle,
    affected: {
      records: recordCount,
      expenses: expenseCount,
      maintenance_rules: ruleCount
    }
  };
}

// src/maintenance-items.ts
var MAINTENANCE_ITEM_CATEGORIES = [
  "engine",
  "filter",
  "brake",
  "tire",
  "fluid",
  "electrical",
  "inspection",
  "other"
];
function normalizeItemToken(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
function aliasesOf(item) {
  return splitAliases(item.aliases);
}
function splitItemTokens(input) {
  if (input === undefined || input === null)
    return [];
  const values = typeof input === "string" ? [input] : input;
  const tokens = [];
  for (const value of values) {
    for (const token of value.split(/[,\uFF0C\u3001]/)) {
      const trimmed = token.trim();
      if (trimmed !== "")
        tokens.push(trimmed);
    }
  }
  return tokens;
}
function splitAliases(input) {
  const raw = splitItemTokens(input);
  const seen = new Set;
  const aliases = [];
  for (const alias of raw) {
    const key = normalizeItemToken(alias);
    if (key === "" || seen.has(key))
      continue;
    seen.add(key);
    aliases.push(alias);
  }
  return aliases;
}
function itemToView(item) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    aliases: aliasesOf(item),
    category: item.category,
    default_interval_km: item.default_interval_km,
    default_interval_months: item.default_interval_months,
    description: item.description,
    is_active: item.is_active === 1,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}
function listMaintenanceItems(db, options = {}) {
  const where = options.all === true ? "" : " WHERE is_active = 1";
  return db.query(`SELECT * FROM maintenance_items${where} ORDER BY code ASC`).all();
}
function getMaintenanceItemByCode(db, code) {
  return db.query("SELECT * FROM maintenance_items WHERE lower(code) = lower(?) LIMIT 1").get(code.trim()) ?? undefined;
}
function getMaintenanceItemById(db, id) {
  return db.query("SELECT * FROM maintenance_items WHERE id = ?").get(id) ?? undefined;
}
function getActiveMaintenanceItemById(db, id) {
  return db.query("SELECT * FROM maintenance_items WHERE id = ? AND is_active = 1").get(id) ?? undefined;
}
function invalid3(message, details) {
  throw new DomainError("INVALID_ARGUMENT", message, { details });
}
function validateIntervalKm(value) {
  if (value === undefined || value === null)
    return;
  if (!Number.isFinite(value) || value <= 0) {
    invalid3("\u516C\u91CC\u95F4\u9694\u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6570\u5B57", {
      field: "interval_km",
      value
    });
  }
}
function validateIntervalMonths(value) {
  if (value === undefined || value === null)
    return;
  if (!Number.isInteger(value) || value <= 0) {
    invalid3("\u65F6\u95F4\u95F4\u9694\u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570\u6708", {
      field: "interval_months",
      value
    });
  }
}
function validateBaselineMileage(value) {
  if (value === undefined || value === null)
    return;
  if (!Number.isFinite(value) || value < 0) {
    invalid3("\u57FA\u7EBF\u91CC\u7A0B\u5FC5\u987B\u662F\u5927\u4E8E\u7B49\u4E8E 0 \u7684\u6570\u5B57", {
      field: "baseline_mileage",
      value
    });
  }
}
function validateCategory(category) {
  if (!MAINTENANCE_ITEM_CATEGORIES.includes(category)) {
    invalid3(`\u672A\u77E5\u7684\u4FDD\u517B\u9879\u76EE\u5206\u7C7B\u300C${category}\u300D\uFF0C\u53EF\u9009\u503C\uFF1A${MAINTENANCE_ITEM_CATEGORIES.join(", ")}`, { field: "category", value: category, allowed: MAINTENANCE_ITEM_CATEGORIES });
  }
  return category;
}
function addMaintenanceItem(db, input, now = () => new Date) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (code === "")
    invalid3("\u9879\u76EE\u4EE3\u7801\u4E0D\u80FD\u4E3A\u7A7A", { field: "code" });
  if (name === "")
    invalid3("\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A", { field: "name" });
  const category = validateCategory(input.category ?? "other");
  validateIntervalKm(input.default_interval_km);
  validateIntervalMonths(input.default_interval_months);
  const existing = getMaintenanceItemByCode(db, code);
  if (existing) {
    throw new DomainError("INVALID_ARGUMENT", `\u4FDD\u517B\u9879\u76EE\u4EE3\u7801\u300C${code}\u300D\u5DF2\u5B58\u5728 (ID: ${existing.id})`, { details: { field: "code", code, existing_id: existing.id } });
  }
  const aliases = splitAliases(input.aliases);
  const stamp = formatNow(now);
  try {
    return db.query(`INSERT INTO maintenance_items
           (code, name, aliases, category, default_interval_km,
            default_interval_months, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`).get(code, name, aliases.length > 0 ? aliases.join(",") : null, category, input.default_interval_km ?? null, input.default_interval_months ?? null, input.description ?? null, stamp, stamp);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new DomainError("INVALID_ARGUMENT", `\u4FDD\u517B\u9879\u76EE\u4EE3\u7801\u300C${code}\u300D\u5DF2\u5B58\u5728`, { details: { field: "code", code } });
    }
    throw error;
  }
}
function updateMaintenanceItem(db, code, patch, now = () => new Date) {
  const existing = getMaintenanceItemByCode(db, code);
  if (!existing) {
    const suggestions = suggestMaintenanceItems(db, code);
    throw new DomainError("MAINTENANCE_ITEM_UNKNOWN", `\u672A\u627E\u5230\u4FDD\u517B\u9879\u76EE\u300C${code}\u300D`, {
      details: {
        code,
        tokens: [code],
        suggestions,
        suggestion_codes: suggestions.map((suggestion) => suggestion.code)
      }
    });
  }
  const assignments = [];
  const params = [];
  const push = (column, value) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name === "")
      invalid3("\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A", { field: "name" });
    push("name", name);
  }
  if (patch.aliases !== undefined) {
    const aliases = splitAliases(patch.aliases);
    push("aliases", aliases.length > 0 ? aliases.join(",") : null);
  }
  if (patch.default_interval_km !== undefined) {
    validateIntervalKm(patch.default_interval_km);
    push("default_interval_km", patch.default_interval_km);
  }
  if (patch.default_interval_months !== undefined) {
    validateIntervalMonths(patch.default_interval_months);
    push("default_interval_months", patch.default_interval_months);
  }
  if (patch.description !== undefined)
    push("description", patch.description);
  if (patch.disable === true)
    push("is_active", 0);
  if (assignments.length === 0) {
    invalid3("\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", { code });
  }
  push("updated_at", formatNow(now));
  params.push(existing.id);
  db.query(`UPDATE maintenance_items SET ${assignments.join(", ")} WHERE id = ?`).run(...params);
  return getMaintenanceItemById(db, existing.id);
}
function levenshtein(a, b) {
  if (a === b)
    return 0;
  if (a.length === 0)
    return b.length;
  if (b.length === 0)
    return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1;i <= a.length; i++) {
    const current = [i];
    for (let j = 1;j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}
function suggestMaintenanceItems(db, token, limit = 5) {
  const target = normalizeItemToken(token);
  if (target === "")
    return [];
  const items = listMaintenanceItems(db);
  const scored = [];
  for (const item of items) {
    const candidates = [item.code, item.name, ...aliasesOf(item)].map(normalizeItemToken).filter((candidate) => candidate !== "");
    let best = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      if (candidate.includes(target) || target.includes(candidate)) {
        best = Math.min(best, 1);
        continue;
      }
      const distance = levenshtein(target, candidate);
      if (distance <= 2)
        best = Math.min(best, distance + 1);
    }
    if (best < Number.POSITIVE_INFINITY) {
      scored.push({ score: best, code: item.code, name: item.name });
    }
  }
  return scored.sort((a, b) => a.score - b.score || a.code.localeCompare(b.code)).slice(0, limit).map(({ code, name }) => ({ code, name }));
}
function resolveMaintenanceItem(db, token) {
  const target = normalizeItemToken(token);
  if (target === "")
    return;
  const items = listMaintenanceItems(db);
  const byCode = items.find((item) => normalizeItemToken(item.code) === target);
  if (byCode)
    return byCode;
  const byName = items.find((item) => normalizeItemToken(item.name) === target);
  if (byName)
    return byName;
  return items.find((item) => aliasesOf(item).some((alias) => normalizeItemToken(alias) === target));
}
function resolveMaintenanceItemOrThrow(db, token) {
  const item = resolveMaintenanceItem(db, token);
  if (item)
    return item;
  const suggestions = suggestMaintenanceItems(db, token);
  throw new DomainError("MAINTENANCE_ITEM_UNKNOWN", `\u672A\u8BC6\u522B\u7684\u4FDD\u517B\u9879\u76EE\u300C${token}\u300D`, {
    details: {
      tokens: [token],
      suggestions,
      suggestion_codes: suggestions.map((suggestion) => suggestion.code)
    }
  });
}
function resolveMaintenanceItems(db, tokens) {
  const resolved = [];
  const seen = new Set;
  const unknown = [];
  for (const token of tokens) {
    const item = resolveMaintenanceItem(db, token);
    if (!item) {
      if (!unknown.includes(token))
        unknown.push(token);
      continue;
    }
    if (seen.has(item.id))
      continue;
    seen.add(item.id);
    resolved.push(item);
  }
  if (unknown.length > 0) {
    const suggestions = unknown.flatMap((token) => suggestMaintenanceItems(db, token));
    const deduped = new Map;
    for (const suggestion of suggestions)
      deduped.set(suggestion.code, suggestion);
    const suggestionList = [...deduped.values()].slice(0, 5);
    throw new DomainError("MAINTENANCE_ITEM_UNKNOWN", `\u672A\u8BC6\u522B\u7684\u4FDD\u517B\u9879\u76EE\uFF1A${unknown.join("\u3001")}`, {
      details: {
        tokens: unknown,
        suggestions: suggestionList,
        suggestion_codes: suggestionList.map((suggestion) => suggestion.code)
      }
    });
  }
  return resolved;
}
function requireMaintenanceItemsByIds(db, itemIds) {
  const unique = [...new Set(itemIds)];
  const items = [];
  const missing = [];
  for (const itemId of unique) {
    const item = getActiveMaintenanceItemById(db, itemId);
    if (!item) {
      missing.push(itemId);
      continue;
    }
    items.push(item);
  }
  if (missing.length > 0) {
    throw new DomainError("MAINTENANCE_ITEM_UNKNOWN", `\u672A\u627E\u5230\u4FDD\u517B\u9879\u76EE ID\uFF1A${missing.join(", ")}`, { details: { item_ids: missing, suggestions: [] } });
  }
  return items;
}
function getMaintenanceRule(db, vehicleId, itemId) {
  return db.query("SELECT * FROM vehicle_maintenance_rules WHERE vehicle_id = ? AND item_id = ?").get(vehicleId, itemId) ?? null;
}
function effectiveRule(item, rule) {
  const interval_km = rule?.interval_km ?? item.default_interval_km ?? null;
  const interval_months = rule?.interval_months ?? item.default_interval_months ?? null;
  const enabled = rule === null ? true : rule.enabled === 1;
  let source = "default";
  if (!enabled) {
    source = "disabled";
  } else if (rule !== null && (rule.interval_km !== null || rule.interval_months !== null)) {
    source = "override";
  }
  return { item, rule, interval_km, interval_months, enabled, source };
}
function listEffectiveRules(db, vehicleId) {
  const items = listMaintenanceItems(db);
  const rules = db.query("SELECT * FROM vehicle_maintenance_rules WHERE vehicle_id = ?").all(vehicleId);
  const byItem = new Map(rules.map((rule) => [rule.item_id, rule]));
  return items.map((item) => effectiveRule(item, byItem.get(item.id) ?? null));
}
function getEffectiveRuleForItem(db, vehicleId, item) {
  return effectiveRule(item, getMaintenanceRule(db, vehicleId, item.id));
}
function setMaintenanceRule(db, input, now = () => new Date) {
  const vehicle = db.query("SELECT id FROM vehicles WHERE id = ? AND deleted = 0").get(input.vehicle_id);
  if (!vehicle) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u8F66\u8F86\u4E0D\u5B58\u5728 (ID: ${input.vehicle_id})`, { details: { vehicle_id: input.vehicle_id } });
  }
  const item = getActiveMaintenanceItemById(db, input.item_id);
  if (!item) {
    throw new DomainError("MAINTENANCE_ITEM_UNKNOWN", `\u672A\u627E\u5230\u4FDD\u517B\u9879\u76EE (ID: ${input.item_id})`, {
      details: {
        item_id: input.item_id,
        suggestions: []
      }
    });
  }
  validateIntervalKm(input.interval_km);
  validateIntervalMonths(input.interval_months);
  validateBaselineMileage(input.baseline_mileage);
  let normalizedBaselineDatetime;
  if (input.baseline_datetime !== undefined) {
    if (input.baseline_datetime === null) {
      normalizedBaselineDatetime = null;
    } else {
      if (input.baseline_datetime.trim() === "") {
        invalid3("\u57FA\u7EBF\u65E5\u671F\u4E0D\u80FD\u4E3A\u7A7A", { field: "baseline_datetime" });
      }
      try {
        normalizedBaselineDatetime = parseDatetime(input.baseline_datetime, now);
      } catch {
        invalid3("\u57FA\u7EBF\u65E5\u671F\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u4F7F\u7528 YYYY-MM-DD \u6216 YYYY-MM-DD HH:MM:SS", {
          field: "baseline_datetime",
          value: input.baseline_datetime
        });
      }
    }
  }
  const existing = getMaintenanceRule(db, input.vehicle_id, input.item_id);
  const intervalKm = input.interval_km !== undefined ? input.interval_km : existing?.interval_km ?? null;
  const intervalMonths = input.interval_months !== undefined ? input.interval_months : existing?.interval_months ?? null;
  const baselineMileage = input.baseline_mileage !== undefined ? input.baseline_mileage : existing?.baseline_mileage ?? null;
  const baselineDatetime = normalizedBaselineDatetime !== undefined ? normalizedBaselineDatetime : existing?.baseline_datetime ?? null;
  const enabled = input.disable === true ? 0 : 1;
  const stamp = formatNow(now);
  return db.query(`INSERT INTO vehicle_maintenance_rules
         (vehicle_id, item_id, interval_km, interval_months,
          baseline_mileage, baseline_datetime, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(vehicle_id, item_id) DO UPDATE SET
         interval_km = excluded.interval_km,
         interval_months = excluded.interval_months,
         baseline_mileage = excluded.baseline_mileage,
         baseline_datetime = excluded.baseline_datetime,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at
       RETURNING *`).get(input.vehicle_id, input.item_id, intervalKm, intervalMonths, baselineMileage, baselineDatetime, enabled, stamp, stamp);
}
function unsetMaintenanceRule(db, vehicleId, itemId) {
  const result = db.query("DELETE FROM vehicle_maintenance_rules WHERE vehicle_id = ? AND item_id = ?").run(vehicleId, itemId);
  return result.changes > 0;
}
function getLastMaintenanceService(db, vehicleId, itemId, today) {
  return db.query(`SELECT r.mileage AS mileage, r.datetime AS datetime
         FROM maintenance_record_items mri
         JOIN records r ON r.id = mri.record_id
         WHERE mri.item_id = ?
           AND r.vehicle_id = ?
           AND r.record_type = 'maintenance'
           AND r.deleted = 0
           AND substr(r.datetime, 1, 10) <= ?
         ORDER BY r.datetime DESC, r.id DESC
         LIMIT 1`).get(itemId, vehicleId, today) ?? null;
}
function getMaintenanceRecordItems(db, recordId) {
  return db.query(`SELECT mi.*
       FROM maintenance_record_items mri
       JOIN maintenance_items mi ON mi.id = mri.item_id
       WHERE mri.record_id = ?
       ORDER BY mi.code ASC`).all(recordId);
}

// src/reminders.ts
var DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;
function parseDatetimeParts(value) {
  const match = DATETIME_PATTERN.exec(value.trim());
  if (!match)
    return null;
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] === undefined ? 0 : Number(match[4]),
    minute: match[5] === undefined ? 0 : Number(match[5]),
    second: match[6] === undefined ? 0 : Number(match[6])
  };
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31 || parts.hour > 23 || parts.minute > 59 || parts.second > 59) {
    return null;
  }
  return parts;
}
function pad2(value) {
  return value.toString().padStart(2, "0");
}
function formatParts(parts) {
  return `${parts.year.toString().padStart(4, "0")}-${pad2(parts.month)}-${pad2(parts.day)} ` + `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function addMonths(datetime, months) {
  const parts = parseDatetimeParts(datetime);
  if (!parts) {
    throw new DomainError("INVALID_ARGUMENT", `\u65E0\u6548\u7684\u65E5\u671F\u65F6\u95F4\u300C${datetime}\u300D`, {
      details: { datetime }
    });
  }
  const totalMonths = parts.year * 12 + (parts.month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12 + 12) % 12 + 1;
  const targetDay = Math.min(parts.day, daysInMonth(targetYear, targetMonth));
  return formatParts({
    year: targetYear,
    month: targetMonth,
    day: targetDay,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  });
}
function dateOf(datetime) {
  return datetime.slice(0, 10);
}
function utcDayNumber(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new DomainError("INVALID_ARGUMENT", `\u65E0\u6548\u7684\u65E5\u671F\u300C${date}\u300D`, {
      details: { date }
    });
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
function calendarDaysBetween(from, to) {
  const fromMs = utcDayNumber(dateOf(from));
  const toMs = utcDayNumber(dateOf(to));
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}
function sourceOf(input) {
  if (input.last_service)
    return "last_service";
  if (input.rule?.baseline_mileage !== null && input.rule?.baseline_mileage !== undefined) {
    return "rule_baseline";
  }
  if (input.rule?.baseline_datetime !== null && input.rule?.baseline_datetime !== undefined) {
    return "rule_baseline";
  }
  if (input.vehicle_initial_mileage !== null || input.vehicle_initial_datetime !== null) {
    return "vehicle_initial";
  }
  return "unknown";
}
function computeReminder(input) {
  const intervalKm = input.rule?.interval_km ?? input.item.default_interval_km ?? null;
  const intervalMonths = input.rule?.interval_months ?? input.item.default_interval_months ?? null;
  const kmAnchor = input.last_service?.mileage ?? input.rule?.baseline_mileage ?? input.vehicle_initial_mileage ?? null;
  const dateAnchor = input.last_service?.datetime ?? input.rule?.baseline_datetime ?? input.vehicle_initial_datetime ?? null;
  const nextDueMileage = intervalKm !== null && kmAnchor !== null ? kmAnchor + intervalKm : null;
  const nextDueDatetime = intervalMonths !== null && dateAnchor !== null ? addMonths(dateAnchor, intervalMonths) : null;
  const remainingKm = nextDueMileage !== null && input.current_mileage !== null ? nextDueMileage - input.current_mileage : null;
  const remainingDays = nextDueDatetime !== null ? calendarDaysBetween(input.today, dateOf(nextDueDatetime)) : null;
  let status;
  if (intervalKm === null && intervalMonths === null) {
    status = "unknown";
  } else if (remainingKm === null && remainingDays === null) {
    status = "unknown";
  } else if (remainingKm !== null && remainingKm <= 0 || remainingDays !== null && remainingDays <= 0) {
    status = "overdue";
  } else if (remainingKm !== null && remainingKm <= input.due_soon_km || remainingDays !== null && remainingDays <= input.due_soon_days) {
    status = "due_soon";
  } else {
    status = "ok";
  }
  return {
    item: input.item.code,
    name: input.item.name,
    category: input.item.category,
    status,
    last_service_mileage: input.last_service?.mileage ?? null,
    last_service_datetime: input.last_service?.datetime ?? null,
    interval_km: intervalKm,
    interval_months: intervalMonths,
    next_due_mileage: nextDueMileage,
    next_due_datetime: nextDueDatetime,
    remaining_km: remainingKm,
    remaining_days: remainingDays,
    source: sourceOf(input)
  };
}
function reminderUrgency(reminder, thresholds) {
  if (reminder.status === "unknown")
    return null;
  const values = [];
  if (reminder.remaining_km !== null) {
    values.push(reminder.remaining_km / thresholds.due_soon_km);
  }
  if (reminder.remaining_days !== null) {
    values.push(reminder.remaining_days / thresholds.due_soon_days);
  }
  if (values.length === 0)
    return null;
  return Math.min(...values);
}
var STATUS_RANK = {
  overdue: 0,
  due_soon: 1,
  ok: 2,
  unknown: 3
};
function sortReminders(reminders, thresholds) {
  return [...reminders].sort((a, b) => {
    const statusDelta = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (statusDelta !== 0)
      return statusDelta;
    const aKey = reminderUrgency(a, thresholds);
    const bKey = reminderUrgency(b, thresholds);
    if (aKey === null && bKey === null)
      return a.item.localeCompare(b.item);
    if (aKey === null)
      return 1;
    if (bKey === null)
      return -1;
    if (aKey !== bKey)
      return aKey - bKey;
    return a.item.localeCompare(b.item);
  });
}
var DUE_SOON_SETTING_KEYS = ["due_soon_km", "due_soon_days"];
var SETTING_DEFAULTS = {
  due_soon_km: 500,
  due_soon_days: 30
};
function isDueSoonSettingKey(key) {
  return DUE_SOON_SETTING_KEYS.includes(key);
}
function requireDueSoonSettingKey(key) {
  if (!isDueSoonSettingKey(key)) {
    throw new DomainError("INVALID_ARGUMENT", `\u672A\u77E5\u7684\u8BBE\u7F6E\u9879\u300C${key}\u300D\uFF0C\u53EA\u652F\u6301 ${DUE_SOON_SETTING_KEYS.join(" / ")}`, {
      details: {
        key,
        allowed: DUE_SOON_SETTING_KEYS
      }
    });
  }
  return key;
}
function parsePositiveIntegerSetting(key, raw) {
  if (!/^\d+$/.test(raw.trim()))
    return null;
  const value = Number(raw.trim());
  if (!Number.isSafeInteger(value) || value <= 0)
    return null;
  return value;
}
function readSettingRow(db, key) {
  return db.query("SELECT value FROM settings WHERE key = ?").get(key)?.value;
}
function getDueSoonSetting(db, key) {
  const settingKey = requireDueSoonSettingKey(key);
  const raw = readSettingRow(db, settingKey);
  if (raw === undefined)
    return SETTING_DEFAULTS[settingKey];
  return parsePositiveIntegerSetting(settingKey, raw) ?? SETTING_DEFAULTS[settingKey];
}
function setDueSoonSetting(db, key, value) {
  const settingKey = requireDueSoonSettingKey(key);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DomainError("INVALID_ARGUMENT", `${settingKey} \u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570`, { details: { key: settingKey, value } });
  }
  db.query(`INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(settingKey, String(value));
  return value;
}
function getReminderThresholds(db) {
  return {
    due_soon_km: getDueSoonSetting(db, "due_soon_km"),
    due_soon_days: getDueSoonSetting(db, "due_soon_days")
  };
}
function resolveToday(options) {
  if (options.today !== undefined)
    return options.today;
  return dateOf(formatNow(options.now ?? (() => new Date)));
}
function buildReminder(db, vehicle, item, rule, thresholds, today, currentMileage) {
  return computeReminder({
    item,
    rule,
    last_service: getLastMaintenanceService(db, vehicle.id, item.id, today),
    vehicle_initial_mileage: vehicle.initial_mileage,
    vehicle_initial_datetime: vehicle.initial_datetime,
    current_mileage: currentMileage,
    today,
    due_soon_km: thresholds.due_soon_km,
    due_soon_days: thresholds.due_soon_days
  });
}
function getVehicleReminders(db, vehicleId, options = {}) {
  const vehicle = assertActiveVehicle(db, vehicleId);
  const today = resolveToday(options);
  const thresholds = getReminderThresholds(db);
  const currentMileage = getCurrentMileage(db, vehicleId);
  const effective = listEffectiveRules(db, vehicleId);
  const reminders = effective.filter((entry) => entry.enabled).map((entry) => buildReminder(db, vehicle, entry.item, entry.rule, thresholds, today, currentMileage));
  return sortReminders(reminders, thresholds);
}
function getVehicleReminderForItem(db, vehicleId, item, options = {}) {
  const vehicle = assertActiveVehicle(db, vehicleId);
  const today = resolveToday(options);
  const thresholds = getReminderThresholds(db);
  return buildReminder(db, vehicle, item, getMaintenanceRule(db, vehicleId, item.id), thresholds, today, getCurrentMileage(db, vehicleId));
}
function countReminderStatuses(reminders) {
  const counts = {
    overdue: 0,
    due_soon: 0,
    ok: 0,
    unknown: 0
  };
  for (const reminder of reminders)
    counts[reminder.status] += 1;
  return counts;
}

// src/records.ts
var DUPLICATE_WINDOW_MINUTES = 10;
var IDEMPOTENCY_KEY_PREFIX = "idempotency:";
var RECORD_TYPE_LABELS = {
  mileage: "\u91CC\u7A0B",
  refuel: "\u52A0\u6CB9",
  maintenance: "\u4FDD\u517B"
};
function recordToView(record, options = {}) {
  return {
    id: options.preview === true ? null : record.id,
    vehicle_id: record.vehicle_id,
    record_type: record.record_type,
    datetime: record.datetime,
    mileage: record.mileage,
    liters: record.liters,
    cost: record.cost,
    is_full: record.is_full === 1,
    fuel_level_after: record.fuel_level_after,
    note: record.note,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}
function getRecordById(db, id) {
  return db.query("SELECT * FROM records WHERE id = ? AND deleted = 0").get(id) ?? undefined;
}
function assertRecordType(db, id, expected) {
  const record = getRecordById(db, id);
  if (!record) {
    throw new DomainError("RECORD_NOT_FOUND", `\u8BB0\u5F55\u4E0D\u5B58\u5728 (ID: ${id})`, {
      details: { record_id: id, expected_type: expected }
    });
  }
  if (record.record_type !== expected) {
    throw new DomainError("RECORD_TYPE_MISMATCH", `\u8BB0\u5F55 ${id} \u662F${RECORD_TYPE_LABELS[record.record_type]}\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u7528${RECORD_TYPE_LABELS[expected]}\u547D\u4EE4\u64CD\u4F5C`, {
      details: {
        record_id: id,
        expected_type: expected,
        actual_type: record.record_type
      }
    });
  }
  return record;
}
function softDeleteRecord(db, id, expected, now = () => new Date) {
  const record = assertRecordType(db, id, expected);
  const updatedAt = formatNow(now);
  db.query("UPDATE records SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0").run(updatedAt, id);
  return { ...record, deleted: 1, updated_at: updatedAt };
}
function updateRecord(db, id, patch, now = () => new Date) {
  const assignments = [];
  const params = [];
  const push = (column, value) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };
  if (patch.mileage !== undefined)
    push("mileage", patch.mileage);
  if (patch.liters !== undefined)
    push("liters", patch.liters);
  if (patch.cost !== undefined)
    push("cost", patch.cost);
  if (patch.datetime !== undefined)
    push("datetime", patch.datetime);
  if (patch.note !== undefined)
    push("note", patch.note);
  if (patch.is_full !== undefined)
    push("is_full", patch.is_full ? 1 : 0);
  if (patch.fuel_level_after !== undefined) {
    push("fuel_level_after", patch.fuel_level_after);
  }
  push("updated_at", formatNow(now));
  params.push(id);
  db.query(`UPDATE records SET ${assignments.join(", ")} WHERE id = ?`).run(...params);
  const updated = getRecordById(db, id);
  if (!updated) {
    throw new DomainError("RECORD_NOT_FOUND", `\u8BB0\u5F55\u4E0D\u5B58\u5728 (ID: ${id})`, {
      details: { record_id: id }
    });
  }
  return updated;
}
function listRecords(db, options) {
  const conditions = ["vehicle_id = ?", "deleted = 0"];
  const params = [options.vehicleId];
  if (options.recordType !== undefined) {
    conditions.push("record_type = ?");
    params.push(options.recordType);
  }
  if (options.from !== undefined) {
    conditions.push("datetime >= ?");
    params.push(options.from);
  }
  if (options.to !== undefined) {
    conditions.push("datetime <= ?");
    params.push(options.to);
  }
  const order = options.order === "asc" ? "ASC" : "DESC";
  let sql = `SELECT * FROM records WHERE ${conditions.join(" AND ")}` + ` ORDER BY datetime ${order}, id ${order}`;
  if (options.limit !== undefined)
    sql += " LIMIT ?";
  const statement = db.query(sql);
  if (options.limit !== undefined) {
    return statement.all(...params, options.limit);
  }
  return statement.all(...params);
}
function shiftMinutes(datetime, minutes) {
  const base = new Date(datetime.replace(" ", "T"));
  base.setMinutes(base.getMinutes() + minutes);
  return formatNow(() => base);
}
function findDuplicateRecord(db, input) {
  const conditions = [
    "vehicle_id = ?",
    "record_type = ?",
    "deleted = 0",
    "mileage = ?"
  ];
  const params = [
    input.vehicleId,
    input.recordType,
    input.mileage
  ];
  if (input.datetimeProvided) {
    conditions.push("datetime = ?");
    params.push(input.datetime);
  } else {
    conditions.push("datetime >= ?", "datetime <= ?");
    params.push(shiftMinutes(input.datetime, -DUPLICATE_WINDOW_MINUTES), input.datetime);
  }
  if (input.recordType === "refuel") {
    conditions.push("liters IS ?", "cost IS ?");
    params.push(input.liters ?? null, input.cost ?? null);
  } else if (input.recordType === "maintenance") {
    conditions.push("cost IS ?");
    params.push(input.cost ?? null);
  }
  if (input.excludeId !== undefined) {
    conditions.push("id <> ?");
    params.push(input.excludeId);
  }
  return db.query(`SELECT * FROM records WHERE ${conditions.join(" AND ")}` + " ORDER BY id DESC LIMIT 1").get(...params) ?? undefined;
}
function findIdempotencyRecord(db, key) {
  const settingKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`;
  const row = db.query("SELECT value FROM settings WHERE key = ?").get(settingKey);
  if (!row)
    return;
  const recordId = Number(row.value);
  if (!Number.isInteger(recordId)) {
    db.query("DELETE FROM settings WHERE key = ?").run(settingKey);
    return;
  }
  const record = getRecordById(db, recordId);
  if (!record) {
    db.query("DELETE FROM settings WHERE key = ?").run(settingKey);
    return;
  }
  return record;
}
function storeIdempotencyKey(db, key, recordId) {
  db.query(`INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(`${IDEMPOTENCY_KEY_PREFIX}${key}`, String(recordId));
}

// src/fuel.ts
function finite(value) {
  if (value === null || value === undefined)
    return null;
  return Number.isFinite(value) ? value : null;
}
function sum(values) {
  let total = 0;
  for (const value of values)
    total += value;
  return total;
}
function compareRecords(a, b) {
  if (a.datetime !== b.datetime)
    return a.datetime < b.datetime ? -1 : 1;
  return a.id - b.id;
}
function computeFuelConfidence(segments) {
  if (segments.length === 0)
    return "none";
  const recent = segments.slice(-3).map((segment) => segment.l_per_100km);
  const mean = sum(recent) / recent.length;
  const variance = sum(recent.map((value) => (value - mean) ** 2)) / recent.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  if (segments.length >= 4 && cv <= 0.1)
    return "high";
  if (segments.length >= 2 && cv <= 0.25)
    return "medium";
  return "low";
}
function computeOverall(segments) {
  if (segments.length === 0)
    return null;
  const distance = sum(segments.map((segment) => segment.distance));
  const liters = sum(segments.map((segment) => segment.liters));
  const cost = sum(segments.map((segment) => segment.cost));
  return {
    distance,
    liters,
    cost,
    l_per_100km: distance > 0 ? liters / distance * 100 : 0,
    cost_per_km: distance > 0 ? cost / distance : 0,
    price_per_liter: liters > 0 ? cost / liters : 0,
    segment_count: segments.length
  };
}
function warning(code, message, details) {
  return details === undefined ? { code, message } : { code, message, details };
}
function computeFuelSummary(records, options = {}) {
  const warnings = [];
  const sorted = [...records].sort(compareRecords);
  const segments = [];
  const unmeasuredPartials = {
    liters: 0,
    cost: 0,
    count: 0
  };
  let baseline = null;
  let baselineMileage = null;
  let pendingRecords = [];
  for (const record of sorted) {
    const mileage = finite(record.mileage);
    const liters = finite(record.liters);
    if (mileage === null || liters === null || liters <= 0) {
      warnings.push(warning("INVALID_REFUEL_ROW", `\u52A0\u6CB9\u8BB0\u5F55 (ID: ${record.id}) \u7F3A\u5C11\u6709\u6548\u91CC\u7A0B\u6216\u6CB9\u91CF\uFF0C\u5DF2\u8DF3\u8FC7`, {
        record_id: record.id,
        mileage: record.mileage,
        liters: record.liters
      }));
      continue;
    }
    const cost = finite(record.cost);
    if (cost === null) {
      warnings.push(warning("MISSING_COST", `\u52A0\u6CB9\u8BB0\u5F55 (ID: ${record.id}) \u7F3A\u5C11\u91D1\u989D\uFF0C\u5206\u6BB5\u6309 0 \u5143\u8BA1\u5165`, { record_id: record.id }));
    }
    const safeCost = cost ?? 0;
    const isFull = record.is_full === 1;
    if (baseline === null) {
      if (isFull) {
        baseline = record;
        baselineMileage = mileage;
        pendingRecords = [];
      } else {
        unmeasuredPartials.liters += liters;
        unmeasuredPartials.cost += safeCost;
        unmeasuredPartials.count += 1;
      }
      continue;
    }
    pendingRecords.push(record);
    if (!isFull)
      continue;
    const distance = mileage - baselineMileage;
    if (distance <= 0) {
      warnings.push(warning("DISTANCE_NON_POSITIVE", `\u52A0\u6EE1\u8BB0\u5F55 (ID: ${record.id}) \u7684\u91CC\u7A0B ${mileage} km \u672A\u8D85\u8FC7\u4E0A\u6B21\u52A0\u6EE1\u7684 ${baselineMileage} km\uFF0C\u5DF2\u91CD\u65B0\u5EFA\u7ACB\u57FA\u51C6`, {
        record_id: record.id,
        from_record_id: baseline.id,
        from_mileage: baselineMileage,
        to_mileage: mileage
      }));
      baseline = record;
      baselineMileage = mileage;
      pendingRecords = [];
      continue;
    }
    const segmentLiters = sum(pendingRecords.map((row) => finite(row.liters) ?? 0));
    const segmentCost = sum(pendingRecords.map((row) => finite(row.cost) ?? 0));
    const partialCount = pendingRecords.filter((row) => row.is_full !== 1).length;
    segments.push({
      from_record_id: baseline.id,
      to_record_id: record.id,
      from_datetime: baseline.datetime,
      to_datetime: record.datetime,
      from_mileage: baselineMileage,
      to_mileage: mileage,
      distance,
      liters: segmentLiters,
      cost: segmentCost,
      l_per_100km: segmentLiters / distance * 100,
      cost_per_km: segmentCost / distance,
      price_per_liter: segmentLiters > 0 ? segmentCost / segmentLiters : 0,
      partial_count: partialCount
    });
    baseline = record;
    baselineMileage = mileage;
    pendingRecords = [];
  }
  const confidence = computeFuelConfidence(segments);
  const tankCapacity = finite(options.tankCapacityL);
  let pending = null;
  if (baseline !== null && pendingRecords.length > 0) {
    const latestPending = pendingRecords[pendingRecords.length - 1];
    const optionCurrentMileage = finite(options.currentMileage);
    const lastRefuelMileage = finite(latestPending.mileage) ?? 0;
    const currentMileage = optionCurrentMileage ?? lastRefuelMileage;
    const distance = currentMileage - baselineMileage;
    const liters = sum(pendingRecords.map((record) => finite(record.liters) ?? 0));
    const cashSpent = sum(pendingRecords.map((record) => finite(record.cost) ?? 0));
    const latestCost = finite(latestPending.cost);
    const latestLiters = finite(latestPending.liters);
    let pricePerLiter = null;
    if (latestCost !== null && latestLiters !== null && latestLiters > 0) {
      pricePerLiter = latestCost / latestLiters;
    } else if (segments.length > 0) {
      pricePerLiter = segments[segments.length - 1].price_per_liter;
    }
    let lowerBound = null;
    if (distance > 0) {
      lowerBound = {
        l_per_100km: liters / distance * 100,
        liters,
        cost: pricePerLiter === null ? null : liters * pricePerLiter,
        cost_per_km: pricePerLiter === null ? null : liters * pricePerLiter / distance,
        price_per_liter: pricePerLiter
      };
    } else {
      warnings.push(warning("PENDING_DISTANCE_INVALID", `\u5F53\u524D\u91CC\u7A0B ${currentMileage} km \u672A\u8D85\u8FC7\u4E0A\u6B21\u52A0\u6EE1\u7684 ${baselineMileage} km\uFF0C\u65E0\u6CD5\u8BA1\u7B97 pending \u4E0B\u9650`, {
        baseline_record_id: baseline.id,
        baseline_mileage: baselineMileage,
        current_mileage: currentMileage
      }));
    }
    let averageConsumption = null;
    let estimate = null;
    let estimateLiters = null;
    if (segments.length > 0 && distance > 0) {
      const recent = segments.slice(-3);
      const recentLiters = sum(recent.map((segment) => segment.liters));
      const recentDistance = sum(recent.map((segment) => segment.distance));
      const average = recentDistance > 0 ? recentLiters / recentDistance * 100 : 0;
      averageConsumption = average;
      estimateLiters = average / 100 * distance;
      if (estimateLiters < liters) {
        estimateLiters = liters;
        warnings.push(warning("ESTIMATE_BELOW_LOWER_BOUND", `\u5386\u53F2\u4F30\u7B97\u6D88\u8017 ${(average / 100 * distance).toFixed(2)} L \u5C0F\u4E8E\u7D2F\u8BA1\u8865\u6CB9 ${liters.toFixed(2)} L\uFF0C\u5DF2\u6309\u4E25\u683C\u4E0B\u9650\u8F93\u51FA`, {
          estimate_liters: average / 100 * distance,
          lower_bound_liters: liters
        }));
      }
      estimate = {
        l_per_100km: estimateLiters / distance * 100,
        liters: estimateLiters,
        cost: pricePerLiter === null ? null : estimateLiters * pricePerLiter,
        cost_per_km: pricePerLiter === null ? null : estimateLiters * pricePerLiter / distance,
        price_per_liter: pricePerLiter,
        basis: "history",
        estimate: true,
        confidence
      };
    }
    let tank = null;
    if (tankCapacity !== null && tankCapacity > 0 && estimate !== null && estimateLiters !== null && averageConsumption !== null) {
      const litersAfterFill = tankCapacity - estimateLiters + liters;
      if (estimateLiters < 0 || estimateLiters > tankCapacity) {
        warnings.push(warning("TANK_INCONSISTENT", `\u4F30\u7B97\u6D88\u8017 ${estimateLiters.toFixed(2)} L \u8D85\u51FA\u6CB9\u7BB1\u5BB9\u91CF ${tankCapacity} L\uFF0C\u8BF7\u68C0\u67E5\u8BB0\u5F55`, {
          estimate_liters: estimateLiters,
          tank_capacity_l: tankCapacity
        }));
      }
      tank = {
        drop_liters: estimateLiters - liters,
        liters_after_fill: litersAfterFill,
        ratio: litersAfterFill / tankCapacity,
        range_km: averageConsumption > 0 ? litersAfterFill / averageConsumption * 100 : 0
      };
    }
    let gauge = null;
    const fuelLevel = finite(latestPending.fuel_level_after);
    if (tankCapacity !== null && tankCapacity > 0 && distance > 0 && fuelLevel !== null) {
      const gaugeLiters = tankCapacity * (1 - fuelLevel) + liters;
      if (fuelLevel < 0 || fuelLevel > 1 || gaugeLiters > tankCapacity + liters) {
        warnings.push(warning("GAUGE_INCONSISTENT", `\u6CB9\u8868\u6BD4\u4F8B ${fuelLevel} \u4E0E\u6CB9\u7BB1\u5BB9\u91CF ${tankCapacity} L \u4E0D\u4E00\u81F4\uFF0C\u6CB9\u8868\u4F30\u7B97\u53EF\u80FD\u4E0D\u53EF\u9760`, {
          fuel_level_after: fuelLevel,
          tank_capacity_l: tankCapacity,
          gauge_liters: gaugeLiters
        }));
      }
      const remainingLiters = tankCapacity * fuelLevel;
      const perKm = gaugeLiters / distance;
      gauge = {
        l_per_100km: gaugeLiters / distance * 100,
        liters: gaugeLiters,
        cost: pricePerLiter === null ? null : gaugeLiters * pricePerLiter,
        cost_per_km: pricePerLiter === null ? null : gaugeLiters * pricePerLiter / distance,
        remaining_liters: remainingLiters,
        range_km: perKm > 0 ? remainingLiters / perKm : 0,
        basis: "gauge",
        estimate: true,
        confidence
      };
    }
    pending = {
      distance,
      liters,
      cash_spent: cashSpent,
      partial_count: pendingRecords.length,
      price_per_liter: pricePerLiter,
      confidence,
      lower_bound: lowerBound,
      estimate,
      tank,
      gauge
    };
  }
  let outputSegments = segments;
  let rangeHasNoSegments = false;
  if (options.from !== undefined || options.to !== undefined) {
    const from = options.from;
    const to = options.to;
    outputSegments = segments.filter((segment) => (from === undefined || segment.to_datetime >= from) && (to === undefined || segment.to_datetime <= to)).map((segment) => from !== undefined && segment.from_datetime < from ? { ...segment, starts_before_range: true } : { ...segment });
    rangeHasNoSegments = outputSegments.length === 0;
  }
  if (options.limit !== undefined && Number.isFinite(options.limit)) {
    const limit = Math.max(0, Math.trunc(options.limit));
    outputSegments = outputSegments.slice(Math.max(0, outputSegments.length - limit));
  }
  if (baseline === null) {
    warnings.push(warning("BASELINE_MISSING", "\u8FD8\u6CA1\u6709\u52A0\u6EE1\u8BB0\u5F55\u4F5C\u4E3A\u6CB9\u8017\u57FA\u51C6\uFF0C\u9700\u8981\u5148\u8BB0\u5F55\u4E00\u6B21\u52A0\u6EE1", { unmeasured_partial_count: unmeasuredPartials.count }));
  } else if (rangeHasNoSegments) {
    warnings.push(warning("BASELINE_MISSING", "\u6240\u9009\u65F6\u95F4\u8303\u56F4\u5185\u6CA1\u6709\u5DF2\u95ED\u5408\u7684\u6CB9\u8017\u5206\u6BB5", { from: options.from ?? null, to: options.to ?? null }));
  }
  return {
    segments: outputSegments,
    latest_segment: outputSegments.length > 0 ? outputSegments[outputSegments.length - 1] : null,
    overall: computeOverall(outputSegments),
    pending,
    unmeasured_partials: unmeasuredPartials,
    warnings,
    confidence
  };
}

// src/refuel.ts
function defaultNow() {
  return new Date;
}
function duplicateError(record) {
  return new DomainError("DUPLICATE_RECORD", `\u68C0\u6D4B\u5230\u91CD\u590D\u7684\u52A0\u6CB9\u8BB0\u5F55 (ID: ${record.id}, ${record.datetime}, ${record.mileage} km, ${record.liters} L, ${record.cost} \u5143)\uFF1B\u786E\u8BA4\u4E0D\u662F\u91CD\u590D\u63D0\u4EA4\u540E\u52A0 --force`, {
    details: {
      record_id: record.id,
      record_type: record.record_type,
      datetime: record.datetime,
      mileage: record.mileage,
      liters: record.liters,
      cost: record.cost
    }
  });
}
function validateFuelLevel(value, tankCapacity) {
  if (value === undefined || value === null)
    return;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new DomainError("INVALID_ARGUMENT", `fuel_level_after \u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4\uFF08\u6536\u5230 ${value}\uFF09`, { details: { field: "fuel_level_after", value } });
  }
  if (tankCapacity === null) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BB0\u5F55\u6CB9\u8868\u6BD4\u4F8B\u524D\u8BF7\u5148\u4E3A\u8F66\u8F86\u8BBE\u7F6E --tank-capacity", { details: { field: "tank_capacity_l", vehicle_id: null } });
  }
}
function previewRecord(input, datetime, isFull, fuelLevel, now) {
  const stamp = formatNow(now);
  return {
    id: 0,
    vehicle_id: input.vehicle_id,
    record_type: "refuel",
    datetime,
    mileage: input.mileage,
    liters: input.liters,
    cost: input.cost,
    is_full: isFull ? 1 : 0,
    fuel_level_after: isFull ? null : fuelLevel,
    note: input.note ?? null,
    deleted: 0,
    created_at: stamp,
    updated_at: stamp
  };
}
function createRefuelRecord(db, input, options = {}) {
  const now = options.now ?? defaultNow;
  const vehicle = assertActiveVehicle(db, input.vehicle_id);
  requirePositive("mileage", input.mileage);
  requirePositive("liters", input.liters);
  requirePositive("cost", input.cost);
  const isFull = input.is_full;
  const fuelLevel = isFull ? null : input.fuel_level_after ?? null;
  if (isFull && input.fuel_level_after !== undefined && input.fuel_level_after !== null) {
    throw new DomainError("INVALID_ARGUMENT", "\u52A0\u6EE1\u8BB0\u5F55\u4E0D\u80FD\u540C\u65F6\u63D0\u4F9B\u6CB9\u8868\u6BD4\u4F8B (--fuel-level)", { details: { field: "fuel_level_after" } });
  }
  validateFuelLevel(fuelLevel, vehicle.tank_capacity_l);
  const datetimeProvided = options.datetimeProvided ?? (input.datetime !== undefined && input.datetime.trim() !== "");
  const datetime = parseDatetime(input.datetime, now);
  const note = input.note ?? null;
  if (options.idempotencyKey !== undefined) {
    const replay = findIdempotencyRecord(db, options.idempotencyKey);
    if (replay) {
      return {
        record: replay,
        warnings: [
          {
            code: "IDEMPOTENT_REPLAY",
            message: `idempotency-key \u5DF2\u5904\u7406\u8FC7\uFF0C\u8FD4\u56DE\u5DF2\u6709\u8BB0\u5F55 (ID: ${replay.id})`
          }
        ],
        replayed: true,
        dryRun: options.dryRun === true
      };
    }
  }
  const warnings = [];
  const duplicate = findDuplicateRecord(db, {
    vehicleId: input.vehicle_id,
    recordType: "refuel",
    datetime,
    datetimeProvided,
    mileage: input.mileage,
    liters: input.liters,
    cost: input.cost
  });
  if (duplicate) {
    if (options.force !== true)
      throw duplicateError(duplicate);
    warnings.push({
      code: "DUPLICATE_RECORD_FORCED",
      message: `\u5DF2\u7528 --force \u5199\u5165\u7591\u4F3C\u91CD\u590D\u8BB0\u5F55 (\u539F\u8BB0\u5F55 ID: ${duplicate.id})`,
      details: { duplicate_record_id: duplicate.id }
    });
  }
  const conflict = findMileageConflict(db, {
    vehicleId: input.vehicle_id,
    mileage: input.mileage,
    datetime
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: input.vehicle_id,
        mileage: input.mileage,
        datetime
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: input.vehicle_id,
      mileage: input.mileage,
      datetime
    }));
  }
  if (options.dryRun === true) {
    return {
      record: previewRecord(input, datetime, isFull, fuelLevel, now),
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const stamp = formatNow(now);
  const insert = () => db.query(`INSERT INTO records
           (vehicle_id, record_type, mileage, datetime, note, liters, cost,
            is_full, fuel_level_after, created_at, updated_at)
         VALUES (?, 'refuel', ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`).get(input.vehicle_id, input.mileage, datetime, note, input.liters, input.cost, isFull ? 1 : 0, isFull ? null : fuelLevel, stamp, stamp);
  let record;
  if (options.idempotencyKey !== undefined) {
    const key = options.idempotencyKey;
    const tx = db.transaction(() => {
      const inserted = insert();
      record = inserted;
      storeIdempotencyKey(db, key, inserted.id);
    });
    tx();
  } else {
    record = insert();
  }
  return { record, warnings, replayed: false, dryRun: false };
}
function updateRefuelRecord(db, id, patch, options = {}) {
  const now = options.now ?? defaultNow;
  const existing = assertRecordType(db, id, "refuel");
  const vehicle = assertActiveVehicle(db, existing.vehicle_id);
  const mileage = patch.mileage ?? existing.mileage;
  const liters = patch.liters ?? existing.liters;
  const cost = patch.cost ?? existing.cost;
  if (mileage === null || mileage === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BE5\u52A0\u6CB9\u8BB0\u5F55\u7F3A\u5C11\u91CC\u7A0B\u503C\uFF0C\u65E0\u6CD5\u66F4\u65B0", {
      details: { record_id: id }
    });
  }
  if (liters === null || liters === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BE5\u52A0\u6CB9\u8BB0\u5F55\u7F3A\u5C11\u6CB9\u91CF\uFF0C\u65E0\u6CD5\u66F4\u65B0", {
      details: { record_id: id }
    });
  }
  if (cost === null || cost === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BE5\u52A0\u6CB9\u8BB0\u5F55\u7F3A\u5C11\u91D1\u989D\uFF0C\u65E0\u6CD5\u66F4\u65B0", {
      details: { record_id: id }
    });
  }
  requirePositive("mileage", mileage);
  requirePositive("liters", liters);
  requirePositive("cost", cost);
  const isFull = patch.is_full ?? existing.is_full === 1;
  let fuelLevel;
  if (isFull) {
    if (patch.fuel_level_after !== undefined && patch.fuel_level_after !== null) {
      throw new DomainError("INVALID_ARGUMENT", "\u52A0\u6EE1\u8BB0\u5F55\u4E0D\u80FD\u540C\u65F6\u63D0\u4F9B\u6CB9\u8868\u6BD4\u4F8B (--fuel-level)", { details: { field: "fuel_level_after" } });
    }
    fuelLevel = null;
  } else if (patch.fuel_level_after !== undefined) {
    fuelLevel = patch.fuel_level_after;
  } else {
    fuelLevel = existing.fuel_level_after;
  }
  validateFuelLevel(fuelLevel, vehicle.tank_capacity_l);
  const datetime = patch.datetime !== undefined ? parseDatetime(patch.datetime, now) : existing.datetime;
  const warnings = [];
  const conflict = findMileageConflict(db, {
    vehicleId: existing.vehicle_id,
    mileage,
    datetime,
    excludeId: id
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: existing.vehicle_id,
        mileage,
        datetime,
        excludeId: id
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: existing.vehicle_id,
      mileage,
      datetime,
      excludeId: id
    }));
  }
  if (options.dryRun === true) {
    return {
      record: {
        ...existing,
        mileage,
        liters,
        cost,
        datetime,
        is_full: isFull ? 1 : 0,
        fuel_level_after: fuelLevel,
        note: patch.note !== undefined ? patch.note : existing.note,
        updated_at: formatNow(now)
      },
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const recordPatch = {
    mileage,
    liters,
    cost,
    datetime,
    is_full: isFull,
    fuel_level_after: fuelLevel
  };
  if (patch.note !== undefined)
    recordPatch.note = patch.note;
  const record = updateRecord(db, id, recordPatch, now);
  return { record, warnings, replayed: false, dryRun: false };
}
function deleteRefuelRecord(db, id, now = defaultNow) {
  return softDeleteRecord(db, id, "refuel", now);
}
function listRefuelRecords(db, vehicleId, options = {}) {
  return listRecords(db, {
    vehicleId,
    recordType: "refuel",
    ...options
  });
}
function computeVehicleFuelSummary(db, vehicleId, options = {}) {
  const records = listRefuelRecords(db, vehicleId, { order: "asc" });
  return computeFuelSummary(records, options);
}

// src/models.ts
var EXPENSE_CATEGORY_CODES = [
  "insurance",
  "parking",
  "toll",
  "wash",
  "repair",
  "tax",
  "fine",
  "other"
];
var EXPENSE_CATEGORY_LABELS = {
  insurance: "\u4FDD\u9669",
  parking: "\u505C\u8F66",
  toll: "\u8DEF\u6865",
  wash: "\u6D17\u8F66",
  repair: "\u76EE\u5F55\u5916\u7EF4\u4FEE",
  tax: "\u7A0E\u8D39",
  fine: "\u7F5A\u6B3E",
  other: "\u5176\u4ED6"
};

// src/stats.ts
function warning2(code, message, details) {
  return details === undefined ? { code, message } : { code, message, details };
}
function pad22(value) {
  return value.toString().padStart(2, "0");
}
function daysInMonth2(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function dateOf2(datetime) {
  return datetime.slice(0, 10);
}
function calendarDays(from, to) {
  const fromMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from);
  const toMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(to);
  if (!fromMatch || !toMatch) {
    throw new DomainError("INVALID_ARGUMENT", `\u65E0\u6548\u7684\u65E5\u671F\u300C${from} / ${to}\u300D`, {
      details: { from, to }
    });
  }
  const fromMs = Date.UTC(Number(fromMatch[1]), Number(fromMatch[2]) - 1, Number(fromMatch[3]));
  const toMs = Date.UTC(Number(toMatch[1]), Number(toMatch[2]) - 1, Number(toMatch[3]));
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}
function normalizeBound(flag, raw, endOfDay) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    throw new DomainError("INVALID_ARGUMENT", `\u53C2\u6570 --${flag} \u65E0\u6548\uFF1A\u300C${raw}\u300D\uFF0C\u8BF7\u4F7F\u7528 YYYY-MM-DD \u6216 YYYY-MM-DD HH:MM[:SS]`, { details: { flag, value: raw } });
  }
  return `${match[1]} ${match[2]}:${match[3]}:${match[4] ?? "00"}`;
}
function resolvePeriod(options = {}) {
  const hasRange = options.from !== undefined || options.to !== undefined;
  const hasCalendar = options.year !== undefined || options.month !== undefined;
  if (hasRange && hasCalendar) {
    throw new DomainError("INVALID_ARGUMENT", "\u4E0D\u80FD\u540C\u65F6\u4F7F\u7528 --from/--to \u548C --year/--month", { details: { from: options.from ?? null, to: options.to ?? null, year: options.year ?? null, month: options.month ?? null } });
  }
  if (options.month !== undefined && options.year === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u4F7F\u7528 --month \u65F6\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B --year", {
      details: { field: "month", value: options.month }
    });
  }
  if (options.year !== undefined && (!Number.isInteger(options.year) || options.year < 1970 || options.year > 9999)) {
    throw new DomainError("INVALID_ARGUMENT", `\u5E74\u4EFD\u65E0\u6548\uFF1A${options.year}`, {
      details: { field: "year", value: options.year }
    });
  }
  if (options.month !== undefined && (!Number.isInteger(options.month) || options.month < 1 || options.month > 12)) {
    throw new DomainError("INVALID_ARGUMENT", `\u6708\u4EFD\u65E0\u6548\uFF1A${options.month}`, {
      details: { field: "month", value: options.month }
    });
  }
  if (options.year !== undefined) {
    const year = options.year;
    if (options.month !== undefined) {
      const month = options.month;
      const lastDay = daysInMonth2(year, month);
      return {
        from: `${year}-${pad22(month)}-01 00:00:00`,
        to: `${year}-${pad22(month)}-${pad22(lastDay)} 23:59:59`,
        year,
        month
      };
    }
    return {
      from: `${year}-01-01 00:00:00`,
      to: `${year}-12-31 23:59:59`,
      year,
      month: null
    };
  }
  const from = options.from === undefined ? null : normalizeBound("from", options.from, false);
  const to = options.to === undefined ? null : normalizeBound("to", options.to, true);
  if (from !== null && to !== null && from > to) {
    throw new DomainError("INVALID_ARGUMENT", `--from (${from}) \u4E0D\u80FD\u665A\u4E8E --to (${to})`, {
      details: { from, to }
    });
  }
  return { from, to, year: null, month: null };
}
function getCurrentMileageInfo(db, vehicleId) {
  const row = db.query(`SELECT mileage, datetime FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
       ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId);
  if (row) {
    return {
      current_mileage: row.mileage,
      current_mileage_datetime: row.datetime,
      source: "record"
    };
  }
  const vehicle = db.query("SELECT initial_mileage, initial_datetime FROM vehicles WHERE id = ? AND deleted = 0").get(vehicleId);
  if (vehicle && vehicle.initial_mileage !== null) {
    return {
      current_mileage: vehicle.initial_mileage,
      current_mileage_datetime: vehicle.initial_datetime,
      source: "initial_mileage"
    };
  }
  return {
    current_mileage: null,
    current_mileage_datetime: null,
    source: null
  };
}
function getBoundaryReadings(db, vehicleId, period) {
  const base = "SELECT id, datetime, mileage FROM records " + "WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL";
  let start;
  if (period.from === null) {
    start = db.query(`${base} ORDER BY datetime ASC, id ASC LIMIT 1`).get(vehicleId) ?? null;
  } else {
    start = db.query(`${base} AND datetime <= ? ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId, period.from) ?? null;
    if (start === null) {
      start = period.to === null ? db.query(`${base} AND datetime >= ? ORDER BY datetime ASC, id ASC LIMIT 1`).get(vehicleId, period.from) ?? null : db.query(`${base} AND datetime >= ? AND datetime <= ?
                 ORDER BY datetime ASC, id ASC LIMIT 1`).get(vehicleId, period.from, period.to) ?? null;
    }
  }
  const end = period.to === null ? db.query(`${base} ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId) ?? null : db.query(`${base} AND datetime <= ? ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId, period.to) ?? null;
  return { start, end };
}
function getRecordSpan(db, vehicleId) {
  const row = db.query(`SELECT MIN(datetime) AS first, MAX(datetime) AS last FROM (
         SELECT datetime FROM records WHERE vehicle_id = ? AND deleted = 0
         UNION ALL
         SELECT datetime FROM expenses WHERE vehicle_id = ? AND deleted = 0
       )`).get(vehicleId, vehicleId);
  if (!row || row.first === null || row.last === null)
    return null;
  return { first: row.first, last: row.last };
}
function resolveDayCount(period, span) {
  let from;
  let to;
  if (period.from !== null && period.to !== null) {
    from = period.from;
    to = period.to;
  } else if (period.from !== null) {
    from = period.from;
    to = span?.last ?? period.from;
  } else if (period.to !== null) {
    from = span?.first ?? period.to;
    to = period.to;
  } else {
    from = span?.first ?? null;
    to = span?.last ?? null;
  }
  if (from === null || to === null)
    return 1;
  return Math.max(1, calendarDays(dateOf2(from), dateOf2(to)) + 1);
}
function monthCountBetween(from, to) {
  const fromMatch = /^(\d{4})-(\d{2})/.exec(from);
  const toMatch = /^(\d{4})-(\d{2})/.exec(to);
  if (!fromMatch || !toMatch)
    return 1;
  const months = (Number(toMatch[1]) - Number(fromMatch[1])) * 12 + (Number(toMatch[2]) - Number(fromMatch[2])) + 1;
  return Math.max(1, months);
}
function resolveMonthCount(period, span) {
  if (period.from !== null && period.to !== null) {
    return monthCountBetween(period.from, period.to);
  }
  if (period.from !== null) {
    return monthCountBetween(period.from, span?.last ?? period.from);
  }
  if (period.to !== null) {
    return monthCountBetween(span?.first ?? period.to, period.to);
  }
  if (span !== null)
    return monthCountBetween(span.first, span.last);
  return 1;
}
function distanceWarning(check, period, start, end) {
  if (check.reason === "missing") {
    return [
      warning2("DISTANCE_UNKNOWN", "\u7F3A\u5C11\u671F\u95F4\u8D77\u70B9\u6216\u7EC8\u70B9\u91CC\u7A0B\u8BFB\u6570\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u8DDD\u79BB\u548C\u6BCF\u516C\u91CC\u6210\u672C", {
        from: period.from,
        to: period.to,
        start_mileage: start?.mileage ?? null,
        end_mileage: end?.mileage ?? null
      })
    ];
  }
  if (check.reason === "negative") {
    return [
      warning2("DISTANCE_UNKNOWN", `\u7EC8\u70B9\u91CC\u7A0B ${end?.mileage ?? "-"} km \u5C0F\u4E8E\u8D77\u70B9\u91CC\u7A0B ${start?.mileage ?? "-"} km\uFF0C\u8DDD\u79BB\u89C6\u4E3A\u672A\u77E5`, {
        from: period.from,
        to: period.to,
        start_mileage: start?.mileage ?? null,
        end_mileage: end?.mileage ?? null
      })
    ];
  }
  return [];
}
function computeExpenseStats(db, vehicleId, options = {}) {
  const groupBy = options.groupBy ?? "category";
  if (groupBy !== "category" && groupBy !== "month") {
    throw new DomainError("INVALID_ARGUMENT", `\u672A\u77E5\u7684\u5206\u7EC4\u65B9\u5F0F\u300C${groupBy}\u300D`, {
      details: { allowed: ["category", "month"] }
    });
  }
  const period = resolvePeriod(options);
  const vehicle = assertActiveVehicle(db, vehicleId);
  const recordConditions = [
    "vehicle_id = ?",
    "deleted = 0",
    "record_type IN ('refuel', 'maintenance')"
  ];
  const recordParams = [vehicleId];
  if (period.from !== null) {
    recordConditions.push("datetime >= ?");
    recordParams.push(period.from);
  }
  if (period.to !== null) {
    recordConditions.push("datetime <= ?");
    recordParams.push(period.to);
  }
  const records = db.query(`SELECT id, record_type, datetime, cost FROM records
       WHERE ${recordConditions.join(" AND ")}
       ORDER BY datetime ASC, id ASC`).all(...recordParams);
  const expenseConditions = ["vehicle_id = ?", "deleted = 0"];
  const expenseParams = [vehicleId];
  if (period.from !== null) {
    expenseConditions.push("datetime >= ?");
    expenseParams.push(period.from);
  }
  if (period.to !== null) {
    expenseConditions.push("datetime <= ?");
    expenseParams.push(period.to);
  }
  const expenses = db.query(`SELECT id, category, amount, datetime FROM expenses
       WHERE ${expenseConditions.join(" AND ")}
       ORDER BY datetime ASC, id ASC`).all(...expenseParams);
  const warnings = [];
  let fuel = 0;
  let maintenance = 0;
  let other = 0;
  const monthMap = new Map;
  const monthRow = (month) => {
    let row = monthMap.get(month);
    if (!row) {
      row = { month, fuel: 0, maintenance: 0, other: 0, total: 0 };
      monthMap.set(month, row);
    }
    return row;
  };
  for (const record of records) {
    const cost = record.cost ?? 0;
    if (record.cost === null) {
      const label = record.record_type === "refuel" ? "\u52A0\u6CB9" : "\u4FDD\u517B";
      warnings.push(warning2("MISSING_COST", `${label}\u8BB0\u5F55 (ID: ${record.id}) \u7F3A\u5C11\u91D1\u989D\uFF0C\u6309 0 \u5143\u8BA1\u5165`, { record_id: record.id, record_type: record.record_type }));
    }
    const row = monthRow(record.datetime.slice(0, 7));
    if (record.record_type === "refuel") {
      fuel += cost;
      row.fuel += cost;
    } else {
      maintenance += cost;
      row.maintenance += cost;
    }
    row.total += cost;
  }
  const otherByCategory = new Map;
  for (const expense of expenses) {
    other += expense.amount;
    otherByCategory.set(expense.category, (otherByCategory.get(expense.category) ?? 0) + expense.amount);
    const row = monthRow(expense.datetime.slice(0, 7));
    row.other += expense.amount;
    row.total += expense.amount;
  }
  const byMonth = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));
  const byCategory = [
    { category: "fuel", label: "\u71C3\u6CB9", amount: fuel },
    { category: "maintenance", label: "\u4FDD\u517B", amount: maintenance },
    ...EXPENSE_CATEGORY_CODES.map((code) => ({
      category: code,
      label: EXPENSE_CATEGORY_LABELS[code],
      amount: otherByCategory.get(code) ?? 0
    }))
  ];
  const { start, end } = getBoundaryReadings(db, vehicleId, period);
  let distance = null;
  if (start === null || end === null) {
    warnings.push(...distanceWarning({ distance: null, reason: "missing" }, period, start, end));
  } else {
    const candidate = end.mileage - start.mileage;
    if (candidate < 0) {
      warnings.push(...distanceWarning({ distance: null, reason: "negative" }, period, start, end));
    } else if (candidate === 0) {
      distance = 0;
      warnings.push(warning2("DISTANCE_ZERO", "\u671F\u95F4\u8D77\u6B62\u91CC\u7A0B\u76F8\u540C\uFF0C\u8DDD\u79BB\u4E3A 0\uFF1B\u6BCF\u516C\u91CC\u6210\u672C\u65E0\u6CD5\u8BA1\u7B97", {
        from: period.from,
        to: period.to,
        start_mileage: start.mileage,
        end_mileage: end.mileage
      }));
    } else {
      distance = candidate;
    }
  }
  const fuelEngine = computeVehicleFuelSummary(db, vehicleId, {
    currentMileage: getCurrentMileage(db, vehicleId),
    tankCapacityL: vehicle.tank_capacity_l,
    from: period.from ?? undefined,
    to: period.to ?? undefined
  });
  const total = fuel + maintenance + other;
  const perKm = (value) => distance !== null && distance > 0 ? value / distance : null;
  const span = getRecordSpan(db, vehicleId);
  const days = resolveDayCount(period, span);
  const totals = {
    fuel,
    maintenance,
    other,
    total,
    distance,
    start_mileage: start?.mileage ?? null,
    end_mileage: end?.mileage ?? null,
    cost_per_km: perKm(total),
    total_cost_per_km: perKm(total),
    fuel_spent_per_km: perKm(fuel),
    fuel_consumption_cost: fuelEngine.overall?.cost ?? null,
    fuel_consumption_cost_per_km: fuelEngine.overall?.cost_per_km ?? null,
    maintenance_spent_per_km: perKm(maintenance),
    other_spent_per_km: perKm(other),
    daily_average: total / days,
    days
  };
  return {
    period,
    totals,
    by_category: byCategory,
    by_month: byMonth,
    group_by: groupBy,
    groups: groupBy === "month" ? byMonth : byCategory,
    warnings
  };
}
function computeMileageStats(db, vehicleId, options = {}) {
  const groupBy = options.groupBy ?? "month";
  if (groupBy !== "month") {
    throw new DomainError("INVALID_ARGUMENT", `\u672A\u77E5\u7684\u5206\u7EC4\u65B9\u5F0F\u300C${groupBy}\u300D`, {
      details: { allowed: ["month"] }
    });
  }
  const period = resolvePeriod(options);
  assertActiveVehicle(db, vehicleId);
  const conditions = ["vehicle_id = ?", "deleted = 0", "mileage IS NOT NULL"];
  const params = [vehicleId];
  if (period.to !== null) {
    conditions.push("datetime <= ?");
    params.push(period.to);
  }
  const readings = db.query(`SELECT id, datetime, mileage FROM records
       WHERE ${conditions.join(" AND ")}
       ORDER BY datetime ASC, id ASC`).all(...params);
  const warnings = [];
  let startIndex = -1;
  if (readings.length > 0) {
    if (period.from === null) {
      startIndex = 0;
    } else {
      for (let index = 0;index < readings.length; index += 1) {
        if (readings[index].datetime <= period.from)
          startIndex = index;
        else
          break;
      }
    }
  }
  const missing = startIndex < 0 || readings.length === 0;
  const start = missing ? null : readings[startIndex];
  const end = missing ? null : readings[readings.length - 1];
  let distance = null;
  if (start === null || end === null) {
    warnings.push(...distanceWarning({ distance: null, reason: "missing" }, period, start, end));
  } else {
    const candidate = end.mileage - start.mileage;
    if (candidate < 0) {
      warnings.push(...distanceWarning({ distance: null, reason: "negative" }, period, start, end));
    } else {
      distance = candidate;
      if (candidate === 0) {
        warnings.push(warning2("DISTANCE_ZERO", "\u671F\u95F4\u8D77\u6B62\u91CC\u7A0B\u76F8\u540C\uFF0C\u8DDD\u79BB\u4E3A 0", {
          from: period.from,
          to: period.to,
          start_mileage: start.mileage,
          end_mileage: end.mileage
        }));
      }
    }
  }
  const byMonthMap = new Map;
  if (startIndex >= 0) {
    for (let index = startIndex + 1;index < readings.length; index += 1) {
      const delta = readings[index].mileage - readings[index - 1].mileage;
      const month = readings[index].datetime.slice(0, 7);
      byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + delta);
    }
  }
  const byMonth = [...byMonthMap.entries()].filter(([, monthDistance]) => monthDistance !== 0).sort(([a], [b]) => a.localeCompare(b)).map(([month, monthDistance]) => {
    const [yearPart, monthPart] = month.split("-");
    const days2 = daysInMonth2(Number(yearPart), Number(monthPart));
    return {
      month,
      distance: monthDistance,
      days: days2,
      daily_average: monthDistance / days2
    };
  });
  const span = readings.length > 0 ? {
    first: readings[0].datetime,
    last: readings[readings.length - 1].datetime
  } : null;
  const days = resolveDayCount(period, span);
  const months = resolveMonthCount(period, span);
  return {
    period,
    distance,
    start_mileage: start?.mileage ?? null,
    end_mileage: end?.mileage ?? null,
    start_datetime: start?.datetime ?? null,
    end_datetime: end?.datetime ?? null,
    days,
    daily_average: distance === null ? null : distance / days,
    monthly_average: distance === null ? null : distance / months,
    by_month: byMonth,
    group_by: "month",
    groups: byMonth,
    warnings
  };
}

// src/summary.ts
function dedupeWarnings(warnings) {
  const seen = new Set;
  const result = [];
  for (const warning3 of warnings) {
    const key = `${warning3.code}:${warning3.message}`;
    if (seen.has(key))
      continue;
    seen.add(key);
    result.push(warning3);
  }
  return result;
}
function lastRefuelSummary(db, vehicleId) {
  const record = listRefuelRecords(db, vehicleId, {
    order: "desc",
    limit: 1
  })[0];
  if (!record)
    return null;
  return {
    record: recordToView(record),
    price_per_liter: record.cost !== null && record.liters !== null && record.liters > 0 ? record.cost / record.liters : null
  };
}
function lastMaintenanceSummary(db, vehicleId) {
  const record = listRecords(db, {
    vehicleId,
    recordType: "maintenance",
    order: "desc",
    limit: 1
  })[0];
  if (!record)
    return null;
  return {
    record: recordToView(record),
    items: getMaintenanceRecordItems(db, record.id).map((item) => ({
      code: item.code,
      name: item.name
    }))
  };
}
function computeVehicleSummary(db, vehicleId, options = {}) {
  const vehicle = getVehicleById(db, vehicleId);
  if (!vehicle) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u8F66\u8F86\u4E0D\u5B58\u5728 (ID: ${vehicleId})`, {
      details: { vehicle_id: vehicleId }
    });
  }
  const period = resolvePeriod(options);
  const currentMileage = getCurrentMileageInfo(db, vehicleId);
  const fuelEngine = computeVehicleFuelSummary(db, vehicleId, {
    currentMileage: currentMileage.current_mileage,
    tankCapacityL: vehicle.tank_capacity_l,
    from: period.from ?? undefined,
    to: period.to ?? undefined
  });
  const stats = computeExpenseStats(db, vehicleId, {
    from: period.from ?? undefined,
    to: period.to ?? undefined
  });
  const fuel = {
    latest_segment: fuelEngine.latest_segment,
    overall: fuelEngine.overall,
    pending: fuelEngine.pending,
    unmeasured_partials: fuelEngine.unmeasured_partials,
    confidence: fuelEngine.confidence,
    warnings: fuelEngine.warnings
  };
  const reminders = getVehicleReminders(db, vehicleId, {
    now: options.now,
    today: options.today
  });
  return {
    vehicle: vehicleToView(db, vehicle),
    current_mileage_datetime: currentMileage.current_mileage_datetime,
    last_refuel: lastRefuelSummary(db, vehicleId),
    last_maintenance: lastMaintenanceSummary(db, vehicleId),
    fuel,
    reminders,
    period,
    totals: stats.totals,
    warnings: dedupeWarnings([...stats.warnings, ...fuelEngine.warnings])
  };
}

// src/cli/commands/summary.ts
var STATUS_LABELS = {
  overdue: "\u5DF2\u903E\u671F",
  due_soon: "\u5373\u5C06\u5230\u671F",
  ok: "\u6B63\u5E38",
  unknown: "\u672A\u77E5"
};
function parseDateBound(flag, raw, endOfDay) {
  if (raw === undefined)
    return;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 23:59:59`;
  }
  return raw;
}
function periodText(summary) {
  const { period } = summary;
  if (period.year !== null && period.month !== null) {
    return `${period.year}\u5E74${period.month}\u6708`;
  }
  if (period.year !== null)
    return `${period.year}\u5E74`;
  if (period.from !== null || period.to !== null) {
    return `${period.from ?? "\u6700\u65E9"} ~ ${period.to ?? "\u81F3\u4ECA"}`;
  }
  return "\u5168\u90E8\u65F6\u95F4";
}
function renderReminder(ctx, reminder) {
  const details = [];
  if (reminder.remaining_km !== null) {
    details.push(`${reminder.remaining_km.toLocaleString("zh-CN")} km`);
  }
  if (reminder.remaining_days !== null) {
    details.push(`${reminder.remaining_days} \u5929`);
  }
  writeLine(ctx, `  ${reminder.name} (${reminder.item}): ${STATUS_LABELS[reminder.status]}` + (details.length > 0 ? `\uFF0C\u5269\u4F59 ${details.join(" / ")}` : ""));
}
function renderSummaryHuman(ctx, summary) {
  for (const warning3 of summary.warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
  writeLine(ctx, `\u8F66\u8F86: ${summary.vehicle.name} (ID: ${summary.vehicle.id})`);
  writeLine(ctx, `\u8F66\u724C: ${summary.vehicle.plate ?? "-"}`);
  writeLine(ctx, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(summary.vehicle.current_mileage)}` + (summary.current_mileage_datetime ? ` (${summary.current_mileage_datetime})` : ""));
  if (summary.last_refuel) {
    const refuel = summary.last_refuel;
    const price = refuel.price_per_liter;
    writeLine(ctx, `\u4E0A\u6B21\u52A0\u6CB9: ${refuel.record.datetime}\uFF0C` + `${refuel.record.mileage?.toLocaleString("zh-CN") ?? "-"} km\uFF0C` + `${refuel.record.liters ?? "-"} L / ${formatCurrency(refuel.record.cost ?? 0)}` + (price !== null ? `\uFF08${price.toFixed(2)} \u5143/L\uFF09` : ""));
  } else {
    writeLine(ctx, "\u4E0A\u6B21\u52A0\u6CB9: \u6682\u65E0\u52A0\u6CB9\u8BB0\u5F55");
  }
  if (summary.last_maintenance) {
    const maintenance = summary.last_maintenance;
    const items = maintenance.items.length > 0 ? maintenance.items.map((item) => item.name).join("\u3001") : "\u672A\u5173\u8054\u9879\u76EE";
    writeLine(ctx, `\u4E0A\u6B21\u4FDD\u517B: ${maintenance.record.datetime}\uFF0C` + `${maintenance.record.mileage?.toLocaleString("zh-CN") ?? "-"} km\uFF0C` + `\u9879\u76EE: ${items}\uFF0C\u8D39\u7528 ${formatCurrency(maintenance.record.cost ?? 0)}`);
  } else {
    writeLine(ctx, "\u4E0A\u6B21\u4FDD\u517B: \u6682\u65E0\u4FDD\u517B\u8BB0\u5F55");
  }
  if (summary.fuel.latest_segment) {
    const latest = summary.fuel.latest_segment;
    writeLine(ctx, `\u6700\u8FD1\u4E00\u6BB5\u6CB9\u8017: ${latest.l_per_100km.toFixed(2)} L/100km\uFF0C` + `${latest.cost_per_km.toFixed(3)} \u5143/km`);
  } else {
    writeLine(ctx, "\u6700\u8FD1\u4E00\u6BB5\u6CB9\u8017: \u6682\u65E0\u5DF2\u95ED\u5408\u5206\u6BB5");
  }
  if (summary.fuel.overall) {
    const overall = summary.fuel.overall;
    writeLine(ctx, `\u7EFC\u5408\u5E73\u5747: ${overall.l_per_100km.toFixed(2)} L/100km\uFF0C` + `${overall.cost_per_km.toFixed(3)} \u5143/km\uFF08\u7F6E\u4FE1\u5EA6 ${summary.fuel.confidence}\uFF09`);
  }
  if (summary.fuel.pending) {
    const pending = summary.fuel.pending;
    const lower = pending.lower_bound === null ? "\u4E0B\u9650\u4E0D\u53EF\u7528" : `\u81F3\u5C11 ${pending.lower_bound.l_per_100km.toFixed(2)} L/100km`;
    writeLine(ctx, `\u672A\u52A0\u6EE1\u7B49\u5F85\u7ED3\u7B97: ${pending.distance.toLocaleString("zh-CN")} km\uFF0C` + `\u7D2F\u8BA1 ${pending.liters.toFixed(2)} L\uFF0C${lower}`);
  }
  const urgent = summary.reminders.filter((reminder) => reminder.status === "overdue" || reminder.status === "due_soon");
  if (urgent.length > 0) {
    writeLine(ctx, "\u9700\u8981\u5173\u6CE8\u7684\u63D0\u9192:");
    for (const reminder of urgent)
      renderReminder(ctx, reminder);
  }
  const totals = summary.totals;
  writeLine(ctx, `\u8D39\u7528 (${periodText(summary)}):`);
  writeLine(ctx, `  \u603B\u8BA1 ${formatCurrency(totals.total)}` + `\uFF08\u71C3\u6CB9 ${formatCurrency(totals.fuel)} / \u4FDD\u517B ${formatCurrency(totals.maintenance)} / \u5176\u4ED6 ${formatCurrency(totals.other)}\uFF09`);
  if (totals.distance === null) {
    writeLine(ctx, "  \u8DDD\u79BB\u672A\u77E5\uFF0C\u6BCF\u516C\u91CC\u6210\u672C\u4E0D\u53EF\u7528");
  } else if (totals.distance === 0) {
    writeLine(ctx, "  \u8DDD\u79BB 0 km\uFF0C\u6BCF\u516C\u91CC\u6210\u672C\u4E0D\u53EF\u7528");
  } else {
    writeLine(ctx, `  \u8DDD\u79BB ${totals.distance.toLocaleString("zh-CN")} km\uFF1B` + `\u7EFC\u5408\u6210\u672C/\u516C\u91CC ${totals.total_cost_per_km?.toFixed(3)} \u5143\uFF1B` + `\u71C3\u6CB9\u73B0\u91D1/\u516C\u91CC ${totals.fuel_spent_per_km?.toFixed(3)} \u5143\uFF1B` + `\u71C3\u6CB9\u6D88\u8017\u6210\u672C/\u516C\u91CC ${totals.fuel_consumption_cost_per_km?.toFixed(3)} \u5143`);
    if (totals.daily_average !== null) {
      writeLine(ctx, `  \u65E5\u5747 ${formatCurrency(totals.daily_average)}` + (totals.days !== null ? `\uFF08${totals.days} \u5929\uFF09` : ""));
    }
  }
}
var summary = {
  path: ["summary"],
  summary: "\u4E00\u6B21\u8FD4\u56DE\u8F66\u8F86\u6982\u89C8\u3001\u4E0A\u6B21\u52A0\u6CB9/\u4FDD\u517B\u3001\u6CB9\u8017\u3001\u63D0\u9192\u548C\u671F\u95F4\u8D39\u7528",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D39\u7528/\u6CB9\u8017\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u8D39\u7528/\u6CB9\u8017\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" }
  ],
  examples: ["carlog summary --car \u601D\u57DF", "carlog summary --json"],
  outputFields: [
    "data.vehicle",
    "data.current_mileage_datetime",
    "data.last_refuel",
    "data.last_maintenance",
    "data.fuel",
    "data.reminders",
    "data.period",
    "data.totals",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const data = computeVehicleSummary(db, vehicle.id, {
      from: parseDateBound("from", getStringFlag(inv, "from"), false),
      to: parseDateBound("to", getStringFlag(inv, "to"), true),
      now: ctx.now
    });
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderSummaryHuman(target, value);
    });
  }
};
var summaryCommands = [summary];

// src/cli/commands/car.ts
function requirePositional(name, raw) {
  if (raw === undefined || raw.trim() === "") {
    throw new AppError("INVALID_ARGUMENT", `\u7F3A\u5C11\u4F4D\u7F6E\u53C2\u6570 <${name}>`, {
      details: { positional: name }
    });
  }
  return raw;
}
function renderVehicleLine(ctx, view) {
  writeLine(ctx, `\u8F66\u8F86: ${view.name} (ID: ${view.id})`);
  writeLine(ctx, `\u8F66\u724C: ${view.plate ?? "-"}`);
  writeLine(ctx, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(view.current_mileage)}`);
  if (view.tank_capacity_l !== null) {
    writeLine(ctx, `\u6CB9\u7BB1\u5BB9\u91CF: ${view.tank_capacity_l} L`);
  }
  if (view.initial_mileage !== null) {
    writeLine(ctx, `\u521D\u59CB\u91CC\u7A0B: ${formatMileage(view.initial_mileage)}${view.initial_datetime ? ` (${view.initial_datetime})` : ""}`);
  }
}
var add = {
  path: ["car", "add"],
  summary: "\u6DFB\u52A0\u8F66\u8F86",
  flags: [
    { name: "name", valueName: "NAME", required: true, description: "\u8F66\u8F86\u540D\u79F0" },
    { name: "plate", valueName: "PLATE", description: "\u8F66\u724C\u53F7" },
    {
      name: "tank-capacity",
      valueName: "L",
      description: "\u6CB9\u7BB1\u5BB9\u91CF\uFF08L\uFF0C\u5FC5\u987B\u5927\u4E8E 0\uFF09"
    },
    {
      name: "initial-mileage",
      valueName: "KM",
      description: "\u521D\u59CB\u91CC\u7A0B\uFF08\u65E0\u8BB0\u5F55\u65F6\u4F5C\u4E3A\u5F53\u524D\u91CC\u7A0B\uFF09"
    },
    {
      name: "initial-date",
      valueName: "DT",
      description: "\u521D\u59CB\u91CC\u7A0B\u5BF9\u5E94\u65E5\u671F"
    }
  ],
  examples: [
    "carlog car add --name \u601D\u57DF --plate \u4EACA12345 --tank-capacity 50 --initial-mileage 10000 --initial-date 2026-01-01"
  ],
  outputFields: ["data.vehicle"],
  errorCodes: ["INVALID_ARGUMENT", "VEHICLE_NAME_EXISTS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const name = requireStringFlag("name", getStringFlag(inv, "name"));
    const plate = getStringFlag(inv, "plate");
    const tankCapacity = parseNumberFlag("tank-capacity", getStringFlag(inv, "tank-capacity"), { positive: true });
    const initialMileage = parseNumberFlag("initial-mileage", getStringFlag(inv, "initial-mileage"), { min: 0 });
    const initialDateRaw = getStringFlag(inv, "initial-date");
    if (initialDateRaw !== undefined && initialMileage === undefined) {
      throw new AppError("INVALID_ARGUMENT", "\u8BBE\u7F6E --initial-date \u65F6\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B --initial-mileage", { details: { flag: "initial-date" } });
    }
    const initialDatetime = initialDateRaw !== undefined ? parseDatetimeFlag("initial-date", initialDateRaw, ctx.now) : undefined;
    const vehicle = addVehicle(db, name, plate, {
      tankCapacity,
      initialMileage,
      initialDatetime,
      now: ctx.now
    });
    const view = vehicleToView(db, vehicle);
    emitSuccess(ctx, inv.globals.json, { vehicle: view }, (target, data) => {
      writeLine(target, `\u8F66\u8F86\u5DF2\u6DFB\u52A0: ${data.vehicle.name}${data.vehicle.plate ? ` (${data.vehicle.plate})` : ""} (ID: ${data.vehicle.id})`);
      writeLine(target, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(data.vehicle.current_mileage)}`);
    });
  }
};
var list = {
  path: ["car", "list"],
  summary: "\u5217\u51FA\u5728\u7528\u8F66\u8F86\u53CA\u903E\u671F/\u5373\u5C06\u5230\u671F\u63D0\u9192\u6570\u91CF",
  examples: ["carlog car list"],
  outputFields: [
    "data.vehicles",
    "data.vehicles[].overdue_count",
    "data.vehicles[].due_soon_count",
    "data.count"
  ],
  errorCodes: ["INTERNAL_ERROR"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicles = listVehicles(db).map((vehicle) => {
      const view = vehicleToView(db, vehicle);
      const counts = countReminderStatuses(getVehicleReminders(db, vehicle.id, { now: ctx.now }));
      return {
        ...view,
        overdue_count: counts.overdue,
        due_soon_count: counts.due_soon
      };
    });
    emitSuccess(ctx, inv.globals.json, { vehicles, count: vehicles.length }, (target, data) => {
      if (data.vehicles.length === 0) {
        writeLine(target, "\u6682\u65E0\u8F66\u8F86\u8BB0\u5F55");
        return;
      }
      writeLine(target, table(["ID", "\u540D\u79F0", "\u8F66\u724C", "\u5F53\u524D\u91CC\u7A0B", "\u903E\u671F", "\u5373\u5C06\u5230\u671F", "\u521B\u5EFA\u65F6\u95F4"], data.vehicles.map((vehicle) => [
        vehicle.id,
        vehicle.name,
        vehicle.plate ?? "-",
        formatMileage(vehicle.current_mileage),
        vehicle.overdue_count,
        vehicle.due_soon_count,
        vehicle.created_at
      ])));
    });
  }
};
var show = {
  path: ["car", "show"],
  summary: "\u67E5\u770B\u8F66\u8F86\u6982\u89C8\uFF08\u4E0E summary \u76F8\u540C\u7684\u8F66\u8F86\u89C6\u56FE\uFF09",
  positionals: [
    { name: "car", required: true, description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" }
  ],
  examples: ["carlog car show \u601D\u57DF", "carlog car show \u601D\u57DF --json"],
  outputFields: [
    "data.vehicle",
    "data.current_mileage_datetime",
    "data.last_refuel",
    "data.last_maintenance",
    "data.fuel",
    "data.reminders",
    "data.period",
    "data.totals",
    "data.warnings"
  ],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const car = requirePositional("car", inv.positionals[0]);
    const vehicle = resolveVehicle(db, car);
    const data = computeVehicleSummary(db, vehicle.id, { now: ctx.now });
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderSummaryHuman(target, value);
    });
  }
};
var update = {
  path: ["car", "update"],
  summary: "\u66F4\u65B0\u8F66\u8F86\u4FE1\u606F",
  positionals: [
    { name: "car", required: true, description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" }
  ],
  flags: [
    { name: "name", valueName: "NAME", description: "\u65B0\u540D\u79F0" },
    { name: "plate", valueName: "PLATE", description: "\u65B0\u8F66\u724C" },
    {
      name: "tank-capacity",
      valueName: "L",
      description: "\u6CB9\u7BB1\u5BB9\u91CF\uFF08L\uFF0C\u5FC5\u987B\u5927\u4E8E 0\uFF09"
    },
    { name: "initial-mileage", valueName: "KM", description: "\u521D\u59CB\u91CC\u7A0B" },
    { name: "initial-date", valueName: "DT", description: "\u521D\u59CB\u91CC\u7A0B\u65E5\u671F" }
  ],
  examples: ["carlog car update \u601D\u57DF --plate \u4EACB99999"],
  outputFields: ["data.vehicle"],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "VEHICLE_NAME_EXISTS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const car = requirePositional("car", inv.positionals[0]);
    const vehicle = resolveVehicle(db, car);
    const name = getStringFlag(inv, "name");
    const plateRaw = getStringFlag(inv, "plate");
    const tankCapacity = parseNumberFlag("tank-capacity", getStringFlag(inv, "tank-capacity"), { positive: true });
    const initialMileage = parseNumberFlag("initial-mileage", getStringFlag(inv, "initial-mileage"), { min: 0 });
    const initialDateRaw = getStringFlag(inv, "initial-date");
    const initialDatetime = initialDateRaw !== undefined ? parseDatetimeFlag("initial-date", initialDateRaw, ctx.now) : undefined;
    const patch = {};
    if (name !== undefined)
      patch.name = name;
    if (plateRaw !== undefined)
      patch.plate = plateRaw;
    if (tankCapacity !== undefined)
      patch.tankCapacity = tankCapacity;
    if (initialMileage !== undefined)
      patch.initialMileage = initialMileage;
    if (initialDatetime !== undefined)
      patch.initialDatetime = initialDatetime;
    const updated = updateVehicle(db, vehicle.id, patch, ctx.now);
    const view = vehicleToView(db, updated);
    emitSuccess(ctx, inv.globals.json, { vehicle: view }, (target, data) => {
      writeLine(target, `\u8F66\u8F86\u5DF2\u66F4\u65B0: ${data.vehicle.name} (ID: ${data.vehicle.id})`);
      renderVehicleLine(target, data.vehicle);
    });
  }
};
var remove = {
  path: ["car", "delete"],
  summary: "\u5220\u9664\u8F66\u8F86\u53CA\u5176\u8BB0\u5F55\uFF08\u9700\u8981 --yes\uFF09",
  positionals: [
    { name: "car", required: true, description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" }
  ],
  flags: [
    { name: "yes", boolean: true, description: "\u786E\u8BA4\u5220\u9664\u8F66\u8F86\u53CA\u5176\u8BB0\u5F55" }
  ],
  examples: ["carlog car delete \u601D\u57DF --yes"],
  outputFields: ["data.vehicle", "data.affected"],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const car = requirePositional("car", inv.positionals[0]);
    const vehicle = resolveVehicle(db, car);
    const view = vehicleToView(db, vehicle);
    const result = deleteVehicle(db, vehicle.id, {
      yes: getBooleanFlag(inv, "yes"),
      now: ctx.now
    });
    emitSuccess(ctx, inv.globals.json, { vehicle: view, affected: result.affected }, (target, data) => {
      writeLine(target, `\u8F66\u8F86\u5DF2\u5220\u9664: ${data.vehicle.name} (ID: ${data.vehicle.id})\uFF0C` + `\u8BB0\u5F55 ${data.affected.records} \u6761\uFF0C\u6742\u8D39 ${data.affected.expenses} \u6761\uFF0C` + `\u4FDD\u517B\u89C4\u5219 ${data.affected.maintenance_rules} \u6761`);
    });
  }
};
var carCommands = [
  add,
  list,
  show,
  update,
  remove
];

// src/mileage.ts
function defaultNow2() {
  return new Date;
}
function duplicateError2(record) {
  return new DomainError("DUPLICATE_RECORD", `\u68C0\u6D4B\u5230\u91CD\u590D\u7684\u91CC\u7A0B\u8BB0\u5F55 (ID: ${record.id}, ${record.datetime}, ${record.mileage} km)\uFF1B\u786E\u8BA4\u4E0D\u662F\u91CD\u590D\u63D0\u4EA4\u540E\u52A0 --force`, {
    details: {
      record_id: record.id,
      record_type: record.record_type,
      datetime: record.datetime,
      mileage: record.mileage
    }
  });
}
function previewRecord2(vehicleId, mileage, datetime, note, now) {
  const stamp = formatNow(now);
  return {
    id: 0,
    vehicle_id: vehicleId,
    record_type: "mileage",
    datetime,
    mileage,
    liters: null,
    cost: null,
    is_full: 1,
    fuel_level_after: null,
    note,
    deleted: 0,
    created_at: stamp,
    updated_at: stamp
  };
}
function createMileageRecord(db, input, options = {}) {
  const now = options.now ?? defaultNow2;
  assertActiveVehicle(db, input.vehicle_id);
  requirePositive("mileage", input.mileage);
  const datetimeProvided = options.datetimeProvided ?? (input.datetime !== undefined && input.datetime.trim() !== "");
  const datetime = parseDatetime(input.datetime, now);
  const note = input.note ?? null;
  if (options.idempotencyKey !== undefined) {
    const replay = findIdempotencyRecord(db, options.idempotencyKey);
    if (replay) {
      return {
        record: replay,
        warnings: [
          {
            code: "IDEMPOTENT_REPLAY",
            message: `idempotency-key \u5DF2\u5904\u7406\u8FC7\uFF0C\u8FD4\u56DE\u5DF2\u6709\u8BB0\u5F55 (ID: ${replay.id})`
          }
        ],
        replayed: true,
        dryRun: options.dryRun === true
      };
    }
  }
  const warnings = [];
  const duplicate = findDuplicateRecord(db, {
    vehicleId: input.vehicle_id,
    recordType: "mileage",
    datetime,
    datetimeProvided,
    mileage: input.mileage
  });
  if (duplicate) {
    if (options.force !== true)
      throw duplicateError2(duplicate);
    warnings.push({
      code: "DUPLICATE_RECORD_FORCED",
      message: `\u5DF2\u7528 --force \u5199\u5165\u7591\u4F3C\u91CD\u590D\u8BB0\u5F55 (\u539F\u8BB0\u5F55 ID: ${duplicate.id})`,
      details: { duplicate_record_id: duplicate.id }
    });
  }
  const conflict = findMileageConflict(db, {
    vehicleId: input.vehicle_id,
    mileage: input.mileage,
    datetime
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: input.vehicle_id,
        mileage: input.mileage,
        datetime
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: input.vehicle_id,
      mileage: input.mileage,
      datetime
    }));
  }
  if (options.dryRun === true) {
    return {
      record: previewRecord2(input.vehicle_id, input.mileage, datetime, note, now),
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const stamp = formatNow(now);
  const insert = () => db.query(`INSERT INTO records
           (vehicle_id, record_type, mileage, datetime, note, created_at, updated_at)
         VALUES (?, 'mileage', ?, ?, ?, ?, ?)
         RETURNING *`).get(input.vehicle_id, input.mileage, datetime, note, stamp, stamp);
  let record;
  if (options.idempotencyKey !== undefined) {
    const key = options.idempotencyKey;
    const tx = db.transaction(() => {
      const inserted = insert();
      record = inserted;
      storeIdempotencyKey(db, key, inserted.id);
    });
    tx();
  } else {
    record = insert();
  }
  return {
    record,
    warnings,
    replayed: false,
    dryRun: false
  };
}
function updateMileageRecord(db, id, patch, options = {}) {
  const now = options.now ?? defaultNow2;
  const existing = assertRecordType(db, id, "mileage");
  const mileage = patch.mileage ?? existing.mileage;
  if (mileage === null || mileage === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BE5\u91CC\u7A0B\u8BB0\u5F55\u7F3A\u5C11\u91CC\u7A0B\u503C\uFF0C\u65E0\u6CD5\u66F4\u65B0", {
      details: { record_id: id }
    });
  }
  requirePositive("mileage", mileage);
  const datetime = patch.datetime !== undefined ? parseDatetime(patch.datetime, now) : existing.datetime;
  const warnings = [];
  const conflict = findMileageConflict(db, {
    vehicleId: existing.vehicle_id,
    mileage,
    datetime,
    excludeId: id
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: existing.vehicle_id,
        mileage,
        datetime,
        excludeId: id
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: existing.vehicle_id,
      mileage,
      datetime,
      excludeId: id
    }));
  }
  if (options.dryRun === true) {
    return {
      record: {
        ...existing,
        mileage,
        datetime,
        note: patch.note !== undefined ? patch.note : existing.note,
        updated_at: formatNow(now)
      },
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const recordPatch = { mileage, datetime };
  if (patch.note !== undefined)
    recordPatch.note = patch.note;
  const record = updateRecord(db, id, recordPatch, now);
  return { record, warnings, replayed: false, dryRun: false };
}
function deleteMileageRecord(db, id, now = defaultNow2) {
  return softDeleteRecord(db, id, "mileage", now);
}
function listMileageRecords(db, vehicleId, options = {}) {
  return listRecords(db, {
    vehicleId,
    recordType: "mileage",
    ...options
  });
}

// src/cli/commands/mileage.ts
var STATUS_LABELS2 = {
  overdue: "\u5DF2\u903E\u671F",
  due_soon: "\u5373\u5C06\u5230\u671F",
  ok: "\u6B63\u5E38",
  unknown: "\u672A\u77E5"
};
function renderUrgentReminders(ctx, reminders) {
  for (const reminder of reminders) {
    if (reminder.status !== "overdue" && reminder.status !== "due_soon")
      continue;
    const remaining = [];
    if (reminder.remaining_km !== null) {
      remaining.push(`${reminder.remaining_km.toLocaleString("zh-CN")} km`);
    }
    if (reminder.remaining_days !== null) {
      remaining.push(`${reminder.remaining_days} \u5929`);
    }
    writeLine(ctx, `\u63D0\u9192: ${reminder.name} (${reminder.item}) ${STATUS_LABELS2[reminder.status]}` + (remaining.length > 0 ? `\uFF0C\u5269\u4F59 ${remaining.join(" / ")}` : ""));
  }
}
function renderWarnings(ctx, json, warnings) {
  if (json)
    return;
  for (const warning3 of warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
}
function parseDateBound2(flag, raw, endOfDay, now) {
  if (raw === undefined)
    return;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 23:59:59`;
  }
  return parseDatetimeFlag(flag, raw, now);
}
function parseListOptions(inv, ctx) {
  return {
    from: parseDateBound2("from", getStringFlag(inv, "from"), false, ctx.now),
    to: parseDateBound2("to", getStringFlag(inv, "to"), true, ctx.now),
    limit: parseNumberFlag("limit", getStringFlag(inv, "limit"), {
      integer: true,
      positive: true
    }),
    order: parseEnumFlag("order", getStringFlag(inv, "order"), ["asc", "desc"]) ?? "desc"
  };
}
var add2 = {
  path: ["mileage", "add"],
  summary: "\u6DFB\u52A0\u91CC\u7A0B\u8BB0\u5F55",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "mileage",
      valueName: "KM",
      required: true,
      description: "\u5F53\u524D\u91CC\u7A0B\uFF08km\uFF09"
    },
    { name: "datetime", valueName: "DT", description: "\u8BB0\u5F55\u65F6\u95F4\uFF0C\u9ED8\u8BA4\u5F53\u524D\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u91CD\u590D\u548C\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" },
    {
      name: "idempotency-key",
      valueName: "KEY",
      description: "\u8DE8\u7A97\u53E3\u91CD\u8BD5\u7684\u5E42\u7B49\u952E"
    }
  ],
  examples: [
    "carlog mileage add --car 1 --mileage 12500",
    "carlog mileage add --mileage 12500 --datetime 2026-11-07 --dry-run --json"
  ],
  outputFields: [
    "data.record",
    "data.current_mileage",
    "data.distance_since_last_mileage",
    "data.reminders",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "MILEAGE_ORDER",
    "DUPLICATE_RECORD"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const mileage = requireNumberFlag("mileage", getStringFlag(inv, "mileage"), { positive: true });
    const datetimeRaw = getStringFlag(inv, "datetime");
    const datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    const result = createMileageRecord(db, {
      vehicle_id: vehicle.id,
      mileage,
      datetime,
      note: getStringFlag(inv, "note")
    }, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run"),
      idempotencyKey: getStringFlag(inv, "idempotency-key"),
      datetimeProvided: datetimeRaw !== undefined
    });
    const currentMileage = getCurrentMileage(db, vehicle.id);
    const previous = getPreviousRecord(db, vehicle.id, result.record.datetime, {
      excludeId: result.dryRun ? undefined : result.record.id
    });
    const distance = previous?.mileage !== null && previous?.mileage !== undefined ? result.record.mileage - previous.mileage : null;
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(result.record, { preview: result.dryRun }),
      current_mileage: currentMileage,
      distance_since_last_mileage: distance,
      distance_since_last_odometer: distance,
      reminders: getVehicleReminders(db, vehicle.id, { now: ctx.now }),
      warnings: result.warnings,
      dry_run: result.dryRun,
      replayed: result.replayed
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings(target, false, value.warnings);
      if (value.dry_run) {
        writeLine(target, `[\u9884\u89C8] \u91CC\u7A0B\u8BB0\u5F55: ${formatMileage(value.record.mileage)} @ ${value.record.datetime}`);
        renderUrgentReminders(target, value.reminders);
        return;
      }
      writeLine(target, `\u91CC\u7A0B\u8BB0\u5F55\u5DF2\u4FDD\u5B58 (ID: ${value.record.id}): ${formatMileage(value.record.mileage)} @ ${value.record.datetime}`);
      writeLine(target, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(value.current_mileage)}`);
      if (value.distance_since_last_mileage !== null) {
        writeLine(target, `\u8DDD\u4E0A\u6B21\u91CC\u7A0B: ${value.distance_since_last_mileage.toLocaleString("zh-CN")} km`);
      }
      renderUrgentReminders(target, value.reminders);
    });
  }
};
var update2 = {
  path: ["mileage", "update"],
  summary: "\u66F4\u65B0\u91CC\u7A0B\u8BB0\u5F55\u5E76\u91CD\u65B0\u6821\u9A8C\u987A\u5E8F",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  flags: [
    { name: "mileage", valueName: "KM", description: "\u65B0\u91CC\u7A0B\uFF08km\uFF09" },
    { name: "datetime", valueName: "DT", description: "\u65B0\u8BB0\u5F55\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" }
  ],
  examples: ["carlog mileage update 7 --mileage 12600"],
  outputFields: ["data.record", "data.current_mileage", "data.warnings"],
  errorCodes: [
    "INVALID_ARGUMENT",
    "RECORD_NOT_FOUND",
    "RECORD_TYPE_MISMATCH",
    "MILEAGE_ORDER"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    assertRecordType(db, id, "mileage");
    const patch = {};
    const mileageRaw = getStringFlag(inv, "mileage");
    if (mileageRaw !== undefined) {
      patch.mileage = requireNumberFlag("mileage", mileageRaw, { positive: true });
    }
    const datetimeRaw = getStringFlag(inv, "datetime");
    if (datetimeRaw !== undefined) {
      patch.datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    }
    const noteRaw = getStringFlag(inv, "note");
    if (noteRaw !== undefined)
      patch.note = noteRaw;
    if (Object.keys(patch).length === 0) {
      throw new AppError("INVALID_ARGUMENT", "\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", {
        details: { record_id: id }
      });
    }
    const result = updateMileageRecord(db, id, patch, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run")
    });
    const vehicle = getVehicleById(db, result.record.vehicle_id);
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(result.record, { preview: result.dryRun }),
      current_mileage: getCurrentMileage(db, vehicle.id),
      warnings: result.warnings,
      dry_run: result.dryRun
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings(target, false, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u91CC\u7A0B\u8BB0\u5F55\u5DF2\u66F4\u65B0 (ID: ${value.record.id}): ` + `${formatMileage(value.record.mileage)} @ ${value.record.datetime}`);
      writeLine(target, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(value.current_mileage)}`);
    });
  }
};
var remove2 = {
  path: ["mileage", "delete"],
  summary: "\u5220\u9664\u91CC\u7A0B\u8BB0\u5F55\uFF08\u7C7B\u578B\u5B89\u5168\uFF09",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  examples: ["carlog mileage delete 7"],
  outputFields: ["data.record", "data.deleted"],
  errorCodes: ["RECORD_NOT_FOUND", "RECORD_TYPE_MISMATCH"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const record = deleteMileageRecord(db, id, ctx.now);
    emitSuccess(ctx, inv.globals.json, { record: recordToView(record), deleted: true }, (target, value) => {
      writeLine(target, `\u91CC\u7A0B\u8BB0\u5F55\u5DF2\u5220\u9664 (ID: ${value.record.id}, ${formatMileage(value.record.mileage)})`);
    });
  }
};
var list2 = {
  path: ["mileage", "list"],
  summary: "\u5217\u51FA\u91CC\u7A0B\u8BB0\u5F55",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "limit", valueName: "N", description: "\u6700\u591A\u8FD4\u56DE\u6761\u6570" },
    {
      name: "order",
      valueName: "asc|desc",
      description: "\u65F6\u95F4\u6392\u5E8F\uFF0C\u9ED8\u8BA4 desc"
    }
  ],
  examples: ["carlog mileage list --car 1 --limit 10"],
  outputFields: ["data.vehicle", "data.records", "data.count"],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const options = parseListOptions(inv, ctx);
    const records = listMileageRecords(db, vehicle.id, options);
    const data = {
      vehicle: vehicleToView(db, vehicle),
      records: records.map((record) => recordToView(record)),
      count: records.length
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.records.length === 0) {
        writeLine(target, "\u6682\u65E0\u91CC\u7A0B\u8BB0\u5F55");
        return;
      }
      writeLine(target, table(["ID", "\u91CC\u7A0B(km)", "\u65F6\u95F4", "\u5907\u6CE8"], value.records.map((record) => [
        record.id,
        record.mileage?.toLocaleString("zh-CN") ?? "-",
        record.datetime,
        record.note ?? "-"
      ])));
    });
  }
};
var mileageCommands = [
  add2,
  update2,
  remove2,
  list2
];

// src/cli/commands/refuel.ts
var STATUS_LABELS3 = {
  overdue: "\u5DF2\u903E\u671F",
  due_soon: "\u5373\u5C06\u5230\u671F",
  ok: "\u6B63\u5E38",
  unknown: "\u672A\u77E5"
};
function renderUrgentReminders2(ctx, reminders) {
  for (const reminder of reminders) {
    if (reminder.status !== "overdue" && reminder.status !== "due_soon")
      continue;
    const remaining = [];
    if (reminder.remaining_km !== null) {
      remaining.push(`${reminder.remaining_km.toLocaleString("zh-CN")} km`);
    }
    if (reminder.remaining_days !== null) {
      remaining.push(`${reminder.remaining_days} \u5929`);
    }
    writeLine(ctx, `\u63D0\u9192: ${reminder.name} (${reminder.item}) ${STATUS_LABELS3[reminder.status]}` + (remaining.length > 0 ? `\uFF0C\u5269\u4F59 ${remaining.join(" / ")}` : ""));
  }
}
function renderWarnings2(ctx, json, warnings) {
  if (json)
    return;
  for (const warning3 of warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
}
function parseDateBound3(flag, raw, endOfDay, now) {
  if (raw === undefined)
    return;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 23:59:59`;
  }
  return parseDatetimeFlag(flag, raw, now);
}
function resolveFullness(inv, vehicleTankCapacity) {
  const full = getBooleanFlag(inv, "full");
  const partial = getBooleanFlag(inv, "partial");
  const fuelLevelRaw = getStringFlag(inv, "fuel-level");
  const fuelLevel = parseFuelLevelFlag(fuelLevelRaw);
  if (full && partial) {
    throw new AppError("INVALID_ARGUMENT", "\u4E0D\u80FD\u540C\u65F6\u4F20 --full \u548C --partial", {
      details: { flags: ["full", "partial"] }
    });
  }
  if (full && fuelLevelRaw !== undefined) {
    throw new AppError("INVALID_ARGUMENT", "--full \u4E0D\u80FD\u4E0E --fuel-level \u540C\u65F6\u4F7F\u7528\uFF08\u6CB9\u8868\u6BD4\u4F8B\u9690\u542B\u672A\u52A0\u6EE1\uFF09", { details: { flags: ["full", "fuel-level"] } });
  }
  if (!full && !partial && fuelLevelRaw === undefined) {
    throw new AppError("FULLNESS_REQUIRED", "\u8BF7\u663E\u5F0F\u4F20 --full \u6216 --partial\uFF08--fuel-level \u9690\u542B\u672A\u52A0\u6EE1\uFF09", { details: { missing: ["full", "partial"] } });
  }
  if (fuelLevelRaw !== undefined && vehicleTankCapacity === null) {
    throw new AppError("INVALID_ARGUMENT", "\u8BE5\u8F66\u8F86\u672A\u8BBE\u7F6E\u6CB9\u7BB1\u5BB9\u91CF\uFF0C\u65E0\u6CD5\u8BB0\u5F55\u6CB9\u8868\u6BD4\u4F8B\uFF1B\u8BF7\u5148 car update --tank-capacity", { details: { field: "fuel-level", vehicle_tank_capacity_l: null } });
  }
  return { isFull: full, fuelLevel: fuelLevel ?? null };
}
function resolveCost(liters, costRaw, priceRaw) {
  if (costRaw === undefined && priceRaw === undefined) {
    throw new AppError("INVALID_ARGUMENT", "\u8BF7\u63D0\u4F9B --cost \u6216 --price", {
      details: { missing: ["cost", "price"] }
    });
  }
  if (costRaw !== undefined && priceRaw !== undefined) {
    throw new AppError("INVALID_ARGUMENT", "\u4E0D\u80FD\u540C\u65F6\u4F20 --cost \u548C --price", {
      details: { flags: ["cost", "price"] }
    });
  }
  if (costRaw !== undefined) {
    const cost = requireNumberFlag("cost", costRaw, { positive: true });
    return { cost, pricePerLiter: cost / liters };
  }
  const pricePerLiter = requireNumberFlag("price", priceRaw, { positive: true });
  return { cost: pricePerLiter * liters, pricePerLiter };
}
function distances(db, vehicleId, mileage, datetime, excludeId) {
  const previousRefuel = getPreviousRecord(db, vehicleId, datetime, {
    recordType: "refuel",
    excludeId
  });
  const previousOdometer = getPreviousRecord(db, vehicleId, datetime, {
    excludeId
  });
  return {
    distance_since_last_refuel: previousRefuel?.mileage !== null && previousRefuel?.mileage !== undefined ? mileage - previousRefuel.mileage : null,
    distance_since_last_odometer: previousOdometer?.mileage !== null && previousOdometer?.mileage !== undefined ? mileage - previousOdometer.mileage : null
  };
}
function fuelView(summary2) {
  return {
    latest_segment: summary2.latest_segment,
    overall: summary2.overall,
    pending: summary2.pending,
    unmeasured_partials: summary2.unmeasured_partials,
    warnings: summary2.warnings,
    confidence: summary2.confidence
  };
}
function previewCurrentMileage(db, vehicleId, record, excludeId) {
  const latest = db.query(`SELECT datetime, mileage FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
         AND id <> ?
       ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId, excludeId ?? -1);
  if (!latest || record.datetime >= latest.datetime)
    return record.mileage;
  return latest.mileage;
}
function renderPending(ctx, pending) {
  writeLine(ctx, "\u672A\u52A0\u6EE1\u72B6\u6001\uFF08\u7B49\u5F85\u4E0B\u6B21\u52A0\u6EE1\u7ED3\u7B97\uFF09:");
  writeLine(ctx, `  \u8DDD\u4E0A\u6B21\u52A0\u6EE1: ${pending.distance.toLocaleString("zh-CN")} km\uFF1B` + `\u7D2F\u8BA1\u8865\u6CB9 ${pending.liters.toFixed(2)} L\uFF08${pending.partial_count} \u6B21\uFF09`);
  writeLine(ctx, `  \u672C\u6B21\u73B0\u91D1\u652F\u51FA: ${formatCurrency(pending.cash_spent)}\uFF08\u73B0\u91D1\u53E3\u5F84\uFF0C\u4E0D\u7B49\u4E8E\u6D88\u8017\u6210\u672C\uFF09`);
  if (pending.lower_bound) {
    const lower = pending.lower_bound;
    const cost = lower.cost === null ? "" : `\uFF0C\u6D88\u8017\u6210\u672C\u4E0B\u9650\u7EA6 ${formatCurrency(lower.cost)}`;
    const perKm = lower.cost_per_km === null ? "" : `\uFF0C${lower.cost_per_km.toFixed(3)} \u5143/km`;
    writeLine(ctx, `  \u81F3\u5C11: ${lower.l_per_100km.toFixed(2)} L/100km` + `\uFF08\u8865\u6CB9\u4E0B\u9650 ${lower.liters.toFixed(2)} L${cost}${perKm}\uFF09`);
  } else {
    writeLine(ctx, "  \u81F3\u5C11: \u8DDD\u79BB\u65E0\u6548\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u4E0B\u9650");
  }
  if (pending.gauge) {
    const gauge = pending.gauge;
    const tankCapacity = gauge.remaining_liters + gauge.liters - pending.liters;
    const percent = (tankCapacity > 0 ? gauge.remaining_liters / tankCapacity * 100 : 0).toFixed(0);
    const cost = gauge.cost === null ? "" : `\uFF0C\u7EA6 ${formatCurrency(gauge.cost)}`;
    const perKm = gauge.cost_per_km === null ? "" : `\uFF0C${gauge.cost_per_km.toFixed(3)} \u5143/km`;
    writeLine(ctx, `  \u5982\u679C\u6CB9\u8868\u663E\u793A ${percent}%\uFF0C\u5219: ${gauge.l_per_100km.toFixed(2)} L/100km\uFF0C` + `\u7EA6 ${gauge.liters.toFixed(2)} L${cost}${perKm}\uFF1B` + `\u5269\u4F59\u7EA6 ${gauge.remaining_liters.toFixed(2)} L\uFF0C\u7EED\u822A\u7EA6 ${gauge.range_km.toFixed(0)} km` + "\uFF08\u6CB9\u8868\u4F30\u7B97\uFF0C\u4E0D\u662F\u51C6\u786E\u503C\uFF09");
  }
  if (pending.estimate) {
    const estimate = pending.estimate;
    const cost = estimate.cost === null ? "" : `\uFF0C\u7EA6 ${formatCurrency(estimate.cost)}`;
    const perKm = estimate.cost_per_km === null ? "" : `\uFF0C${estimate.cost_per_km.toFixed(3)} \u5143/km`;
    writeLine(ctx, `  \u7EA6: ${estimate.l_per_100km.toFixed(2)} L/100km\uFF0C` + `\u7EA6 ${estimate.liters.toFixed(2)} L${cost}${perKm}` + `\uFF08\u5386\u53F2\u4F30\u7B97\uFF0C\u7F6E\u4FE1\u5EA6 ${estimate.confidence}\uFF09`);
  }
  if (pending.tank) {
    const tank = pending.tank;
    writeLine(ctx, `  \u9884\u8BA1\u6CB9\u7BB1\u4E0B\u964D\u7EA6 ${tank.drop_liters.toFixed(2)} L\uFF0C` + `\u5269\u4F59\u7EA6 ${tank.liters_after_fill.toFixed(2)} L\uFF08${(tank.ratio * 100).toFixed(1)}%\uFF09\uFF0C` + `\u7EED\u822A\u7EA6 ${tank.range_km.toFixed(0)} km`);
  }
}
function renderFuelSummary(ctx, summary2) {
  for (const warning3 of summary2.warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
  if (summary2.latest_segment) {
    const segment = summary2.latest_segment;
    writeLine(ctx, `\u6700\u8FD1\u4E00\u6BB5\u6CB9\u8017: ${segment.l_per_100km.toFixed(2)} L/100km\uFF0C` + `${segment.cost_per_km.toFixed(3)} \u5143/km` + `\uFF08${segment.distance.toLocaleString("zh-CN")} km / ${segment.liters.toFixed(2)} L\uFF0C` + `${segment.partial_count} \u6B21\u672A\u52A0\u6EE1\uFF09`);
  }
  if (summary2.overall) {
    writeLine(ctx, `\u7EFC\u5408\u5E73\u5747\u6CB9\u8017: ${summary2.overall.l_per_100km.toFixed(2)} L/100km\uFF0C` + `${summary2.overall.cost_per_km.toFixed(3)} \u5143/km\uFF08\u7F6E\u4FE1\u5EA6 ${summary2.confidence}\uFF09`);
  }
  if (summary2.pending) {
    renderPending(ctx, summary2.pending);
    return;
  }
  if (summary2.unmeasured_partials.count > 0) {
    writeLine(ctx, `\u5C1A\u65E0\u52A0\u6EE1\u57FA\u51C6: ${summary2.unmeasured_partials.count} \u6B21\u672A\u52A0\u6EE1\u7D2F\u8BA1 ` + `${summary2.unmeasured_partials.liters.toFixed(2)} L / ` + `${formatCurrency(summary2.unmeasured_partials.cost)}\uFF0C\u4EC5\u8BA1\u5165\u73B0\u91D1\u652F\u51FA\uFF1B` + "\u9700\u8981\u7B2C\u4E00\u6B21\u52A0\u6EE1\u5EFA\u7ACB\u57FA\u51C6\u3002");
  } else if (!summary2.latest_segment) {
    const missingBaseline = summary2.warnings.some((warning3) => warning3.code === "BASELINE_MISSING");
    writeLine(ctx, missingBaseline ? "\u8FD8\u6CA1\u6709\u52A0\u6EE1\u8BB0\u5F55\u4F5C\u4E3A\u57FA\u51C6\uFF1B\u9700\u8981\u4E24\u6B21\u52A0\u6EE1\u624D\u80FD\u8BA1\u7B97\u6CB9\u8017\u3002" : "\u5DF2\u5EFA\u7ACB\u52A0\u6EE1\u57FA\u51C6\uFF1B\u9700\u8981\u4E0B\u4E00\u6B21\u52A0\u6EE1\u624D\u80FD\u8BA1\u7B97\u6CB9\u8017\u3002");
  }
}
var add3 = {
  path: ["refuel", "add"],
  summary: "\u6DFB\u52A0\u52A0\u6CB9\u8BB0\u5F55",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "mileage",
      valueName: "KM",
      required: true,
      description: "\u5F53\u524D\u91CC\u7A0B\uFF08km\uFF09"
    },
    {
      name: "liters",
      valueName: "L",
      required: true,
      description: "\u52A0\u6CB9\u91CF\uFF08L\uFF09"
    },
    { name: "cost", valueName: "YUAN", description: "\u672C\u6B21\u82B1\u8D39\uFF08\u5143\uFF09" },
    { name: "price", valueName: "YUAN_PER_L", description: "\u6BCF\u5347\u5355\u4EF7\uFF08\u5143\uFF09" },
    { name: "full", boolean: true, description: "\u672C\u6B21\u52A0\u6EE1" },
    { name: "partial", boolean: true, description: "\u672C\u6B21\u672A\u52A0\u6EE1" },
    {
      name: "fuel-level",
      valueName: "PCT",
      description: "\u52A0\u6CB9\u540E\u6CB9\u8868\u6BD4\u4F8B\uFF08\u9690\u542B\u672A\u52A0\u6EE1\uFF09\uFF0C\u5982 80\u300180%\u30010.8\u30011/2"
    },
    { name: "datetime", valueName: "DT", description: "\u8BB0\u5F55\u65F6\u95F4\uFF0C\u9ED8\u8BA4\u5F53\u524D\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u91CD\u590D\u548C\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" },
    {
      name: "idempotency-key",
      valueName: "KEY",
      description: "\u8DE8\u7A97\u53E3\u91CD\u8BD5\u7684\u5E42\u7B49\u952E"
    }
  ],
  examples: [
    "carlog refuel add --car 1 --mileage 12345 --liters 40 --cost 300 --full",
    "carlog refuel add --mileage 12345 --liters 40 --price 7.5 --partial --fuel-level 80% --json"
  ],
  outputFields: [
    "data.record",
    "data.price_per_liter",
    "data.distance_since_last_refuel",
    "data.distance_since_last_odometer",
    "data.fuel",
    "data.reminders",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "FULLNESS_REQUIRED",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "MILEAGE_ORDER",
    "DUPLICATE_RECORD"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const mileage = requireNumberFlag("mileage", getStringFlag(inv, "mileage"), { positive: true });
    const liters = requireNumberFlag("liters", getStringFlag(inv, "liters"), {
      positive: true
    });
    const { cost } = resolveCost(liters, getStringFlag(inv, "cost"), getStringFlag(inv, "price"));
    const { isFull, fuelLevel } = resolveFullness(inv, vehicle.tank_capacity_l);
    const datetimeRaw = getStringFlag(inv, "datetime");
    const datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    const result = createRefuelRecord(db, {
      vehicle_id: vehicle.id,
      mileage,
      liters,
      cost,
      is_full: isFull,
      fuel_level_after: fuelLevel,
      datetime,
      note: getStringFlag(inv, "note")
    }, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run"),
      idempotencyKey: getStringFlag(inv, "idempotency-key"),
      datetimeProvided: datetimeRaw !== undefined
    });
    const record = result.record;
    const distance = distances(db, vehicle.id, record.mileage, record.datetime, result.dryRun ? undefined : record.id);
    const records = listRefuelRecords(db, vehicle.id, {
      order: "asc"
    });
    let fuel;
    if (result.dryRun) {
      const maxId = records.reduce((max, item) => Math.max(max, item.id), 0);
      fuel = computeFuelSummary([...records, { ...record, id: maxId + 1 }], {
        currentMileage: previewCurrentMileage(db, vehicle.id, record),
        tankCapacityL: vehicle.tank_capacity_l
      });
    } else {
      fuel = computeFuelSummary(records, {
        currentMileage: getCurrentMileage(db, vehicle.id),
        tankCapacityL: vehicle.tank_capacity_l
      });
    }
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(record, { preview: result.dryRun }),
      price_per_liter: record.cost !== null && record.liters !== null ? record.cost / record.liters : null,
      ...distance,
      fuel: fuelView(fuel),
      reminders: getVehicleReminders(db, vehicle.id, { now: ctx.now }),
      warnings: result.warnings,
      dry_run: result.dryRun,
      replayed: result.replayed
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings2(target, false, value.warnings);
      const label = value.record.is_full ? "\u52A0\u6EE1" : "\u672A\u52A0\u6EE1";
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u52A0\u6CB9\u8BB0\u5F55\u5DF2\u4FDD\u5B58 (ID: ${value.record.id}): ` + `${value.record.liters} L / ${formatCurrency(value.record.cost ?? 0)} (${label})`);
      if (value.price_per_liter !== null) {
        writeLine(target, `\u5355\u4EF7: ${value.price_per_liter.toFixed(2)} \u5143/L`);
      }
      if (value.distance_since_last_refuel !== null) {
        writeLine(target, `\u8DDD\u4E0A\u6B21\u52A0\u6CB9: ${value.distance_since_last_refuel.toLocaleString("zh-CN")} km`);
      }
      if (value.distance_since_last_odometer !== null) {
        writeLine(target, `\u8DDD\u4E0A\u6B21\u91CC\u7A0B\u8BB0\u5F55: ${value.distance_since_last_odometer.toLocaleString("zh-CN")} km`);
      }
      renderFuelSummary(target, value.fuel);
      renderUrgentReminders2(target, value.reminders);
    });
  }
};
var update3 = {
  path: ["refuel", "update"],
  summary: "\u66F4\u65B0\u52A0\u6CB9\u8BB0\u5F55",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  flags: [
    { name: "mileage", valueName: "KM", description: "\u65B0\u91CC\u7A0B\uFF08km\uFF09" },
    { name: "liters", valueName: "L", description: "\u65B0\u6CB9\u91CF\uFF08L\uFF09" },
    { name: "cost", valueName: "YUAN", description: "\u65B0\u82B1\u8D39\uFF08\u5143\uFF09" },
    { name: "price", valueName: "YUAN_PER_L", description: "\u6BCF\u5347\u5355\u4EF7\uFF08\u5143\uFF09" },
    { name: "full", boolean: true, description: "\u6539\u4E3A\u52A0\u6EE1" },
    { name: "partial", boolean: true, description: "\u6539\u4E3A\u672A\u52A0\u6EE1" },
    {
      name: "fuel-level",
      valueName: "PCT",
      description: "\u52A0\u6CB9\u540E\u6CB9\u8868\u6BD4\u4F8B\uFF08\u9690\u542B\u672A\u52A0\u6EE1\uFF09"
    },
    { name: "datetime", valueName: "DT", description: "\u65B0\u8BB0\u5F55\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" }
  ],
  examples: [
    "carlog refuel update 3 --fuel-level 80%",
    "carlog refuel update 3 --full"
  ],
  outputFields: [
    "data.record",
    "data.price_per_liter",
    "data.fuel",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "FULLNESS_REQUIRED",
    "RECORD_NOT_FOUND",
    "RECORD_TYPE_MISMATCH",
    "MILEAGE_ORDER"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const existing = assertRecordType(db, id, "refuel");
    const full = getBooleanFlag(inv, "full");
    const partial = getBooleanFlag(inv, "partial");
    const fuelLevelRaw = getStringFlag(inv, "fuel-level");
    if (full && partial) {
      throw new AppError("INVALID_ARGUMENT", "\u4E0D\u80FD\u540C\u65F6\u4F20 --full \u548C --partial", {
        details: { flags: ["full", "partial"] }
      });
    }
    if (full && fuelLevelRaw !== undefined) {
      throw new AppError("INVALID_ARGUMENT", "--full \u4E0D\u80FD\u4E0E --fuel-level \u540C\u65F6\u4F7F\u7528\uFF08\u6CB9\u8868\u6BD4\u4F8B\u9690\u542B\u672A\u52A0\u6EE1\uFF09", { details: { flags: ["full", "fuel-level"] } });
    }
    const patch = {};
    const mileageRaw = getStringFlag(inv, "mileage");
    if (mileageRaw !== undefined) {
      patch.mileage = requireNumberFlag("mileage", mileageRaw, { positive: true });
    }
    const litersRaw = getStringFlag(inv, "liters");
    if (litersRaw !== undefined) {
      patch.liters = requireNumberFlag("liters", litersRaw, { positive: true });
    }
    const costRaw = getStringFlag(inv, "cost");
    const priceRaw = getStringFlag(inv, "price");
    if (costRaw !== undefined && priceRaw !== undefined) {
      throw new AppError("INVALID_ARGUMENT", "\u4E0D\u80FD\u540C\u65F6\u4F20 --cost \u548C --price", {
        details: { flags: ["cost", "price"] }
      });
    }
    if (costRaw !== undefined) {
      patch.cost = requireNumberFlag("cost", costRaw, { positive: true });
    }
    if (priceRaw !== undefined) {
      const pricePerLiter = requireNumberFlag("price", priceRaw, {
        positive: true
      });
      const liters = patch.liters ?? existing.liters;
      if (liters === null || liters === undefined) {
        throw new AppError("INVALID_ARGUMENT", "\u4F7F\u7528 --price \u65F6\u9700\u8981\u5DF2\u6709\u6CB9\u91CF\u6216\u540C\u65F6\u63D0\u4F9B --liters", { details: { field: "price" } });
      }
      patch.cost = pricePerLiter * liters;
    }
    if (full) {
      patch.is_full = true;
      patch.fuel_level_after = null;
    } else if (partial || fuelLevelRaw !== undefined) {
      patch.is_full = false;
    }
    if (fuelLevelRaw !== undefined) {
      patch.fuel_level_after = parseFuelLevelFlag(fuelLevelRaw) ?? null;
    }
    const datetimeRaw = getStringFlag(inv, "datetime");
    if (datetimeRaw !== undefined) {
      patch.datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    }
    const noteRaw = getStringFlag(inv, "note");
    if (noteRaw !== undefined)
      patch.note = noteRaw;
    if (Object.keys(patch).length === 0) {
      throw new AppError("INVALID_ARGUMENT", "\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", {
        details: { record_id: id }
      });
    }
    const result = updateRefuelRecord(db, id, patch, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run")
    });
    const vehicle = getVehicleById(db, result.record.vehicle_id);
    const record = result.record;
    const records = listRefuelRecords(db, vehicle.id, {
      order: "asc"
    });
    let fuel;
    if (result.dryRun) {
      const replaced = records.map((item) => item.id === record.id ? { ...record, id: item.id } : item);
      fuel = computeFuelSummary(replaced, {
        currentMileage: previewCurrentMileage(db, vehicle.id, record, record.id),
        tankCapacityL: vehicle.tank_capacity_l
      });
    } else {
      fuel = computeFuelSummary(records, {
        currentMileage: getCurrentMileage(db, vehicle.id),
        tankCapacityL: vehicle.tank_capacity_l
      });
    }
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(record, { preview: result.dryRun }),
      price_per_liter: record.cost !== null && record.liters !== null ? record.cost / record.liters : null,
      fuel: fuelView(fuel),
      reminders: null,
      warnings: result.warnings,
      dry_run: result.dryRun
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings2(target, false, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u52A0\u6CB9\u8BB0\u5F55\u5DF2\u66F4\u65B0 (ID: ${value.record.id}): ` + `${value.record.liters} L / ${formatCurrency(value.record.cost ?? 0)}`);
      renderFuelSummary(target, value.fuel);
    });
  }
};
var remove3 = {
  path: ["refuel", "delete"],
  summary: "\u5220\u9664\u52A0\u6CB9\u8BB0\u5F55\uFF08\u7C7B\u578B\u5B89\u5168\uFF09",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  examples: ["carlog refuel delete 7"],
  outputFields: ["data.record", "data.deleted"],
  errorCodes: ["RECORD_NOT_FOUND", "RECORD_TYPE_MISMATCH"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const record = deleteRefuelRecord(db, id, ctx.now);
    emitSuccess(ctx, inv.globals.json, { record: recordToView(record), deleted: true }, (target, value) => {
      writeLine(target, `\u52A0\u6CB9\u8BB0\u5F55\u5DF2\u5220\u9664 (ID: ${value.record.id})`);
    });
  }
};
var list3 = {
  path: ["refuel", "list"],
  summary: "\u5217\u51FA\u52A0\u6CB9\u8BB0\u5F55",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "limit", valueName: "N", description: "\u6700\u591A\u8FD4\u56DE\u6761\u6570" },
    {
      name: "order",
      valueName: "asc|desc",
      description: "\u65F6\u95F4\u6392\u5E8F\uFF0C\u9ED8\u8BA4 desc"
    }
  ],
  examples: ["carlog refuel list --car 1"],
  outputFields: ["data.vehicle", "data.records", "data.count"],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const records = listRefuelRecords(db, vehicle.id, {
      from: parseDateBound3("from", getStringFlag(inv, "from"), false, ctx.now),
      to: parseDateBound3("to", getStringFlag(inv, "to"), true, ctx.now),
      limit: parseNumberFlag("limit", getStringFlag(inv, "limit"), {
        integer: true,
        positive: true
      }),
      order: parseEnumFlag("order", getStringFlag(inv, "order"), [
        "asc",
        "desc"
      ]) ?? "desc"
    });
    const data = {
      vehicle: vehicleToView(db, vehicle),
      records: records.map((record) => recordToView(record)),
      count: records.length
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.records.length === 0) {
        writeLine(target, "\u6682\u65E0\u52A0\u6CB9\u8BB0\u5F55");
        return;
      }
      writeLine(target, table(["ID", "\u91CC\u7A0B(km)", "\u5347\u6570(L)", "\u82B1\u8D39(\u5143)", "\u52A0\u6EE1", "\u65F6\u95F4", "\u5907\u6CE8"], value.records.map((record) => [
        record.id,
        record.mileage?.toLocaleString("zh-CN") ?? "-",
        record.liters ?? "-",
        record.cost !== null ? record.cost.toFixed(2) : "-",
        record.is_full ? "\u662F" : "\u5426",
        record.datetime,
        record.note ?? "-"
      ])));
    });
  }
};
var consumption = {
  path: ["refuel", "consumption"],
  summary: "\u67E5\u770B\u52A0\u6EE1\u5230\u52A0\u6EE1\u7684\u6CB9\u8017\u5206\u6BB5\u3001\u7EFC\u5408\u5E73\u5747\u4E0E\u672A\u52A0\u6EE1\u4F30\u7B97",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "limit", valueName: "N", description: "\u6700\u591A\u8FD4\u56DE\u6700\u8FD1 N \u6BB5" }
  ],
  examples: ["carlog refuel consumption --car 1"],
  outputFields: [
    "data.segments",
    "data.latest_segment",
    "data.overall",
    "data.pending",
    "data.unmeasured_partials",
    "data.warnings",
    "data.confidence"
  ],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const from = parseDateBound3("from", getStringFlag(inv, "from"), false, ctx.now);
    const to = parseDateBound3("to", getStringFlag(inv, "to"), true, ctx.now);
    const limit = parseNumberFlag("limit", getStringFlag(inv, "limit"), {
      integer: true,
      positive: true
    });
    const summary2 = computeVehicleFuelSummary(db, vehicle.id, {
      currentMileage: getCurrentMileage(db, vehicle.id),
      tankCapacityL: vehicle.tank_capacity_l,
      from,
      to,
      limit
    });
    const rangeApplied = from !== undefined || to !== undefined;
    const data = {
      vehicle: vehicleToView(db, vehicle),
      segments: summary2.segments,
      latest_segment: summary2.latest_segment,
      overall: summary2.overall,
      pending: summary2.pending,
      unmeasured_partials: summary2.unmeasured_partials,
      warnings: summary2.warnings,
      confidence: summary2.confidence
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      for (const warning3 of value.warnings) {
        target.stderr(`\u8B66\u544A: ${warning3.message}
`);
      }
      if (value.unmeasured_partials.count > 0) {
        writeLine(target, `\u9996\u6B21\u52A0\u6EE1\u524D\u7684\u672A\u52A0\u6EE1\u8BB0\u5F55: ${value.unmeasured_partials.count} \u6B21\uFF0C` + `\u7D2F\u8BA1 ${value.unmeasured_partials.liters.toFixed(2)} L / ` + `${formatCurrency(value.unmeasured_partials.cost)}\uFF08\u4EC5\u8BA1\u73B0\u91D1\u652F\u51FA\uFF0C\u4E0D\u53C2\u4E0E\u6CB9\u8017\uFF09`);
      }
      if (value.segments.length > 0) {
        writeLine(target, table([
          "\u65F6\u6BB5",
          "\u91CC\u7A0B\u8303\u56F4(km)",
          "\u884C\u9A76\u91CC\u7A0B(km)",
          "\u52A0\u6CB9\u91CF(L)",
          "\u82B1\u8D39(\u5143)",
          "L/100km",
          "\u5143/km",
          "\u672A\u52A0\u6EE1"
        ], value.segments.map((segment) => [
          `${segment.from_datetime} -> ${segment.to_datetime}`,
          `${segment.from_mileage.toLocaleString("zh-CN")} -> ${segment.to_mileage.toLocaleString("zh-CN")}`,
          segment.distance.toLocaleString("zh-CN"),
          segment.liters.toFixed(2),
          formatCurrency(segment.cost),
          segment.l_per_100km.toFixed(2),
          segment.cost_per_km.toFixed(3),
          segment.partial_count
        ])));
        if (value.overall) {
          writeLine(target, "");
          writeLine(target, "\u7EFC\u5408\u5E73\u5747:");
          writeLine(target, `  \u5E73\u5747\u6CB9\u8017: ${value.overall.l_per_100km.toFixed(2)} L/100km`);
          writeLine(target, `  \u6D88\u8017\u6210\u672C: ${value.overall.cost_per_km.toFixed(3)} \u5143/km` + `\uFF08${formatCurrency(value.overall.cost)} / ${value.overall.distance.toLocaleString("zh-CN")} km\uFF0C\u7F6E\u4FE1\u5EA6 ${value.confidence}\uFF09`);
        }
      } else if (rangeApplied) {
        writeLine(target, "\u6240\u9009\u65F6\u95F4\u8303\u56F4\u5185\u6CA1\u6709\u5DF2\u95ED\u5408\u7684\u6CB9\u8017\u5206\u6BB5\u3002");
      } else if (!value.pending) {
        const missingBaseline = value.warnings.some((warning3) => warning3.code === "BASELINE_MISSING");
        writeLine(target, missingBaseline ? "\u8FD8\u6CA1\u6709\u52A0\u6EE1\u8BB0\u5F55\u4F5C\u4E3A\u57FA\u51C6\uFF1B\u9700\u8981\u4E24\u6B21\u52A0\u6EE1\u624D\u80FD\u8BA1\u7B97\u6CB9\u8017\u3002" : "\u5DF2\u5EFA\u7ACB\u52A0\u6EE1\u57FA\u51C6\uFF1B\u9700\u8981\u4E0B\u4E00\u6B21\u52A0\u6EE1\u624D\u80FD\u8BA1\u7B97\u6CB9\u8017\u3002");
      }
      if (value.pending) {
        if (value.segments.length > 0)
          writeLine(target, "");
        renderPending(target, value.pending);
      }
    });
  }
};
var refuelCommands = [
  add3,
  update3,
  remove3,
  list3,
  consumption
];

// src/maintenance.ts
function defaultNow3() {
  return new Date;
}
function duplicateError3(record) {
  return new DomainError("DUPLICATE_RECORD", `\u68C0\u6D4B\u5230\u91CD\u590D\u7684\u4FDD\u517B\u8BB0\u5F55 (ID: ${record.id}, ${record.datetime}, ${record.mileage} km, ${record.cost ?? "-"} \u5143)\uFF1B\u786E\u8BA4\u4E0D\u662F\u91CD\u590D\u63D0\u4EA4\u540E\u52A0 --force`, {
    details: {
      record_id: record.id,
      record_type: record.record_type,
      datetime: record.datetime,
      mileage: record.mileage,
      cost: record.cost
    }
  });
}
function shiftMinutes2(datetime, minutes) {
  const base = new Date(datetime.replace(" ", "T"));
  base.setMinutes(base.getMinutes() + minutes);
  return formatNow(() => base);
}
function sameItemSet(db, recordId, targetIds) {
  const existing = getMaintenanceRecordItems(db, recordId).map((item) => item.id).sort((a, b) => a - b);
  const target = [...new Set(targetIds)].sort((a, b) => a - b);
  if (existing.length !== target.length)
    return false;
  return existing.every((id, index) => id === target[index]);
}
function findMaintenanceDuplicate(db, input) {
  const conditions = [
    "vehicle_id = ?",
    "record_type = 'maintenance'",
    "deleted = 0",
    "mileage = ?",
    "cost IS ?"
  ];
  const params = [
    input.vehicleId,
    input.mileage,
    input.cost
  ];
  if (input.datetimeProvided) {
    conditions.push("datetime = ?");
    params.push(input.datetime);
  } else {
    conditions.push("datetime >= ?", "datetime <= ?");
    params.push(shiftMinutes2(input.datetime, -DUPLICATE_WINDOW_MINUTES), input.datetime);
  }
  if (input.excludeId !== undefined) {
    conditions.push("id <> ?");
    params.push(input.excludeId);
  }
  const candidates = db.query(`SELECT * FROM records WHERE ${conditions.join(" AND ")}` + " ORDER BY id DESC").all(...params);
  return candidates.find((candidate) => sameItemSet(db, candidate.id, input.itemIds));
}
function resolveCreateMileage(db, input) {
  if (input.mileage !== undefined && input.mileage !== null) {
    requirePositive("mileage", input.mileage);
    return input.mileage;
  }
  const current = getCurrentMileage(db, input.vehicle_id);
  if (current === null) {
    throw new DomainError("NO_CURRENT_MILEAGE", "\u8BE5\u8F66\u8F86\u8FD8\u6CA1\u6709\u5F53\u524D\u91CC\u7A0B\uFF1B\u8BF7\u63D0\u4F9B --mileage \u6216\u5148\u8BB0\u5F55\u91CC\u7A0B", { details: { vehicle_id: input.vehicle_id } });
  }
  requirePositive("mileage", current);
  return current;
}
function previewRecord3(input, mileage, datetime, now) {
  const stamp = formatNow(now);
  return {
    id: 0,
    vehicle_id: input.vehicle_id,
    record_type: "maintenance",
    datetime,
    mileage,
    liters: null,
    cost: input.cost ?? null,
    is_full: 1,
    fuel_level_after: null,
    note: input.note ?? null,
    deleted: 0,
    created_at: stamp,
    updated_at: stamp
  };
}
function insertLinks(db, recordId, itemIds) {
  const statement = db.query("INSERT INTO maintenance_record_items (record_id, item_id) VALUES (?, ?)");
  for (const itemId of itemIds)
    statement.run(recordId, itemId);
}
function createMaintenanceRecord(db, input, options = {}) {
  const now = options.now ?? defaultNow3;
  assertActiveVehicle(db, input.vehicle_id);
  const mileage = resolveCreateMileage(db, input);
  if (input.cost !== undefined && input.cost !== null) {
    requireNonNegative("cost", input.cost);
  }
  const items = requireMaintenanceItemsByIds(db, input.item_ids ?? []);
  const itemIds = items.map((item) => item.id);
  const datetimeProvided = options.datetimeProvided ?? (input.datetime !== undefined && input.datetime.trim() !== "");
  const datetime = parseDatetime(input.datetime, now);
  const note = input.note ?? null;
  const cost = input.cost ?? null;
  if (options.idempotencyKey !== undefined) {
    const replay = findIdempotencyRecord(db, options.idempotencyKey);
    if (replay) {
      return {
        record: replay,
        items: getMaintenanceRecordItems(db, replay.id),
        reminders: getVehicleReminders(db, replay.vehicle_id, { now }),
        warnings: [
          {
            code: "IDEMPOTENT_REPLAY",
            message: `idempotency-key \u5DF2\u5904\u7406\u8FC7\uFF0C\u8FD4\u56DE\u5DF2\u6709\u8BB0\u5F55 (ID: ${replay.id})`
          }
        ],
        replayed: true,
        dryRun: options.dryRun === true
      };
    }
  }
  const warnings = [];
  if (items.length === 0) {
    warnings.push({
      code: "ITEMS_NOT_PROVIDED",
      message: "\u672C\u6B21\u4FDD\u517B\u53EA\u8BB0\u5F55\u4E86\u8D39\u7528\uFF0C\u672A\u5173\u8054\u9879\u76EE\uFF1B\u76F8\u5173\u63D0\u9192\u4E0D\u4F1A\u91CD\u7F6E\u3002\u9700\u8981\u91CD\u7F6E\u63D0\u9192\u65F6\u8BF7\u8865\u4F20 --items",
      details: { vehicle_id: input.vehicle_id }
    });
  }
  const duplicate = findMaintenanceDuplicate(db, {
    vehicleId: input.vehicle_id,
    datetime,
    datetimeProvided,
    mileage,
    cost,
    itemIds
  });
  if (duplicate) {
    if (options.force !== true)
      throw duplicateError3(duplicate);
    warnings.push({
      code: "DUPLICATE_RECORD_FORCED",
      message: `\u5DF2\u7528 --force \u5199\u5165\u7591\u4F3C\u91CD\u590D\u8BB0\u5F55 (\u539F\u8BB0\u5F55 ID: ${duplicate.id})`,
      details: { duplicate_record_id: duplicate.id }
    });
  }
  const conflict = findMileageConflict(db, {
    vehicleId: input.vehicle_id,
    mileage,
    datetime
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: input.vehicle_id,
        mileage,
        datetime
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: input.vehicle_id,
      mileage,
      datetime
    }));
  }
  if (options.dryRun === true) {
    return {
      record: previewRecord3({ ...input, mileage }, mileage, datetime, now),
      items,
      reminders: getVehicleReminders(db, input.vehicle_id, { now }),
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const stamp = formatNow(now);
  const insert = () => db.query(`INSERT INTO records
           (vehicle_id, record_type, mileage, datetime, note, cost,
            created_at, updated_at)
         VALUES (?, 'maintenance', ?, ?, ?, ?, ?, ?)
         RETURNING *`).get(input.vehicle_id, mileage, datetime, note, cost, stamp, stamp);
  let record;
  const key = options.idempotencyKey;
  const tx = db.transaction(() => {
    const inserted = insert();
    record = inserted;
    if (itemIds.length > 0)
      insertLinks(db, inserted.id, itemIds);
    if (key !== undefined)
      storeIdempotencyKey(db, key, inserted.id);
  });
  tx();
  return {
    record,
    items,
    reminders: getVehicleReminders(db, input.vehicle_id, { now }),
    warnings,
    replayed: false,
    dryRun: false
  };
}
function updateMaintenanceRecord(db, id, patch, options = {}) {
  const now = options.now ?? defaultNow3;
  const existing = assertRecordType(db, id, "maintenance");
  const mileage = patch.mileage ?? existing.mileage;
  if (mileage === null || mileage === undefined) {
    throw new DomainError("INVALID_ARGUMENT", "\u8BE5\u4FDD\u517B\u8BB0\u5F55\u7F3A\u5C11\u91CC\u7A0B\u503C\uFF0C\u65E0\u6CD5\u66F4\u65B0", {
      details: { record_id: id }
    });
  }
  requirePositive("mileage", mileage);
  let cost;
  if (patch.cost !== undefined) {
    if (patch.cost !== null)
      requireNonNegative("cost", patch.cost);
    cost = patch.cost;
  } else {
    cost = existing.cost;
  }
  const datetime = patch.datetime !== undefined ? parseDatetime(patch.datetime, now) : existing.datetime;
  let items;
  if (patch.item_ids !== undefined) {
    items = requireMaintenanceItemsByIds(db, patch.item_ids);
  } else {
    items = getMaintenanceRecordItems(db, id);
  }
  const warnings = [];
  const conflict = findMileageConflict(db, {
    vehicleId: existing.vehicle_id,
    mileage,
    datetime,
    excludeId: id
  });
  if (conflict) {
    if (options.force !== true) {
      throw mileageOrderError(conflict, {
        vehicleId: existing.vehicle_id,
        mileage,
        datetime,
        excludeId: id
      });
    }
    warnings.push(mileageOrderWarning(conflict, {
      vehicleId: existing.vehicle_id,
      mileage,
      datetime,
      excludeId: id
    }));
  }
  if (options.dryRun === true) {
    return {
      record: {
        ...existing,
        mileage,
        cost,
        datetime,
        note: patch.note !== undefined ? patch.note : existing.note,
        updated_at: formatNow(now)
      },
      items,
      reminders: getVehicleReminders(db, existing.vehicle_id, { now }),
      warnings,
      replayed: false,
      dryRun: true
    };
  }
  const recordPatch = { mileage, cost, datetime };
  if (patch.note !== undefined)
    recordPatch.note = patch.note;
  const tx = db.transaction(() => {
    updateRecord(db, id, recordPatch, now);
    if (patch.item_ids !== undefined) {
      db.query("DELETE FROM maintenance_record_items WHERE record_id = ?").run(id);
      insertLinks(db, id, items.map((item) => item.id));
    }
  });
  tx();
  const record = getRecordById(db, id);
  return {
    record,
    items,
    reminders: getVehicleReminders(db, existing.vehicle_id, { now }),
    warnings,
    replayed: false,
    dryRun: false
  };
}
function deleteMaintenanceRecord(db, id, now = defaultNow3) {
  const record = assertRecordType(db, id, "maintenance");
  const updatedAt = formatNow(now);
  const tx = db.transaction(() => {
    db.query("UPDATE records SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0").run(updatedAt, id);
    db.query("DELETE FROM maintenance_record_items WHERE record_id = ?").run(id);
  });
  tx();
  return { ...record, deleted: 1, updated_at: updatedAt };
}
function listMaintenanceRecords(db, vehicleId, options = {}) {
  return listRecords(db, {
    vehicleId,
    recordType: "maintenance",
    ...options
  });
}
function getMaintenanceInterval(db, vehicleId) {
  const latest = db.query(`SELECT * FROM records
       WHERE vehicle_id = ? AND deleted = 0 AND mileage IS NOT NULL
       ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId);
  if (!latest || latest.mileage === null)
    return null;
  const lastMaintenance = db.query(`SELECT * FROM records
       WHERE vehicle_id = ? AND record_type = 'maintenance' AND deleted = 0
         AND datetime <= ?
       ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicleId, latest.datetime);
  if (!lastMaintenance || lastMaintenance.mileage === null)
    return null;
  return {
    last_maintenance_datetime: lastMaintenance.datetime,
    last_maintenance_mileage: lastMaintenance.mileage,
    days_since: daysBetween(lastMaintenance.datetime, latest.datetime),
    distance_since: latest.mileage - lastMaintenance.mileage,
    current_datetime: latest.datetime,
    current_mileage: latest.mileage
  };
}
function daysBetween(from, to) {
  const fromMs = new Date(from.replace(" ", "T")).getTime();
  const toMs = new Date(to.replace(" ", "T")).getTime();
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

// src/cli/commands/maintenance.ts
function renderWarnings3(ctx, json, warnings) {
  if (json)
    return;
  for (const warning3 of warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
}
function parseDateBound4(flag, raw, endOfDay, now) {
  if (raw === undefined)
    return;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 23:59:59`;
  }
  return parseDatetimeFlag(flag, raw, now);
}
var STATUS_LABELS4 = {
  overdue: "\u5DF2\u903E\u671F",
  due_soon: "\u5373\u5C06\u5230\u671F",
  ok: "\u6B63\u5E38",
  unknown: "\u672A\u77E5"
};
var SOURCE_LABELS = {
  default: "\u76EE\u5F55\u9ED8\u8BA4",
  override: "\u672C\u8F66\u8986\u76D6",
  disabled: "\u5DF2\u7981\u7528"
};
function formatInterval(intervalKm, intervalMonths) {
  const parts = [];
  if (intervalKm !== null)
    parts.push(`${intervalKm.toLocaleString("zh-CN")} km`);
  if (intervalMonths !== null)
    parts.push(`${intervalMonths} \u4E2A\u6708`);
  return parts.length > 0 ? parts.join(" / ") : "-";
}
function formatDue(mileage, datetime) {
  const parts = [];
  if (mileage !== null)
    parts.push(`${mileage.toLocaleString("zh-CN")} km`);
  if (datetime !== null)
    parts.push(datetime);
  return parts.length > 0 ? parts.join(" / ") : "-";
}
function formatRemaining(remainingKm, remainingDays) {
  const parts = [];
  if (remainingKm !== null) {
    parts.push(`${remainingKm.toLocaleString("zh-CN")} km`);
  }
  if (remainingDays !== null)
    parts.push(`${remainingDays} \u5929`);
  return parts.length > 0 ? parts.join(" / ") : "-";
}
function renderWriteReminders(ctx, reminders) {
  const urgent = reminders.filter((reminder) => reminder.status === "overdue" || reminder.status === "due_soon");
  for (const reminder of urgent) {
    writeLine(ctx, `\u63D0\u9192: ${reminder.name} (${reminder.item}) ${STATUS_LABELS4[reminder.status]}` + `\uFF0C\u5269\u4F59 ${formatRemaining(reminder.remaining_km, reminder.remaining_days)}` + `\uFF0C\u4E0B\u6B21 ${formatDue(reminder.next_due_mileage, reminder.next_due_datetime)}`);
  }
}
function hasFlag(inv, name) {
  return inv.flags[name] !== undefined;
}
function resolveItemsFromInv(db, inv) {
  return resolveMaintenanceItems(db, splitItemTokens(getRepeatedFlag(inv, "items")));
}
function ruleView(effective, reminder, vehicle) {
  return {
    item: effective.item.code,
    name: effective.item.name,
    category: effective.item.category,
    status: reminder.status,
    source: effective.source,
    anchor_source: reminder.source,
    enabled: effective.enabled,
    interval_km: effective.interval_km,
    interval_months: effective.interval_months,
    default_interval_km: effective.item.default_interval_km,
    default_interval_months: effective.item.default_interval_months,
    baseline_mileage: effective.rule?.baseline_mileage ?? vehicle.initial_mileage ?? null,
    baseline_datetime: effective.rule?.baseline_datetime ?? vehicle.initial_datetime ?? null,
    last_service_mileage: reminder.last_service_mileage,
    last_service_datetime: reminder.last_service_datetime,
    next_due_mileage: reminder.next_due_mileage,
    next_due_datetime: reminder.next_due_datetime,
    remaining_km: reminder.remaining_km,
    remaining_days: reminder.remaining_days
  };
}
function buildRuleView(db, vehicle, item, now) {
  const effective = getEffectiveRuleForItem(db, vehicle.id, item);
  const reminder = getVehicleReminderForItem(db, vehicle.id, item, { now });
  return ruleView(effective, reminder, vehicle);
}
function renderRuleTable(ctx, rules) {
  writeLine(ctx, table(["\u9879\u76EE", "\u6709\u6548\u95F4\u9694", "\u6765\u6E90", "\u57FA\u7EBF", "\u4E0A\u6B21\u4FDD\u517B", "\u4E0B\u6B21\u5230\u671F", "\u72B6\u6001"], rules.map((rule) => [
    `${rule.name} (${rule.item})`,
    formatInterval(rule.interval_km, rule.interval_months),
    SOURCE_LABELS[rule.source],
    formatDue(rule.baseline_mileage, rule.baseline_datetime),
    formatDue(rule.last_service_mileage, rule.last_service_datetime),
    formatDue(rule.next_due_mileage, rule.next_due_datetime),
    STATUS_LABELS4[rule.status]
  ])));
}
function renderStatusReminders(ctx, reminders) {
  if (reminders.length === 0) {
    writeLine(ctx, "\u6682\u65E0\u9700\u8981\u8DDF\u8E2A\u7684\u4FDD\u517B\u9879\u76EE");
    return;
  }
  writeLine(ctx, table(["\u9879\u76EE", "\u72B6\u6001", "\u4E0A\u6B21\u4FDD\u517B", "\u4E0B\u6B21\u5230\u671F", "\u5269\u4F59"], reminders.map((reminder) => [
    `${reminder.name} (${reminder.item})`,
    STATUS_LABELS4[reminder.status],
    formatDue(reminder.last_service_mileage, reminder.last_service_datetime),
    formatDue(reminder.next_due_mileage, reminder.next_due_datetime),
    formatRemaining(reminder.remaining_km, reminder.remaining_days)
  ])));
}
var add4 = {
  path: ["maintenance", "add"],
  summary: "\u6DFB\u52A0\u4FDD\u517B\u8BB0\u5F55\uFF08\u652F\u6301\u591A\u9879\u76EE\u522B\u540D\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "mileage",
      valueName: "KM",
      description: "\u4FDD\u517B\u65F6\u91CC\u7A0B\uFF08km\uFF09\uFF1B\u7701\u7565\u65F6\u4F7F\u7528\u5F53\u524D\u91CC\u7A0B"
    },
    {
      name: "items",
      valueName: "ITEMS",
      repeatable: true,
      description: "\u9879\u76EE\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D\uFF0C\u53EF\u91CD\u590D\u6216\u9017\u53F7\u5206\u9694\uFF08\u5982 \u673A\u6CB9,\u673A\u6EE4\uFF09"
    },
    {
      name: "cost",
      valueName: "YUAN",
      description: "\u672C\u6B21\u8D39\u7528\uFF08\u5143\uFF0C\u53EF\u4E3A 0\uFF09"
    },
    { name: "datetime", valueName: "DT", description: "\u8BB0\u5F55\u65F6\u95F4\uFF0C\u9ED8\u8BA4\u5F53\u524D\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u91CD\u590D\u548C\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" },
    {
      name: "idempotency-key",
      valueName: "KEY",
      description: "\u8DE8\u7A97\u53E3\u91CD\u8BD5\u7684\u5E42\u7B49\u952E"
    }
  ],
  examples: [
    "carlog maintenance add --items \u673A\u6CB9,\u673A\u6EE4 --cost 600",
    "carlog maintenance add --items \u5E74\u68C0 --cost 0 --json",
    "carlog maintenance add --cost 50 --dry-run --json"
  ],
  outputFields: [
    "data.record",
    "data.items",
    "data.reminders",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "MAINTENANCE_ITEM_UNKNOWN",
    "NO_CURRENT_MILEAGE",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "MILEAGE_ORDER",
    "DUPLICATE_RECORD"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const items = resolveItemsFromInv(db, inv);
    const mileage = parseNumberFlag("mileage", getStringFlag(inv, "mileage"), { positive: true });
    const cost = parseNumberFlag("cost", getStringFlag(inv, "cost"), {
      min: 0
    });
    const datetimeRaw = getStringFlag(inv, "datetime");
    const datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    const result = createMaintenanceRecord(db, {
      vehicle_id: vehicle.id,
      mileage,
      cost,
      datetime,
      note: getStringFlag(inv, "note"),
      item_ids: items.map((item) => item.id)
    }, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run"),
      idempotencyKey: getStringFlag(inv, "idempotency-key"),
      datetimeProvided: datetimeRaw !== undefined
    });
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(result.record, { preview: result.dryRun }),
      items: result.items.map(itemToView),
      reminders: result.reminders,
      warnings: result.warnings,
      dry_run: result.dryRun,
      replayed: result.replayed
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings3(target, false, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u4FDD\u517B\u8BB0\u5F55\u5DF2\u4FDD\u5B58` + `${value.record.id === null ? "" : ` (ID: ${value.record.id})`}: ` + `${formatMileage(value.record.mileage)} @ ${value.record.datetime}` + `${value.record.cost !== null ? ` / ${formatCurrency(value.record.cost)}` : ""}`);
      if (value.items.length > 0) {
        writeLine(target, `\u9879\u76EE: ${value.items.map((item) => `${item.name} (${item.code})`).join("\u3001")}`);
      }
      renderWriteReminders(target, value.reminders);
    });
  }
};
var update4 = {
  path: ["maintenance", "update"],
  summary: "\u66F4\u65B0\u4FDD\u517B\u8BB0\u5F55\u3001\u9879\u76EE\u5173\u8054\u5E76\u91CD\u65B0\u6821\u9A8C\u987A\u5E8F",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  flags: [
    { name: "mileage", valueName: "KM", description: "\u65B0\u91CC\u7A0B\uFF08km\uFF09" },
    { name: "cost", valueName: "YUAN", description: "\u65B0\u8D39\u7528\uFF08\u5143\uFF0C\u53EF\u4E3A 0\uFF09" },
    {
      name: "items",
      valueName: "ITEMS",
      repeatable: true,
      description: "\u66FF\u6362\u9879\u76EE\u5173\u8054\uFF08\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D\uFF09"
    },
    { name: "datetime", valueName: "DT", description: "\u65B0\u8BB0\u5F55\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u7ED5\u8FC7\u987A\u5E8F\u6821\u9A8C" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" }
  ],
  examples: [
    "carlog maintenance update 5 --cost 0",
    "carlog maintenance update 5 --items \u673A\u6CB9,\u673A\u6EE4"
  ],
  outputFields: [
    "data.record",
    "data.items",
    "data.reminders",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "MAINTENANCE_ITEM_UNKNOWN",
    "RECORD_NOT_FOUND",
    "RECORD_TYPE_MISMATCH",
    "MILEAGE_ORDER"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    assertRecordType(db, id, "maintenance");
    const patch = {};
    const mileageRaw = getStringFlag(inv, "mileage");
    if (mileageRaw !== undefined) {
      patch.mileage = requireNumberFlag("mileage", mileageRaw, {
        positive: true
      });
    }
    const costRaw = getStringFlag(inv, "cost");
    if (costRaw !== undefined) {
      patch.cost = requireNumberFlag("cost", costRaw, { min: 0 });
    }
    if (hasFlag(inv, "items")) {
      const items = resolveItemsFromInv(db, inv);
      patch.item_ids = items.map((item) => item.id);
    }
    const datetimeRaw = getStringFlag(inv, "datetime");
    if (datetimeRaw !== undefined) {
      patch.datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    }
    const noteRaw = getStringFlag(inv, "note");
    if (noteRaw !== undefined)
      patch.note = noteRaw;
    if (Object.keys(patch).length === 0) {
      throw new AppError("INVALID_ARGUMENT", "\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", {
        details: { record_id: id }
      });
    }
    const result = updateMaintenanceRecord(db, id, patch, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run")
    });
    const vehicle = getVehicleById(db, result.record.vehicle_id);
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record: recordToView(result.record, { preview: result.dryRun }),
      items: result.items.map(itemToView),
      reminders: result.reminders,
      warnings: result.warnings,
      dry_run: result.dryRun
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings3(target, false, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u4FDD\u517B\u8BB0\u5F55\u5DF2\u66F4\u65B0` + `${value.record.id === null ? "" : ` (ID: ${value.record.id})`}: ` + `${formatMileage(value.record.mileage)} @ ${value.record.datetime}`);
      if (value.items.length > 0) {
        writeLine(target, `\u9879\u76EE: ${value.items.map((item) => `${item.name} (${item.code})`).join("\u3001")}`);
      }
      renderWriteReminders(target, value.reminders);
    });
  }
};
var remove4 = {
  path: ["maintenance", "delete"],
  summary: "\u5220\u9664\u4FDD\u517B\u8BB0\u5F55\uFF08\u7C7B\u578B\u5B89\u5168\uFF09",
  positionals: [{ name: "id", required: true, description: "\u8BB0\u5F55 ID" }],
  examples: ["carlog maintenance delete 7"],
  outputFields: ["data.record", "data.deleted"],
  errorCodes: ["RECORD_NOT_FOUND", "RECORD_TYPE_MISMATCH"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const record = deleteMaintenanceRecord(db, id, ctx.now);
    emitSuccess(ctx, inv.globals.json, { record: recordToView(record), deleted: true }, (target, value) => {
      writeLine(target, `\u4FDD\u517B\u8BB0\u5F55\u5DF2\u5220\u9664 (ID: ${value.record.id})`);
    });
  }
};
var list4 = {
  path: ["maintenance", "list"],
  summary: "\u5217\u51FA\u4FDD\u517B\u8BB0\u5F55\u53CA\u5173\u8054\u9879\u76EE",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "limit", valueName: "N", description: "\u6700\u591A\u8FD4\u56DE\u6761\u6570" },
    {
      name: "order",
      valueName: "asc|desc",
      description: "\u65F6\u95F4\u6392\u5E8F\uFF0C\u9ED8\u8BA4 desc"
    }
  ],
  examples: ["carlog maintenance list --car 1"],
  outputFields: ["data.vehicle", "data.records", "data.count"],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const records = listMaintenanceRecords(db, vehicle.id, {
      from: parseDateBound4("from", getStringFlag(inv, "from"), false, ctx.now),
      to: parseDateBound4("to", getStringFlag(inv, "to"), true, ctx.now),
      limit: parseNumberFlag("limit", getStringFlag(inv, "limit"), {
        integer: true,
        positive: true
      }),
      order: parseEnumFlag("order", getStringFlag(inv, "order"), [
        "asc",
        "desc"
      ]) ?? "desc"
    });
    const views = records.map((record) => ({
      ...recordToView(record),
      items: getMaintenanceRecordItems(db, record.id).map(itemToView)
    }));
    const data = {
      vehicle: vehicleToView(db, vehicle),
      records: views,
      count: views.length
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.records.length === 0) {
        writeLine(target, "\u6682\u65E0\u4FDD\u517B\u8BB0\u5F55");
        return;
      }
      writeLine(target, table(["ID", "\u91CC\u7A0B(km)", "\u82B1\u8D39(\u5143)", "\u65F6\u95F4", "\u9879\u76EE", "\u5907\u6CE8"], value.records.map((record) => [
        record.id,
        record.mileage?.toLocaleString("zh-CN") ?? "-",
        record.cost !== null ? record.cost.toFixed(2) : "-",
        record.datetime,
        record.items.map((item) => item.name).join("\u3001") || "-",
        record.note ?? "-"
      ])));
    });
  }
};
function runStatus(ctx, inv, includeInterval) {
  const db = getCliDb(ctx);
  const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
  const itemToken = getStringFlag(inv, "item");
  const item = itemToken !== undefined ? resolveMaintenanceItemOrThrow(db, itemToken) : undefined;
  const reminders = item !== undefined ? [getVehicleReminderForItem(db, vehicle.id, item, { now: ctx.now })] : getVehicleReminders(db, vehicle.id, { now: ctx.now });
  if (!includeInterval) {
    emitSuccess(ctx, inv.globals.json, {
      vehicle: vehicleToView(db, vehicle),
      reminders,
      count: reminders.length
    }, (target, value) => {
      renderStatusReminders(target, value.reminders);
    });
    return;
  }
  const interval = getMaintenanceInterval(db, vehicle.id);
  const data = {
    vehicle: vehicleToView(db, vehicle),
    interval,
    ...interval ?? {},
    reminders,
    count: reminders.length
  };
  emitSuccess(ctx, inv.globals.json, data, (target, value) => {
    if (value.interval) {
      writeLine(target, `\u4E0A\u6B21\u4FDD\u517B\u65F6\u95F4: ${value.interval.last_maintenance_datetime}`);
      writeLine(target, `\u4E0A\u6B21\u4FDD\u517B\u91CC\u7A0B: ${formatMileage(value.interval.last_maintenance_mileage)}`);
      writeLine(target, `\u8DDD\u4ECA: ${formatDuration(value.interval.days_since)}`);
      writeLine(target, `\u5DF2\u884C\u9A76: ${value.interval.distance_since.toLocaleString("zh-CN")} km`);
      writeLine(target, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(value.interval.current_mileage)} (${value.interval.current_datetime})`);
    } else {
      writeLine(target, "\u6682\u65E0\u4FDD\u517B\u8BB0\u5F55\u6216\u65E0\u6CD5\u8BA1\u7B97\u95F4\u9694");
    }
    renderStatusReminders(target, value.reminders);
  });
}
var status = {
  path: ["maintenance", "status"],
  summary: "\u67E5\u770B\u5404\u9879\u76EE\u4E0A\u6B21\u4FDD\u517B\u4E0E\u4E0B\u6B21\u5230\u671F",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "item",
      valueName: "CODE",
      description: "\u53EA\u770B\u4E00\u4E2A\u9879\u76EE\uFF08\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D\uFF09"
    }
  ],
  examples: [
    "carlog maintenance status --car 1",
    "carlog maintenance status --car 1 --item engine_oil --json"
  ],
  outputFields: ["data.vehicle", "data.reminders", "data.count"],
  errorCodes: [
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "MAINTENANCE_ITEM_UNKNOWN"
  ],
  handler: (ctx, inv) => runStatus(ctx, inv, false)
};
var since = {
  path: ["maintenance", "since"],
  summary: "\u8DDD\u4E0A\u6B21\u4FDD\u517B\u7684\u65F6\u95F4\u548C\u91CC\u7A0B\uFF08\u542B\u5230\u671F\u5B57\u6BB5\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "item",
      valueName: "CODE",
      description: "\u53EA\u770B\u4E00\u4E2A\u9879\u76EE\uFF08\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D\uFF09"
    }
  ],
  examples: [
    "carlog maintenance since --car 1",
    "carlog maintenance since --car 1 --item engine_oil --json"
  ],
  outputFields: [
    "data.interval",
    "data.reminders",
    "data.last_maintenance_mileage"
  ],
  errorCodes: [
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "MAINTENANCE_ITEM_UNKNOWN"
  ],
  handler: (ctx, inv) => runStatus(ctx, inv, true)
};
var itemList = {
  path: ["maintenance", "item", "list"],
  summary: "\u5217\u51FA\u4FDD\u517B\u9879\u76EE\u76EE\u5F55",
  flags: [
    {
      name: "all",
      boolean: true,
      description: "\u5305\u542B\u5DF2\u7981\u7528\u7684\u9879\u76EE"
    }
  ],
  examples: [
    "carlog maintenance item list",
    "carlog maintenance item list --all --json"
  ],
  outputFields: ["data.items", "data.count"],
  errorCodes: ["INTERNAL_ERROR"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const items = listMaintenanceItems(db, {
      all: getBooleanFlag(inv, "all")
    }).map(itemToView);
    emitSuccess(ctx, inv.globals.json, { items, count: items.length }, (target, value) => {
      writeLine(target, table(["\u4EE3\u7801", "\u540D\u79F0", "\u5206\u7C7B", "\u9ED8\u8BA4\u95F4\u9694", "\u522B\u540D", "\u72B6\u6001"], value.items.map((item) => [
        item.code,
        item.name,
        item.category,
        formatInterval(item.default_interval_km, item.default_interval_months),
        item.aliases.join("\u3001") || "-",
        item.is_active ? "\u542F\u7528" : "\u7981\u7528"
      ])));
    });
  }
};
var itemAdd = {
  path: ["maintenance", "item", "add"],
  summary: "\u6DFB\u52A0\u81EA\u5B9A\u4E49\u4FDD\u517B\u9879\u76EE",
  flags: [
    {
      name: "code",
      valueName: "CODE",
      required: true,
      description: "\u9879\u76EE\u4EE3\u7801\uFF08\u552F\u4E00\uFF09"
    },
    {
      name: "name",
      valueName: "NAME",
      required: true,
      description: "\u9879\u76EE\u540D\u79F0"
    },
    {
      name: "aliases",
      valueName: "ALIASES",
      repeatable: true,
      description: "\u522B\u540D\uFF0C\u53EF\u91CD\u590D\u6216\u9017\u53F7\u5206\u9694"
    },
    {
      name: "category",
      valueName: MAINTENANCE_ITEM_CATEGORIES.join("|"),
      description: "\u5206\u7C7B\uFF0C\u9ED8\u8BA4 other"
    },
    { name: "interval-km", valueName: "KM", description: "\u9ED8\u8BA4\u516C\u91CC\u95F4\u9694" },
    {
      name: "interval-months",
      valueName: "M",
      description: "\u9ED8\u8BA4\u65F6\u95F4\u95F4\u9694\uFF08\u6574\u6570\u6708\uFF09"
    }
  ],
  examples: [
    "carlog maintenance item add --code wiper --name \u96E8\u522E\u5668 --aliases \u96E8\u522E,\u96E8\u5237 --category other --interval-km 20000 --interval-months 12"
  ],
  outputFields: ["data.item"],
  errorCodes: ["INVALID_ARGUMENT"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const code = requireStringFlag("code", getStringFlag(inv, "code"));
    const name = requireStringFlag("name", getStringFlag(inv, "name"));
    const category = parseEnumFlag("category", getStringFlag(inv, "category"), MAINTENANCE_ITEM_CATEGORIES);
    const intervalKm = parseNumberFlag("interval-km", getStringFlag(inv, "interval-km"), { positive: true });
    const intervalMonths = parseNumberFlag("interval-months", getStringFlag(inv, "interval-months"), { integer: true, positive: true });
    const aliases = splitItemTokens(getRepeatedFlag(inv, "aliases"));
    const item = addMaintenanceItem(db, {
      code,
      name,
      aliases,
      category,
      default_interval_km: intervalKm,
      default_interval_months: intervalMonths
    }, ctx.now);
    const view = itemToView(item);
    emitSuccess(ctx, inv.globals.json, { item: view }, (target, value) => {
      writeLine(target, `\u4FDD\u517B\u9879\u76EE\u5DF2\u6DFB\u52A0: ${value.item.name} (${value.item.code})\uFF0C` + `\u95F4\u9694 ${formatInterval(value.item.default_interval_km, value.item.default_interval_months)}`);
    });
  }
};
var itemUpdate = {
  path: ["maintenance", "item", "update"],
  summary: "\u66F4\u65B0\u81EA\u5B9A\u4E49\u4FDD\u517B\u9879\u76EE",
  positionals: [{ name: "code", required: true, description: "\u9879\u76EE\u4EE3\u7801" }],
  flags: [
    { name: "name", valueName: "NAME", description: "\u65B0\u540D\u79F0" },
    {
      name: "aliases",
      valueName: "ALIASES",
      repeatable: true,
      description: "\u66FF\u6362\u522B\u540D\uFF0C\u53EF\u91CD\u590D\u6216\u9017\u53F7\u5206\u9694"
    },
    { name: "interval-km", valueName: "KM", description: "\u9ED8\u8BA4\u516C\u91CC\u95F4\u9694" },
    {
      name: "interval-months",
      valueName: "M",
      description: "\u9ED8\u8BA4\u65F6\u95F4\u95F4\u9694\uFF08\u6574\u6570\u6708\uFF09"
    },
    { name: "disable", boolean: true, description: "\u505C\u7528\u8BE5\u9879\u76EE" }
  ],
  examples: [
    "carlog maintenance item update wiper --interval-km 18000",
    "carlog maintenance item update wiper --aliases \u96E8\u522E,\u96E8\u5237"
  ],
  outputFields: ["data.item"],
  errorCodes: ["INVALID_ARGUMENT", "MAINTENANCE_ITEM_UNKNOWN"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const code = requireStringFlag("code", inv.positionals[0]);
    const patch = {};
    const name = getStringFlag(inv, "name");
    if (name !== undefined)
      patch.name = name;
    if (hasFlag(inv, "aliases")) {
      patch.aliases = splitItemTokens(getRepeatedFlag(inv, "aliases"));
    }
    const intervalKmRaw = getStringFlag(inv, "interval-km");
    if (intervalKmRaw !== undefined) {
      patch.default_interval_km = requireNumberFlag("interval-km", intervalKmRaw, {
        positive: true
      });
    }
    const intervalMonthsRaw = getStringFlag(inv, "interval-months");
    if (intervalMonthsRaw !== undefined) {
      patch.default_interval_months = requireNumberFlag("interval-months", intervalMonthsRaw, { integer: true, positive: true });
    }
    if (getBooleanFlag(inv, "disable"))
      patch.disable = true;
    const item = updateMaintenanceItem(db, code, patch, ctx.now);
    const view = itemToView(item);
    emitSuccess(ctx, inv.globals.json, { item: view }, (target, value) => {
      writeLine(target, `\u4FDD\u517B\u9879\u76EE\u5DF2\u66F4\u65B0: ${value.item.name} (${value.item.code})\uFF0C` + `\u95F4\u9694 ${formatInterval(value.item.default_interval_km, value.item.default_interval_months)}`);
    });
  }
};
var ruleList = {
  path: ["maintenance", "rule", "list"],
  summary: "\u5217\u51FA\u6BCF\u8F66\u6709\u6548\u4FDD\u517B\u89C4\u5219\u4E0E\u5230\u671F\u72B6\u6001",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" }
  ],
  examples: [
    "carlog maintenance rule list --car 1",
    "carlog maintenance rule list --json"
  ],
  outputFields: ["data.vehicle", "data.rules", "data.count"],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const rules = listEffectiveRules(db, vehicle.id).map((effective) => {
      const reminder = getVehicleReminderForItem(db, vehicle.id, effective.item, { now: ctx.now });
      return ruleView(effective, reminder, vehicle);
    });
    emitSuccess(ctx, inv.globals.json, { vehicle: vehicleToView(db, vehicle), rules, count: rules.length }, (target, value) => {
      renderRuleTable(target, value.rules);
    });
  }
};
var ruleSet = {
  path: ["maintenance", "rule", "set"],
  summary: "\u8BBE\u7F6E\u6BCF\u8F66\u4FDD\u517B\u89C4\u5219\uFF08\u8986\u76D6\u76EE\u5F55\u9ED8\u8BA4\u503C\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "item",
      valueName: "CODE",
      required: true,
      description: "\u9879\u76EE\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D"
    },
    { name: "interval-km", valueName: "KM", description: "\u516C\u91CC\u95F4\u9694" },
    {
      name: "interval-months",
      valueName: "M",
      description: "\u65F6\u95F4\u95F4\u9694\uFF08\u6574\u6570\u6708\uFF09"
    },
    {
      name: "baseline-mileage",
      valueName: "KM",
      description: "\u65E0\u4FDD\u517B\u8BB0\u5F55\u65F6\u7684\u57FA\u7EBF\u91CC\u7A0B"
    },
    {
      name: "baseline-date",
      valueName: "DT",
      description: "\u65E0\u4FDD\u517B\u8BB0\u5F55\u65F6\u7684\u57FA\u7EBF\u65E5\u671F"
    },
    { name: "disable", boolean: true, description: "\u8FD9\u8F86\u8F66\u4E0D\u8FFD\u8E2A\u8BE5\u9879\u76EE" }
  ],
  examples: [
    "carlog maintenance rule set --car 1 --item engine_oil --interval-km 5000 --interval-months 6",
    "carlog maintenance rule set --car 1 --item engine_oil --baseline-mileage 10000 --baseline-date 2026-01-01"
  ],
  outputFields: ["data.vehicle", "data.item", "data.rule"],
  errorCodes: [
    "INVALID_ARGUMENT",
    "MAINTENANCE_ITEM_UNKNOWN",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const item = resolveMaintenanceItemOrThrow(db, requireStringFlag("item", getStringFlag(inv, "item")));
    const intervalKm = parseNumberFlag("interval-km", getStringFlag(inv, "interval-km"), { positive: true });
    const intervalMonths = parseNumberFlag("interval-months", getStringFlag(inv, "interval-months"), { integer: true, positive: true });
    const baselineMileage = parseNumberFlag("baseline-mileage", getStringFlag(inv, "baseline-mileage"), { min: 0 });
    const baselineDateRaw = getStringFlag(inv, "baseline-date");
    const baselineDatetime = baselineDateRaw !== undefined ? parseDatetimeFlag("baseline-date", baselineDateRaw, ctx.now) : undefined;
    setMaintenanceRule(db, {
      vehicle_id: vehicle.id,
      item_id: item.id,
      interval_km: intervalKm,
      interval_months: intervalMonths,
      baseline_mileage: baselineMileage,
      baseline_datetime: baselineDatetime,
      disable: getBooleanFlag(inv, "disable")
    }, ctx.now);
    const rule = buildRuleView(db, vehicle, item, ctx.now);
    emitSuccess(ctx, inv.globals.json, { vehicle: vehicleToView(db, vehicle), item: itemToView(item), rule }, (target, value) => {
      writeLine(target, `\u89C4\u5219\u5DF2\u66F4\u65B0: ${value.rule.name} (${value.rule.item}) ` + `${formatInterval(value.rule.interval_km, value.rule.interval_months)}` + `\uFF08${SOURCE_LABELS[value.rule.source]}\uFF09`);
    });
  }
};
var ruleUnset = {
  path: ["maintenance", "rule", "unset"],
  summary: "\u5220\u9664\u6BCF\u8F66\u8986\u76D6\uFF0C\u56DE\u5230\u76EE\u5F55\u9ED8\u8BA4\u503C",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "item",
      valueName: "CODE",
      required: true,
      description: "\u9879\u76EE\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D"
    }
  ],
  examples: [
    "carlog maintenance rule unset --car 1 --item battery"
  ],
  outputFields: ["data.vehicle", "data.item", "data.removed", "data.rule"],
  errorCodes: [
    "MAINTENANCE_ITEM_UNKNOWN",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const item = resolveMaintenanceItemOrThrow(db, requireStringFlag("item", getStringFlag(inv, "item")));
    const removed = unsetMaintenanceRule(db, vehicle.id, item.id);
    const rule = buildRuleView(db, vehicle, item, ctx.now);
    emitSuccess(ctx, inv.globals.json, {
      vehicle: vehicleToView(db, vehicle),
      item: itemToView(item),
      removed,
      rule
    }, (target, value) => {
      writeLine(target, value.removed ? `\u5DF2\u53D6\u6D88 ${value.rule.name} (${value.rule.item}) \u7684\u672C\u8F66\u8986\u76D6\uFF0C\u56DE\u5230\u76EE\u5F55\u9ED8\u8BA4` : `${value.rule.name} (${value.rule.item}) \u6CA1\u6709\u672C\u8F66\u8986\u76D6\uFF0C\u4F7F\u7528\u76EE\u5F55\u9ED8\u8BA4`);
    });
  }
};
var maintenanceCommands = [
  add4,
  update4,
  remove4,
  list4,
  status,
  since,
  itemList,
  itemAdd,
  itemUpdate,
  ruleList,
  ruleSet,
  ruleUnset
];

// src/cli/commands/remind.ts
var STATUS_LABELS5 = {
  overdue: "\u5DF2\u903E\u671F",
  due_soon: "\u5373\u5C06\u5230\u671F",
  ok: "\u6B63\u5E38",
  unknown: "\u672A\u77E5"
};
function formatRemainingKm(value) {
  if (value === null)
    return "-";
  return `${value.toLocaleString("zh-CN")} km`;
}
function formatRemainingDays(value) {
  if (value === null)
    return "-";
  return `${value} \u5929`;
}
function formatDue2(mileage, datetime) {
  const parts = [];
  if (mileage !== null)
    parts.push(`${mileage.toLocaleString("zh-CN")} km`);
  if (datetime !== null)
    parts.push(datetime);
  return parts.length > 0 ? parts.join(" / ") : "-";
}
var remind = {
  path: ["remind"],
  summary: "\u67E5\u770B\u4FDD\u517B\u63D0\u9192\uFF08\u6309\u7D27\u6025\u7A0B\u5EA6\u6392\u5E8F\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "item",
      valueName: "CODE",
      description: "\u53EA\u770B\u4E00\u4E2A\u9879\u76EE\uFF08\u4EE3\u7801\u3001\u540D\u79F0\u6216\u522B\u540D\uFF09"
    },
    {
      name: "status",
      valueName: "overdue|due_soon|ok|unknown",
      description: "\u6309\u72B6\u6001\u7CBE\u786E\u8FC7\u6EE4"
    }
  ],
  examples: [
    "carlog remind",
    "carlog remind --status overdue --json",
    "carlog remind --item engine_oil --json"
  ],
  outputFields: [
    "data.vehicle",
    "data.reminders",
    "data.counts.overdue",
    "data.counts.due_soon",
    "data.counts.ok",
    "data.counts.unknown",
    "data.count"
  ],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS", "MAINTENANCE_ITEM_UNKNOWN"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const itemToken = getStringFlag(inv, "item");
    const item = itemToken !== undefined ? resolveMaintenanceItemOrThrow(db, itemToken) : undefined;
    const status2 = parseEnumFlag("status", getStringFlag(inv, "status"), [
      "overdue",
      "due_soon",
      "ok",
      "unknown"
    ]);
    let reminders = getVehicleReminders(db, vehicle.id, { now: ctx.now });
    if (item !== undefined) {
      reminders = reminders.filter((reminder) => reminder.item === item.code);
    }
    if (status2 !== undefined) {
      reminders = reminders.filter((reminder) => reminder.status === status2);
    }
    const counts = countReminderStatuses(reminders);
    emitSuccess(ctx, inv.globals.json, {
      vehicle: vehicleToView(db, vehicle),
      reminders,
      counts,
      count: reminders.length
    }, (target, data) => {
      if (data.reminders.length === 0) {
        writeLine(target, "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4FDD\u517B\u63D0\u9192");
        return;
      }
      writeLine(target, table(["\u9879\u76EE", "\u72B6\u6001", "\u5269\u4F59\u91CC\u7A0B", "\u5269\u4F59\u5929\u6570", "\u4E0B\u6B21\u5230\u671F"], data.reminders.map((reminder) => [
        `${reminder.name} (${reminder.item})`,
        STATUS_LABELS5[reminder.status],
        formatRemainingKm(reminder.remaining_km),
        formatRemainingDays(reminder.remaining_days),
        formatDue2(reminder.next_due_mileage, reminder.next_due_datetime)
      ])));
      writeLine(target, `\u903E\u671F ${data.counts.overdue} \u9879\uFF0C\u5373\u5C06\u5230\u671F ${data.counts.due_soon} \u9879\uFF0C` + `\u6B63\u5E38 ${data.counts.ok} \u9879\uFF0C\u672A\u77E5 ${data.counts.unknown} \u9879`);
    });
  }
};
var remindCommands = [remind];

// src/cli/commands/settings.ts
var get = {
  path: ["settings", "get"],
  summary: "\u8BFB\u53D6\u63D0\u9192\u9608\u503C\u8BBE\u7F6E\uFF08due_soon_km / due_soon_days\uFF09",
  flags: [
    {
      name: "key",
      valueName: "KEY",
      required: true,
      description: "\u8BBE\u7F6E\u9879\uFF1Adue_soon_km \u6216 due_soon_days"
    }
  ],
  examples: [
    "carlog settings get --key due_soon_km",
    "carlog settings get --key due_soon_days --json"
  ],
  outputFields: ["data.setting.key", "data.setting.value"],
  errorCodes: ["INVALID_ARGUMENT"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const key = requireStringFlag("key", getStringFlag(inv, "key"));
    const value = getDueSoonSetting(db, key);
    emitSuccess(ctx, inv.globals.json, { setting: { key, value } }, (target, data) => {
      writeLine(target, `${data.setting.key}: ${data.setting.value}`);
    });
  }
};
var set = {
  path: ["settings", "set"],
  summary: "\u66F4\u65B0\u63D0\u9192\u9608\u503C\u8BBE\u7F6E\uFF08\u53EA\u652F\u6301\u6B63\u6574\u6570\uFF09",
  flags: [
    {
      name: "key",
      valueName: "KEY",
      required: true,
      description: "\u8BBE\u7F6E\u9879\uFF1Adue_soon_km \u6216 due_soon_days"
    },
    {
      name: "value",
      valueName: "N",
      required: true,
      description: "\u6B63\u6574\u6570\u9608\u503C"
    }
  ],
  examples: [
    "carlog settings set --key due_soon_km --value 600",
    "carlog settings set --key due_soon_days --value 45 --json"
  ],
  outputFields: ["data.setting.key", "data.setting.value"],
  errorCodes: ["INVALID_ARGUMENT"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const key = requireStringFlag("key", getStringFlag(inv, "key"));
    const value = requireNumberFlag("value", getStringFlag(inv, "value"), {
      integer: true,
      positive: true
    });
    const stored = setDueSoonSetting(db, key, value);
    emitSuccess(ctx, inv.globals.json, { setting: { key, value: stored } }, (target, data) => {
      writeLine(target, `\u5DF2\u8BBE\u7F6E ${data.setting.key} = ${data.setting.value}`);
    });
  }
};
var settingsCommands = [get, set];

// src/cli/commands/stats.ts
function parsePeriodOptions(inv) {
  return {
    from: getStringFlag(inv, "from"),
    to: getStringFlag(inv, "to"),
    year: parseNumberFlag("year", getStringFlag(inv, "year"), {
      integer: true,
      min: 1970,
      max: 9999
    }),
    month: parseNumberFlag("month", getStringFlag(inv, "month"), {
      integer: true,
      min: 1,
      max: 12
    })
  };
}
function periodLabel(period) {
  if (period.year !== null && period.month !== null) {
    return `${period.year}\u5E74${period.month}\u6708`;
  }
  if (period.year !== null)
    return `${period.year}\u5E74`;
  if (period.from !== null || period.to !== null) {
    return `${period.from ?? "\u6700\u65E9"} ~ ${period.to ?? "\u81F3\u4ECA"}`;
  }
  return "\u5168\u90E8\u65F6\u95F4";
}
function renderWarnings4(ctx, warnings) {
  for (const warning3 of warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
}
function renderTotals(ctx, totals) {
  writeLine(ctx, `\u603B\u8BA1: ${formatCurrency(totals.total)}` + `\uFF08\u71C3\u6CB9 ${formatCurrency(totals.fuel)} / \u4FDD\u517B ${formatCurrency(totals.maintenance)}` + ` / \u5176\u4ED6 ${formatCurrency(totals.other)}\uFF09`);
  if (totals.distance === null) {
    writeLine(ctx, "\u8DDD\u79BB: \u672A\u77E5\uFF08\u7F3A\u5C11\u91CC\u7A0B\u57FA\u7EBF\uFF09");
  } else if (totals.distance === 0) {
    writeLine(ctx, "\u8DDD\u79BB: 0 km\uFF08\u6BCF\u516C\u91CC\u6210\u672C\u65E0\u6CD5\u8BA1\u7B97\uFF09");
  } else {
    writeLine(ctx, `\u8DDD\u79BB: ${totals.distance.toLocaleString("zh-CN")} km\uFF1B` + `\u7EFC\u5408\u6210\u672C/\u516C\u91CC: ${totals.total_cost_per_km?.toFixed(3)} \u5143`);
    writeLine(ctx, `\u71C3\u6CB9\u73B0\u91D1\u652F\u51FA/\u516C\u91CC: ${totals.fuel_spent_per_km?.toFixed(3)} \u5143\uFF1B` + `\u71C3\u6CB9\u6D88\u8017\u6210\u672C/\u516C\u91CC\uFF08\u5206\u6BB5\uFF09: ${totals.fuel_consumption_cost_per_km?.toFixed(3) ?? "-"} \u5143`);
    writeLine(ctx, `\u4FDD\u517B/\u516C\u91CC: ${totals.maintenance_spent_per_km?.toFixed(3)} \u5143\uFF1B` + `\u5176\u4ED6/\u516C\u91CC: ${totals.other_spent_per_km?.toFixed(3)} \u5143`);
  }
  if (totals.daily_average !== null) {
    writeLine(ctx, `\u65E5\u5747: ${formatCurrency(totals.daily_average)}` + (totals.days !== null ? `\uFF08${totals.days} \u5929\uFF09` : ""));
  }
}
function categoryRows(rows) {
  return rows.map((row) => [row.label, row.amount.toFixed(2)]);
}
function monthRows(rows) {
  return rows.map((row) => [
    row.month,
    row.fuel.toFixed(2),
    row.maintenance.toFixed(2),
    row.other.toFixed(2),
    row.total.toFixed(2)
  ]);
}
var expenses = {
  path: ["stats", "expenses"],
  summary: "\u7EFC\u5408\u5F00\u9500\u7EDF\u8BA1\uFF08\u71C3\u6CB9\u3001\u4FDD\u517B\u3001\u6742\u8D39\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "year", valueName: "YEAR", description: "\u5E74\u4EFD\uFF0C\u5982 2026" },
    { name: "month", valueName: "MONTH", description: "\u6708\u4EFD\uFF08\u5FC5\u987B\u4E0E --year \u540C\u7528\uFF09" },
    {
      name: "group-by",
      valueName: "category|month",
      description: "\u5206\u7EC4\u65B9\u5F0F\uFF0C\u9ED8\u8BA4 category"
    }
  ],
  examples: [
    "carlog stats expenses --car 1 --year 2026",
    "carlog stats expenses --car \u601D\u57DF --year 2026 --group-by month --json"
  ],
  outputFields: [
    "data.period",
    "data.totals.fuel",
    "data.totals.maintenance",
    "data.totals.other",
    "data.totals.total",
    "data.totals.distance",
    "data.totals.total_cost_per_km",
    "data.totals.fuel_spent_per_km",
    "data.totals.fuel_consumption_cost_per_km",
    "data.by_category",
    "data.by_month",
    "data.group_by",
    "data.groups",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const groupBy = parseEnumFlag("group-by", getStringFlag(inv, "group-by"), [
      "category",
      "month"
    ]) ?? "category";
    const stats = computeExpenseStats(db, vehicle.id, {
      ...parsePeriodOptions(inv),
      groupBy
    });
    const data = { vehicle: vehicleToView(db, vehicle), ...stats };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings4(target, value.warnings);
      writeLine(target, `\u8D39\u7528\u7EDF\u8BA1 (${periodLabel(value.period)}):`);
      renderTotals(target, value.totals);
      writeLine(target, "");
      if (value.group_by === "month") {
        writeLine(target, table(["\u6708\u4EFD", "\u71C3\u6CB9", "\u4FDD\u517B", "\u5176\u4ED6", "\u5408\u8BA1"], monthRows(value.by_month)));
      } else {
        writeLine(target, table(["\u5206\u7C7B", "\u91D1\u989D(\u5143)"], categoryRows(value.by_category)));
      }
    });
  }
};
var fuel = {
  path: ["stats", "fuel"],
  summary: "\u6CB9\u8017\u7EDF\u8BA1\uFF08\u4E0E refuel consumption \u540C\u4E00\u5F15\u64CE\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" }
  ],
  examples: ["carlog stats fuel --car 1", "carlog stats fuel --car \u601D\u57DF --json"],
  outputFields: [
    "data.period",
    "data.segments",
    "data.latest_segment",
    "data.overall",
    "data.pending",
    "data.unmeasured_partials",
    "data.warnings",
    "data.confidence"
  ],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS", "INVALID_ARGUMENT"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const period = resolvePeriod({
      from: getStringFlag(inv, "from"),
      to: getStringFlag(inv, "to")
    });
    const summary2 = computeVehicleFuelSummary(db, vehicle.id, {
      currentMileage: getCurrentMileage(db, vehicle.id),
      tankCapacityL: vehicle.tank_capacity_l,
      from: period.from ?? undefined,
      to: period.to ?? undefined
    });
    const data = { vehicle: vehicleToView(db, vehicle), period, ...summary2 };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings4(target, value.warnings);
      writeLine(target, `\u6CB9\u8017\u7EDF\u8BA1 (${periodLabel(value.period)}):`);
      if (value.segments.length === 0) {
        writeLine(target, "\u6CA1\u6709\u5DF2\u95ED\u5408\u7684\u52A0\u6EE1\u5230\u52A0\u6EE1\u5206\u6BB5\u3002");
        return;
      }
      writeLine(target, table(["\u65F6\u6BB5", "\u91CC\u7A0B\u8303\u56F4(km)", "\u884C\u9A76(km)", "\u6CB9\u91CF(L)", "\u82B1\u8D39(\u5143)", "L/100km", "\u5143/km"], value.segments.map((segment) => [
        `${segment.from_datetime} -> ${segment.to_datetime}`,
        `${segment.from_mileage} -> ${segment.to_mileage}`,
        segment.distance,
        segment.liters.toFixed(2),
        formatCurrency(segment.cost),
        segment.l_per_100km.toFixed(2),
        segment.cost_per_km.toFixed(3)
      ])));
      if (value.overall) {
        writeLine(target, `\u7EFC\u5408\u5E73\u5747: ${value.overall.l_per_100km.toFixed(2)} L/100km\uFF0C` + `${value.overall.cost_per_km.toFixed(3)} \u5143/km\uFF08\u7F6E\u4FE1\u5EA6 ${value.confidence}\uFF09`);
      }
    });
  }
};
var mileage = {
  path: ["stats", "mileage"],
  summary: "\u91CC\u7A0B\u7EDF\u8BA1\uFF08\u671F\u95F4\u8DDD\u79BB\u3001\u65E5\u5747/\u6708\u5747\u3001\u6309\u6708\u62C6\u5206\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "year", valueName: "YEAR", description: "\u5E74\u4EFD\uFF0C\u5982 2026" },
    { name: "month", valueName: "MONTH", description: "\u6708\u4EFD\uFF08\u5FC5\u987B\u4E0E --year \u540C\u7528\uFF09" },
    {
      name: "group-by",
      valueName: "month",
      description: "\u5206\u7EC4\u65B9\u5F0F\uFF08\u4EC5\u652F\u6301 month\uFF09"
    }
  ],
  examples: [
    "carlog stats mileage --car 1 --year 2026",
    "carlog stats mileage --car \u601D\u57DF --group-by month --json"
  ],
  outputFields: [
    "data.period",
    "data.distance",
    "data.daily_average",
    "data.monthly_average",
    "data.by_month",
    "data.warnings"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const groupBy = parseEnumFlag("group-by", getStringFlag(inv, "group-by"), [
      "month"
    ]) ?? "month";
    const stats = computeMileageStats(db, vehicle.id, {
      ...parsePeriodOptions(inv),
      groupBy
    });
    const data = { vehicle: vehicleToView(db, vehicle), ...stats };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings4(target, value.warnings);
      writeLine(target, `\u91CC\u7A0B\u7EDF\u8BA1 (${periodLabel(value.period)}):`);
      if (value.distance === null) {
        writeLine(target, "\u8DDD\u79BB: \u672A\u77E5\uFF08\u7F3A\u5C11\u91CC\u7A0B\u57FA\u7EBF\uFF09");
      } else {
        writeLine(target, `\u8DDD\u79BB: ${value.distance.toLocaleString("zh-CN")} km\uFF1B` + `\u65E5\u5747 ${value.daily_average?.toFixed(1)} km/\u5929\uFF1B` + `\u6708\u5747 ${value.monthly_average?.toFixed(1)} km/\u6708`);
      }
      if (value.by_month.length > 0) {
        writeLine(target, table(["\u6708\u4EFD", "\u8DDD\u79BB(km)", "\u5929\u6570", "\u65E5\u5747(km)"], value.by_month.map((row) => [
          row.month,
          row.distance.toLocaleString("zh-CN"),
          row.days,
          row.daily_average.toFixed(1)
        ])));
      }
    });
  }
};
var currentMileage = {
  path: ["stats", "current-mileage"],
  summary: "\u67E5\u770B\u5F53\u524D\u91CC\u7A0B\uFF08\u539F\u751F JSON\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" }
  ],
  examples: [
    "carlog stats current-mileage --car 1",
    "carlog stats current-mileage --car \u601D\u57DF --json"
  ],
  outputFields: [
    "data.vehicle",
    "data.current_mileage",
    "data.current_mileage_datetime",
    "data.source"
  ],
  errorCodes: ["VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const info = getCurrentMileageInfo(db, vehicle.id);
    const data = { vehicle: vehicleToView(db, vehicle), ...info };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.current_mileage === null) {
        writeLine(target, "\u8BE5\u8F66\u8F86\u6682\u65E0\u91CC\u7A0B\u8BB0\u5F55");
      } else {
        writeLine(target, `\u5F53\u524D\u91CC\u7A0B: ${formatMileage(value.current_mileage)}`);
      }
    });
  }
};
var statsCommands = [
  expenses,
  fuel,
  mileage,
  currentMileage
];

// src/expenses.ts
function defaultNow4() {
  return new Date;
}
function listExpenseCategories() {
  return EXPENSE_CATEGORY_CODES.map((code) => ({
    code,
    label: EXPENSE_CATEGORY_LABELS[code]
  }));
}
function parseExpenseCategory(raw) {
  const value = raw.trim().toLowerCase();
  if (EXPENSE_CATEGORY_CODES.includes(value)) {
    return value;
  }
  const forbidden = value === "refuel" || value === "maintenance" || value === "inspection";
  const message = forbidden ? `\u300C${raw}\u300D\u4E0D\u662F\u6742\u8D39\u5206\u7C7B\uFF1B\u52A0\u6CB9/\u4FDD\u517B\u8D39\u7528\u8BF7\u7528 refuel add / maintenance add \u8BB0\u5F55\uFF0C` + "\u5E74\u68C0\u7B49\u9879\u76EE\u8BF7\u7528 maintenance add --items" : `\u672A\u77E5\u7684\u6742\u8D39\u5206\u7C7B\u300C${raw}\u300D`;
  throw new DomainError("INVALID_CATEGORY", message, {
    details: {
      category: raw,
      allowed: EXPENSE_CATEGORY_CODES,
      allowed_labels: listExpenseCategories()
    }
  });
}
function expenseToView(expense, options = {}) {
  return {
    id: options.preview === true ? null : expense.id,
    vehicle_id: expense.vehicle_id,
    category: expense.category,
    category_label: EXPENSE_CATEGORY_LABELS[expense.category],
    amount: expense.amount,
    datetime: expense.datetime,
    note: expense.note,
    created_at: expense.created_at,
    updated_at: expense.updated_at
  };
}
function normalizeDatetime(value, now) {
  try {
    return parseDatetime(value, now);
  } catch {
    throw new DomainError("INVALID_ARGUMENT", `\u65F6\u95F4\u683C\u5F0F\u65E0\u6548\uFF1A\u300C${value ?? ""}\u300D\uFF0C\u8BF7\u4F7F\u7528 YYYY-MM-DD \u6216 YYYY-MM-DD HH:MM[:SS]`, { details: { field: "datetime", value: value ?? null } });
  }
}
function shiftMinutes3(datetime, minutes) {
  const base = new Date(datetime.replace(" ", "T"));
  base.setMinutes(base.getMinutes() + minutes);
  return formatNow(() => base);
}
function duplicateError4(expense) {
  return new DomainError("DUPLICATE_RECORD", `\u68C0\u6D4B\u5230\u91CD\u590D\u7684\u6742\u8D39\u8BB0\u5F55 (ID: ${expense.id}, ${expense.datetime}, ` + `${expense.category}, ${expense.amount} \u5143)\uFF1B\u786E\u8BA4\u4E0D\u662F\u91CD\u590D\u63D0\u4EA4\u540E\u52A0 --force`, {
    details: {
      expense_id: expense.id,
      category: expense.category,
      amount: expense.amount,
      datetime: expense.datetime
    }
  });
}
function findDuplicateExpense(db, input) {
  const conditions = [
    "vehicle_id = ?",
    "deleted = 0",
    "category = ?",
    "amount = ?"
  ];
  const params = [
    input.vehicleId,
    input.category,
    input.amount
  ];
  if (input.datetimeProvided) {
    conditions.push("datetime = ?");
    params.push(input.datetime);
  } else {
    conditions.push("datetime >= ?", "datetime <= ?");
    params.push(shiftMinutes3(input.datetime, -DUPLICATE_WINDOW_MINUTES), input.datetime);
  }
  if (input.excludeId !== undefined) {
    conditions.push("id <> ?");
    params.push(input.excludeId);
  }
  return db.query(`SELECT * FROM expenses WHERE ${conditions.join(" AND ")}` + " ORDER BY id DESC LIMIT 1").get(...params) ?? undefined;
}
function getExpenseById(db, id) {
  return db.query("SELECT * FROM expenses WHERE id = ? AND deleted = 0").get(id) ?? undefined;
}
function requireExpense(db, id) {
  const expense = getExpenseById(db, id);
  if (!expense) {
    throw new DomainError("RECORD_NOT_FOUND", `\u6742\u8D39\u8BB0\u5F55\u4E0D\u5B58\u5728 (ID: ${id})`, {
      details: { expense_id: id }
    });
  }
  return expense;
}
function previewExpense(input, category, datetime, note, now) {
  const stamp = formatNow(now);
  return {
    id: 0,
    vehicle_id: input.vehicle_id,
    category,
    amount: input.amount,
    datetime,
    note,
    created_at: stamp,
    updated_at: stamp,
    deleted: 0
  };
}
function createExpense(db, input, options = {}) {
  const now = options.now ?? defaultNow4;
  assertActiveVehicle(db, input.vehicle_id);
  const category = parseExpenseCategory(input.category);
  requirePositive("amount", input.amount);
  const datetime = normalizeDatetime(input.datetime, now);
  const datetimeProvided = options.datetimeProvided ?? (input.datetime !== undefined && input.datetime.trim() !== "");
  const note = input.note ?? null;
  const warnings = [];
  const duplicate = findDuplicateExpense(db, {
    vehicleId: input.vehicle_id,
    category,
    amount: input.amount,
    datetime,
    datetimeProvided
  });
  if (duplicate) {
    if (options.force !== true)
      throw duplicateError4(duplicate);
    warnings.push({
      code: "DUPLICATE_RECORD_FORCED",
      message: `\u5DF2\u7528 --force \u5199\u5165\u7591\u4F3C\u91CD\u590D\u6742\u8D39 (\u539F\u8BB0\u5F55 ID: ${duplicate.id})`,
      details: { duplicate_expense_id: duplicate.id }
    });
  }
  if (options.dryRun === true) {
    return {
      expense: previewExpense(input, category, datetime, note, now),
      warnings,
      dryRun: true
    };
  }
  const stamp = formatNow(now);
  const expense = db.query(`INSERT INTO expenses
         (vehicle_id, category, amount, datetime, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`).get(input.vehicle_id, category, input.amount, datetime, note, stamp, stamp);
  return { expense, warnings, dryRun: false };
}
function updateExpense(db, id, patch, options = {}) {
  const now = options.now ?? defaultNow4;
  const existing = requireExpense(db, id);
  assertActiveVehicle(db, existing.vehicle_id);
  if (Object.keys(patch).length === 0) {
    throw new DomainError("INVALID_ARGUMENT", "\u6CA1\u6709\u8981\u66F4\u65B0\u7684\u5B57\u6BB5", {
      details: { expense_id: id }
    });
  }
  const category = patch.category === undefined ? existing.category : parseExpenseCategory(patch.category);
  const amount = patch.amount ?? existing.amount;
  requirePositive("amount", amount);
  const datetime = patch.datetime === undefined ? existing.datetime : normalizeDatetime(patch.datetime, now);
  const note = patch.note === undefined ? existing.note : patch.note;
  if (options.dryRun === true) {
    return {
      expense: {
        ...existing,
        category,
        amount,
        datetime,
        note,
        updated_at: formatNow(now)
      },
      warnings: [],
      dryRun: true
    };
  }
  const expense = db.query(`UPDATE expenses
         SET category = ?, amount = ?, datetime = ?, note = ?, updated_at = ?
       WHERE id = ? AND deleted = 0
       RETURNING *`).get(category, amount, datetime, note, formatNow(now), id);
  return { expense, warnings: [], dryRun: false };
}
function deleteExpense(db, id, now = defaultNow4) {
  const expense = requireExpense(db, id);
  const updatedAt = formatNow(now);
  db.query("UPDATE expenses SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0").run(updatedAt, id);
  return { ...expense, deleted: 1, updated_at: updatedAt };
}
function listExpenses(db, vehicleId, options = {}) {
  const conditions = ["vehicle_id = ?", "deleted = 0"];
  const params = [vehicleId];
  if (options.category !== undefined) {
    conditions.push("category = ?");
    params.push(parseExpenseCategory(options.category));
  }
  if (options.from !== undefined) {
    conditions.push("datetime >= ?");
    params.push(options.from);
  }
  if (options.to !== undefined) {
    conditions.push("datetime <= ?");
    params.push(options.to);
  }
  const order = options.order === "asc" ? "ASC" : "DESC";
  let sql = `SELECT * FROM expenses WHERE ${conditions.join(" AND ")}` + ` ORDER BY datetime ${order}, id ${order}`;
  if (options.limit !== undefined)
    sql += " LIMIT ?";
  const statement = db.query(sql);
  if (options.limit !== undefined) {
    return statement.all(...params, options.limit);
  }
  return statement.all(...params);
}

// src/cli/commands/expense.ts
function allTimeTotals(db, vehicleId) {
  return computeExpenseStats(db, vehicleId).totals;
}
function renderWarnings5(ctx, warnings) {
  for (const warning3 of warnings) {
    ctx.stderr(`\u8B66\u544A: ${warning3.message}
`);
  }
}
function renderTotals2(ctx, totals) {
  writeLine(ctx, `\u672C\u671F\u5408\u8BA1: ${formatCurrency(totals.total)}` + `\uFF08\u71C3\u6CB9 ${formatCurrency(totals.fuel)} / \u4FDD\u517B ${formatCurrency(totals.maintenance)}` + ` / \u5176\u4ED6 ${formatCurrency(totals.other)}\uFF09`);
}
function parseDateBound5(flag, raw, endOfDay, now) {
  if (raw === undefined)
    return;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 23:59:59`;
  }
  return parseDatetimeFlag(flag, raw, now);
}
var add5 = {
  path: ["expense", "add"],
  summary: "\u6DFB\u52A0\u6742\u8D39\uFF08\u4FDD\u9669\u3001\u505C\u8F66\u3001\u8DEF\u6865\u3001\u6D17\u8F66\u3001\u76EE\u5F55\u5916\u7EF4\u4FEE\u3001\u7A0E\u8D39\u3001\u7F5A\u6B3E\u3001\u5176\u4ED6\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "category",
      valueName: "CATEGORY",
      required: true,
      description: "\u6742\u8D39\u5206\u7C7B\u4EE3\u7801"
    },
    {
      name: "amount",
      valueName: "YUAN",
      required: true,
      description: "\u91D1\u989D\uFF08\u5143\uFF0C\u5FC5\u987B\u5927\u4E8E 0\uFF09"
    },
    { name: "datetime", valueName: "DT", description: "\u53D1\u751F\u65F6\u95F4\uFF0C\u9ED8\u8BA4\u5F53\u524D\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u5907\u6CE8" },
    { name: "force", boolean: true, description: "\u8DF3\u8FC7\u91CD\u590D\u68C0\u6D4B" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" }
  ],
  examples: [
    "carlog expense add --category insurance --amount 4500 --datetime 2026-01-01",
    "carlog expense add --category parking --amount 50 --json"
  ],
  outputFields: [
    "data.vehicle",
    "data.expense",
    "data.totals.fuel",
    "data.totals.maintenance",
    "data.totals.other",
    "data.totals.total",
    "data.warnings",
    "data.dry_run"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "INVALID_CATEGORY",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS",
    "DUPLICATE_RECORD"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const category = requireStringFlag("category", getStringFlag(inv, "category"));
    const amount = requireNumberFlag("amount", getStringFlag(inv, "amount"), { positive: true });
    const datetimeRaw = getStringFlag(inv, "datetime");
    const datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    const result = createExpense(db, {
      vehicle_id: vehicle.id,
      category,
      amount,
      datetime,
      note: getStringFlag(inv, "note")
    }, {
      now: ctx.now,
      force: getBooleanFlag(inv, "force"),
      dryRun: getBooleanFlag(inv, "dry-run"),
      datetimeProvided: datetimeRaw !== undefined
    });
    const data = {
      vehicle: vehicleToView(db, vehicle),
      expense: expenseToView(result.expense, { preview: result.dryRun }),
      totals: allTimeTotals(db, vehicle.id),
      warnings: result.warnings,
      dry_run: result.dryRun
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings5(target, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u6742\u8D39\u5DF2${value.dry_run ? "\u51C6\u5907" : "\u4FDD\u5B58"} (ID: ${value.expense.id ?? "-"}): ` + `${value.expense.category_label} ${formatCurrency(value.expense.amount)}` + ` (${value.expense.datetime})`);
      renderTotals2(target, value.totals);
    });
  }
};
var list5 = {
  path: ["expense", "list"],
  summary: "\u5217\u51FA\u6742\u8D39\u8BB0\u5F55",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    { name: "category", valueName: "CATEGORY", description: "\u6309\u5206\u7C7B\u8FC7\u6EE4" },
    { name: "from", valueName: "DT", description: "\u8D77\u59CB\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "to", valueName: "DT", description: "\u7ED3\u675F\u65F6\u95F4\uFF08\u542B\uFF09" },
    { name: "limit", valueName: "N", description: "\u6700\u591A\u8FD4\u56DE\u6761\u6570" }
  ],
  examples: ["carlog expense list --car \u601D\u57DF", "carlog expense list --category parking --json"],
  outputFields: ["data.vehicle", "data.expenses", "data.count", "data.period"],
  errorCodes: [
    "INVALID_CATEGORY",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const category = getStringFlag(inv, "category");
    const from = parseDateBound5("from", getStringFlag(inv, "from"), false, ctx.now);
    const to = parseDateBound5("to", getStringFlag(inv, "to"), true, ctx.now);
    const limit = parseNumberFlag("limit", getStringFlag(inv, "limit"), {
      integer: true,
      positive: true
    });
    const expenses2 = listExpenses(db, vehicle.id, { category, from, to, limit });
    const data = {
      vehicle: vehicleToView(db, vehicle),
      period: { from: from ?? null, to: to ?? null, year: null, month: null },
      expenses: expenses2.map((expense) => expenseToView(expense)),
      count: expenses2.length
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.expenses.length === 0) {
        writeLine(target, "\u6682\u65E0\u6742\u8D39\u8BB0\u5F55");
        return;
      }
      writeLine(target, table(["ID", "\u5206\u7C7B", "\u91D1\u989D(\u5143)", "\u65F6\u95F4", "\u5907\u6CE8"], value.expenses.map((expense) => [
        expense.id,
        expense.category_label,
        expense.amount.toFixed(2),
        expense.datetime,
        expense.note ?? "-"
      ])));
    });
  }
};
var update5 = {
  path: ["expense", "update"],
  summary: "\u66F4\u65B0\u6742\u8D39\u8BB0\u5F55",
  positionals: [{ name: "id", required: true, description: "\u6742\u8D39\u8BB0\u5F55 ID" }],
  flags: [
    { name: "category", valueName: "CATEGORY", description: "\u65B0\u5206\u7C7B" },
    { name: "amount", valueName: "YUAN", description: "\u65B0\u91D1\u989D\uFF08\u5FC5\u987B\u5927\u4E8E 0\uFF09" },
    { name: "datetime", valueName: "DT", description: "\u65B0\u53D1\u751F\u65F6\u95F4" },
    { name: "note", valueName: "NOTE", description: "\u65B0\u5907\u6CE8" },
    { name: "dry-run", boolean: true, description: "\u53EA\u9884\u89C8\uFF0C\u4E0D\u5199\u5E93" }
  ],
  examples: ["carlog expense update 3 --amount 250", "carlog expense update 3 --category toll --json"],
  outputFields: [
    "data.expense",
    "data.totals.fuel",
    "data.totals.maintenance",
    "data.totals.other",
    "data.totals.total",
    "data.dry_run"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "INVALID_CATEGORY",
    "RECORD_NOT_FOUND"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const patch = {};
    const categoryRaw = getStringFlag(inv, "category");
    if (categoryRaw !== undefined)
      patch.category = categoryRaw;
    const amountRaw = getStringFlag(inv, "amount");
    if (amountRaw !== undefined) {
      patch.amount = requireNumberFlag("amount", amountRaw, { positive: true });
    }
    const datetimeRaw = getStringFlag(inv, "datetime");
    if (datetimeRaw !== undefined) {
      patch.datetime = parseDatetimeFlag("datetime", datetimeRaw, ctx.now);
    }
    const noteRaw = getStringFlag(inv, "note");
    if (noteRaw !== undefined)
      patch.note = noteRaw;
    const result = updateExpense(db, id, patch, {
      now: ctx.now,
      dryRun: getBooleanFlag(inv, "dry-run")
    });
    const vehicle = getVehicleById(db, result.expense.vehicle_id);
    const data = {
      vehicle: vehicleToView(db, vehicle),
      expense: expenseToView(result.expense, { preview: result.dryRun }),
      totals: allTimeTotals(db, vehicle.id),
      warnings: result.warnings,
      dry_run: result.dryRun
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      renderWarnings5(target, value.warnings);
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u6742\u8D39\u5DF2${value.dry_run ? "\u51C6\u5907\u66F4\u65B0" : "\u66F4\u65B0"} (ID: ${value.expense.id ?? "-"}): ` + `${value.expense.category_label} ${formatCurrency(value.expense.amount)}`);
      renderTotals2(target, value.totals);
    });
  }
};
var remove5 = {
  path: ["expense", "delete"],
  summary: "\u5220\u9664\u6742\u8D39\u8BB0\u5F55\uFF08\u8F6F\u5220\u9664\uFF09",
  positionals: [{ name: "id", required: true, description: "\u6742\u8D39\u8BB0\u5F55 ID" }],
  examples: ["carlog expense delete 3"],
  outputFields: ["data.expense", "data.deleted"],
  errorCodes: ["RECORD_NOT_FOUND"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const id = parsePositionalInteger("id", inv.positionals[0]);
    const expense = deleteExpense(db, id, ctx.now);
    const data = {
      expense: expenseToView(expense),
      deleted: true
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      writeLine(target, `\u6742\u8D39\u8BB0\u5F55\u5DF2\u5220\u9664 (ID: ${value.expense.id}): ` + `${value.expense.category_label} ${formatCurrency(value.expense.amount)}`);
    });
  }
};
var categories = {
  path: ["expense", "categories"],
  summary: "\u5217\u51FA\u6742\u8D39\u5206\u7C7B\u548C\u4E2D\u6587\u540D\u79F0",
  examples: ["carlog expense categories", "carlog expense categories --json"],
  outputFields: ["data.categories"],
  errorCodes: ["INTERNAL_ERROR"],
  handler: (ctx, inv) => {
    const data = { categories: listExpenseCategories() };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      writeLine(target, table(["\u4EE3\u7801", "\u540D\u79F0"], value.categories.map((category) => [category.code, category.label])));
    });
  }
};
var expenseCommands = [
  add5,
  list5,
  update5,
  remove5,
  categories
];

// src/cli/commands/delete-all.ts
var RECORD_TYPES = ["mileage", "refuel", "maintenance"];
var TYPE_LABELS = {
  mileage: "\u91CC\u7A0B",
  refuel: "\u52A0\u6CB9",
  maintenance: "\u4FDD\u517B"
};
var deleteAll = {
  path: ["delete-all"],
  summary: "\u6279\u91CF\u5220\u9664\u67D0\u8F86\u8F66\u7684\u8BB0\u5F55\uFF08\u9700\u8981 --yes\uFF09",
  flags: [
    { name: "car", valueName: "CAR", description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C" },
    {
      name: "type",
      valueName: "TYPE",
      description: "\u8BB0\u5F55\u7C7B\u578B\uFF1Amileage/refuel/maintenance\uFF1B\u7701\u7565\u8868\u793A\u5168\u90E8"
    },
    { name: "yes", boolean: true, description: "\u786E\u8BA4\u6279\u91CF\u5220\u9664" }
  ],
  examples: [
    "carlog delete-all --car 1 --type mileage --yes",
    "carlog delete-all --type refuel --yes --json"
  ],
  outputFields: ["data.deleted_count", "data.record_type"],
  errorCodes: [
    "INVALID_ARGUMENT",
    "VEHICLE_NOT_FOUND",
    "VEHICLE_AMBIGUOUS"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const vehicle = resolveVehicle(db, getStringFlag(inv, "car"));
    const recordType = parseEnumFlag("type", getStringFlag(inv, "type"), RECORD_TYPES);
    const yes = getBooleanFlag(inv, "yes");
    const countRow = db.query(`SELECT COUNT(*) AS count FROM records
         WHERE vehicle_id = ? AND deleted = 0` + (recordType === undefined ? "" : " AND record_type = ?")).get(...recordType === undefined ? [vehicle.id] : [vehicle.id, recordType]);
    const count = countRow?.count ?? 0;
    if (count > 0 && !yes) {
      throw new AppError("INVALID_ARGUMENT", `\u8F66\u8F86\u300C${vehicle.name}\u300D\u8FD8\u6709 ${count} \u6761${recordType === undefined ? "" : TYPE_LABELS[recordType]}\u8BB0\u5F55\uFF0C\u8BF7\u52A0 --yes \u786E\u8BA4\u6279\u91CF\u5220\u9664`, {
        hint: "\u6279\u91CF\u5220\u9664\u524D\u8BF7\u52A0 --yes \u786E\u8BA4",
        details: {
          vehicle_id: vehicle.id,
          record_type: recordType ?? null,
          records: count,
          requires_yes: true
        }
      });
    }
    if (count > 0) {
      const updatedAt = formatNow(ctx.now);
      db.query(`UPDATE records SET deleted = 1, updated_at = ?
         WHERE vehicle_id = ? AND deleted = 0` + (recordType === undefined ? "" : " AND record_type = ?")).run(...recordType === undefined ? [updatedAt, vehicle.id] : [updatedAt, vehicle.id, recordType]);
    }
    const data = {
      vehicle: vehicleToView(db, vehicle),
      record_type: recordType ?? null,
      deleted_count: count
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      if (value.deleted_count === 0) {
        writeLine(target, "\u6CA1\u6709\u9700\u8981\u5220\u9664\u7684\u8BB0\u5F55");
        return;
      }
      writeLine(target, `\u5DF2\u5220\u9664 ${value.deleted_count} \u6761${value.record_type === null ? "" : TYPE_LABELS[value.record_type]}\u8BB0\u5F55 (\u8F66\u8F86: ${vehicle.name})`);
    });
  }
};
var deleteAllCommands = [deleteAll];

// src/cli/commands/export.ts
import { writeFileSync } from "fs";
// package.json
var package_default = {
  name: "car-log",
  version: "0.2.0",
  module: "src/index.ts",
  type: "module",
  private: true,
  scripts: {
    dev: "bun run src/index.ts",
    build: "mkdir -p skills/car-log/scripts && bun build --target bun ./src/index.ts --outfile skills/car-log/scripts/carlog.js",
    test: "bun test",
    typecheck: "tsc --noEmit"
  },
  bin: {
    carlog: "src/index.ts"
  },
  devDependencies: {
    "@types/bun": "latest",
    typescript: "^5"
  }
};

// src/version.ts
var CLI_VERSION = package_default.version;

// src/export.ts
var EXPORT_SCHEMA_VERSION = 2;
function invalid4(message, details) {
  throw new DomainError("INVALID_ARGUMENT", message, { details });
}
function selectVehicles(db, car, includeDeleted) {
  const trimmed = car.trim();
  if (trimmed === "") {
    invalid4("\u5BFC\u51FA\u65F6\u5FC5\u987B\u6307\u5B9A --car <\u8F66\u8F86|all>", { field: "car" });
  }
  if (trimmed.toLowerCase() === "all") {
    const where = includeDeleted ? "" : " WHERE deleted = 0";
    return db.query(`SELECT * FROM vehicles${where} ORDER BY id ASC`).all();
  }
  const numericId = /^\d+$/.test(trimmed) ? Number(trimmed) : -1;
  const matches = db.query(`SELECT * FROM vehicles
       WHERE (id = ? OR name = ? OR (plate IS NOT NULL AND plate = ?))
       ORDER BY deleted ASC, id ASC`).all(numericId, trimmed, trimmed);
  const active = matches.filter((vehicle) => vehicle.deleted === 0);
  const scoped = active.length > 0 ? active : includeDeleted ? matches : [];
  if (scoped.length === 0) {
    throw new DomainError("VEHICLE_NOT_FOUND", `\u672A\u627E\u5230\u8F66\u8F86\u300C${trimmed}\u300D`, {
      details: { car: trimmed }
    });
  }
  if (scoped.length > 1) {
    throw new DomainError("VEHICLE_AMBIGUOUS", `\u8F66\u8F86\u300C${trimmed}\u300D\u5339\u914D\u5230 ${scoped.length} \u8F86\uFF0C\u8BF7\u7528\u66F4\u7CBE\u786E\u7684 --car`, {
      details: {
        car: trimmed,
        candidates: scoped.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.plate
        }))
      }
    });
  }
  return scoped;
}
function placeholders(count) {
  return Array.from({ length: count }, () => "?").join(", ");
}
function buildExportDocument(db, options) {
  const includeDeleted = options.includeDeleted === true;
  const vehicles = selectVehicles(db, options.car, includeDeleted);
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const deletedFilter = includeDeleted ? "" : " AND deleted = 0";
  const records = vehicleIds.length === 0 ? [] : db.query(`SELECT * FROM records
             WHERE vehicle_id IN (${placeholders(vehicleIds.length)})${deletedFilter}
             ORDER BY id ASC`).all(...vehicleIds);
  const recordIds = records.map((record) => record.id);
  const maintenance_record_items = recordIds.length === 0 ? [] : db.query(`SELECT record_id, item_id, cost, note
             FROM maintenance_record_items
             WHERE record_id IN (${placeholders(recordIds.length)})
             ORDER BY record_id ASC, item_id ASC`).all(...recordIds);
  const vehicle_maintenance_rules = vehicleIds.length === 0 ? [] : db.query(`SELECT * FROM vehicle_maintenance_rules
             WHERE vehicle_id IN (${placeholders(vehicleIds.length)})
             ORDER BY id ASC`).all(...vehicleIds);
  const expenses2 = vehicleIds.length === 0 ? [] : db.query(`SELECT * FROM expenses
             WHERE vehicle_id IN (${placeholders(vehicleIds.length)})${deletedFilter}
             ORDER BY id ASC`).all(...vehicleIds);
  const maintenance_items = db.query("SELECT * FROM maintenance_items ORDER BY id ASC").all();
  const settings = db.query(`SELECT key, value FROM settings
       WHERE key NOT LIKE 'idempotency:%'
       ORDER BY key ASC`).all();
  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    db_schema_version: DB_SCHEMA_VERSION,
    cli_version: CLI_VERSION,
    exported_at: formatNow(options.now ?? (() => new Date)),
    vehicles,
    records,
    maintenance_items,
    maintenance_record_items,
    vehicle_maintenance_rules,
    expenses: expenses2,
    settings
  };
}
function countExportDocument(document) {
  return {
    vehicles: document.vehicles.length,
    records: document.records.length,
    items: document.maintenance_items.length,
    links: document.maintenance_record_items.length,
    rules: document.vehicle_maintenance_rules.length,
    expenses: document.expenses.length,
    settings: document.settings.length
  };
}

// src/cli/commands/export.ts
function renderCounts(counts) {
  return `\u8F66\u8F86 ${counts.vehicles}\uFF0C\u8BB0\u5F55 ${counts.records}\uFF0C\u4FDD\u517B\u9879\u76EE ${counts.items}\uFF0C` + `\u9879\u76EE\u5173\u8054 ${counts.links}\uFF0C\u89C4\u5219 ${counts.rules}\uFF0C\u6742\u8D39 ${counts.expenses}\uFF0C` + `\u8BBE\u7F6E ${counts.settings}`;
}
var exportCommand = {
  path: ["export"],
  summary: "\u5BFC\u51FA\u8F66\u8F86\u3001\u8BB0\u5F55\u3001\u9879\u76EE\u76EE\u5F55\u3001\u89C4\u5219\u3001\u6742\u8D39\u548C\u8BBE\u7F6E\u4E3A\u7248\u672C\u5316 JSON",
  flags: [
    {
      name: "car",
      valueName: "CAR",
      required: true,
      description: "\u8F66\u8F86 ID\u3001\u540D\u79F0\u3001\u8F66\u724C\uFF0C\u6216 all\uFF08\u5168\u90E8\u5728\u7528\u8F66\u8F86\uFF09"
    },
    {
      name: "output",
      valueName: "FILE",
      description: "\u5199\u5165\u6587\u4EF6\uFF1B\u7701\u7565\u65F6\u628A JSON \u6587\u6863\u8F93\u51FA\u5230 stdout"
    },
    {
      name: "include-deleted",
      boolean: true,
      description: "\u5305\u542B\u8F6F\u5220\u9664\u7684\u8F66\u8F86\u3001\u8BB0\u5F55\u548C\u6742\u8D39"
    }
  ],
  examples: [
    "carlog export --car all --output /tmp/carlog-export.json",
    "carlog export --car \u601D\u57DF --include-deleted --json"
  ],
  outputFields: [
    "data.file",
    "data.counts",
    "data.schema_version",
    "data.db_schema_version"
  ],
  errorCodes: ["INVALID_ARGUMENT", "VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const car = requireStringFlag("car", getStringFlag(inv, "car"));
    const includeDeleted = getBooleanFlag(inv, "include-deleted");
    const output = getStringFlag(inv, "output");
    const document = buildExportDocument(db, {
      car,
      includeDeleted,
      now: ctx.now
    });
    const counts = countExportDocument(document);
    if (output === undefined) {
      ctx.stdout(`${JSON.stringify(document, null, 2)}
`);
      return;
    }
    try {
      writeFileSync(output, `${JSON.stringify(document, null, 2)}
`, "utf8");
    } catch (error) {
      throw new AppError("INVALID_ARGUMENT", `\u65E0\u6CD5\u5199\u5165\u5BFC\u51FA\u6587\u4EF6\u300C${output}\u300D`, {
        details: {
          file: output,
          reason: error instanceof Error ? error.message : String(error)
        }
      });
    }
    const data = {
      file: output,
      counts,
      schema_version: EXPORT_SCHEMA_VERSION,
      db_schema_version: DB_SCHEMA_VERSION
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      writeLine(target, `\u5BFC\u51FA\u5B8C\u6210: ${value.file}`);
      writeLine(target, renderCounts(value.counts));
      writeLine(target, `schema_version: ${value.schema_version} / db_schema_version: ${value.db_schema_version}`);
    });
  }
};
var exportCommands = [exportCommand];

// src/cli/commands/import.ts
import { readFileSync } from "fs";

// src/import.ts
function invalid5(message, details = {}) {
  throw new DomainError("INVALID_ARGUMENT", message, { details });
}
function conflict(message, details = {}) {
  throw new DomainError("IMPORT_CONFLICT", message, {
    hint: "\u68C0\u67E5\u51B2\u7A81\u5BF9\u8C61\uFF1B\u5982\u9700\u6574\u4F53\u8986\u76D6\u5BFC\u51FA\u8303\u56F4\u5185\u7684\u8F66\u8F86\u6570\u636E\uFF0C\u4F7F\u7528 --replace --yes",
    details
  });
}
function asObject(value, context) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid5(`${context} \u5FC5\u987B\u662F\u5BF9\u8C61`);
  }
  return value;
}
function requireArray(root, key) {
  const value = root[key];
  if (!Array.isArray(value)) {
    invalid5(`\u5BFC\u5165\u6587\u4EF6\u7F3A\u5C11\u6570\u7EC4\u300C${key}\u300D`, { field: key });
  }
  return value.map((entry, index) => asObject(entry, `${key}[${index}]`));
}
function requireId(row, field, context) {
  const value = row[field];
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F\u6B63\u6574\u6570`, { field, value: value ?? null });
  }
  return value;
}
function requireString(row, field, context) {
  const value = row[field];
  if (typeof value !== "string" || value.trim() === "") {
    invalid5(`${context} \u7F3A\u5C11\u5B57\u7B26\u4E32\u5B57\u6BB5 ${field}`, { field });
  }
  return value;
}
function optionalString(row, field, context) {
  const value = row[field];
  if (value === undefined || value === null)
    return null;
  if (typeof value !== "string") {
    invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u6216 null`, { field });
  }
  return value;
}
function requireNumber(row, field, context) {
  const value = row[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F\u6570\u5B57`, { field, value: value ?? null });
  }
  return value;
}
function optionalNumber(row, field, context) {
  const value = row[field];
  if (value === undefined || value === null)
    return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F\u6570\u5B57\u6216 null`, { field });
  }
  return value;
}
function flag(row, field, context, fallback) {
  const value = row[field];
  if (value === undefined || value === null)
    return fallback;
  if (value === true || value === 1)
    return 1;
  if (value === false || value === 0)
    return 0;
  invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F 0/1 \u6216\u5E03\u5C14\u503C`, { field });
}
function timestamp(row, field, context, fallback) {
  const value = row[field];
  if (value === undefined || value === null)
    return fallback;
  if (typeof value !== "string" || value.trim() === "") {
    invalid5(`${context} \u7684 ${field} \u5FC5\u987B\u662F\u65F6\u95F4\u5B57\u7B26\u4E32`, { field });
  }
  return value;
}
function oneOf(row, field, context, allowed) {
  const value = requireString(row, field, context);
  if (!allowed.includes(value)) {
    invalid5(`${context} \u7684 ${field} \u65E0\u6548\uFF1A\u300C${value}\u300D`, {
      field,
      value,
      allowed
    });
  }
  return value;
}
function parseDocument(raw, stamp) {
  const root = asObject(raw, "\u5BFC\u5165\u6587\u4EF6");
  if (root.schema_version !== EXPORT_SCHEMA_VERSION || root.db_schema_version !== DB_SCHEMA_VERSION) {
    throw new DomainError("IMPORT_SCHEMA_MISMATCH", `\u5BFC\u5165\u6587\u4EF6\u7684 schema_version=${String(root.schema_version)} / ` + `db_schema_version=${String(root.db_schema_version)}\uFF0C` + `\u5F53\u524D\u652F\u6301 ${EXPORT_SCHEMA_VERSION} / ${DB_SCHEMA_VERSION}`, {
      details: {
        schema_version: root.schema_version ?? null,
        db_schema_version: root.db_schema_version ?? null,
        expected_schema_version: EXPORT_SCHEMA_VERSION,
        expected_db_schema_version: DB_SCHEMA_VERSION
      }
    });
  }
  const vehicles = requireArray(root, "vehicles").map((row, index) => {
    const context = `vehicles[${index}]`;
    const id = requireId(row, "id", context);
    const tank = optionalNumber(row, "tank_capacity_l", context);
    if (tank !== null && tank <= 0) {
      invalid5(`${context} \u7684 tank_capacity_l \u5FC5\u987B\u5927\u4E8E 0`, {
        field: "tank_capacity_l",
        value: tank
      });
    }
    const initialMileage = optionalNumber(row, "initial_mileage", context);
    if (initialMileage !== null && initialMileage < 0) {
      invalid5(`${context} \u7684 initial_mileage \u4E0D\u80FD\u5C0F\u4E8E 0`, {
        field: "initial_mileage",
        value: initialMileage
      });
    }
    return {
      id,
      name: requireString(row, "name", context).trim(),
      plate: optionalString(row, "plate", context),
      tank_capacity_l: tank,
      initial_mileage: initialMileage,
      initial_datetime: optionalString(row, "initial_datetime", context),
      created_at: timestamp(row, "created_at", context, stamp),
      updated_at: timestamp(row, "updated_at", context, stamp),
      deleted: flag(row, "deleted", context, 0)
    };
  });
  const items = requireArray(root, "maintenance_items").map((row, index) => {
    const context = `maintenance_items[${index}]`;
    const intervalKm = optionalNumber(row, "default_interval_km", context);
    if (intervalKm !== null && intervalKm <= 0) {
      invalid5(`${context} \u7684 default_interval_km \u5FC5\u987B\u5927\u4E8E 0`, {
        field: "default_interval_km",
        value: intervalKm
      });
    }
    const intervalMonths = optionalNumber(row, "default_interval_months", context);
    if (intervalMonths !== null && (!Number.isInteger(intervalMonths) || intervalMonths <= 0)) {
      invalid5(`${context} \u7684 default_interval_months \u5FC5\u987B\u662F\u6B63\u6574\u6570`, {
        field: "default_interval_months",
        value: intervalMonths
      });
    }
    return {
      id: requireId(row, "id", context),
      code: requireString(row, "code", context).trim(),
      name: requireString(row, "name", context).trim(),
      aliases: optionalString(row, "aliases", context),
      category: oneOf(row, "category", context, MAINTENANCE_ITEM_CATEGORIES),
      default_interval_km: intervalKm,
      default_interval_months: intervalMonths,
      description: optionalString(row, "description", context),
      is_active: flag(row, "is_active", context, 1),
      created_at: timestamp(row, "created_at", context, stamp),
      updated_at: timestamp(row, "updated_at", context, stamp)
    };
  });
  const records = requireArray(root, "records").map((row, index) => {
    const context = `records[${index}]`;
    const recordType = oneOf(row, "record_type", context, [
      "mileage",
      "refuel",
      "maintenance"
    ]);
    const isFull = flag(row, "is_full", context, 1);
    if (recordType !== "refuel" && isFull !== 1) {
      invalid5(`${context}\uFF1A\u975E\u52A0\u6CB9\u8BB0\u5F55\u5FC5\u987B is_full=1`, { field: "is_full" });
    }
    const fuelLevel = optionalNumber(row, "fuel_level_after", context);
    if (fuelLevel !== null) {
      if (fuelLevel < 0 || fuelLevel > 1) {
        invalid5(`${context} \u7684 fuel_level_after \u5FC5\u987B\u5728 0 \u5230 1 \u4E4B\u95F4`, {
          field: "fuel_level_after",
          value: fuelLevel
        });
      }
      if (recordType !== "refuel" || isFull !== 0) {
        invalid5(`${context}\uFF1A\u53EA\u6709\u672A\u52A0\u6EE1\u7684\u52A0\u6CB9\u8BB0\u5F55\u53EF\u4EE5\u5E26 fuel_level_after`, { field: "fuel_level_after" });
      }
    }
    return {
      id: requireId(row, "id", context),
      vehicle_id: requireId(row, "vehicle_id", context),
      record_type: recordType,
      datetime: requireString(row, "datetime", context),
      mileage: optionalNumber(row, "mileage", context),
      liters: optionalNumber(row, "liters", context),
      cost: optionalNumber(row, "cost", context),
      is_full: isFull,
      fuel_level_after: fuelLevel,
      note: optionalString(row, "note", context),
      created_at: timestamp(row, "created_at", context, stamp),
      updated_at: timestamp(row, "updated_at", context, stamp),
      deleted: flag(row, "deleted", context, 0)
    };
  });
  const links = requireArray(root, "maintenance_record_items").map((row, index) => {
    const context = `maintenance_record_items[${index}]`;
    return {
      record_id: requireId(row, "record_id", context),
      item_id: requireId(row, "item_id", context),
      cost: optionalNumber(row, "cost", context),
      note: optionalString(row, "note", context)
    };
  });
  const rules = requireArray(root, "vehicle_maintenance_rules").map((row, index) => {
    const context = `vehicle_maintenance_rules[${index}]`;
    const intervalKm = optionalNumber(row, "interval_km", context);
    if (intervalKm !== null && intervalKm <= 0) {
      invalid5(`${context} \u7684 interval_km \u5FC5\u987B\u5927\u4E8E 0`, { field: "interval_km" });
    }
    const intervalMonths = optionalNumber(row, "interval_months", context);
    if (intervalMonths !== null && (!Number.isInteger(intervalMonths) || intervalMonths <= 0)) {
      invalid5(`${context} \u7684 interval_months \u5FC5\u987B\u662F\u6B63\u6574\u6570`, {
        field: "interval_months"
      });
    }
    const baselineMileage = optionalNumber(row, "baseline_mileage", context);
    if (baselineMileage !== null && baselineMileage < 0) {
      invalid5(`${context} \u7684 baseline_mileage \u4E0D\u80FD\u5C0F\u4E8E 0`, {
        field: "baseline_mileage"
      });
    }
    return {
      id: requireId(row, "id", context),
      vehicle_id: requireId(row, "vehicle_id", context),
      item_id: requireId(row, "item_id", context),
      interval_km: intervalKm,
      interval_months: intervalMonths,
      baseline_mileage: baselineMileage,
      baseline_datetime: optionalString(row, "baseline_datetime", context),
      enabled: flag(row, "enabled", context, 1),
      created_at: timestamp(row, "created_at", context, stamp),
      updated_at: timestamp(row, "updated_at", context, stamp)
    };
  });
  const expenses2 = requireArray(root, "expenses").map((row, index) => {
    const context = `expenses[${index}]`;
    const amount = requireNumber(row, "amount", context);
    if (amount <= 0) {
      invalid5(`${context} \u7684 amount \u5FC5\u987B\u5927\u4E8E 0`, { field: "amount", value: amount });
    }
    return {
      id: requireId(row, "id", context),
      vehicle_id: requireId(row, "vehicle_id", context),
      category: oneOf(row, "category", context, EXPENSE_CATEGORY_CODES),
      amount,
      datetime: requireString(row, "datetime", context),
      note: optionalString(row, "note", context),
      created_at: timestamp(row, "created_at", context, stamp),
      updated_at: timestamp(row, "updated_at", context, stamp),
      deleted: flag(row, "deleted", context, 0)
    };
  });
  const settings = requireArray(root, "settings").map((row, index) => {
    const context = `settings[${index}]`;
    const key = requireString(row, "key", context);
    if (key.startsWith("idempotency:")) {
      invalid5(`${context}\uFF1Aidempotency:* \u8BBE\u7F6E\u4E0D\u80FD\u5BFC\u5165`, { field: "key" });
    }
    const value = row.value;
    if (typeof value !== "string") {
      invalid5(`${context} \u7684 value \u5FC5\u987B\u662F\u5B57\u7B26\u4E32`, { field: "value" });
    }
    return { key, value };
  });
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  const itemIds = new Set(items.map((item) => item.id));
  const recordById = new Map(records.map((record) => [record.id, record]));
  assertUnique(vehicles, (vehicle) => vehicle.id, "\u8F66\u8F86 id");
  assertUnique(items, (item) => item.id, "\u4FDD\u517B\u9879\u76EE id");
  assertUnique(items, (item) => item.code.toLowerCase(), "\u4FDD\u517B\u9879\u76EE code");
  assertUnique(records, (record) => record.id, "\u8BB0\u5F55 id");
  assertUnique(links, (link) => `${link.record_id}:${link.item_id}`, "\u4FDD\u517B\u9879\u76EE\u5173\u8054");
  assertUnique(rules, (rule) => `${rule.vehicle_id}:${rule.item_id}`, "\u4FDD\u517B\u89C4\u5219");
  assertUnique(expenses2, (expense) => expense.id, "\u6742\u8D39 id");
  assertUnique(settings, (setting) => setting.key, "\u8BBE\u7F6E key");
  for (const record of records) {
    if (!vehicleIds.has(record.vehicle_id)) {
      invalid5(`\u8BB0\u5F55 ${record.id} \u5F15\u7528\u4E86\u5BFC\u51FA\u6587\u4EF6\u4E2D\u4E0D\u5B58\u5728\u7684\u8F66\u8F86 ${record.vehicle_id}`, {
        record_id: record.id,
        vehicle_id: record.vehicle_id
      });
    }
  }
  for (const link of links) {
    const record = recordById.get(link.record_id);
    if (!record) {
      invalid5(`\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8BB0\u5F55 ${link.record_id}`, {
        record_id: link.record_id
      });
    }
    if (record.record_type !== "maintenance") {
      invalid5(`\u9879\u76EE\u5173\u8054\u53EA\u80FD\u6307\u5411\u4FDD\u517B\u8BB0\u5F55\uFF08\u8BB0\u5F55 ${link.record_id}\uFF09`, {
        record_id: link.record_id
      });
    }
    if (!itemIds.has(link.item_id)) {
      invalid5(`\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u4FDD\u517B\u9879\u76EE ${link.item_id}`, {
        item_id: link.item_id
      });
    }
  }
  for (const rule of rules) {
    if (!vehicleIds.has(rule.vehicle_id)) {
      invalid5(`\u4FDD\u517B\u89C4\u5219\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8F66\u8F86 ${rule.vehicle_id}`, {
        vehicle_id: rule.vehicle_id
      });
    }
    if (!itemIds.has(rule.item_id)) {
      invalid5(`\u4FDD\u517B\u89C4\u5219\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u4FDD\u517B\u9879\u76EE ${rule.item_id}`, {
        item_id: rule.item_id
      });
    }
  }
  for (const expense of expenses2) {
    if (!vehicleIds.has(expense.vehicle_id)) {
      invalid5(`\u6742\u8D39\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8F66\u8F86 ${expense.vehicle_id}`, {
        vehicle_id: expense.vehicle_id
      });
    }
  }
  return { vehicles, records, items, links, rules, expenses: expenses2, settings };
}
function assertUnique(rows, keyOf, label) {
  const seen = new Set;
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) {
      invalid5(`\u5BFC\u5165\u6587\u4EF6\u5305\u542B\u91CD\u590D\u7684${label}\uFF1A${String(key)}`, { key });
    }
    seen.add(key);
  }
}
function sameItem(target, row) {
  return target.code === row.code && target.name === row.name && target.aliases === row.aliases && target.category === row.category && target.default_interval_km === row.default_interval_km && target.default_interval_months === row.default_interval_months && target.description === row.description && target.is_active === row.is_active;
}
function sortedEquals(a, b) {
  if (a.length !== b.length)
    return false;
  return a.every((value, index) => value === b[index]);
}
function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left - right);
}
function runTransaction(db, dryRun, work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec(dryRun ? "ROLLBACK" : "COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}
function importDocument(db, raw, options = {}) {
  const stamp = formatNow(options.now ?? (() => new Date));
  const document = parseDocument(raw, stamp);
  const replace = options.replace === true;
  const counts = {
    vehicles: 0,
    records: 0,
    items: 0,
    rules: 0,
    expenses: 0,
    settings: 0,
    skipped: 0,
    replaced: 0
  };
  const apply = () => {
    const vehicleMap = new Map;
    const targetVehicles = db.query("SELECT * FROM vehicles ORDER BY id ASC").all();
    const claimedVehicleIds = new Set;
    for (const row of document.vehicles) {
      const candidates = targetVehicles.filter((candidate2) => candidate2.deleted === row.deleted && (candidate2.name === row.name || row.plate !== null && candidate2.plate === row.plate));
      if (candidates.length > 1) {
        conflict(`\u8F66\u8F86\u300C${row.name}\u300D\u5728\u76EE\u6807\u5E93\u4E2D\u5339\u914D\u5230\u591A\u8F86\uFF08ID: ${candidates.map((candidate2) => candidate2.id).join(", ")}\uFF09\uFF0C\u65E0\u6CD5\u786E\u5B9A\u5408\u5E76\u5BF9\u8C61`, {
          entity: "vehicle",
          export_vehicle_id: row.id,
          name: row.name,
          plate: row.plate,
          candidate_ids: candidates.map((candidate2) => candidate2.id)
        });
      }
      const candidate = candidates[0];
      if (candidate) {
        if (claimedVehicleIds.has(candidate.id)) {
          conflict(`\u5BFC\u51FA\u6587\u4EF6\u4E2D\u7684\u591A\u8F86\u8F66\u6620\u5C04\u5230\u76EE\u6807\u8F66\u8F86 ID ${candidate.id}`, {
            entity: "vehicle",
            export_vehicle_id: row.id,
            target_vehicle_id: candidate.id
          });
        }
        claimedVehicleIds.add(candidate.id);
        vehicleMap.set(row.id, candidate.id);
        counts.skipped += 1;
        continue;
      }
      const inserted = db.query(`INSERT INTO vehicles
             (name, plate, tank_capacity_l, initial_mileage, initial_datetime,
              created_at, updated_at, deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`).get(row.name, row.plate, row.tank_capacity_l, row.initial_mileage, row.initial_datetime, row.created_at, row.updated_at, row.deleted);
      vehicleMap.set(row.id, inserted.id);
      claimedVehicleIds.add(inserted.id);
      targetVehicles.push(inserted);
      counts.vehicles += 1;
    }
    const itemMap = new Map;
    for (const row of document.items) {
      const existing = db.query("SELECT * FROM maintenance_items WHERE code = ? COLLATE NOCASE LIMIT 1").get(row.code);
      if (existing) {
        itemMap.set(row.id, existing.id);
        if (sameItem(existing, row)) {
          counts.skipped += 1;
          continue;
        }
        db.query(`UPDATE maintenance_items
             SET code = ?, name = ?, aliases = ?, category = ?,
                 default_interval_km = ?, default_interval_months = ?,
                 description = ?, is_active = ?, updated_at = ?
           WHERE id = ?`).run(row.code, row.name, row.aliases, row.category, row.default_interval_km, row.default_interval_months, row.description, row.is_active, row.updated_at, existing.id);
        counts.items += 1;
        continue;
      }
      const inserted = db.query(`INSERT INTO maintenance_items
             (code, name, aliases, category, default_interval_km,
              default_interval_months, description, is_active, created_at,
              updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`).get(row.code, row.name, row.aliases, row.category, row.default_interval_km, row.default_interval_months, row.description, row.is_active, row.created_at, row.updated_at);
      itemMap.set(row.id, inserted.id);
      counts.items += 1;
    }
    const targetVehicleIds = sortedUnique([...vehicleMap.values()]);
    if (replace) {
      for (const vehicleId of targetVehicleIds) {
        db.query(`UPDATE records SET deleted = 1, updated_at = ?
           WHERE vehicle_id = ? AND deleted = 0`).run(stamp, vehicleId);
        db.query(`UPDATE expenses SET deleted = 1, updated_at = ?
           WHERE vehicle_id = ? AND deleted = 0`).run(stamp, vehicleId);
        db.query("DELETE FROM vehicle_maintenance_rules WHERE vehicle_id = ?").run(vehicleId);
      }
      counts.replaced = targetVehicleIds.length;
    }
    const recordMap = new Map;
    const linksByRecord = new Map;
    for (const link of document.links) {
      const list6 = linksByRecord.get(link.record_id) ?? [];
      list6.push(link);
      linksByRecord.set(link.record_id, list6);
    }
    const mappedLinkItemIds = (recordExportId) => {
      const links = linksByRecord.get(recordExportId) ?? [];
      return sortedUnique(links.map((link) => {
        const itemId = itemMap.get(link.item_id);
        if (itemId === undefined) {
          invalid5(`\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u4FDD\u517B\u9879\u76EE ${link.item_id}`, {
            item_id: link.item_id
          });
        }
        return itemId;
      }));
    };
    for (const row of document.records) {
      const vehicleId = vehicleMap.get(row.vehicle_id);
      if (vehicleId === undefined) {
        invalid5(`\u8BB0\u5F55 ${row.id} \u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u8F66\u8F86 ${row.vehicle_id}`, {
          record_id: row.id
        });
      }
      if (!replace) {
        const candidates = db.query(`SELECT * FROM records
             WHERE vehicle_id = ? AND record_type = ? AND datetime = ?
               AND mileage IS ? AND liters IS ? AND cost IS ?
             ORDER BY id ASC`).all(vehicleId, row.record_type, row.datetime, row.mileage, row.liters, row.cost);
        const exportItemIds = row.record_type === "maintenance" ? mappedLinkItemIds(row.id) : [];
        const identical = candidates.find((candidate) => {
          if (candidate.is_full !== row.is_full || candidate.fuel_level_after !== row.fuel_level_after || candidate.note !== row.note || candidate.deleted !== row.deleted) {
            return false;
          }
          if (row.record_type !== "maintenance")
            return true;
          const targetItemIds = sortedUnique(db.query("SELECT item_id FROM maintenance_record_items WHERE record_id = ?").all(candidate.id).map((link) => link.item_id));
          return sortedEquals(targetItemIds, exportItemIds);
        });
        if (candidates.length > 0) {
          if (!identical) {
            conflict(`\u8BB0\u5F55 ${row.id}\uFF08${row.record_type} @ ${row.datetime}\uFF09\u4E0E\u76EE\u6807\u5E93\u4E2D\u7684\u8BB0\u5F55 ` + `${candidates[0].id} \u81EA\u7136\u952E\u76F8\u540C\u4F46\u5B57\u6BB5\u6216\u9879\u76EE\u5173\u8054\u4E0D\u540C`, {
              entity: "record",
              export_record_id: row.id,
              target_record_ids: candidates.map((candidate) => candidate.id),
              vehicle_id: vehicleId,
              record_type: row.record_type,
              datetime: row.datetime,
              mileage: row.mileage,
              liters: row.liters,
              cost: row.cost
            });
          }
          recordMap.set(row.id, identical.id);
          counts.skipped += 1;
          continue;
        }
      }
      const inserted = db.query(`INSERT INTO records
             (vehicle_id, record_type, datetime, mileage, liters, cost,
              is_full, fuel_level_after, note, created_at, updated_at, deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id`).get(vehicleId, row.record_type, row.datetime, row.mileage, row.liters, row.cost, row.is_full, row.fuel_level_after, row.note, row.created_at, row.updated_at, row.deleted);
      recordMap.set(row.id, inserted.id);
      counts.records += 1;
    }
    for (const link of document.links) {
      const recordId = recordMap.get(link.record_id);
      if (recordId === undefined) {
        invalid5(`\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u8BB0\u5F55 ${link.record_id}`, {
          record_id: link.record_id
        });
      }
      const itemId = itemMap.get(link.item_id);
      if (itemId === undefined) {
        invalid5(`\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u4FDD\u517B\u9879\u76EE ${link.item_id}`, {
          item_id: link.item_id
        });
      }
      const existing = db.query(`SELECT cost, note FROM maintenance_record_items
           WHERE record_id = ? AND item_id = ?`).get(recordId, itemId);
      if (existing) {
        if (existing.cost === link.cost && existing.note === link.note) {
          counts.skipped += 1;
        } else {
          db.query(`UPDATE maintenance_record_items
             SET cost = ?, note = ?
             WHERE record_id = ? AND item_id = ?`).run(link.cost, link.note, recordId, itemId);
        }
        continue;
      }
      db.query(`INSERT INTO maintenance_record_items (record_id, item_id, cost, note)
         VALUES (?, ?, ?, ?)`).run(recordId, itemId, link.cost, link.note);
    }
    for (const row of document.rules) {
      const vehicleId = vehicleMap.get(row.vehicle_id);
      const itemId = itemMap.get(row.item_id);
      if (vehicleId === undefined || itemId === undefined) {
        invalid5(`\u4FDD\u517B\u89C4\u5219\u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u8F66\u8F86\u6216\u9879\u76EE`, {
          rule_id: row.id,
          vehicle_id: row.vehicle_id,
          item_id: row.item_id
        });
      }
      if (!replace) {
        const existing = db.query(`SELECT * FROM vehicle_maintenance_rules
             WHERE vehicle_id = ? AND item_id = ?`).get(vehicleId, itemId);
        if (existing) {
          if (existing.interval_km === row.interval_km && existing.interval_months === row.interval_months && existing.baseline_mileage === row.baseline_mileage && existing.baseline_datetime === row.baseline_datetime && existing.enabled === row.enabled) {
            counts.skipped += 1;
            continue;
          }
          db.query(`UPDATE vehicle_maintenance_rules
             SET interval_km = ?, interval_months = ?, baseline_mileage = ?,
                 baseline_datetime = ?, enabled = ?, updated_at = ?
             WHERE id = ?`).run(row.interval_km, row.interval_months, row.baseline_mileage, row.baseline_datetime, row.enabled, row.updated_at, existing.id);
          counts.rules += 1;
          continue;
        }
      }
      db.query(`INSERT INTO vehicle_maintenance_rules
           (vehicle_id, item_id, interval_km, interval_months,
            baseline_mileage, baseline_datetime, enabled, created_at,
            updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(vehicleId, itemId, row.interval_km, row.interval_months, row.baseline_mileage, row.baseline_datetime, row.enabled, row.created_at, row.updated_at);
      counts.rules += 1;
    }
    for (const row of document.expenses) {
      const vehicleId = vehicleMap.get(row.vehicle_id);
      if (vehicleId === undefined) {
        invalid5(`\u6742\u8D39\u5F15\u7528\u4E86\u672A\u6620\u5C04\u7684\u8F66\u8F86 ${row.vehicle_id}`, {
          expense_id: row.id
        });
      }
      if (!replace) {
        const existing = db.query(`SELECT * FROM expenses
             WHERE vehicle_id = ? AND category = ? AND amount = ?
               AND datetime = ?
             ORDER BY id ASC LIMIT 1`).get(vehicleId, row.category, row.amount, row.datetime);
        if (existing) {
          if (existing.deleted !== row.deleted) {
            counts.skipped += 1;
            continue;
          }
          if (existing.note === row.note) {
            counts.skipped += 1;
            continue;
          }
          db.query("UPDATE expenses SET note = ?, updated_at = ? WHERE id = ?").run(row.note, row.updated_at, existing.id);
          counts.expenses += 1;
          continue;
        }
      }
      db.query(`INSERT INTO expenses
           (vehicle_id, category, amount, datetime, note, created_at,
            updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(vehicleId, row.category, row.amount, row.datetime, row.note, row.created_at, row.updated_at, row.deleted);
      counts.expenses += 1;
    }
    for (const row of document.settings) {
      const existing = db.query("SELECT value FROM settings WHERE key = ?").get(row.key);
      if (existing?.value === row.value) {
        counts.skipped += 1;
        continue;
      }
      db.query(`INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(row.key, row.value);
      counts.settings += 1;
    }
  };
  runTransaction(db, options.dryRun === true, apply);
  return {
    counts,
    dryRun: options.dryRun === true
  };
}

// src/cli/commands/import.ts
function renderCounts2(counts) {
  return `\u8F66\u8F86 ${counts.vehicles}\uFF0C\u8BB0\u5F55 ${counts.records}\uFF0C\u4FDD\u517B\u9879\u76EE ${counts.items}\uFF0C` + `\u89C4\u5219 ${counts.rules}\uFF0C\u6742\u8D39 ${counts.expenses}\uFF0C\u8BBE\u7F6E ${counts.settings}\uFF0C` + `\u8DF3\u8FC7 ${counts.skipped}` + (counts.replaced > 0 ? `\uFF0C\u66FF\u6362\u8F66\u8F86 ${counts.replaced}` : "");
}
var importCommand = {
  path: ["import"],
  summary: "\u4ECE\u7248\u672C\u5316 JSON \u5408\u5E76\u5BFC\u5165\u8F66\u8F86\u3001\u8BB0\u5F55\u3001\u9879\u76EE\u76EE\u5F55\u3001\u89C4\u5219\u3001\u6742\u8D39\u548C\u8BBE\u7F6E",
  flags: [
    {
      name: "file",
      valueName: "FILE",
      required: true,
      description: "export \u751F\u6210\u7684 JSON \u6587\u4EF6"
    },
    {
      name: "dry-run",
      boolean: true,
      description: "\u6821\u9A8C\u5E76\u8BA1\u7B97\u5408\u5E76\u8BA1\u5212\uFF0C\u4E0D\u5199\u5E93"
    },
    {
      name: "replace",
      boolean: true,
      description: "\u66FF\u6362\u5BFC\u51FA\u8303\u56F4\u5185\u7684\u8F66\u8F86\u6570\u636E\uFF08\u9700\u8981 --yes\uFF09"
    },
    {
      name: "yes",
      boolean: true,
      description: "\u786E\u8BA4 --replace \u7684\u5F71\u54CD\u8303\u56F4"
    }
  ],
  examples: [
    "carlog import --file /tmp/carlog-export.json --dry-run --json",
    "carlog import --file /tmp/carlog-export.json --replace --yes --json"
  ],
  outputFields: [
    "data.file",
    "data.counts",
    "data.dry_run",
    "data.schema_version",
    "data.db_schema_version"
  ],
  errorCodes: [
    "INVALID_ARGUMENT",
    "IMPORT_SCHEMA_MISMATCH",
    "IMPORT_CONFLICT"
  ],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const file = requireStringFlag("file", getStringFlag(inv, "file"));
    const replace = getBooleanFlag(inv, "replace");
    const yes = getBooleanFlag(inv, "yes");
    const dryRun = getBooleanFlag(inv, "dry-run");
    if (replace && !yes) {
      throw new AppError("INVALID_ARGUMENT", "\u4F7F\u7528 --replace \u4F1A\u66FF\u6362\u5BFC\u51FA\u8303\u56F4\u5185\u7684\u8F66\u8F86\u6570\u636E\uFF0C\u5FC5\u987B\u540C\u65F6\u4F20 --yes \u786E\u8BA4", {
        hint: "\u5148\u7528 --dry-run \u9884\u89C8\uFF0C\u786E\u8BA4\u5F71\u54CD\u8303\u56F4\u540E\u52A0 --replace --yes",
        details: { flag: "yes", requires_yes: true }
      });
    }
    let raw;
    try {
      raw = readFileSync(file, "utf8");
    } catch (error) {
      throw new AppError("INVALID_ARGUMENT", `\u65E0\u6CD5\u8BFB\u53D6\u5BFC\u5165\u6587\u4EF6\u300C${file}\u300D`, {
        details: {
          file,
          reason: error instanceof Error ? error.message : String(error)
        }
      });
    }
    let document;
    try {
      document = JSON.parse(raw);
    } catch {
      throw new AppError("INVALID_ARGUMENT", `\u5BFC\u5165\u6587\u4EF6\u4E0D\u662F\u5408\u6CD5 JSON\uFF1A\u300C${file}\u300D`, {
        details: { file }
      });
    }
    const result = importDocument(db, document, {
      dryRun,
      replace,
      now: ctx.now
    });
    const root = document;
    const data = {
      file,
      counts: result.counts,
      dry_run: result.dryRun,
      schema_version: root.schema_version ?? null,
      db_schema_version: root.db_schema_version ?? null
    };
    emitSuccess(ctx, inv.globals.json, data, (target, value) => {
      writeLine(target, `${value.dry_run ? "[\u9884\u89C8] " : ""}\u5BFC\u5165${value.dry_run ? "\u8BA1\u5212" : "\u5B8C\u6210"}: ${value.file}`);
      writeLine(target, renderCounts2(value.counts));
      if (value.dry_run) {
        writeLine(target, "dry-run \u672A\u5199\u5165\u6570\u636E\u5E93");
      }
    });
  }
};
var importCommands = [importCommand];

// src/doctor.ts
var TYPE_LABELS2 = {
  mileage: "\u91CC\u7A0B",
  refuel: "\u52A0\u6CB9",
  maintenance: "\u4FDD\u517B"
};
function formatKm2(value) {
  return value === null ? "-" : value.toLocaleString("zh-CN");
}
function recordEntity(record) {
  return {
    type: "record",
    id: record.id,
    vehicle_id: record.vehicle_id,
    record_type: record.record_type,
    datetime: record.datetime,
    mileage: record.mileage
  };
}
function runDoctor(db, options = {}) {
  const now = options.now ?? (() => new Date);
  const today = options.today ?? formatNow(now).slice(0, 10);
  const vehicleId = options.vehicleId;
  const issues = [];
  const push = (code, severity, message, entity, suggested_command = null) => {
    issues.push({ code, severity, message, entity, suggested_command });
  };
  const vehicleFilter = vehicleId === undefined ? "" : " AND vehicle_id = ?";
  const vehicleParams = vehicleId === undefined ? [] : [vehicleId];
  const activeRecords = db.query(`SELECT * FROM records WHERE deleted = 0${vehicleFilter} ORDER BY id ASC`).all(...vehicleParams);
  for (const record of activeRecords) {
    if (record.record_type === "refuel") {
      if (record.liters === null) {
        push("REFUEL_MISSING_LITERS", "error", `\u52A0\u6CB9\u8BB0\u5F55 ${record.id} \u7F3A\u5C11\u6CB9\u91CF\uFF08liters\uFF09`, recordEntity(record), `refuel update ${record.id} --liters L`);
      } else if (record.liters <= 0) {
        push("NON_POSITIVE_LITERS", "error", `\u52A0\u6CB9\u8BB0\u5F55 ${record.id} \u7684\u6CB9\u91CF\u4E3A ${record.liters} L\uFF0C\u5FC5\u987B\u5927\u4E8E 0`, recordEntity(record), `refuel update ${record.id} --liters L`);
      }
      if (record.mileage === null) {
        push("REFUEL_MISSING_MILEAGE", "error", `\u52A0\u6CB9\u8BB0\u5F55 ${record.id} \u7F3A\u5C11\u91CC\u7A0B\uFF0C\u6CB9\u8017\u5206\u6BB5\u65E0\u6CD5\u8BA1\u7B97`, recordEntity(record), `refuel update ${record.id} --mileage KM`);
      }
    } else if (record.mileage === null) {
      push("RECORD_MISSING_MILEAGE", "error", `${TYPE_LABELS2[record.record_type] ?? record.record_type}\u8BB0\u5F55 ${record.id} \u7F3A\u5C11\u91CC\u7A0B`, recordEntity(record), `${record.record_type} update ${record.id} --mileage KM`);
    }
    if (record.mileage !== null && record.mileage <= 0) {
      push("NON_POSITIVE_MILEAGE", "error", `\u8BB0\u5F55 ${record.id} \u7684\u91CC\u7A0B\u4E3A ${formatKm2(record.mileage)} km\uFF0C\u5FC5\u987B\u5927\u4E8E 0`, recordEntity(record), `${record.record_type} update ${record.id} --mileage KM`);
    }
    if (record.cost !== null && record.cost < 0) {
      push("NEGATIVE_COST", "error", `${TYPE_LABELS2[record.record_type] ?? record.record_type}\u8BB0\u5F55 ${record.id} \u7684\u91D1\u989D\u4E3A\u8D1F\u6570\uFF08${record.cost}\uFF09`, recordEntity(record), `${record.record_type} update ${record.id} --cost YUAN`);
    }
  }
  const ordered = db.query(`SELECT * FROM records
       WHERE deleted = 0 AND mileage IS NOT NULL${vehicleFilter}
       ORDER BY vehicle_id ASC, datetime ASC, id ASC`).all(...vehicleParams);
  let previous;
  for (const record of ordered) {
    if (previous !== undefined && previous.vehicle_id === record.vehicle_id && record.mileage < previous.mileage) {
      push("MILEAGE_ORDER_INCONSISTENCY", "error", `\u8F66\u8F86 ${record.vehicle_id} \u7684\u91CC\u7A0B\u987A\u5E8F\u5F02\u5E38\uFF1A\u8BB0\u5F55 ${record.id}\uFF08${record.datetime}\uFF0C` + `${formatKm2(record.mileage)} km\uFF09\u5C0F\u4E8E\u524D\u4E00\u6761\u8BB0\u5F55 ${previous.id}\uFF08${previous.datetime}\uFF0C` + `${formatKm2(previous.mileage)} km\uFF09`, {
        type: "record_pair",
        vehicle_id: record.vehicle_id,
        record_id: record.id,
        previous_record_id: previous.id,
        record_mileage: record.mileage,
        previous_mileage: previous.mileage
      }, `${record.record_type} update ${record.id} --mileage KM`);
    }
    previous = record;
  }
  const expenseFilter = vehicleId === undefined ? "" : " AND vehicle_id = ?";
  const badExpenses = db.query(`SELECT id, vehicle_id, amount FROM expenses
       WHERE deleted = 0 AND amount <= 0${expenseFilter} ORDER BY id ASC`).all(...vehicleParams);
  for (const expense of badExpenses) {
    push("NEGATIVE_COST", "error", `\u6742\u8D39\u8BB0\u5F55 ${expense.id} \u7684\u91D1\u989D\u65E0\u6548\uFF08${expense.amount}\uFF09`, {
      type: "expense",
      id: expense.id,
      vehicle_id: expense.vehicle_id,
      amount: expense.amount
    }, `expense update ${expense.id} --amount YUAN`);
  }
  const orphanRecords = db.query(`SELECT r.* FROM records r
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE v.id IS NULL${vehicleFilter.replace(/vehicle_id/g, "r.vehicle_id")} ORDER BY r.id ASC`).all(...vehicleParams);
  for (const record of orphanRecords) {
    push("ORPHAN_RECORD", "error", `\u8BB0\u5F55 ${record.id} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8F66\u8F86 ${record.vehicle_id}`, recordEntity(record), null);
  }
  const orphanExpenses = db.query(`SELECT e.id, e.vehicle_id FROM expenses e
       LEFT JOIN vehicles v ON v.id = e.vehicle_id
       WHERE v.id IS NULL${vehicleFilter.replace(/vehicle_id/g, "e.vehicle_id")} ORDER BY e.id ASC`).all(...vehicleParams);
  for (const expense of orphanExpenses) {
    push("ORPHAN_EXPENSE", "error", `\u6742\u8D39\u8BB0\u5F55 ${expense.id} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8F66\u8F86 ${expense.vehicle_id}`, { type: "expense", id: expense.id, vehicle_id: expense.vehicle_id }, null);
  }
  const orphanRules = db.query(`SELECT r.id, r.vehicle_id, r.item_id,
              CASE WHEN v.id IS NULL THEN 0 ELSE 1 END AS vehicle_exists,
              CASE WHEN i.id IS NULL THEN 0 ELSE 1 END AS item_exists
       FROM vehicle_maintenance_rules r
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       LEFT JOIN maintenance_items i ON i.id = r.item_id
       WHERE (v.id IS NULL OR i.id IS NULL)${vehicleId === undefined ? "" : " AND r.vehicle_id = ?"}
       ORDER BY r.id ASC`).all(...vehicleParams);
  for (const rule of orphanRules) {
    const missing = rule.vehicle_exists === 0 && rule.item_exists === 0 ? "\u8F66\u8F86\u548C\u4FDD\u517B\u9879\u76EE" : rule.vehicle_exists === 0 ? "\u8F66\u8F86" : "\u4FDD\u517B\u9879\u76EE";
    push("ORPHAN_RULE", "error", `\u4FDD\u517B\u89C4\u5219 ${rule.id} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684${missing}`, {
      type: "rule",
      id: rule.id,
      vehicle_id: rule.vehicle_id,
      item_id: rule.item_id
    }, null);
  }
  const orphanLinks = db.query(`SELECT mri.record_id, mri.item_id
       FROM maintenance_record_items mri
       LEFT JOIN records r ON r.id = mri.record_id
       WHERE r.id IS NULL
       ORDER BY mri.record_id ASC, mri.item_id ASC`).all();
  if (vehicleId === undefined) {
    for (const link of orphanLinks) {
      push("ORPHAN_LINK", "error", `\u9879\u76EE\u5173\u8054\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8BB0\u5F55 ${link.record_id}`, {
        type: "maintenance_record_item",
        record_id: link.record_id,
        item_id: link.item_id
      }, null);
    }
  }
  const unknownItemLinks = db.query(`SELECT mri.record_id, mri.item_id, r.vehicle_id
       FROM maintenance_record_items mri
       JOIN records r ON r.id = mri.record_id
       LEFT JOIN maintenance_items i ON i.id = mri.item_id
       WHERE i.id IS NULL${vehicleId === undefined ? "" : " AND r.vehicle_id = ?"}
       ORDER BY mri.record_id ASC, mri.item_id ASC`).all(...vehicleParams);
  for (const link of unknownItemLinks) {
    push("UNKNOWN_ITEM_LINK", "error", `\u4FDD\u517B\u8BB0\u5F55 ${link.record_id} \u5173\u8054\u4E86\u4E0D\u5B58\u5728\u7684\u4FDD\u517B\u9879\u76EE ${link.item_id}`, {
      type: "maintenance_record_item",
      record_id: link.record_id,
      item_id: link.item_id,
      vehicle_id: link.vehicle_id
    }, `maintenance update ${link.record_id} --items \u9879\u76EE\u4EE3\u7801`);
  }
  const unlinkedMaintenance = db.query(`SELECT r.* FROM records r
       WHERE r.deleted = 0 AND r.record_type = 'maintenance'${vehicleId === undefined ? "" : " AND r.vehicle_id = ?"}
         AND NOT EXISTS (
           SELECT 1 FROM maintenance_record_items mri
           WHERE mri.record_id = r.id
         )
       ORDER BY r.id ASC`).all(...vehicleParams);
  for (const record of unlinkedMaintenance) {
    push("MAINTENANCE_ITEMS_UNLINKED", "warning", `\u4FDD\u517B\u8BB0\u5F55 ${record.id}\uFF08${record.datetime}\uFF09\u6CA1\u6709\u5173\u8054\u4FDD\u517B\u9879\u76EE\uFF1B\u76F8\u5173\u63D0\u9192\u4E0D\u4F1A\u91CD\u7F6E`, recordEntity(record), `maintenance update ${record.id} --items \u9879\u76EE\u4EE3\u7801`);
  }
  const futureMaintenance = db.query(`SELECT * FROM records
       WHERE deleted = 0 AND record_type = 'maintenance'
         AND substr(datetime, 1, 10) > ?${vehicleFilter}
       ORDER BY datetime ASC, id ASC`).all(today, ...vehicleParams);
  for (const record of futureMaintenance) {
    push("FUTURE_MAINTENANCE", "warning", `\u4FDD\u517B\u8BB0\u5F55 ${record.id} \u7684\u65E5\u671F ${record.datetime} \u665A\u4E8E\u4ECA\u5929 ${today}\uFF0C\u4E0D\u4F1A\u4F5C\u4E3A\u63D0\u9192\u951A\u70B9`, recordEntity(record), `maintenance update ${record.id} --datetime ${today}`);
  }
  const vehicles = vehicleId === undefined ? db.query("SELECT * FROM vehicles WHERE deleted = 0 ORDER BY id ASC").all() : db.query("SELECT * FROM vehicles WHERE id = ? AND deleted = 0").all(vehicleId);
  for (const vehicle of vehicles) {
    let reminders;
    try {
      reminders = getVehicleReminders(db, vehicle.id, { now, today });
    } catch {
      continue;
    }
    for (const reminder of reminders) {
      const hasInterval = reminder.interval_km !== null || reminder.interval_months !== null;
      if (hasInterval && reminder.source === "unknown") {
        push("RULE_WITHOUT_ANCHOR", "warning", `\u8F66\u8F86 ${vehicle.id} \u7684\u9879\u76EE\u300C${reminder.name} (${reminder.item})\u300D\u6CA1\u6709\u53EF\u7528\u7684\u4FDD\u517B\u57FA\u51C6\uFF0C\u65E0\u6CD5\u751F\u6210\u5230\u671F\u63D0\u9192`, {
          type: "reminder",
          vehicle_id: vehicle.id,
          item: reminder.item,
          interval_km: reminder.interval_km,
          interval_months: reminder.interval_months
        }, `maintenance rule set --car ${vehicle.id} --item ${reminder.item} ` + `--baseline-mileage KM --baseline-date ${today}`);
      }
    }
  }
  const duplicateGroups = db.query(`SELECT vehicle_id, record_type, datetime, mileage, liters, cost,
              COUNT(*) AS count, GROUP_CONCAT(id) AS ids
       FROM records
       WHERE deleted = 0${vehicleFilter}
       GROUP BY vehicle_id, record_type, datetime, mileage, liters, cost
       HAVING COUNT(*) > 1
       ORDER BY vehicle_id ASC, datetime ASC`).all(...vehicleParams);
  for (const group of duplicateGroups) {
    push("DUPLICATE_RECORDS", "warning", `\u8F66\u8F86 ${group.vehicle_id} \u6709 ${group.count} \u6761\u76F8\u540C\u7684${TYPE_LABELS2[group.record_type] ?? group.record_type}` + `\u8BB0\u5F55\uFF08${group.datetime}\uFF0CID: ${group.ids}\uFF09`, {
      type: "record_group",
      vehicle_id: group.vehicle_id,
      record_type: group.record_type,
      datetime: group.datetime,
      record_ids: group.ids.split(",").map(Number)
    }, `${group.record_type} list --car ${group.vehicle_id}`);
  }
  for (const vehicle of vehicles) {
    const latestRefuel = db.query(`SELECT * FROM records
         WHERE vehicle_id = ? AND record_type = 'refuel' AND deleted = 0
         ORDER BY datetime DESC, id DESC LIMIT 1`).get(vehicle.id);
    if (latestRefuel && latestRefuel.is_full === 0) {
      push("OPEN_PARTIAL_FILL", "info", `\u8F66\u8F86 ${vehicle.id} \u6700\u65B0\u4E00\u6761\u52A0\u6CB9\u8BB0\u5F55 ${latestRefuel.id} \u672A\u52A0\u6EE1\uFF0C\u7B49\u5F85\u4E0B\u4E00\u6B21\u52A0\u6EE1\u5408\u5E76`, {
        type: "record",
        id: latestRefuel.id,
        vehicle_id: vehicle.id,
        record_type: "refuel",
        datetime: latestRefuel.datetime,
        mileage: latestRefuel.mileage
      }, `refuel consumption --car ${vehicle.id}`);
    }
  }
  const counts = {
    error: 0,
    warning: 0,
    info: 0,
    total: issues.length
  };
  for (const issue of issues)
    counts[issue.severity] += 1;
  return { issues, counts, ok: counts.error === 0 };
}

// src/cli/commands/doctor.ts
var SEVERITY_LABELS = {
  error: "\u9519\u8BEF",
  warning: "\u8B66\u544A",
  info: "\u63D0\u793A"
};
function renderIssue(ctx, issue) {
  writeLine(ctx, `[${SEVERITY_LABELS[issue.severity]}] ${issue.code}: ${issue.message}`);
  if (issue.suggested_command !== null) {
    writeLine(ctx, `  \u5EFA\u8BAE: ${issue.suggested_command}`);
  }
}
var doctor = {
  path: ["doctor"],
  summary: "\u53EA\u8BFB\u6570\u636E\u4F53\u68C0\uFF1A\u8D1F\u503C\u3001\u987A\u5E8F\u3001\u5B64\u513F\u884C\u3001\u672A\u5173\u8054\u9879\u76EE\u3001\u91CD\u590D\u4E0E\u672A\u6765\u65E5\u671F",
  flags: [
    {
      name: "car",
      valueName: "CAR",
      description: "\u53EA\u68C0\u67E5\u4E00\u8F86\u8F66\uFF08\u8F66\u8F86 ID\u3001\u540D\u79F0\u6216\u8F66\u724C\uFF09"
    }
  ],
  examples: [
    "carlog doctor",
    "carlog doctor --car \u601D\u57DF --json"
  ],
  outputFields: [
    "data.issues",
    "data.issues[].code",
    "data.issues[].severity",
    "data.issues[].message",
    "data.issues[].entity",
    "data.issues[].suggested_command",
    "data.counts.error",
    "data.counts.warning",
    "data.counts.info",
    "data.counts.total",
    "data.ok"
  ],
  errorCodes: ["DOCTOR_ISSUES", "VEHICLE_NOT_FOUND", "VEHICLE_AMBIGUOUS"],
  handler: (ctx, inv) => {
    const db = getCliDb(ctx);
    const car = getStringFlag(inv, "car");
    const vehicle = car === undefined ? undefined : resolveVehicle(db, requireStringFlag("car", car));
    const report = runDoctor(db, {
      vehicleId: vehicle?.id,
      now: ctx.now
    });
    emitSuccess(ctx, inv.globals.json, report, (target, value) => {
      if (value.issues.length === 0) {
        writeLine(target, "\u672A\u53D1\u73B0\u6570\u636E\u95EE\u9898");
        return;
      }
      for (const issue of value.issues)
        renderIssue(target, issue);
      writeLine(target, `\u9519\u8BEF ${value.counts.error}\uFF0C\u8B66\u544A ${value.counts.warning}\uFF0C\u63D0\u793A ${value.counts.info}`);
    });
    if (!report.ok)
      setExitCode(ctx, EXIT_CODES.INTEGRITY);
  }
};
var doctorCommands = [doctor];

// src/cli/registry.ts
function flagUsage(flag2) {
  if (flag2.required) {
    return flag2.boolean ? `--${flag2.name}` : `--${flag2.name} ${flag2.valueName ?? "VALUE"}`;
  }
  return flag2.boolean ? `[--${flag2.name}]` : `[--${flag2.name} ${flag2.valueName ?? "VALUE"}]`;
}
function positionalUsage(positional) {
  const label = positional.variadic ? `[${positional.name}...]` : `<${positional.name}>`;
  return positional.required || positional.variadic ? label : `[${positional.name}]`;
}
function commandUsage(spec) {
  const parts = ["carlog", ...spec.path];
  for (const flag2 of spec.flags ?? [])
    parts.push(flagUsage(flag2));
  for (const positional of spec.positionals ?? [])
    parts.push(positionalUsage(positional));
  return parts.join(" ");
}
function helpData(spec) {
  return {
    path: spec.path.join(" "),
    summary: spec.summary,
    usage: commandUsage(spec),
    flags: (spec.flags ?? []).map((flag2) => ({
      name: `--${flag2.name}`,
      value: flag2.boolean ? null : flag2.valueName ?? "VALUE",
      required: flag2.required === true,
      description: flag2.description ?? ""
    })),
    positionals: (spec.positionals ?? []).map((positional) => ({
      name: positional.name,
      required: positional.required === true,
      variadic: positional.variadic === true,
      description: positional.description ?? ""
    })),
    examples: [...spec.examples ?? []],
    output_fields: [...spec.outputFields ?? []],
    error_codes: [...spec.errorCodes ?? []]
  };
}
function renderUsage(ctx) {
  const lines = [
    "\u6C7D\u8F66\u91CC\u7A0B\u7BA1\u7406\u5DE5\u5177 (carlog)",
    "",
    "\u7528\u6CD5:",
    "  carlog [--db PATH] <command> [subcommand] [options]",
    "",
    "\u5168\u5C40\u9009\u9879:",
    "  --db PATH   \u81EA\u5B9A\u4E49\u6570\u636E\u5E93\u8DEF\u5F84",
    "  --json      \u8F93\u51FA JSON \u4FE1\u5C01",
    "  --version   \u663E\u793A\u7248\u672C",
    "",
    "\u547D\u4EE4:"
  ];
  for (const spec of COMMANDS) {
    lines.push(`  ${spec.path.join(" ")}  ${spec.summary}`);
  }
  lines.push("");
  lines.push("\u4F7F\u7528 carlog help <command> \u67E5\u770B\u547D\u4EE4\u8BE6\u60C5\u3002");
  writeLine(ctx, lines.join(`
`));
}
function renderCommandHelp(ctx, spec, data) {
  const lines = [`carlog ${data.path}`, "", data.summary, "", "\u7528\u6CD5:", `  ${data.usage}`];
  if (data.flags.length > 0) {
    lines.push("", "\u53C2\u6570:");
    for (const flag2 of data.flags) {
      const value = flag2.value ? ` ${flag2.value}` : "";
      const required = flag2.required ? " (\u5FC5\u586B)" : "";
      lines.push(`  ${flag2.name}${value}${required}  ${flag2.description}`.trimEnd());
    }
  }
  if (data.positionals.length > 0) {
    lines.push("", "\u4F4D\u7F6E\u53C2\u6570:");
    for (const positional of data.positionals) {
      const suffix = positional.variadic ? "..." : "";
      const required = positional.required ? " (\u5FC5\u586B)" : "";
      lines.push(`  <${positional.name}${suffix}>${required}  ${positional.description}`.trimEnd());
    }
  }
  if (data.examples.length > 0) {
    lines.push("", "\u793A\u4F8B:");
    for (const example of data.examples)
      lines.push(`  ${example}`);
  }
  if (data.output_fields.length > 0) {
    lines.push("", "\u8F93\u51FA\u5B57\u6BB5:");
    for (const field of data.output_fields)
      lines.push(`  ${field}`);
  }
  if (data.error_codes.length > 0) {
    lines.push("", "\u9519\u8BEF\u7801:");
    for (const code of data.error_codes)
      lines.push(`  ${code}`);
  }
  writeLine(ctx, lines.join(`
`));
}
var help = {
  path: ["help"],
  summary: "\u663E\u793A\u5E2E\u52A9",
  positionals: [
    {
      name: "command",
      variadic: true,
      description: "\u547D\u4EE4\u8DEF\u5F84\uFF0C\u5982 refuel add"
    }
  ],
  examples: ["carlog help", "carlog help refuel add", "carlog help --json"],
  outputFields: [
    "data.commands",
    "data.commands[].path",
    "data.commands[].usage",
    "data.commands[].flags",
    "data.commands[].examples",
    "data.commands[].output_fields",
    "data.commands[].error_codes"
  ],
  errorCodes: ["UNKNOWN_COMMAND"],
  handler: (ctx, inv) => {
    if (inv.positionals.length === 0) {
      if (inv.globals.json) {
        emitSuccess(ctx, true, { commands: COMMANDS.map(helpData) });
      } else {
        renderUsage(ctx);
      }
      return;
    }
    const spec = findCommand(COMMANDS, inv.positionals);
    if (!spec) {
      throw new AppError("UNKNOWN_COMMAND", `\u672A\u77E5\u547D\u4EE4\uFF1A${inv.positionals.join(" ")}`, { details: { command: inv.positionals.join(" ") } });
    }
    if (inv.globals.json) {
      emitSuccess(ctx, true, { commands: [helpData(spec)] });
    } else {
      renderCommandHelp(ctx, spec, helpData(spec));
    }
  }
};
var COMMANDS = [
  ...carCommands,
  ...mileageCommands,
  ...refuelCommands,
  ...maintenanceCommands,
  ...remindCommands,
  ...settingsCommands,
  ...expenseCommands,
  ...statsCommands,
  ...summaryCommands,
  ...deleteAllCommands,
  ...exportCommands,
  ...importCommands,
  ...doctorCommands,
  help
];
var FLAG_ARITY = buildFlagArity(COMMANDS);

// src/index.ts
function renderVersion(ctx, json) {
  const data = {
    version: CLI_VERSION,
    schema_version: JSON_SCHEMA_VERSION,
    db_schema_version: DB_SCHEMA_VERSION
  };
  emitSuccess(ctx, json, data, (target, value) => {
    writeLine(target, `carlog ${value.version} (JSON schema ${value.schema_version}, DB schema ${value.db_schema_version})`);
  });
}
function runCli(argv, input = {}) {
  const stdoutChunks = [];
  const stderrChunks = [];
  const externalOut = input.stdout;
  const externalErr = input.stderr;
  const ctx = {
    stdout: (text) => {
      stdoutChunks.push(text);
      externalOut?.(text);
    },
    stderr: (text) => {
      stderrChunks.push(text);
      externalErr?.(text);
    },
    now: input.now ?? (() => new Date),
    dbPath: input.dbPath,
    db: input.db
  };
  let exitCode = 0;
  try {
    if (argv.length === 0) {
      renderUsage(ctx);
    } else if (argvHasFlag(argv, "version")) {
      renderVersion(ctx, argvHasFlag(argv, "json"));
    } else {
      const parsed = parseArgv(argv, COMMANDS, FLAG_ARITY);
      if (!parsed) {
        renderUsage(ctx);
      } else {
        if (parsed.globals.db !== undefined)
          ctx.dbPath = parsed.globals.db;
        parsed.command.handler(ctx, parsed);
        exitCode = ctx.exitCode ?? 0;
      }
    }
  } catch (error) {
    const appError = toAppError(error);
    emitError(ctx, argvHasFlag(argv, "json"), appError);
    exitCode = appError.exitCode;
  }
  return {
    success: exitCode === 0,
    exitCode,
    stdout: stdoutChunks.join(""),
    stderr: stderrChunks.join("")
  };
}
function main() {
  const result = runCli(process.argv.slice(2));
  if (result.stdout)
    process.stdout.write(result.stdout);
  if (result.stderr)
    process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
if (import.meta.main) {
  main();
}
export {
  runCli
};
