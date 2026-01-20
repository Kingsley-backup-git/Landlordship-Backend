const Auth = require("../models/authModel");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const createToken = async (id) => {
  const token = await jwt.sign({ _id: id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1hr",
  });
  return token;
};
const refreshToken = async (id) => {
  const token = await jwt.sign({ _id: id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });
  return token;
};
const RegisterUser = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    } else if (!password) {
      return res.status(400).json({ error: "Password is required" });
    } else if (!userName) {
      return res.status(400).json({ error: "userName is required" });
    } else if (!validator.isEmail) {
      return res.status(400).json({ error: "Email must be a valid email" });
    } else if (!validator.isStrongPassword) {
      return res.status(400).json({ error: "Password is not strong enough" });
    }
    const findEmail = await Auth.findOne({ email });

    if (findEmail) {
      return res.status(400).json({ error: "Email exists alreadt" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Auth({
      email,
      password: hashedPassword,
      userName,

      slug: (userName + " " + "homes")
        .toString()
        .toLowerCase()
        .split(" ")
        .join("-"),
    });

    const accessToken = await createToken(newUser?._id);
    res.cookie("refreshToken", refreshToken(newUser?._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await newUser.save();
    return res.status(200).json({
      data: {
        email: newUser?.email,
        userName: newUser?.userName,
        slug: newUser?.slug,
        accessToken,
      },
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Username is already in use",
      });
    }

    return res.status(500).json({ error: "Internal Server error" });
  }
};

const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    } else if (!password) {
      return res.status(400).json({ error: "Password is required" });
    } else if (!validator.isEmail) {
      return res.status(400).json({ error: "Email must be a valid email" });
    } else if (!validator.isStrongPassword) {
      return res.status(400).json({ error: "Password is not strong enough" });
    }

    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }
    const comparedPassword = await bcrypt.compare(password, user?.password);
    if (!comparedPassword) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    const accessToken = await createToken(user?._id);
   res.cookie("refreshToken", refreshToken(user?._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      data: {
        email: user?.email,
        userName: user?.userName,
        slug: user?.slug,
        accessToken,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

const refreshTokenHandler = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = createToken(decoded._id);

    res.json({ accessToken: newAccessToken });
  });
};

const getUser = async (req, res) => {
    try {
  const { _id } = req.user
    if (!_id) {
        return res.status(401).json({error : "Unauthorized"})
    }

    const user = await Auth.findOne({ _id })
        if (!user) {
        return res.status(401).json({error: "user not found"})
        }
        
        return res.status(200).json({data : user})
    } catch (err) {
         return res.status(500).json({error: "Internal server error"})
    }
  
};

module.exports = {
  RegisterUser,
  LoginUser,
    refreshTokenHandler,
  getUser
};
