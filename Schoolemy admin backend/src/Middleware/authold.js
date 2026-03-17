import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyToken = async (req, res, next) => {
  
  try {
    
    const authorizationHeader = req.headers["authorization"];


    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or malformed" });
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access token not found" });
    }

  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
        id: decoded.id, 
        email: decoded.email, 
        role: decoded.role, 
        name: decoded.name 
    };

    next(); 

  } catch (error) {
   
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token has expired" });
    }
    return res.status(403).json({ message: "Invalid or corrupt token", error: error.message });
  }
};

export { verifyToken };
