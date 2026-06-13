// Pure validators for the Claude Code plugin manifests. Each takes a parsed
// object and returns { errors, warnings } — no filesystem, no process.exit — so
// the install-blocker rules can be unit-tested in isolation. The CLI wrapper
// (validate.mjs) reads/parses the files and decides exit codes.
// See .spine/decisions/0014-manifest-schema-validation-pure-module.md.

// kebab-case: lowercase letters/digits in hyphen-separated groups, no leading/
// trailing/double hyphen. A non-kebab name blocks `/plugin install`.
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isString = (v) => typeof v === "string";
const isNonEmptyString = (v) => isString(v) && v.trim().length > 0;
const isPlainObject = (v) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function checkName(value, label, errors) {
  if (value === undefined || value === null) {
    errors.push(`${label}: missing required "name"`);
  } else if (!isNonEmptyString(value)) {
    errors.push(`${label}: "name" must be a non-empty string`);
  } else if (!KEBAB.test(value)) {
    errors.push(
      `${label}: "name" "${value}" must be kebab-case (lowercase letters, digits, hyphens)`,
    );
  }
}

// `author`/`owner`: optional, but if present must be an object with a name.
// A bare string here is the canonical install-blocker.
function checkPersonObject(value, field, label, errors) {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    const got = Array.isArray(value) ? "array" : typeof value;
    errors.push(
      `${label}: "${field}" must be an object (e.g. {"name": "..."}), not a ${got}`,
    );
  } else if (!isNonEmptyString(value.name)) {
    errors.push(`${label}: "${field}.name" is required`);
  }
}

export function validateManifest(plugin) {
  const errors = [];
  const warnings = [];
  const label = "plugin.json";

  checkName(plugin.name, label, errors);
  if (!isNonEmptyString(plugin.description)) {
    errors.push(`${label}: missing "description"`);
  }
  if (!isNonEmptyString(plugin.version)) {
    errors.push(`${label}: missing "version"`);
  }
  // Repo convention requires author present; the spec requires it be an object.
  if (plugin.author === undefined) {
    errors.push(`${label}: missing "author"`);
  } else {
    checkPersonObject(plugin.author, "author", label, errors);
  }
  if (plugin.keywords !== undefined && !Array.isArray(plugin.keywords)) {
    errors.push(`${label}: "keywords" must be an array`);
  }
  if (plugin.license === undefined) {
    warnings.push(`${label}: missing "license" (recommended)`);
  }

  return { errors, warnings };
}

export function validateMarketplace(marketplace) {
  // Implemented in build slice 2.
  return { errors: [], warnings: [] };
}
