import { body } from "express-validator";



export const forgotPasswordValidation = [
    body("email", "Email must be provided").not().isEmpty(),
];


export const resetPasswordValidation = [
    body("password", "Password is required").not().isEmpty(),
    body("password", "Password should contain atleast 8 characters, uppercase and lower case letters, numbers, and symbols").isStrongPassword()
];

export const otpValidation = [
    body("otp", "Otp must be provided").not().isEmpty(),
];

export const testValidations = [
 
    body("email", "Email is required").not().isEmpty(),
    body("email", "Invalid email").isEmail(),
];

export const signUpValidations = [
    body("email", "Email is required").not().isEmpty(),
    body("email", "Invalid email").isEmail(),
    body("password", "Password is required").not().isEmpty(),
    body("password", "Password should contain atleast 8 characters, uppercase and lower case letters, numbers, and symbols").isStrongPassword()
];

export const signInValidations = [
    body("email", "Email is required").not().isEmpty(),
    body("email", "Invalid email").isEmail(),
    body("password", "Password is required").not().isEmpty(),
    body("password", "Invalid password").isStrongPassword()
];

export const addStockValidations = [
body("NameOfProduct", "Name of product is required").not().isEmpty(),
    body("Description", "Description is required").not().isEmpty(),
    body("quantity", "Quantity is required").not().isEmpty(),
    body("pricePerTon", "pricePerTon is required").not().isEmpty()
]

    export const addOrderValidations = [
        body("user", "User ID must be provided").not().isEmpty(),
        body("stock", "Stock ID must be provided").not().isEmpty(),
        body("quantity", "Quantity is required").not().isEmpty(),
        body("quality", "Quality is required").not().isEmpty(),
        body("phoneNumber", "Phone number is required").not().isEmpty(),
        body("phoneNumber", "Invalid phone number").matches(/^\+250\d{9}$/), // Regex to match Rwandan phone numbers
        body("Address", "Address is required").not().isEmpty(),
    ];
    

