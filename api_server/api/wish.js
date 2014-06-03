var passport = require('passport');
var oauth2Server = require(__appbase_dirname + '/oauth2_server/server');
var Wish = require(__appbase_dirname + '/models/model-wish');

var initialize = function (router) {
    setRouter(router);
};

var setRouter = function (router) {
    router.get('/api/wish',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            console.log('This is query request!');
            process.nextTick(function () {
                Wish.find({
                    'userId': req.user.id
                }, function (err, wishs) {
                    if (wishs) {
                        res.json(wishs);
                    } else {
                        res.json([]);
                    }
                });
            });
        });

    // api for getting user's item
    router.get('/api/wish/:id',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            process.nextTick(function () {
                Wish.findById(req.params.id, function (err, wish) {
                    if (err) {
                        console.log('err occurs');
                        throw err;
                    }
                    if (wish == null) {
                        console.log('not exists!');
                        return res.json({});
                    }

                    if (req.user.id !== wish.userId) {
                        return res.json(403, { reason: 'unauthroized access' });
                    } 
                    return res.json(wish);
                });
            });
        });

    router.post('/api/wish',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            var newWish = new Wish();
            newWish.userId = req.user.id;
            newWish.content = req.body.content;
            newWish.save(function (err) {
                if (err) throw err;
                console.log(newWish);
                return res.json(newWish);
            });
        });

    router.put('/api/wish/:id',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            Wish.findOne({
                '_id': req.params.id
            }, function (err, wish) {
                if (err) throw err;
                if (wish == null) {
                    return res.send(404);
                }

                if (req.user.id !== wish.userId) {
                    return res.json(403, { reason: 'unauthroized access' });
                } else {
                    wish.content = req.body.content;
                    wish.save(function (err) {
                        if (err) throw err;
                        return res.send(200);
                    });
                }
            });
        });

    router.del('/api/wish/:id',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            Wish.findOne({
                '_id': req.params.id
            }, function (err, wish) {
                if (err) throw err;
                if (wish == null) {
                    return res.send(404);
                }

                if (req.user.id !== wish.userId) {
                    return res.json(403, { reason: 'unauthroized access' });
                } else {
                    Wish.remove({ '_id': req.params.id }, function (err) {
                        if (err) throw err;
                        return res.send(200);
                    });
                }
            });
        });
};

module.exports = initialize;
