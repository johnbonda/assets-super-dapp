var SwaggerCall = require('../utils/SwaggerCall.js');
app.route.post('/user/exists',async function(req,cb){
   var params={
        email:req.query.email
   }
   var result=await app.model.Mapping.exists(params);
   if(!result){
        var response = await SwaggerCall.call('GET', '/api/v1/user/exist?email=' + params.email, params);  //staging api
        if(response && !response.success){
             return "-1";
        }
        else {
            return "00";
        }
    }
    return "0";
});
app.route.post('/user/login', async function (req, cb) {
    var params = {
        email: req.query.email,
        password: req.query.password,
        totp:totp
    };
    var response = await SwaggerCall.call('POST', `/api/v1/login`, params);//staging api
    return response;
});

app.route.post('/user/kyclogin',async function(req,cb){
var params={
    secret:req.query.secret  
};
var token=req.query.token;
var response= await SwaggerCall.call('POST',`/api/v1/hyperledger/login)`,token,params,);
return response;
});

app.route.post('/user/dappid',async function(req,cb){
        var result = await app.model.Mapping.findOne({
            condition: {
                email:req.query.email
            },
            fields: ['dappid', 'role']
        });
        if(!result){
            return "invalid email";
        }
        return result;
})