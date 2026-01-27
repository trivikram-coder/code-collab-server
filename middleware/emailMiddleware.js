const jwt = require("jsonwebtoken");

const verifyEmailServiceToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Optional: validate purpose
    if (decoded.purpose !== "RESET_PASSWORD") {
      return res.status(403).json({
        success: false,
        message: "Invalid token purpose",
      });
    }

    // 5️⃣ Attach email to request
    req.email = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { verifyEmailServiceToken };
