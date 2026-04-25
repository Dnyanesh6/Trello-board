import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.userId;

        return next(); // ✅ ONLY ONE next()

    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
}

export { authMiddleware };