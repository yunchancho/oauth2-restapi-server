social-oauth2-provider
=============

`social-oauth2-provider` is a prototype for logined social accounts to be authorized via OAuth2 by our backend server, so that they can access resources of our backendwith access token. Additionally `social-oauth2-provider` provides signup and login feature for local account which also is authorized via OAuth2 for accessing resources of backend server. This prototype works on [node.js](http://nodejs.org) with [passport](http://github.com/jaredhanson/passport) and [oauth2orize](http://github.com/jaredhanson/oauth2orize) as backend server and [angular.js](http://angularjs.org) frontend. `social-oauth2-provider` supports the following social accounts as default. Once frontend is logined using social accounts or local account, frontend recieves access token issued by node.js backend server of `social-oauth2-provider` so that it request some resources like user profile to backend server, passing the access token  

 - Twitter (OAuth1.0A)
 - Facebook (OAuth2)
 - Google+ (OAuth2)
 - Yahoo! (OAuth2)
 - LinkedIn (OAuth2)
 - GitHub (OAuth2)

`social-oauth2-provider` provides the followings
 - **node.js backend** (server) for oauth2 based authentication and authorization and REST API
  - Access token for 1st party app and 3rd party apps  
    1st party app (default frontend of `social-oauth2-provider`) doesn't need to exchange specific code with its backend server to get access token,
    because it can recieve user credentials from its users. So access token for 1st party app is issued using Resource Owner Password Credentials Grant 
    And to let 3rd party apps use some REST API of our `social-oauth2-provider`, you should provide specific way to 3rd party developers to register their apps for that.
    Generally, API providers use their website for registeration of 3rd party app.
    Backend server of `social-oauth2-provider` simply registers one default app per each grant type, as well as 'resource owner password' for 1st party app.
    You can test some flow of oauth2 specification using that apps
    - '[Resource Owner Password Credentials Grant](http://tools.ietf.org/html/rfc6749#page-37)' for 1st party app (`social-oauth2-provider` frontend)
    - '[Authorization Code Grant](http://tools.ietf.org/html/rfc6749#page-24)' for 3rd party app
    - '[Implicit Grant](http://tools.ietf.org/html/rfc6749#page-31)' for 3rd party app
    - '[Client Credentials Grant](http://tools.ietf.org/html/rfc6749#page-40)' for 3rd party app
  - REST API to get access token from backend server 
    - /auth/authorize
    - /auth/authorize/decision
    - /auth/authorize/callback (Just for test of authorization code grant and implicit grant)
    - /auth/token
  - REST API to get resource. frontends surely should pass access token in request header(`Authorization: Bearer <access_token>`). 
    - /api/profile/:id (`:id` means identifier of registered user of `social-oauth2-provider`, not user's email)
  - TLS(HTTPS) based communication 
    - every data from frontends are passed securly using https protocol.
    - even if http url is requested to backend server, the request is redirected as https url.
      http://<server_domain>/auth/login --> https://<server_domain>/auth/login
    - `social-oauth2-provider` uses self signed certificates for TLS. But you can replace them to ones isseud by public CA.
  - (TODO) Access Control based on `scope` of OAuth2
    - if node.js backend uses `scope` on validation of requests with access token by frontends, 
      it can provide access control mechanism for protecting its resource from improper request.
      Currently, backend server of `social-oauth2-provider` permits all resources if the request includes valid access token.

 - **angular.js frontend** (1st party app) for rendering views dynamically and interacting with users
  - Single page web app. That is, all pages are aren't refreshed because angluar.js get them using ajax
  - Interaction with users using login/signup/profile views for social accounts and local account
  - Page routing using `$route` angular.js service
  - Call to REST API to get resources of backend resource using `$resource` angluar.js service
  - Error Handling `401`(http authentication status) and recovering it
  - Oauth based authentications of social accounts using new window to avoid CORS problem due to ajax
  - Bower script to maintian js libraries like angluar.js, bootstrap, fontawesome
  - (TODO) refactoring frontend along to OAuth2 flow
  - (TODO) applyig twitter's bootstrap fully to views

You can add login for other social networks simply if you conform to structure of this prototype.

## Install
prerequisites are the followings :

 - clone `social-oauth2-provider` repo into your local machine

    $ git clone git@github.com:vinebrancho/social-oauth2-provider.git

 - install mongodb into your local machine

And then, You can install `social-oauth2-provider` using the following.

    $ npm install
  
## Usage
You can run node server with `social-oauth2-provider` just using the following.

    $ npm start

And the, you can see Login UI of `social-oauth2-provider` on your web browser by connecting to your node server url

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

## Add other social networks to social-oauth2-provider
You can add a social network into `social-oauth2-provider` simply if you do the followings step by step.

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

## API Usage for authentication and authorization 
Currently `social-oauth2-provider` doesn't use `scope` and `state` fields of OAuth2 spec (even if they are useful)
every fields speicified as `REQUIRED` are requested or response in http header or body.
Please refer OAuth2 specification about that.

### /auth/authorize
- description: request authorization of 3rd party app
- prerequisites: frontend MUST be logined using user's credetial
- required field in http request: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.1 
  - Implicit Grant: http://tools.ietf.org/html/rfc6749#section-4.2.1
- response: html page for user to grant `social-oauth2-provider` app

### /auth/authorize/decision
- description: pass user's grant (allow or deny). This API is called from html page recieved due to /auth/authorize
- required field in http request: transaction_id, allow (or deny) field
- response: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.2 
  - Implicit Grant: http://tools.ietf.org/html/rfc6749#section-4.2.2

### /auth/token
- description: request issuing access token.  
- required field in http request: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.3
  - Resource Owner Password Credentials Grant: http://tools.ietf.org/html/rfc6749#section-4.3.2
    * in case of login using local account, `usename` and `password` field should be like the following.
     `username`: *user_email* (registered by signup)
     `password`: *user_password* (registered by signup)
    * in case of login using social accounts, `usename` and `password` field should be like the following.
     `username`: 'twitter', 'facebook', 'google', 'yahoo', 'linkedin', 'github' (social account provider's name) 
     `password`: *access_token* (issued by backend server `social-oauth2-provider`)
  - Client Credentials Grant: http://tools.ietf.org/html/rfc6749#section-4.4.2 
- response
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.4
  - Resource Owner Password Credentials Grant: http://tools.ietf.org/html/rfc6749#section-4.3.3
  - Client Credentials Grant: http://tools.ietf.org/html/rfc6749#section-4.4.3 

Rresponse body is like the follwoing.
``` javascript
    {
        "access_token": "91aQZKpvcWcc3i18YBw69Kh8hVkMTztjJJccZQfQksOXgDzU1QShXjccYjPQLDGM9kbXmqYMFxqNJErm9iBGfWlzbdFgvkJwCtGdPiK4RDpU0t0VNNbJ9YtdiWKPAgH4PPx4dAKsJ6mWoNbLjOdP6W0gUif9hSH4W2X5eRz8DXmAGGi4exwt8Zs6khMZ6DDGRcX0qULyg4vc2OaqLMHgNtC1DNzxCHSvyr66Vd3Wb9oYk6CeFjPDlxsGfJI7usmI",
        "refresh_token": "E7CqMqFnGuGd1qJ9KsyIu5csd2sZau1ToQms0e45ZdtggfMOXYzrbaCVQDK6npBfBQXOMjJC3Fs8BkS3kpYHnV8XKFNzHw099wYRBKZA7nHle3CDmzzXCdVbEkskekAktnWPSNJsj6ZeY0dOYKB4sFzo1hRpGdlnPN6XlCXmQIPcyxrtdhjC4Vb5PbVZDY4vhlpOOfkIC0p4mT6kYAJG9WETgVKex5JbejpLd4x1Jq8SW2zaPtdHY8laWyTN36MP",
        "expired_in": 60,
        "token_type": "Bearer"
    }
```
## REST API Usage for access of resources
### /api/profile/:id
- description: request profile data of user 
  `:id` means identifier of registered user of `social-oauth2-provider`, not user's email.
  fronend can recieve `:id` as response's body like the following.
``` javascript
    {
        id: 536c370794b87a15049813e9 
    }
```
- prerequisites: frontend MUST have access token issued by backend server
- required field in http request:
   `Authorization` header field filled with `Bearer <access_token>` 
``` javascript
    GET /api/profile/536c370794b87a15049813e9 HTTP/1.1
    Host: ec2-54-199-141-31.ap-northeast-1.compute.amazonaws.com:3443
    Authorization: Bearer w9QWRQZIW8RiRtGEuYBC3J6RfbGv3Mg54Vi9vSUmL6LVMSitgBarGy9dQjG3HrsQ3KD1HwFkHcRRj4xE0QTDcsA3fhWAk8q00E4yzzoQnB9fkQ73PU7tn3FmMcKyvvu43K245SRfdIEckXIeEDvqMdO7V9VF3ScMMOA24HyrYr3UxtkWiVoGCtb7aOEHRT0hUmBKBYbxWNLpEWKoHjPEPXaOBs7204ItaMZAFXEO8JosM4hNu51CdPpmOaN5CzVL
    Cache-Control: no-cache
    Content-Type: application/x-www-form-urlencoded
```
- response body includes profile of requested user id
``` javascript
    {
        "_id": "536c370794b87a15049813e9",
        "__v": 0,
        "local": {
            "password": "$2a$08$3qtatVznZEvQPvnARcA.du9uXYkT00Y7SXNIdC7TdkL/KT0VuoKH.",
            "email": "vinebrancho@gmail.com"
        }
    }
```

## Credits

  - [Vine Brancho](http://github.com/vinebrancho)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Vine Brancho <[http://vinebrancho.wordpress.com/](http://vinebrancho.wordpress.com/)>
