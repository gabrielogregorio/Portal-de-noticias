function adminAuth(req, res, next) {
  if (req.session.user != undefined) {
      next(); // Dar continuidade a requisição
  } else {
      res.redirect('/login');
  }
}

module.exports = adminAuth;