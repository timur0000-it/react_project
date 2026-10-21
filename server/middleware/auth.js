import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Необходима авторизация'
    });
  }

  try {
    req.user = jwt.verify(
      header.slice(7),
      process.env.ACCESS_SECRET
    );

    next();
  } catch {
    return res.status(401).json({
      message: 'Токен истёк или недействителен'
    });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Недостаточно прав'
      });
    }

    next();
  };
}