const express = require('express');
var ObjectID = require('mongodb').ObjectID;
const Category = require('./Categories');
const adminAuth = require('../middlewares/adminAuth');
const {isValidNumber, isValidString} = require('../util/validarEntrada');


const router = express.Router();


router.get('/admin/categories/view', adminAuth, (req, res) => {
  Category.find().exec((error, categories) => {
    res.render('admin/Categories/view', {categories});
  })
})


router.get('/admin/categories/new', adminAuth, (req, res) => {
  res.render('admin/Categories/new');
})


router.post('/admin/categories/save', adminAuth, (req, res) => {
  var name = req.body.name;

  name = isValidString(name);

  if ( name ) {
    var category = {
      _id: new ObjectID(),
      name: name
    };

    Category.create(category, (error, response) => {
      if(error) return res.send(error);
      else res.redirect('/admin/categories/view');
    })

  } else {
    res.send("Preencha todos os dados");
  }
})


router.post('/admin/categories/delete', adminAuth, (req, res) => {
  Category.remove({ _id: req.body.id }, (error) => {
    if (error) {
      res.send("Erro ao deletar Categoria");
    } else {
      res.redirect('/admin/categories/view');
    }
  })
})


router.get('/admin/categories/edit/:id', adminAuth, (req, res) => {
  Category.findOne({_id: req.params.id}).exec((err, category) => {
    res.render('admin/Categories/edit', {category});
  })
})


router.post('/admin/categories/update', adminAuth, (req, res) => {
  var id = req.body.id;
  var name = req.body.name;

  id = isValidString(id);
  name = isValidString(name);

  if ( id && name ) {
    var category = {
      name: name
    };

    Category.findOneAndUpdate({ _id: id }, category, (error, response) => {
      if(error) return res.send(error);
      else res.redirect('/admin/categories/view');
    })
  } else {
    res.send("Preencha todos os dados");
  }
})


module.exports = router;
