const express = require('express');
const mongoose = require('mongoose');
const Category = require('./Categories/Categories');
const Post = require('./Posts/Posts');
const User = require('./Users/Users');
const bcrypt = require('bcryptjs');
const postsController = require('./Posts/PostsController');
const usersController = require('./Users/UsersController');
const categoriesController = require('./Categories/CategoriesController');
const session = require('express-session');
const {isValidNumber, isValidString} = require('./util/validarEntrada');
var ObjectID = require('mongodb').ObjectID;

const PORT = process.env.PORT || 3000


const app = express();
require('dotenv/config');

const connectString = process.env.STRING_MONGO;
const secretKeySession = process.env.SECRET_KET_SESSION;

// Configurações do express
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));

// Configuração de seção
app.use(session({
  secret: secretKeySession,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, // 30 dias em ms,
  resave: true,
  saveUninitialized: true
}))

mongoose.set('useFindAndModify', false);

// Teste de conexão com o banco de dados
mongoose.connect(connectString, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
  console.log("Conectado ao banco de dados");
}).catch((error) => {
  console.log(error.message);
})

// Usar rotas dos controllers
app.use('/', postsController)
app.use('/', usersController)
app.use('/', categoriesController)


function formatOutput(postsCategoryAuthor) {
  return postsCategoryAuthor?.map(post => ({
    title: post.title,
    img: post.img,
    category: post.category ? 'Dica ' + post.category.name : 'Dica especial',
    body: post.body,
    author: post.author,
    slug: post.slug,
    description: post.description.substr(0, 150)
  }));
}


// Retorna os posts pupulando pelo autor e categoria
async function returnPosts() {
  const postsCategoryAuthor = await Post.find().sort(
    {'_id': -1}).populate('category author').exec()

  // Realiza ajustes na formatação dos textos
  const posts = formatOutput(postsCategoryAuthor);
  return await {posts}
}


// Retorna os posts mais visualizados
async function returnPostsMostViews() {
  const postsMostViews = await Post.find().sort({views: -1}).populate('category').exec();
  return await {postsMostViews}
}

// Rota principal, responsável pela tela inicial e redirecionamento em caso
// De pesquisas
app.get('/', async (req, res) => {
  categories = await Category.find().exec();
  postsMostViews = await returnPostsMostViews();

  // Se veio uma consulta
  if (req.query.buscar || req.query.category) {
    if (req.query.buscar) {
      // i é para sem distinção entre minuscula e maiusculas
      busca = {description: {$regex: req.query.buscar, $options:"i"}}
    } else {
      busca = {category: req.query.category}
    }

    // Encontra os posts com base nos filtros
    Post.find(busca).populate('category').exec((err, postsCategoryAuthor) => {
      // Realiza ajustes na formação de textos
      const posts = formatOutput(postsCategoryAuthor);
      return res.render('busca', {categories:categories, posts: posts, postsMostViews: postsMostViews.postsMostViews});
    })
  } else {
    // Conta a quantidade de posts disponívels para o
    // SISTEMA DE PAGINAÇÃO
    await Post.countDocuments({}, (error, count) => {
      proximaPagina = false; // Nâo tem próxima página
      if (count > 5) {
        proximaPagina = true;
      }
    });

    // Obtém os posts disponíveis
    posts = await returnPosts();

    // Obtém as categorias disponíveis
    categories = await Category.find().exec();
    return res.render('home', {categories:categories, proximaPagina:proximaPagina, posts: posts.posts, postsMostViews: postsMostViews.postsMostViews});
  }
})


// Usuário acessou um endereço
app.get('/news/:slug', (req, res) => {

  // Buscar categorias disponívels
  categories = Category.find().exec((error, categories) => {

    // Post com a noticia a ser buscada
    // E update no contador de views
    post = Post.findOneAndUpdate(
      {slug: req.params.slug},
      {$inc: {views: 1}},
      {new: true}).populate('author').exec((error2, post) => {

        // Noticia não está disponível
        if (post == null) { return res.redirect('/'); }

        // Posts mais populares
        Post.find().sort({views: -1}).populate('category').exec((error3, postsMostViews) => {

        // Renderização
        return res.render('noticia', {post, postsMostViews, categories});
      });
    });
  });
})


/*
app.get('/magica', (req, res) => {
  var name = 'Raizeira';
  var email = 'root';
  var password = 'root';

  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);

  // Criação do usuário principal
  var user = {
    _id: '60f72440c475e52d48da2cd3',
    img: 'image-1626809773042',
    name: name,
    email: email,
    password: hash
  };

  User.create(user, (error, response) => {})

  // Criação das categorias
  var category = {_id:"60f7253cc475e52d48da2ce1",name:"Assuntos Espaciais"};
  Category.create(category, (error, response) => {})

  var category = {_id:"60f72844c475e52d48da2d13",name:"Games"};
  Category.create(category, (error, response) => {})

  var category = {_id:"60f728b2c475e52d48da2d1d",name:"Aviação"};
  Category.create(category, (error, response) => {})

  var category = {_id:"60f728f6c475e52d48da2d27",name:"Segurança da Informação"};
  Category.create(category, (error, response) => {})

  // Criação dos posts
  var post = {
    _id: new ObjectID(),
    title:"Jeff Bezos, homem mais rico do mundo, vai ao espaço e agradece a clientes da Amazon: 'Vocês pagaram",
    img:"image-1626809704164",
    author:"60f72440c475e52d48da2cd3",
    slug:"Jeff-Bezos-homem-mais-rico-do-mundo-vai-ao-espaco-e-agradece-a-clientes-da-Amazon:-'Voces-pagaram'",
    description:"Ele foi acompanhado de 'vovó' pioneira na aviação e holandês de 18 anos que comprou a passagem. Voo de 10 minutos aconteceu dias depois do feito por outro bilionário, Richard Branson, da Virgin. Ambos querem explorar o turismo espacial.",
    body:"<p>Jeff Bezos, o homem mais rico do mundo, decolou nesta ter&ccedil;a-feira (20), &agrave;s 10h12 (hor&aacute;rio de Bras&iacute;lia) para sua primeira &ndash; e breve &ndash; viagem espacial. O pouso aconteceu &agrave;s 10h22, como planejado.</p>\r\n<p>O bilion&aacute;rio estava a bordo de uma nave constru&iacute;da por sua pr&oacute;pria empresa, n&atilde;o a famosa Amazon, mas a Blue Origin, voltada ao setor aeroespacial. Ap&oacute;s o voo, Bezos ainda agradeceu aos clientes da gigante do varejo.</p>\r\n<p>&nbsp;</p>\r\n<p>O empres&aacute;rio de 57 anos esteve acompanhado de uma tripula&ccedil;&atilde;o ecl&eacute;tica, que n&atilde;o inclui astronautas profissionais: foi o primeiro voo civil sem piloto ao espa&ccedil;o. Nenhum funcion&aacute;rio ou astronauta da Blue Origin esteve na aeronave.</p>\r\n<p>Fizeram parte da viagem, al&eacute;m de Bezos:</p>\r\n<p>seu irm&atilde;o, Mark Bezos;<br />a piloto Wally Funk, de 82 anos, que se tornou a pessoa mais velha a ir ao espa&ccedil;o;<br />e o holand&ecirc;s Oliver Daemen, de 18 anos, o mais jovem a ir ao espa&ccedil;o e a primeira pessoa que pagou por isso (veja mais abaixo).<br />Em imagens divulgadas ap&oacute;s o voo, eles se mostraram descontra&iacute;dos, flutuando na nave: brincaram de atirar bolinhas e doces uns para os outros.</p>\r\n<p>&nbsp;</p>",
    category:"60f7253cc475e52d48da2ce1",
    views: 0
  };

  Post.create(post, (error, instance) => {})

  var post = {
    _id: new ObjectID(),
    title:"Sucesso! Richard Branson completa 1ª missão turística ao espaço",
    img:"image-1626809999834",
    author:"60f72440c475e52d48da2cd3",
    slug:"Sucesso!-Richard-Branson-completa-1a-missao-turistica-ao-espaco",
    description:"O bilionário Richard Branson decolou neste domingo (11) a bordo de uma nave da sua própria empresa, a Virgin Galactic, junto com outros três passageiros e dois pilotos, rumo ao espaço. Após passar alguns minutos em gravidade zero, o empresário voltou à Terra e comemorou o sucesso da primeira missão turística da companhia....",
    body:"<p>O bilion&aacute;rio Richard Branson decolou neste domingo (11) a bordo de uma nave da sua pr&oacute;pria empresa, a Virgin Galactic, junto com outros tr&ecirc;s passageiros e dois pilotos, rumo ao espa&ccedil;o. Ap&oacute;s passar alguns minutos em gravidade zero, o empres&aacute;rio voltou &agrave; Terra e comemorou o sucesso da primeira miss&atilde;o tur&iacute;stica da companhia.</p>\r\n<p>O avi&atilde;o carregando a nave decolou por volta das 11h40 (hor&aacute;rio de Bras&iacute;lia) da base Spaceport America no estado americano do Novo M&eacute;xico. Ap&oacute;s ganhar altitude por cerca de 50 minutos, a nave foi solta e acionou seu pr&oacute;prio motor at&eacute; chegar ao espa&ccedil;o. Por l&aacute; ficou por apenas 3 minutos enquanto a tripula&ccedil;&atilde;o se divertia em gravidade zero. Por volta de 12h40, a nave ...</p>",
    category:"60f7253cc475e52d48da2ce1",
    views: 0
  };

  Post.create(post, (error, instance) => {})
  var post = {
    _id: new ObjectID(),
    title:"Riot Games revela oficialmente primeiro gameplay de shooter Valorant; assista",
    img:"image-1626810436615",
    author:"60f72440c475e52d48da2cd3",
    slug:"Riot-Games-revela-oficialmente-primeiro-gameplay-de-shooter-Valorant-assista",
    description:"\"VALORANT é o jogo de tiro tático 5x5 de personagens da Riot Games\", diz a descrição do vídeo no YouTube. \"Esse vídeo de jogo foi gravado em um teste de mecânica de jogo interno de desenvolvedores. Pedimos desculpas pela qualidade do vídeo e esperamos que você curta.\"",
    body:"<p>O v&iacute;deo mostra que, como apontado anteriormente, Valorant conta com um estilo de gameplay similar ao de Counter-Strike, com uma equipe precisando plantar uma bomba e outra devendo impedir isso, ou tentar desativ&aacute;-la. A est&eacute;tica e arte, por outro lado, parecem lembrar Overwatch.</p>\r\n<p>Al&eacute;m do gameplay em si, a Riot prometeu que o jogo poder&aacute; ser jogado pelo p&uacute;blico ainda no primeiro semestre de 2020, mas n&atilde;o deu maiores detalhes sobre como isso acontecer&aacute;.</p>\r\n<p>&nbsp;</p>",
    category:"60f72844c475e52d48da2d13",
    views: 0
  };


  Post.create(post, (error, instance) => {})
  var post = {
    _id: new ObjectID(),
    title:"Jato de negócios com apenas um motor será apresentado nos EUA",
    img:"image-1626810546577",
    author:"60f72440c475e52d48da2cd3",
    slug:"Jato-de-negocios-com-apenas-um-motor-sera-apresentado-nos-EUA",
    description:"Stratos 716X se destaca por ser um jatinho monomotor com desempenho de aeronaves de maior porte",
    body:"<p>A startup Stratos Aircraft vai levar para o EAA Air Venture, em Oshkosh, o 716X o seu novo monojato executivo. O modelo ser&aacute; disponibilizado inicialmente em forma de kit, prevendo no futuro ter uma vers&atilde;o certificada.</p>\r\n<p>Um dos destaques do modelo &eacute; sua ampla cabine interna, com 1,46 m de largura e 1,40 m de altura, o que o torna um dos maiores avi&otilde;es do segmento de entrada, rivalizando com o Cirrus Jet.</p>\r\n<p>Avi&atilde;o de ultralongo alcance da Airbus come&ccedil;a ganhar forma<br />Boeing fecha parceria para produ&ccedil;&atilde;o de combust&iacute;vel sustent&aacute;vel de avia&ccedil;&atilde;o<br />China promete avi&atilde;o capaz de voar acima de 7.000 km/h</p>\r\n<p>A Stratos Aircraft espera comercializar os primeiros 716X em vers&atilde;o de kit experimental, ali&aacute;s o uso da designa&ccedil;&atilde;o X &eacute; uma refer&ecirc;ncia ser um modelo experimental. O propriet&aacute;rio dever&aacute; adquirir um kit, com todas as pe&ccedil;as e poder&aacute; montar com as equipes do fabricante o avi&atilde;o.</p>\r\n<p>O conceito comum entre aeronaves leves, com motor a pist&atilde;o, se tornou uma forma de capitalizar pequenas startups que planejam a certifica&ccedil;&atilde;o Far Part 23 da FAA, a autoridade de avia&ccedil;&atilde;o civis dos Estados Unidos.</p>\r\n<p>A inten&ccedil;&atilde;o &eacute; que o modelo experimental possibilite uma cad&ecirc;ncia de produ&ccedil;&atilde;o, acumulo de horas de voo que poder&atilde;o ser usadas na campanha oficial de ensaios em voo, assim como fluxo de caixa.</p>\r\n<p>&nbsp;O Stratos 716 &eacute; o herdeiro direto do primeiro experimental da Stratos, o 714X, que emprega uma s&eacute;rie de solu&ccedil;&otilde;es inovadoras para a categoria, como a arrojada solu&ccedil;&atilde;o monoturbina e uso extensivo de materiais compostos.</p>\r\n<p>mas tamb&eacute;m chama a aten&ccedil;&atilde;o especialmente o fato de o avi&atilde;o ser apresentado como um genu&iacute;no membro da categoria VLJ (Very Light Jet), um conceito que prometia uma revolu&ccedil;&atilde;o no setor antes de sofrer uma s&eacute;rie de percal&ccedil;os.</p>\r\n<p>A fuselagem e as asas fazem amplo uso de materiais compostos, o que, al&eacute;m de reduzir o peso e aumentar a vida &uacute;til, permite obter um desenho aerodin&acirc;mico mais avan&ccedil;ado, em rela&ccedil;&atilde;o as estruturas met&aacute;licas. Os primeiros testes demonstraram a escolha acertada do design geral da aeronave, que fez amplo uso de modelos computacionais na busca de um desenho que aliasse performance e espa&ccedil;o interno.</p>\r\n<p>A instala&ccedil;&atilde;o do motor na parte inferior da fuselagem, com duas entradas de ar nas laterais permitiu manter o propulsor em linha com o centro de gravidade. Tamb&eacute;m foi escolhido um bra&ccedil;o longo (dist&acirc;ncia entre o centro de gravidade e o estabilizador horizontal) para um melhor equil&iacute;brio da aeronave. Auxiliando na redu&ccedil;&atilde;o da dimens&atilde;o geral da cauda e ainda ofereceu coeficiente m&aacute;ximo de sustenta&ccedil;&atilde;o das asas e o coeficiente m&aacute;ximo de sustenta&ccedil;&atilde;o da aeronave.</p>",
    category:"60f728b2c475e52d48da2d1d",
    views: 0
  };

  Post.create(post, (error, instance) => {})
  var post = {
    _id: new ObjectID(),
    title:"Ataques de hackers levam seguradoras a reavaliar estratégia",
    img:"image-1626810614626",
    author:"60f72440c475e52d48da2cd3",
    slug:"Ataques-de-hackers-levam-seguradoras-a-reavaliar-estrategia",
    description:"(Bloomberg) -- Os ataques de hackers vieram um após o outro, semeando o caos em hospitais, paralisando o maior oleoduto dos Estados Unidos, uma gigante do setor de carnes e afetando as operações de centenas de empresas no fim de semana de 4 de julho.",
    body:"<p>Agora, as seguradoras reavaliam o setor cibern&eacute;tico.</p>\r\n<p>Com o aumento das invas&otilde;es e da demanda por cobertura, o neg&oacute;cio de US$ 3 bilh&otilde;es de prote&ccedil;&atilde;o de empresas contra hackers est&aacute; em um ponto de inflex&atilde;o. Diante de custos mais altos e maiores riscos, as seguradoras revisam padr&otilde;es, aumentam pre&ccedil;os e reduzem o valor de quanto est&atilde;o dispostas a pagar depois de um ataque cibern&eacute;tico.</p>\r\n<p>&nbsp;</p>\r\n<p>Max Reyes e Katherine Chiglinsky<br />ter., 20 de julho de 2021 1:52 PM&middot;3 minuto de leitura</p>\r\n<p>(Bloomberg) -- Os ataques de hackers vieram um ap&oacute;s o outro, semeando o caos em hospitais, paralisando o maior oleoduto dos Estados Unidos, uma gigante do setor de carnes e afetando as opera&ccedil;&otilde;es de centenas de empresas no fim de semana de 4 de julho.</p>\r\n<p>Agora, as seguradoras reavaliam o setor cibern&eacute;tico.</p>\r\n<p>Com o aumento das invas&otilde;es e da demanda por cobertura, o neg&oacute;cio de US$ 3 bilh&otilde;es de prote&ccedil;&atilde;o de empresas contra hackers est&aacute; em um ponto de inflex&atilde;o. Diante de custos mais altos e maiores riscos, as seguradoras revisam padr&otilde;es, aumentam pre&ccedil;os e reduzem o valor de quanto est&atilde;o dispostas a pagar depois de um ataque cibern&eacute;tico.</p>\r\n<p>- AN&Uacute;NCIO -</p>\r\n<p>Tornar a cobertura mais restrita pode expor mais empresas a maiores riscos financeiros. As seguradoras reavaliam como lucrar com as pol&iacute;ticas cibern&eacute;ticas em meio a um debate mais amplo sobre quem deve ficar arcar com os custos quando os ataques ocorrerem - como as invas&otilde;es contra a Colonial Pipeline e a JBS - e quais s&atilde;o os pap&eacute;is do governo e do setor privado.</p>\r\n<p>&ldquo;Os caminhos do passado n&atilde;o funcionam mais no futuro, mas essa cobertura nunca foi t&atilde;o necess&aacute;ria&rdquo;, disse Joshua Motta, cofundador e CEO da seguradora Coalition.</p>\r\n<p>As pol&iacute;ticas cibern&eacute;ticas s&atilde;o relativamente novas no centen&aacute;rio setor de seguros. O segmento teve forte expans&atilde;o na &uacute;ltima d&eacute;cada - os pr&ecirc;mios mais que dobraram desde 2015 e totalizaram US$ 3,15 bilh&otilde;es no ano passado, de acordo com a National Association of Insurance Commissioners.</p>\r\n<p>Agora, algumas seguradoras est&atilde;o mudando de estrat&eacute;gia. A Hiscox decidiu &ldquo;refinar&rdquo; seu apetite pelo neg&oacute;cio e se concentrar em clientes menores nos Estados Unidos, disse a empresa do Reino Unido em comunicado.</p>\r\n<p>Ao mesmo tempo, algumas empresas est&atilde;o cobrando mais por menos cobertura. Clientes pagaram 35% a mais por cobertura cibern&eacute;tica no primeiro trimestre em rela&ccedil;&atilde;o ao mesmo per&iacute;odo do ano passado, de acordo com a corretora Marsh McLennan.</p>\r\n<p>Perguntas mais dif&iacute;ceis</p>\r\n<p>As seguradoras tamb&eacute;m alteram os padr&otilde;es de subscri&ccedil;&atilde;o para tentar reduzir o risco, de acordo com Tom Reagan, que lidera a pr&aacute;tica cibern&eacute;tica da Marsh nos EUA. Isso geralmente inclui exigir que as empresas aumentem suas pr&oacute;prias prote&ccedil;&otilde;es.</p>\r\n<p>&nbsp;</p>",
    category:"60f728f6c475e52d48da2d27",
    views: 0
  };

  Post.create(post, (error, instance) => {})
  var post = {
    _id: new ObjectID(),
    title:"Falcon Heavy, o foguete mais potente do mundo, faz voo de teste com sucesso",
    img:"image-1626810690116",
    author:"60f72440c475e52d48da2cd3",
    slug:"Falcon-Heavy-o-foguete-mais-potente-do-mundo-faz-voo-de-teste-com-sucesso",
    description:"O foguete mais potente do mundo, o Falcon Heavy, da SpaceX, decolou com sucesso nesta terça-feira (6) para seu aguardado voo de teste, rumo a uma órbita próxima a Marte. Foi um passo na direção do sonho de passeios espaciais do magnata Elon Musk.",
    body:"<p>Houve gritos e aplausos na base de Cabo Canaveral, Fl&oacute;rida, quando o enorme foguete ligou seus 27 motores e se afastou, em meio a uma enorme nuvem, da mesma plataforma de lan&ccedil;amento da Nasa que serviu como base para as miss&otilde;es americanas Apollo &agrave; Lua h&aacute; quatro d&eacute;cadas.</p>\r\n<p>\"A miss&atilde;o saiu t&atilde;o bem quanto se podia esperar\", disse Elon Musk, euf&oacute;rico, aos jornalistas ap&oacute;s o lan&ccedil;amento.</p>\r\n<p>\"Eu tenho essa imagem de uma explos&atilde;o gigantesca na plataforma com uma roda quicando ladeira abaixo com o logo da Tesla caindo em algum lugar\", afirmou. \"Felizmente, n&atilde;o foi isso que aconteceu\", acrescentou o magnata de 46 anos, nascido na &Aacute;frica do Sul e cidad&atilde;o americano e canadense.</p>\r\n<p>&nbsp;</p>",
    category:"60f7253cc475e52d48da2ce1",
    views: 0
  };


  Post.create(post, (error, instance) => {})

  res.redirect('/');
})

*/


// Sistema de Paginação
app.get("/posts/page/:num", (req, res) => {
  // Obtém o número da página. Página 1 é considerada como 0!
  var page = parseInt(req.params.num) -1;
  var limit = 4; // Limite de posts por páginas

  page = isValidNumber(page);

  // Conta quantos posts tem disponível
  Post.count({}, (error, count) => {
    // Tem próxima página?
    if (!((page * limit + limit) >= count)) { proximaPagina = true;}
    else { proximaPagina = false; }

    // Retorna os posts defindo um offset e um limite
    Post.find().sort({'_id': -1}).populate('category')
      .skip(page * limit+1)
      .limit(limit)
      .exec(function (err, postsPagination) {

        // Aconteceu algum erro
        if(err) { return res.status(500).json(err);};

        // Aplica alterações nos posts, tais como formação de texto
        const posts = formatOutput(postsPagination);

        var result = {
            proximaPagina: proximaPagina, // Tem ou não proxima página?
            posts: posts,
            page: page + 1 // Página atual
        }

        // Posts mais populares
        Post.find().sort({views: -1}).populate('category').exec((error3, postsMostViews) => {
          categories = Category.find().exec((error, categories) => {
            return res.render('page', {result:result, postsMostViews:postsMostViews, categories:categories})
          })
        })
      })
  })
})

app.listen(PORT, () => {
  console.log('Server is running');
})
