var dappCall = require('../utils/dappCall');
app.route.post('/dappreg', async function (req, res) {
    var dapp_params = {
        secret: req.query.secret,
        category: 1,
        name:req.query.name,
        description: req.query.des,
        type: 0,
        link: "https://github.com/johnbonda/domain_dapp/archive/master.zip",
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
    var response =await dappCall.call('PUT', `/api/dapps`, dapp_params);
    console.log(JSON.stringify(response)); 
    if(response && !response.success) {
        console.log("failed");
      return response;   
    }
    else if(response.success===true){
    var dappid=response.transaction.id;
    console.log(response.transaction.id);
    var install_params={
            id:dappid,
            master:"ytfACAMegjrK"
    }

    var response1 = await dappCall.call('POST', `/api/dapps/install`, install_params);
    console.log(JSON.stringify(response1));
    if(response1 && !response1.success) {
      return response1;        
    }
    else{
        var response2 = await dappCall.call('POST', `/api/dapps/launch`, install_params);
      console.log(JSON.stringify(response2)); 
    if(response2 && !response2.success) {
        return response2;   
    }
    else{
        console.log("registered");
    return "registered";
    }
}
    }
   
});


// dappid:"2b06d8d5f5b1184e4c2813a3e3dafe389287012ebc7f690e7d26863ad6ed95be"