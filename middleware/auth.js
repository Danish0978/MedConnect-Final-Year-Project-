const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  console.log("Hello from auth-middleware");

  try {
    console.log("I am here before token");

    // Check if the authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).send("Authorization header missing");
    }

    const token = req.headers.authorization.split(" ")[1];

    // Check if the token exists after splitting
    if (!token) {
      return res.status(401).send("Token missing from authorization header");
    }

    console.log(token + " I want to display token");

    // Verify the token and capture the decoded payload
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!verifyToken) {
      return res.status(401).send("Invalid token");
    }

    console.log("Decoded Token Info: ", verifyToken);

    // ✅ Attach the entire decoded token payload to req.user
    req.user = verifyToken;
    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).send("Token verification failed");
  }
};

module.exports = auth;


