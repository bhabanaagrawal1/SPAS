// 6 -> entire

/**
const middleware = (req, res, next) => {
    // do something
    next();
};
 */

// validationResult comes from the express-validator package.
// Its job is to:
// Get the validation errors that were collected for the current request.
import { validationResult } from "express-validator";

const validate = (req,res,next) => {
    const errors = validationResult(req); //"What validation errors were generated for this request?"
    //agar error kuch generate nahi hua then: next() or else :-
    if(!errors.isEmpty()) {
        // 400 -> it's a bad request
        return res.status(400).json({
            errors: errors.array().map((e) => ({
                field: e.path, // konse field se error araha
                message: e.msg // kya error message araha
            }))
        })
    }
    next();
}

export default validate;

/**
 * Validation rules
       ↓
validate()
       ↓
Errors?
  ↙       ↘
YES       NO
 ↓         ↓
400      next()
           ↓
       Controller
 */