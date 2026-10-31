//1 -> entire

/*
🧠 Dependency on which files : no files
🧠 function expressions: hashPassword, verifyPassword, hashToken, generateRandomToken
 */

// 🧩 A utils folder is usually for small, reusable helper functions that don't belong to one specific feature.Your file is basically a collection of security helper functions

import bcrypt from "bcryptjs";
import crypto from "crypto";

//password ko hash karna padega because password ko haam directly database mai store nahi kar sakte
// ✔️ bcrypt.hash(data,saltRounds); 
/*
✔️ salt v/s saltRounds
Salt
 ↓
Random value used during hashing (bcrypt add karta hai hash karne se pehle so that even if same password bhi users dene lage toh bhi pharak nahi padta)

Salt rounds 
 ↓
Hashing ki computational cost (value increases , cost increases , security increases)

✔️ Flow samjho
password
   ↓
bcrypt generates random salt
   ↓
bcrypt does expensive hashing (12 rounds/cost)
   ↓
hashed password

 */
const hashPassword = async (plainPassword) => {
    return bcrypt.hash(plainPassword, 12);
};

// login ke time password ko verify karna padega
// ✔️ bcrypt.compare(enteredPassword, storedHash)
const verifyPassword = async (hash, plainPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hash);
    } catch {
        return false;
    }
};

// You don't need bcrypt's expensive password-protection mechanism here.
// A refresh token is already supposed to be a long, random, unpredictable value.
/*
✔️ the actual need 
Imagine someone gets access to your database.
They can potentially take that token and use it to get new access tokens.
with hashing : They don't have the original refresh token.
So hashing gives you an additional layer of protection if your database is exposed.

                  ┌─────────────────┐
token ──────────→ │    SHA-256      │
                  │     machine     │
                  └────────┬────────┘
                           ↓
                     hashed token
                     (hex string)
 */
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/*
Generate a random sequence of bytes and convert it into a hexadecimal string.
 */
const generateRandomToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString("hex");
};

export { hashPassword, verifyPassword, hashToken, generateRandomToken };