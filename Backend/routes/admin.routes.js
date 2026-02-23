const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getAllUsers, deleteUser } = require('../controllers/admin.controller'); // You'll need to create these controllers

// All admin routes are protected and require admin role
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;