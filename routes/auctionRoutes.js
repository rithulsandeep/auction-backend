const express = require('express');
const {
    createAuction,
    getAuctions,
    getAuctionById,
    placeBid,
    deleteAuction,
    updateAuction
} = require('../controllers/auctionController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAuctions);
router.get('/:id', getAuctionById);

// Protected routes
router.post('/', protect, createAuction);
router.post('/:id/bid', protect, placeBid);
router.put('/:id', protect, updateAuction);
router.delete('/:id', protect, deleteAuction);

module.exports = router;
