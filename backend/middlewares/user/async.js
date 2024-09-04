
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', error: error.message });
    }
};

module.exports = asyncHandler;