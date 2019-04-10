var dappCall = require("../utils/dappCall");

app.route.post('/user/dappid2', async function(req){

    var isNewUser = await app.model.Mapping.exists({
        email: req.query.email
    })
    if(!isNewUser) {
        var saved = await app.model.Newuser.exists({
            email: req.query.email
        });
        if(!saved){
            app.sdb.create('newuser', {
                email: req.query.email,
                timestampp: new Date().getTime()
            });
        }
        return {
            role: 'new user',
            isSuccess: true
        }
    }

    var total = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select mappings.dappid, mappings.role, companys.company, companys.name, companys.assetType from mappings join companys on companys.dappid = mappings.dappid where mappings.email = ? and mappings._deleted_ = 0);`;
        app.sideChainDatabase.get(sql, [req.query.email], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });
    
    var dapps = await new Promise((resolve)=>{
        let sql = `select mappings.dappid, mappings.role, companys.company, companys.name, companys.assetType from mappings join companys on companys.dappid = mappings.dappid where mappings.email = ? and mappings._deleted_ = 0 order by mappings.timestampp desc limit ? offset ?;`;
        app.sideChainDatabase.all(sql, [req.query.email, req.query.limit || 20, req.query.offset || 0], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    for(i in dapps.result){
        var response = await dappCall.call('GET', '/api/dapps/' + dapps.result[i].dappid + '/isLaunched', {});
        dapps.result[i].launched = response.isSuccess;
    }

    return {
        total: total.result.count,
        dapps: dapps.result
    }
});

app.route.post('/user/getDappsByAddress2', async function(req){

    var total = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select issueaddrs.dappid, companys.company, companys.assetType from issueaddrs join companys on companys.dappid = issueaddrs.dappid where issueaddrs.address = ? and issueaddrs.deleted = '0');`;
        app.sideChainDatabase.get(sql, [req.query.address], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });
    
    var dapps = await new Promise((resolve)=>{
        let sql = `select issueaddrs.dappid, companys.company, companys.assetType from issueaddrs join companys on companys.dappid = issueaddrs.dappid where issueaddrs.address = ? and issueaddrs.deleted = '0' order by issueaddrs.timestampp desc limit ? offset ?;`;
        app.sideChainDatabase.all(sql, [req.query.address, req.query.limit || 20, req.query.offset || 0], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    return {
        total: total.result.count,
        dapps: dapps.result
    }
});

app.route.post('/allAssetTypes', async function(req) {
    var total = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select distinct companys.assetType from companys);`;
        app.sideChainDatabase.get(sql, [], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });
    
    var dapps = await new Promise((resolve)=>{
        let sql = `select distinct companys.assetType from companys limit ? offset ?;`;
        app.sideChainDatabase.all(sql, [req.query.limit || 20, req.query.offset || 0], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    var types = [];

    for(i in dapps.result){
        types.push(dapps.result[i].assetType);
    }

    return {
        total: total.result.count,
        dapps: types
    }
})

app.route.post('/user/assetType/dapps', async function(req) {
    if(!(req.query.assetType && req.query.address)) return {
        isSuccess: false,
        message: "AssetType or address missing"
    }
    var total = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (select issueaddrs.dappid from issueaddrs join companys on companys.dappid = issueaddrs.dappid and companys.assetType = ? where issueaddrs.address = ?);`;
        app.sideChainDatabase.get(sql, [req.query.assetType, req.query.address], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });
    
    var dapps = await new Promise((resolve)=>{
        let sql = `select issueaddrs.dappid from issueaddrs join companys on companys.dappid = issueaddrs.dappid and companys.assetType = ? where issueaddrs.address = ? order by issueaddrs.timestampp desc limit ? offset ?;`;
        app.sideChainDatabase.all(sql, [req.query.assetType, req.query.address, req.query.limit || 20, req.query.offset || 0], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    var dappArray = [];
    for(i in dapps.result){
        dappArray.push(dapps.result[i].dappid);
    }

    return {
        total: total.result.count,
        dapps: dappArray
    }
})

app.route.post('/address/assetType/dapps', async function(req){
    var condition = `select issueaddrs.dappid, companys.company, companys.name as dappName, companys.assetType from issueaddrs join companys on companys.dappid = issueaddrs.dappid where issueaddrs.deleted = '0'`;
    if(!(req.query.address || req.query.assetType)) return {
        isSuccess: false,
        message: "Please provide address or assetType or both"
    }
    var input = [];
    if(req.query.address){
        condition += ` and issueaddrs.address = ?`;
        input.push(req.query.address);
    }
    if(req.query.assetType){
        condition += ` and companys.assetType = ?`;
        input.push(req.query.assetType);
    }

    var total = await new Promise((resolve)=>{
        let sql = `select count(*) as count from (${condition});`;
        app.sideChainDatabase.get(sql, input, (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    input.push(req.query.limit || 20, req.query.offset || 0);

    var dapps = await new Promise((resolve)=>{
        let sql = `${condition} order by issueaddrs.timestampp desc limit ? offset ?;`;
        app.sideChainDatabase.all(sql, input, (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    return {
        total: total.result.count,
        dapps: dapps.result
    }
})

app.route.post('/getlist', async function(req){
    var dapps = await new Promise((resolve)=>{
        let sql = `select companys.country, companys.assetType, companys.name as dappName from companys;`;
        app.sideChainDatabase.all(sql, [], (err, row)=>{
            if(err) resolve({
                isSuccess: false,
                message: JSON.stringify(err),
                result: {}
            });
            resolve({
                isSuccess: true,
                result: row
            });
        });
    });

    if(!dapps.isSuccess) return dapps;

    return {
        dapps: dapps.result
    }
})