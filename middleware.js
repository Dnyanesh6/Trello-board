import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.userId = decoded.userId;

        return next(); // ✅ ONLY ONE next()

    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
}

export { authMiddleware };