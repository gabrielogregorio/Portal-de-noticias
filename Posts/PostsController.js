const express = require('express');
var ObjectID = require('mongodb').ObjectID;
const slugify = require('slugify');
const Post = require('./Posts');
const Category = require('../Categories/Categories');
const adminAuth = require('../middlewares/adminAuth');
const {isValidNumber, isValidString} = require('../util/validarEntrada');
const multer_post = require('../middlewares/multer_post');
const multer_author = require('../middlewares/multer_author');


const router = express.Router();


router.get('/admin/posts/view', adminAuth, (req, res) => {
  Post.find().populate('category author').exec((err, posts) => {
    posts = posts.map(post => ({
      id: post.id,
      title: post.title ,
      img: post.img,
      category: post.category ? 'Dica ' + post.category.name : 'Dica especial',
      body: post.body,
      author: post.author,
      slug: post.slug,
      description: post.description.substr(0, 150)
    }));

    res.render('admin/Posts/view', {posts});
  })
})


router.get('/admin/posts/new', adminAuth, (req, res) => {
  Category.find().then(categories => {
    res.render('admin/Posts/new', {categories});
  })
})


router.post('/admin/posts/save', adminAuth, multer_post.single('image'), (req, res) => {
  var title = req.body.title;
  var body = req.body.body;
  var categoryId = req.body.category;
  var description = req.body.description;
  var newCategory = req.body.newCategory;

  title = isValidString(title);
  body = isValidString(body);
  categoryId = isValidString(categoryId);
  newCategory = isValidString(newCategory);
  description = isValidString(description);

  if (req.file) {
    console.log(req.file);
    filename = req.file['filename']
  } else {
    filename = ''
  }

  if (title && body && description && (categoryId || newCategory) ) {
    // Cadastrar Categoria inexistente
    if (!categoryId) {
      categoryId = new ObjectID();
      var category = {
        _id: categoryId,
        name: newCategory
      };
      Category.create(category, (error, instance) => {
        if(error) return res.send(error);
      })
    }

    // Inserir Post
    var post = {
      _id: new ObjectID(),
      title: title,
      img: filename,
      author: req.session.user.id,
      slug: slugify(title),
      description: description,
      body: body,
      category: categoryId,
      views: 0
    };

    Post.create(post, (error, instance) => {
      if(error) return res.send(error);
      else res.redirect('/admin/posts/view');
    })

  } else {
    res.send("Preencha todos os dados");
  }
})


router.post('/admin/posts/delete', adminAuth, (req, res) => {
  Post.remove({_id: req.body.id}, (error) => {
    if (error) {
      res.send("Erro ao deletar!");
    } else {
      res.redirect('/admin/posts/view');
    }
  })
})


router.get('/admin/posts/edit/:id', adminAuth, (req, res) => {
  Post.findOne({_id:req.params.id}).populate(['category', 'user']).exec((err, post) => {
    Category.find().then(categories => {
      res.render('admin/Posts/edit', {post:post, categories:categories});
    })
  })
})



router.post('/admin/posts/update', adminAuth, multer_post.single('image'), (req, res) => {
  var title = req.body.title;
  var body = req.body.body;
  var categoryId = req.body.category;
  var id = req.body.id;
  var newCategory = req.body.newCategory;
  var description = req.body.description;


  id = isValidString(id);
  title = isValidString(title);
  body = isValidString(body);
  categoryId = isValidString(categoryId);
  newCategory = isValidString(newCategory);
  description = isValidString(description);

  if (req.file) {
    console.log(req.file);
    filename = req.file['filename']
  } else {
    filename = ''
  }



  if (title && body && id && description && (categoryId || newCategory) ) {
    // Cadastrar Categoria inexistente
    if (!categoryId) {
      categoryId = new ObjectID();
      var category = {
        _id: categoryId,
        name: newCategory
      };

      Category.create(category, (error, instance) => {
        if(error) return res.send(error);
      })
    }


    // Inserir Post
    var post = {
      title: title,
      slug: slugify(title),
      body: body,
      author: req.session.user.id,
      category: categoryId,
      description: description
    };
    // Tem uma imagem nova
    if (filename) { post.img = filename;}

    Post.findOneAndUpdate({_id: id}, post, (error, response) => {
      if(error) return res.send(error);
      else return res.redirect('/admin/posts/view');
    })
  } else {
    res.send("Preencha todos os dados");
  }
})


module.exports = router;
