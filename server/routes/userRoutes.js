
import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;
