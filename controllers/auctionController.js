const Auction = require('../models/Auction');

// @desc    Create a new auction
exports.createAuction = async (req, res) => {
    const { title, description, startingBid, endsAt } = req.body;

    if (!title || !description || !startingBid || !endsAt) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const auction = await Auction.create({
            title,
            description,
            startingBid,
            currentBid: startingBid,
            endsAt,
            owner: req.user._id
        });

        res.status(201).json(auction);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create auction' });
    }
};

// @desc    Get all auctions
exports.getAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find().populate('owner', 'username');
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch auctions' });
    }
};

// @desc    Get single auction by ID
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('owner', 'username')
            .populate('bids.bidder', 'username');

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        res.json(auction);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch auction' });
    }
};

// @desc    Place a bid
exports.placeBid = async (req, res) => {
    const { amount } = req.body;

    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // ⛔ Prevent bidding after auction ends
        if (auction.isEnded || new Date() > new Date(auction.endsAt)) {
            auction.isEnded = true;
            await auction.save();
            return res.status(400).json({ message: 'Auction has already ended' });
        }

        // ⛔ Prevent bidding on own auction
        if (auction.owner.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: "You can't bid on your own auction" });
        }

        // ⛔ Validate bid amount
        if (amount <= auction.currentBid) {
            return res.status(400).json({ message: 'Bid must be higher than current bid' });
        }

        // ✅ Place bid
        auction.bids.push({
            bidder: req.user._id,
            amount,
        });

        auction.currentBid = amount;

        await auction.save();

        res.status(200).json({ message: 'Bid placed successfully', auction });
    } catch (err) {
        res.status(500).json({ message: 'Failed to place bid' });
    }
};


// @desc    Update an auction (only owner)
exports.updateAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { title, description, endsAt } = req.body;

        if (title) auction.title = title;
        if (description) auction.description = description;
        if (endsAt) auction.endsAt = endsAt;

        const updated = await auction.save();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update auction' });
    }
};

// @desc    Delete an auction (only owner)
exports.deleteAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await auction.deleteOne();  // ✅ This deletes the document

        res.json({ message: 'Auction deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete auction' });
    }
};
