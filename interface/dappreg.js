var dappCall = require('../utils/dappCall');

app.route.post('/findDappsByAddress', async function(req, cb){
    var address = req.query.address;
    var result = await app.model.Issueaddr.findAll({
        condition: {
            address: address
        }
    });
    return result;
})

app.route.post('/mapAddress', async function(req, cb){
    var address = req.query.address;
    var dappid = req.query.dappid;
    var check = await app.model.Issueaddr.exists({
        address: address,
        dappid: dappid
    });
    if(check) return 0;
    app.sdb.create('issueaddr', {
        address: address,
        dappid: dappid
    });
    return 1;
})

app.route.post('/mapUser', async function(req, cb){
    var options = {
        email: req.query.email,
        dappid: req.query.dappid,
        role: req.query.role
    }
    
    var check = await app.model.Mapping.exists(options);
    if(check) return "Already Registered";
    
    app.logger.log("About to create a mapping with options: " + JSON.stringify(options));
    app.sdb.create('mapping', options);
    return "success";
})

// app.route.post('/dappreg', async function (req, res) {

    
//     console.log(JSON.stringify(response)); 
//     if(response && !response.success) {
//         console.log("failed");
//       return response;   
//     }
//     else if(response.success===true){
//     console.log("Entering dapp install");
//     await sleep(5000);
//     var dappid=response.transaction.id;
//     console.log(response.transaction.id);
//     var install_params={
//             id:dappid,
//             master:"ytfACAMegjrK"
//     }

//     var response1 = await dappCall.call('POST', `/api/dapps/install`, install_params);
//     console.log(JSON.stringify(response1));
//     if(response1 && !response1.success) {
//       return response1;        
//     }
//     else{
//         console.log("Entering Dapp launch");
//         await sleep(5000);
//         var response2 = await dappCall.call('POST', `/api/dapps/launch`, install_params);
//       console.log(JSON.stringify(response2)); 
//     if(response2 && !response2.success) {
//         return response2;   
//     }
//     else{
//         var email=req.query.email;
//             app.sdb.create('mapping', {
//                 email:email,
//                 role:"superuser"
//             });
//         console.log("registered");
//         var result={
//             dappid:dappid,
//             response:"registered"
//         }
//     return result;
//     }
// }
//     }
   
// });

module.exports.registerDapp = async function (req, res) {
    console.log("Entering dapp registration");
    app.logger.log("******** Entering dapp registration ********");
    
    function getRandomString() {
        var text = "";
        var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var smalls = "abcdefghijklmnopqrstuvwxyz";
        
        for (var i = 0; i < 4; i++){
            text += caps.charAt(Math.floor(Math.random() * caps.length));
            text += smalls.charAt(Math.floor(Math.random() * smalls.length));
        }
        return text;
    }
    
    var randomText = getRandomString();
    randomText += ".zip";
    
    var link = "http://52.90.71.197/sendzip/" + randomText;
    var dapp_params = {
        secret: req.query.secret,
        category: 1,
        name:req.query.name,
        description: req.query.des,
        type: 0,
        link: link,
        icon: "http://o7dyh3w0x.bkt.clouddn.com/hello.png",
        delegates: [
            "8e5178db2bf10555cb57264c88833c48007100748d593570e013c9b15b17004e",
            "fd6df6dc35852ac7edcc081eb5195718e0c77a6ad4f8157eeb78c865fa83efc4",
            "a4818ece5ec06272d4bf8f8a8d161eba008f51db92f27f6510bfac6f4896ebb4",
            "e5633469e17061c089cef1300a7fc45afe4f753d1c36f9248d9666e07be287bb",
            "70ca6ade9a7ad92b9ef16b24388bbce97a3dabc85877bc367626b3d906ae0cb3"
        ],
        unlockDelegates: 3,
        countryCode: "IN"
    };
    console.log(JSON.stringify(dapp_params));
    var response = await dappCall.call('PUT', `/api/dapps`, dapp_params);
    
    if(!response.success) return response;
    
    var email=req.query.email;
    app.sdb.create('mapping', {
        email:email,
        dappid: response.transaction.id,
        role:"superuser"
    });
    return response;
}

module.exports.installDapp = async function (req, res) {
    console.log("Entering dapp install");
    app.logger.log("******* Entering dapp install ********");
    
    var dappid=req.query.id;
    var install_params={
        id:dappid,
        master:"ytfACAMegjrK"
    }
    return await dappCall.call('POST', `/api/dapps/install`, install_params);
}

module.exports.launchDapp = async function (req, res) {
    console.log("Entering dapp launch");
    app.logger.log("******* Entering dapp launch ********");
    
    var dappid=req.query.id;
    var install_params={
        id:dappid,
        master:"ytfACAMegjrK"
    }
    return await dappCall.call('POST', `/api/dapps/launch`, install_params);
}

app.route.post('/registerDApp', module.exports.registerDapp);
app.route.post('/installDApp', module.exports.installDapp);
app.route.post('/launchDApp', module.exports.launchDapp);

app.route.post('/makeDapp', async function(req, cb){

    console.log("Started Dapp Register");
    var dappRegisterResult = await module.exports.registerDapp(req, cb);
    console.log("Dapp register result: " + JSON.stringify(dappRegisterResult));

    if(!dappRegisterResult) return "No response from Dapp registration call";
    if(!dappRegisterResult.success) return dappRegisterResult;

    console.log("Dapp successfully registered");

    console.log("About to do Dapp install");
    var count = 0;
    var installreq = {
        query: {
            id: dappRegisterResult.transaction.id
        }
    }
    do{
        console.log("Install Attempt: " + ++count);
        var dappInstallResult = await module.exports.installDapp(installreq, 0);
        if(count > 10) return {
            isSuccess: false,
            message: "Failed at Installation with error: " + JSON.stringify(dappInstallResult),
            dappid: installreq.query.id
        }
    }while(!dappInstallResult.success);

    console.log("About to launch dapp");
    count = 0;

    do{
        console.log("Launch Attempt: " + ++count);
        var dappLaunchResult = await module.exports.launchDapp(installreq, 0);
        if(count > 10) return {
            isSuccess: false,
            message: "Failed at Launch with error: " + JSON.stringify(dappInstallResult),
            dappid: installreq.query.id
        }
    }while(!dappLaunchResult.success);
    console.log("Finished Dapp launch");
    return {
        isSuccess: true,
        message: "Successfully Installed",
        dappid: installreq.query.id
    }
});

// dappid:"2b06d8d5f5b1184e4c2813a3e3dafe389287012ebc7f690e7d26863ad6ed95be"