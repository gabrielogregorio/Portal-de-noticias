const express = require('express');
var ObjectID = require('mongodb').ObjectID;
const slugify = require('slugify');
const User = require('./Users');
const Post = require('../Posts/Posts');
const bcrypt = require('bcryptjs');
const adminAuth  = require('../middlewares/adminAuth');
const multer_author = require('../middlewares/multer_author');
const {isValidNumber, isValidString} = require('../util/validarEntrada');

const router = express.Router();


router.get('/login', (req, res) => {
  res.render('admin/Users/login');
})


router.post('/authenticate', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  email = isValidString(email);
  password = isValidString(password);

  User.findOne({ email }).exec((error, user) => {
    // Usuário não registrado
    if (!user) {
      res.redirect('/login')
    } else { // Email registrado!

      var validado = bcrypt.compareSync(password, user.password);

      if (validado) {
        req.session.user = {
          id: user.id,
          email: user.email
        }
        res.redirect('/admin/posts/view');
      } else { // Senha incorreta
        res.redirect('/login');
      }
    }
  })
})


router.get('/admin/users/view', adminAuth, (req, res) => {
  User.find().populate('post').exec((error, users) => {
    res.render('admin/Users/view', {users});
  })
})


router.get('/admin/users/new', adminAuth, (req, res) => {
  res.render('admin/Users/new');
})


router.post('/admin/users/save', adminAuth, multer_author.single('image'), (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  name = isValidString(name);
  email = isValidString(email);
  password = isValidString(password);

  if (req.file) {
    filename = req.file['filename']
  } else {
    filename = ''
  }

  if ( name && password && email) {
    User.findOne({email:email}).exec((error, user) => {

      // Nenhum e-mail igual registrado
      if (!user) {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, salt);

        var user = {
          _id: new ObjectID(),
          name: name,
          img: filename,
          email: email,
          password: hash
        };

        User.create(user, (error, response) => {
          if(error) return handleError(err);
          else res.redirect('/admin/users/view');
        })

      } else {
        res.send('Email Já registrado!');
      }
    })
  } else {
    res.send("Preencha todos os dados");
  }
})


router.post('/admin/users/delete', adminAuth, (req, res) => {
  User.remove({ _id: req.body.id }, (error) => {
    if (error) {
      res.send("Erro ao deletar!");
    } else {
      res.redirect('/admin/users/view');
    }
  })
})


router.get('/admin/users/edit/:id', adminAuth, (req, res) => {
  User.findOne({_id:  req.params.id}).populate(['postsAuthor']).exec((err, user) => {
    res.render('admin/Users/edit', {user:user});
  })
})


router.post('/admin/users/update', adminAuth, multer_author.single('image'), (req, res) => {
  var id = req.body.id;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  id = isValidString(id);
  email = isValidString(email);
  name = isValidString(name);
  password = isValidString(password);

  if (req.file) {
    filename = req.file['filename']
  } else {
    filename = ''
  }

  if (id && name && email) {
    if (password) {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);

      if (filename == '') {
        var user = {
          name: name,
          email: email,
          password: hash
        };
      } else {
        var user = {
          name: name,
          email: email,
          img: filename,
          password: hash
        };
      }
    } else {
      if (filename == '') {
        var user = {
          name: name,
          email: email
        };
      } else {
        var user = {
          name: name,
          img: filename,
          email: email
        };
      }
    }

    User.findOneAndUpdate(
      {_id: id},
      user,
      (error, response) => {
      if(error) return res.send(error);
      else res.redirect('/admin/users/view');
    })
  } else {
    res.send("Preencha todos os dados");
  }
})

module.exports = router;
