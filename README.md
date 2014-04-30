Social-Logins
=============

`social-logins` is a prototype for login and connect with famous social networks. This prototype works on [node.js](http://nodejs.org) with [passport](http://github.com/jaredhanson/passport) as backend server and [angular.js](http://angularjs.org) frontend. This `social-logins` support the following social networks as default.

 - Twitter (OAuth1.0A)
 - Facebook (OAuth2)
 - Google+ (OAuth2)
 - Yahoo! (OAuth2)
 - LinkedIn (OAuth2)
 - GitHub (OAuth2)

`social-logins` provides the followings
 - **node.js backend** (server) for authentication and authorization from external frontends
  - handling external requests RESTful API concept using express module
  - authenticating session based way for local account 
  - authenticating token based way for social networks using passport module
  - maintaining user accounts using local database using mongoose module
  - modulizing code along to supported social networks
  - (TODO) support https protocol with SSL (TLS) for security
  - (TODO) converting session based authentication to token based one for backend scalability
 - **angular.js frontend** (sample client) for rendering views dynamically and interacting with users
  - supporting single page web app (that means page isn't refreshed)
  - interacting with users using login/signup/profile views
  - routing pages using $route angular service
  - requesting backend resources using $resource angluar service
  - recovering response error of http status 401
  - supporting new window for external oauth authentications to avoid CORS problem due to ajax
  - supporting bower script to maintian js libraries like angluar.js, bootstrap, fontawesome
  - (TODO) applyig twitter's bootstrap fully to views

You can add login for other social networks simply if you conform to structure of this prototype.

## Install
prerequisites are the followings :

 - clone `social-logins` repo into your local machine

    $ git clone git@github.com:vinebrancho/social-logins.git

 - install mongodb into your local machine

And then, You can install `social-logins` using the following.

    $ npm install
  
## Usage
You can run node server with `social-logins` just using the following.

    $ npm start

And the, you can see Login UI of `social-logins` on your web browser by connecting to your node server url

    http://<your_node_server.com>/
    
In order to login or connect with accouts of social networks, you **must** change the `routes/oauth-info.js`. The file includes application id, secret and redirect url registered on social network provider for oauth authentication. To get application id (or key), register your application on each social networks. After that, you can replace id, secret and redirect url of the file to your own ones. The following is example for twitter oauth setting
    
``` javascript
    ...
    'twitter' : {
        'consumerKey' : 'WEV2Mz2xQPSfDsAYkHbgiVrrE',
        'consumerSecret' : 'ok17qE4dzwzygUOQRzLDlODo63UVDGHigqszTmpjr5LEF0UC1p',
        'callbackURL' : 'http://www.your_node_server.com/auth/login/twitter/callback'
    },
    ...
```

By this way, after replacing all default social networks to your own ones, your application can login or connect with all social networks. 

## Add other social networks to social-logins
You can add a social network into `social-logins` simply if you do the followings step by step.

1. Get application id(or key), secret from the social network provider
2. Add them into `routes/oauth-info.js`
3. Add fields for saving data from oauth into `models/model-user.js`
4. Create node module for routes and oauth handling of new social network into `routes/auth/<new_social_network_name>.js`
  - copy existing node module like twitter.js or facebook.js to the name above
  - you need to change the followings without changing basic structure of the node module
    - change request urls like `/auth/login/twitter` to `/auth/login/<new_social_network_name>`
    - change passport module like `require(passport-twitter)` to `require(passport-<new_social_network_name>)`
    - change params of passport.authenticate() according to interface of `passport-<new_social_network_name>` module
    - change params of passport.use() according to interface of `passport-<new_social_network_name>` module
    - change code inserting data into database in passort verify-callback, according to fields added in 3 step
5. Enable node module created above by adding `require(<new module>)(router)` into `setAuthRoutes` function of `routes/router.js` 
6. Modify existing views of angular.js frontend 
    - add new button for the social networks into `/public/partials/login.html`
    - add angular models on `/public/partials/profile.html` to show information of new social network account

* You may find passport strategy module of other social networks in the [passport wiki](https://github.com/jaredhanson/passport/wiki/Strategies). If there isn't the passport strategy module that you want, you need to create new passport starategy module for use.

## Credits

  - [Vine Brancho](http://github.com/vinebrancho)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Vine Brancho <[http://vinebrancho.wordpress.com/](http://vinebrancho.wordpress.com/)>
