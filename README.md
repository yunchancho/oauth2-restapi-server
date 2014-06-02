oauth2-restapi-server
=============

## Introduction
`oauth2-restapi-server` consists of oauth2 provider and api provider. As oauth2 provider, it provides issuing, validating and destroying oauth2 based token. As api provider, it provides responding to RESTful API requests from its clients. Every RESTful APIs are requested with access token issued by this oauth2 provider. `oauth2-restapi-server` provides its client as 1st party app with signup and login features using social accounts, so that the client can access resources of this api provider with an access token issued by this oauth2 provider. Additionally `oauth2-restapi-server` provides also signup and login features for local account. So 1st party app can access some resources using access token like case of social accounts. `oauth2-restapi-server` works on [node.js](http://nodejs.org) with [passport](http://github.com/jaredhanson/passport) and [oauth2orize](http://github.com/jaredhanson/oauth2orize). This repository also provides 1st party app(frontend) based on [angular.js](http://angularjs.org). You would understand `oauth2-restapi-server` using this 1st party app. `oauth2-restapi-server` supports for an user to signup using the following social accounts. Once a client gets an access token using social accounts or local account, so that it can call REST apis with the access token to access some resources like user profile.

 - Twitter (OAuth1.0A), Facebook (OAuth2), Google+ (OAuth2), Yahoo! (OAuth2), LinkedIn (OAuth2), GitHub (OAuth2)

## Features
`oauth2-restapi-server` provides the followings
  - Access token for 1st party app and 3rd party apps  
    1st party app (default frontend of `oauth2-restapi-server`) doesn't need to exchange specific code with its backend server to get access token,
    because it can recieve user credentials from its users. So access token for 1st party app is issued using Resource Owner Password Credentials Grant 
    And to let 3rd party apps use some REST API of our `oauth2-restapi-server`, you should provide specific way to 3rd party developers to register their apps for that.
    Generally, API providers use their website for registeration of 3rd party app.
    Backend server of `oauth2-restapi-server` simply registers one default app per each grant type, as well as 'resource owner password' for 1st party app.
    You can test some flow of oauth2 specification using that apps
    - '[Resource Owner Password Credentials Grant](http://tools.ietf.org/html/rfc6749#page-37)' for 1st party app (`oauth2-restapi-server` frontend)
    - '[Authorization Code Grant](http://tools.ietf.org/html/rfc6749#page-24)' for 3rd party app
    - '[Implicit Grant](http://tools.ietf.org/html/rfc6749#page-31)' for 3rd party app
    - '[Client Credentials Grant](http://tools.ietf.org/html/rfc6749#page-40)' for 3rd party app
  - REST API to get access token from backend server 
    - /oauth2/authorize
    - /oauth2/authorize/decision
    - /oauth2/authorize/callback (Just for test of authorization code grant and implicit grant)
    - /oauth2/token
  - REST API to get resource. frontends surely should pass access token in request header(`Authorization: Bearer <access_token>`). 
    - /api/profile/:id (`:id` means identifier of registered user of `oauth2-restapi-server`, not user's email)
  - TLS(HTTPS) based communication 
    - every data from frontends are passed securly using https protocol.
    - even if http url is requested to backend server, the request is redirected as https url.
      http://<server_domain>/auth/login --> https://<server_domain>/auth/login
    - `oauth2-restapi-server` uses self signed certificates for TLS. But you can replace them to ones isseud by public CA.
  - (TODO) Access Control based on `scope` of OAuth2
    - if node.js backend uses `scope` on validation of requests with access token by frontends, 
      it can provide access control mechanism for protecting its resource from improper request.
      Currently, backend server of `oauth2-restapi-server` permits all resources if the request includes valid access token.

1st party app as frontend provides the followings
  - views rendering dynamically and interacting with users
  - Single page web app. That is, all pages are aren't refreshed because angluar.js get them using ajax
  - Interaction with users using login/signup/profile views for social accounts and local account
  - Page routing using `$route` angular.js service
  - Call to REST API to get resources of backend resource using `$resource` angluar.js service
  - Error Handling `401`(http authentication status) and recovering it
  - Oauth based authentications of social accounts using new window to avoid CORS problem due to ajax
  - Bower script to maintian js libraries like angluar.js, bootstrap, fontawesome
  - Request REST API to node server with access token given by OAuth2 authorization
  - (TODO) applyig twitter's bootstrap fully to views

## Install
prerequisites are the followings :

 - clone `oauth2-restapi-server` repo into your local machine

    $ git clone git@github.com:vinebrancho/oauth2-restapi-server.git

 - install mongodb into your local machine

And then, You can install `oauth2-restapi-server` using the following.

    $ npm install
  
## Usage
You can run node server with `oauth2-restapi-server` just using the following.

    $ npm start

And the, you can see Login UI of `oauth2-restapi-server` on your web browser by connecting to your node server url

    http://<your_server_url>/
    
In order to login or connect with accouts of social networks, you **must** change the `api_server/oauth-info.js`. The file includes application id, secret and redirect url registered on social network provider for oauth authentication. To get application id (or key), register your application on each social networks. After that, you can replace id, secret and redirect url of the file to your own ones. The following is example for twitter oauth setting
    
``` javascript
    ...
    'twitter' : {
        'consumerKey' : 'WEV2Mz2xQPSfDsAYkHbgiVrrE',
        'consumerSecret' : 'ok17qE4dzwzygUOQRzLDlODo63UVDGHigqszTmpjr5LEF0UC1p',
        'callbackURL' : 'https://<your_server_url>/auth/login/twitter/callback'
    },
    ...
```

By this way, after replacing all default social networks to your own ones, your application can login or connect with all social networks. 

## API Usage for authentication and authorization regarding OAuth2
Currently `oauth2-restapi-server` doesn't use `scope` and `state` fields of OAuth2 spec (even if they are useful)
every fields speicified as `REQUIRED` are requested or response in http header or body.
Please refer OAuth2 specification about that.

### /oauth2/authorize (GET)
- description: request authorization of 3rd party app
- prerequisites: frontend MUST be logined using user's credetial
- required field in http request: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.1 
  - Implicit Grant: http://tools.ietf.org/html/rfc6749#section-4.2.1
- response: html page for user to grant `oauth2-restapi-server` app

### /oauth2/authorize/decision (POST)
- description: pass user's grant (allow or deny). This API is called from html page recieved due to /auth/authorize
- required field in http request: transaction_id, allow (or deny) field
- response: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.2 
  - Implicit Grant: http://tools.ietf.org/html/rfc6749#section-4.2.2

### /oauth2/token (POST)
- description: request issuing access token.  
- required field in http request: 
  - Authorization Code Grant: http://tools.ietf.org/html/rfc6749#section-4.1.3
  - Resource Owner Password Credentials Grant: http://tools.ietf.org/html/rfc6749#section-4.3.2
    * in case of login using local account, `usename` and `password` field should be like the following.
     `username`: *user_email* (registered by signup)
     `password`: *user_password* (registered by signup)
    * in case of login using social accounts, `usename` and `password` field should be like the following.
     `username`: 'twitter', 'facebook', 'google', 'yahoo', 'linkedin', 'github' (social account provider's name) 
     `password`: *access_token* (issued by backend server `oauth2-restapi-server`)
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

## API Usage for login signup regarding local account 
These would be only used by 1st party app or authorization page
### /auth/login (POST)
This would be only used by authorization page for oauth2 
### /auth/logout (GET)
This would be only used by authorization page for oauth2 
### /auth/login/:socialapp (GET)
This would be used by 1st party app
### /auth/signup (POST)
This would be used by 1st party app

## REST API Usage for 1st party app with access token
These would be only used by 1st party app authorized with 'Resource Owner Password' grant type
Later, use of REST API will be limited by 'scope' of issued access token.
### /api/profile (GET)
- description: request profile data of user 
- prerequisites: frontend MUST have access token issued by backend server
- required field in http request:
   `Authorization` header field filled with `Bearer <access_token>` 
``` javascript
    GET /api/profile HTTP/1.1
    Host: ec2-54-199-141-31.ap-northeast-1.compute.amazonaws.com:3443
    Authorization: Bearer 91aQZKpvcWcc3i18YBw69Kh8hVkMTztjJJccZQfQksOXgDzU1QShXjccYjPQLDGM9kbXmqYMFxqNJErm9iBGfWlzbdFgvkJwCtGdPiK4RDpU0t0VNNbJ9YtdiWKPAgH4PPx4dAKsJ6mWoNbLjOdP6W0gUif9hSH4W2X5eRz8DXmAGGi4exwt8Zs6khMZ6DDGRcX0qULyg4vc2OaqLMHgNtC1DNzxCHSvyr66Vd3Wb9oYk6CeFjPDlxsGfJI7usmI
    Cache-Control: no-cache
    Content-Type: application/x-www-form-urlencoded
```
- response body includes profile of requested user
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
### /api/session (GET)
### /api/connect/local (GET)
### /api/disconnect/local (GET)
### /api/connect/:socialapp (GET)
### /api/disconnect/:socialapp (GET)

## REST API Usage for 3rd party app with access token
Clients MUST set 'Authorization' http header field with its access token

### /api/wish (GET)
- description: getting full list of requsting user as json array
- response body includes profile of requested user
``` javascript
    [
    {
        "modifiedTime": 1401708727148,
        "createdTime": 1401708727148,
        "content": "hello, I am yunchan. (modified version)",
        "userId": "53892ee09d562cf45ad31e56",
        "_id": "538c60b7f3eac30f6a3fa146",
        "__v": 0
    },
    {
        "modifiedTime": 1401708763182,
        "createdTime": 1401708763182,
        "content": "I want to go Hawaii again",
        "userId": "53892ee09d562cf45ad31e56",
        "_id": "538c60dbf3eac30f6a3fa148",
        "__v": 0
    }
    ]
```

### /api/wish/:id (GET)
- description: getting only one of `:id` among wishlist of requsting user
- response body includes profile of requested user
``` javascript
    {
        "modifiedTime": 1401708727148,
        "createdTime": 1401708727148,
        "content": "hello, I am yunchan. (modified version)",
        "userId": "53892ee09d562cf45ad31e56",
        "_id": "538c60b7f3eac30f6a3fa146",
        "__v": 0
    }
```

### /api/wish (POST)
- description: creating new wish of requesting user
- if request is successful, http status 200 is sent

### /api/wish/:id (PUT)
- description: updating exisiting a wishlist of requesting user
- `:id` means existing wish's identifier created by server
- required field in http request: 
  - `content`: string of wish that client wants to create newly
- if request is successful, http status 200 is sent

### /api/wish/:id (DELETE)
- description: removing existing a wishlist of requesting user
- `:id` means existing wish's identifier created by server
- if request is successful, http status 200 is sent

## Frontends for test these APIs
Currently two frontends are available.

### Browser based web app
This web app consists html/js/css files, and is made using angular.js and bootstrap
https://github.com/vinebrancho/oauth2-restapi-server/tree/master/public

### Native app (or Hybrid app)
This native app is made using cordova, which is native wapper framework for creating hybrid app.
So this app basically has almost same source code with browser based web app above (html, js, css)
https://github.com/vinebrancho/cordova-angular-frontend-sample

## Credits

  - [Vine Brancho](http://github.com/vinebrancho)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Vine Brancho <[http://vinebrancho.wordpress.com/](http://vinebrancho.wordpress.com/)>
