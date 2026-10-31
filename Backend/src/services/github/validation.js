import { ErrorCode, GitHubError } from "./errors.js";

// Usernames: 1-39 chars, letters/digits/hyphens, no leading, trailing or double hyphen.
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
// Repository names: max 100 chars; letters, digits, ".", "_" and "-".
const REPO_RE = /^[\w.-]{1,100}$/;

const invalid = (message) => new GitHubError(ErrorCode.INVALID_INPUT, message, { status: 400 });

export const validateUsername = (username) => {
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    throw invalid("Invalid GitHub username");
  }
  return username;
};

export const validateRepository = (repository) => {
  if (
    typeof repository !== "string" ||
    !REPO_RE.test(repository) ||
    repository === "." ||
    repository === ".."
  ) {
    throw invalid("Invalid repository name");
  }
  return repository;
};

const FIRST_GITHUB_YEAR = 2008;

// Missing value -> current year. Anything else must be a whole year between 2008 and now.
export const validateYear = (value) => {
  const currentYear = new Date().getUTCFullYear();
  if (value === undefined) return currentYear;

  const year = Number(value);
  if (!Number.isInteger(year) || year < FIRST_GITHUB_YEAR || year > currentYear) {
    throw invalid("Invalid year");
  }
  return year;
};