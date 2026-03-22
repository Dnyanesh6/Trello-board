const jwt = require('jsonwebtoken')
function autMiddleware(req,res,next){
    const token = req.headers.token;

    const decoded = jwt.verify(token, "fklasjdknkjlansdxcjknvjklsahfdughadsjklfnvnsludfthaiosropwqjfdnvckjbljvfhnvnbb;ksxkdjfaoisjdfknjakscvnjsdfhgapxcznmvlknjjkszchlxllvnjsdgluhsdfhgujdfjkvbnccsjkbvnjznxcvjkznhxucjfjkaznlsdjx;kcbnvljzbfgasiurpserthugjsdfgvjsdngvjnbsdg");
    const userId = decoded.userId;
    if(decoded){
        req.userId = userId;
        next();
    }else{
        res.status(401).json({
            message: 'Unauthorized'
        });
    }
    next();
}

module.exports = autMiddleware;