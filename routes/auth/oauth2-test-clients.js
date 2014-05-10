var OauthClient = require(__appbase_dirname + '/models/model-oauthclient');
var predefine = require('./predefine');

// set test clients information
var trustedClientInfo = {
    name: 'Smart_Social_Logins_App',
    grantType: [
        predefine.oauth2.type.password.name,
        predefine.oauth2.type.password.token_refreshable
    ]
};
var thirdPartyClientInfo = {
    name: 'Third_Party_Dummy_App',
    grantType: [
        predefine.oauth2.type.authorizationCode.name,
        predefine.oauth2.type.authorizationCode.token_refreshable
    ],
    redirectURI: 'https://<your_3rd_party_backend_server>/callback'
};
var thirdPartyClient2Info = {
    name: 'Third_Party_Dummy_App2',
    grantType: [
        predefine.oauth2.type.clientCredentials.name,
        predefine.oauth2.type.clientCredentials.token_refreshable
    ]
};

// This is helpful for a develper to validate oauth2 flow using postman of chrome browser
// The developer can fill this return value into 'Authorization' field of request headera for client credentials
var encodeClientCredentials = function (clientId, clientSecret) {
    var credentials = new Buffer(
            clientId + ':' + clientSecret
        ).toString('base64'); 
    return credentials;
}

var printClientInfo = function (client, description) {
    console.log('-------------------------------------------');
    console.log('description: ' + description);
    console.log('client name: ' + client.name);
    console.log('grant type: ' + client.grantType);
    console.log('client id: ' + client.clientId);
    console.log('client secret: ' + client.clientSecret);
    console.log('redirect uri: ' + client.redirectURI);
    console.log('based64 credentials: ' + 
            encodeClientCredentials(
                client.clientId,
                client.clientSecret
    ));
}

module.exports = function () {
    // Add trust client (1st app) as 'password' grant type
    OauthClient.findOne({
        'name': trustedClientInfo.name
    }, function (err, trustedClient) {
        if (err) {
            throw new Error();
        }
        if (trustedClient === null) {
            trustedClient = new OauthClient();
            trustedClient.name = trustedClientInfo.name;
            trustedClient.grantType = trustedClientInfo.grantType;
            trustedClient.save(function (err) {
                if (err) {
                    return new Error();
                }
                printClientInfo(trustedClient, 'trusted app is newly registered');
            });
        } else {
            printClientInfo(trustedClient, 'trusted app is already registered!');
        }
    });

    // Add 3rd party App just for test 'authroization_code' type  
    // It's better to register 3rd party app using website like twitter, facebook 
    OauthClient.findOne({
        'name': thirdPartyClientInfo.name
    }, function (err, thirdPartyClient) {
        if (err) {
            throw new Error();
        }
        if (thirdPartyClient === null) {
            thirdPartyClient  = new OauthClient();
            thirdPartyClient.name = thirdPartyClientInfo.name;
            thirdPartyClient.redirectURI = thirdPartyClientInfo.redirectURI;
            thirdPartyClient.grantType = thirdPartyClientInfo.grantType;
            thirdPartyClient.save(function (err) {
                if (err) {
                    return new Error();
                }
                printClientInfo(thirdPartyClient, '3rd party app is newly registered');
            });
        } else {
            printClientInfo(thirdPartyClient, '3rd party app is already registered!');
        }
    });

    // Add 3rd party App just for test 'client_credentials' type  
    // this type is used to get resources accessible without user authentication
    // so this type doen't need user credentials
    OauthClient.findOne({
        'name': thirdPartyClient2Info.name
    }, function (err, thirdPartyClient) {
        if (err) {
            throw new Error();
        }
        if (thirdPartyClient === null) {
            thirdPartyClient  = new OauthClient();
            thirdPartyClient.name = thirdPartyClient2Info.name;
            thirdPartyClient.grantType = thirdPartyClient2Info.grantType;
            thirdPartyClient.save(function (err) {
                if (err) {
                    return new Error();
                }
                printClientInfo(thirdPartyClient, '3rd party app(client_credential) is newly registered');
            });
        } else {
            printClientInfo(thirdPartyClient, '3rd party app(client_credential) is already registered!');
        }
    });
};
