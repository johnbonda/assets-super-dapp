var SwaggerCall = require('../utils/SwaggerCall.js');
var hlCall=require('../utils/hlCall');
var headerCall=require('../utils/headerCall');
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
        totp:req.query.totp
    };
    var result=await app.model.Mapping.exists({email:params.email});
    if(!result){
        app.sdb.create('mapping', {
            email:params.email
        });
        console.log("added");
    }
    var response = await SwaggerCall.call('POST', `/api/v1/login`, params);//staging api
    return response;
});

app.route.post('/user/hllogin',async function(req,cb){
var params={
    secret:req.query.secret  
};
var token=req.query.token;
var response= await hlCall.call('POST',`/api/v1/hyperledger/login`,token,params);
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
});
app.route.post('/user/wallet',async function(req,cb){
    var token=req.query.token
    var result=await headerCall.call('GET',`/api/v1/wallets`,token);
    return result;
});
app.route.post('/user/balance',async function(req,cb){
   var params={
    address:req.query.address
   }
 var token=req.query.belriumtoken;
   var response=await hlCall.call('POST',`/api/v1/balance`,token,params);
   return response;
});
app.route.post('/user/kycstatus',async function(req,cb){
    var belriumtoken = req.query.belriumtoken;
    var response=await headerCall.call('GET',`/api/v1/user/countries/kyc`,belriumtoken);
    return response;
});


