Social-Logins
=============

`social-logins` is a prototype for login or connect with famous social networks. This prototype works on node.js, and uses [passport](http://https://github.com/jaredhanson/passport) for authentication and authorization. Basically, the following social networks are supported.

 - Twitter (OAuth1.0A)
 - Facebook (OAuth2)
 - Google+ (OAuth2)
 - Yahoo! (OAuth2)
 - LinkedIn (OAuth2)
 - GitHub (OAuth2)

`social-logins` provides the followings
 - *node.js server*
  - receiving remote request of login or connect
  - communicating with each social network server for oauth
  - maintaining added user account using local database
 - web page based login, sign-up, profile *UI*

You can add login for other social networks simply if you conform to structure of this prototype.

## Install
prerequisites are the followings :

 - clone `social-logins` repo into your local machine
 - install mongodb into your local machine

And then, You can install social-logins using the following.

    $ npm install
  
## Usage
You can run node server with `social-logins` just using the following.

    $ npm start

And the, you can see Login UI of `social-logins` on your browser by connecting to your node server url

    http://www.your_node_server.com/
    
In order to login or connect with accouts of social networks, you *must* change the `routes/oauth-info.js`. The file includes application id, secret and redirect url of social network for oauth. To get application id (or key), register your application on each social networks. After that, you replace id, secret and redirect url of the file to your own ones. The following is example for twitter oauth setting
    
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
6. Add new view to existing UI
    - add new button for the social networks into `/views/login.ejs`
    - add code to display data on `/views/profile.ejs`

* You may find passport strategy module of other social networks in the [passport wiki](https://github.com/jaredhanson/passport/wiki/Strategies). If there isn't the passport strategy module that you want, you need to create new passport starategy module for use.

## Screenshots
### Login

### profile

## Credits

  - [Vine Brancho](http://github.com/vinebrancho)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Vine Brancho <[http://vinebrancho.wordpress.com/](http://vinebrancho.wordpress.com/)>
