import * as codeforces from "./codeforces.provider.js";
import * as leetcode from "./leetcode.provider.js";
import * as codechef from "./codechef.provider.js";
import * as geeksforgeeks from "./geeksforgeeks.provider.js";
import * as hackerrank from "./hackerrank.provider.js";

// Each provider exposes fetchProfile(handle) and returns the same normalized shape.
export const providers = { codeforces, leetcode, codechef, geeksforgeeks, hackerrank };