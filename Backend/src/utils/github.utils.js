export const extractGitHubUsername = (input) => {
  if (!input || typeof input !== "string") {
    throw new Error("GitHub username or URL is required");
  }
  //Removing unnecessary spaces
  const value = input.trim();

  // If the user enters a URL, validate its hostname.
  if (value.includes("://")) {
    let url;

    try {
      // JavaScript provides a built-in URL class that helps us parse URLs.
      //protocol://hostname/pathname
      url = new URL(value);
      //If the URL is valid, execution continues.
      //If it is invalid, JavaScript enters the catch block:
    } catch {
      throw new Error("Invalid GitHub profile URL");
    }

    if (
      !["github.com", "www.github.com"].includes(
        url.hostname.toLowerCase()
      ) ||
      url.protocol !== "https:"
    ) {
      throw new Error("Please enter a valid GitHub profile URL");
    }

    // https://github.com/octocat
    // url.pathname returns: /octocat
    // after split ["", "octocat"]
    // .filter(Boolean): This removes empty values from the array. ["octocat"]
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 1) {
      throw new Error("Please enter a GitHub profile URL, not a repository URL");
    }

    return validateUsername(parts[0]);
  }

  return validateUsername(value);
};

const validateUsername = (username) => {
  const valid = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  // .test() method checks whether a string matches a regular expression.
  if (!valid.test(username)) {
    throw new Error("Invalid GitHub username");
  }

  return username;
};